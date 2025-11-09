# Phase 2 Closure Plan

**Purpose:** Capture the remaining work and dependencies that must be finished before Phase 2 (OPD Core Workflow) of the MVP can be considered complete. This plan follows the documentation structure rules (see `docs/DOCUMENTATION_STRUCTURE.md`) and references `START_HERE.md` / `AGENTS.md` constraints.

## Overview

Phase 2 is currently stuck on the billing/cashier workflow, the downstream NHIS vs Cash revenue reports, and the dashboard/role polish that consumes that data (`IMPLEMENTATION_TRACKER.md:1890-2012`). These tasks share a common dependency on:

1. **Billing Type observation concepts (NHIS vs Cash)**
2. **Payment recording schema (obs/metadata for receipt, amount, payment_type)**
3. **NHIS eligibility flag on the registration/encounter level**

Once those pieces exist, the remaining UI, reporting, and dashboard requirements flow naturally. Some work must be performed in OpenMRS (concepts, obs metadata, global properties); other work lives in Next.js and supporting docs.

## Dependencies & Ownership

| Deliverable | Owner | Notes |
|------------|-------|-------|
| Billing Type concept + answers (NHIS/Cash) | MCP-enabled OpenMRS worker | Create concept/answer metadata via UI or REST; supply UUIDs. (OPM-008) |
| Payment obs schema (payment_type, amount_paid, receipt_id) | MCP-enabled OpenMRS worker | Could be a new encounter obs concept + mandatory fields; configure via metadata/Global Properties. (OPM-008) |
| NHIS eligibility attribute/flag | MCP-enabled OpenMRS worker | Add person attribute or encounter obs reflecting ACTIVE/EXPIRED/NOT_FOUND (with expiry date) for registration checks. (OPM-009) |
| Global property/env updates | MCP-enabled OpenMRS worker | Set any new `ghanaemr.payment.*` or NHIS status properties + document values for `.env`. |
| Frontend dispense/billing wiring | Codex | Use new concept UUIDs from MCP worker, capture user choice, persist via dispense API, add NHIS guardrails. |
| NHIS coverage BFF endpoint | Codex | Implement `/api/coverage` route that proxies to OpenMRS coverage endpoint w/ auth + error handling. |
| NHIS vs Cash reports (queries/filters) | Codex | Build SQL endpoints + UI once billing obs stored. |
| Dashboard/Role polish | Codex | Show NHIE sync meter, NHIS vs Cash quick links, ensure admin role gating on reports. |
| Documentation & verification | Codex | Record steps, update IMPLEMENTATION_TRACKER/TASK_HISTORY, publish plan (this doc). |

## Implementation Steps

### Step 1 – MCP Worker: OpenMRS Metadata (OPM-008 & OPM-009)

Use the new OPM tasks (OPM-008 for billing concepts/obs, OPM-009 for NHIS eligibility/global properties) when engaging the MCP worker.

1. **Concept creation**
   * Create coded concept `Billing Type` (class: Misc, datatype: Coded).
   * Add answers `NHIS Payment` and `Cash Payment`.
   * Capture the UUIDs for each concept and answer.
2. **Observation attributes**
   * If needed, define obs concepts for `Payment Amount`, `Receipt Number`, `Payment Date`.
   * Ensure `OPENMRS_CONCEPT_BILLING_TYPE_UUID`, `OPENMRS_CONCEPT_BILLING_TYPE_NHIS_UUID`, and `OPENMRS_CONCEPT_BILLING_TYPE_CASH_UUID` are available for env/global prop configuration.
3. **NHIS eligibility flag**
   * Create person attribute or encounter obs recording NHIS status (ACTIVE/EXPIRED/NOT_FOUND) and optionally expiry date + timestamp.
4. **Documentation for Codex**
   * Provide the new UUIDs and any required property names via MCP report or shared doc so Codex can wire them into `.env.local`/global properties.
5. **Reference note**
   * Add these concept names/UUIDs to a config doc (e.g., extend `docs/config/location-uuids.md` or create `docs/config/billing-concepts.md`) so future workers know where to look.

