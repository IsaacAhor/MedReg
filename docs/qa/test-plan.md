# Test Plan

Scope
- Unit: validators, mappers, retry logic.
- Integration: NHIE mock scenarios (200/401/409/422/5xx/timeout).
- Performance: target concurrent users and response times.

Acceptance
- Criteria aligned to pilot acceptance document.

---

NHIE Integration Service Test Suite (Nov 2, 2025)
- Location: `backend/openmrs-module-ghanaemr/api/src/test/java/org/openmrs/module/ghanaemr/api/nhie/`
- Files:
  - `NHIEIntegrationServiceTest.java` — success (201/200), duplicate (409), errors (401/422/429/503), PII masking
  - `NHIEIntegrationServiceLoggingTest.java` — verifies PENDING→SUCCESS/FAILED logs with masked payloads
  - `NHIEIntegrationServiceEdgeCasesTest.java` — Ghana Card missing, duplicate without id, attribute type missing, ID extraction from body
- Coverage Target: >90% lines/branches for NHIEIntegrationService and logging paths
- Run:
  - `mvn -q -pl backend/openmrs-module-ghanaemr -am clean test`
  - For full report (if Jacoco enabled): `mvn -pl backend/openmrs-module-ghanaemr verify`

Notes
- Logging is decoupled via `NHIETransactionLogger`; tests inject a mock to assert exact calls and masking.
- Default logger writes to `ghanaemr_nhie_transaction_log` with `creator` populated.
