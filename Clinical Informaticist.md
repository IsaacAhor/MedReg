# Clinical Informaticist: Ghana EMR Implementation Playbook

## Overview

The Clinical Informaticist is the bridge between Ghana’s clinical reality and the EMR build. This document defines the responsibilities, deliverables, decision frameworks, and standards for a Clinical Informaticist leading an OpenMRS-based implementation integrated with Ghana’s NHIE, NHIS, and DHIMS2 reporting.

**Primary Objectives**
- Ensure the EMR reflects Ghanaian clinical workflows accurately and safely (OPD, IPD, ANC, Immunization, Pharmacy, Lab).
- Codify national policies and business rules (NHIS eligibility, G-DRG/tariffs, STGs, referral pathways) into forms, decision support, and validation.
- Govern the clinical concept dictionary and terminology mappings used across the platform and NHIE.
- Drive adoption via fit-for-purpose UX, change management, training, and continuous quality improvement (CQI).

---

## Role Scope (Ghana Context)

**Healthcare System Interfaces**
- NHIE (middleware): Patient identity, eligibility, shared records, referrals.
- NHIS (via NHIE only): Eligibility verification, claims submission and responses.
- DHIMS2 (Ghana’s DHIS2 instance): Aggregate reporting; indicator definitions and data provenance.
- Facility operations: OPD/IPD, MCH (ANC/PNC/Immunization), Pharmacy, Laboratory, Billing.

**Standards and Codes**
- Diagnoses: ICD-10 (WHO). Primary coding system for submissions and analytics.
- Medicines: Ghana Essential Medicines List (G-EML) with ATC/DDD as reference; local formulary codes aligned to national lists.
- Labs/Vitals: Local code sets with mapping strategy to LOINC for interoperability readiness (where available).
- FHIR R4 resources via NHIE: Patient, Encounter, Condition, Observation, MedicationRequest, DocumentReference, Coverage, Claim/ClaimResponse, ServiceRequest.
- Audit and privacy: Ghana Data Protection Act, 2012 (Act 843); ATNA-style audit expectations.

---

## Outcomes and Deliverables

1) Workflow and Form Specifications
- OPD Registration & Triage: identifiers (Ghana Card, NHIS), demographics, vitals, chief complaint.
- OPD Clinical Note: history, exam, diagnosis (ICD-10), orders (lab, meds), referrals.
- Pharmacy Dispensing: prescription, substitutions, counseling, stock-out reason.
- Laboratory: test ordering panels, sample collection, results entry, critical value flags.
- IPD Admission/Discharge: admission note, treatment sheet, progress notes, discharge summary.
- ANC (Focused ANC): visit schedule (1st–4th+), labs, IPTp, tetanus, high-risk flagging, birth plan.
- Delivery & PNC: delivery details, APGAR, complications, postnatal checks.
- Child Welfare/Immunization: EPI schedule, defaulter tracking, adverse events.

2) Concept Dictionary & Terminology Governance
- Curated concept list with UUIDs, preferred names, synonyms (English + common local terms).
- Diagnosis list aligned to ICD-10; essential lab panels and vitals; EPI vaccines; ANC observations.
- Governance SOP: request → review → approve → version → deploy; change log maintained.

3) Decision Support and Validation Rules
- NHIS eligibility: active status + expiry date check before claims.
- STG-aligned guidance: malaria, pneumonia, diarrhea, hypertension, diabetes, maternal/child health.
- Dosing safety: pediatric/adult weight-band checks, max dose alerts.
- Referral triggers: criteria to escalate from CHPS/Health Center to District/Regional/Teaching Hospital.

4) NHIS Claims Readiness
- Required fields for Claim/ClaimResponse; mapping of G-DRG/tariffs; authorization flow for high-cost services.
- Batch preparation rules (time windows, batch sizes) and rejection reason catalog.

5) Reporting & Indicators (DHIMS2 alignment)
- OPD headcount, top 10 ICD-10 diagnoses, malaria positivity rate, ANC 1st visit before 16 weeks, facility deliveries, EPI coverage metrics, inpatient mortality, bed occupancy.
- Indicator dictionary with numerator/denominator, data source tables/fields, frequency, and DHIMS2 dataset mapping.

6) Training & Change Management
- Role-based training curricula (registration, nursing, clinician, pharmacy, lab, M&E).
- Quick reference guides, videos, job aids; super-user network; go-live command center plan.

