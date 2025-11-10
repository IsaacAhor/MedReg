# Task Management Guide

**Created:** November 2, 2025
**Updated:** November 5, 2025
**Purpose:** Single-command task execution workflow for Ghana EMR MVP

---

## Pre-Task Protocol (MANDATORY)

**Every worker starting ANY task MUST complete this checklist:**

1. ✅ **Read [AGENTS.md](../../AGENTS.md)** - Project blueprint with critical constraints
2. ✅ **Verify technology stack** - Java 8, MySQL 5.7, OpenMRS 2.4.0
3. ✅ **Check [IMPLEMENTATION_TRACKER.md](../../IMPLEMENTATION_TRACKER.md)** - Current sprint status
4. ✅ **Review [PROMPT_QUEUE.md](../../PROMPT_QUEUE.md)** - Task dependencies

**New to the project?** Start with [START_HERE.md](../../START_HERE.md)

**Why mandatory:**
- Prevents version mismatches and breaking changes
- Ensures understanding of OpenMRS requirements
- Avoids repeating solved problems

---

## Overview

This project uses a **self-contained task queue system** where:
- Human defines tasks once in `PROMPT_QUEUE.md`
- Worker executes with single command
- Full audit trail preserved in `TASK_HISTORY.md`

---

## Quick Start

### For Human (Task Creator)

**1. Add new task to PROMPT_QUEUE.md:**

Copy this template:

```markdown
## [HOT] Task N: [Title] ([Priority])
**Status:** [QUEUED] QUEUED  
**Assigned to:** Next Available Worker  
**Due:** YYYY-MM-DD HH:MM UTC  
**Estimated:** X hours  

### Self-Contained Execution Instructions

#### 1. Read Context
- AGENTS.md sections: [List sections]
- IMPLEMENTATION_TRACKER.md: [Week/phase]

#### 2. Create/Modify These Files
[List exact files]

#### 3. Implementation Requirements
[Detailed technical specs with code patterns]

#### 4. Technical Constraints (NON-NEGOTIABLE)
- [DONE] [Constraint 1]
- [DONE] [Constraint 2]

#### 5. Verification (MANDATORY)
```bash
# Test commands here
```

#### 6. Update Files (MANDATORY)
**A. Update IMPLEMENTATION_TRACKER.md:**
[Exact text to add]

**B. Move Task to TASK_HISTORY.md:**
[Completion details template]

**C. Delete Task from PROMPT_QUEUE.md:**
[Queue cleanup instructions]

**D. Perfect Handshake - Add Next Task (If Applicable):**
[If this task is part of a sequence, ADD next task to PROMPT_QUEUE.md NOW]
[Include all context from THIS task so next worker has full picture]

#### 7. Notify Human
[Notification template with Perfect Handshake status]

### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
```

**2. Tell worker to execute:**

```
"Refer to PROMPT_QUEUE.md pending task and complete it. Follow AGENTS.md rules, update IMPLEMENTATION_TRACKER.md when done."
```

**3. Review completion:**
- Check TASK_HISTORY.md for completion details
- Check IMPLEMENTATION_TRACKER.md for progress update
- Test the implementation

---

### For Worker (Task Executor)

**When you see the command:**
```
"Refer to PROMPT_QUEUE.md pending task and complete it..."
```

**Execute these steps:**

1. **Open PROMPT_QUEUE.md**
2. **Find FIRST task** marked [QUEUED] QUEUED or [WIP] IN PROGRESS
3. **Change status to [WIP] IN PROGRESS** (update header)
4. **Execute steps 1-7** in "Self-Contained Execution Instructions"
5. **Run ALL verification commands** (do not skip!)
6. **Update files in this order:**
   - Implementation files (code)
   - IMPLEMENTATION_TRACKER.md (mark complete)
   - TASK_HISTORY.md (move task with details)
   - PROMPT_QUEUE.md (delete task, update counts)
7. **Notify human** with summary

