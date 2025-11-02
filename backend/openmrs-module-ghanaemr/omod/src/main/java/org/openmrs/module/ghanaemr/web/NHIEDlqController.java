package org.openmrs.module.ghanaemr.web;

import org.openmrs.api.APIAuthenticationException;
import org.openmrs.api.context.Context;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/ws/rest/v1/ghana/nhie/dlq")
public class NHIEDlqController {

    @GetMapping
    public ResponseEntity<?> list(HttpServletRequest request,
                                  @RequestParam(value = "page", required = false, defaultValue = "1") int page,
                                  @RequestParam(value = "size", required = false, defaultValue = "20") int size) {
        ensureAuthenticated(request);
        ensurePrivilege("ghanaemr.nhie.view");
        int limit = Math.max(1, Math.min(size, 100));
        int offset = Math.max(0, (page - 1) * limit);
        try {
            String baseSql = "FROM ghanaemr_nhie_transaction_log WHERE status='DLQ'";
            String query = "SELECT id, patient_id, resource_type, http_method, endpoint, response_status, error_message, retry_count, updated_at " + baseSql +
                    " ORDER BY updated_at DESC LIMIT " + limit + " OFFSET " + offset;
            @SuppressWarnings("unchecked")
            List<List<Object>> rows = Context.getAdministrationService().executeSQL(query, true);
            List<Map<String, Object>> items = new ArrayList<>();
            for (List<Object> r : rows) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", r.get(0));
                m.put("patientId", r.get(1));
                m.put("resourceType", r.get(2));
                m.put("method", r.get(3));
                m.put("endpoint", r.get(4));
                m.put("responseStatus", r.get(5));
                m.put("error", r.get(6));
                m.put("retryCount", r.get(7));
                m.put("updatedAt", r.get(8));
                items.add(m);
            }
            Number total = scalar("SELECT COUNT(*) " + baseSql);
            Map<String, Object> body = new HashMap<>();
            body.put("items", items);
            body.put("total", total);
            body.put("page", page);
            body.put("size", limit);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("DLQ_LIST_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/{id}/requeue")
    public ResponseEntity<?> requeue(HttpServletRequest request, @PathVariable("id") long id) {
        ensureAuthenticated(request);
        ensurePrivilege("ghanaemr.nhie.manage");
        try {
            // Mark as FAILED and schedule immediate retry
            String now = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
            String sql = "UPDATE ghanaemr_nhie_transaction_log SET status='FAILED', next_retry_at='" + now + "', updated_at='" + now + "' WHERE id=" + id;
            Context.getAdministrationService().executeSQL(sql, false);
            Map<String, Object> body = new HashMap<>();
            body.put("requeued", true);
            body.put("id", id);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("DLQ_REQUEUE_FAILED", e.getMessage()));
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
