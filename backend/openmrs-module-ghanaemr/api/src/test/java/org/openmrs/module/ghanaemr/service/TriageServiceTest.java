package org.openmrs.module.ghanaemr.service;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.openmrs.*;
import org.openmrs.api.*;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.exception.ValidationException;
import org.openmrs.module.ghanaemr.service.impl.TriageServiceImpl;

import java.util.*;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class TriageServiceTest {

    private MockedStatic<Context> contextMock;
    private EncounterService encounterService;
    private ConceptService conceptService;
    private LocationService locationService;
    private ProviderService providerService;

    private final String UUID_BP_SYS = "5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    private final String UUID_BP_DIA = "5086AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    private final String UUID_TEMP = "5088AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    private final String UUID_WEIGHT = "5089AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    private final String UUID_HEIGHT = "5090AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    private final String UUID_BMI = "1343AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    @Before
    public void setUp() {
        contextMock = Mockito.mockStatic(Context.class);
        encounterService = mock(EncounterService.class);
        conceptService = mock(ConceptService.class);
        locationService = mock(LocationService.class);
        providerService = mock(ProviderService.class);

        contextMock.when(Context::getEncounterService).thenReturn(encounterService);
        contextMock.when(Context::getConceptService).thenReturn(conceptService);
        contextMock.when(Context::getLocationService).thenReturn(locationService);
        contextMock.when(Context::getProviderService).thenReturn(providerService);

        // Default: saveEncounter echoes back the same object
        when(encounterService.saveEncounter(any(Encounter.class))).thenAnswer(inv -> inv.getArgument(0));

        // Default encounter type resolution
        EncounterType triageType = new EncounterType();
        triageType.setName("OPD Triage");
        when(encounterService.getEncounterType("OPD Triage")).thenReturn(triageType);
        when(encounterService.getAllEncounterTypes()).thenReturn(Collections.singletonList(triageType));

        // Concept lookups return numeric concepts by UUID
        when(conceptService.getConceptByUuid(anyString())).thenAnswer(inv -> {
            String uuid = inv.getArgument(0);
            Concept c = new Concept();
            c.setUuid(uuid);
            return c;
        });
    }

    @After
    public void tearDown() {
        if (contextMock != null) contextMock.close();
    }

    private Patient newPatient() {
        Patient p = new Patient();
        p.setUuid("12345678-aaaa-bbbb-cccc-1234567890ab");
        PersonName name = new PersonName("A", null, "B");
        p.addName(name);
        return p;
    }

    @Test
    public void recordVitals_ValidWithinRange_Success() {
        Patient p = newPatient();
        Map<String, Double> vitals = new HashMap<String, Double>();
        vitals.put("bpSystolic", 120d);
        vitals.put("bpDiastolic", 80d);
        vitals.put("temp", 36.7d);
        vitals.put("weight", 70d);
        vitals.put("height", 175d);

        TriageService svc = new TriageServiceImpl();
        Encounter e = svc.recordVitals(p, vitals, null, null);
        assertNotNull(e);
        assertFalse(e.getObs().isEmpty());
    }

    @Test(expected = ValidationException.class)
    public void validateVitals_OutOfRange_ThrowsValidationException() {
        Patient p = newPatient();
        Map<String, Double> vitals = new HashMap<String, Double>();
        vitals.put("bpSystolic", 300d); // out of range
        TriageService svc = new TriageServiceImpl();
        svc.recordVitals(p, vitals, null, null);
    }

    @Test
    public void bmiCalculated_WhenWeightAndHeight_Added() {
        Patient p = newPatient();
        Map<String, Double> vitals = new HashMap<String, Double>();
        vitals.put("weight", 80d);
        vitals.put("height", 200d); // 2m -> BMI = 20

        TriageService svc = new TriageServiceImpl();
        Encounter e = svc.recordVitals(p, vitals, null, null);
        boolean hasBmi = false;
        for (Obs o : e.getObs()) {
            Concept c = o.getConcept();
            if (c != null && UUID_BMI.equals(c.getUuid())) {
                hasBmi = true;
                assertEquals(20d, o.getValueNumeric(), 0.01);
            }
        }
        assertTrue(hasBmi);
    }

    @Test
    public void latestVitals_ReturnsFromMostRecentEncounter() {
        Patient p = newPatient();
        Encounter oldE = new Encounter();
        oldE.setEncounterDatetime(new Date(System.currentTimeMillis() - 86400000));
        Obs o1 = new Obs();
        Concept c1 = new Concept(); c1.setUuid(UUID_TEMPERATURE); o1.setConcept(c1); o1.setValueNumeric(37.2);
        oldE.addObs(o1);

        Encounter newE = new Encounter();
        newE.setEncounterDatetime(new Date());
        Obs o2 = new Obs();
        Concept c2 = new Concept(); c2.setUuid(UUID_BP_SYS); o2.setConcept(c2); o2.setValueNumeric(110d);
        newE.addObs(o2);

        when(encounterService.getEncountersByPatient(any(Patient.class))).thenReturn(Arrays.asList(oldE, newE));

        TriageService svc = new TriageServiceImpl();
        Map<String, Double> out = svc.getLatestVitals(p);
        assertTrue(out.containsKey("bpSystolic"));
        assertEquals(110d, out.get("bpSystolic"), 0.01);
    }

    @Test
    public void updateExisting_SameDay_ReplacesObs() {
        Patient p = newPatient();
        EncounterType triageType = new EncounterType(); triageType.setName("OPD Triage");
        when(encounterService.getEncounterType("OPD Triage")).thenReturn(triageType);

        Encounter today = new Encounter();
        today.setEncounterType(triageType);
        today.setEncounterDatetime(new Date());
        Obs existing = new Obs();
        Concept c = new Concept(); c.setUuid(UUID_TEMPERATURE); existing.setConcept(c); existing.setValueNumeric(35d);
        today.addObs(existing);
        when(encounterService.getEncountersByPatient(any(Patient.class))).thenReturn(Collections.singletonList(today));

        Map<String, Double> vitals = new HashMap<String, Double>();
        vitals.put("temp", 36.5d);
        TriageService svc = new TriageServiceImpl();
        Encounter e = svc.recordVitals(p, vitals, null, null);

        // Expect only one temp obs with updated value
        int countTemp = 0; Double val = null;
        for (Obs o : e.getObs()) {
            if (o.getConcept() != null && UUID_TEMP.equals(o.getConcept().getUuid())) {
                countTemp++; val = o.getValueNumeric();
            }
        }
        assertEquals(1, countTemp);
        assertEquals(36.5d, val, 0.01);
    }
}