**Perfect Handshake (CRITICAL):**
- BEFORE marking task complete, check if this is part of a larger sequence
- If yes: ADD the next logical task to PROMPT_QUEUE.md with full context
- Include: What was just done, what needs to happen next, all dependencies
- This ensures NO WORK IS LOST between sessions

**If blocked:**
- Change status to [WARNING] BLOCKED
- Leave task in PROMPT_QUEUE.md
- Notify human: "Task N blocked: [reason]. Need: [solution]."

---

## File Structure

```
c:\temp\AI\MedReg\
├── PROMPT_QUEUE.md          # Active tasks (FIFO queue)
├── TASK_HISTORY.md          # Completed tasks (audit trail)
├── IMPLEMENTATION_TRACKER.md # Overall progress (weekly)
└── AGENTS.md                 # Architecture rules
```

### PROMPT_QUEUE.md
- **Purpose:** Active tasks only
- **Who writes:** Human defines tasks
- **Who deletes:** Worker after completion
- **Status indicators:** [QUEUED] QUEUED, [WIP] IN PROGRESS, [WARNING] BLOCKED, [REJECTED] FAILED

### TASK_HISTORY.md
- **Purpose:** Completed tasks (permanent record)
- **Who writes:** Worker moves completed tasks here
- **Who deletes:** NEVER (audit trail)
- **Status indicators:** [DONE] SUCCESS, [WARNING] PARTIAL, [FAILED] FAILED

### IMPLEMENTATION_TRACKER.md
- **Purpose:** Weekly project progress
- **Who updates:** Worker after completing each task
- **Format:** Week N: Task description - [DONE] COMPLETE

---

## Task Status Lifecycle

```
                                     ┌──────────────────┐
                                     │ [DONE] SUCCESS   │
                                     │(in TASK_HISTORY) │
                                     └─────────▲────────┘
                                               │
[QUEUED] QUEUED ──► [WIP] IN PROGRESS ──────────┤
      ▲           │                            │
      │           │                            │
      └─[WARNING] │                            │
        BLOCKED   │                            │
                  ▼                            ▼
           [REJECTED] FAILED ◄───────────────┐
                  │                          │
                  └────────► (debug by next worker) ┘
```

---

## Example Workflow
---

## Benefits

| Feature | Description |
|---------|-------------|
| **Single Command** | Human types one sentence, worker does everything |
| **Self-Contained** | Each task has all context (no hunting for requirements) |
| **Audit Trail** | TASK_HISTORY.md shows what was done, when, by whom |
| **Verification Enforced** | Tasks include mandatory test commands |
| **File Updates Enforced** | Explicit checklist prevents forgotten updates |
| **Perfect Handshake** | Worker adds next task before completing current one - NO WORK LOST |
| **Parallel Work** | Multiple workers can take different tasks |
| **Error Recovery** | If worker crashes, task still in queue with all details |
| **Self-Healing** | Agents can autonomously report, debug, and resolve failures |

---

## Best Practices

### For Human (Task Definition & Coordination)

[DONE] **DO:**
- Write detailed "Self-Contained Execution Instructions" for new tasks.
- Include exact file paths, code patterns, and verification commands.
- **Act as a simple relay:** When a worker provides a prompt for the next worker, copy and paste it exactly as given.

[FAILED] **DON'T:**
- Write vague requirements ("implement auth").
- Assume a worker knows file locations.
- **Intervene in the debugging process.** Do not write your own commands to fix a rejected task. Let the agents handle it.

### For Worker (Task Execution)

[DONE] **DO:**
- Read ALL steps before starting.
- Change status to [WIP] IN PROGRESS when starting.
- Follow steps IN ORDER (1 -> 7).
- Run ALL verification commands.
- **If verification fails, immediately follow the "Handling Verification Failures" protocol.**
- If successful, update files in the specified order and perform the Perfect Handshake.

[FAILED] **DON'T:**
- Skip verification steps.
- **Move a task with failed verification to `TASK_HISTORY.md`.**
- Modify task requirements (ask human if unclear, or handle via the rejection process if it causes a failure).

