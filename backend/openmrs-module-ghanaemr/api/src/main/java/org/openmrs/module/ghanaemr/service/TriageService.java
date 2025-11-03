package org.openmrs.module.ghanaemr.service;

import org.openmrs.Encounter;
import org.openmrs.Patient;
import org.openmrs.module.ghanaemr.exception.ValidationException;

import java.util.Map;

public interface TriageService {

    /**
     * Record vitals for patient at triage.
     * Keys expected in vitals map: bpSystolic, bpDiastolic, temp, weight, height
     * BMI is auto-calculated if weight and height are provided.
     *
     * @param patient       Patient receiving vitals
     * @param vitals        Map of vital sign values
     * @param locationUuid  Triage location UUID
     * @param providerUuid  Provider UUID recording vitals
     * @return Encounter with vitals observations
     * @throws ValidationException if vitals out of range
     */
    Encounter recordVitals(Patient patient, Map<String, Double> vitals,
                           String locationUuid, String providerUuid);

    /**
     * Get latest triage vitals for patient.
     * @param patient Patient
     * @return Map of vital signs from most recent triage encounter, or empty if none
     */
    Map<String, Double> getLatestVitals(Patient patient);

    /**
     * Validate vital signs are within acceptable ranges.
     * @param vitals Map of vital sign values
     * @throws ValidationException if any vital out of range
     */
    void validateVitals(Map<String, Double> vitals);
}

