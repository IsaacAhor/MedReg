/**
 * Folder Number Generation Service
 * 
 * Generates unique folder numbers for patients in the format:
 * [REGION]-[FACILITY]-[YEAR]-[SEQUENCE]
 * 
 * Example: GAR-KBTH-2025-000123
 * 
 * Reference: AGENTS.md lines 236-278
 * 
 * Thread Safety:
 * - Preferred: Use OpenMRS module endpoint (server-side sequence)
 * - Fallback: SystemSetting-based sequence (best-effort, race conditions possible)
 */

import { z } from 'zod';

// Ghana region codes (16 regions as of 2019 reorganization)
export const GHANA_REGIONS = [
  'AR',  // Ashanti
  'BER', // Bono East
  'BR',  // Bono
  'CR',  // Central
  'ER',  // Eastern
  'GAR', // Greater Accra
  'NER', // North East
  'NR',  // Northern
  'NWR', // North West
  'OR',  // Oti
  'SR',  // Savannah
  'UER', // Upper East
  'UWR', // Upper West
  'VR',  // Volta
  'WR',  // Western
  'WNR', // Western North
] as const;

export type GhanaRegionCode = typeof GHANA_REGIONS[number];

// Validation schema
export const folderNumberSchema = z.object({
  regionCode: z.enum(GHANA_REGIONS, {
    errorMap: () => ({ message: 'Invalid Ghana region code' }),
  }),
  facilityCode: z.string()
    .min(2, 'Facility code must be at least 2 characters')
    .max(10, 'Facility code must be at most 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Facility code must be uppercase alphanumeric'),
  year: z.number()
    .int('Year must be an integer')
    .min(2020, 'Year must be 2020 or later')
    .max(2100, 'Year must be before 2100'),
  sequence: z.number()
    .int('Sequence must be an integer')
    .min(1, 'Sequence must be positive')
    .max(999999, 'Sequence cannot exceed 999999'),
});

export type FolderNumberParams = z.infer<typeof folderNumberSchema>;

/**
 * Format folder number from components
 * @param params - Region, facility, year, sequence
 * @returns Formatted folder number (e.g., "GAR-KBTH-2025-000123")
 */
export function formatFolderNumber(params: FolderNumberParams): string {
  const validated = folderNumberSchema.parse(params);
  const { regionCode, facilityCode, year, sequence } = validated;
  
  // Pad sequence to 6 digits
  const paddedSequence = String(sequence).padStart(6, '0');
  
  return `${regionCode}-${facilityCode}-${year}-${paddedSequence}`;
}

/**
 * Parse folder number into components
 * @param folderNumber - Folder number string (e.g., "GAR-KBTH-2025-000123")
 * @returns Parsed components or null if invalid
 */
export function parseFolderNumber(folderNumber: string): FolderNumberParams | null {
  const pattern = /^([A-Z]{2,3})-([A-Z0-9]+)-(\d{4})-(\d{6})$/;
  const match = folderNumber.match(pattern);
  
  if (!match) return null;
  
  const [, regionCode, facilityCode, yearStr, sequenceStr] = match;
  
  try {
    return folderNumberSchema.parse({
      regionCode: regionCode as GhanaRegionCode,
      facilityCode,
      year: parseInt(yearStr, 10),
      sequence: parseInt(sequenceStr, 10),
    });
  } catch {
    return null;
  }
}

/**
 * Validate folder number format
 * @param folderNumber - Folder number string
 * @returns True if valid, false otherwise
 */
export function isValidFolderNumber(folderNumber: string): boolean {
  return parseFolderNumber(folderNumber) !== null;
}

/**
 * Generate folder number prefix (region-facility-year)
 * @param regionCode - Ghana region code
 * @param facilityCode - Facility code
 * @param year - Year (defaults to current year)
 * @returns Prefix string (e.g., "GAR-KBTH-2025")
 */
export function getFolderNumberPrefix(
  regionCode: GhanaRegionCode,
  facilityCode: string,
  year?: number
): string {
  const effectiveYear = year || new Date().getFullYear();
  return `${regionCode}-${facilityCode}-${effectiveYear}`;
}

/**
 * Configuration for folder number generation API
 */
export interface FolderNumberConfig {
  openmrsBaseUrl: string;
  openmrsRootUrl: string;
  authHeader: string;
}

