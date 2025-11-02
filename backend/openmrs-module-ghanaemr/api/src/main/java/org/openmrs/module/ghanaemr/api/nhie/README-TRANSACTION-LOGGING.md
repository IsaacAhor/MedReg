# NHIE Transaction Logging - Technical Specification

**Status:** ✅ Complete  
**Date:** November 1, 2025  
**Phase:** Week 4-5 - NHIE Patient Sync  
**Location:** `backend/openmrs-module-ghanaemr/api/src/main/resources/liquibase.xml`

---

## Overview

The NHIE Transaction Logging system tracks all interactions with the Ghana National Health Information Exchange (NHIE) for:
- **Audit compliance**: Complete audit trail of all NHIE submissions
- **Retry logic**: Automated retry of failed transactions with exponential backoff
- **Debugging**: Troubleshooting NHIE integration issues
- **Monitoring**: Dashboard visibility into NHIE sync status

---

## Database Schema

### Table: `ghanaemr_nhie_transaction_log`

Primary table for tracking all NHIE API interactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Primary key |
| `transaction_id` | VARCHAR(36) | UNIQUE, NOT NULL | UUID for transaction correlation |
| `patient_id` | INT | FK → patient.patient_id | Patient reference (nullable for non-patient operations) |
| `encounter_id` | INT | FK → encounter.encounter_id | Encounter reference (nullable for patient-only submissions) |
| `resource_type` | VARCHAR(50) | NOT NULL | FHIR resource type (PATIENT, ENCOUNTER, OBSERVATION, COVERAGE, CLAIM) |
| `http_method` | VARCHAR(10) | NOT NULL | HTTP method (GET, POST, PUT, DELETE) |
| `endpoint` | VARCHAR(255) | NOT NULL | NHIE API endpoint URL |
| `request_body` | TEXT | NULLABLE | Request payload (PII masked) |
| `response_status` | INT | NULLABLE | HTTP status code (200, 201, 400, 401, 409, 422, 429, 500) |
| `response_body` | TEXT | NULLABLE | Response payload (PII masked) |
| `retry_count` | INT | DEFAULT 0, NOT NULL | Number of retry attempts |
| `status` | VARCHAR(20) | NOT NULL | Transaction status (PENDING, SUCCESS, FAILED, DLQ) |
| `error_message` | TEXT | NULLABLE | Error details for failed transactions |
| `nhie_resource_id` | VARCHAR(255) | NULLABLE | NHIE-assigned resource ID (returned from NHIE) |
| `created_at` | DATETIME | NOT NULL | Transaction creation timestamp |
| `updated_at` | DATETIME | NOT NULL | Last update timestamp |
| `next_retry_at` | DATETIME | NULLABLE | Scheduled retry time (for retry scheduler) |
| `creator` | INT | FK → users.user_id, NOT NULL | User who initiated the transaction |

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `idx_nhie_txn_patient_id` | `patient_id` | Fast patient transaction lookup |
| `idx_nhie_txn_encounter_id` | `encounter_id` | Fast encounter transaction lookup |
| `idx_nhie_txn_status` | `status` | Fast status filtering (pending, failed, DLQ) |
| `idx_nhie_txn_created_at` | `created_at` | Time-based queries |
| `idx_nhie_txn_retry_queue` | `status, next_retry_at, retry_count` | Retry scheduler optimization |
| `idx_nhie_txn_transaction_id` | `transaction_id` | UUID lookup |

---

### Table: `ghanaemr_nhie_coverage_cache`

Cache table for NHIS eligibility check results (24-hour TTL).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Primary key |
| `nhis_number` | VARCHAR(10) | UNIQUE, NOT NULL | NHIS number (10 digits) |
| `status` | VARCHAR(20) | NOT NULL | Coverage status (ACTIVE, EXPIRED, NOT_FOUND, SUSPENDED) |
| `valid_from` | DATE | NULLABLE | Coverage start date |
| `valid_to` | DATE | NULLABLE | Coverage end date |
| `coverage_json` | TEXT | NULLABLE | Full FHIR Coverage resource (for reference) |
| `cached_at` | DATETIME | NOT NULL | Cache creation timestamp |
| `expires_at` | DATETIME | NOT NULL | Cache expiry timestamp (cached_at + 24 hours) |
| `creator` | INT | FK → users.user_id, NOT NULL | User who triggered eligibility check |

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `idx_nhie_coverage_nhis` | `nhis_number` | Fast NHIS number lookup |
| `idx_nhie_coverage_expires` | `expires_at` | Expiry cleanup job optimization |

