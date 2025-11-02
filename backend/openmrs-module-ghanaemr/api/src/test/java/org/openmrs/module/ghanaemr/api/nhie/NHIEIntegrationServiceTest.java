package org.openmrs.module.ghanaemr.api.nhie;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
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

import java.lang.reflect.Method;
import java.util.Properties;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class NHIEIntegrationServiceTest {

    private MockedStatic<Context> contextMock;
    private PatientService patientService;
    private PersonService personService;
    private FhirPatientMapper fhirMapper;
    private NHIEHttpClient nhieClient;
    private NHIEIntegrationServiceImpl service;

    private PersonAttributeType nhieIdAttrType;

    @Before
    public void setUp() {
        contextMock = Mockito.mockStatic(Context.class);
        patientService = mock(PatientService.class);
        personService = mock(PersonService.class);
        fhirMapper = mock(FhirPatientMapper.class);
        nhieClient = mock(NHIEHttpClient.class);

        contextMock.when(Context::getPatientService).thenReturn(patientService);
        contextMock.when(Context::getPersonService).thenReturn(personService);

        // Ensure logTransaction doesn't try to open DB connection
        Properties props = new Properties();
        contextMock.when(Context::getRuntimeProperties).thenReturn(props);

        // Person attribute type for NHIE Patient ID
        nhieIdAttrType = new PersonAttributeType();
        nhieIdAttrType.setName("NHIE Patient ID");
        when(personService.getPersonAttributeTypeByName("NHIE Patient ID")).thenReturn(nhieIdAttrType);

        // Save returns same patient
        when(patientService.savePatient(any(Patient.class))).thenAnswer(inv -> inv.getArgument(0));

        service = new NHIEIntegrationServiceImpl(fhirMapper, nhieClient);
    }

    @After
    public void tearDown() {
        if (contextMock != null) contextMock.close();
    }

    private Patient buildOpenMrsPatient(String ghanaCard) {
        Patient p = new Patient();
        Person person = new Person();
        p.setPerson(person);

        PatientIdentifierType ghType = new PatientIdentifierType();
        ghType.setName("Ghana Card");
        PatientIdentifier ghId = new PatientIdentifier();
        ghId.setIdentifier(ghanaCard);
        ghId.setIdentifierType(ghType);
        p.addIdentifier(ghId);
        return p;
    }

    private NHIEResponse successResponse(int status, String nhieId) {
        NHIEResponse r = new NHIEResponse();
        r.setStatusCode(status);
        r.setSuccess(true);
        r.setNhieResourceId(nhieId);
        r.setResponseBody("{\"resourceType\":\"Patient\",\"id\":\"" + nhieId + "\"}");
        return r;
    }

    private NHIEResponse errorResponse(int status, boolean retryable, String body) {
        NHIEResponse r = new NHIEResponse();
        r.setStatusCode(status);
        r.setSuccess(false);
        r.setRetryable(retryable);
        r.setErrorMessage("err" + status);
        r.setResponseBody(body);
        return r;
    }

    @Test
    public void syncPatient_Success201_StoresIdAndReturns() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");

        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(successResponse(201, "patient-201"));

        String id = service.syncPatientToNHIE(p);

        assertEquals("patient-201", id);
        assertNotNull(p.getPerson().getAttribute(nhieIdAttrType));
        assertEquals("patient-201", p.getPerson().getAttribute(nhieIdAttrType).getValue());
        verify(patientService, times(1)).savePatient(any(Patient.class));
    }

    @Test
    public void syncPatient_Success200_StoresIdAndReturns() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(successResponse(200, "patient-200"));

        String id = service.syncPatientToNHIE(p);
        assertEquals("patient-200", id);
        assertEquals("patient-200", p.getPerson().getAttribute(nhieIdAttrType).getValue());
    }

    @Test
    public void syncPatient_Conflict409_ExtractsExistingIdAndStores() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());

        NHIEResponse conflict = errorResponse(409, false, "{\"resourceType\":\"OperationOutcome\",\"id\":\"patient-existing\"}");
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(conflict);

        String id = service.syncPatientToNHIE(p);
        assertEquals("patient-existing", id);
        assertEquals("patient-existing", p.getPerson().getAttribute(nhieIdAttrType).getValue());
        verify(patientService, times(1)).savePatient(any(Patient.class));
    }

    @Test
    public void syncPatient_Auth401_ThrowsRetryableException() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(errorResponse(401, true, "unauth"));

        try {
            service.syncPatientToNHIE(p);
            fail("Expected NHIEIntegrationException");
        } catch (NHIEIntegrationException e) {
            assertEquals(401, (int) e.getStatusCode());
            assertTrue(e.isRetryable());
        }
    }

    @Test
    public void syncPatient_Validation422_ThrowsNonRetryable() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(errorResponse(422, false, "bad"));

        try {
            service.syncPatientToNHIE(p);
            fail("Expected NHIEIntegrationException");
        } catch (NHIEIntegrationException e) {
            assertEquals(422, (int) e.getStatusCode());
            assertFalse(e.isRetryable());
        }
    }

    @Test
    public void syncPatient_RateLimited429_Retryable() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(errorResponse(429, true, "rl"));

        try {
            service.syncPatientToNHIE(p);
            fail("Expected NHIEIntegrationException");
        } catch (NHIEIntegrationException e) {
            assertEquals(429, (int) e.getStatusCode());
            assertTrue(e.isRetryable());
        }
    }

    @Test
    public void syncPatient_Server503_Retryable() throws Exception {
        Patient p = buildOpenMrsPatient("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(errorResponse(503, true, "down"));

        try {
            service.syncPatientToNHIE(p);
            fail("Expected NHIEIntegrationException");
        } catch (NHIEIntegrationException e) {
            assertEquals(503, (int) e.getStatusCode());
            assertTrue(e.isRetryable());
        }
    }

    @Test
    public void maskPII_JsonText_MasksGhanaCardNHISAndNames() throws Exception {
        String json = "{\"identifier\":[{\"system\":\"http://moh.gov.gh/fhir/identifier/ghana-card\",\"value\":\"GHA-123456789-7\"},{\"system\":\"http://moh.gov.gh/fhir/identifier/nhis\",\"value\":\"0123456789\"}],\"name\":[{\"given\":[\"Kwame\"],\"family\":\"Mensah\"}]}";

        Method m = NHIEIntegrationServiceImpl.class.getDeclaredMethod("maskPII", String.class);
        m.setAccessible(true);
        String masked = (String) m.invoke(service, json);

        // Ghana Card masked pattern
        assertTrue(masked.contains("GHA-1234****-*"));
        // NHIS masked pattern
        assertTrue(masked.contains("0123******"));
        // Names masked (K***e)
        assertTrue(masked.contains("\"K***e\""));
    }
}

