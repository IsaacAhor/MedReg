package org.openmrs.module.ghanaemr.api.nhie.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.hl7.fhir.r4.model.Patient;
import org.openmrs.PersonAttribute;
import org.openmrs.PersonAttributeType;
import org.openmrs.PatientIdentifier;
import org.openmrs.api.PatientService;
import org.openmrs.api.PersonService;
import org.openmrs.api.context.Context;
import org.openmrs.api.db.DAOException;
import org.openmrs.module.ghanaemr.api.fhir.FhirPatientMapper;
import org.openmrs.module.ghanaemr.api.fhir.FhirEncounterMapper;
import org.openmrs.module.ghanaemr.api.nhie.NHIEHttpClient;
import org.openmrs.module.ghanaemr.api.nhie.NHIEIntegrationService;
import org.openmrs.module.ghanaemr.api.nhie.NHIEResponse;
import org.openmrs.module.ghanaemr.exception.NHIEIntegrationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.util.Date;
import java.util.UUID;

/**
 * Implementation of NHIEIntegrationService.
 * 
 * This service orchestrates the flow:
 * OpenMRS Patient → FHIR R4 JSON → NHIE submission → Transaction logging → NHIE patient ID storage
 * 
 * Thread Safety:
 * - @Transactional ensures database operations are atomic
 * - NHIEHttpClient is thread-safe (token caching via ConcurrentHashMap)
 * - FhirPatientMapper is stateless and thread-safe
 * 
 * Error Recovery:
 * - 401 Unauthorized: NHIEHttpClient auto-refreshes token and retries
 * - 429 Rate Limited: Logs FAILED (retryable), NHIERetryJob will retry with backoff
 * - 5xx Server Error: Logs FAILED (retryable), NHIERetryJob will retry
 * - 409 Conflict: Extracts existing NHIE patient ID, reconciles
 * - 422 Unprocessable: Logs FAILED (not retryable), manual intervention needed
 * 
 * @see NHIEIntegrationService
 */
