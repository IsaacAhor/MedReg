package org.openmrs.module.ghanaemr.web;

import org.openmrs.Patient;
import org.openmrs.PatientIdentifier;
import org.openmrs.PatientIdentifierType;
import org.openmrs.PersonName;
import org.openmrs.api.APIAuthenticationException;
import org.openmrs.api.PatientService;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.dto.GhanaPatientDTO;
import org.openmrs.module.ghanaemr.exception.DuplicatePatientException;
import org.openmrs.module.ghanaemr.exception.ValidationException;
import org.openmrs.module.ghanaemr.service.GhanaPatientService;
import org.openmrs.module.ghanaemr.api.nhie.NHIEIntegrationService;
import org.openmrs.module.ghanaemr.api.nhie.NHIEIntegrationService;
import org.openmrs.module.ghanaemr.exception.NHIEIntegrationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.Base64;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ws/rest/v1/ghana/patients")
public class GhanaPatientController {

    @PostMapping
    public ResponseEntity<?> register(HttpServletRequest request, @RequestBody GhanaPatientDTO dto) {
        ensureAuthenticated(request);
        try {
            GhanaPatientService service = getGhanaPatientService();
            Patient patient = service.registerPatient(dto);

            Map<String, Object> body = new HashMap<>();
            body.put("uuid", patient.getUuid());
            body.put("ghanaCard", maskGhanaCard(findIdentifierValue(patient, "Ghana Card")));
            body.put("folderNumber", findIdentifierValue(patient, "Folder Number"));

            AuditLogger.log("PATIENT_REGISTER", dto.getGhanaCard(), patient.getUuid(), body);

            // Trigger NHIE sync asynchronously if enabled (non-blocking)
            try {
                String nhieEnabled = Context.getAdministrationService()
                        .getGlobalProperty("ghana.nhie.enabled", "false");
                if ("true".equalsIgnoreCase(nhieEnabled)) {
                    NHIEIntegrationService nhieSvc = Context.getRegisteredComponent(
                            "nhieIntegrationService", NHIEIntegrationService.class);
                    new Thread(() -> {
                        try {
                            nhieSvc.syncPatientToNHIE(patient);
                        } catch (Throwable ignore) { }
                    }, "nhie-sync-patient").start();
                }
            } catch (Throwable ignore) { }

            return ResponseEntity.status(HttpStatus.CREATED).body(body);
        } catch (ValidationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("VALIDATION_ERROR", e.getMessage()));
        } catch (DuplicatePatientException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error("DUPLICATE_PATIENT", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("SERVER_ERROR", "Failed to register patient"));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(HttpServletRequest request, @RequestParam("q") String query,
                                    @RequestParam(value = "page", required = false, defaultValue = "1") int page) {
        ensureAuthenticated(request);
        try {
            PatientService patientService = Context.getPatientService();
            Set<String> seen = new HashSet<>();
            List<Patient> results = new ArrayList<>();

            // Try identifier-based searches first
            List<Patient> idMatches = safe(() -> patientService.getPatientsByIdentifier(query));
            if (idMatches != null) collectDistinct(results, seen, idMatches);

            // If looks like Ghana Card normalize (uppercase)
            if (query != null && query.toUpperCase().startsWith("GHA-")) {
                List<Patient> ghMatches = safe(() -> patientService.getPatientsByIdentifier(query.toUpperCase()));
                if (ghMatches != null) collectDistinct(results, seen, ghMatches);
            }

            // NHIS 10 digits
            if (query != null && query.replaceAll("[\\s-]", "").matches("\\d{10}")) {
                List<Patient> nhisMatches = safe(() -> patientService.getPatientsByIdentifier(query.replaceAll("[\\s-]", "")));
                if (nhisMatches != null) collectDistinct(results, seen, nhisMatches);
            }

            // Folder number pattern [REGION]-[FACILITY]-[YEAR]-[SEQUENCE]
            if (query != null && query.matches("[A-Z]{2}-[A-Z0-9]{4}-\\d{4}-\\d{6}")) {
                List<Patient> folderMatches = safe(() -> patientService.getPatientsByIdentifier(query));
                if (folderMatches != null) collectDistinct(results, seen, folderMatches);
            }

            // Name query fallback
            List<Patient> nameMatches = safe(() -> patientService.getPatients(query, query, null, true));
            if (nameMatches != null) collectDistinct(results, seen, nameMatches);

            // Pagination (50 per page)
            int pageSize = 50;
            int from = Math.max(0, (page - 1) * pageSize);
            int to = Math.min(results.size(), from + pageSize);
            List<Patient> pageList = from < to ? results.subList(from, to) : Collections.emptyList();

            List<Map<String, Object>> items = pageList.stream().map(this::toMaskedSummary).collect(Collectors.toList());

            Map<String, Object> body = new HashMap<>();
            body.put("items", items);
            body.put("total", results.size());
            body.put("page", page);
            body.put("pageSize", pageSize);

            AuditLogger.log("PATIENT_SEARCH", maskQuery(query), null, body);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("SERVER_ERROR", "Failed to search patients"));
        }
    }

