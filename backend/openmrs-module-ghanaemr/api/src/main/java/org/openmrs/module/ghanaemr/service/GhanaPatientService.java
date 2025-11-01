package org.openmrs.module.ghanaemr.service;

import org.openmrs.Patient;
import org.openmrs.module.ghanaemr.dto.GhanaPatientDTO;

public interface GhanaPatientService {
    /**
     * Register new patient with Ghana-specific validation and identifiers.
     * - Validates Ghana Card (format + Luhn)
     * - Validates NHIS number (10 digits, optional)
     * - Generates folder number [REGION]-[FACILITY]-[YEAR]-[SEQUENCE]
     * - Saves Ghana Card, NHIS, and Folder Number as PatientIdentifiers
     */
    Patient registerPatient(GhanaPatientDTO dto);
}

