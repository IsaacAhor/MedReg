# Ghana EMR (GHIMS) Using OpenMRS: Requirements, Architecture Mapping, and Execution Plan

This document synthesizes Ghana’s Ministry of Health direction (as captured in `speech.md`) and maps it to a practical, standards‑aligned EMR implementation using OpenMRS. It includes official OpenMRS documentation links and a concrete execution gameplan.

## 1) Ghana MoH EMR Priorities (derived from speech.md)

- Interoperability via the National Health Information Exchange (NHIE)
  - “established the National Health Information Exchange (NHIE) on state infrastructure.” (`speech.md`:66)
  - NHIE is “the national backbone for health data” and where “every health data/system integration will now exist and occur.” (`speech.md`:68)
  - All systems must integrate through NHIE, not directly to NHIA/billing lines. (`speech.md`:94)
- State custody and sovereignty of data
  - Vendor denial of access is unacceptable; public health data must be under MoH authority/state custody. (`speech.md`:46, `speech.md`:54, `speech.md`:78)
- Vendor‑neutral, multi‑vendor model
  - Remaining facilities will be awarded “across multiple approved vendors,” all integrating via NHIE. (`speech.md`:90, `speech.md`:92, `speech.md`:94)
- Continuity of care and operations
  - NHIE enables facilities to “continue care even if their local system goes down.” (`speech.md`:68)
  - GHIMS scope: registration, clinical documentation, NHIS eligibility, billing, claims, referrals, continuity of care. (`speech.md`:82)

Implication: Ghana prioritizes an interoperable, modular, vendor‑neutral EMR ecosystem, with standardized exchange through NHIE and strict state custody of clinical data.

## 2) Recommended Open‑Source EMR Options

- OpenMRS (primary recommendation)
  - Mature, modular EMR platform with strong adoption in LMIC programs; extensible via modules and modern O3 frontend. Suited for national deployments and customization.
  - Site: https://openmrs.org/
- Bahmni (OpenMRS‑based distribution)
  - Integrates OpenMRS with packaged billing/LIS/RIS options; useful where comprehensive facility workflows are needed. Must still route all national data flows through NHIE.
  - Site: https://www.bahmni.org/
- GNU Health (alternate)
  - Community EMR; feasible but less common in large national LMIC rollouts compared to OpenMRS/Bahmni.
  - Site: https://www.gnuhealth.org/

## 3) OpenMRS Architecture (from official documentation)

- Platform and Modules
  - Java/Spring‑based OpenMRS Platform exposes a service layer and persistence; extended via modules.  
    Docs: https://wiki.openmrs.org/display/docs/OpenMRS+Platform
- Data Model and Concept Dictionary
  - Core domain: Patient, Encounter, Observation, Orders, Provider, Location, driven by a concept dictionary to structure clinical data and forms.  
    Docs: https://wiki.openmrs.org/display/docs/Concept+Dictionary+Basics
- APIs (REST and FHIR)
  - REST Web Services for CRUD and workflows.  
    Docs: https://wiki.openmrs.org/display/docs/REST+Web+Services+API+For+Clients  
  - FHIR2 Module implements FHIR R4 resources for interoperability.  
    Docs: https://wiki.openmrs.org/display/projects/FHIR2+Module
- UI Layers
  - Reference Application (server‑rendered UI distribution).  
    Docs: https://wiki.openmrs.org/display/projects/Reference+Application+Distribution  
  - OpenMRS 3 (O3) microfrontend architecture for modular modern web apps.  
    Docs: https://o3-docs.openmrs.org/
- Standardized Concepts via OCL/CIEL
  - Leverage OCL for OpenMRS to manage and version concept dictionaries (e.g., CIEL).  
    Docs: https://wiki.openmrs.org/display/projects/OCL+for+OpenMRS

## 4) Leveraging OpenMRS to Meet Ghana’s Requirements

- Integrate exclusively through NHIE
  - Use OpenMRS REST and/or FHIR2 interfaces to connect to NHIE for patient lookup, NHIS eligibility, claims, referrals, and history retrieval (`speech.md`:68, `speech.md`:94).
  - If NHIE is FHIR‑based, map to FHIR Patient, Encounter, Observation, and relevant financial resources (e.g., Coverage/Claim/ClaimResponse) via the FHIR2 module.
- Enforce state custody and portability
  - Host OpenMRS and databases on MoH‑controlled infrastructure; implement RBAC and encrypted, tested backups. Ensure full export procedures for data, metadata, and concepts to prevent lock‑in (`speech.md`:46, `speech.md`:54, `speech.md`:78, `speech.md`:94).
