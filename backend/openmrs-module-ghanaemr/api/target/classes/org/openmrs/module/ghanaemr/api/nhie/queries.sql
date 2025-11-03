-- NHIE Transaction Logging - Common SQL Queries
-- Database: OpenMRS MySQL 5.7
-- Tables: ghanaemr_nhie_transaction_log, ghanaemr_nhie_coverage_cache
-- Reference: backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/README-TRANSACTION-LOGGING.md

-- ============================================================================
-- TRANSACTION LOG QUERIES
-- ============================================================================

-- 1. Get all transactions for a specific patient
SELECT 
    transaction_id,
    resource_type,
    http_method,
    endpoint,
    status,
    response_status,
    retry_count,
    error_message,
    created_at,
    updated_at
FROM ghanaemr_nhie_transaction_log
WHERE patient_id = ? -- Replace with patient_id
ORDER BY created_at DESC;

-- 2. Get retry queue (transactions ready for retry)
SELECT 
    id,
    transaction_id,
    patient_id,
    encounter_id,
    resource_type,
    retry_count,
    next_retry_at,
    error_message
FROM ghanaemr_nhie_transaction_log
WHERE status = 'FAILED'
  AND retry_count < 8
  AND next_retry_at <= NOW()
ORDER BY next_retry_at ASC
LIMIT 100;

-- 3. Get Dead Letter Queue (manual review required)
SELECT 
    id,
    transaction_id,
    patient_id,
    resource_type,
    http_method,
    status,
    retry_count,
    error_message,
    response_status,
    response_body,
    created_at
FROM ghanaemr_nhie_transaction_log
WHERE status = 'DLQ'
ORDER BY created_at DESC;

-- 4. Success rate (last 24 hours)
SELECT 
    COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) AS success_count,
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) AS failed_count,
    COUNT(CASE WHEN status = 'DLQ' THEN 1 END) AS dlq_count,
    COUNT(*) AS total_count,
    ROUND(COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) * 100.0 / COUNT(*), 2) AS success_rate_pct
FROM ghanaemr_nhie_transaction_log
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- 5. Average retry count by resource type
SELECT 
    resource_type,
    COUNT(*) AS total_transactions,
    AVG(retry_count) AS avg_retries,
    MAX(retry_count) AS max_retries
FROM ghanaemr_nhie_transaction_log
WHERE status IN ('SUCCESS', 'DLQ')
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY resource_type;

-- 6. Pending queue depth
SELECT COUNT(*) AS pending_count
FROM ghanaemr_nhie_transaction_log
WHERE status IN ('PENDING', 'FAILED')
  AND retry_count < 8;

-- 7. Failed transactions by HTTP status code
SELECT 
    response_status,
    COUNT(*) AS failure_count,
    GROUP_CONCAT(DISTINCT error_message SEPARATOR '; ') AS error_samples
FROM ghanaemr_nhie_transaction_log
WHERE status IN ('FAILED', 'DLQ')
  AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY response_status
ORDER BY failure_count DESC;

-- 8. Transaction timeline for specific patient
SELECT 
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS timestamp,
    resource_type,
    http_method,
    status,
    retry_count,
    CASE 
        WHEN status = 'SUCCESS' THEN '✅'
        WHEN status = 'PENDING' THEN '⏳'
        WHEN status = 'FAILED' THEN '⚠️'
        WHEN status = 'DLQ' THEN '❌'
    END AS status_icon
FROM ghanaemr_nhie_transaction_log
WHERE patient_id = ? -- Replace with patient_id
ORDER BY created_at ASC;

-- 9. Latest transaction for each patient (for dashboard)
SELECT 
    t1.patient_id,
    t1.transaction_id,
    t1.resource_type,
    t1.status,
    t1.created_at,
    t1.nhie_resource_id
FROM ghanaemr_nhie_transaction_log t1
INNER JOIN (
    SELECT patient_id, MAX(created_at) AS max_created
    FROM ghanaemr_nhie_transaction_log
    GROUP BY patient_id
) t2 ON t1.patient_id = t2.patient_id AND t1.created_at = t2.max_created;

-- 10. Requeue DLQ transaction (manual operator action)
UPDATE ghanaemr_nhie_transaction_log
SET status = 'FAILED',
    retry_count = 0,
    next_retry_at = NOW(),
    updated_at = NOW()
WHERE transaction_id = ? -- Replace with transaction_id from DLQ
  AND status = 'DLQ';

-- ============================================================================
-- NHIS COVERAGE CACHE QUERIES
-- ============================================================================

-- 11. Check cached eligibility for NHIS number
SELECT 
    nhis_number,
    status,
    valid_from,
    valid_to,
    cached_at,
    expires_at,
    CASE 
        WHEN expires_at > NOW() THEN 'VALID'
        ELSE 'EXPIRED'
    END AS cache_status
FROM ghanaemr_nhie_coverage_cache
WHERE nhis_number = ? -- Replace with NHIS number
LIMIT 1;

-- 12. Get all active coverage entries
SELECT 
    nhis_number,
    status,
    valid_from,
    valid_to,
    expires_at
FROM ghanaemr_nhie_coverage_cache
WHERE expires_at > NOW()
ORDER BY cached_at DESC;

-- 13. Cleanup expired cache entries (run daily)
DELETE FROM ghanaemr_nhie_coverage_cache
WHERE expires_at < NOW();

-- 14. Cache hit rate (last 24 hours)
SELECT 
    (SELECT COUNT(*) FROM ghanaemr_nhie_coverage_cache WHERE expires_at > NOW()) AS cached_entries,
    (SELECT COUNT(DISTINCT patient_id) 
     FROM ghanaemr_nhie_transaction_log 
     WHERE resource_type = 'COVERAGE' 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) AS total_checks;