---

## Troubleshooting

### "I can't find PROMPT_QUEUE.md"
- File is in the repository root: `c:\temp\AI\MedReg\PROMPT_QUEUE.md`.

### "Task is blocked, what do I do?"
1. Change status to `[WARNING] BLOCKED`.
2. Document the blocker in the task notes.
3. Leave the task in `PROMPT_QUEUE.md`.
4. Notify the human with details.

### "A verification command failed, what do I do?"
- Follow the protocol in the **"Handling Verification Failures (Agent-Centric Protocol)"** section. Do not proceed with the normal success workflow.

### "Multiple tasks are queued, which one first?"
- Always execute the FIRST task in `PROMPT_QUEUE.md`. Priority is determined by order.

---

## Handling Verification Failures (Agent-Centric Protocol)

This protocol ensures that task failures are handled autonomously by agents, maintaining the integrity of the system and requiring zero cognitive load from the human coordinator.

### Part 1: The Failing Worker (Worker A)

If a mandatory verification command fails, the task is **REJECTED**.

1.  **STOP:** Do not proceed with the normal success workflow (updating tracker, moving to history, etc.).
2.  **Update Status:** In `PROMPT_QUEUE.md`, change the task's status from `[WIP] IN PROGRESS` to `[REJECTED] FAILED`.
3.  **Create Rejection Report:** Inside the task's section in `PROMPT_QUEUE.md`, add a new H2 heading: `## Rejection Report`. Under it, provide:
    *   **Timestamp:** The UTC timestamp of the failure.
    *   **Failing Worker:** The name of the worker that encountered the failure (e.g., Worker A).
    *   **Failed Command:** The exact command that failed.
    *   **Output Log:** The complete `stdout` and `stderr` from the command.
    *   **Worker Analysis:** A brief, structured analysis of the likely cause.
4.  **Generate Handoff Prompt:** The worker's final action is to generate the precise, self-contained prompt for the next worker.
5.  **Notify Human:** The worker presents its final notification, which includes the generated prompt for the human to relay.

#### Example Notification from Worker A:
> Task 12 has been REJECTED. A Rejection Report has been added to `PROMPT_QUEUE.md`.
>
> **Please copy and paste the following command for the next worker:**
>
> `A task has been rejected. Refer to the first task in PROMPT_QUEUE.md, review its Rejection Report, and implement a fix. After fixing, you must re-run all verification steps from the original task description to ensure it is fully resolved.`

### Part 2: The Human Coordinator

The human's role is simple and mechanical:
1.  Receive the notification from Worker A.
2.  Copy the generated prompt.
3.  Paste the prompt to activate the next worker (Worker B).

### Part 3: The Debugging Worker (Worker B)

1.  **Receive Command:** Worker B is activated with the specific directive to fix the rejected task.
2.  **Analyze and Fix:** The worker reads the original task instructions AND the `Rejection Report`. It analyzes the logs and code to implement a fix.
3.  **Full Re-Verification:** Worker B must re-run **all** verification commands from the original task description to confirm the fix and check for regressions.
4.  **Complete the Task:** If all verifications pass, Worker B follows the standard success protocol:
    *   Updates `IMPLEMENTATION_TRACKER.md`.
    *   Moves the entire task block (including the original instructions and the `Rejection Report`) to `TASK_HISTORY.md`.
    *   Deletes the task from `PROMPT_QUEUE.md`.
    *   Performs the **Perfect Handshake**: If the task was part of a sequence, it creates the next task in `PROMPT_QUEUE.md`.
    *   **Generates the standard system prompt** for the human to relay for the next task in the queue.

This autonomous, self-healing loop ensures that failures are handled efficiently by the agents themselves, preserving the system's core philosophy.

---

## Integration with Other Files

### AGENTS.md
- Contains "Task Management Workflow" section
- Referenced in task "Read Context" steps
- Provides code patterns and rules