---

## Transaction Status Enum

| Status | Description | Next Action |
|--------|-------------|-------------|
| `PENDING` | Transaction queued, not yet submitted | Submit to NHIE |
| `SUCCESS` | Successfully submitted to NHIE | Archive (no action needed) |
| `FAILED` | Submission failed, retryable | Retry with exponential backoff |
| `DLQ` | Dead Letter Queue - max retries exceeded | Manual review required |

---

## Resource Types

| Resource Type | Description | Endpoint |
|---------------|-------------|----------|
| `PATIENT` | Patient demographics submission | POST /fhir/Patient |
| `ENCOUNTER` | OPD encounter submission | POST /fhir/Encounter |
| `OBSERVATION` | Vitals/lab results | POST /fhir/Observation |
| `COVERAGE` | NHIS eligibility check | GET /fhir/Coverage?beneficiary.identifier=... |
| `CLAIM` | NHIS claims submission (future) | POST /fhir/Claim |

---

## PII Masking Rules

**CRITICAL**: All request/response bodies stored in `request_body` and `response_body` columns **MUST** be masked for PII.

### Masking Rules

| Field | Original | Masked |
|-------|----------|--------|
| Ghana Card | `GHA-123456789-7` | `GHA-1234****-*` |
| NHIS Number | `0123456789` | `0123****89` |
| Patient Name | `Kwame Mensah` | `K***e M****h` |
| Phone Number | `+233244123456` | `+233244***456` |
| Address | `123 Main St, Accra` | `*** Main St, Accra` |
| Date of Birth | `1985-03-15` | `1985-**-**` |

### Implementation

```java
public String maskRequestBody(String json) {
    // Replace Ghana Card: GHA-XXXXXXXXX-X → GHA-XXXX****-*
    json = json.replaceAll("(GHA-\\d{4})\\d{5}(-\\d)", "$1****$2");
    
    // Replace NHIS: 0123456789 → 0123****89
    json = json.replaceAll("(\"identifier\":\\s*\"\\d{4})\\d{4}(\\d{2}\")", "$1****$2");
    
    // Replace names: "Kwame" → "K***e"
    json = json.replaceAll("(\"given\":\\s*\")(\\w)(\\w+)(\\w)(\")", "$1$2***$4$5");
    
    // Replace phone: +233244123456 → +233244***456
    json = json.replaceAll("(\\+233\\d{3})\\d{3}(\\d{3})", "$1***$2");
    
    return json;
}
```

**Reference:** AGENTS.md lines 1020-1034 (PII Handling rules)

---

## Retry Logic

### Exponential Backoff Strategy

Per AGENTS.md lines 713-719:

```
Attempt 1: Immediate
Attempt 2: 5 seconds
Attempt 3: 30 seconds
Attempt 4: 2 minutes
Attempt 5: 10 minutes
Attempt 6: 1 hour
Attempt 7: 2 hours
Attempt 8: 4 hours
Max Attempts: 8 → Move to DLQ
```

### Retry Decision Matrix