### Step 2 – Frontend coding (Codex)

1. **Dispense/billing form**
   * Wire the new concept UUIDs into `frontend/.env.local` (update `.env.example` if needed).
   * Enhance `/opd/dispense/route.ts` to send `payment_type`, `amount_paid`, `receipt_number` as obs (use new concepts/obs).
   * Add validation/warnings if NHIS status is EXPIRED/NOT_FOUND.
2. **Registration UI**
   * Surface the “Check NHIS eligibility” button and display badges based on the new flag (ACTIVE/EXPIRED/NOT_FOUND).
   * Save the flag (person attribute or encounter obs) returned via API.
   * Prevent NHIS billing selection if status is EXPIRED/NOT_FOUND unless an override path is confirmed.
3. **Reports**
   * Implement `GET /nhis-vs-cash` that aggregates encounters by payment_type filtered by date.
   * Add filters (date range, payment type) to the endpoint and the frontend `/reports` page.
   * Ensure revenue summary totals cash vs NHIS claims pending.
4. **Dashboard updates**
   * Add quick links for OPD Register, NHIS vs Cash, NHIE Sync.
   * Display NHIS sync collectible metrics (e.g., percentage of NHIS-flagged encounters with completed sync).
   * Role gate report cards to the right privileges (Platform/Admin vs clinical).

### Step 3 – Backend integration (Codex + MCP data)

1. **Global properties**
   * Set `OPENMRS_CONCEPT_BILLING_TYPE_UUID`, etc., in `.env.local` and optionally `openmrs-runtime.properties`.
   * Add global property for the NHIS status attribute/obs UUID (e.g., `ghanaemr.nhis.status.attribute.uuid`).
2. **Payment persistence**
   * Ensure the dispense API posts encounters with the new obs; confirm OpenMRS persists `payment_type`, `amount`, `receipt`.
   * Add backend validation/logging so NHIS billing cannot be saved without an ACTIVE status.
3. **Report roots**
   * Build SQL queries similar to the Uganda sample (see `docs/UGANDA_EMR_REFERENCE.md:620-698`) that derive payment_type from obs/values.
   * Expose security-checked endpoints for NHIS vs Cash, revenue summary, OPD register.
4. **Coverage proxy route**
   * Add `/api/coverage` Next.js route that forwards requests to `OpenMRS /ws/rest/v1/ghana/coverage` (Basic auth) so UI components (success screen, registration form) have a stable BFF entry point.

### Step 4 – Verification & Documentation

1. **Tests**
   * `cd frontend && npm run lint && npm run type-check`
   * `cd backend/openmrs-module-ghanaemr && mvn clean package -Dmaven.test.skip=true`
   * Manual flows: register patient, verify NHIS status, mark billing, view reports/dashboards.
2. **Docs**
   * Update `IMPLEMENTATION_TRACKER.md` with Phase 2 completion entry.
   * Log completion in `TASK_HISTORY.md`.
   * Keep `PROMPT_QUEUE.md`/`OPENMRS_PROMPT_GUIDE.md` clean.
   * Reference this plan and metadata in `docs/config/location-uuids.md` or a sibling doc.

## Verification Checklist

- [ ] MCP worker provides UUIDs and updates global properties for billing + eligibility concepts (plus doc entry).
- [ ] Dispense form captures payment_type (NHIS/Cash), amount, receipt; writes obs with new concept ids.
- [ ] NHIS eligibility status surfaces on registration success + gating logic; `/api/coverage` proxy live.
- [ ] Reports/dashboards show NHIS vs Cash counts + revenue aggregates using the new obs.
- [ ] All related commands/tests pass and tracker/history updated.

Once Tasks 13–15 have been executed successfully (with OPM-008/009 closed, frontend wiring live, reports/dashboards verified), update the progress summary at the top of this plan to state **“Phase 2 Closure Plan – COMPLETE”** and add the completion date. This signals to all workers that the implementation plan is finalized and no further rework is needed. Also ensure `IMPLEMENTATION_TRACKER.md:1890-2012` and `TASK_HISTORY.md` record the completion so duplicative effort is avoided.