- Ghana clinical content
  - Build Ghana‑specific concept sets and forms for GHIMS scope (registration, clinical documentation, referrals, billing‑relevant data) (`speech.md`:82). Use OCL for OpenMRS to manage and share standardized concepts.
- NHIS eligibility and claims via NHIE
  - Integrate OpenMRS workflows to initiate eligibility checks and claims strictly through NHIE, not directly to NHIA (`speech.md`:94).
- Multi‑vendor operations
  - Package OpenMRS with versioned metadata and deployment profiles so multiple vendors can roll out the same standardized client while preserving interoperability (`speech.md`:90, `speech.md`:92, `speech.md`:94). Prefer O3 microfrontends for modular feature delivery.
- Stabilization and continuity of care
  - Phase activation of the initial 450 facilities as described, using NHIE to reconstruct longitudinal histories where permissible and to maintain continuity (`speech.md`:84, `speech.md`:86, `speech.md`:72, `speech.md`:78).

## 5) Execution Gameplan

Phase 0 — Governance and Infrastructure
- Establish MoH‑controlled hosting, environments, and CI/CD for OpenMRS Platform and O3 frontend.  
  Ref: OpenMRS Platform — https://wiki.openmrs.org/display/docs/OpenMRS+Platform
- Define data export/backup SOPs (database, concepts, metadata packages) to ensure portability and sovereignty.  
  Ref: OCL for OpenMRS — https://wiki.openmrs.org/display/projects/OCL+for+OpenMRS

Phase 1 — Interoperability Foundations (NHIE)
- Define NHIE interface specifications and message contracts (FHIR R4 if available). Map to OpenMRS/FHIR2 resources and REST endpoints.  
  Ref: FHIR2 Module — https://wiki.openmrs.org/display/projects/FHIR2+Module  
  Ref: REST API — https://wiki.openmrs.org/display/docs/REST+Web+Services+API+For+Clients
- Implement NHIE adapter module(s) in OpenMRS for:
  - Patient search/matching, encounter and observation sync, referrals
  - NHIS eligibility checks and claims submission/tracking via NHIE
- Configure patient identifiers to include NHIS number and any national MPI for cross‑system matching.  
  Ref: Identifier management — https://wiki.openmrs.org/display/docs/Patient+Identifiers

Phase 2 — Clinical Content and Forms
- Curate Ghana concept dictionary (OCL/CIEL base + Ghana extensions).  
  Ref: Concept dictionary — https://wiki.openmrs.org/display/docs/Concept+Dictionary+Basics  
  Ref: OCL for OpenMRS — https://wiki.openmrs.org/display/projects/OCL+for+OpenMRS
- Build forms for GHIMS scope (registration, OPD/IPD encounters, referrals, discharge summaries).  
  Ref: HTML Form Entry — https://wiki.openmrs.org/display/docs/HTML+Form+Entry  
  Ref: O3 Forms — https://o3-docs.openmrs.org/

Phase 3 — Application Layer and UX
- Adopt OpenMRS 3 (O3) microfrontends for modular, vendor‑neutral UI packages.  
  Ref: O3 docs — https://o3-docs.openmrs.org/
- Package a Ghana distribution (O3 frontend + platform modules + metadata), versioned and publishable to vendors.
  
Phase 4 — Rollout and Stabilization
- Wave 1: Reactivate ~200 facilities (teaching + regional hospitals + selected high‑volume sites) (`speech.md`:84), then remaining original ~450 (`speech.md`:86).  
  Ref: Deployment guides — https://wiki.openmrs.org/display/docs/System+Administration
- Implement monitoring, logging, and incident response across all facilities; exercise NHIE offline‑tolerant workflows to preserve care continuity (`speech.md`:68).

Phase 5 — Multi‑Vendor Scaling (2026 and beyond)
- Run EOI and prequalification; provide standardized Ghana OpenMRS distribution and NHIE integration conformance tests to all approved vendors (`speech.md`:90, `speech.md`:92, `speech.md`:94).
- Enforce certification via NHIE test harnesses (FHIR/REST) before production onboarding.

## 6) Deliverables Checklist

- Ghana OpenMRS Distribution (Platform + Modules + O3 Frontend) with versioned metadata
- NHIE Interop Adapter(s) for FHIR/REST (patient, encounters, observations, referrals, eligibility, claims)
- Ghana Concept Dictionary package (OCL) + content governance SOPs
- Facility deployment automation (infrastructure as code, backups, monitoring)
- Vendor conformance suite and certification process via NHIE

