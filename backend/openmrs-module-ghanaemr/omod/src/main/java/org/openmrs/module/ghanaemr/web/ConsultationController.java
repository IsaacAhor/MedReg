package org.openmrs.module.ghanaemr.web;

import org.openmrs.Encounter;
import org.openmrs.Patient;
import org.openmrs.api.APIAuthenticationException;
import org.openmrs.api.LocationService;
import org.openmrs.api.PatientService;
import org.openmrs.api.VisitService;
import org.openmrs.api.context.Context;
import org.openmrs.Location;
import org.openmrs.Visit;
import org.openmrs.module.ghanaemr.api.queue.PatientQueueService;
import org.openmrs.module.ghanaemr.api.queue.model.PatientQueue;
import org.openmrs.module.ghanaemr.api.queue.model.QueueStatus;
import org.openmrs.module.ghanaemr.api.nhie.NHIEIntegrationService;
import org.openmrs.module.ghanaemr.exception.ValidationException;
import org.openmrs.module.ghanaemr.service.ConsultationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.Base64;

@RestController
@RequestMapping("/ws/rest/v1/ghana/opd/consultation")
public class ConsultationController {

    @PostMapping
    public ResponseEntity<?> record(HttpServletRequest request, @RequestBody Map<String, Object> payload) {
        ensureAuthenticated(request);
        try {
            String patientUuid = asString(payload.get("patientUuid"));
            if (patientUuid == null || patientUuid.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(error("VALIDATION_ERROR", "patientUuid is required"));
            }

            PatientService patientService = Context.getPatientService();
            Patient patient = patientService.getPatientByUuid(patientUuid);
            if (patient == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(error("NOT_FOUND", "Patient not found"));
            }

            String chiefComplaint = asString(payload.get("chiefComplaint"));
            List<String> diagnoses = asStringList(payload.get("diagnoses"));
            List<String> prescriptions = asStringList(payload.get("prescriptions"));
            List<String> labs = asStringList(payload.get("labs"));

            String locationUuid = asString(payload.get("locationUuid"));
            String providerUuid = asString(payload.get("providerUuid"));

            // Optional queue handling
            String queueUuid = asString(payload.get("queueUuid"));
            String nextLocationUuid = asString(payload.get("nextLocationUuid"));

            ConsultationService svc = getConsultationService();
            Encounter enc = svc.recordConsultation(
                    patient, chiefComplaint, diagnoses, prescriptions, labs, locationUuid, providerUuid
            );

            // Trigger NHIE Encounter submission asynchronously (best-effort)
            try {
                NHIEIntegrationService nhie = getNhieIntegrationService();
                nhie.submitEncounter(enc);
            } catch (Exception ignore) { }

            // If launched from a queue, complete current and optionally create next queue entry
            try {
                if (queueUuid != null && !queueUuid.trim().isEmpty()) {
                    handleQueueAdvance(patient, queueUuid, nextLocationUuid);
                }
            } catch (Exception e) {
                // Do not fail consultation save because of queue handoff; log best-effort
            }

            Map<String, Object> body = new HashMap<String, Object>();
            body.put("encounterUuid", enc.getUuid());
            body.put("patientUuid", mask(patient.getUuid()));
            return ResponseEntity.status(HttpStatus.CREATED).body(body);
        } catch (ValidationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("VALIDATION_ERROR", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("SERVER_ERROR", "Failed to record consultation"));
        }
    }

    private void handleQueueAdvance(Patient patient, String queueUuid, String nextLocationUuid) {
        PatientQueueService qs = getQueueService();
        PatientQueue current = qs.getByUuid(queueUuid);
        if (current != null) {
            // Mark current as completed
            qs.updateQueueStatus(current, QueueStatus.COMPLETED);

            // Enqueue to next location if provided and a visit is available
            if (nextLocationUuid != null && !nextLocationUuid.trim().isEmpty()) {
                LocationService ls = Context.getLocationService();
                VisitService vs = Context.getVisitService();
                Location next = ls.getLocationByUuid(nextLocationUuid);
                if (next != null) {
                    Visit visit = null;
                    // Prefer existing active visit
                    java.util.List<Visit> active = vs.getActiveVisitsByPatient(patient);
                    if (active != null && !active.isEmpty()) {
                        visit = active.get(0);
                    }
                    if (visit != null) {
                        qs.addToQueue(patient, visit, next, 5);
                    }
                }
            }
        }
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<?> get(HttpServletRequest request, @PathVariable("uuid") String uuid) {
        ensureAuthenticated(request);
        Encounter enc = Context.getEncounterService().getEncounterByUuid(uuid);
        if (enc == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("NOT_FOUND", "Encounter not found"));
        Map<String, Object> body = new HashMap<String, Object>();
        body.put("encounterUuid", enc.getUuid());
        body.put("patientUuid", enc.getPatient() != null ? mask(enc.getPatient().getUuid()) : null);
        body.put("obsCount", enc.getObs() != null ? enc.getObs().size() : 0);
        body.put("orderCount", enc.getOrders() != null ? enc.getOrders().size() : 0);
        return ResponseEntity.ok(body);
    }

    private List<String> asStringList(Object o) {
        List<String> out = new ArrayList<String>();
        if (o instanceof Collection) {
            for (Object v : ((Collection<?>) o)) {
                String s = asString(v);
                if (s != null && !s.trim().isEmpty()) out.add(s);
            }
        }
        return out;
    }

    private String asString(Object o) { return o == null ? null : String.valueOf(o); }

    private Map<String, Object> error(String code, String message) {
        Map<String, Object> m = new HashMap<String, Object>();
        m.put("code", code);
        m.put("message", message);
        return m;
    }

    private void ensureAuthenticated(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Basic ")) {
            throw new APIAuthenticationException("Authentication required");
        }
        String creds = new String(Base64.getDecoder().decode(auth.substring(6)), StandardCharsets.UTF_8);
        int i = creds.indexOf(':');
        if (i <= 0) throw new APIAuthenticationException("Invalid credentials");
        String user = creds.substring(0, i);
        String pass = creds.substring(i + 1);
        Context.authenticate(user, pass);
        if (!Context.isAuthenticated()) {
            throw new APIAuthenticationException("Authentication failed");
        }
    }

    private String mask(String uuid) {
        if (uuid == null || uuid.length() < 8) return "****";
        return uuid.substring(0, 4) + "****" + uuid.substring(uuid.length() - 2);
    }

    private ConsultationService getConsultationService() {
        try {
            List<ConsultationService> beans = Context.getRegisteredComponents(ConsultationService.class);
            if (beans != null && !beans.isEmpty()) return beans.get(0);
        } catch (Exception ignore) { }
        return Context.getService(ConsultationService.class);
    }

    private NHIEIntegrationService getNhieIntegrationService() {
        try {
            List<NHIEIntegrationService> beans = Context.getRegisteredComponents(NHIEIntegrationService.class);
            if (beans != null && !beans.isEmpty()) return beans.get(0);
        } catch (Exception ignore) { }
        return Context.getService(NHIEIntegrationService.class);
    }

    private PatientQueueService getQueueService() {
        try {
            List<PatientQueueService> beans = Context.getRegisteredComponents(PatientQueueService.class);
            if (beans != null && !beans.isEmpty()) return beans.get(0);
        } catch (Exception ignore) { }
        return Context.getService(PatientQueueService.class);
    }
}