### IMPLEMENTATION_TRACKER.md
- Updated by worker after each task completion
- Shows weekly progress (Week 1, Week 2, etc.)
- Format: `- [DONE] [Task] - COMPLETE (Completed: YYYY-MM-DD)`

### .github/copilot-instructions.md
- Auto-loaded by GitHub Copilot
- References PROMPT_QUEUE.md workflow
- Quick reminder of execution steps

---

## FAQ

**Q: Can I have multiple workers on different tasks?**  
A: Yes! Each worker takes the next [QUEUED] QUEUED task. Task 1 -> Worker A, Task 2 -> Worker B (parallel).

**Q: What if I need to change a task after it's queued?**  
A: Edit PROMPT_QUEUE.md directly. If task is [WIP] IN PROGRESS, coordinate with worker first.

**Q: Can I skip verification steps?**  
A: NO. Verification is MANDATORY. Without it, we repeat Week 2 (30+ compilation errors).

**Q: What if task is 80% done but blocked?**  
A: Mark status [WARNING] PARTIAL in TASK_HISTORY.md. Create new task for remaining 20%.

**Q: How do I prioritize tasks?**  
A: Order tasks in PROMPT_QUEUE.md (top = highest priority). Worker always takes first [QUEUED] QUEUED.

---

## References

- **AGENTS.md** - Task Management Workflow section (full details)
- **PROMPT_QUEUE.md** - Active task queue (2 tasks currently)
- **TASK_HISTORY.md** - Completed tasks audit trail
- **IMPLEMENTATION_TRACKER.md** - Weekly progress tracking

---

## OpenMRS Backend Task Workflow (MCP Access Required)

**Added:** 2025-11-03
**Purpose:** Coordinate OpenMRS backend tasks between workers with and without MCP access

### The Challenge

**Not all workers have OpenMRS MCP access.** Workers without access get blocked when they encounter:
- Database schema changes (Liquibase)
- Java service implementation
- Spring bean configuration
- OpenMRS module build/deploy
- REST endpoint creation

### The Solution

Use `OPENMRS_PROMPT_GUIDE.md` as a **specialized task queue** for OpenMRS-only work.

**Architecture:**

```
Regular Worker              OpenMRS Worker
(No MCP Access)             (Has MCP Access)
     |                            |
     |-- Frontend code            |-- Database (MySQL)
     |-- Next.js API              |-- Java services
     |-- UI components            |-- Spring config
     |-- Documentation            |-- Module build/deploy
     |                            |
     +---------> HUMAN <----------+
                   |
          OPENMRS_PROMPT_GUIDE.md
```

### File Locations

- **General tasks:** `PROMPT_QUEUE.md` (frontend, API, docs)
- **OpenMRS tasks:** `OPENMRS_PROMPT_GUIDE.md` (backend, database, Java)

### Workflow

#### Regular Worker: Discovers OpenMRS Need

```markdown
## OPM-001: Queue Management Database Schema

**Status:** TODO
**Priority:** CRITICAL
**Dependencies:** None

### Context
Frontend queue pages need ghanaemr_patient_queue table.
Liquibase file already created, needs module build/deploy.

### ✂️ COPY FROM HERE ✂️

**Task:** Build and deploy OpenMRS module to create table

**Steps:**
1. cd backend/openmrs-module-ghanaemr
2. mvn clean install -DskipTests
3. docker cp omod/target/*.omod medreg-openmrs:/openmrs/data/modules/
4. docker restart medreg-openmrs
5. Verify table: docker exec medreg-mysql mysql -e "SHOW TABLES LIKE 'ghanaemr_patient_queue';"

**Success Criteria:**
- Table exists with all columns
- All indexes created
- Foreign keys verified

### ✂️ COPY TO HERE ✂️
```

**Worker tells human:** "Added OPM-001 to OPENMRS_PROMPT_GUIDE.md. Need OpenMRS worker."

#### Human: Coordinates Handoff