## 7) References

- Ghana MoH speech (local source):  
  - `speech.md`:66 — Establish NHIE on state infrastructure  
  - `speech.md`:68 — NHIE is national backbone; continue care  
  - `speech.md`:82 — GHIMS scope  
  - `speech.md`:84, `speech.md`:86 — Rollout plan for 450 facilities  
  - `speech.md`:90, `speech.md`:92, `speech.md`:94 — Multi‑vendor model; integrate through NHIE  
  - `speech.md`:46, `speech.md`:54, `speech.md`:78 — State custody/sovereignty of data

- OpenMRS official documentation:
  - OpenMRS Platform — https://wiki.openmrs.org/display/docs/OpenMRS+Platform
  - Concept Dictionary Basics — https://wiki.openmrs.org/display/docs/Concept+Dictionary+Basics
  - REST Web Services API — https://wiki.openmrs.org/display/docs/REST+Web+Services+API+For+Clients
  - FHIR2 Module — https://wiki.openmrs.org/display/projects/FHIR2+Module
  - Reference Application — https://wiki.openmrs.org/display/projects/Reference+Application+Distribution
  - OpenMRS 3 (O3) docs — https://o3-docs.openmrs.org/
  - OCL for OpenMRS — https://wiki.openmrs.org/display/projects/OCL+for+OpenMRS

- EMR options:
  - OpenMRS — https://openmrs.org/
  - Bahmni — https://www.bahmni.org/
  - GNU Health — https://www.gnuhealth.org/

---

## MoH Requirements vs OpenMRS Fit

- Interoperability through NHIE (all integrations via exchange)
  - MoH requirement: NHIE is the national backbone; all integrations occur through NHIE; no direct links to NHIA/billing (speech.md:66, speech.md:68, speech.md:94).
  - OpenMRS fit: Strong via FHIR2 and REST APIs to implement an NHIE adapter module.  
    Docs: OpenMRS Platform, REST, FHIR2 — https://wiki.openmrs.org/display/docs/OpenMRS+Platform • https://wiki.openmrs.org/display/docs/REST+Web+Services+API+For+Clients • https://wiki.openmrs.org/display/projects/FHIR2+Module

- State custody and data sovereignty
  - MoH requirement: Clinical data under MoH authority; full access and export; no vendor lock‑in (speech.md:46, speech.md:54, speech.md:78).
  - OpenMRS fit: Strong — open‑source, self‑hostable on MoH infrastructure; full database control; export via APIs and DB; roles/privileges configurable.  
    Docs: OpenMRS Platform, System Administration — https://wiki.openmrs.org/display/docs/OpenMRS+Platform • https://wiki.openmrs.org/display/docs/System+Administration

- Vendor‑neutral, multi‑vendor rollout
  - MoH requirement: Multiple approved vendors deliver facilities; all solutions must integrate via NHIE (speech.md:90, speech.md:92, speech.md:94).
  - OpenMRS fit: Strong — modular platform, versioned distributions, O3 microfrontends enable standardized client packages across vendors.  
    Docs: Reference Application, O3 docs — https://wiki.openmrs.org/display/projects/Reference+Application+Distribution • https://o3-docs.openmrs.org/

- Continuity of care under outages/low connectivity
  - MoH requirement: Facilities should continue care even if local system goes down; resilient exchange (speech.md:68).
  - OpenMRS fit: Partial — requires engineered store‑and‑forward and retry within an NHIE adapter and operational runbooks; OpenMRS provides the extension points and APIs.  
    Docs: Platform, REST — https://wiki.openmrs.org/display/docs/OpenMRS+Platform • https://wiki.openmrs.org/display/docs/REST+Web+Services+API+For+Clients

- GHIMS functional scope (registration, clinical documentation, eligibility, billing, claims, referrals, continuity)
  - MoH requirement: GHIMS covers clinical + insurance workflows through NHIE (speech.md:82).
  - OpenMRS fit: Clinical workflows — strong via encounters, observations, orders, forms and concept dictionary; Insurance/claims — via NHIE integration (not core).  
    Docs: Concept Dictionary, HTML Form Entry, FHIR2 — https://wiki.openmrs.org/display/docs/Concept+Dictionary+Basics • https://wiki.openmrs.org/display/docs/HTML+Form+Entry • https://wiki.openmrs.org/display/projects/FHIR2+Module

