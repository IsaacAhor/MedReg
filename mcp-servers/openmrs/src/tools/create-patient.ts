/**
 * Create Patient MCP Tool
 * 
 * Allows AI to create new patients in OpenMRS with automatic Ghana validation
 * - Validates Ghana Card format + Luhn checksum
 * - Validates NHIS number (optional)
 * - Auto-generates folder number
 * - Masks PII in responses
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client';
import { 
  validateGhanaCard, 
  validateNHIS,
  GhanaCardValidationResult,
  NHISValidationResult 
} from '../validators';

// Inline PII masking (from shared)
function maskPII(text: string): string {
  return text
    .replace(/(GHA-\d{4})\d{5}-\d/g, '$1****-*')
    .replace(/(\d{4})\d{6}/g, '$1****');
}

/**
 * Zod schema for create_patient input
 */
export const CreatePatientSchema = z.object({
  ghanaCard: z.string()
    .min(15, 'Ghana Card required (GHA-XXXXXXXXX-X)')
    .describe('Ghana Card number (format: GHA-XXXXXXXXX-X)'),
  
  nhisNumber: z.string()
    .optional()
    .describe('NHIS number (10 digits, optional)'),
  
  givenName: z.string()
    .min(2, 'Given name required (minimum 2 characters)')
    .describe('Patient given name (first name)'),
  
  middleName: z.string()
    .optional()
    .describe('Patient middle name (optional)'),
  
  familyName: z.string()
    .min(2, 'Family name required (minimum 2 characters)')
    .describe('Patient family name (last name)'),
  
  gender: z.enum(['M', 'F', 'O', 'U'])
    .describe('Gender: M (male), F (female), O (other), U (unknown)'),
  
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD format')
    .describe('Date of birth (YYYY-MM-DD format)'),
  
  phone: z.string()
    .regex(/^\+233\d{9}$/, 'Phone must be Ghana format (+233XXXXXXXXX)')
    .optional()
    .describe('Phone number (Ghana format: +233XXXXXXXXX)'),
  
  address: z.string()
    .optional()
    .describe('Home address (street, area, city)'),
  
  region: z.string()
    .optional()
    .describe('Ghana region (e.g., Greater Accra, Ashanti)')
});

export type CreatePatientInput = z.infer<typeof CreatePatientSchema>;

export interface CreatePatientResult {
  success: boolean;
  patient?: {
    uuid: string;
    ghanaCard: string;
    folderNumber: string;
    display: string;
  };
  validationErrors?: string[];
  error?: string;
}

/**
 * Generate folder number: {REGION}-{FACILITY}-{YEAR}-{SEQUENCE}
 * Example: GA-KBTH-2025-000123
 */