@Transactional
public class NHIEIntegrationServiceImpl implements NHIEIntegrationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NHIEIntegrationServiceImpl.class);
    
    private static final String GHANA_CARD_IDENTIFIER_NAME = "Ghana Card";
    private static final String NHIE_PATIENT_ID_ATTRIBUTE_NAME = "NHIE Patient ID";
    
    private final FhirPatientMapper fhirPatientMapper;
    private final FhirEncounterMapper fhirEncounterMapper = new FhirEncounterMapper();
    private final NHIEHttpClient nhieHttpClient;
    private final org.openmrs.module.ghanaemr.api.nhie.NHIETransactionLogger transactionLogger;
    private final ObjectMapper objectMapper;
    
    public NHIEIntegrationServiceImpl() {
        this.fhirPatientMapper = new FhirPatientMapper();
        this.nhieHttpClient = new NHIEHttpClient();
        this.objectMapper = new ObjectMapper();
        this.transactionLogger = new org.openmrs.module.ghanaemr.api.nhie.DefaultNHIETransactionLogger();
    }
    
    /**
     * Constructor for testing (allows dependency injection).
     */
    public NHIEIntegrationServiceImpl(FhirPatientMapper fhirPatientMapper, NHIEHttpClient nhieHttpClient) {
        this.fhirPatientMapper = fhirPatientMapper;
        this.nhieHttpClient = nhieHttpClient;
        this.objectMapper = new ObjectMapper();
        this.transactionLogger = new org.openmrs.module.ghanaemr.api.nhie.DefaultNHIETransactionLogger();
    }

    /**
     * Constructor with logger injection (for testing)
     */
    public NHIEIntegrationServiceImpl(FhirPatientMapper fhirPatientMapper, NHIEHttpClient nhieHttpClient,
                                      org.openmrs.module.ghanaemr.api.nhie.NHIETransactionLogger transactionLogger) {
        this.fhirPatientMapper = fhirPatientMapper;
        this.nhieHttpClient = nhieHttpClient;
        this.objectMapper = new ObjectMapper();
        this.transactionLogger = transactionLogger == null
                ? new org.openmrs.module.ghanaemr.api.nhie.DefaultNHIETransactionLogger()
                : transactionLogger;
    }

    @Override
    public String submitEncounter(org.openmrs.Encounter encounter) throws NHIEIntegrationException {
        if (encounter == null) {
            throw new IllegalArgumentException("Encounter cannot be null");
        }
        try {
            String transactionId = java.util.UUID.randomUUID().toString();
            org.hl7.fhir.r4.model.Encounter fhirEncounter = fhirEncounterMapper.toFhirEncounter(encounter);
            String fhirJson = ca.uhn.fhir.context.FhirContext.forR4().newJsonParser().encodeResourceToString(fhirEncounter);

            transactionLogger.log(transactionId,
                    encounter.getPatient() != null ? encounter.getPatient().getPatientId() : null,
                    "ENCOUNTER", "POST", "/Encounter",
                    maskPII(fhirJson), null, null, 0, "PENDING");

            NHIEResponse response = nhieHttpClient.submitEncounter(fhirJson);
            if (response.isSuccess()) {
                String nhieId = response.getNhieResourceId();
                transactionLogger.update(transactionId, response.getStatusCode(), maskPII(response.getResponseBody()),
                        0, "SUCCESS", nhieId, null);
                return nhieId;
            } else {
                transactionLogger.update(transactionId, response.getStatusCode(), maskPII(response.getResponseBody()),
                        0, "FAILED", null, response.getErrorMessage());
                throw new NHIEIntegrationException("Failed to submit encounter to NHIE");
            }
        } catch (Exception e) {
            throw new NHIEIntegrationException("Error submitting encounter to NHIE", e);
        }
    }
    
    @Override
    public String syncPatientToNHIE(org.openmrs.Patient patient) throws NHIEIntegrationException {
        if (patient == null) {
            throw new IllegalArgumentException("Patient cannot be null");
        }
        
        logger.info("Starting NHIE sync for patient ID: {}", patient.getPatientId());
        
        // 1. Extract Ghana Card identifier (required for NHIE submission)
        String ghanaCard = getGhanaCardIdentifier(patient);
        if (ghanaCard == null) {
            throw new IllegalArgumentException("Patient must have Ghana Card identifier for NHIE sync");
        }
        
        // 2. Check if patient already synced
        String existingNHIEPatientId = getNHIEPatientId(patient);
        if (existingNHIEPatientId != null) {
            logger.info("Patient already synced to NHIE with ID: {} (masked in logs)", maskIdentifier(existingNHIEPatientId));
            return existingNHIEPatientId;
        }
        
        String transactionId = UUID.randomUUID().toString();
        String fhirJson = null;
        NHIEResponse response = null;
        
        try {
            // 3. Convert OpenMRS Patient to FHIR R4 JSON
            org.hl7.fhir.r4.model.Patient fhirPatient = fhirPatientMapper.toFhirPatient(patient);
            fhirJson = serializeFhirPatient(fhirPatient);
            
            logger.debug("Converted patient to FHIR R4 (Ghana Card: {})", maskIdentifier(ghanaCard));
            
            // 4. Log transaction as PENDING (masked)
            transactionLogger.log(transactionId, patient.getPatientId(), "Patient",
                    "POST", "/Patient",
                    maskPII(fhirJson), null, null, 0, "PENDING");
            
            // 5. Submit to NHIE (with If-None-Exist header for idempotency)
            response = nhieHttpClient.submitPatient(fhirJson, ghanaCard);
            
            // 6. Handle response
            if (response.isSuccess()) {
                // 201 Created or 200 OK (duplicate)
                String nhiePatientId = response.getNhieResourceId();
                
                if (nhiePatientId == null) {
                    // Extract ID from response body if not in Location header
                    nhiePatientId = extractPatientIdFromResponseBody(response.getResponseBody());
                }
                
                if (nhiePatientId == null) {
                    throw new NHIEIntegrationException("NHIE returned success but no patient ID found");
                }
                
                // 7. Store NHIE patient ID
                storeNHIEPatientId(patient, nhiePatientId);
                
                // 8. Log transaction as SUCCESS (masked)
                transactionLogger.log(transactionId, patient.getPatientId(), "Patient",
                        "POST", "/Patient",
                        maskPII(fhirJson), maskPII(response.getResponseBody()), response.getStatusCode(), 0, "SUCCESS");
                
                logger.info("Successfully synced patient to NHIE (Ghana Card: {}, NHIE ID: {})", 
                           maskIdentifier(ghanaCard), maskIdentifier(nhiePatientId));
                
                return nhiePatientId;
                
            } else if (response.getStatusCode() == 409) {
                // Conflict - duplicate Ghana Card
                logger.warn("NHIE returned 409 Conflict for Ghana Card: {}", maskIdentifier(ghanaCard));
                
                String existingId = handleDuplicatePatient(patient, response);
                
                // Log as SUCCESS (duplicate is expected, not error)
                transactionLogger.log(transactionId, patient.getPatientId(), "Patient",
                        "POST", "/Patient",
                        maskPII(fhirJson), maskPII(response.getResponseBody()), response.getStatusCode(), 0, "SUCCESS");
                
                return existingId;
                
            } else {
                // 4xx/5xx error
                String errorMessage = String.format("NHIE sync failed with status %d: %s", 
                                                   response.getStatusCode(), response.getErrorMessage());
                
                // Log transaction as FAILED (masked)
                transactionLogger.log(transactionId, patient.getPatientId(), "Patient",
                        "POST", "/Patient",
                        maskPII(fhirJson), maskPII(response.getResponseBody()), response.getStatusCode(), 0, "FAILED");
                
                logger.error("NHIE sync failed for patient ID {} (Ghana Card: {}): {}", 
                            patient.getPatientId(), maskIdentifier(ghanaCard), errorMessage);
                
                throw new NHIEIntegrationException(errorMessage, response.getStatusCode(), response.isRetryable());
            }
            
        } catch (IOException e) {
            // Network error, serialization error, etc.
            String errorMessage = "NHIE sync failed due to network/IO error: " + e.getMessage();
            
            logger.error(errorMessage, e);
            
            // Log transaction as FAILED (retryable - network errors)
            try {
                transactionLogger.log(transactionId, patient.getPatientId(), "Patient",
                        "POST", "/Patient",
                        maskPII(fhirJson), null, null, 0, "FAILED");
            } catch (Exception logError) {
                logger.error("Failed to log transaction error", logError);
            }
            
            throw new NHIEIntegrationException(errorMessage, e, null, true); // Network errors are retryable
            
        } catch (Exception e) {
            // Unexpected error
            String errorMessage = "NHIE sync failed due to unexpected error: " + e.getMessage();
            
            logger.error(errorMessage, e);
            
            // Log transaction as FAILED (not retryable - unexpected)
            try {
                transactionLogger.log(transactionId, patient.getPatientId(), "Patient",
                        "POST", "/Patient",
                        maskPII(fhirJson), null, null, 0, "FAILED");
            } catch (Exception logError) {
                logger.error("Failed to log transaction error", logError);
            }
            
            throw new NHIEIntegrationException(errorMessage, e, null, false);
        }
    }
    
    @Override
    public String handleDuplicatePatient(org.openmrs.Patient patient, NHIEResponse conflictResponse) {
        // Extract existing NHIE patient ID from 409 Conflict response
        String existingNHIEPatientId = extractPatientIdFromResponseBody(conflictResponse.getResponseBody());
        
        if (existingNHIEPatientId == null) {
            logger.warn("409 Conflict response does not contain existing patient ID");
            return null;
        }
        
        // Check if OpenMRS patient already has NHIE patient ID attribute
        String currentNHIEPatientId = getNHIEPatientId(patient);
        
        if (currentNHIEPatientId == null) {
            // Store NHIE patient ID (first time sync)
            logger.info("Storing existing NHIE patient ID from 409 response: {}", maskIdentifier(existingNHIEPatientId));
            storeNHIEPatientId(patient, existingNHIEPatientId);
            
        } else if (!currentNHIEPatientId.equals(existingNHIEPatientId)) {
            // Data inconsistency - OpenMRS has different NHIE patient ID than NHIE reports
            logger.warn("Data inconsistency detected: OpenMRS has NHIE ID {}, but NHIE reports {}. Updating to NHIE value.", 
                       maskIdentifier(currentNHIEPatientId), maskIdentifier(existingNHIEPatientId));
            
            // Update to NHIE's value (NHIE is source of truth)
            storeNHIEPatientId(patient, existingNHIEPatientId);
        }
        
        return existingNHIEPatientId;
    }
    
    @Override
    public String getNHIEPatientId(org.openmrs.Patient patient) {
        if (patient == null || patient.getPerson() == null) {
            return null;
        }
        
        PersonAttributeType attributeType = getNHIEPatientIdAttributeType();
        if (attributeType == null) {
            return null;
        }
        
        PersonAttribute attribute = patient.getPerson().getAttribute(attributeType);
        if (attribute == null) {
            return null;
        }
        
        return attribute.getValue();
    }
    
    @Override
    public void storeNHIEPatientId(org.openmrs.Patient patient, String nhiePatientId) {
        if (patient == null || nhiePatientId == null) {
            throw new IllegalArgumentException("Patient and NHIE patient ID cannot be null");
        }
        
        PersonAttributeType attributeType = getNHIEPatientIdAttributeType();
        if (attributeType == null) {
            throw new IllegalStateException("NHIE Patient ID attribute type not configured");
        }
        
        // Check if attribute already exists
        PersonAttribute existingAttribute = patient.getPerson().getAttribute(attributeType);
        
        if (existingAttribute != null) {
            // Update existing attribute
            existingAttribute.setValue(nhiePatientId);
        } else {
            // Create new attribute
            PersonAttribute newAttribute = new PersonAttribute();
            newAttribute.setAttributeType(attributeType);
            newAttribute.setValue(nhiePatientId);
            newAttribute.setPerson(patient.getPerson());
            patient.getPerson().addAttribute(newAttribute);
        }
        
        // Save patient (cascades to person attributes)
        PatientService patientService = Context.getPatientService();
        patientService.savePatient(patient);
        
        logger.info("Stored NHIE patient ID for OpenMRS patient {}: {}", 
                   patient.getPatientId(), maskIdentifier(nhiePatientId));
    }
    
    @Override
    public boolean isPatientSyncedToNHIE(org.openmrs.Patient patient) {
        return getNHIEPatientId(patient) != null;
    }
    
    // ========================================
    // Helper Methods
    // ========================================
    
    private String getGhanaCardIdentifier(org.openmrs.Patient patient) {
        PatientService patientService = Context.getPatientService();
        
        for (PatientIdentifier identifier : patient.getIdentifiers()) {
            if (identifier.getIdentifierType().getName().equals(GHANA_CARD_IDENTIFIER_NAME)) {
                return identifier.getIdentifier();
            }
        }
        
        return null;
    }
    
    private PersonAttributeType getNHIEPatientIdAttributeType() {
        PersonService personService = Context.getPersonService();
        return personService.getPersonAttributeTypeByName(NHIE_PATIENT_ID_ATTRIBUTE_NAME);
    }
    
    private String serializeFhirPatient(org.hl7.fhir.r4.model.Patient fhirPatient) throws IOException {
        // Use HAPI FHIR's built-in JSON parser for proper FHIR serialization
        // For now, use Jackson (simple implementation)
        return objectMapper.writeValueAsString(fhirPatient);
    }
    
    private String extractPatientIdFromResponseBody(String responseBody) {
        if (responseBody == null || responseBody.isEmpty()) {
            return null;
        }
        
        try {
            // Parse FHIR JSON to extract "id" field
            // Example: {"resourceType":"Patient","id":"patient-123",...}
            if (responseBody.contains("\"id\"")) {
                int idStart = responseBody.indexOf("\"id\"") + 6; // Skip "id":"
                int idEnd = responseBody.indexOf("\"", idStart);
                if (idEnd > idStart) {
                    return responseBody.substring(idStart, idEnd);
                }
            }
        } catch (Exception e) {
            logger.error("Failed to extract patient ID from response body", e);
        }
        
        return null;
    }
    
    // logTransaction moved to DefaultNHIETransactionLogger via NHIETransactionLogger interface
    
    /**
     * Mask PII in JSON strings for logging.
     * 
     * Patterns:
     * - Ghana Card: GHA-123456789-0 → GHA-1234****-*
     * - NHIS: 0123456789 → 0123******
     * - Names: Kwame Mensah → K***e M****h
     */
    private String maskPII(String json) {
        if (json == null) {
            return null;
        }
        
        String masked = json;
        
        // Mask Ghana Card (GHA-XXXXXXXXX-X → GHA-1234****-*)
        masked = masked.replaceAll("GHA-(\\d{4})\\d{5}-(\\d)", "GHA-$1****-*");
        
        // Mask NHIS (0123456789 → 0123******)
        masked = masked.replaceAll("(\\d{4})\\d{6}", "$1******");
        
        // Mask names in JSON (e.g., "given":["Kwame"] → "given":["K***e"])
        // Simple implementation - mask middle characters of words
        masked = masked.replaceAll("\"(\\w)(\\w+)(\\w)\"", "\"$1***$3\"");
        
        return masked;
    }
    
    /**
     * Mask identifier for logging (used in log statements).
     */
    private String maskIdentifier(String identifier) {
        if (identifier == null) {
            return "***";
        }
        
        if (identifier.matches("^GHA-\\d{9}-\\d$")) {
            // Ghana Card
            return identifier.substring(0, 8) + "****-*";
        } else if (identifier.matches("^\\d{10}$")) {
            // NHIS
            return identifier.substring(0, 4) + "******";
        } else if (identifier.length() > 6) {
            // Generic (show first 4 chars)
            return identifier.substring(0, 4) + "***";
        }
        
        return "***";
    }
}