7) Data Quality & Safety
- DQA plan: completeness, timeliness, validity checks; monthly audits and feedback loops.
- Safety reviews: incident logging, near-miss review, corrective actions.

---

## Ghana-Specific Business Rules to Encode

1) Patient Identity and Registration
- Ghana Card preferred identifier for adults; NHIS number captured for claims; facility folder number always assigned.
- Address minimums: region, district, town/village; PostGPS if available; landmark optional.
- Children <18: birth registration ID or linked parent/guardian Ghana Card.

2) NHIS Eligibility and Coverage
- Active membership and valid expiry date required on service date.
- Exempt groups: children <18 (under parent), pregnant women (ANC to PNC), elderly 70+, indigents.
- Coverage rules: only covered services and Essential Medicines; flags for non-covered items (cash).

3) Claims and Authorizations
- Prior authorization required for selected services (high-cost imaging, certain surgeries, extended stays) — store auth number.
- Submission window: within 30 days; penalties or rejections beyond window.
- Batch constraints: single facility, single month; track status through adjudication and payment.

4) Referrals
- Hierarchy: CHPS → Health Center → District → Regional → Teaching; emergencies may bypass.
- Referral letter minimum dataset: demographics, identifiers, reason/diagnosis, findings, investigations, treatment given, urgency.
- Track sent/received and outcomes; generate DocumentReference PDFs when needed.

5) Clinical Protocols (STG integration)
- Malaria: test-before-treat; ACT for uncomplicated; artesunate for severe.
- Pneumonia: amoxicillin outpatient; penicillin+gentamicin inpatient.
- Diarrhea: ORS+zinc; IV fluids for severe dehydration; selective antibiotics.
- Hypertension/Diabetes: stepwise meds, targets; follow-up intervals.
- ANC: defined visit content; high-risk flags; IPTp; tetanus.

---

## Concept Dictionary Strategy

Principles
- Start with an essential subset to avoid concept bloat; expand through governed requests.
- Use ICD-10 as authoritative diagnosis codes; retain local synonyms for search.
- Medicines sourced from Ghana Essential Medicines List; align formulations/strengths; map to ATC where helpful.
- Labs use pragmatic local coding now; maintain a mapping table for future LOINC alignment.

Artifacts
- Concept catalog (CSV/JSON): name, datatype, class, ICD-10/ATC/LOINC code (if any), UUID, status, version.
- Mapping tables: local→ICD-10; local→NHIS tariff; local lab→LOINC (progressively filled).
- Governance log: requests, rationales, approvals, deprecations.

---

## Form Design Checklist (per form/module)

- Purpose and user role(s) clearly defined.
- Minimum dataset aligned to policy and reporting.
- Field types and constraints (required, formats, ranges, coded lists).
- Clinical decision support points (inline hints, alerts, defaults).
- Offline usability considerations and barcode/ID scanning where relevant.
- Print artifacts (ANC card summary, referral letter, discharge summary).
- Audit trail requirements (who, when, what changed).
- Localization needs (labels in English; patient-facing screens consider Twi/Ga/Ewe options).

Priority Forms (MVP)
- Patient Registration + Triage
- OPD Clinical Note
- Pharmacy Dispensing
- Lab Order + Results
- ANC Visit
- Delivery + PNC Summary
- Referral Letter

---

## Analytics and DHIMS2 Indicator Alignment

Core Indicators (examples)
- OPD attendance (new/old) by age/sex.
- Top 10 OPD diagnoses (ICD-10) monthly.
- Malaria testing rate and positivity rate.
- ANC 1st visit before 16 weeks; 4+ ANC visits coverage.
- Facility deliveries; cesarean section rate; maternal complications.
- EPI coverage by antigen and age.
- Inpatient mortality rate; average length of stay; bed occupancy.

Design Rules
- Define each indicator with numerator, denominator, inclusion/exclusion, source forms/fields, frequency.
- Tag each field with reporting usage to aid provenance and DQA.
- Provide DHIMS2 export specs (dataset, period, org unit mapping) and a validation report prior to export.

---

## 30/60/90 Day Plan

