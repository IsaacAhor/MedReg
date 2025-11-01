import { NextRequest, NextResponse } from 'next/server';
import { validateGhanaCard } from '@/lib/validators/ghana-card';

// TODO: Replace with your actual OpenMRS credentials
const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';

// Base64 encode credentials for Basic Auth
const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;

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

    // TODO: Check for duplicate Ghana Card
    // For now, proceed with creation

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
          stateProvince: regionCode || '',
          country: 'Ghana',
          preferred: true,
        },
      ],
      attributes: nhisNumber
        ? [
            {
              attributeType: 'f56fc097-e14e-4be6-9632-89ca66127784', // NHIS Number (verified by Codex)
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

    // Create patient from person
    // Note: OpenMRS ID no longer required (Codex set Ghana Card as required instead)
    // OpenMRS will auto-generate OpenMRS ID if needed via Auto Generation Option
    const patientPayload = {
      person: person.uuid,
      identifiers: [
        {
          identifier: ghanaCard,
          identifierType: 'd3132375-e07a-40f6-8912-384c021ed350', // Ghana Card (required)
          location: 'aff27d58-a15c-49a6-9beb-d30dcfc0c66e', // Amani Hospital
          preferred: true,
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

    // TODO: Generate folder number
    // TODO: Submit to NHIE

    return NextResponse.json({
      success: true,
      patient: {
        uuid: patient.uuid,
        ghanaCard: ghanaCard.replace(/(\d{4})\d{4}/, '$1****'), // Mask middle digits
        folderNumber: 'GA-KBTH-2025-000001', // TODO: Generate actual folder number
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
