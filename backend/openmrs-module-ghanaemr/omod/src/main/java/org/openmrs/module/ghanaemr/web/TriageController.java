package org.openmrs.module.ghanaemr.web;

import org.openmrs.Encounter;
import org.openmrs.Patient;
import org.openmrs.api.APIAuthenticationException;
import org.openmrs.api.PatientService;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.exception.ValidationException;
import org.openmrs.module.ghanaemr.service.TriageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.Base64;

@RestController
@RequestMapping("/ws/rest/v1/ghana/opd/triage")
public class TriageController {

    @PostMapping("/vitals")
    public ResponseEntity<?> recordVitals(HttpServletRequest request, @RequestBody Map<String, Object> payload) {
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

            Map<String, Double> vitals = new HashMap<String, Double>();
            Object v = payload.get("vitals");
            if (v instanceof Map) {
                Map<?, ?> vm = (Map<?, ?>) v;
                putIfNum(vitals, "bpSystolic", vm.get("bpSystolic"));
                putIfNum(vitals, "bpDiastolic", vm.get("bpDiastolic"));
                putIfNum(vitals, "temp", vm.get("temp"));
                putIfNum(vitals, "weight", vm.get("weight"));
                putIfNum(vitals, "height", vm.get("height"));
            }

            String locationUuid = asString(payload.get("locationUuid"));
            String providerUuid = asString(payload.get("providerUuid"));

            TriageService svc = getTriageService();
            Encounter enc = svc.recordVitals(patient, vitals, locationUuid, providerUuid);

            Map<String, Object> body = new HashMap<String, Object>();
            body.put("encounterUuid", enc.getUuid());
            body.put("patientUuid", mask(patient.getUuid()));
            body.put("vitals", vitals);
            return ResponseEntity.status(HttpStatus.CREATED).body(body);
        } catch (ValidationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("VALIDATION_ERROR", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("SERVER_ERROR", "Failed to record vitals"));
        }
    }

    @GetMapping("/vitals/{patientUuid}")
    public ResponseEntity<?> getLatest(HttpServletRequest request, @PathVariable("patientUuid") String patientUuid) {
        ensureAuthenticated(request);
        try {
            PatientService patientService = Context.getPatientService();
            Patient patient = patientService.getPatientByUuid(patientUuid);
            if (patient == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(error("NOT_FOUND", "Patient not found"));
            }
            TriageService svc = getTriageService();
            Map<String, Double> vitals = svc.getLatestVitals(patient);
            Map<String, Object> body = new HashMap<String, Object>();
            body.put("patientUuid", mask(patient.getUuid()));
            body.put("vitals", vitals);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("SERVER_ERROR", "Failed to fetch latest vitals"));
        }
    }

    private void putIfNum(Map<String, Double> map, String key, Object value) {
        if (value instanceof Number) {
            map.put(key, ((Number) value).doubleValue());
        }
    }

    private String asString(Object o) {
        return o == null ? null : String.valueOf(o);
    }

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

    private TriageService getTriageService() {
        try {
            List<TriageService> beans = Context.getRegisteredComponents(TriageService.class);
            if (beans != null && !beans.isEmpty()) return beans.get(0);
        } catch (Exception ignore) { }
        return Context.getService(TriageService.class);
    }
}

