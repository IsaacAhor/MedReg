# Status Marker Convention Guide

**Document Version:** 1.0
**Last Updated:** 2025-11-03
**Applies To:** MedReg Project - All Documentation & Task Management Files

---

## Purpose

This guide defines the ASCII-safe status marker convention used throughout the MedReg project. All emojis have been replaced with clear, universally compatible ASCII alternatives to ensure:

- **Universal Compatibility**: Works across all platforms, terminals, and editors
- **CLI-Friendly**: Seamless integration with Codex CLI workers and automation tools
- **Better Searchability**: Easy to grep, search, and filter
- **Clear Communication**: Descriptive status indicators that work everywhere
- **Future-Proof**: Standard format for all development environments

---

## Status Marker Reference

### Task Status Markers

| Marker | Meaning | Usage | Example |
|--------|---------|-------|---------|
| `[QUEUED]` | Task is queued and waiting to be started | Task lists, headers | `## [QUEUED] Task 10: Feature Implementation` |
| `[WIP]` | Work In Progress - task is currently being worked on | Active tasks | `**Status:** [WIP] IN PROGRESS` |
| `[ACTIVE]` | Active section or currently running process | Section headers | `## [ACTIVE] ACTIVE (2 Tasks)` |
| `[DONE]` | Task completed successfully | Completed tasks | `- [DONE] Patient registration working` |
| `[PENDING]` | Waiting for dependency or blocked | Blocked tasks | `- [PENDING] NHIE sync pending` |
| `[FAILED]` | Task failed or feature deferred | Failed/deferred items | `[FAILED] **IPD/Admissions**: defer to v2` |
| `[PARTIAL]` | Partially complete or with warnings | Incomplete tasks | `**Status:** [PARTIAL] PARTIAL` |
| `[WARNING]` | Warning or attention needed | Issues, warnings | `[WARNING] **Note:** Manual review required` |

### Quality/Testing Markers

| Marker | Meaning | Usage | Example |
|--------|---------|-------|---------|
| `[OK]` | Test passed or verification successful | Test results | `- [OK] All 31 files processed successfully` |
| `[SUCCESS]` | Major milestone or achievement | Milestones | `**Status:** [SUCCESS] SUCCESS` |
| `[LAUNCH]` | Ready for deployment/launch | Deployment status | `[LAUNCH] **Ready for production deployment**` |
| `[HOT]` | High priority or urgent item | Priority markers | `[HOT] **URGENT:** Security patch needed` |

---

## Usage Guidelines

### 1. Task Queue Files (PROMPT_QUEUE.md)

**Task Headers:**
```markdown
## [QUEUED] Task 12: Implement Pharmacy Module
## [WIP] Task 11: OPD Consultation Backend
## [DONE] Task 10: NHIE Patient Sync
```

**Task Status Field:**
```markdown
**Status:** [QUEUED]
**Status:** [WIP] IN PROGRESS
**Status:** [DONE] COMPLETE
```

**Section Headers:**
```markdown
## [ACTIVE] ACTIVE (2 Tasks)
## [QUEUED] QUEUED (5 Tasks)
## [DONE] COMPLETED TASKS
```

### 2. Implementation Tracker (IMPLEMENTATION_TRACKER.md)

**Week Status:**
```markdown
**Week 1:** [DONE] COMPLETE (4/4 tasks)
**Week 2:** [WIP] IN PROGRESS (2/3 tasks)
**Week 3:** [PENDING] SCHEDULED
```

**Task Items:**
```markdown
- [DONE] Day 1-2: OpenMRS installation
- [WIP] Day 3-4: Authentication flow
- [PENDING] Day 5-6: Folder number generation
```

### 3. Task History (TASK_HISTORY.md)

**Completion Status:**
```markdown
**Status:** [DONE] SUCCESS
**Status:** [PARTIAL] PARTIAL - Some tests failed
**Status:** [FAILED] FAILED - Blocked by dependency
```