| HTTP Status | Meaning | Retry? | Action |
|-------------|---------|--------|--------|
| 200/201 | Success | NO | Mark SUCCESS |
| 400 | Bad Request (validation error) | NO | Move to DLQ, surface to user |
| 401 | Unauthorized (token expired) | YES (once) | Refresh OAuth token, retry once |
| 403 | Forbidden (insufficient permissions) | NO | Move to DLQ, escalate to admin |
| 404 | Not Found | NO | Move to DLQ (patient doesn't exist in NHIE) |
| 409 | Conflict (duplicate patient) | NO | Fetch existing NHIE patient ID, mark SUCCESS |
| 422 | Unprocessable Entity (business rule) | NO | Move to DLQ, log error details |
| 429 | Rate Limit | YES | Retry with exponential backoff |
| 500/502/503 | Server Error | YES | Retry with exponential backoff |
| Timeout | Network timeout | YES | Retry with exponential backoff |

**Reference:** AGENTS.md lines 700-712

---

## Usage Examples

### Example 1: Log Successful Patient Submission

```java
NHIETransactionLog log = new NHIETransactionLog();
log.setTransactionId(UUID.randomUUID().toString());
log.setPatientId(patient.getPatientId());
log.setResourceType("PATIENT");
log.setHttpMethod("POST");
log.setEndpoint("https://nhie-sandbox.moh.gov.gh/fhir/Patient");
log.setRequestBody(maskRequestBody(fhirPatientJson));
log.setResponseStatus(201);
log.setResponseBody(maskResponseBody(nhieResponse));
log.setStatus("SUCCESS");
log.setNhieResourceId(nhiePatientId);
log.setRetryCount(0);
log.setCreatedAt(new Date());
log.setUpdatedAt(new Date());
log.setCreator(Context.getAuthenticatedUser().getUserId());

transactionLogDao.save(log);
```

### Example 2: Log Failed Submission (Retryable)

```java
NHIETransactionLog log = new NHIETransactionLog();
log.setTransactionId(UUID.randomUUID().toString());
log.setPatientId(patient.getPatientId());
log.setResourceType("PATIENT");
log.setHttpMethod("POST");
log.setEndpoint("https://nhie-sandbox.moh.gov.gh/fhir/Patient");
log.setRequestBody(maskRequestBody(fhirPatientJson));
log.setResponseStatus(503); // Service Unavailable
log.setResponseBody("Service temporarily unavailable");
log.setStatus("FAILED");
log.setRetryCount(0);
log.setNextRetryAt(calculateNextRetryTime(0)); // +5 seconds
log.setErrorMessage("NHIE server returned 503");
log.setCreatedAt(new Date());
log.setUpdatedAt(new Date());
log.setCreator(Context.getAuthenticatedUser().getUserId());

transactionLogDao.save(log);
```

### Example 3: Query Retry Queue

```sql
-- Get transactions ready for retry
SELECT * FROM ghanaemr_nhie_transaction_log
WHERE status = 'FAILED'
  AND retry_count < 8
  AND next_retry_at <= NOW()
ORDER BY next_retry_at ASC
LIMIT 100;
```

### Example 4: Query Patient Transaction History

```sql
-- Get all NHIE transactions for a patient
SELECT 
    transaction_id,
    resource_type,
    http_method,
    status,
    response_status,
    retry_count,
    created_at,
    updated_at
FROM ghanaemr_nhie_transaction_log
WHERE patient_id = ?
ORDER BY created_at DESC;
```

### Example 5: Query DLQ (Dead Letter Queue)

```sql
-- Get transactions that need manual review
SELECT 
    id,
    transaction_id,
    patient_id,
    resource_type,
    status,
    retry_count,
    error_message,
    created_at
FROM ghanaemr_nhie_transaction_log
WHERE status = 'DLQ'
ORDER BY created_at DESC;
```

---

## NHIS Coverage Cache Usage

### Example 1: Cache Eligibility Check Result

```java
NHIECoverageCache cache = new NHIECoverageCache();
cache.setNhisNumber(patient.getNhisNumber());
cache.setStatus("ACTIVE");
cache.setValidFrom(coverage.getPeriod().getStart());
cache.setValidTo(coverage.getPeriod().getEnd());
cache.setCoverageJson(coverageJson);
cache.setCachedAt(new Date());
cache.setExpiresAt(new Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000)); // +24 hours
cache.setCreator(Context.getAuthenticatedUser().getUserId());

coverageCacheDao.save(cache);
```

### Example 2: Check Cache Before NHIE Query

```java
public CoverageStatus checkNHISEligibility(String nhisNumber) {
    // Check cache first
    NHIECoverageCache cached = coverageCacheDao.findByNhisNumber(nhisNumber);
    
    if (cached != null && cached.getExpiresAt().after(new Date())) {
        // Cache hit - return cached status
        return cached.getStatus();
    }
    
    // Cache miss or expired - query NHIE
    CoverageResource coverage = nhieClient.getCoverage(nhisNumber);
    
    // Update cache
    cacheCoverageResult(nhisNumber, coverage);
    
    return coverage.getStatus();
}
```

### Example 3: Cleanup Expired Cache Entries

```sql
-- Delete expired cache entries (run daily via scheduled task)
DELETE FROM ghanaemr_nhie_coverage_cache
WHERE expires_at < NOW();
```

---

## Monitoring & Observability

### Key Metrics to Track

1. **Success Rate:**
   ```sql
   SELECT 
       COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) * 100.0 / COUNT(*) AS success_rate_pct
   FROM ghanaemr_nhie_transaction_log
   WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
   ```

2. **Average Retry Count:**
   ```sql
   SELECT AVG(retry_count) AS avg_retries
   FROM ghanaemr_nhie_transaction_log
   WHERE status IN ('SUCCESS', 'DLQ')
     AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
   ```

3. **DLQ Size:**
   ```sql
   SELECT COUNT(*) AS dlq_count
   FROM ghanaemr_nhie_transaction_log
   WHERE status = 'DLQ';
   ```

4. **Pending Queue Depth:**
   ```sql
   SELECT COUNT(*) AS pending_count
   FROM ghanaemr_nhie_transaction_log
   WHERE status IN ('PENDING', 'FAILED')
     AND retry_count < 8;
   ```

5. **Cache Hit Rate:**
   ```sql
   SELECT 
       (SELECT COUNT(*) FROM ghanaemr_nhie_coverage_cache WHERE expires_at > NOW()) AS cached_entries,
       (SELECT COUNT(DISTINCT patient_id) FROM ghanaemr_nhie_transaction_log 
        WHERE resource_type = 'COVERAGE' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) AS total_checks;
   ```

---

## Liquibase Changeset Details

**Changeset ID:** `ghanaemr-nhie-transaction-log-1`  
**Author:** `ghana-emr`  
**Tables Created:**
- `ghanaemr_nhie_transaction_log` (primary transaction log)
- `ghanaemr_nhie_coverage_cache` (NHIS eligibility cache)

**Indexes Created:**
- 6 indexes on `ghanaemr_nhie_transaction_log`
- 2 indexes on `ghanaemr_nhie_coverage_cache`

**Foreign Keys:**
- `fk_nhie_txn_patient` → patient.patient_id
- `fk_nhie_txn_encounter` → encounter.encounter_id
- `fk_nhie_txn_creator` → users.user_id
- `fk_nhie_coverage_creator` → users.user_id

---

## Next Steps

### ✅ Completed
1. ✅ Liquibase schema created
2. ✅ Documentation complete

### 🚀 Next Tasks (Week 4-5 Continuation)
1. **Task #6: NHIE HTTP Client** (OAuth 2.0)
   - Uses `ghanaemr_nhie_transaction_log` for logging
   - References: AGENTS.md lines 460-487
   
2. **Task #8: NHIE Integration Service**
   - Uses `FhirPatientMapper` + `NHIEHttpClient`
   - Logs all transactions to `ghanaemr_nhie_transaction_log`
   
3. **Task #9: NHIE Retry Background Job**
   - Queries `ghanaemr_nhie_transaction_log` for failed transactions
   - Implements exponential backoff retry
   - Moves to DLQ after 8 attempts

4. **Task #10: Patient Dashboard UI**
   - Displays transaction status from `ghanaemr_nhie_transaction_log`
   - Shows NHIS eligibility from `ghanaemr_nhie_coverage_cache`

---

## References

- **AGENTS.md**: Lines 460-487 (OAuth), 700-783 (Error Handling & Transaction Logging)
- **08_MVP_Build_Strategy.md**: Week 4-5 NHIE Patient Sync (lines 92-98)
- **docs/specs/queue-retry-policy.md**: Retry logic specification (to be referenced by Task #9)
- **OpenMRS Liquibase Docs**: https://wiki.openmrs.org/display/docs/Liquibase

---

**Completion Date:** November 1, 2025  
**Status:** ✅ Ready for Task #6 (NHIE HTTP Client)  
**Next Milestone:** Complete Week 4-5 NHIE Patient Sync phase
\n---\n\n## Update — Nov 2, 2025: Logger Abstraction and Tests\n\nTo improve testability and clarity for contributors, we introduced a transaction logger abstraction and a comprehensive test suite for NHIEIntegrationService.\n\nLocations\n- Logger API: `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/NHIETransactionLogger.java`\n- Default Logger (JDBC): `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/DefaultNHIETransactionLogger.java`\n- Service usage (injection): `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/impl/NHIEIntegrationServiceImpl.java`\n\nKey Points\n- Table name aligned to Liquibase: `ghanaemr_nhie_transaction_log`\n- `creator` column is populated (authenticated user id or 1 if unavailable)\n- All request/response bodies passed to the logger are masked (see `maskPII` in the service)\n\nUnit Tests Added\n- `NHIEIntegrationServiceTest`: success (201/200), duplicate (409), errors (401/422/429/503), PII masking\n- `NHIEIntegrationServiceLoggingTest`: verifies PENDING→SUCCESS/FAILED logging calls, statuses, endpoints, masked payloads\n- `NHIEIntegrationServiceEdgeCasesTest`: missing Ghana Card, duplicate w/o id, attribute type missing, body id extraction, maskIdentifier\n\nHow to Run\n```
mvn -q -pl backend/openmrs-module-ghanaemr -am clean test
``` 