1. Opens `OPENMRS_PROMPT_GUIDE.md`
2. Finds task OPM-001 (status: TODO)
3. Copies text between ✂️ markers
4. Gives to OpenMRS-capable worker

#### OpenMRS Worker: Executes Task

1. Receives self-contained prompt
2. Executes all steps in order
3. Runs verification commands
4. Updates status to DONE with completion report:

```markdown
### Completion Report (OPM-001)

**Completed:** 2025-11-03
**Completed By:** Worker-Alpha

**Verification Output:**
[Table structure verified - all columns present]

**Notes:** No issues. Build succeeded first try.
```

**Worker tells human:** "Task OPM-001 completed."

#### Regular Worker: Continues Work

1. Human informs: "OPM-001 is done"
2. Worker checks `OPENMRS_PROMPT_GUIDE.md` → status: DONE
3. Continues with frontend queue pages (API calls now work)

### Task Structure

Each OpenMRS task includes:

```markdown
## OPM-XXX: [Task Title]

**Status:** TODO | IN_PROGRESS | BLOCKED | DONE | CANCELLED
**Priority:** CRITICAL | HIGH | MEDIUM | LOW
**Created:** YYYY-MM-DD
**Dependencies:** [Other OPM task IDs]
**Related Files:**
- Backend: [Java files, config]
- Frontend: [Pages that depend on this]

### Context
[Why this is needed, what already exists]

**Current State:**
- ✅ [Already done]
- ❌ [Needs to be done]

### Related Frontend Context
[Which features depend on this backend work]

---

### ✂️ COPY FROM HERE ✂️

## Self-Contained Prompt for OpenMRS Worker

**Task:** [One-line description]

**Prerequisites:**
- [Dependencies]

**Steps to Execute:**

### 1. [Step Title]
```bash
# Complete commands with expected output
```

### Success Criteria
- ✅ [Testable criterion]

### Troubleshooting
**Problem:** [Common issue]
**Solution:** [Fix]

### Update Status After Completion
[Instructions to mark DONE]

### ✂️ COPY TO HERE ✂️
```

### Task Priority Levels

| Priority | When to Use |
|----------|-------------|
| CRITICAL | Blocks multiple features, needed for MVP |
| HIGH | Blocks specific feature, needed soon |
| MEDIUM | Nice-to-have for MVP, can defer |
| LOW | Future enhancement, not MVP |

### Dependencies

Tasks can depend on other tasks:

```
OPM-001 (Database Schema)
   |
   +-- OPM-002 (Spring Beans) ← Needs table
   |      |
   |      +-- OPM-003 (Auto-Queue) ← Needs service
   |
   +-- OPM-004 (Location UUIDs) ← Independent, parallel OK
```

**Don't start OPM-003 until OPM-001 AND OPM-002 are both DONE.**

### Best Practices

#### For Regular Workers (Adding OpenMRS Tasks)

✅ **DO:**
- Include ALL context (why needed, what depends on it)
- Write self-contained prompts (no codebase search required)
- Provide exact bash commands with expected output
- List dependencies clearly
- Add troubleshooting for common issues
- Update Active Task Summary table

❌ **DON'T:**
- Assume OpenMRS worker knows frontend context
- Use vague instructions ("configure database")
- Skip verification steps
- Forget to set status to TODO

#### For OpenMRS Workers (Executing Tasks)

✅ **DO:**
- Read entire prompt before starting
- Execute steps in exact order
- Run ALL verification commands
- Paste verification output in completion report
- Update status to DONE when finished
- Document deviations in notes

❌ **DON'T:**
- Skip verification ("it probably worked")
- Forget to update status
- Mark DONE if verification failed
- Deviate from prompt without documenting why

### Common Scenarios

**Scenario 1: Frontend Needs Database Table**

1. Regular worker creates Liquibase changeset
2. Adds OPM task: "Build/deploy module to create table"
3. Continues with frontend code (mocking table for now)
4. OpenMRS worker deploys module, table created
5. Regular worker removes mock, tests with real table

