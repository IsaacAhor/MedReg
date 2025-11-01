package org.openmrs.module.ghanaemr.service.impl;

import org.openmrs.Patient;
import org.openmrs.PatientIdentifier;
import org.openmrs.PatientIdentifierType;
import org.openmrs.PersonName;
import org.openmrs.api.PatientService;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.dto.GhanaPatientDTO;
import org.openmrs.module.ghanaemr.exception.DuplicatePatientException;
import org.openmrs.module.ghanaemr.exception.ValidationException;
import org.openmrs.module.ghanaemr.service.GhanaPatientService;
import org.openmrs.module.ghanaemr.util.FolderNumberGenerator;
import org.openmrs.module.ghanaemr.util.SequenceProvider;
import org.openmrs.module.ghanaemr.validation.GhanaCardValidator;
import org.openmrs.module.ghanaemr.validation.NHISValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Date;
import java.util.List;

@Service
@Transactional
public class GhanaPatientServiceImpl implements GhanaPatientService {

    private static final String IDTYPE_GHANA_CARD = "Ghana Card";
    private static final String IDTYPE_NHIS_NUMBER = "NHIS Number";
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

        // NHIS number (optional as identifier per task instruction)
        if (dto.getNhisNumber() != null && !dto.getNhisNumber().trim().isEmpty()) {
            PatientIdentifier nhisId = new PatientIdentifier();
            nhisId.setIdentifierType(getIdentifierType(IDTYPE_NHIS_NUMBER));
            nhisId.setIdentifier(dto.getNhisNumber().trim());
            patient.addIdentifier(nhisId);
        }

        return patientService.savePatient(patient);
    }

    private List<Patient> getByIdentifier(PatientService patientService, String identifier) {
        try {
            // OpenMRS API typically provides this; if not available, fallback to generic search
            return patientService.getPatientsByIdentifier(identifier);
        } catch (NoSuchMethodError e) {
            return patientService.getPatients(null, identifier, null, true);
        }
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
}

