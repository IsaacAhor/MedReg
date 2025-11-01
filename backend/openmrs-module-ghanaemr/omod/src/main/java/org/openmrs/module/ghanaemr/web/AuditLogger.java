package org.openmrs.module.ghanaemr.web;

import org.openmrs.api.AdministrationService;
import org.openmrs.api.context.Context;

import java.util.Date;
import java.util.Map;

class AuditLogger {
    static void log(String action, String subjectMasked, String patientUuid, Map<String, Object> detailsMasked) {
        try {
            String details = detailsMasked != null ? detailsMasked.toString() : null;
            String safeAction = escape(action);
            String safeSubject = escape(subjectMasked);
            String safeUuid = escape(patientUuid);
            String safeDetails = escape(details);

            AdministrationService admin = Context.getAdministrationService();
            // Table: audit_log(action, subject, patient_uuid, details, created_at)
            String sql = "INSERT INTO audit_log (action, subject, patient_uuid, details, created_at) VALUES ('" +
                    safeAction + "','" + safeSubject + "','" + safeUuid + "','" + safeDetails + "', NOW())";
            admin.executeSQL(sql, false);
        } catch (Exception ignored) {
            // Swallow logging failures to avoid impacting core flow
        }
    }

    private static String escape(String s) {
        if (s == null) return null;
        return s.replace("'", "''");
    }
}

