# Liquibase Schema (NHIE Adapter)

- Purpose: Define tables and indexes for transaction log and queue.

Tables
- nhie_transaction_log: id, uuid, resource_type, payload, status, http_code, error, created_at, updated_at, patient_id
- nhie_transaction_queue: id, uuid, resource_type, payload, attempt_count, next_attempt_at, status, created_at, patient_id

Indexes
- By patient_id, status, created_at

Retention
- Log retention policy and archival guidance