- Patient lookup and identity (MPI, NHIS number)
  - MoH requirement: National patient lookup and consistent identifiers for exchange (speech.md:68).
  - OpenMRS fit: Strong for identifier management and local MRNs; integrate with NHIE/MPI for cross‑facility identity; configure NHIS and national IDs via IDGEN.  
    Docs: ID Generation, Patient Identifiers — https://github.com/openmrs/openmrs-module-idgen • https://wiki.openmrs.org/display/docs/Patient+Identifiers

- Data standards and semantics for exchange
  - MoH requirement: Standardized, interoperable payloads via NHIE.
  - OpenMRS fit: Strong — concept‑based model; leverage OCL/CIEL for standardized vocabularies; map to NHIE value sets.  
    Docs: OCL for OpenMRS — https://wiki.openmrs.org/display/projects/OCL+for+OpenMRS

- Referrals and continuity‑of‑care history via NHIE
  - MoH requirement: View referral and treatment history through NHIE (speech.md:68).
  - OpenMRS fit: Strong on producing/consuming encounter data; implement NHIE adapter to publish/consume referral and history resources (FHIR/REST).  
    Docs: FHIR2, REST — https://wiki.openmrs.org/display/projects/FHIR2+Module • https://wiki.openmrs.org/display/docs/REST+Web+Services+API+For+Clients

- Claims and eligibility via NHIE (not direct to NHIA)
  - MoH requirement: Use NHIE rails for eligibility and claims (speech.md:94).
  - OpenMRS fit: Conditional — implement via NHIE adapter. If FHIR financial resources (Coverage/Claim/ClaimResponse) are required but not yet covered by FHIR2, extend via module or REST proxies.  
    Docs: FHIR2 (scope), REST — https://wiki.openmrs.org/display/projects/FHIR2+Module • https://wiki.openmrs.org/display/docs/REST+Web+Services+API+For+Clients

Summary: OpenMRS aligns well with Ghana’s interoperability‑first, vendor‑neutral direction. Core clinical features and modular architecture are a strong fit; NHIE‑specific adapters, offline queueing, and any financial resource gaps require targeted engineering but are supported by OpenMRS’s extension model.

## Appendix: OpenMRS GitHub Repos (Interoperability)

- OpenMRS org — https://github.com/OpenMRS  
  Entry point to all platform, modules, and O3 repos.
- Core platform (`openmrs-core`) — https://github.com/openmrs/openmrs-core  
  Extend service layer, listen to events, map domain to FHIR; foundation for custom NHIE adapter modules.
- FHIR2 module — https://github.com/openmrs/openmrs-module-fhir2  
  Expose FHIR R4 resources; implement Ghana NHIE profiles, search params, and operations; hook into interceptors for auth/audit.
- REST Web Services module — https://github.com/openmrs/openmrs-module-webservices.rest  
  Publish REST endpoints where NHIE requires non‑FHIR interfaces; add resources for eligibility/claims proxies if needed.
- OpenMRS 3 (O3) frontend core — https://github.com/openmrs/openmrs-esm-core  
  Build microfrontends for NHIE workflows (patient lookup, referrals, claims status) consuming FHIR/REST.
- Reference Application distribution — https://github.com/openmrs/openmrs-distro-referenceapplication  
  Baseline packaging and deployment pattern; useful for facility pilots before moving to O3 distribution.
- OpenMRS SDK — https://github.com/openmrs/openmrs-sdk  
  Scaffold, run, and package platform + modules; automate local/staging environments for NHIE adapter testing.
- ID Generation module (identifier management) — https://github.com/openmrs/openmrs-module-idgen  
  Configure NHIS number and national MPI schemes; validate/format identifiers used in NHIE matching.

Notes
- This document cites only `speech.md` for Ghana MoH direction and links to official OpenMRS docs. If you want me to append Ghana MoH standards or eHealth policy document links (e.g., specific NHIE technical specs, Data Protection guidance), please allow network access or add those documents so I can cite them precisely.

## NHIE As Middleware — Architecture and Boundaries

- Role of NHIE
  - NHIE is the national backbone/middleware for all health data integrations; every integration occurs through NHIE (speech.md:66, speech.md:68, speech.md:94).
- System boundaries
  - OpenMRS instances at facilities exchange data only with NHIE; no direct integrations to NHIA, billing lines, or third parties (speech.md:94).
- Core flows via NHIE
  - Patient discovery/lookup, NHIS eligibility checks, claims submission and tracking, referrals, and continuity‑of‑care history retrieval (speech.md:68, speech.md:82, speech.md:94).