-- 15. Coverage status distribution
SELECT 
    status,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ghanaemr_nhie_coverage_cache WHERE expires_at > NOW()), 2) AS percentage
FROM ghanaemr_nhie_coverage_cache
WHERE expires_at > NOW()
GROUP BY status;

-- ============================================================================
-- MONITORING & ALERTING QUERIES
-- ============================================================================

-- 16. Alert: High failure rate (>10% in last hour)
SELECT 
    ROUND(COUNT(CASE WHEN status IN ('FAILED', 'DLQ') THEN 1 END) * 100.0 / COUNT(*), 2) AS failure_rate_pct
FROM ghanaemr_nhie_transaction_log
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
HAVING failure_rate_pct > 10;

-- 17. Alert: DLQ threshold exceeded (>50 entries)
SELECT COUNT(*) AS dlq_count
FROM ghanaemr_nhie_transaction_log
WHERE status = 'DLQ'
HAVING dlq_count > 50;

-- 18. Alert: Pending queue depth critical (>500 entries)
SELECT COUNT(*) AS pending_count
FROM ghanaemr_nhie_transaction_log
WHERE status IN ('PENDING', 'FAILED')
  AND retry_count < 8
HAVING pending_count > 500;

-- 19. Hourly transaction volume (last 24 hours)
SELECT 
    DATE_FORMAT(created_at, '%Y-%m-%d %H:00') AS hour,
    COUNT(*) AS transaction_count,
    COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) AS success_count,
    COUNT(CASE WHEN status IN ('FAILED', 'DLQ') THEN 1 END) AS failure_count
FROM ghanaemr_nhie_transaction_log
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:00')
ORDER BY hour ASC;

-- 20. Performance: Average response time by endpoint (requires response_body parsing)
-- Note: This is a placeholder - actual implementation would need response_body JSON parsing
SELECT 
    endpoint,
    COUNT(*) AS request_count,
    AVG(TIMESTAMPDIFF(SECOND, created_at, updated_at)) AS avg_response_time_sec
FROM ghanaemr_nhie_transaction_log
WHERE status = 'SUCCESS'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY endpoint
ORDER BY avg_response_time_sec DESC;

-- ============================================================================
-- DATA CLEANUP QUERIES
-- ============================================================================

-- 21. Archive old successful transactions (>90 days)
-- WARNING: Run with caution - creates backup before deletion
CREATE TABLE IF NOT EXISTS ghanaemr_nhie_transaction_log_archive LIKE ghanaemr_nhie_transaction_log;

INSERT INTO ghanaemr_nhie_transaction_log_archive
SELECT * FROM ghanaemr_nhie_transaction_log
WHERE status = 'SUCCESS'
  AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Then delete after verifying archive
-- DELETE FROM ghanaemr_nhie_transaction_log
-- WHERE status = 'SUCCESS'
--   AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 22. Delete test transactions (development only)
-- WARNING: Production databases should NEVER run this
-- DELETE FROM ghanaemr_nhie_transaction_log
-- WHERE patient_id IN (SELECT patient_id FROM patient WHERE uuid LIKE 'TEST-%');

-- ============================================================================
-- PATIENT DASHBOARD QUERIES (Used by UI)
-- ============================================================================

-- 23. Patient NHIE sync summary
SELECT 
    p.patient_id,
    p.uuid AS patient_uuid,
    CONCAT(pn.given_name, ' ', pn.family_name) AS patient_name,
    pi.identifier AS ghana_card,
    (SELECT status 
     FROM ghanaemr_nhie_transaction_log 
     WHERE patient_id = p.patient_id 
       AND resource_type = 'PATIENT'
     ORDER BY created_at DESC LIMIT 1) AS nhie_sync_status,
    (SELECT nhie_resource_id 
     FROM ghanaemr_nhie_transaction_log 
     WHERE patient_id = p.patient_id 
       AND resource_type = 'PATIENT'
       AND status = 'SUCCESS'
     ORDER BY created_at DESC LIMIT 1) AS nhie_patient_id,
    (SELECT created_at 
     FROM ghanaemr_nhie_transaction_log 
     WHERE patient_id = p.patient_id 
       AND resource_type = 'PATIENT'
     ORDER BY created_at DESC LIMIT 1) AS last_sync_attempt
FROM patient p
INNER JOIN person_name pn ON p.patient_id = pn.person_id AND pn.preferred = 1
INNER JOIN patient_identifier pi ON p.patient_id = pi.patient_id AND pi.preferred = 1
WHERE p.patient_id = ?; -- Replace with patient_id

-- 24. Patient NHIS eligibility status
SELECT 
    pa.value AS nhis_number,
    COALESCE(c.status, 'UNKNOWN') AS eligibility_status,
    c.valid_from,
    c.valid_to,
    c.cached_at,
    CASE 
        WHEN c.expires_at > NOW() THEN 'CACHED'
        ELSE 'NEEDS_REFRESH'
    END AS cache_status
FROM patient p
INNER JOIN person_attribute pa ON p.patient_id = pa.person_id
INNER JOIN person_attribute_type pat ON pa.person_attribute_type_id = pat.person_attribute_type_id
LEFT JOIN ghanaemr_nhie_coverage_cache c ON pa.value = c.nhis_number
WHERE p.patient_id = ? -- Replace with patient_id
  AND pat.name = 'NHIS Number';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Replace ? with actual values when running queries
-- 2. All timestamps are in UTC (OpenMRS default)
-- 3. PII in request_body/response_body is masked - see README-TRANSACTION-LOGGING.md for masking rules
-- 4. Use these queries for monitoring dashboards, alerting, and troubleshooting
-- 5. For production use, consider creating stored procedures for complex queries
