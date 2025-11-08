# Active Task Queue

**Active Tasks:** 0
**Next Task:** Task 12: Admin Dashboard KPIs (HIGH)

**For Workers:** No active tasks. Add new tasks as needed following the template below.

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

## Task 12: Admin Dashboard KPIs (HIGH)
**Status:** [QUEUED] QUEUED  
**Assigned to:** Next Available Worker  
**Due:** 2025-11-11 17:00 UTC  
**Estimated:** 6 hours

### Self-Contained Execution Instructions

**When you see this task, execute these steps IN ORDER:**

#### 1. Read Context
- Core: `AGENTS.md` (constraints), `IMPLEMENTATION_TRACKER.md` (Phase 2 progress)
- Specs/Reference: `docs/UX_PATTERNS.md` (dashboard widgets), `docs/USER_JOURNEYS.md` (role dashboards)

#### 2. Create/Modify These Files
- Backend (OMOD):
  - `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/OPDMetricsController.java` (ensure KPIs returned)
  - `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/NHIEMetricsController.java` (NHIE backlog/last sync)
- Frontend:
  - `frontend/src/app/dashboard/page.tsx` (add KPI cards wired to REST)
  - `frontend/src/components/dashboard/KpiCard.tsx` (new component if missing)
- Config:
  - `.env.local` keys used by dashboard (encounter type UUIDs, location UUIDs already present)

#### 3. Implementation Requirements
- KPIs (minimum):
  - Today’s OPD encounters (by encounter type + optional location)
  - Queue lengths: triage, consultation, pharmacy (via existing queue API)
  - NHIE backlog count and last success timestamp
- REST endpoints:
  - Use existing `/ws/rest/v1/ghana/opd/metrics` and `/ws/rest/v1/ghana/nhie/metrics` (add fields if needed)
- Frontend dashboard:
  - Display KPI cards with loading/error states and auto-refresh (30–60s)
  - Respect role-based access (admins, facility admins visible; clinicians minimal)

#### 4. Technical Constraints (NON-NEGOTIABLE)
- Java 8, OpenMRS 2.4.0, MySQL 5.7
- Avoid logging PII; use masked identifiers

#### 5. Verification (MANDATORY)
- `cd backend/openmrs-module-ghanaemr && mvn clean package -Dmaven.test.skip=true`
- `cd frontend && npm run lint && npm run type-check`
- Manual: Dashboard renders KPI values without errors (requires running backend)

#### 6. Update Files (MANDATORY)
- Update IMPLEMENTATION_TRACKER.md (Admin Dashboard KPIs completed)
- Move this task to TASK_HISTORY.md as SUCCESS
- Delete task from PROMPT_QUEUE.md and add next logical task (e.g., “User Management: Roles & Permissions validation”)
