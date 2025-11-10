package org.openmrs.module.ghanaemr.service.impl;

import org.openmrs.*;
import org.openmrs.api.*;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.exception.ValidationException;
import org.openmrs.module.ghanaemr.service.ConsultationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Transactional
public class ConsultationServiceImpl implements ConsultationService {

    private static final Logger log = LoggerFactory.getLogger(ConsultationServiceImpl.class);

    @Override
    public Encounter recordConsultation(Patient patient,
                                        String chiefComplaint,
                                        List<String> diagnosisConceptUuids,
                                        List<String> drugUuids,
                                        List<String> labConceptUuids,
                                        String locationUuid,
                                        String providerUuid) {
        if (patient == null) {
            throw new ValidationException("Patient is required");
        }

        EncounterService encounterService = Context.getEncounterService();
        LocationService locationService = Context.getLocationService();
        ProviderService providerService = Context.getProviderService();

        Encounter encounter = new Encounter();
        encounter.setPatient(patient);
        encounter.setEncounterDatetime(new Date());

        EncounterType consultType = getConsultationEncounterType();
        if (consultType != null) encounter.setEncounterType(consultType);

        if (locationUuid != null) {
            Location loc = locationService.getLocationByUuid(locationUuid);
            if (loc != null) encounter.setLocation(loc);
        }
        if (providerUuid != null) {
            Provider provider = providerService.getProviderByUuid(providerUuid);
            if (provider != null) {
                encounter.addProvider(getDefaultEncounterRole(), provider);
            }
        }

        // Chief complaint (free text) if provided — try concept by name, else skip
        if (chiefComplaint != null && !chiefComplaint.trim().isEmpty()) {
            addChiefComplaintObs(encounter, chiefComplaint);
        }

        // Diagnoses (coded)
        if (diagnosisConceptUuids != null) {
            for (String dxUuid : diagnosisConceptUuids) {
                addDiagnosis(encounter, dxUuid);
            }
        }

        // Persist encounter early so orders can reference it
        encounter = encounterService.saveEncounter(encounter);

        // Prescriptions
        if (drugUuids != null) {
            for (String drugUuid : drugUuids) {
                prescribeDrug(encounter, drugUuid, null, null);
            }
        }

        // Lab orders
        if (labConceptUuids != null) {
            for (String testUuid : labConceptUuids) {
                orderLab(encounter, testUuid, null);
            }
        }

        log.info("Consultation recorded for patient: {}", mask(patient.getUuid()));
        return encounter;
    }

    @Override
    public Encounter addDiagnosis(Encounter encounter, String diagnosisConceptUuid) {
        if (encounter == null) throw new ValidationException("Encounter is required");
        if (diagnosisConceptUuid == null || diagnosisConceptUuid.trim().isEmpty()) return encounter;

        ConceptService conceptService = Context.getConceptService();
        Concept dx = conceptService.getConceptByUuid(diagnosisConceptUuid);
        if (dx == null) return encounter; // silently skip if concept not found

        Obs obs = new Obs();
        obs.setConcept(dx);
        obs.setPerson(encounter.getPatient().getPerson());
        obs.setEncounter(encounter);
        obs.setObsDatetime(new Date());
        encounter.addObs(obs);
        return encounter;
    }

    @Override
    public DrugOrder prescribeDrug(Encounter encounter, String drugUuid, Double dose, Integer durationDays) {
        if (encounter == null) throw new ValidationException("Encounter is required");
        if (drugUuid == null || drugUuid.trim().isEmpty()) return null;

        OrderService orderService = Context.getOrderService();
        ConceptService conceptService = Context.getConceptService();
        Provider provider = getAnyEncounterProvider(encounter);
        CareSetting careSetting = getOutpatientCareSetting();

        Drug drug = conceptService.getDrugByUuid(drugUuid);
        if (drug == null) return null;

        DrugOrder order = new DrugOrder();
        order.setPatient(encounter.getPatient());
        order.setEncounter(encounter);
        order.setOrderType(orderService.getOrderTypeByName("Drug order"));
        order.setCareSetting(careSetting);
        order.setOrderer(provider);
        order.setAction(Order.Action.NEW);
        order.setDrug(drug);
        if (dose != null) order.setDose(dose);
        if (durationDays != null) {
            order.setDuration(durationDays);
            List<Concept> durationUnits = orderService.getDurationUnits();
            if (durationUnits != null && !durationUnits.isEmpty()) {
                order.setDurationUnits(durationUnits.get(0));
            }
        }
        return (DrugOrder) orderService.saveOrder(order, null);
    }

