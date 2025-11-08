# Active Task Queue

**Active Tasks:** 1
**Next Task:** Task 11: Finalize OPD Consultation Backend (HIGH)

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

## Task 11: Finalize OPD Consultation Backend (HIGH)
**Status:** [QUEUED] QUEUED  
**Assigned to:** Next Available Worker  
**Due:** 2025-11-10 17:00 UTC  
**Estimated:** 6 hours

### Self-Contained Execution Instructions

**When you see this task, execute these steps IN ORDER:**

#### 1. Read Context
- Core: `AGENTS.md` (Technology constraints, Code Generation Rules), `IMPLEMENTATION_TRACKER.md` (Week 7-8 notes)
- API: `docs/specs/consultation-spec.md`, `docs/specs/queue-retry-policy.md`
- UI/User Flow: `docs/training/roles/doctor.md`, `docs/USER_JOURNEYS.md`
- OpenMRS prompts: `OPENMRS_PROMPT_GUIDE.md`

#### 2. Create/Modify These Files
- Backend (OpenMRS module):
  - `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/ConsultationService.java`
  - `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/impl/ConsultationServiceImpl.java`
  - `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/ConsultationController.java`
  - Add/update model/DTOs if referenced by spec under `.../api/src/main/java/org/openmrs/module/ghanaemr/api/dto/`
  - Unit tests: `.../api/src/test/java/org/openmrs/module/ghanaemr/api/ConsultationServiceTest.java`
- Frontend (BFF):
  - `frontend/src/app/api/opd/consultation/route.ts` (ensure forwards to module endpoint)
- Docs:
  - Update endpoints section in `docs/specs/consultation-spec.md` if signatures adjusted

#### 3. Implementation Requirements
- Service methods per spec:
  - Create consultation: chief complaint, diagnoses (ICD-10), meds, labs, optional notes
  - Persist as OpenMRS Encounter; link to patient and visit; set encounter type “Consultation”
  - If `queueUuid` supplied, mark current queue item completed and enqueue patient to Pharmacy
- REST endpoints (OpenMRS OMOD):
  - `POST /ws/rest/v1/ghana/opd/consultation` accepts JSON matching spec schema
  - Validate inputs (Zod schema mirrored in backend), return 201 with encounter UUID
- NHIE integration hook:
  - After successful persist, enqueue NHIE submission (non-blocking) via existing integration service
- Java 8 + OpenMRS 2.4.0 specifics:
  - Use OpenMRS API methods available in 2.4.0 (no `getPatientsByIdentifier`; use `getPatients(null, identifier, null, true)`)
  - For FHIR types, use fully qualified `org.hl7.fhir.r4.model.*` where needed
- Security/PII:
  - Never log full Ghana Card, NHIS, phone; use masking helpers if logging

#### 4. Technical Constraints (NON-NEGOTIABLE)
- Java 8 (1.8.0_472), MySQL 5.7, OpenMRS 2.4.0
- Mockito 3.12.4; HAPI FHIR 5.5.3
- Incremental code generation (50–100 lines) with `mvn compile` after each block

#### 5. Verification (MANDATORY - Run These Commands)
- `cd backend/openmrs-module-ghanaemr && mvn clean package -Dmaven.test.skip=true`
- `cd frontend && npm run lint && npm run type-check`
- Manual E2E:
  - Start OpenMRS with the built module loaded
  - Perform triage → consultation in UI; verify consultation POST succeeds and queue advances to Pharmacy
  - Verify NHIE submission is queued (mock server acceptable)

#### 6. Update Files (MANDATORY - Do This BEFORE Deleting Task)
**A. Update IMPLEMENTATION_TRACKER.md:**
- Add “Task 11 – Finalize OPD Consultation Backend” to Week 7-8 with summary and verification notes

**B. Move Task to TASK_HISTORY.md:**
- Archive with status “SUCCESS” and outcomes

**C. Delete Task from PROMPT_QUEUE.md:**
- Remove this task block from the queue

**D. Perfect Handshake - Add Next Task:**
- Add “Task 12: Admin Dashboard KPIs (HIGH)” with endpoints and UI widgets to render live KPIs

#### 7. Notify Human (MANDATORY FORMAT)
```
[DONE] Task 11 Complete: Finalize OPD Consultation Backend

**Summary:**
- Implemented service + REST endpoints for consultation
- Persisted encounters and advanced queues
- Enqueued NHIE submission

**Files Created/Modified:**
- [ConsultationService.java] - service contract finalized
- [ConsultationServiceImpl.java] - implementation with validations
- [ConsultationController.java] - REST endpoints wired

**Verification Results:**
[DONE] Backend build SUCCESS
[DONE] Frontend lint/type-check SUCCESS
[DONE] Manual E2E triage → consultation → queue advance SUCCESS

**Updated Documentation:**
[DONE] IMPLEMENTATION_TRACKER.md updated
[DONE] TASK_HISTORY.md updated

**Queue Status:**
- Active Tasks: 0
- Next Task: Task 12: Admin Dashboard KPIs (HIGH)
```
