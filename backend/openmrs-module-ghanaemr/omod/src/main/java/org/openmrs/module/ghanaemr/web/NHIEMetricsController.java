package org.openmrs.module.ghanaemr.web;

import org.openmrs.api.APIAuthenticationException;
import org.openmrs.api.context.Context;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/ws/rest/v1/ghana/nhie")
public class NHIEMetricsController {

    @GetMapping("/metrics")
    public ResponseEntity<?> getMetrics(HttpServletRequest request) {
        ensureAuthenticated(request);
        ensurePrivilege("ghanaemr.nhie.view");
        Map<String, Object> body = new HashMap<>();
        try {
            body.put("dlqCount", scalar("SELECT COUNT(*) FROM ghanaemr_nhie_transaction_log WHERE status='DLQ'"));
            body.put("failedRetryable", scalar("SELECT COUNT(*) FROM ghanaemr_nhie_transaction_log WHERE status='FAILED' AND (response_status IN (401,429,500,502,503) OR response_status IS NULL)"));
            body.put("success24h", scalar("SELECT COUNT(*) FROM ghanaemr_nhie_transaction_log WHERE status='SUCCESS' AND created_at >= (NOW() - INTERVAL 1 DAY)"));
            body.put("lastUpdatedAt", stringScalar("SELECT DATE_FORMAT(MAX(updated_at), '%Y-%m-%d %H:%i:%s') FROM ghanaemr_nhie_transaction_log"));
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            body.put("error", e.getMessage());
            return ResponseEntity.ok(body);
        }
    }

    private Number scalar(String sql) {
        @SuppressWarnings("unchecked")
        List<List<Object>> rows = Context.getAdministrationService().executeSQL(sql, true);
        if (rows != null && !rows.isEmpty() && !rows.get(0).isEmpty() && rows.get(0).get(0) instanceof Number) {
            return (Number) rows.get(0).get(0);
        }
        return 0;
    }

    private String stringScalar(String sql) {
        @SuppressWarnings("unchecked")
        List<List<Object>> rows = Context.getAdministrationService().executeSQL(sql, true);
        if (rows != null && !rows.isEmpty() && !rows.get(0).isEmpty()) {
            Object v = rows.get(0).get(0);
            return v == null ? null : String.valueOf(v);
        }
        return null;
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
