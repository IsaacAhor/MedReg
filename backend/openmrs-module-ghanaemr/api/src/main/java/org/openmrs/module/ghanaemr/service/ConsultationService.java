package org.openmrs.module.ghanaemr.service;

import org.openmrs.DrugOrder;
import org.openmrs.Encounter;
import org.openmrs.TestOrder;
import org.openmrs.Patient;

import java.util.List;

/**
 * OPD Consultation service for recording complaints, diagnoses, prescriptions, and lab orders.
 *
 * Notes:
 * - Diagnoses are stored as coded observations by using the diagnosis concept itself per entry.
 * - Prescriptions create DrugOrder entries associated to the encounter.
 * - Lab orders create TestOrder entries associated to the encounter.
 */
public interface ConsultationService {

    /**
     * Record a full consultation in a single transaction.
     *
     * @param patient patient
     * @param chiefComplaint free-text chief complaint (optional)
     * @param diagnosisConceptUuids list of concept UUIDs representing ICD-10 diagnoses (optional)
     * @param drugUuids list of drug UUIDs to prescribe (optional)
     * @param labConceptUuids list of lab test concept UUIDs to order (optional)
     * @param locationUuid encounter location UUID (optional)
     * @param providerUuid encounter provider UUID (optional)
     * @return saved Encounter
     */
    Encounter recordConsultation(Patient patient,
                                 String chiefComplaint,
                                 List<String> diagnosisConceptUuids,
                                 List<String> drugUuids,
                                 List<String> labConceptUuids,
                                 String locationUuid,
                                 String providerUuid);

    /**
     * Add a coded diagnosis to an encounter using the diagnosis concept itself.
     */
    Encounter addDiagnosis(Encounter encounter, String diagnosisConceptUuid);

    /**
     * Prescribe a drug for the encounter.
     */
    DrugOrder prescribeDrug(Encounter encounter, String drugUuid, Double dose, Integer durationDays);

    /**
     * Order a lab test for the encounter.
     */
    TestOrder orderLab(Encounter encounter, String testConceptUuid, String instructions);
}