async function generateFolderNumber(
  client: OpenMRSClient,
  facilityCode: string,
  regionCode: string
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${regionCode}-${facilityCode}-${year}`;
  
  // Query last sequence for this prefix
  // For MVP, we'll use a simple approach: search all patients with this prefix
  // and increment. In production, use database sequence.
  try {
    const patients = await client.searchPatients(prefix);
    
    // Extract sequence numbers from folder numbers
    const sequences = patients
      .map(p => {
        const folderNumber = p.identifiers?.find((id: any) => 
          id.identifier?.startsWith(prefix)
        )?.identifier;
        
        if (folderNumber) {
          const match = folderNumber.match(/-(\d{6})$/);
          return match ? parseInt(match[1]) : 0;
        }
        return 0;
      })
      .filter(seq => seq > 0);
    
    const lastSequence = sequences.length > 0 ? Math.max(...sequences) : 0;
    const nextSequence = lastSequence + 1;
    
    return `${prefix}-${String(nextSequence).padStart(6, '0')}`;
  } catch (error) {
    // If query fails, start from 1
    return `${prefix}-000001`;
  }
}

/**
 * Create patient in OpenMRS with Ghana validation
 */
export async function createPatient(
  input: CreatePatientInput,
  client: OpenMRSClient
): Promise<CreatePatientResult> {
  const validationErrors: string[] = [];

  // 1. Validate Ghana Card
  const ghanaCardResult: GhanaCardValidationResult = validateGhanaCard(input.ghanaCard);
  if (!ghanaCardResult.valid) {
    validationErrors.push(`Ghana Card: ${ghanaCardResult.error}`);
  }

  // 2. Validate NHIS (if provided)
  let validatedNHIS: string | undefined;
  if (input.nhisNumber) {
    const nhisResult: NHISValidationResult = validateNHIS(input.nhisNumber);
    if (!nhisResult.valid) {
      validationErrors.push(`NHIS: ${nhisResult.error}`);
    } else {
      validatedNHIS = nhisResult.formatted;
    }
  }

  // 3. Validate date of birth (not in future)
  const dob = new Date(input.dateOfBirth);
  if (dob > new Date()) {
    validationErrors.push('Date of birth cannot be in the future');
  }

  // If validation errors, return early
  if (validationErrors.length > 0) {
    return {
      success: false,
      validationErrors
    };
  }

  try {
    // 4. Check for existing patient with same Ghana Card
    const existingPatients = await client.searchPatients(ghanaCardResult.formatted!);
    if (existingPatients.length > 0) {
      return {
        success: false,
        error: `Patient with Ghana Card ${maskPII(ghanaCardResult.formatted!)} already exists`
      };
    }

    // 5. Load facility config for folder number generation (from env vars)
    const facilityCode = process.env.FACILITY_CODE || 'KBTH';
    const regionCode = process.env.REGION_CODE || 'GA';

    // 6. Generate folder number
    const folderNumber = await generateFolderNumber(client, facilityCode, regionCode);

    // 7. Get identifier types
    const identifierTypes = await client.getIdentifierTypes();
    const ghanaCardType = identifierTypes.find(t => 
      t.name === 'Ghana Card' || t.display === 'Ghana Card'
    );
    const folderNumberType = identifierTypes.find(t => 
      t.name === 'Folder Number' || t.display === 'Folder Number'
    );

    if (!ghanaCardType || !folderNumberType) {
      return {
        success: false,
        error: 'Required identifier types not configured in OpenMRS. Run metadata initialization.'
      };
    }

    // 8. Build OpenMRS patient payload
    const patientPayload = {
      person: {
        names: [
          {
            givenName: input.givenName,
            middleName: input.middleName,
            familyName: input.familyName,
            preferred: true
          }
        ],
        gender: input.gender,
        birthdate: input.dateOfBirth,
        addresses: input.address ? [
          {
            address1: input.address,
            stateProvince: input.region,
            country: 'Ghana',
            preferred: true
          }
        ] : [],
        attributes: [
          // NHIS number as person attribute
          ...(validatedNHIS ? [{
            attributeType: 'NHIS_NUMBER_ATTRIBUTE_UUID', // TODO: Get from metadata
            value: validatedNHIS
          }] : []),
          // Phone number as person attribute
          ...(input.phone ? [{
            attributeType: 'PHONE_NUMBER_ATTRIBUTE_UUID', // TODO: Get from metadata
            value: input.phone
          }] : [])
        ]
      },
      identifiers: [
        {
          identifier: ghanaCardResult.formatted,
          identifierType: ghanaCardType.uuid,
          preferred: true
        },
        {
          identifier: folderNumber,
          identifierType: folderNumberType.uuid,
          preferred: false
        }
      ]
    };

    // 9. Create patient in OpenMRS
    const createdPatient = await client.createPatient(patientPayload);

    // 10. Return success with masked PII
    return {
      success: true,
      patient: {
        uuid: createdPatient.uuid,
        ghanaCard: maskPII(ghanaCardResult.formatted!),
        folderNumber: folderNumber,
        display: createdPatient.display
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Failed to create patient: ${error.message}`
    };
  }
}
