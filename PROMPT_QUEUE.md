# Active Task Queue

**Active Tasks:** 3
**Next Task:** Task 13: Phase 2 Step 1 – OpenMRS Billing Metadata (CRITICAL)

**For Workers:** Execute tasks in FIFO order (First In, First Out). Use the command: "Refer to PROMPT_QUEUE.md pending task and complete it. Follow AGENTS.md rules, update IMPLEMENTATION_TRACKER.md when done."

**Important:**
- Holistic Build & Integration Rule (MANDATORY): Every task must ensure the backend, frontend, REST, and app UI still work together end-to-end. Do not break the app.
- If your task requires OpenMRS backend work (database, Java, Spring config), see [OPENMRS_PROMPT_GUIDE.md](../OPENMRS_PROMPT_GUIDE.md) for specialized workflow.

---

## Task Template (Use for all new tasks)

## Task [N]: [Task Title] ([Priority])
**Status:** [QUEUED] QUEUED
**Assigned to:** Next Available Worker
**Due:** YYYY-MM-DD HH:MM UTC
**Estimated:** X hours

### Self-Contained Execution Instructions

**When you see this task, execute these steps IN ORDER:**

#### 1. Read Context
- **Core Documents:**
    - `AGENTS.md` (especially Code Patterns, Security, and relevant Domain Rules)
    - `IMPLEMENTATION_TRACKER.md` (for overall project status)
- **API & Data:**
    - `docs/api/rest-api-reference.md` (for any REST API work)
    - `docs/db/data-dictionary.md` (for any database or service layer work)
- **Development Patterns:**
    - `docs/development/cookbook.md` (for step-by-step implementation recipes)
- **User Workflow (for UI tasks):**
    - `docs/training/roles/[relevant-role].md` (e.g., `doctor.md`)
- **Task-Specific Specs:**
    - `docs/specs/[relevant-spec].md`

#### 2. Create/Modify These Files
- [List exact files to create or modify]

