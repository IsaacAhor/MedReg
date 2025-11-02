# Liquibase Schema (NHIE Adapter)

- Purpose: Define tables and indexes for transaction log and queue.

Tables
- nhie_transaction_log: id, uuid, resource_type, payload, status, http_code, error, created_at, updated_at, patient_id
- nhie_transaction_queue: id, uuid, resource_type, payload, attempt_count, next_attempt_at, status, created_at, patient_id
- gh_folder_number_sequence: prefix (PK), last_seq (INT)

Indexes
- By patient_id, status, created_at

Retention
- Log retention policy and archival guidance

---

Folder Number Sequence Table
- Name: `gh_folder_number_sequence`
- Purpose: Persist and atomically increment folder number sequence per `{REGION}-{FACILITY}-{YEAR}` prefix.
- Primary Key: `prefix` (VARCHAR(50)) â€” e.g., `GA-KBTH-2025`
- Column: `last_seq` (INT, NOT NULL)
- Behavior:
  - On allocate: increment `last_seq` and return value; if missing, create row with `last_seq=0` then increment.
  - Used by the Ghana Folder Number module endpoint: `/ws/ghana/foldernumber/allocate`.
\n---
\n## Update — Nov 2, 2025: Canonical Tables and Logger Alignment
\nCanonical Tables (as defined in `backend/openmrs-module-ghanaemr/api/src/main/resources/liquibase.xml`)
- `ghanaemr_nhie_transaction_log` — primary transaction log
  - Columns: `id`, `transaction_id`, `patient_id`, `encounter_id`, `resource_type`, `http_method`, `endpoint`, `request_body`, `response_status`, `response_body`, `retry_count`, `status`, `error_message`, `nhie_resource_id`, `created_at`, `updated_at`, `next_retry_at`, `creator`
  - Indexes: by `patient_id`, `encounter_id`, `status`, `created_at`, composite retry queue (`status`,`next_retry_at`,`retry_count`), `transaction_id`
- `ghanaemr_nhie_coverage_cache` — NHIS eligibility cache
  - Columns: `id`, `nhis_number`, `status`, `valid_from`, `valid_to`, `coverage_json`, `cached_at`, `expires_at`, `creator`
  - Indexes: by `nhis_number`, `expires_at`
\nNotes
- Default logger writes to `ghanaemr_nhie_transaction_log` and sets `creator`.
- Retry scheduling uses `next_retry_at` + `retry_count` within the log table (no separate queue table).
