# Task Management Guide

**Created:** November 2, 2025  
**Purpose:** Single-command task execution workflow for Ghana EMR MVP

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
- **Status indicators:** [QUEUED] QUEUED, [WIP] IN PROGRESS, [WARNING] BLOCKED

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
[QUEUED] QUEUED -> [WIP] IN PROGRESS -> [DONE] SUCCESS (in TASK_HISTORY.md)
                ↓
            [WARNING] BLOCKED -> [QUEUED] QUEUED (after unblocking)
```

---

## Example Workflow

### Monday 9 AM - Human adds task:

```markdown
## [HOT] Task 1: Implement Auth Endpoints
**Status:** [QUEUED] QUEUED
**Due:** Monday EOD
**Estimated:** 4 hours

### Self-Contained Execution Instructions
[Detailed steps 1-7...]

### Acceptance Criteria
- [ ] All 4 endpoints implemented
- [ ] Tests pass
- [ ] Documentation updated
```

### Monday 10 AM - Human types:

```
"Refer to PROMPT_QUEUE.md pending task and complete it. Follow AGENTS.md rules, update IMPLEMENTATION_TRACKER.md when done."
```

### Monday 10:05 AM - Worker:

1. Opens PROMPT_QUEUE.md
2. Sees Task 1 ([QUEUED] QUEUED)
3. Changes to [WIP] IN PROGRESS
4. Creates 4 files (auth endpoints)
5. Runs 5 verification tests (all pass)
6. Updates IMPLEMENTATION_TRACKER.md Week 3
7. Moves Task 1 to TASK_HISTORY.md
8. Deletes Task 1 from PROMPT_QUEUE.md
9. Notifies: "Task 1 complete. Auth endpoints ready."

### Monday 10:30 AM - Human reviews:

- PROMPT_QUEUE.md: Task 1 gone [DONE]
- TASK_HISTORY.md: Task 1 shows completion (210 lines, 4 hours)
- IMPLEMENTATION_TRACKER.md: Week 3 shows [DONE] COMPLETE
- Tests implementation: Login works [DONE]

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

---

## Best Practices

### For Human (Task Definition)

[DONE] **DO:**
- Write detailed "Self-Contained Execution Instructions"
- Include exact file paths to create/modify
- Provide code patterns and examples
- List verification commands (bash/PowerShell)
- Specify acceptance criteria (checklist)
- Reference AGENTS.md sections

[FAILED] **DON'T:**
- Write vague requirements ("implement auth")
- Assume worker knows file locations
- Skip verification steps
- Forget to update IMPLEMENTATION_TRACKER.md template

### For Worker (Task Execution)

[DONE] **DO:**
- Read ALL steps before starting
- Change status to [WIP] IN PROGRESS when starting
- Follow steps IN ORDER (1 -> 7)
- Run ALL verification commands
- Update files in specified order
- Copy completion details to TASK_HISTORY.md
- Delete task ONLY after all criteria checked

[FAILED] **DON'T:**
- Skip verification steps
- Delete task before updating IMPLEMENTATION_TRACKER.md
- Work on Task 2 if Task 1 still queued
- Modify task requirements (ask human if unclear)

---

## Troubleshooting

### "I can't find PROMPT_QUEUE.md"
- File is in repository root: `c:\temp\AI\MedReg\PROMPT_QUEUE.md`
- If missing, create it from template in AGENTS.md

### "Task is blocked, what do I do?"
1. Change status to [WARNING] BLOCKED
2. Document blocker in task notes
3. Leave task in PROMPT_QUEUE.md
4. Notify human with details

### "Task took longer than estimated"
- Update duration in TASK_HISTORY.md with actual time
- Add note in "Challenges Encountered" section
- Human can adjust future estimates

### "Multiple tasks are queued, which one first?"
- Always execute FIRST task marked [QUEUED] QUEUED
- Tasks are ordered by priority (top = highest)

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

**Last Updated:** 2025-11-02 16:30 UTC  
**Maintained by:** Human (task definitions) + Workers (execution)