**Scenario 2: Need New REST Endpoint**

1. Regular worker writes Java code for endpoint
2. Adds OPM task: "Create file at path X, build/deploy"
3. Mocks endpoint in frontend for testing
4. OpenMRS worker creates file, deploys module
5. Regular worker removes mock, uses real endpoint

**Scenario 3: Task Blocked on Decision**

1. OpenMRS worker starts task
2. Encounters ambiguity: "Global property or config file?"
3. Updates status: BLOCKED
4. Adds blocker note with options A/B
5. Human decides, updates task
6. Worker continues with decision

### Integration with General Task Workflow

**Use PROMPT_QUEUE.md when:**
- Frontend pages, components
- Next.js API routes
- Documentation
- Tasks regular worker can complete alone

**Use OPENMRS_PROMPT_GUIDE.md when:**
- Database schema (Liquibase)
- Java services, DAOs
- Spring configuration
- OpenMRS module build/deploy
- Tasks requiring OpenMRS MCP access

**Update IMPLEMENTATION_TRACKER.md after:**
- Any task from PROMPT_QUEUE.md completes
- Any task from OPENMRS_PROMPT_GUIDE.md completes
- Record: What done, when, by whom, files changed

### Quick Reference

**Regular Worker Needs OpenMRS Work:**

1. Open `OPENMRS_PROMPT_GUIDE.md`
2. Copy template from "How to Add New Tasks" section
3. Fill all sections, add ✂️ markers
4. Update Active Task Summary table
5. Set status: TODO
6. Tell human: "Added OPM-XXX to OpenMRS guide"

**OpenMRS Worker Receives Task:**

1. Read entire prompt
2. Check dependencies are DONE
3. Update status: IN_PROGRESS
4. Execute steps in order
5. Run ALL verification commands
6. Paste output in completion report
7. Update status: DONE
8. Tell human: "Completed OPM-XXX"

**Human Coordinates:**

1. Worker says "Added OPM-XXX" → Copy prompt, give to OpenMRS worker
2. Worker says "Completed OPM-XXX" → Verify, tell regular worker

### Success Metrics

✅ **System working well when:**
- Regular workers never blocked by "need OpenMRS access"
- OpenMRS workers execute without clarifying questions
- Task handoff takes <5 minutes
- 90%+ tasks complete on first try
- Verification catches issues before marking DONE

❌ **Needs improvement when:**
- OpenMRS worker asks many questions
- Tasks marked DONE but don't work
- Regular worker can't continue (unclear task)
- Dependencies not documented, wrong order

### Example: Complete Lifecycle

**Monday 10am - Regular Worker:**

Working on triage queue page, realizes table missing.

Adds to `OPENMRS_PROMPT_GUIDE.md`:
```markdown
## OPM-001: Create ghanaemr_patient_queue table
**Status:** TODO
[Complete self-contained prompt...]
```

Tells human: "Added OPM-001, need OpenMRS worker."

**Monday 10:30am - Human:**

Opens `OPENMRS_PROMPT_GUIDE.md`, copies prompt between ✂️.
Gives to OpenMRS worker.

**Monday 11am - OpenMRS Worker:**

Executes prompt:
1. Build module → ✅ SUCCESS
2. Deploy → ✅ SUCCESS
3. Verify table → ✅ EXISTS

Updates `OPENMRS_PROMPT_GUIDE.md`:
```markdown
## OPM-001: Create table
**Status:** DONE ✅
**Completed:** 2025-11-03

### Completion Report
[Verification output showing table structure]
```

Tells human: "OPM-001 complete."

**Monday 11:30am - Regular Worker:**

Human says: "OPM-001 done."
Checks file → status DONE ✅.
Tests frontend API call → works!
Continues building queue page.

---

**Last Updated:** 2025-11-03 (Added OpenMRS workflow section)
**Maintained by:** Human (task definitions) + Workers (execution)