**Verification Results:**
```markdown
- [OK] ESLint: SUCCESS (0 errors)
- [OK] TypeScript: PASSED
- [WARNING] Manual testing: Not executed
```

### 4. MVP Build Strategy & Documentation

**Milestone Markers:**
```markdown
**Milestone 1**: [DONE] **ACHIEVED** - Patient registration working
**Milestone 2**: [PENDING] **SCHEDULED** - OPD workflow complete
```

**Feature Scope:**
```markdown
[DONE] **IN SCOPE:**
- Patient Registration
- OPD Workflow

[FAILED] **OUT OF SCOPE (Defer to v2):**
- IPD/Admissions
- ANC Module
```

### 5. Reports & Analysis Documents

**Section Status:**
```markdown
## [DONE] Analysis Complete
## [WIP] Research in Progress
## [PENDING] Pending Review
```

**Quality Indicators:**
```markdown
**Data Integrity:** [OK] VERIFIED
**Testing:** [OK] PASSED
**Deployment:** [SUCCESS] COMPLETE
```

---

## Formatting Rules

### 1. Bracket Format

- **ALWAYS** use square brackets: `[MARKER]`
- **NEVER** use parentheses, curly braces, or other formats
- Keep markers UPPERCASE for consistency: `[WIP]` not `[wip]`

**Correct:**
```markdown
[WIP] IN PROGRESS
[DONE] COMPLETE
[FAILED] FAILED
```

**Incorrect:**
```markdown
(WIP) IN PROGRESS
{WIP} IN PROGRESS
wip IN PROGRESS
```

### 2. Spacing

- **Single space** after closing bracket: `[WIP] IN PROGRESS`
- **No spaces** inside brackets: `[WIP]` not `[ WIP ]`

**Correct:**
```markdown
**Status:** [WIP] IN PROGRESS
```

**Incorrect:**
```markdown
**Status:**[WIP] IN PROGRESS  (missing space)
**Status:** [ WIP ] IN PROGRESS  (spaces inside brackets)
```

### 3. Capitalization

- Markers are UPPERCASE: `[DONE]`, `[WIP]`, `[PENDING]`
- Following text can be any case as appropriate:
  - `[DONE] COMPLETE` (all caps for emphasis)
  - `[DONE] Task completed successfully` (sentence case for descriptions)

### 4. Markdown Context

**Headers:**
```markdown
## [QUEUED] Task 15: Feature Name
```

**Bold Status:**
```markdown
**Status:** [WIP] IN PROGRESS
```

**List Items:**
```markdown
- [DONE] Patient registration complete
- [PENDING] NHIE integration pending
```

**Inline Text:**
```markdown
The deployment is [DONE] COMPLETE and ready for production.
```

---

## Migration from Emojis

### Previous Emoji Mapping

For reference, here's the complete emoji-to-ASCII mapping used during migration:

| Old Emoji | New ASCII | Notes |
|-----------|-----------|-------|
| 🟡 | `[WIP]` | Yellow circle → Work In Progress |
| ✅ | `[DONE]` | Check mark → Complete/Done |
| 🔵 | `[QUEUED]` | Blue circle → Queued task |
| ⚠️ | `[WARNING]` | Warning sign → Warning/Partial |
| ⏳ | `[PENDING]` | Hourglass → Pending/Waiting |
| 🔄 | `[ACTIVE]` | Refresh arrows → Active process |
| ❌ | `[FAILED]` | Red X → Failed/Error |
| 🎉 | `[SUCCESS]` | Party popper → Success/Achievement |
| 🚀 | `[LAUNCH]` | Rocket → Launch/Deploy |
| 🔥 | `[HOT]` | Fire → Hot/Priority |
| ✓ | `[OK]` | Check → OK/Pass |
| ✗ | `[FAILED]` | X → Failed/Reject |

### Migration Completed

