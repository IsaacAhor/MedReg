package org.openmrs.module.ghanaemr.service;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.openmrs.*;
import org.openmrs.api.*;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.service.impl.ConsultationServiceImpl;

import java.util.*;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class ConsultationServiceTest {

    private MockedStatic<Context> contextMock;
    private EncounterService encounterService;
    private ConceptService conceptService;
    private LocationService locationService;
    private ProviderService providerService;
    private OrderService orderService;

    @Before
    public void setup() {
        contextMock = Mockito.mockStatic(Context.class);
        encounterService = mock(EncounterService.class);
        conceptService = mock(ConceptService.class);
        locationService = mock(LocationService.class);
        providerService = mock(ProviderService.class);
        orderService = mock(OrderService.class);

        contextMock.when(Context::getEncounterService).thenReturn(encounterService);
        contextMock.when(Context::getConceptService).thenReturn(conceptService);
        contextMock.when(Context::getLocationService).thenReturn(locationService);
        contextMock.when(Context::getProviderService).thenReturn(providerService);
        contextMock.when(Context::getOrderService).thenReturn(orderService);

        when(encounterService.saveEncounter(any(Encounter.class))).thenAnswer(inv -> inv.getArgument(0));
        when(encounterService.getEncounterType("OPD Consultation")).thenReturn(new EncounterType());

        // Mock order types and care settings
        when(orderService.getOrderTypeByName(anyString())).thenReturn(new OrderType());
        when(orderService.getCareSettingByName(anyString())).thenReturn(new CareSetting());
        when(orderService.getCareSettings(false)).thenReturn(Collections.singletonList(new CareSetting()));
        when(orderService.saveOrder(any(Order.class), any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @After
    public void tearDown() {
        if (contextMock != null) contextMock.close();
    }

    private Patient newPatient() {
        Patient p = new Patient();
        p.setUuid("12345678-0000-0000-0000-abcdefabcdef");
        PersonName name = new PersonName("A", null, "B");
        p.addName(name);
        return p;
    }

    @Test
    public void recordConsultation_WithDiagnosis_AddsObs() {
        Patient p = newPatient();
        String dxUuid = "11111111-2222-3333-4444-555555555555";
        Concept dx = new Concept(); dx.setUuid(dxUuid);
        when(conceptService.getConceptByUuid(dxUuid)).thenReturn(dx);

        ConsultationService svc = new ConsultationServiceImpl();
        Encounter e = svc.recordConsultation(p, null,
                Collections.singletonList(dxUuid), null, null, null, null);

        assertNotNull(e);
        boolean hasDx = false;
        for (Obs o : e.getObs()) {
            if (o.getConcept() != null && dxUuid.equals(o.getConcept().getUuid())) {
                hasDx = true; break;
            }
        }
        assertTrue(hasDx);
    }
}

