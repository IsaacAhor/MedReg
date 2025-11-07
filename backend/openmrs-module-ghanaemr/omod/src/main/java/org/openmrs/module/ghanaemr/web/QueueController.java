package org.openmrs.module.ghanaemr.web;

import org.openmrs.Location;
import org.openmrs.Patient;
import org.openmrs.Visit;
import org.openmrs.api.APIAuthenticationException;
import org.openmrs.api.LocationService;
import org.openmrs.api.PatientService;
import org.openmrs.api.VisitService;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.api.queue.PatientQueueService;
import org.openmrs.module.ghanaemr.api.queue.model.PatientQueue;
import org.openmrs.module.ghanaemr.api.queue.model.QueueStatus;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.Base64;

@RestController
@RequestMapping("/ws/rest/v1/ghana/opd/queue")
public class QueueController {

    @GetMapping
    public ResponseEntity<?> getQueue(HttpServletRequest request,
                                      @RequestParam("location") String locationUuid,
                                      @RequestParam(value = "status", required = false, defaultValue = "PENDING") String status) {
        ensureAuthenticated(request);
        try {
            LocationService locationService = Context.getLocationService();
            Location location = locationService.getLocationByUuid(locationUuid);
            if (location == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(error("VALIDATION_ERROR", "Invalid locationUuid"));
            }

            QueueStatus st = QueueStatus.valueOf(status.toUpperCase(Locale.ENGLISH));
            List<PatientQueue> list = getQueueService().getQueueByLocationAndStatus(location, st);

            List<Map<String, Object>> results = new ArrayList<Map<String, Object>>();
            for (PatientQueue q : list) {
                Map<String, Object> m = new LinkedHashMap<String, Object>();
                m.put("uuid", q.getUuid());
                m.put("queueNumber", q.getQueueNumber());
                m.put("status", q.getStatus().name());
                m.put("priority", q.getPriority());
                m.put("dateCreated", q.getDateCreated());

                Patient p = q.getPatient();
                Map<String, Object> pMap = new LinkedHashMap<String, Object>();
                pMap.put("uuid", p.getUuid());
                pMap.put("display", p.getPersonName() != null ? p.getPersonName().getFullName() : p.getUuid());
                List<Map<String, Object>> ids = new ArrayList<Map<String, Object>>();
                if (p.getIdentifiers() != null) {
                    p.getIdentifiers().forEach(pi -> {
                        Map<String, Object> idm = new LinkedHashMap<String, Object>();
                        idm.put("identifier", pi.getIdentifier());
                        Map<String, Object> it = new HashMap<String, Object>();
                        it.put("display", pi.getIdentifierType() != null ? pi.getIdentifierType().getName() : "");
                        idm.put("identifierType", it);
                        ids.add(idm);
                    });
                }
                pMap.put("identifiers", ids);
                m.put("patient", pMap);
                results.add(m);
            }

            Map<String, Object> body = new HashMap<String, Object>();
            body.put("results", results);
            body.put("total", results.size());
            return ResponseEntity.ok(body);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(error("VALIDATION_ERROR", "Invalid status value"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("SERVER_ERROR", "Failed to fetch queue"));
        }
    }

    @PostMapping
    public ResponseEntity<?> createQueueEntry(HttpServletRequest request, @RequestBody Map<String, Object> payload) {
        ensureAuthenticated(request);
        try {
            String patientUuid = asString(payload.get("patientUuid"));
            String visitUuid = asString(payload.get("visitUuid"));
            String locationToUuid = asString(payload.get("locationToUuid"));
            Integer priority = toInt(payload.get("priority"));

            if (patientUuid == null || locationToUuid == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(error("VALIDATION_ERROR", "patientUuid and locationToUuid are required"));
            }

            PatientService ps = Context.getPatientService();
            VisitService vs = Context.getVisitService();
            LocationService ls = Context.getLocationService();

            Patient patient = ps.getPatientByUuid(patientUuid);
            if (patient == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(error("NOT_FOUND", "Patient not found"));
            }
            Visit visit = null;
            if (visitUuid != null && !visitUuid.trim().isEmpty()) {
                visit = vs.getVisitByUuid(visitUuid);
            }
            if (visit == null) {
                // Try to find an active visit
                List<Visit> visits = vs.getActiveVisitsByPatient(patient);
                visit = (visits != null && !visits.isEmpty()) ? visits.get(0) : null;
            }
            if (visit == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(error("VALIDATION_ERROR", "No active visit for patient and visitUuid not provided"));
            }

            Location toLocation = ls.getLocationByUuid(locationToUuid);
            if (toLocation == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(error("VALIDATION_ERROR", "Invalid locationToUuid"));
            }

            PatientQueue q = getQueueService().addToQueue(patient, visit, toLocation, priority);

            Map<String, Object> res = new HashMap<String, Object>();
            res.put("uuid", q.getUuid());
            res.put("queueNumber", q.getQueueNumber());
            res.put("status", q.getStatus().name());
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("SERVER_ERROR", "Failed to create queue entry"));
        }
    }

    @PostMapping("/{queueUuid}")
    public ResponseEntity<?> updateQueueStatus(HttpServletRequest request,
                                               @PathVariable("queueUuid") String queueUuid,
                                               @RequestBody Map<String, Object> payload) {
        ensureAuthenticated(request);
        try {
            String status = asString(payload.get("status"));
            if (status == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(error("VALIDATION_ERROR", "status is required"));
            }
            QueueStatus newStatus = QueueStatus.valueOf(status.toUpperCase(Locale.ENGLISH));
            PatientQueue q = getQueueService().getByUuid(queueUuid);
            if (q == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(error("NOT_FOUND", "Queue entry not found"));
            }
            getQueueService().updateQueueStatus(q, newStatus);
            Map<String, Object> res = new HashMap<String, Object>();
            res.put("ok", true);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(error("VALIDATION_ERROR", "Invalid status value"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("SERVER_ERROR", "Failed to update queue entry"));
        }
    }

    private PatientQueueService getQueueService() {
        return Context.getService(PatientQueueService.class);
    }

    private String asString(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private Integer toInt(Object o) {
        if (o instanceof Number) return ((Number) o).intValue();
        try {
            return o == null ? null : Integer.valueOf(String.valueOf(o));
        } catch (Exception e) {
            return null;
        }
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
        try {
            String base64Credentials = auth.substring("Basic ".length());
            byte[] credDecoded = Base64.getDecoder().decode(base64Credentials);
            String credentials = new String(credDecoded, StandardCharsets.UTF_8);
            final String[] values = credentials.split(":", 2);
            String username = values.length > 0 ? values[0] : null;
            String password = values.length > 1 ? values[1] : null;
            if (username == null || password == null) {
                throw new APIAuthenticationException("Invalid Authorization header");
            }
            Context.authenticate(username, password);
        } catch (Exception e) {
            throw new APIAuthenticationException("Invalid credentials");
        }
    }
}