- **Migration Date:** 2025-11-03 06:30 UTC
- **Files Modified:** 31 markdown files
- **Total Replacements:** 2,234 emoji characters
- **Backups Created:** All original files backed up to `backups_emoji_replacement_2025-11-03/`
- **Success Rate:** 100%

---

## Best Practices

### 1. Consistency

- **Use the same marker** for the same status across all documents
- Don't mix formats: Always use `[DONE]`, never `[COMPLETE]` or `[FINISHED]`
- Follow the exact capitalization and spacing rules

### 2. Clarity

- **Be explicit**: `[WIP] IN PROGRESS` is clearer than just `[WIP]`
- **Add context**: `**Status:** [DONE] SUCCESS` vs just `[DONE]`

### 3. Searchability

**Good for searching:**
```bash
# Find all in-progress tasks
grep -r "\[WIP\]" *.md

# Find all completed items
grep -r "\[DONE\]" docs/

# Count pending tasks
grep -c "\[PENDING\]" IMPLEMENTATION_TRACKER.md
```

### 4. Automation Compatibility

These markers work seamlessly with:
- **Codex CLI workers**: No encoding issues
- **Git operations**: Standard ASCII
- **CI/CD pipelines**: Easy to parse
- **Shell scripts**: Simple regex matching
- **Markdown renderers**: Universal support

---

## Examples from Real Files

### PROMPT_QUEUE.md
```markdown
## [ACTIVE] ACTIVE (1 Task)

## Task 8: OPD Consultation Module - Backend

**Status:** [WIP] IN PROGRESS

**Recent Completions:**
- [DONE] Task 5: NHIE Patient Sync Integration
- [DONE] Task 4: Backend Report API Endpoints
```

### IMPLEMENTATION_TRACKER.md
```markdown
### Week 1: Setup + User Management [DONE] COMPLETE (Nov 1, 2025)

- [DONE] OpenMRS 2.4.0 installation
- [DONE] Next.js 14 project setup
- [DONE] Authentication flow implemented

### Week 2: Patient Registration [WIP] IN PROGRESS

- [DONE] Ghana Card validation
- [PENDING] Folder number auto-generation
```

### TASK_HISTORY.md
```markdown
## [DONE] Task 7: OPD Triage Module

**Status:** [DONE] SUCCESS

### Verification Results:
- [OK] ESLint: SUCCESS (0 errors)
- [OK] TypeScript: PASSED
- [OK] Build: PASSED
```

---

## Updating This Convention

### When to Update

Update this guide when:
- New status markers are needed
- Formatting rules change
- Additional use cases are identified
- Team feedback suggests improvements

### Update Process

1. Propose changes in team discussion
2. Update this document
3. Communicate changes to all team members
4. Update existing files if necessary
5. Update version number and date at top of document

---

## Quick Reference Card

**Most Common Markers:**

```
[QUEUED]   - Not started yet
[WIP]      - Currently working on it
[DONE]     - Completed successfully
[PENDING]  - Waiting/blocked
[FAILED]   - Failed or deferred
[OK]       - Test/verification passed
```

**Format:**
`[MARKER]` + space + description

**Search:**
`grep -r "\[MARKER\]" <path>`

---

## Support & Questions

For questions about status marker usage:

1. **Check this guide first** - Most questions answered here
2. **Review examples** - See real usage in project files
3. **Ask in team chat** - Team members can clarify
4. **Update the guide** - Add your question and answer for others

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-03 | Initial creation after emoji replacement migration | System |

---

**Related Documents:**
- [AGENTS.md](../../AGENTS.md) - Task Management Workflow
- [TASK_MANAGEMENT_GUIDE.md](./TASK_MANAGEMENT_GUIDE.md) - Detailed task management procedures
- [README_EMOJI_REPLACEMENT.md](../../README_EMOJI_REPLACEMENT.md) - Migration summary
- [EMOJI_REPLACEMENT_REPORT.md](../../EMOJI_REPLACEMENT_REPORT.md) - Detailed migration report
