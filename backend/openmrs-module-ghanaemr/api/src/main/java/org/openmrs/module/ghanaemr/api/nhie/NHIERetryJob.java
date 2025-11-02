package org.openmrs.module.ghanaemr.api.nhie;

import org.openmrs.api.context.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * NHIE retry scheduler scaffold.
 *
 * Aligns with AGENTS.md retry policy. This scaffold intentionally logs intent without
 * implementing full DB polling logic to avoid unintended load; follow-up will add:
 * - Query ghanaemr_nhie_transaction_log for FAILED retryable rows whose next_retry_at <= now
 * - Exponential backoff updates to next_retry_at and retry_count
 * - Re-submit via NHIEHttpClient using stored request payloads
 */
@Component
public class NHIERetryJob {

    private static final Logger log = LoggerFactory.getLogger(NHIERetryJob.class);

    /**
     * Runs every 60s by default. Use property ghana.nhie.retry.schedulerMs to override.
     */
    @Scheduled(fixedDelayString = "${ghana.nhie.retry.schedulerMs:60000}")
    public void tick() {
        if (!isEnabled()) return;
        try {
            processBatch(10);
        } catch (Exception e) {
            log.error("NHIERetryJob tick failed", e);
        }
    }

    private void processBatch(int limit) {
        try {
            String sql = "SELECT id, patient_id, retry_count FROM ghanaemr_nhie_transaction_log " +
                    "WHERE status='FAILED' AND (next_retry_at IS NULL OR next_retry_at <= NOW()) " +
                    "AND (response_status IN (401,429,500,502,503) OR response_status IS NULL) " +
                    "AND retry_count < " + getMaxAttempts() + " ORDER BY created_at LIMIT " + limit;
            @SuppressWarnings("unchecked")
            java.util.List<java.util.List<Object>> rows = Context.getAdministrationService().executeSQL(sql, true);
            if (rows == null || rows.isEmpty()) return;

            org.openmrs.api.PatientService ps = Context.getPatientService();
            org.openmrs.module.ghanaemr.api.nhie.NHIEIntegrationService svc = getNhieService();

            for (java.util.List<Object> r : rows) {
                Long id = toLong(r.get(0));
                Integer pid = toInt(r.get(1));
                Integer attempt = toInt(r.get(2));
                if (id == null || pid == null) continue;
                org.openmrs.Patient p = ps.getPatient(pid);
                if (p == null) {
                    markDlq(id, "Patient not found");
                    continue;
                }
                try {
                    String nhieId = svc.syncPatientToNHIE(p);
                    markSuccess(id, nhieId);
                } catch (org.openmrs.module.ghanaemr.exception.NHIEIntegrationException ex) {
                    if (ex.isRetryable() != null && ex.isRetryable() && attempt + 1 < getMaxAttempts()) {
                        scheduleRetry(id, attempt + 1);
                    } else {
                        markDlq(id, ex.getMessage());
                    }
                } catch (Exception ex) {
                    scheduleRetry(id, attempt + 1);
                }
            }
        } catch (Exception e) {
            log.error("Retry batch failed", e);
        }
    }

    private org.openmrs.module.ghanaemr.api.nhie.NHIEIntegrationService getNhieService() {
        try {
            return Context.getRegisteredComponents(org.openmrs.module.ghanaemr.api.nhie.NHIEIntegrationService.class)
                    .stream().findFirst().orElseThrow(IllegalStateException::new);
        } catch (Exception e) {
            return Context.getService(org.openmrs.module.ghanaemr.api.nhie.NHIEIntegrationService.class);
        }
    }

    private void markSuccess(Long id, String nhieId) {
        String now = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
        String nhie = (nhieId == null) ? null : nhieId.replace("'", "''");
        String sql = "UPDATE ghanaemr_nhie_transaction_log SET status='SUCCESS', nhie_resource_id=" +
                (nhie == null ? "NULL" : "'" + nhie + "'") + ", updated_at='" + now + "' WHERE id=" + id;
        Context.getAdministrationService().executeSQL(sql, false);
    }

    private void markDlq(Long id, String msg) {
        String now = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
        String m = (msg == null) ? null : msg.replace("'", "''");
        String sql = "UPDATE ghanaemr_nhie_transaction_log SET status='DLQ', error_message=" +
                (m == null ? "NULL" : "'" + m + "'") + ", updated_at='" + now + "' WHERE id=" + id;
        Context.getAdministrationService().executeSQL(sql, false);
    }

    private void scheduleRetry(Long id, int nextAttempt) {
        long delayMs = computeDelayMs(nextAttempt);
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.setTimeInMillis(System.currentTimeMillis() + delayMs);
        String next = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(cal.getTime());
        String now = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
        String sql = "UPDATE ghanaemr_nhie_transaction_log SET retry_count=" + nextAttempt + ", next_retry_at='" + next +
                "', updated_at='" + now + "' WHERE id=" + id;
        Context.getAdministrationService().executeSQL(sql, false);
    }

    private long computeDelayMs(int attempt) {
        // attempt starts at 1 for first retry; match backoff table from AGENTS.md
        long initial = getLongProp("ghana.nhie.retry.initialDelayMs", 5000L);
        double mult = getDoubleProp("ghana.nhie.retry.multiplier", 6.0/5.0); // approx escalating
        long max = getLongProp("ghana.nhie.retry.maxDelayMs", 3600000L);
        double d = initial * Math.pow(mult, Math.max(0, attempt - 1));
        return Math.min((long) d, max);
    }

    private int getMaxAttempts() {
        try { return Integer.parseInt(Context.getAdministrationService().getGlobalProperty("ghana.nhie.retry.maxAttempts", "8")); }
        catch (Exception ignored) { return 8; }
    }

    private long getLongProp(String key, long def) {
        try { return Long.parseLong(Context.getAdministrationService().getGlobalProperty(key, Long.toString(def))); }
        catch (Exception ignored) { return def; }
    }

    private double getDoubleProp(String key, double def) {
        try { return Double.parseDouble(Context.getAdministrationService().getGlobalProperty(key, Double.toString(def))); }
        catch (Exception ignored) { return def; }
    }

    private static Long toLong(Object o) { return (o instanceof Number) ? ((Number) o).longValue() : null; }
    private static Integer toInt(Object o) { return (o instanceof Number) ? ((Number) o).intValue() : null; }

    private boolean isEnabled() {
        try {
            String flag = Context.getAdministrationService()
                    .getGlobalProperty("ghana.feature.nhie.sync.enabled", "true");
            return Boolean.parseBoolean(flag);
        } catch (Exception e) {
            return true; // default enabled if property missing
        }
    }
}
