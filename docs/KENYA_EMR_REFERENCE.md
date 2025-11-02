# KenyaEMR References for Ghana EMR

## Overview

KenyaEMR (Palladium Kenya) is a mature OpenMRS implementation. While Ghana must strictly follow NHIE middleware rules, KenyaEMR offers reusable mechanics for interoperability layers, queuing, retries, and packaging that we can adapt (without copying country‑specific logic or calling KHIE directly).

Organization: https://github.com/palladiumkenya  
Org repositories: https://github.com/orgs/palladiumkenya/repositories?type=all  
Related org (Kenya HIE ecosystem): https://github.com/savannahghi

Reuse scope for Ghana:
- Mechanics only: routing, retries/backoff, transaction logs, dead‑letter handling, module organization, metadata packaging.
- Do not reuse Kenya business rules or direct KHIE endpoints. All Ghana exchanges must route via NHIE per AGENTS.md.

---

## Key Repositories

### Interoperability Layer (IL)
- Repo: https://github.com/palladiumkenya/openmrs-module-kenyaemrIL
- Relevance: Patterns for orchestrating outbound messages to national systems via a mediator; useful for structuring our `NHIEIntegrationService` + queueing and error handling.
- Reuse in Ghana: Adopt module boundaries, queue + status models, retry/backoff handling, and logging patterns. Replace endpoints/auth with NHIE OAuth/mTLS and enforce NHIE idempotency and headers (X-Request-ID).

### Sync Orchestration
- Repo: https://github.com/palladiumkenya/SyncAllEMRs
- Relevance: Cross‑site synchronization orchestration and scheduling patterns.
- Reuse in Ghana: Inform scheduling and batch limits for NHIE submissions. Retain Ghana’s retry matrix and DLQ rules.

### Distribution & Metadata Packaging
- Repo: https://github.com/palladiumkenya/openmrs-config-kenyaemr
- Relevance: Packaging configuration, concepts, identifier types, and deploy config.
- Reuse in Ghana: Mirror packaging approach for Ghana metadata (concepts, identifiers, locations), avoid ad‑hoc SQL.

### Content and Reporting Assets
- Repo: https://github.com/palladiumkenya/openmrs-content-kenyahmis
- Relevance: How reporting/content assets are organized and versioned.
- Reuse in Ghana: Apply structure for Ghana reports (OPD register, NHIS vs Cash, top diagnoses, revenue) using OpenMRS Reporting module.

### Additional Modules (Selected)
- KenyaEMR core distribution: https://github.com/palladiumkenya/openmrs-module-kenyaemr
- Appointments module: https://github.com/palladiumkenya/openmrs-module-appointments
- Insurance claims: https://github.com/palladiumkenya/openmrs-module-insuranceclaims
- ESM apps (3.x): https://github.com/palladiumkenya/kenyaemr-esm-3.x

Note: These are for broader context; Ghana MVP scope is OPD + NHIE sync. Use selectively.

### Related Ecosystem (Savannah Informatics)
- Org: https://github.com/savannahghi
- Relevance: Kenya HIE ecosystem vendor; examples of mediator/interoperability services and health information exchange tooling.  
  Reuse in Ghana: Mechanics and patterns only (service boundaries, mediator concepts). Do not reuse country‑specific endpoints or flows; keep NHIE‑only routing per AGENTS.md.

---

## Patterns to Reuse (Mechanics)

- Message routing via a mediator layer
  - Kenya: IL mediates between EMR and national systems.
  - Ghana: Route strictly via NHIE middleware; NHIE handles MPI/NHIA internally.

- Queue‑based async submission
  - Persist queued payloads with status (PENDING, SUCCESS, FAILED, DLQ).
  - Use batch limits and scheduled dispatch tasks.

- Retry with exponential backoff
  - Apply our Ghana retry schedule (Immediate, 5s, 30s, 2m, 10m, 1h, 2h, 4h; max 8 attempts).
  - Refresh token on 401 once, then respect backoff rules.

- Idempotency and headers
  - Include `X-Request-ID` per request.
  - Use conditional creates where supported.

- Transaction logging and observability
  - Record endpoint, method, status, masked payloads, retry count, timestamps.
  - No PII in logs; mask Ghana Card, NHIS, names, phones per AGENTS.md.

- Packaging and deployment
  - Ship metadata and configuration via modules/bundles.
  - Keep core untouched; implement in OMODs and configs.

---

## Ghana‑Specific Deltas (Non‑Negotiable)

- NHIE Middleware Only: Never call NHIA/MPI directly; all traffic goes EMR → NHIE.
- OAuth 2.0 Client Credentials: Cache tokens, pre‑refresh, retry once on 401.
- mTLS (if required): Keystore at `src/main/resources/nhie-keystore.jks`, loaded by `NHIEHttpClient`.
- Canonical FHIR Identifiers: Ghana Card, NHIS, Folder Number system URIs per AGENTS.md.
- PII Masking: Always mask identifiers and names in logs.

---

## How To Use This Reference

1) Use KenyaEMR IL and SyncAllEMRs to inform mechanics of queueing, retries, and logging.
2) Apply Ghana NHIE specs for endpoints, OAuth/mTLS, idempotency, and error handling.
3) Package Ghana metadata following openmrs-config-kenyaemr patterns.
4) Keep all Ghana differences documented in AGENTS.md and 02_NHIE_Integration_Technical_Specifications.md.