Days 0–30: Discover and Baseline
- Stakeholder mapping: MoH, GHS, NHIA, regional/districts, facility leads, M&E.
- Rapid workflow assessments at 2–3 facilities (different levels: CHPS/HC/District).
- Draft MVP form specs and minimum concept list; agree on identifiers strategy.
- Define initial indicators and claims data requirements.
- Establish governance: concept committee, change control cadence, documentation repo.

Days 31–60: Design and Validate
- Flesh out forms (OPD, Pharmacy, Lab, ANC, Delivery) with field constraints and decision support.
- Finalize concept dictionary v1; publish mapping tables (ICD-10, EML, tariffs).
- Author UAT scripts for top workflows; assemble test datasets.
- Validate NHIS eligibility flow and claims data fields with finance/revenue team.
- Create training materials v1; identify super users.

Days 61–90: Build and Go-Live Readiness
- Collaborate with devs to implement forms, validations, and concept dictionary.
- Run UAT cycles; triage issues; sign-off on clinical safety.
- Conduct data quality dry-runs; DHIMS2 mock exports; claims batch simulation.
- Deliver training; finalize go-live cutover plan and support rota.

---

## Collaboration Model

- With Technical Lead: Approve FHIR resource mappings, validations, and document generation points.
- With Backend/Frontend: Provide field specs, coded lists, decision logic, and acceptance criteria.
- With QA: Co-author test cases for clinical correctness; review defects for safety impact.
- With M&E: Align indicator definitions, verify DHIMS2 compatibility, schedule DQAs.
- With Finance: Validate claims workflow and evidence requirements; reconcile rejections feedback.
- With Facility Heads: Prioritize pain points; ensure SOPs align with EMR processes.

---

## UAT Scenarios (Minimum Set)

- New adult patient with Ghana Card and active NHIS completes OPD visit with malaria diagnosis; receives ACT; claim prepared.
- Child without Ghana Card registers via parent, receives immunization; DHIMS2 counts updated correctly.
- Pregnant woman enrolled in ANC; high-risk flag triggered (e.g., elevated BP), referral generated to District Hospital.
- Inpatient admission for pneumonia; labs and antibiotics; discharge summary printed; claim batched.
- NHIS expired case: eligibility fails, cashier workflow handles cash billing; no claim generation.
- Referral from Health Center to Regional Hospital; DocumentReference generated and transmitted; receiving facility confirms arrival.

---

## Data Governance and Safety

- Legal: Ghana Data Protection Act (Act 843) adherence; minimum necessary access; consent processes for data sharing.
- Audit: Log access and edits; periodic audit review with facility leadership.
- Security: Role-based access control; strong authentication; screen-timeout practices in clinical areas.
- Retention: Define retention periods aligned with MoH guidance; archival strategy for old encounters.
- Incident Management: Clinical safety incidents logged and reviewed; corrective actions tracked.

---

## Facility Readiness Checklist (Go-Live)

- Power and network reliability plan (backup power, offline workflow fallback).
- Workstations/tablets assigned per station; printers for cards and summaries.
- SOPs updated to reflect EMR steps; job aids posted.
- Super users trained and available per shift; command center contacts.
- Initial patient identifier supplies (card stock/barcodes) where applicable.

---

## Risks and Mitigations

- Incomplete identifiers (no Ghana Card): allow registration with alternative IDs; later merge via MPI.
- Connectivity issues: queue offline capture; deferred sync; minimal critical dataset local.
- Concept sprawl: enforce governance; versioning; retirement policy.
- Claims rejections: early validation, pre-submission checks, feedback loop with finance.
- Adoption resistance: include clinicians in design; quick wins; strong super-user network.

---

## Working Artifacts (Templates)

- Form Spec Template: purpose, actors, fields, constraints, CDS points, printouts.
- Concept Request Template: rationale, definitions, mappings, examples.
- Indicator Definition Sheet: formula, filters, tables/fields, frequency, DHIMS2 mapping.
- UAT Case Template: preconditions, steps, expected results, data set, pass/fail.
- DQA Checklist: completeness, timeliness, validity tests; remediation actions.

---

## Success Criteria

- 95%+ completeness on MVP forms within 8 weeks of go-live.
- <5% claim rejection rate after first two submission cycles.
- DHIMS2 submissions pass validation without manual rework.
- User satisfaction ≥80% among clinicians and M&E staff (post-go-live survey).
- Measurable reductions in documentation time or queue wait times in pilot facilities.
