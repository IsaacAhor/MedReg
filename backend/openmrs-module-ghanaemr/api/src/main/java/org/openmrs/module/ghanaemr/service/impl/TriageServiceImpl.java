package org.openmrs.module.ghanaemr.service.impl;

import org.openmrs.*;
import org.openmrs.api.ConceptService;
import org.openmrs.api.EncounterService;
import org.openmrs.api.LocationService;
import org.openmrs.api.ProviderService;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.exception.ValidationException;
import org.openmrs.module.ghanaemr.service.TriageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class TriageServiceImpl implements TriageService {

    private static final Logger log = LoggerFactory.getLogger(TriageServiceImpl.class);

    // Standard OpenMRS concept UUIDs (CIEL conventions)
    private static final String UUID_BP_SYSTOLIC = "5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    private static final String UUID_BP_DIASTOLIC = "5086AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    private static final String UUID_TEMPERATURE = "5088AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    private static final String UUID_WEIGHT = "5089AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    private static final String UUID_HEIGHT = "5090AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    private static final String UUID_BMI = "1343AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    @Override
    public Encounter recordVitals(Patient patient, Map<String, Double> vitals,
                                  String locationUuid, String providerUuid) {
        if (patient == null) {
            throw new ValidationException("Patient is required");
        }
        if (vitals == null) {
            vitals = Collections.emptyMap();
        }

        validateVitals(vitals);

        EncounterService encounterService = Context.getEncounterService();
        ConceptService conceptService = Context.getConceptService();
        LocationService locationService = Context.getLocationService();
        ProviderService providerService = Context.getProviderService();

        Location location = locationUuid != null ? locationService.getLocationByUuid(locationUuid) : null;
        Provider provider = providerUuid != null ? providerService.getProviderByUuid(providerUuid) : null;

        EncounterType triageType = getTriageEncounterType();

        // Reuse today's triage encounter if exists, else create new
        Encounter encounter = findTodayTriageEncounter(patient, triageType);
        boolean isNew = false;
        if (encounter == null) {
            encounter = new Encounter();
            encounter.setPatient(patient);
            encounter.setEncounterDatetime(new Date());
            if (triageType != null) encounter.setEncounterType(triageType);
            isNew = true;
        }
        if (location != null) encounter.setLocation(location);
        if (provider != null) {
            EncounterRole role = getDefaultEncounterRole();
            encounter.addProvider(role, provider);
        }

        // Remove existing obs of same concepts to avoid duplicates
        removeExisting(encounter, UUID_BP_SYSTOLIC);
        removeExisting(encounter, UUID_BP_DIASTOLIC);
        removeExisting(encounter, UUID_TEMPERATURE);
        removeExisting(encounter, UUID_WEIGHT);
        removeExisting(encounter, UUID_HEIGHT);
        removeExisting(encounter, UUID_BMI);

        // Add observations as provided
        Person person = patient.getPerson();
        if (vitals.containsKey("bpSystolic")) {
            Concept c = conceptService.getConceptByUuid(UUID_BP_SYSTOLIC);
            if (c != null) encounter.addObs(createObs(c, vitals.get("bpSystolic"), person, location));
        }
        if (vitals.containsKey("bpDiastolic")) {
            Concept c = conceptService.getConceptByUuid(UUID_BP_DIASTOLIC);
            if (c != null) encounter.addObs(createObs(c, vitals.get("bpDiastolic"), person, location));
        }
        if (vitals.containsKey("temp")) {
            Concept c = conceptService.getConceptByUuid(UUID_TEMPERATURE);
            if (c != null) encounter.addObs(createObs(c, vitals.get("temp"), person, location));
        }
        if (vitals.containsKey("weight")) {
            Concept c = conceptService.getConceptByUuid(UUID_WEIGHT);
            if (c != null) encounter.addObs(createObs(c, vitals.get("weight"), person, location));
        }
        if (vitals.containsKey("height")) {
            Concept c = conceptService.getConceptByUuid(UUID_HEIGHT);
            if (c != null) encounter.addObs(createObs(c, vitals.get("height"), person, location));
        }

        // Auto-calc BMI if weight and height present
        Double w = vitals.get("weight");
        Double h = vitals.get("height");
        if (w != null && h != null && h.doubleValue() > 0d) {
            double meters = h.doubleValue() / 100d;
            double bmi = w.doubleValue() / (meters * meters);
            Concept c = conceptService.getConceptByUuid(UUID_BMI);
            if (c != null) encounter.addObs(createObs(c, bmi, person, location));
        }

        Encounter saved = isNew ? encounterService.saveEncounter(encounter) : encounterService.saveEncounter(encounter);
        log.info("Vitals recorded for patient: {}", mask(patient.getUuid()));
        return saved;
    }

    @Override
    public Map<String, Double> getLatestVitals(Patient patient) {
        Map<String, Double> out = new HashMap<String, Double>();
        if (patient == null) return out;
        EncounterService es = Context.getEncounterService();
        List<Encounter> encs = es.getEncountersByPatient(patient);
        if (encs == null || encs.isEmpty()) return out;

        EncounterType triage = getTriageEncounterType();
        encs.sort(new Comparator<Encounter>() {
            public int compare(Encounter a, Encounter b) {
                Date da = a.getEncounterDatetime();
                Date db = b.getEncounterDatetime();
                if (da == null && db == null) return 0;
                if (da == null) return 1;
                if (db == null) return -1;
                return db.compareTo(da);
            }
        });

        for (Encounter e : encs) {
            if (triage != null && e.getEncounterType() != null && triage.equals(e.getEncounterType())) {
                extractVitals(e, out);
                if (!out.isEmpty()) return out;
            }
        }
        // fallback: any recent encounter containing vitals
        for (Encounter e : encs) {
            extractVitals(e, out);
            if (!out.isEmpty()) return out;
        }
        return out;
    }

    @Override
    public void validateVitals(Map<String, Double> vitals) {
        if (vitals == null) return;
        Double sys = vitals.get("bpSystolic");
        if (sys != null && (sys.doubleValue() < 60d || sys.doubleValue() > 250d)) {
            throw new ValidationException("Systolic BP out of range (60-250)");
        }
        Double dia = vitals.get("bpDiastolic");
        if (dia != null && (dia.doubleValue() < 40d || dia.doubleValue() > 150d)) {
            throw new ValidationException("Diastolic BP out of range (40-150)");
        }
        Double t = vitals.get("temp");
        if (t != null && (t.doubleValue() < 30d || t.doubleValue() > 45d)) {
            throw new ValidationException("Temperature out of range (30-45 °C)");
        }
        Double w = vitals.get("weight");
        if (w != null && (w.doubleValue() < 1d || w.doubleValue() > 300d)) {
            throw new ValidationException("Weight out of range (1-300 kg)");
        }
        Double h = vitals.get("height");
        if (h != null && (h.doubleValue() < 50d || h.doubleValue() > 250d)) {
            throw new ValidationException("Height out of range (50-250 cm)");
        }
    }

    private void extractVitals(Encounter e, Map<String, Double> out) {
        if (e == null || e.getObs() == null) return;
        for (Obs o : e.getObs()) {
            if (o.getConcept() == null) continue;
            String cu = o.getConcept().getUuid();
            if (cu == null) continue;
            if (UUID_BP_SYSTOLIC.equals(cu) && o.getValueNumeric() != null) out.put("bpSystolic", o.getValueNumeric());
            else if (UUID_BP_DIASTOLIC.equals(cu) && o.getValueNumeric() != null) out.put("bpDiastolic", o.getValueNumeric());
            else if (UUID_TEMPERATURE.equals(cu) && o.getValueNumeric() != null) out.put("temp", o.getValueNumeric());
            else if (UUID_WEIGHT.equals(cu) && o.getValueNumeric() != null) out.put("weight", o.getValueNumeric());
            else if (UUID_HEIGHT.equals(cu) && o.getValueNumeric() != null) out.put("height", o.getValueNumeric());
            else if (UUID_BMI.equals(cu) && o.getValueNumeric() != null) out.put("bmi", o.getValueNumeric());
        }
    }

    private EncounterType getTriageEncounterType() {
        // Try by name, fallback to first available type
        EncounterService encounterService = Context.getEncounterService();
        EncounterType type = encounterService.getEncounterType("OPD Triage");
        if (type == null) {
            List<EncounterType> all = encounterService.getAllEncounterTypes();
            if (all != null && !all.isEmpty()) {
                return all.get(0);
            }
        }
        return type;
    }

    private EncounterRole getDefaultEncounterRole() {
        EncounterService es = Context.getEncounterService();
        EncounterRole role = es.getEncounterRoleByUuid(EncounterRole.UNKNOWN_ENCOUNTER_ROLE_UUID);
        if (role == null) {
            // Fallback to the first role to avoid NPE in tests
            List<EncounterRole> roles = es.getAllEncounterRoles(false);
            if (roles != null && !roles.isEmpty()) return roles.get(0);
        }
        return role;
    }

    private void removeExisting(Encounter enc, String conceptUuid) {
        if (enc == null || enc.getObs() == null) return;
        List<Obs> toRemove = new ArrayList<Obs>();
        for (Obs o : enc.getObs()) {
            if (o.getConcept() != null && conceptUuid.equals(o.getConcept().getUuid())) {
                toRemove.add(o);
            }
        }
        for (Obs o : toRemove) enc.removeObs(o);
    }

    private Obs createObs(Concept concept, Double value, Person person, Location location) {
        Obs obs = new Obs();
        obs.setConcept(concept);
        if (value != null) obs.setValueNumeric(value);
        if (person != null) obs.setPerson(person);
        if (location != null) obs.setLocation(location);
        obs.setObsDatetime(new Date());
        return obs;
    }

    private Encounter findTodayTriageEncounter(Patient patient, EncounterType triageType) {
        if (patient == null) return null;
        EncounterService es = Context.getEncounterService();
        List<Encounter> encs = es.getEncountersByPatient(patient);
        if (encs == null) return null;
        Calendar today = Calendar.getInstance();
        int y = today.get(Calendar.YEAR);
        int m = today.get(Calendar.MONTH);
        int d = today.get(Calendar.DAY_OF_MONTH);
        for (Encounter e : encs) {
            if (triageType != null && !triageType.equals(e.getEncounterType())) continue;
            Date dt = e.getEncounterDatetime();
            if (dt == null) continue;
            Calendar c = Calendar.getInstance();
            c.setTime(dt);
            if (c.get(Calendar.YEAR) == y && c.get(Calendar.MONTH) == m && c.get(Calendar.DAY_OF_MONTH) == d) {
                return e;
            }
        }
        return null;
    }

    private String mask(String uuid) {
        if (uuid == null || uuid.length() < 8) return "****";
        return uuid.substring(0, 4) + "****" + uuid.substring(uuid.length() - 2);
    }
}
