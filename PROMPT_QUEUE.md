# Active Task Queue

**Active Tasks:** 0
**Next Task:** None (Add next task as needed)

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