/**
 * Generate folder number using OpenMRS APIs
 * 
 * Strategy:
 * 1. Try module endpoint (thread-safe): POST /ws/ghana/foldernumber/allocate
 * 2. Fallback to SystemSetting-based sequence (race conditions possible)
 * 
 * @param regionCode - Ghana region code
 * @param facilityCode - Facility code  
 * @param config - OpenMRS connection configuration
 * @returns Generated folder number
 */
export async function generateFolderNumber(
  regionCode: GhanaRegionCode,
  facilityCode: string,
  config: FolderNumberConfig
): Promise<string> {
  const { openmrsBaseUrl, openmrsRootUrl, authHeader } = config;
  const year = new Date().getFullYear();
  
  // Validate inputs
  folderNumberSchema.parse({
    regionCode,
    facilityCode,
    year,
    sequence: 1, // Placeholder for validation
  });

  // Strategy 1: Try module endpoint (preferred - thread-safe)
  try {
    const moduleUrl = `${openmrsRootUrl}/ws/ghana/foldernumber/allocate?regionCode=${encodeURIComponent(regionCode)}&facilityCode=${encodeURIComponent(facilityCode)}`;
    
    const response = await fetch(moduleUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.folderNumber && typeof data.folderNumber === 'string') {
        // Validate returned folder number
        if (isValidFolderNumber(data.folderNumber)) {
          return data.folderNumber;
        }
        console.warn('Module returned invalid folder number format:', data.folderNumber);
      }
    } else {
      console.warn(`Module foldernumber allocate failed: ${response.status}`, await response.text());
    }
  } catch (error) {
    console.warn('Module foldernumber allocate error:', error);
  }

  // Strategy 2: Fallback to SystemSetting-based sequence
  console.log('Using SystemSetting fallback for folder number generation');
  
  const prefix = getFolderNumberPrefix(regionCode, facilityCode, year);
  const settingKey = `ghana.folder.sequence.${prefix}`;
  
  let lastSequence = 0;

  // Read current sequence from SystemSetting
  try {
    const searchUrl = `${openmrsBaseUrl}/systemsetting?q=${encodeURIComponent(settingKey)}`;
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const setting = (searchData?.results || []).find(
        (r: any) => r?.property === settingKey || r?.display?.startsWith(settingKey)
      );

      if (setting && setting.value) {
        const parsed = parseInt(String(setting.value), 10);
        if (!Number.isNaN(parsed)) {
          lastSequence = parsed;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to read folder number sequence:', error);
  }

  // Increment sequence
  const nextSequence = lastSequence + 1;

  // Save new sequence (fire-and-forget, best effort)
  try {
    await fetch(`${openmrsBaseUrl}/systemsetting`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        property: settingKey,
        value: String(nextSequence),
      }),
    });
  } catch (error) {
    console.warn('Failed to save folder number sequence:', error);
  }

  // Format and return
  return formatFolderNumber({
    regionCode,
    facilityCode,
    year,
    sequence: nextSequence,
  });
}

/**
 * Get next sequence number for a given prefix (for testing/debugging)
 * @param regionCode - Ghana region code
 * @param facilityCode - Facility code
 * @param config - OpenMRS connection configuration
 * @returns Next sequence number
 */
export async function getNextSequence(
  regionCode: GhanaRegionCode,
  facilityCode: string,
  config: FolderNumberConfig
): Promise<number> {
  const { openmrsBaseUrl, authHeader } = config;
  const year = new Date().getFullYear();
  const prefix = getFolderNumberPrefix(regionCode, facilityCode, year);
  const settingKey = `ghana.folder.sequence.${prefix}`;

  try {
    const searchUrl = `${openmrsBaseUrl}/systemsetting?q=${encodeURIComponent(settingKey)}`;
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const setting = (data?.results || []).find(
        (r: any) => r?.property === settingKey || r?.display?.startsWith(settingKey)
      );

      if (setting && setting.value) {
        const current = parseInt(String(setting.value), 10);
        return Number.isNaN(current) ? 1 : current + 1;
      }
    }
  } catch (error) {
    console.warn('Failed to get next sequence:', error);
  }

  return 1; // Default to 1 if no sequence exists
}
