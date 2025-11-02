package org.openmrs.module.ghanaemr.api.nhie.impl;

import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.api.nhie.NHIECoverageService;
import org.openmrs.module.ghanaemr.api.nhie.NHIEHttpClient;
import org.openmrs.module.ghanaemr.api.nhie.NHIEResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Service("nhieCoverageService")
@Transactional
public class NHIECoverageServiceImpl implements NHIECoverageService {

    private static final Logger log = LoggerFactory.getLogger(NHIECoverageServiceImpl.class);

    private static final long TTL_MS = 24L * 60L * 60L * 1000L; // 24h

    @Override
    public CoverageResult checkCoverage(String nhis, boolean refresh) {
        String normalized = (nhis == null) ? null : nhis.replaceAll("[^0-9]", "");
        if (normalized == null || !normalized.matches("^\\\d{10}$")) {
            return new CoverageResult("error", null);
        }

        if (!refresh) {
            CoverageResult cached = getFromCache(normalized);
            if (cached != null) {
                return cached;
            }
        }

        try {
            NHIEHttpClient client = new NHIEHttpClient();
            NHIEResponse res = client.checkCoverage(normalized);
            String status = res.isSuccess() ? "active" : "not-found";
            upsertCache(normalized, status, res.getResponseBody());
            return new CoverageResult(status, res.getResponseBody());
        } catch (Exception e) {
            log.warn("NHIE coverage check failed: {}", e.getMessage());
            return new CoverageResult("error", null);
        }
    }

    private CoverageResult getFromCache(String nhis) {
        try {
            String sql = "SELECT status, coverage_json, expires_at FROM ghanaemr_nhie_coverage_cache WHERE nhis_number='" + nhis + "'";
            @SuppressWarnings("unchecked")
            List<List<Object>> rows = Context.getAdministrationService().executeSQL(sql, true);
            if (rows != null && !rows.isEmpty()) {
                List<Object> r = rows.get(0);
                String status = (String) r.get(0);
                Date expiresAt = parseDate(r.get(2));
                if (expiresAt != null && expiresAt.after(new Date())) {
                    String raw = (String) r.get(1);
                    return new CoverageResult(status, raw);
                }
            }
        } catch (Exception e) {
            log.debug("Cache read failed", e);
        }
        return null;
    }

    private void upsertCache(String nhis, String status, String raw) {
        try {
            Date now = new Date();
            Calendar cal = Calendar.getInstance();
            cal.setTime(now);
            cal.setTimeInMillis(now.getTime() + TTL_MS);
            Date expires = cal.getTime();
            String nowStr = formatDateTime(now);
            String expStr = formatDateTime(expires);
            String rawEsc = (raw == null) ? null : raw.replace("'", "''");
            String insert = "INSERT INTO ghanaemr_nhie_coverage_cache (nhis_number, status, coverage_json, cached_at, expires_at) " +
                    "VALUES ('" + nhis + "','" + status + "'," + (rawEsc == null ? "NULL" : "'" + rawEsc + "'") +
                    ",'" + nowStr + "','" + expStr + "') ON DUPLICATE KEY UPDATE status='" + status +
                    "', coverage_json=" + (rawEsc == null ? "NULL" : "'" + rawEsc + "'") + ", cached_at='" + nowStr + "', expires_at='" + expStr + "'";
            Context.getAdministrationService().executeSQL(insert, false);
        } catch (Exception e) {
            log.debug("Cache upsert failed", e);
        }
    }

    private static Date parseDate(Object o) {
        try {
            if (o instanceof Date) return (Date) o;
            if (o instanceof String) {
                // MySQL DATETIME default format
                return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse((String) o);
            }
        } catch (Exception ignored) { }
        return null;
    }

    private static String formatDateTime(Date d) {
        return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(d);
    }
}

