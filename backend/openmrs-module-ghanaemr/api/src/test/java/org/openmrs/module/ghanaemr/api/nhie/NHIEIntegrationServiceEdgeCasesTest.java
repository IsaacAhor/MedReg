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
import org.openmrs.PersonAttribute;
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

/**
 * Edge case coverage for NHIEIntegrationService
 */
public class NHIEIntegrationServiceEdgeCasesTest {

    private MockedStatic<Context> contextMock;
    private PatientService patientService;
    private PersonService personService;
    private FhirPatientMapper fhirMapper;
    private NHIEHttpClient nhieClient;
    private NHIETransactionLogger txLogger;
    private NHIEIntegrationServiceImpl service;

    private PersonAttributeType nhieIdAttrType;

    @Before
    public void setUp() {
        contextMock = Mockito.mockStatic(Context.class);
        patientService = mock(PatientService.class);
        personService = mock(PersonService.class);
        fhirMapper = mock(FhirPatientMapper.class);
        nhieClient = mock(NHIEHttpClient.class);
        txLogger = mock(NHIETransactionLogger.class);

        contextMock.when(Context::getPatientService).thenReturn(patientService);
        contextMock.when(Context::getPersonService).thenReturn(personService);
        contextMock.when(Context::getRuntimeProperties).thenReturn(new Properties());

        nhieIdAttrType = new PersonAttributeType();
        nhieIdAttrType.setName("NHIE Patient ID");
        when(personService.getPersonAttributeTypeByName("NHIE Patient ID")).thenReturn(nhieIdAttrType);

        when(patientService.savePatient(any(Patient.class))).thenAnswer(inv -> inv.getArgument(0));

        service = new NHIEIntegrationServiceImpl(fhirMapper, nhieClient, txLogger);
    }

    @After
    public void tearDown() {
        if (contextMock != null) contextMock.close();
    }

    private Patient patientWithGhanaCard(String ghanaCard) {
        Patient p = new Patient();
        Person person = new Person();
        p.setPerson(person);
        PatientIdentifierType t = new PatientIdentifierType();
        t.setName("Ghana Card");
        PatientIdentifier id = new PatientIdentifier();
        id.setIdentifier(ghanaCard);
        id.setIdentifierType(t);
        p.addIdentifier(id);
        p.setPatientId(7);
        return p;
    }

    @Test(expected = IllegalArgumentException.class)
    public void syncPatient_NoGhanaCard_ThrowsIllegalArgument() throws Exception {
        Patient p = new Patient();
        p.setPerson(new Person());
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());
        service.syncPatientToNHIE(p);
    }

    @Test
    public void handleDuplicatePatient_NoIdInResponse_ReturnsNull() {
        Patient p = patientWithGhanaCard("GHA-123456789-7");
        NHIEResponse conflict = new NHIEResponse();
        conflict.setStatusCode(409);
        conflict.setResponseBody("{\"resourceType\":\"OperationOutcome\"}");

        String result = service.handleDuplicatePatient(p, conflict);
        assertNull(result);
    }

    @Test
    public void handleDuplicatePatient_UpdatesDifferentExistingId() {
        Patient p = patientWithGhanaCard("GHA-123456789-7");
        // Existing attribute has different value
        PersonAttribute attr = new PersonAttribute();
        attr.setAttributeType(nhieIdAttrType);
        attr.setValue("patient-old");
        attr.setPerson(p.getPerson());
        p.getPerson().addAttribute(attr);

        NHIEResponse conflict = new NHIEResponse();
        conflict.setStatusCode(409);
        conflict.setResponseBody("{\"id\":\"patient-new\"}");

        String result = service.handleDuplicatePatient(p, conflict);
        assertEquals("patient-new", result);
        assertEquals("patient-new", p.getPerson().getAttribute(nhieIdAttrType).getValue());
    }

    @Test
    public void getNHIEPatientId_NoAttributeTypeConfigured_ReturnsNull() {
        when(personService.getPersonAttributeTypeByName("NHIE Patient ID")).thenReturn(null);
        Patient p = patientWithGhanaCard("GHA-123456789-7");
        assertNull(service.getNHIEPatientId(p));
    }

    @Test(expected = IllegalStateException.class)
    public void storeNHIEPatientId_NoAttributeTypeConfigured_Throws() {
        when(personService.getPersonAttributeTypeByName("NHIE Patient ID")).thenReturn(null);
        Patient p = patientWithGhanaCard("GHA-123456789-7");
        service.storeNHIEPatientId(p, "patient-1");
    }

    @Test
    public void successWithoutHeader_WithBodyId_ExtractsAndStores() throws Exception {
        Patient p = patientWithGhanaCard("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());

        NHIEResponse resp = new NHIEResponse();
        resp.setStatusCode(201);
        resp.setSuccess(true);
        resp.setNhieResourceId(null);
        resp.setResponseBody("{\"resourceType\":\"Patient\",\"id\":\"patient-body\"}");
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(resp);

        String id = service.syncPatientToNHIE(p);
        assertEquals("patient-body", id);
        assertEquals("patient-body", p.getPerson().getAttribute(nhieIdAttrType).getValue());
    }

    @Test
    public void successWithoutAnyId_ThrowsIntegrationException() throws Exception {
        Patient p = patientWithGhanaCard("GHA-123456789-7");
        when(fhirMapper.toFhirPatient(any(Patient.class))).thenReturn(new org.hl7.fhir.r4.model.Patient());

        NHIEResponse resp = new NHIEResponse();
        resp.setStatusCode(201);
        resp.setSuccess(true);
        resp.setNhieResourceId(null);
        resp.setResponseBody("{\"resourceType\":\"Patient\"}");
        when(nhieClient.submitPatient(anyString(), anyString())).thenReturn(resp);

        try {
            service.syncPatientToNHIE(p);
            fail("Expected NHIEIntegrationException");
        } catch (NHIEIntegrationException e) {
            assertTrue(e.getMessage().contains("no patient ID"));
        }
    }

    @Test
    public void maskIdentifier_VariousPatterns() throws Exception {
        Method m = NHIEIntegrationServiceImpl.class.getDeclaredMethod("maskIdentifier", String.class);
        m.setAccessible(true);

        // Ghana Card
        String gh = (String) m.invoke(service, "GHA-123456789-7");
        assertTrue(gh.startsWith("GHA-1234"));
        assertTrue(gh.endsWith("-*"));

        // NHIS
        String nh = (String) m.invoke(service, "0123456789");
        assertEquals("0123******", nh);

        // Generic
        String gen = (String) m.invoke(service, "abcdefgh");
        assertTrue(gen.startsWith("abcd"));
    }
}

