import { NextRequest, NextResponse } from 'next/server';
import { validateGhanaCard } from '@/lib/validators/ghana-card';
import { generateFolderNumber, type GhanaRegionCode } from '@/lib/services/folder-number';

// OpenMRS connection config
const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';

// Base64 encode credentials for Basic Auth
const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;
// Derive OpenMRS web root (strip /ws/rest/v1) for module endpoints
const OPENMRS_ROOT_URL = OPENMRS_BASE_URL.replace(/\/ws\/rest\/v1\/?$/, '');

/**
 * HARDCODED UUIDs - Ghana Metadata
 * These were created via Codex MCP during initial setup (Nov 1, 2025)
 * If setting up on a fresh OpenMRS instance, use Codex MCP to create metadata
 * and update these UUIDs accordingly.
 * 
 * See: docs/setup/week1-setup-guide.md for verification instructions
 */
const GHANA_CARD_IDENTIFIER_TYPE_UUID = 'd3132375-e07a-40f6-8912-384c021ed350'; // Ghana Card (required)
const NHIS_ATTRIBUTE_TYPE_UUID = 'f56fc097-e14e-4be6-9632-89ca66127784';        // NHIS Number
const AMANI_HOSPITAL_LOCATION_UUID = 'aff27d58-a15c-49a6-9beb-d30dcfc0c66e';    // Amani Hospital
const FOLDER_NUMBER_IDENTIFIER_TYPE_UUID = 'c907a639-0890-4885-88f5-9314a55e263e'; // Folder Number

// TODO: Move UUIDs to environment variables or fetch dynamically via OpenMRS REST API

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract form data
    const {
      ghanaCard,
      nhisNumber,
      givenName,
      familyName,
      middleName,
      dateOfBirth,
      gender,
      phone,
      regionCode,
      facilityCode,
      city,
      address,
    } = body;

    // Validate Ghana Card with Luhn checksum
    const validation = validateGhanaCard(ghanaCard);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Duplicate check: search patient by Ghana Card identifier
    try {
      const dupRes = await fetch(
        `${OPENMRS_BASE_URL}/patient?identifier=${encodeURIComponent(ghanaCard)}`,
        {
          method: 'GET',
          headers: { Authorization: authHeader, Accept: 'application/json' },
        }
      );
      if (dupRes.ok) {
        const data = await dupRes.json();
        if (Array.isArray(data?.results) && data.results.length > 0) {
          return NextResponse.json(
            { error: 'Ghana Card already registered', code: 'DUPLICATE_GHANA_CARD' },
            { status: 409 }
          );
        }
      } else {
        console.warn('Duplicate check failed', dupRes.status, await dupRes.text());
      }
    } catch (e) {
      console.warn('Duplicate check error', e);
    }

    // Effective codes for folder number generation
    const effectiveRegionCode = (regionCode || 'GA').toUpperCase();
    const effectiveFacilityCode = (facilityCode || 'KBTH').toUpperCase();

    // Create OpenMRS Person first
    const personPayload = {
      names: [
        {
          givenName,
          middleName,
          familyName,
          preferred: true,
        },
      ],
      gender, // Form already sends "M", "F", or "O"
      birthdate: dateOfBirth,
      addresses: [
        {
          address1: address || '',
          cityVillage: city || '',
          stateProvince: effectiveRegionCode || '',
          country: 'Ghana',
          preferred: true,
        },
      ],
      attributes: nhisNumber
        ? [
            {
              attributeType: NHIS_ATTRIBUTE_TYPE_UUID,
              value: nhisNumber,
            },
          ]
        : [],
    };

    // Create person via OpenMRS REST API
    const personResponse = await fetch(`${OPENMRS_BASE_URL}/person`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(personPayload),
    });

    if (!personResponse.ok) {
      const error = await personResponse.text();
      console.error('OpenMRS Error Response:', {
        status: personResponse.status,
        statusText: personResponse.statusText,
        body: error,
        payload: personPayload,
      });
      return NextResponse.json(
        { error: 'Failed to create person in OpenMRS', details: error },
        { status: personResponse.status }
      );
    }

    const person = await personResponse.json();

    // Generate folder number using service
    const folderNumber = await generateFolderNumber(
      effectiveRegionCode as GhanaRegionCode,
      effectiveFacilityCode,
      {
        openmrsBaseUrl: OPENMRS_BASE_URL,
        openmrsRootUrl: OPENMRS_ROOT_URL,
        authHeader,
      }
    );

    // Create patient from person
    const patientPayload = {
      person: person.uuid,
      identifiers: [
        {
          identifier: ghanaCard,
          identifierType: GHANA_CARD_IDENTIFIER_TYPE_UUID,
          location: AMANI_HOSPITAL_LOCATION_UUID,
          preferred: true,
        },
        {
          identifier: folderNumber,
          identifierType: FOLDER_NUMBER_IDENTIFIER_TYPE_UUID,
          location: AMANI_HOSPITAL_LOCATION_UUID,
          preferred: false,
        },
      ],
    };

    const patientResponse = await fetch(`${OPENMRS_BASE_URL}/patient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(patientPayload),
    });

    if (!patientResponse.ok) {
      const error = await patientResponse.text();
      console.error('Failed to create patient:', error);
      return NextResponse.json(
        { error: 'Failed to create patient in OpenMRS', details: error },
        { status: patientResponse.status }
      );
    }

    const patient = await patientResponse.json();

    // TODO: Submit to NHIE (via middleware only)

    return NextResponse.json({
      success: true,
      patient: {
        uuid: patient.uuid,
        ghanaCard: ghanaCard.replace(/(\d{4})\d{4}/, '$1****'), // Mask middle digits
        folderNumber,
      },
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
