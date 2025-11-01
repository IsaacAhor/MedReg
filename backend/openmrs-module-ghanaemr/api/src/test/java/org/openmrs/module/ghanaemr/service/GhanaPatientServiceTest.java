package org.openmrs.module.ghanaemr.service;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.openmrs.Patient;
import org.openmrs.PatientIdentifierType;
import org.openmrs.api.PatientService;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.dto.GhanaPatientDTO;
import org.openmrs.module.ghanaemr.exception.DuplicatePatientException;
import org.openmrs.module.ghanaemr.exception.ValidationException;
import org.openmrs.module.ghanaemr.service.impl.GhanaPatientServiceImpl;
import org.openmrs.module.ghanaemr.util.SequenceProvider;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class GhanaPatientServiceTest {

    private MockedStatic<Context> contextMock;
    private PatientService patientService;
    private SequenceProvider sequenceProvider;

    @Before
    public void setUp() {
        contextMock = Mockito.mockStatic(Context.class);
        patientService = mock(PatientService.class);
        contextMock.when(Context::getPatientService).thenReturn(patientService);

        // Default identifier types by name
        when(patientService.getPatientIdentifierTypeByName("Ghana Card")).thenReturn(new PatientIdentifierType());
        when(patientService.getPatientIdentifierTypeByName("Folder Number")).thenReturn(new PatientIdentifierType());
        when(patientService.getPatientIdentifierTypeByName("NHIS Number")).thenReturn(new PatientIdentifierType());

        // Save returns the same patient instance
        when(patientService.savePatient(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Sequence provider increments from 1
        final int[] seq = new int[] {0};
        sequenceProvider = prefix -> ++seq[0];
    }

    @After
    public void tearDown() {
        if (contextMock != null) {
            contextMock.close();
        }
    }

    private GhanaPatientDTO sampleDto(String ghanaCard, String nhis) {
        GhanaPatientDTO dto = new GhanaPatientDTO();
        dto.setGhanaCard(ghanaCard);
        dto.setNhisNumber(nhis);
        dto.setGivenName("Kwame");
        dto.setFamilyName("Mensah");
        dto.setGender("M");
        dto.setDateOfBirth(new Date(85, Calendar.MARCH, 15));
        dto.setRegionCode("GA");
        dto.setFacilityCode("KBTH");
        return dto;
    }

    @Test
    public void registerPatient_ValidGhanaCard_Success() {
        // Ghana Card with correct Luhn check digit for 123456789 is 7
        GhanaPatientDTO dto = sampleDto("GHA-123456789-7", "0123456789");

        when(patientService.getPatientsByIdentifier("GHA-123456789-7")).thenReturn(Collections.emptyList());

        GhanaPatientService service = new GhanaPatientServiceImpl(sequenceProvider);
        Patient created = service.registerPatient(dto);

        assertNotNull(created);
        assertTrue(created.getIdentifiers().stream().anyMatch(pi -> "GHA-123456789-7".equals(pi.getIdentifier())));
        assertTrue(created.getIdentifiers().stream().anyMatch(pi -> pi.getIdentifier().startsWith("GA-KBTH-")));
        assertTrue(created.getIdentifiers().stream().anyMatch(pi -> "0123456789".equals(pi.getIdentifier())));
    }

    @Test(expected = ValidationException.class)
    public void registerPatient_InvalidGhanaCardChecksum_ThrowsValidationException() {
        GhanaPatientDTO dto = sampleDto("GHA-123456789-0", null); // wrong check digit
        GhanaPatientService service = new GhanaPatientServiceImpl(sequenceProvider);
        service.registerPatient(dto);
    }

    @Test(expected = DuplicatePatientException.class)
    public void registerPatient_DuplicateGhanaCard_ThrowsDuplicatePatientException() {
        GhanaPatientDTO dto = sampleDto("GHA-123456789-7", null);
        List<Patient> dupList = new ArrayList<>();
        dupList.add(new Patient());
        when(patientService.getPatientsByIdentifier("GHA-123456789-7")).thenReturn(dupList);

        GhanaPatientService service = new GhanaPatientServiceImpl(sequenceProvider);
        service.registerPatient(dto);
    }

    @Test
    public void folderNumberGeneration_IncrementsSequence() {
        GhanaPatientService service = new GhanaPatientServiceImpl(sequenceProvider);
        GhanaPatientDTO dto1 = sampleDto("GHA-123456789-7", null);
        when(patientService.getPatientsByIdentifier("GHA-123456789-7")).thenReturn(Collections.emptyList());

        Patient p1 = service.registerPatient(dto1);
        String folder1 = p1.getIdentifiers().stream()
                .map(i -> i.getIdentifier())
                .filter(id -> id.startsWith("GA-KBTH-"))
                .findFirst().orElse("");

        GhanaPatientDTO dto2 = sampleDto("GHA-987654321-7", null);
        when(patientService.getPatientsByIdentifier("GHA-987654321-7")).thenReturn(Collections.emptyList());
        Patient p2 = service.registerPatient(dto2);
        String folder2 = p2.getIdentifiers().stream()
                .map(i -> i.getIdentifier())
                .filter(id -> id.startsWith("GA-KBTH-"))
                .findFirst().orElse("");

        assertNotEquals(folder1, folder2);
    }
}