    @PostMapping("/{uuid}/sync-nhie")
    public ResponseEntity<?> syncPatientToNhie(HttpServletRequest request, @PathVariable("uuid") String uuid) {
        ensureAuthenticated(request);
        try {
            ensurePrivilege("ghanaemr.nhie.sync");
        } catch (APIAuthenticationException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("FORBIDDEN", e.getMessage()));
        }
        try {
            PatientService ps = Context.getPatientService();
            Patient patient = ps.getPatientByUuid(uuid);
            if (patient == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("NOT_FOUND", "Patient not found"));
            }

            NHIEIntegrationService nhieService = getNhieIntegrationService();
            String nhieId = nhieService.syncPatientToNHIE(patient);

            Map<String, Object> body = new HashMap<>();
            body.put("uuid", patient.getUuid());
            body.put("nhiePatientId", nhieId);
            return ResponseEntity.ok(body);
        } catch (NHIEIntegrationException e) {
            Map<String, Object> body = new HashMap<>();
            body.put("code", "NHIE_SYNC_FAILED");
            body.put("message", e.getMessage());
            body.put("retryable", e.isRetryable());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(body);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("SERVER_ERROR", "Failed to sync patient to NHIE"));
        }
    }

    private GhanaPatientService getGhanaPatientService() {
        // Prefer Spring-managed bean
        try {
            return Context.getRegisteredComponents(GhanaPatientService.class).stream().findFirst()
                    .orElseThrow(IllegalStateException::new);
        } catch (Exception e) {
            // Fallback to Context.getService if registered that way
            return Context.getService(GhanaPatientService.class);
        }
    }

    private NHIEIntegrationService getNhieIntegrationService() {
        try {
            return Context.getRegisteredComponents(NHIEIntegrationService.class).stream().findFirst()
                    .orElseThrow(IllegalStateException::new);
        } catch (Exception e) {
            return Context.getService(NHIEIntegrationService.class);
        }
    }

    private void ensureAuthenticated(HttpServletRequest req) throws APIAuthenticationException {
        if (Context.isAuthenticated()) return;
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.toLowerCase(Locale.ROOT).startsWith("basic ")) {
            try {
                String base64Credentials = auth.substring(6).trim();
                byte[] credDecoded = Base64.getDecoder().decode(base64Credentials);
                String credentials = new String(credDecoded, StandardCharsets.UTF_8);
                final String[] values = credentials.split(":", 2);
                if (values.length == 2) {
                    Context.authenticate(values[0], values[1]);
                }
            } catch (Exception ignored) { }
        }
        if (!Context.isAuthenticated()) {
            throw new APIAuthenticationException("Not authenticated");
        }
    }

    private Map<String, Object> toMaskedSummary(Patient p) {
        Map<String, Object> m = new HashMap<>();
        m.put("uuid", p.getUuid());
        PersonName name = p.getPersonName();
        if (name != null) {
            m.put("givenName", maskName(name.getGivenName()));
            m.put("familyName", maskName(name.getFamilyName()));
        }
        m.put("ghanaCard", maskGhanaCard(findIdentifierValue(p, "Ghana Card")));
        m.put("nhis", maskNHIS(findIdentifierValue(p, "NHIS Number")));
        m.put("folderNumber", findIdentifierValue(p, "Folder Number"));
        return m;
    }

    private String findIdentifierValue(Patient p, String typeName) {
        PatientService ps = Context.getPatientService();
        PatientIdentifierType pit = ps.getPatientIdentifierTypeByName(typeName);
        if (pit != null) {
            for (PatientIdentifier id : p.getActiveIdentifiers()) {
                if (pit.equals(id.getIdentifierType())) return id.getIdentifier();
            }
        }
        // fallback by name match if types not set consistently
        for (PatientIdentifier id : p.getActiveIdentifiers()) {
            if (id.getIdentifierType() != null && typeName.equalsIgnoreCase(id.getIdentifierType().getName())) {
                return id.getIdentifier();
            }
        }
        return null;
    }

    private static Map<String, Object> error(String code, String message) {
        Map<String, Object> m = new HashMap<>();
        m.put("code", code);
        m.put("message", message);
        return m;
    }

    private static <T> T safe(SupplierWithException<T> s) {
        try { return s.get(); } catch (Throwable t) { return null; }
    }

    @FunctionalInterface
    private interface SupplierWithException<T> { T get() throws Exception; }

    private static String maskGhanaCard(String v) {
        if (v == null || v.length() < 5) return null;
        // keep prefix and last 2 of body + check digit: GHA-*******89-7
        String digits = v.replaceAll("[^0-9]", "");
        if (digits.length() != 10) return "GHA-*********-*";
        String body = digits.substring(0, 9);
        String tail = body.substring(7) + "-" + digits.substring(9);
        return "GHA-*******" + tail;
    }

    private static String maskNHIS(String v) {
        if (v == null) return null;
        String d = v.replaceAll("[^0-9]", "");
        if (d.length() < 4) return "**********";
        return "******" + d.substring(d.length() - 4);
    }

    private static String maskName(String n) {
        if (n == null || n.isEmpty()) return null;
        return n.substring(0, 1) + "***";
    }

    private void ensurePrivilege(String privilege) throws APIAuthenticationException {
        if (!Context.hasPrivilege(privilege)) {
            throw new APIAuthenticationException("Required privilege: " + privilege);
        }
    }
}