- Adapter pattern in OpenMRS
  - Implement an NHIE Adapter Module using FHIR2 and/or REST to mediate all outbound/inbound exchanges; handle mapping, validation, retries, and auditing.
- Security and custody
  - Use NHIE‑mandated auth (e.g., OAuth2/mTLS if specified), encrypt in transit, and log access; persist clinical data under state custody within MoH‑controlled infrastructure (speech.md:46, speech.md:54, speech.md:78).
- Offline/queueing
  - Buffer requests locally (store‑and‑forward), use idempotency keys and retry/backoff to reconcile after outages (speech.md:68).

## Interoperability Checklist (NHIE Middleware)

- API contracts
  - Confirm NHIE protocols (FHIR R4/REST), profiles, required resources/operations (Patient, Encounter, Observation, Coverage, Claim, ClaimResponse, Referral).
- Identity and registries
  - Configure NHIS number and any national MPI; define matching rules and facility/provider/location code systems.
- Security and audit
  - Implement NHIE auth, scopes/roles, TLS; record AuditEvent‑equivalent logs and retain per MoH policy.
- Data mapping and validation
  - Map OpenMRS concepts to national value sets (OCL/CIEL + Ghana extensions); validate payloads against NHIE profiles.
- Reliability and offline
  - Queue, retry, and deduplicate; define reconciliation and conflict resolution after connectivity restores.
- Operations and monitoring
  - Instrument adapter with metrics/tracing; centralize logs and alerts; define incident response and escalation paths.
- Conformance and change management
  - Pass NHIE certification tests; track NHIE versioning and apply non‑breaking upgrades within defined windows (speech.md:90, speech.md:92, speech.md:94).

## Ghana‑Specific Enhancements (Value‑Add Modules)

Note: All integrations must route through NHIE, not directly to NHIA/billing lines (speech.md:94).

- NHIE Integration Module (eligibility + claims)
  - Purpose: Verify NHIS eligibility and submit/track claims via NHIE rails (speech.md:68, speech.md:94).
  - OpenMRS design: Implement an adapter using FHIR2 and/or REST; map identifiers (NHIS, MPI), encounters, diagnoses, services to NHIE payloads; handle auth, retries, and auditing.  
    Refs: FHIR2 — https://wiki.openmrs.org/display/projects/FHIR2+Module • REST — https://wiki.openmrs.org/display/docs/REST+Web+Services+API+For+Clients • IDGEN — https://github.com/openmrs/openmrs-module-idgen
  - Acceptance: Demonstrate successful eligibility checks and end‑to‑end claim lifecycle through NHIE’s sandbox and conformance tests.

- Billing & Revenue Module
  - Purpose: Track service fees, invoices, payments, and reconciliations locally; hand off claims through NHIE.
  - OpenMRS design: Model billable items and invoices linked to visits/encounters; expose summaries to the NHIE Integration Module for claims packaging; optionally integrate with Bahmni billing if adopted.  
    Refs: OpenMRS Platform — https://wiki.openmrs.org/display/docs/OpenMRS+Platform • Bahmni — https://www.bahmni.org/
  - Acceptance: Create, update, and reconcile invoices; produce claim‑ready bundles for NHIE; audit trails for financial events.

- Referral & Continuity Module
  - Purpose: Track patient transfers and care pathways; publish/consume referral and history artifacts via NHIE to support continuity (speech.md:68).
  - OpenMRS design: Capture referral intent and referral outcome within encounters; expose/pull referral and encounter summaries through the NHIE adapter; link external history to patient record.
  - Acceptance: Send/receive referrals via NHIE; display longitudinal history retrieved through NHIE in patient chart.

- Offline Sync Module
  - Purpose: Operate in low‑connectivity sites using local storage with periodic sync to NHIE, preserving care continuity (speech.md:68).
  - OpenMRS design: Local queue and datastore (e.g., embedded store/SQLite) to cache operations; implement idempotent requests, conflict detection/merge, and exponential backoff inside the NHIE adapter.
  - Acceptance: Queue builds during outage; on restore, sync submits without duplication; conflicts resolved per policy with audit.

- Ghana Data Protection Compliance Pack
  - Purpose: Encryption, consent tracking, access logging, and export tooling to meet state custody and compliance needs (speech.md:46, speech.md:54, speech.md:78).
  - OpenMRS design: Enforce RBAC and least‑privilege, encrypt at rest (DB/backups) and in transit (TLS), record access/audit events, implement consent capture and reporting, and provide data export for state custody.
  - Acceptance: Pass MoH compliance checklist; prove backup/restore, export, audit review, and consent/reporting workflows.
