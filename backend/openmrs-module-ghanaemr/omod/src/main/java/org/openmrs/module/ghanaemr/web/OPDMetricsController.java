package org.openmrs.module.ghanaemr.web;

import org.openmrs.api.APIAuthenticationException;
import org.openmrs.api.context.Context;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/ws/rest/v1/ghana/opd")
public class OPDMetricsController {

    @GetMapping("/metrics")
    public ResponseEntity<?> metrics(HttpServletRequest request,
                                     @RequestParam("encounterTypeUuid") String encounterTypeUuid,
                                     @RequestParam(value = "locationUuid", required = false) String locationUuid) {
        ensureAuthenticated(request);
        try {
            ensurePrivilege("ghanaemr.reports.view");
            String encTypeIdSql = "SELECT encounter_type_id FROM encounter_type WHERE uuid='" + encounterTypeUuid + "'";
            Integer encTypeId = intScalar(encTypeIdSql);
            if (encTypeId == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(error("INVALID_ENCOUNTER_TYPE", "Unknown encounter type uuid"));
            }

            String locClause = "";
            if (locationUuid != null && !locationUuid.trim().isEmpty()) {
                locClause = " AND location_id=(SELECT location_id FROM location WHERE uuid='" + locationUuid + "')";
            }
            Number todayEncounters = scalar("SELECT COUNT(*) FROM encounter WHERE DATE(encounter_datetime)=CURDATE() AND encounter_type=" + encTypeId + locClause);
            Number newPatients = scalar("SELECT COUNT(*) FROM patient WHERE DATE(date_created)=CURDATE()");

            Map<String, Object> body = new HashMap<>();
            body.put("opdEncountersToday", todayEncounters);
            body.put("newPatientsToday", newPatients);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("OPD_METRICS_FAILED", e.getMessage()));
        }
    }

    private Integer intScalar(String sql) {
        @SuppressWarnings("unchecked")
        List<List<Object>> rows = Context.getAdministrationService().executeSQL(sql, true);
        if (rows != null && !rows.isEmpty() && !rows.get(0).isEmpty() && rows.get(0).get(0) instanceof Number) {
            return ((Number) rows.get(0).get(0)).intValue();
        }
        return null;
    }

    private Number scalar(String sql) {
        @SuppressWarnings("unchecked")
        List<List<Object>> rows = Context.getAdministrationService().executeSQL(sql, true);
        if (rows != null && !rows.isEmpty() && !rows.get(0).isEmpty() && rows.get(0).get(0) instanceof Number) {
            return (Number) rows.get(0).get(0);
        }
        return 0;
    }

    private static Map<String, Object> error(String code, String message) {
        Map<String, Object> m = new HashMap<>();
        m.put("code", code);
        m.put("message", message);
        return m;
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

    private void ensurePrivilege(String privilege) throws APIAuthenticationException {
        if (!Context.hasPrivilege(privilege)) {
            throw new APIAuthenticationException("Required privilege: " + privilege);
        }
    }
}
