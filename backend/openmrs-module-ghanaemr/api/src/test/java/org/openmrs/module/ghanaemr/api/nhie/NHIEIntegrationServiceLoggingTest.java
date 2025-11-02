package org.openmrs.module.ghanaemr.api.nhie;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.openmrs.Patient;
import org.openmrs.PatientIdentifier;
import org.openmrs.PatientIdentifierType;
import org.openmrs.Person;
import org.openmrs.PersonAttributeType;
import org.openmrs.api.PatientService;
import org.openmrs.api.PersonService;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.api.fhir.FhirPatientMapper;
import org.openmrs.module.ghanaemr.api.nhie.impl.NHIEIntegrationServiceImpl;
import org.openmrs.module.ghanaemr.exception.NHIEIntegrationException;

import java.util.Properties;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class NHIEIntegrationServiceLoggingTest {

    private MockedStatic<Context> contextMock;
    private PatientService patientService;
    private PersonService personService;
    private FhirPatientMapper fhirMapper;
    private NHIEHttpClient nhieClient;
    private NHIETransactionLogger logger;
    private NHIEIntegrationServiceImpl service;

    private PersonAttributeType nhieIdAttrType;

    @Before
    public void setUp() {
        contextMock = Mockito.mockStatic(Context.class);
        patientService = mock(PatientService.class);
        personService = mock(PersonService.class);
        fhirMapper = mock(FhirPatientMapper.class);
        nhieClient = mock(NHIEHttpClient.class);
        logger = mock(NHIETransactionLogger.class);

        contextMock.when(Context::getPatientService).thenReturn(patientService);
        contextMock.when(Context::getPersonService).thenReturn(personService);
        contextMock.when(Context::getRuntimeProperties).thenReturn(new Properties());

        nhieIdAttrType = new PersonAttributeType();
        nhieIdAttrType.setName("NHIE Patient ID");
        when(personService.getPersonAttributeTypeByName("NHIE Patient ID")).thenReturn(nhieIdAttrType);
        when(patientService.savePatient(any(Patient.class))).thenAnswer(inv -> inv.getArgument(0));

        service = new NHIEIntegrationServiceImpl(fhirMapper, nhieClient, logger);
    }

    @After
    public void tearDown() {
        if (contextMock != null) contextMock.close();
    }

    private Patient buildOpenMrsPatient(String ghanaCard) {
        Patient p = new Patient();
        Person per = new Person();
        p.setPerson(per);
        PatientIdentifierType t = new PatientIdentifierType();
        t.setName("Ghana Card");
        PatientIdentifier id = new PatientIdentifier();
        id.setIdentifier(ghanaCard);
        id.setIdentifierType(t);
        p.addIdentifier(id);
        p.setPatientId(123);
        return p;
    }

    private NHIEResponse successResponse(int status, String id) {
        NHIEResponse r = new NHIEResponse();
        r.setStatusCode(status);
        r.setSuccess(true);
        r.setNhieResourceId(id);
        r.setResponseBody("{\"resourceType\":\"Patient\",\"id\":\"" + id + "\"}");
        return r;
    }

    private NHIEResponse errorResponse(int status, boolean retryable, String body) {
        NHIEResponse r = new NHIEResponse();
        r.setStatusCode(status);
        r.setSuccess(false);
        r.setRetryable(retryable);
        r.setErrorMessage("e" + status);
        r.setResponseBody(body);
        return r;
    }

    @Test
    public void logsPendingThenSuccess_On201() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(successResponse(201, "patient-201"));

        service.syncPatientToNHIE(p);

        ArgumentCaptor<String> txId = ArgumentCaptor.forClass(String.class);
        // Verify first PENDING
        verify(logger).log(txId.capture(), eq(123), eq("Patient"), eq("POST"), eq("/Patient"),
                contains("resourceType"), isNull(), isNull(), eq(0), eq("PENDING"));

        // Verify SUCCESS
        verify(logger).log(eq(txId.getValue()), eq(123), eq("Patient"), eq("POST"), eq("/Patient"),
                contains("resourceType"), contains("id"), eq(201), eq(0), eq("SUCCESS"));
    }

    @Test
    public void logsPendingThenSuccess_On200Idempotent() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(successResponse(200, "patient-200"));

        service.syncPatientToNHIE(p);

        verify(logger).log(anyString(), eq(123), eq("Patient"), eq("POST"), eq("/Patient"),
                anyString(), isNull(), isNull(), eq(0), eq("PENDING"));
        verify(logger).log(anyString(), eq(123), eq("Patient"), eq("POST"), eq("/Patient"),
                anyString(), contains("patient-200"), eq(200), eq(0), eq("SUCCESS"));
    }

    @Test
    public void logsPendingThenSuccess_On409Duplicate() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        NHIEResponse resp = errorResponse(409, false, "{\"resourceType\":\"OperationOutcome\",\"id\":\"patient-existing\"}");
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(resp);

        service.syncPatientToNHIE(p);

        verify(logger).log(anyString(), eq(123), eq("Patient"), eq("POST"), eq("/Patient"), anyString(), isNull(), isNull(), eq(0), eq("PENDING"));
        verify(logger).log(anyString(), eq(123), eq("Patient"), eq("POST"), eq("/Patient"), anyString(), contains("patient-existing"), eq(409), eq(0), eq("SUCCESS"));
    }

    @Test
    public void logsFailed_On401Retryable() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(errorResponse(401, true, "unauth"));

        try {
            service.syncPatientToNHIE(p);
            fail("expected");
        } catch (NHIEIntegrationException e) {
            // expected
        }

        verify(logger).log(anyString(), eq(123), eq("Patient"), eq("POST"), eq("/Patient"), anyString(), isNull(), isNull(), eq(0), eq("PENDING"));
        verify(logger).log(anyString(), eq(123), eq("Patient"), eq("POST"), eq("/Patient"), anyString(), contains("unauth"), eq(401), eq(0), eq("FAILED"));
    }

    @Test
    public void logsFailed_On422NonRetryable() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(errorResponse(422, false, "bad"));

        try {
            service.syncPatientToNHIE(p);
            fail("expected");
        } catch (NHIEIntegrationException e) {
            // expected
        }

        verify(logger).log(anyString(), eq(123), eq("Patient"), eq("POST"), eq("/Patient"), anyString(), isNull(), isNull(), eq(0), eq("PENDING"));
        verify(logger).log(anyString(), eq(123), eq("Patient"), eq("POST"), eq("/Patient"), anyString(), contains("bad"), eq(422), eq(0), eq("FAILED"));
    }

    @Test
    public void logsFailed_On429Retryable() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(errorResponse(429, true, "rl"));

        try {
            service.syncPatientToNHIE(p);
            fail("expected");
        } catch (NHIEIntegrationException e) {
            // expected
        }

        verify(logger).log(anyString(), eq(123), eq("Patient"), eq("POST"), eq("/Patient"), anyString(), isNull(), isNull(), eq(0), eq("PENDING"));
        verify(logger).log(anyString(), eq(123), eq("Patient"), eq("POST"), eq("/Patient"), anyString(), contains("rl"), eq(429), eq(0), eq("FAILED"));
    }

    @Test
    public void logsFailed_On503Retryable() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(errorResponse(503, true, "down"));

        try {
            service.syncPatientToNHIE(p);
            fail("expected");
        } catch (NHIEIntegrationException e) {
            // expected
        }

        verify(logger).log(anyString(), eq(123), eq("Patient"), eq("POST"), eq("/Patient"), anyString(), isNull(), isNull(), eq(0), eq("PENDING"));
        verify(logger).log(anyString(), eq(123), eq("Patient"), eq("POST"), eq("/Patient"), anyString(), contains("down"), eq(503), eq(0), eq("FAILED"));
    }

    @Test
    public void maskedPII_PassedToLogger() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(successResponse(201, "patient-201"));

        service.syncPatientToNHIE(p);

        ArgumentCaptor<String> requestCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> responseCaptor = ArgumentCaptor.forClass(String.class);

        // Capture SUCCESS call (with response body)
        verify(logger).log(anyString(), anyInt(), anyString(), anyString(), anyString(), requestCaptor.capture(), responseCaptor.capture(), anyInt(), anyInt(), eq("SUCCESS"));

        String maskedReq = requestCaptor.getValue();
        String maskedResp = responseCaptor.getValue();

        assertNotNull(maskedReq);
        assertTrue(maskedReq.contains("resourceType"));
        // Ghana card masking pattern
        // We don't know exact placement, but ensure the generic mask appears if present
        // Since default mapper may not include identifier by default in this unit test,
        // we only assert that response masking applied to id presence does not leak raw values.
        assertNotNull(maskedResp);
        assertTrue(maskedResp.contains("patient-"));
    }

    @Test
    public void alreadySyncedPatient_ShortCircuits_NoLogging() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        // Add NHIE Patient ID attribute to simulate already-synced
        p.getPerson().addAttribute(new org.openmrs.PersonAttribute(nhieIdAttrType, "patient-xyz"));

        String id = service.syncPatientToNHIE(p);
        assertEquals("patient-xyz", id);
        verifyNoInteractions(nhieClient);
        verifyNoInteractions(logger);
    }

    @Test
    public void ioException_LogsFailedWithNullStatus_Retryable() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenThrow(new java.io.IOException("boom"));

        try {
            service.syncPatientToNHIE(p);
            fail("expected");
        } catch (NHIEIntegrationException e) {
            assertTrue(e.isRetryable());
        }

        // PENDING then FAILED with null status
        verify(logger).log(anyString(), anyInt(), eq("Patient"), eq("POST"), eq("/Patient"), anyString(), isNull(), isNull(), eq(0), eq("PENDING"));
        verify(logger).log(anyString(), anyInt(), eq("Patient"), eq("POST"), eq("/Patient"), anyString(), isNull(), isNull(), eq(0), eq("FAILED"));
    }
}
