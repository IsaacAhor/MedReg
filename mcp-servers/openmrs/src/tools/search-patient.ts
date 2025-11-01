/**
 * Search Patient MCP Tool
 * 
 * Allows AI to search for patients by Ghana Card, NHIS, name, or folder number
 * - Automatically masks PII in results
 * - Returns formatted patient data
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

// Inline PII masking (from shared)
function maskPII(text: string): string {
  return text
    .replace(/(GHA-\d{4})\d{5}-\d/g, '$1****-*')
    .replace(/(\d{4})\d{6}/g, '$1****');
}

/**
 * Zod schema for search_patient input
 */
export const SearchPatientSchema = z.object({
  query: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .describe('Search query: Ghana Card, NHIS number, name, or folder number'),
  
  limit: z.number()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Maximum number of results (1-50, default 10)')
});

export type SearchPatientInput = z.infer<typeof SearchPatientSchema>;

export interface SearchPatientResult {
  success: boolean;
  patients?: Array<{
    uuid: string;
    display: string;
    ghanaCard?: string;  // Masked
    nhisNumber?: string; // Masked
    folderNumber?: string;
    gender: string;
    age?: number;
  }>;
  count?: number;
  error?: string;
}

/**
 * Search patients in OpenMRS
 */
export async function searchPatient(
  input: SearchPatientInput,
  client: OpenMRSClient
): Promise<SearchPatientResult> {
  try {
    // Search OpenMRS patients
    const results = await client.searchPatients(input.query);

    // Limit results
    const limitedResults = results.slice(0, input.limit);

    // Format and mask patient data
    const patients = limitedResults.map(patient => {
      // Extract Ghana Card
      const ghanaCardId = patient.identifiers?.find((id: any) =>
        id.identifierType?.display === 'Ghana Card'
      );

      // Extract Folder Number
      const folderNumberId = patient.identifiers?.find((id: any) =>
        id.identifierType?.display === 'Folder Number'
      );

      // Extract NHIS from person attributes
      const nhisAttr = patient.person?.attributes?.find((attr: any) =>
        attr.attributeType?.display === 'NHIS Number'
      );

      // Calculate age from birthdate
      let age: number | undefined;
      if (patient.person?.birthdate) {
        const birthDate = new Date(patient.person.birthdate);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      return {
        uuid: patient.uuid,
        display: patient.display,
        ghanaCard: ghanaCardId ? maskPII(ghanaCardId.identifier) : undefined,
        nhisNumber: nhisAttr ? maskPII(nhisAttr.value) : undefined,
        folderNumber: folderNumberId?.identifier,
        gender: patient.person?.gender || 'U',
        age
      };
    });

    return {
      success: true,
      patients,
      count: patients.length
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Failed to search patients: ${error.message}`
    };
  }
}