    @Override
    public TestOrder orderLab(Encounter encounter, String testConceptUuid, String instructions) {
        if (encounter == null) throw new ValidationException("Encounter is required");
        if (testConceptUuid == null || testConceptUuid.trim().isEmpty()) return null;

        OrderService orderService = Context.getOrderService();
        ConceptService conceptService = Context.getConceptService();
        Provider provider = getAnyEncounterProvider(encounter);
        CareSetting careSetting = getOutpatientCareSetting();

        Concept testConcept = conceptService.getConceptByUuid(testConceptUuid);
        if (testConcept == null) return null;

        TestOrder order = new TestOrder();
        order.setPatient(encounter.getPatient());
        order.setEncounter(encounter);
        order.setOrderType(orderService.getOrderTypeByName("Test order"));
        order.setCareSetting(careSetting);
        order.setOrderer(provider);
        order.setAction(Order.Action.NEW);
        order.setConcept(testConcept);
        if (instructions != null) order.setInstructions(instructions);
        return (TestOrder) orderService.saveOrder(order, null);
    }

    private void addChiefComplaintObs(Encounter encounter, String complaint) {
        ConceptService conceptService = Context.getConceptService();
        // Try to resolve a commonly-named concept; if not found, skip
        Concept cc = conceptService.getConceptByName("Chief Complaint");
        if (cc == null) return;

        Obs obs = new Obs();
        obs.setConcept(cc);
        obs.setPerson(encounter.getPatient().getPerson());
        obs.setEncounter(encounter);
        obs.setObsDatetime(new Date());
        obs.setValueText(complaint);
        encounter.addObs(obs);
    }

    private EncounterType getConsultationEncounterType() {
        EncounterService es = Context.getEncounterService();
        EncounterType type = es.getEncounterType("OPD Consultation");
        if (type == null) {
            List<EncounterType> all = es.getAllEncounterTypes();
            if (all != null && !all.isEmpty()) return all.get(0);
        }
        return type;
    }

    private EncounterRole getDefaultEncounterRole() {
        EncounterService es = Context.getEncounterService();
        EncounterRole role = es.getEncounterRoleByUuid(EncounterRole.UNKNOWN_ENCOUNTER_ROLE_UUID);
        if (role == null) {
            List<EncounterRole> all = es.getAllEncounterRoles(false);
            if (all != null && !all.isEmpty()) return all.get(0);
        }
        return role;
    }

    private Provider getAnyEncounterProvider(Encounter encounter) {
        Map<EncounterRole, Set<Provider>> map = encounter.getProvidersByRoles();
        if (map != null) {
            for (Set<Provider> providers : map.values()) {
                if (providers != null && !providers.isEmpty()) return providers.iterator().next();
            }
        }
        // fallback to any provider in system
        List<Provider> list = Context.getProviderService().getAllProviders(false);
        return (list != null && !list.isEmpty()) ? list.get(0) : null;
    }

    private CareSetting getOutpatientCareSetting() {
        OrderService os = Context.getOrderService();
        CareSetting out = os.getCareSettingByName("Outpatient");
        if (out == null) {
            List<CareSetting> all = os.getCareSettings(false);
            if (all != null && !all.isEmpty()) return all.get(0);
        }
        return out;
    }

    private String mask(String uuid) {
        if (uuid == null || uuid.length() < 8) return "****";
        return uuid.substring(0, 4) + "****" + uuid.substring(uuid.length() - 2);
    }
}

