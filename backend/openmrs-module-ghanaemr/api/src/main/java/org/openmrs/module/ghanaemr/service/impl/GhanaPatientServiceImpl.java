package org.openmrs.module.ghanaemr.service.impl;

import org.openmrs.Patient;
import org.openmrs.PatientIdentifier;
import org.openmrs.PatientIdentifierType;
import org.openmrs.PersonAttribute;
import org.openmrs.PersonAttributeType;
import org.openmrs.PersonName;
import org.openmrs.api.PatientService;
import org.openmrs.api.PersonService;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.dto.GhanaPatientDTO;
import org.openmrs.module.ghanaemr.exception.DuplicatePatientException;
import org.openmrs.module.ghanaemr.exception.ValidationException;
import org.openmrs.module.ghanaemr.service.GhanaPatientService;
import org.openmrs.module.ghanaemr.util.FolderNumberGenerator;
import org.openmrs.module.ghanaemr.util.SequenceProvider;
import org.openmrs.module.ghanaemr.validation.GhanaCardValidator;
import org.openmrs.module.ghanaemr.validation.NHISValidator;
import org.openmrs.module.ghanaemr.api.nhie.NHIEIntegrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Date;
import java.util.List;

@Service
@Transactional
public class GhanaPatientServiceImpl implements GhanaPatientService {

    private static final Logger log = LoggerFactory.getLogger(GhanaPatientServiceImpl.class);

    private static final String IDTYPE_GHANA_CARD = "Ghana Card";
    private static final String IDTYPE_NHIS_NUMBER = "NHIS Number"; // retained for backward compatibility only
    private static final String IDTYPE_FOLDER_NUMBER = "Folder Number";

    private final FolderNumberGenerator folderNumberGenerator;

    public GhanaPatientServiceImpl(SequenceProvider sequenceProvider) {
        this.folderNumberGenerator = new FolderNumberGenerator(sequenceProvider);
    }

    @Override
    public Patient registerPatient(GhanaPatientDTO dto) {
        if (dto == null) {
            throw new ValidationException("Payload is required");
        }

        // Validate and normalize Ghana Card
        String normalizedGhanaCard = GhanaCardValidator.normalize(dto.getGhanaCard());
        if (!GhanaCardValidator.isValid(normalizedGhanaCard)) {
            throw new ValidationException("Invalid Ghana Card format or checksum");
        }

        // NHIS number is optional but if provided must be 10 digits
        if (!NHISValidator.isValid(dto.getNhisNumber())) {
            throw new ValidationException("NHIS number must be 10 digits");
        }

        // Duplicate check by Ghana Card identifier
        PatientService patientService = Context.getPatientService();
        List<Patient> existing = getByIdentifier(patientService, normalizedGhanaCard);
        if (existing != null && !existing.isEmpty()) {
            throw new DuplicatePatientException("Patient already exists with Ghana Card");
        }

        // Build Patient
        Patient patient = new Patient();
        PersonName name = new PersonName(dto.getGivenName(), dto.getMiddleName(), dto.getFamilyName());
        patient.addName(name);
        if (dto.getGender() != null) {
            patient.setGender(dto.getGender());
        }
        Date dob = dto.getDateOfBirth();
        if (dob != null) {
            patient.setBirthdate(dob);
        }

        // Ghana Card identifier (preferred)
        PatientIdentifier ghanaCardId = new PatientIdentifier();
        ghanaCardId.setIdentifierType(getIdentifierType(IDTYPE_GHANA_CARD));
        ghanaCardId.setIdentifier(normalizedGhanaCard);
        ghanaCardId.setPreferred(true);
        patient.addIdentifier(ghanaCardId);

        // Folder number
        String folderNumber = folderNumberGenerator.generate(dto.getFacilityCode(), dto.getRegionCode());
        PatientIdentifier folderId = new PatientIdentifier();
        folderId.setIdentifierType(getIdentifierType(IDTYPE_FOLDER_NUMBER));
        folderId.setIdentifier(folderNumber);
        patient.addIdentifier(folderId);

        // NHIS number (optional) - store as Person Attribute for FHIR mapping
        if (dto.getNhisNumber() != null && !dto.getNhisNumber().trim().isEmpty()) {
            PersonAttributeType nhisAttrType = getPersonAttributeType("NHIS Number");
            if (nhisAttrType != null) {
                PersonAttribute nhisAttr = new PersonAttribute(nhisAttrType, dto.getNhisNumber().trim());
                patient.addAttribute(nhisAttr);
            }
        }

        // Save patient to local database first
        Patient savedPatient = patientService.savePatient(patient);

        // Trigger NHIE sync asynchronously (non-blocking, fire-and-forget)
        try {
            String nhieEnabled = Context.getAdministrationService()
                    .getGlobalProperty("ghana.feature.nhie.sync.enabled", "false");

            if ("true".equalsIgnoreCase(nhieEnabled)) {
                NHIEIntegrationService nhieIntegrationService = getNHIEIntegrationService();
                if (nhieIntegrationService != null) {
                    nhieIntegrationService.syncPatientToNHIE(savedPatient);
                    log.info("NHIE sync triggered for patient: {}", savedPatient.getUuid());
                }
            }
        } catch (Exception e) {
            // Don't throw - patient is already saved locally
            // Failed syncs will be retried by NHIERetryJob
            log.error("Failed to trigger NHIE sync for patient: {}, will retry via background job",
                     savedPatient.getUuid(), e);
        }

        return savedPatient;
    }

    private List<Patient> getByIdentifier(PatientService patientService, String identifier) {
        // OpenMRS 2.6 API: use getPatients method with identifier parameter
        return patientService.getPatients(null, identifier, null, true);
    }

    private PatientIdentifierType getIdentifierType(String name) {
        PatientService patientService = Context.getPatientService();
        PatientIdentifierType type = patientService.getPatientIdentifierTypeByName(name);
        if (type == null) {
            // Create a transient type placeholder to avoid NPEs in tests; in runtime this should exist via metadata
            type = new PatientIdentifierType();
            type.setName(name);
        }
        return type;
    }

    private PersonAttributeType getPersonAttributeType(String name) {
        PersonService personService = Context.getPersonService();
        PersonAttributeType type = personService.getPersonAttributeTypeByName(name);
        if (type == null) {
            // Transient placeholder (runtime should provide real metadata)
            type = new PersonAttributeType();
            type.setName(name);
        }
        return type;
    }

    /**
     * Get NHIE Integration Service from Spring context.
     * Returns null if service not available (e.g., during testing or if NHIE module disabled).
     */
    private NHIEIntegrationService getNHIEIntegrationService() {
        try {
            return Context.getRegisteredComponents(NHIEIntegrationService.class)
                    .stream()
                    .findFirst()
                    .orElse(null);
        } catch (Exception e) {
            try {
                return Context.getService(NHIEIntegrationService.class);
            } catch (Exception ex) {
                log.warn("NHIEIntegrationService not available: {}", ex.getMessage());
                return null;
            }
        }
    }
}
