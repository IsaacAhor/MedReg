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
@RequestMapping("/ws/rest/v1/ghana/reports")
public class ReportsController {

    @GetMapping("/opd-register")
    public ResponseEntity<?> opdRegister(HttpServletRequest request,
                                         @RequestParam("date") String date,
                                         @RequestParam("encounterTypeUuid") String encounterTypeUuid,
                                         @RequestParam(value = "format", required = false) String format,
                                         @RequestParam(value = "locationUuid", required = false) String locationUuid) {
        ensureAuthenticated(request);
        ensurePrivilege("ghanaemr.reports.view");
        try {
            Integer encTypeId = intScalar("SELECT encounter_type_id FROM encounter_type WHERE uuid='" + encounterTypeUuid + "'");
            if (encTypeId == null) return bad("INVALID_ENCOUNTER_TYPE", "Unknown encounter type uuid");
            String locClause = "";
            if (locationUuid != null && !locationUuid.trim().isEmpty()) {
                locClause = " AND e.location_id=(SELECT location_id FROM location WHERE uuid='" + locationUuid + "')";
            }
            String sql = "SELECT e.uuid, e.encounter_datetime, p.uuid as patient_uuid, pn.given_name, pn.family_name, " +
                    "(SELECT GROUP_CONCAT(DISTINCT o.value_text SEPARATOR ' | ') FROM obs o WHERE o.encounter_id=e.encounter_id AND o.voided=0 AND o.value_text IS NOT NULL) AS notes_text " +
                    "FROM encounter e JOIN patient p ON e.patient_id=p.patient_id " +
                    "LEFT JOIN person_name pn ON pn.person_id=p.patient_id AND pn.preferred=1 " +
                    "WHERE DATE(e.encounter_datetime)='" + date + "' AND e.encounter_type=" + encTypeId + locClause + " ORDER BY e.encounter_datetime";
            @SuppressWarnings("unchecked")
            List<List<Object>> rows = Context.getAdministrationService().executeSQL(sql, true);
            List<Map<String, Object>> items = new ArrayList<>();
            for (List<Object> r : rows) {
                Map<String, Object> m = new HashMap<>();
                m.put("encounterUuid", r.get(0));
                m.put("datetime", r.get(1));
                m.put("patientUuid", r.get(2));
                m.put("givenName", maskName(String.valueOf(r.get(3))));
                m.put("familyName", maskName(String.valueOf(r.get(4))));
                String notes = r.size() > 5 && r.get(5) != null ? String.valueOf(r.get(5)) : null;
                if (notes != null) {
                    // Extract billing flag heuristically
                    String billing = null;
                    if (notes.contains("Billing: NHIS")) billing = "NHIS";
                    else if (notes.contains("Billing: Cash")) billing = "Cash";
                    if (billing != null) m.put("billing", billing);
                    // Extract diagnoses summary if present
                    int idx = notes.indexOf("Diagnoses:");
                    if (idx >= 0) {
                        String tail = notes.substring(idx + "Diagnoses:".length()).trim();
                        int nl = tail.indexOf('\n');
                        String diag = nl >= 0 ? tail.substring(0, nl) : tail;
                        m.put("diagnoses", diag);
                    }
                }
                items.add(m);
            }
            if ("csv".equalsIgnoreCase(format)) {
                StringBuilder sb = new StringBuilder();
                sb.append("encounterUuid,datetime,patientUuid,givenName,familyName,billing,diagnoses\n");
                for (Map<String, Object> m : items) {
                    sb.append(m.get("encounterUuid")).append(',')
                      .append(m.get("datetime")).append(',')
                      .append(m.get("patientUuid")).append(',')
                      .append(safeCsv(m.get("givenName"))).append(',')
                      .append(safeCsv(m.get("familyName"))).append(',')
                      .append(safeCsv(m.get("billing"))).append(',')
                      .append(safeCsv(m.get("diagnoses"))).append('\n');
                }
                return ResponseEntity.ok()
                        .header("Content-Type", "text/csv; charset=UTF-8")
                        .body(sb.toString());
            } else {
                Map<String, Object> body = new HashMap<>();
                body.put("items", items);
                return ResponseEntity.ok(body);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("OPD_REGISTER_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/nhis-vs-cash")
    public ResponseEntity<?> nhisVsCash(HttpServletRequest request,
                                        @RequestParam("date") String date,
                                        @RequestParam(value = "format", required = false) String format,
                                        @RequestParam(value = "locationUuid", required = false) String locationUuid) {
        ensureAuthenticated(request);
        ensurePrivilege("ghanaemr.reports.view");
        try {
            String nhisCount = "0";
            String cashCount = "0";
            String locClause = "";
            if (locationUuid != null && !locationUuid.trim().isEmpty()) {
                locClause = " AND o.location_id=(SELECT location_id FROM location WHERE uuid='" + locationUuid + "')";
            }
            // Prefer coded obs if configured
            String billingConcept = Context.getAdministrationService().getGlobalProperty("ghana.billing.concept.uuid", "");
            String nhisConcept = Context.getAdministrationService().getGlobalProperty("ghana.billing.nhis.uuid", "");
            String cashConcept = Context.getAdministrationService().getGlobalProperty("ghana.billing.cash.uuid", "");
            if (!billingConcept.isEmpty() && (!nhisConcept.isEmpty() || !cashConcept.isEmpty())) {
                if (!nhisConcept.isEmpty()) {
                    nhisCount = String.valueOf(scalar("SELECT COUNT(*) FROM obs o WHERE o.concept_id=(SELECT concept_id FROM concept WHERE uuid='" + billingConcept + "') AND o.value_coded=(SELECT concept_id FROM concept WHERE uuid='" + nhisConcept + "') AND DATE(o.obs_datetime)='" + date + "'" + locClause));
                }
                if (!cashConcept.isEmpty()) {
                    cashCount = String.valueOf(scalar("SELECT COUNT(*) FROM obs o WHERE o.concept_id=(SELECT concept_id FROM concept WHERE uuid='" + billingConcept + "') AND o.value_coded=(SELECT concept_id FROM concept WHERE uuid='" + cashConcept + "') AND DATE(o.obs_datetime)='" + date + "'" + locClause));
                }
            } else {
                // Fallback parse notes
                nhisCount = String.valueOf(scalar("SELECT COUNT(*) FROM obs o WHERE o.value_text LIKE '%Billing: NHIS%' AND DATE(o.obs_datetime)='" + date + "'" + locClause));
                cashCount = String.valueOf(scalar("SELECT COUNT(*) FROM obs o WHERE o.value_text LIKE '%Billing: Cash%' AND DATE(o.obs_datetime)='" + date + "'" + locClause));
            }
            int nhisVal = Integer.parseInt(nhisCount);
            int cashVal = Integer.parseInt(cashCount);
            if ("csv".equalsIgnoreCase(format)) {
                String csv = "date,nhis,cash\n" + date + "," + nhisVal + "," + cashVal + "\n";
                return ResponseEntity.ok().header("Content-Type", "text/csv; charset=UTF-8").body(csv);
            } else {
                Map<String, Object> body = new HashMap<>();
                body.put("nhis", nhisVal);
                body.put("cash", cashVal);
                return ResponseEntity.ok(body);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("NHIS_VS_CASH_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/top-diagnoses")
    public ResponseEntity<?> topDiagnoses(HttpServletRequest request,
                                          @RequestParam("from") String from,
                                          @RequestParam("to") String to,
                                          @RequestParam(value = "limit", required = false, defaultValue = "10") int limit,
                                          @RequestParam(value = "format", required = false) String format) {
        ensureAuthenticated(request);
        ensurePrivilege("ghanaemr.reports.view");
        try {
            // Prefer conditions if present
            String sql = "SELECT c.concept_id, cn.name, COUNT(*) cnt FROM conditions c LEFT JOIN concept_name cn ON cn.concept_id=c.concept_id AND cn.locale='en' AND cn.locale_preferred=1 " +
                    "WHERE DATE(c.date_created) BETWEEN '" + from + "' AND '" + to + "' GROUP BY c.concept_id, cn.name ORDER BY cnt DESC LIMIT " + limit;
            @SuppressWarnings("unchecked")
            List<List<Object>> rows = Context.getAdministrationService().executeSQL(sql, true);
            List<Map<String, Object>> items = new ArrayList<>();
            for (List<Object> r : rows) {
                Map<String, Object> m = new HashMap<>();
                m.put("conceptId", r.get(0));
                m.put("name", r.get(1));
                m.put("count", r.get(2));
                items.add(m);
            }
            if ("csv".equalsIgnoreCase(format)) {
                StringBuilder sb = new StringBuilder();
                sb.append("conceptId,name,count\n");
                for (Map<String, Object> m : items) {
                    sb.append(m.get("conceptId")).append(',')
                      .append(safeCsv(m.get("name"))).append(',')
                      .append(m.get("count")).append('\n');
                }
                return ResponseEntity.ok().header("Content-Type", "text/csv; charset=UTF-8").body(sb.toString());
            } else {
                Map<String, Object> body = new HashMap<>();
                body.put("items", items);
                return ResponseEntity.ok(body);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("TOP_DIAGNOSES_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/revenue")
    public ResponseEntity<?> revenue(HttpServletRequest request,
                                     @RequestParam("from") String from,
                                     @RequestParam("to") String to,
                                     @RequestParam(value = "format", required = false) String format,
                                     @RequestParam(value = "locationUuid", required = false) String locationUuid) {
        ensureAuthenticated(request);
        ensurePrivilege("ghanaemr.reports.view");
        try {
            String billingConcept = Context.getAdministrationService().getGlobalProperty("ghana.billing.concept.uuid", "");
            String nhisConcept = Context.getAdministrationService().getGlobalProperty("ghana.billing.nhis.uuid", "");
            String cashConcept = Context.getAdministrationService().getGlobalProperty("ghana.billing.cash.uuid", "");
            int nhis = 0, cash = 0;
            String locClause = "";
            if (locationUuid != null && !locationUuid.trim().isEmpty()) {
                locClause = " AND o.location_id=(SELECT location_id FROM location WHERE uuid='" + locationUuid + "')";
            }
            if (!billingConcept.isEmpty() && (!nhisConcept.isEmpty() || !cashConcept.isEmpty())) {
                if (!nhisConcept.isEmpty()) {
                    nhis = ((Number) scalar("SELECT COUNT(*) FROM obs o WHERE o.concept_id=(SELECT concept_id FROM concept WHERE uuid='" + billingConcept + "') AND o.value_coded=(SELECT concept_id FROM concept WHERE uuid='" + nhisConcept + "') AND DATE(o.obs_datetime) BETWEEN '" + from + "' AND '" + to + "'" + locClause))).intValue();
                }
                if (!cashConcept.isEmpty()) {
                    cash = ((Number) scalar("SELECT COUNT(*) FROM obs o WHERE o.concept_id=(SELECT concept_id FROM concept WHERE uuid='" + billingConcept + "') AND o.value_coded=(SELECT concept_id FROM concept WHERE uuid='" + cashConcept + "') AND DATE(o.obs_datetime) BETWEEN '" + from + "' AND '" + to + "'" + locClause))).intValue();
                }
            } else {
                nhis = ((Number) scalar("SELECT COUNT(*) FROM obs o WHERE o.value_text LIKE '%Billing: NHIS%' AND DATE(o.obs_datetime) BETWEEN '" + from + "' AND '" + to + "'" + locClause))).intValue();
                cash = ((Number) scalar("SELECT COUNT(*) FROM obs o WHERE o.value_text LIKE '%Billing: Cash%' AND DATE(o.obs_datetime) BETWEEN '" + from + "' AND '" + to + "'" + locClause))).intValue();
            }
            if ("csv".equalsIgnoreCase(format)) {
                String csv = "from,to,nhis,cash\n" + from + "," + to + "," + nhis + "," + cash + "\n";
                return ResponseEntity.ok().header("Content-Type", "text/csv; charset=UTF-8").body(csv);
            } else {
                Map<String, Object> body = new HashMap<>();
                body.put("from", from);
                body.put("to", to);
                body.put("nhis", nhis);
                body.put("cash", cash);
                return ResponseEntity.ok(body);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("REVENUE_FAILED", e.getMessage()));
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

    private static String maskName(String n) {
        if (n == null || n.isEmpty()) return null;
        return n.substring(0, 1) + "***";
    }

    private static String safeCsv(Object v) {
        if (v == null) return "";
        String s = String.valueOf(v).replace("\"", "\"\"");
        if (s.contains(",") || s.contains("\n") || s.contains("\"")) {
            return "\"" + s + "\"";
        }
        return s;
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