#### 3. Implementation Requirements
- [Detailed technical requirements with code patterns]
- [Reference recipes from the Developer's Cookbook where applicable]

#### 4. Technical Constraints (NON-NEGOTIABLE)
- [DONE] Adhere to all constraints in `AGENTS.md` (Java 8, OpenMRS 2.4.0, etc.).
- [DONE] Follow the patterns and recipes outlined in the project documentation.

#### 5. Verification (MANDATORY - Run These Commands)
- `cd frontend && npm run lint && npm run type-check`
- `cd backend/openmrs-module-ghanaemr && mvn clean package -Dmaven.test.skip=true`
- Manually test the end-to-end flow, following the workflow in the relevant `docs/training/roles/` guide.
- [Add any other specific verification commands]

#### 6. Update Files (MANDATORY - Do This BEFORE Deleting Task)
**A. Update IMPLEMENTATION_TRACKER.md:**
- Mark the relevant task/milestone as COMPLETED and add a summary.

**B. Move Task to TASK_HISTORY.md:**
- Archive this task with a "SUCCESS" status and a summary of the outcome.

**C. Delete Task from PROMPT_QUEUE.md:**
- Remove this task from the queue.

**D. Perfect Handshake - Add Next Task (If Applicable):**
- Add the next logical task to this file, using this template.

#### 7. Notify Human (MANDATORY FORMAT)
```
[DONE] Task [N] Complete: [Task Title]

**Summary:**
- [Key accomplishment 1]
- [Key accomplishment 2]

**Files Created/Modified:**
- [file1.ts] - [brief description]
- [file2.tsx] - [brief description]

**Verification Results:**
[DONE] All verification commands passed.
[DONE] Manual E2E testing based on role-specific guide(s) was successful.

**Updated Documentation:**
[DONE] IMPLEMENTATION_TRACKER.md updated.
[DONE] TASK_HISTORY.md updated.

**Queue Status:**
- Active Tasks: [N]
- Next Task: [Task X: Title] or [Empty - No tasks queued]
```

---

## Task 13: Phase 2 Step 1 – OpenMRS Billing Metadata (CRITICAL)
**Status:** [QUEUED] QUEUED  
**Assigned to:** Next Available Worker  
**Due:** 2025-11-11 18:00 UTC  
**Estimated:** 4 hours

### Self-Contained Execution Instructions

> **Requires MCP-enabled OpenMRS worker.** If you do not have MCP access, copy OPM-008 and OPM-009 from `OPENMRS_PROMPT_GUIDE.md` into the MCP workflow and collect their artifacts.

#### 1. Read Context
- `START_HERE.md`, `AGENTS.md`
- `docs/implementation/phase2-closure-plan.md`
- `OPENMRS_PROMPT_GUIDE.md` (OPM-008 & OPM-009)
- `docs/config/location-uuids.md` (format reference)

#### 2. Create/Modify These Files
- `docs/config/billing-concepts.md` (new reference file)
- `docs/implementation/phase2-closure-plan.md`
- `IMPLEMENTATION_TRACKER.md`, `TASK_HISTORY.md`, `PROMPT_QUEUE.md`
- `OPENMRS_PROMPT_GUIDE.md` (mark OPM tasks complete)

#### 3. Implementation Requirements
- Execute OPM-008 (Billing Type Concepts & Payment Obs) via MCP worker.
- Execute OPM-009 (NHIS Eligibility Attribute & Global Properties) via MCP worker.
- Document all resulting concept UUIDs/global properties in `docs/config/billing-concepts.md`, including env/global-property names and usage notes.
- Update `.env.example` comments if new env vars/global props are needed.

#### 4. Technical Constraints
- Obey all `AGENTS.md` constraints (Java 8, OpenMRS 2.4.0, PII masking).
- Use MCP tooling/REST only; no manual DB edits.

#### 5. Verification
- Provide verification output requested by OPM-008/009 (concept listings, systemsetting queries).
- Confirm new global properties exist via `/ws/rest/v1/systemsetting?q=ghanaemr`.
- Ensure `docs/config/billing-concepts.md` clearly lists concept names and UUIDs.

#### 6. Update Files
1. Implementation docs (`docs/config/billing-concepts.md`, `.env.example`).  
2. IMPLEMENTATION_TRACKER.md (Week 3 addendum).  
3. TASK_HISTORY.md (log Task 13).  
4. PROMPT_QUEUE.md (remove Task 13, promote Task 14).  
5. OPENMRS_PROMPT_GUIDE.md (mark OPM-008/009 DONE).

#### 7. Notify Human
Use mandatory template; include OPM verification snippets/screenshots.

---

## Task 14: Phase 2 Step 2 – Frontend & API Wiring (HIGH)
**Status:** [QUEUED] QUEUED  
**Assigned to:** Next Available Worker  
**Due:** 2025-11-13 18:00 UTC  
**Estimated:** 6 hours

### Self-Contained Execution Instructions

#### 1. Read Context
- `AGENTS.md`, `docs/implementation/phase2-closure-plan.md`
- `docs/config/billing-concepts.md`
- `frontend/.env.example`, `frontend/src/app/api/opd/dispense/route.ts`, `frontend/src/app/patients/register/page.tsx`

#### 2. Create/Modify These Files
- `.env.example` (document new vars)
- `frontend/src/app/api/opd/dispense/route.ts`
- `frontend/src/app/api/coverage/route.ts` (new file)
- `frontend/src/app/patients/register/page.tsx`, `frontend/src/app/patients/[uuid]/success/page.tsx`, related hooks/components
- `docs/config/billing-concepts.md`, `docs/implementation/phase2-closure-plan.md`
- `IMPLEMENTATION_TRACKER.md`, `TASK_HISTORY.md`, `PROMPT_QUEUE.md`

#### 3. Implementation Requirements
- Wire billing concept UUIDs into dispense API to store `payment_type`, `amount_paid`, `receipt_number` obs.
- Implement `/api/coverage` Next.js route that proxies to `OpenMRS /ws/rest/v1/ghana/coverage` with proper error handling + masking.
- Add NHIS eligibility check button and badges (ACTIVE/EXPIRED/NOT_FOUND); block NHIS billing if status is EXPIRED/NOT_FOUND (unless override path logged).
- Persist eligibility flag via MCP-provided attribute/obs endpoints.
- Update env docs to show how to set new variables.

#### 4. Technical Constraints
- Respect Next.js/TypeScript guidelines and `AGENTS.md` compile-after-100-lines rule.
- Mask Ghana Card/NHIS in logs and UI notifications.

#### 5. Verification
- `cd frontend && npm run lint`
- `cd frontend && npm run type-check`
- Manual flow: register patient → run NHIS check → attempt NHIS billing (verify guardrails and coverage proxy response).

#### 6. Update Files
- IMPLEMENTATION_TRACKER.md (note wiring completion).
- TASK_HISTORY.md (log Task 14).
- PROMPT_QUEUE.md (remove Task 14; Task 15 becomes next).
- docs/config/billing-concepts.md (record that frontend wiring uses listed UUIDs).

#### 7. Notify Human
Use mandatory template; include coverage proxy test output.

---

## Task 15: Phase 2 Step 3 – Reports & Dashboard Finalization (HIGH)
**Status:** [QUEUED] QUEUED  
**Assigned to:** Next Available Worker  
**Due:** 2025-11-15 18:00 UTC  
**Estimated:** 6 hours

### Self-Contained Execution Instructions

#### 1. Read Context
- `AGENTS.md`, `docs/implementation/phase2-closure-plan.md`
- `docs/UGANDA_EMR_REFERENCE.md` (SQL patterns)
- Billing metadata doc (`docs/config/billing-concepts.md`)

#### 2. Create/Modify These Files
- Backend/BFF report endpoints (`/api/reports/nhis-vs-cash`, `/api/reports/revenue`, etc.)
- SQL/report definitions (if updating backend module)
- `frontend/src/app/reports/page.tsx`, `frontend/src/hooks/useReports.ts`
- `frontend/src/app/dashboard/page.tsx`
- Documentation/tracker/history/queue updates

#### 3. Implementation Requirements
- Build NHIS vs Cash summary (counts, percentages, date filters) using new payment obs.
- Update revenue summary to show cash collected vs NHIS claims pending.
- Add dashboard quick links + NHIE sync monitor cards; enforce role-based access from `docs/security/privileges-matrix.md`.
- Provide CSV/print export hooks if required by existing report UX specs.

#### 4. Technical Constraints
- Keep queries efficient (indexes on encounters/payment obs).
- Mask all PII in logs/reports.

#### 5. Verification
- `cd frontend && npm run lint`
- `cd frontend && npm run type-check`
- `cd backend/openmrs-module-ghanaemr && mvn clean package -Dmaven.test.skip=true`
- Manual testing: run NHIS vs Cash report, revenue summary, dashboard widgets per role.

#### 6. Update Files
- IMPLEMENTATION_TRACKER.md (mark Phase 2 COMPLETE).
- TASK_HISTORY.md (log Task 15).
- PROMPT_QUEUE.md (remove Task 15; queue next steps if needed).
- docs/config/billing-concepts.md (note how reports consume billing metadata).

#### 7. Notify Human
Use mandatory format; include report screenshots/logs demonstrating NHIS vs Cash metrics.

---
