package org.openmrs.module.ghanaemrfoldernumber;

import org.openmrs.api.OpenmrsService;

/**
 * Service for generating Ghana folder numbers in a thread-safe manner.
 */
public interface FolderNumberService extends OpenmrsService {

    /**
     * Generate the next folder number for the given region and facility.
     * Format: {REGION}-{FACILITY}-{YEAR}-{SEQUENCE}
     * Example: GA-KBTH-2025-000123
     *
     * @param regionCode 2-letter region code (e.g., GA)
     * @param facilityCode 4-character facility code (e.g., KBTH)
     * @return the folder number string
     */
    String generateNext(String regionCode, String facilityCode);
}
