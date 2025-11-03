package org.openmrs.module.ghanaemr.api.nhie;

import org.openmrs.Patient;
import org.openmrs.module.ghanaemr.exception.NHIEIntegrationException;

/**
 * Service for integrating OpenMRS with Ghana NHIE (National Health Information Exchange).
 * 
 * This service orchestrates:
 * 1. FHIR R4 conversion (Patient → FHIR JSON via FhirPatientMapper)
 * 2. NHIE submission (POST to NHIE via NHIEHttpClient)
 * 3. Duplicate handling (409 conflicts with If-None-Exist header)
 * 4. Transaction logging (nhie_transaction_log with PII masking)
 * 5. NHIE patient ID storage (patient_attribute for future lookups)
 * 
 * Error Handling:
 * - 201 Created: Store NHIE patient ID, log SUCCESS
 * - 200 OK (duplicate): Extract existing NHIE patient ID, log SUCCESS
 * - 409 Conflict: Extract existing patient ID from response, reconcile
 * - 401 Unauthorized: Token expired, NHIEHttpClient handles refresh + retry
 * - 422 Unprocessable Entity: Business rule violation, log FAILED (no retry)
 * - 429 Rate Limited: Log FAILED (retryable), NHIERetryJob handles retry
 * - 5xx Server Error: Log FAILED (retryable), NHIERetryJob handles retry
 * 
 * Transaction Logging:
 * - All PII masked (Ghana Card: GHA-1234****-*, NHIS: 0123******)
 * - Logs: patient_id, resource_type=Patient, request_body, response_status, response_body, retry_count, status
 * - Status values: PENDING, SUCCESS, FAILED, DLQ
 * 
 * @see org.openmrs.module.ghanaemr.api.fhir.FhirPatientMapper
 * @see org.openmrs.module.ghanaemr.api.nhie.NHIEHttpClient
 * @see org.openmrs.module.ghanaemr.api.nhie.NHIERetryJob
 */
public interface NHIEIntegrationService {
    
    /**
     * Synchronize OpenMRS patient to Ghana NHIE.
     * 
     * Workflow:
     * 1. Convert Patient to FHIR R4 JSON (FhirPatientMapper.toFhirPatient)
     * 2. Submit to NHIE (NHIEHttpClient.submitPatient with If-None-Exist header)
     * 3. Handle response:
     *    - 201 Created: Store NHIE patient ID, log SUCCESS
     *    - 200 OK: Patient already exists (idempotent), extract ID, log SUCCESS
     *    - 409 Conflict: Duplicate Ghana Card, extract existing ID, reconcile
     *    - 4xx/5xx: Log FAILED (with retryable flag), throw exception
     * 4. Log transaction to nhie_transaction_log (PII masked)
     * 5. Store NHIE patient ID as patient attribute for future reference
     * 
     * @param patient OpenMRS patient to sync
     * @return NHIE patient ID (e.g., "patient-123" from NHIE response)
     * @throws NHIEIntegrationException if sync fails (network error, validation error, etc.)
     * @throws IllegalArgumentException if patient is null or has no Ghana Card identifier
     */
    String syncPatientToNHIE(Patient patient) throws NHIEIntegrationException;
    
    /**
     * Handle 409 Conflict response (duplicate patient detected by NHIE).
     * 
     * When NHIE returns 409 Conflict:
     * 1. Extract existing NHIE patient ID from response body (FHIR OperationOutcome)
     * 2. Check if OpenMRS patient already has NHIE patient ID attribute
     * 3. If missing: Store NHIE patient ID attribute
     * 4. If present but different: Log warning (data inconsistency), update to NHIE value
     * 5. Return existing NHIE patient ID
     * 
     * @param patient OpenMRS patient with duplicate Ghana Card
     * @param conflictResponse NHIE 409 Conflict response (contains existing patient ID)
     * @return Existing NHIE patient ID from response
     */
    String handleDuplicatePatient(Patient patient, NHIEResponse conflictResponse);
    
    /**
     * Get NHIE patient ID for OpenMRS patient (if already synced).
     * 
     * Checks patient_attribute table for "NHIE Patient ID" attribute.
     * Returns null if patient not yet synced to NHIE.
     * 
     * @param patient OpenMRS patient
     * @return NHIE patient ID (e.g., "patient-123") or null if not synced
     */
    String getNHIEPatientId(Patient patient);
    
    /**
     * Store NHIE patient ID as OpenMRS patient attribute.
     * 
     * Creates "NHIE Patient ID" person attribute if not exists.
     * Used for tracking sync status and avoiding duplicate submissions.
     * 
     * @param patient OpenMRS patient
     * @param nhiePatientId NHIE patient ID (e.g., "patient-123")
     */
    void storeNHIEPatientId(Patient patient, String nhiePatientId);
    
    /**
     * Check if patient already synced to NHIE.
     * 
     * @param patient OpenMRS patient
     * @return true if patient has NHIE patient ID attribute, false otherwise
     */
    boolean isPatientSyncedToNHIE(Patient patient);

    /**
     * Submit an OPD Encounter to NHIE as FHIR Encounter.
     *
     * @param encounter OpenMRS encounter to submit
     * @return NHIE encounter ID
     */
    String submitEncounter(org.openmrs.Encounter encounter) throws org.openmrs.module.ghanaemr.exception.NHIEIntegrationException;
}
