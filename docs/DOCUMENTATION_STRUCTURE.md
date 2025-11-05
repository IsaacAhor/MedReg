# Documentation Structure - MedReg Project

**Last Updated:** November 2, 2025

---

## [WARNING] MANDATORY: Documentation Creation Rule

**BEFORE CREATING ANY NEW .md FILE:** Check if existing files can host the content!

See **AGENTS.md** "Documentation Creation Rule (MANDATORY)" section for full process.

**Quick Check:**
1. Check IMPLEMENTATION_TRACKER.md (milestones, builds, troubleshooting)
2. Check AGENTS.md (architecture, patterns, setup)
3. Check docs/setup/, docs/specs/, docs/mapping/ folders
4. Only create new file if content doesn't fit anywhere else

**Why:** Prevents duplication, maintains Single Source of Truth, reduces maintenance burden.

---

## Documentation Philosophy

**Single Source of Truth:** `IMPLEMENTATION_TRACKER.md` is the authoritative record for:
- âœ… What was built (components, files, features)
- âœ… When it was completed (dates, milestones)
- âœ… Progress metrics (% complete, timeline status)
- âœ… Architecture decisions (what connects to what, why we chose X)

**Supporting Documentation:** Detailed technical references for HOW components work

---

## Current Documentation Structure

```
MedReg/
├── IMPLEMENTATION_TRACKER.md ⭐ SOURCE OF TRUTH
│   ├── Week 1: Foundation [DONE]
│   ├── Week 2-3: Patient Registration [DONE]
│   ├── Week 4-5: NHIE Patient Sync [ACTIVE] 75%
│   │   ├── Quick Dashboard (embedded)
│   │   ├── Code Statistics (embedded)
│   │   ├── Next Tasks (embedded)
│   │   └── Links to detailed docs ↓
│   └── Week 6-11: OPD Workflow [PENDING]
│
├── AGENTS.md (Ghana domain rules, NHIE architecture, code patterns)
├── README.md (Project overview, quick start)
│
└── docs/
    ├── EXTERNAL_RESOURCES.md 🔗 (ALL external links consolidated - NEW!)
    │   ├── OpenMRS Documentation (REST API, FHIR, O3, Docker)
    │   ├── FHIR & HL7 Resources (R4 specs, HAPI FHIR, ICD-10, LOINC)
    │   ├── Ghana Health System (NHIA, GHS, MoH, Ghana Card, 16 regions)
    │   ├── African Regional Context (Uganda EMR, Kenya HIE, Rwanda)
    │   ├── Development Tools & Libraries (Next.js, React, shadcn/ui, TanStack Query)
    │   ├── Community & Support (OpenMRS Talk, Slack, GitHub)
    │   └── Quick Bookmarks (12 daily-use links + local endpoints)
    │
    ├── UGANDA_EMR_REFERENCE.md (Uganda EMR code adaptation - 1000+ lines)
    ├── QUICK_REFERENCE.md (Commands and code snippets)
    │
    ├── setup/ (Setup and operational guides)
    │   ├── week1-setup-guide.md (Initial environment setup)
    │   ├── nhie-mock-guide.md (NHIE mock server guide - 1000+ lines)
    │   ├── openmrs-docker-setup.md (OpenMRS configuration)
    │   ├── MCP_GUIDE.md (Model Context Protocol servers: OpenMRS REST + Admin)
    │   ├── week1-implementation-summary.md (Week 1 deep dive)
    │   └── TASK8_COMPLETION_SUMMARY.md (NHIEIntegrationService technical reference)
    │
    ├── specs/ (Feature specifications)
    │   ├── registration-form-spec.md
    │   ├── triage-form-spec.md
    │   ├── consultation-spec.md
    │   └── ... (8 total spec files)
    │
    ├── mapping/ (FHIR mapping guides)
    │   ├── patient-fhir-mapping.md
    │   └── encounter-observation-fhir-mapping.md
    │
    ├── security/ (Security policies)
    │   ├── audit-policy.md
    │   └── privileges-matrix.md
    │
    └── ... (Other doc categories)
```

```
MedReg/
â”œâ”€â”€ IMPLEMENTATION_TRACKER.md â­ SOURCE OF TRUTH
â”‚   â”œâ”€â”€ Week 1: Foundation âœ…
â”‚   â”œâ”€â”€ Week 2-3: Patient Registration âœ…
â”‚   â”œâ”€â”€ Week 4-5: NHIE Patient Sync ðŸ”„ 75%
â”‚   â”‚   â”œâ”€â”€ Quick Dashboard (embedded)
â”‚   â”‚   â”œâ”€â”€ Code Statistics (embedded)
â”‚   â”‚   â”œâ”€â”€ Next Tasks (embedded)
â”‚   â”‚   â””â”€â”€ Links to detailed docs â†“
â”‚   â””â”€â”€ Week 6-11: OPD Workflow â³
â”‚
â”œâ”€â”€ AGENTS.md (Ghana domain rules, NHIE architecture, code patterns)
â”œâ”€â”€ README.md (Project overview, quick start)
â”‚
â””â”€â”€ docs/
    â”œâ”€â”€ setup/ (Setup and operational guides)
    â”‚   â”œâ”€â”€ week1-setup-guide.md (Initial environment setup)
    â”‚   â”œâ”€â”€ nhie-mock-guide.md (NHIE mock server guide - 1000+ lines)
    â”‚   â”œâ”€â”€ openmrs-docker-setup.md (OpenMRS configuration)
    â”‚   â”œâ”€â”€ week1-implementation-summary.md (Week 1 deep dive)
    â”‚   â””â”€â”€ TASK8_COMPLETION_SUMMARY.md (NHIEIntegrationService technical reference)
    â”‚
    â”œâ”€â”€ specs/ (Feature specifications)
    â”‚   â”œâ”€â”€ registration-form-spec.md
    â”‚   â”œâ”€â”€ triage-form-spec.md
    â”‚   â”œâ”€â”€ consultation-spec.md
    â”‚   â””â”€â”€ ... (8 total spec files)
    â”‚
    â”œâ”€â”€ mapping/ (FHIR mapping guides)
    â”‚   â”œâ”€â”€ patient-fhir-mapping.md
    â”‚   â””â”€â”€ encounter-observation-fhir-mapping.md
    â”‚
    â”œâ”€â”€ security/ (Security policies)
    â”‚   â”œâ”€â”€ audit-policy.md
    â”‚   â””â”€â”€ privileges-matrix.md
    â”‚
    â””â”€â”€ ... (Other doc categories)
```

---

## Document Types and When to Use

### 1. IMPLEMENTATION_TRACKER.md (SOURCE OF TRUTH)

**Update when:**
- âœ… Completing a task or milestone
- ðŸ“Š Progress % changes significantly
- ðŸš€ Timeline changes (ahead/behind schedule)
- ðŸ—ï¸ Architecture decisions made
- ðŸ“ Weekly status update needed

**Contains:**
- Week-by-week progress tracking
- Completion status (âœ… â³ âŒ)
- Quick dashboards (embedded in each week section)
- Code statistics (lines, test coverage)
- Next tasks (priority order)
- Lessons learned
- Links to detailed technical docs

**Example Section:**
```markdown
## Week 4-5: NHIE Patient Sync

### Status: ðŸ”„ IN PROGRESS (75% Complete - Nov 2, 2025)

**Quick Dashboard:**
- âœ… NHIE Mock: 100%
- âœ… HTTP Client: 100%
- â³ Integration Tests: 0%

**Code Statistics:** 5,024 lines total

**Next Tasks:**
1. NHIEIntegrationServiceTest.java (800+ lines)
2. Patient Registration Integration
3. Background Retry Job

**Technical Details:** See [Task #8 Summary](../docs/setup/TASK8_COMPLETION_SUMMARY.md)
```

---

### 2. Task Completion Summaries (DETAILED TECHNICAL DOCS)

**Create when:**
- ðŸ“ Complex implementation needs explanation
- ðŸ§ª Testing strategy is non-trivial
- ðŸ”— Integration points are complex
- âš ï¸ Known issues need tracking
- ðŸ“š Other developers need usage guide

**Examples:**
- `docs/setup/TASK8_COMPLETION_SUMMARY.md` (500+ lines)
  - Design patterns applied
  - Testing strategy (unit/integration/E2E)
  - Integration points (upstream/downstream dependencies)
  - Known issues and limitations
  - Future enhancements

**Contains:**
- Deep technical dive into specific component
- Code walkthrough with examples
- Design patterns and rationale
- Testing approach and coverage targets
- Integration guide (how other components use this)
- Troubleshooting and debugging tips
- Known issues and workarounds

---

### 3. Setup Guides (HOW-TO DOCS)

**Create when:**
- ðŸ”§ New infrastructure component added (Docker, database, etc.)
- ðŸš€ Deployment process established
- âš(TM)ï¸ Configuration is non-trivial
- ðŸ§ª Testing infrastructure needs documentation

**Examples:**
- `docs/setup/week1-setup-guide.md` (First-time environment setup)
- `docs/setup/nhie-mock-guide.md` (1000+ lines NHIE mock reference)
- `docs/setup/openmrs-docker-setup.md` (OpenMRS Docker configuration)

**Contains:**
- Step-by-step instructions
- Prerequisites and dependencies
- Configuration options
- Troubleshooting common issues
- Verification steps (how to confirm it's working)

---

### 4. Specifications (REQUIREMENTS DOCS)

**Create when:**
- ðŸ“‹ Defining feature requirements (before implementation)
- ðŸŽ¨ UI/UX design needs documentation
- ðŸ“Š Data models need specification
- âœ… Acceptance criteria for testing

**Examples:**
- `docs/specs/registration-form-spec.md`
- `docs/specs/triage-form-spec.md`
- `docs/specs/consultation-spec.md`

**Contains:**
- Feature description and purpose
- User stories and acceptance criteria
- Data models and validation rules
- UI mockups or wireframes
- API contracts (request/response examples)

---

### 5. External Resources (CENTRALIZED LINKS)

**Purpose:** Single source for ALL external documentation, APIs, and resources

**File:** `docs/EXTERNAL_RESOURCES.md` 🔗

**Use when:**
- 🔗 Need OpenMRS REST API documentation
- 🌐 Looking for FHIR R4 specifications
- 🇬🇭 Ghana health system information (NHIA, GHS, Ghana Card)
- 🌍 African regional context (Uganda EMR, Kenya HIE)
- 📚 Development tools documentation (Next.js, shadcn/ui, TanStack Query)
- 💬 Community support channels (OpenMRS Talk, Slack)

**Contains:**
- OpenMRS Documentation (Wiki, REST API, FHIR, O3, Docker)
- FHIR & HL7 Resources (R4 specs, HAPI FHIR, ICD-10, LOINC, SNOMED)
- Ghana Health System (NHIA, GHS, MoH, Ghana Card format, 16 regions)
- African Regional Context (Uganda EMR, Kenya HIE, Rwanda EMR)
- Development Tools & Libraries (Frontend, Backend, Database, DevOps)
- Community & Support (OpenMRS Talk, Slack, IRC, GitHub)
- Quick Bookmarks (12 daily-use links + local endpoints)

**Benefits:**
- [DONE] No more searching for "that OpenMRS REST API link"
- [DONE] Eliminates duplicate links across 50+ files
- [DONE] Single place to update when URLs change
- [DONE] Organized by category (OpenMRS, FHIR, Ghana, Tools)
- [DONE] Quick reference card for bookmarks

**Related Documents:**
- **UGANDA_EMR_REFERENCE.md:** Uganda EMR code adaptation (detailed code examples)
- **QUICK_REFERENCE.md:** Commands and code snippets (how-to)
- **AGENTS.md:** Architecture patterns and domain rules (internal)

---

## What We DON'T Create (Anti-Patterns)

### âŒ Weekly Progress Files (REDUNDANT)
**Don't create:**
- `WEEK4-5_PROGRESS.md` âŒ
- `WEEK6-11_PROGRESS.md` âŒ
- `SPRINT_DASHBOARD.md` âŒ
- `CURRENT_STATUS.md` âŒ

**Why?** Information duplicates what's already in IMPLEMENTATION_TRACKER.md. Becomes stale quickly. Hard to keep synchronized.

**Instead:** Embed quick dashboards in IMPLEMENTATION_TRACKER.md week sections.

---

### âŒ Change Logs (USE GIT COMMITS)
**Don't create:**
- `CHANGELOG.md` for code changes (use git log)
- `UPDATES.md` for daily changes (use git commits)

**Why?** Git commit history is authoritative. Duplicate documentation creates sync issues.

**Instead:** Write clear git commit messages. Reference issue/task numbers.

---

### âŒ Status Reports (USE TRACKER)
**Don't create:**
- `STATUS_REPORT_2025-11-02.md` (date-stamped status files)
- `PROGRESS_UPDATE.md` (generic status updates)

**Why?** Creates file proliferation. Hard to find latest status.

**Instead:** Update IMPLEMENTATION_TRACKER.md status sections.

---

## Documentation Maintenance Rules

### 1. Update IMPLEMENTATION_TRACKER.md First
When completing any task:
1. âœ… Mark task complete in tracker
2. ðŸ“Š Update progress % if significant milestone
3. ðŸ“ Add quick summary of what was built
4. ðŸ”— Link to detailed technical doc (if complex)

### 2. Create Detailed Docs Only When Needed
Ask yourself:
- ðŸ¤” Is this complex enough to need deep dive? (Yes â†’ Create detailed doc)
- ðŸ¤” Will other developers integrate with this? (Yes â†’ Create integration guide)
- ðŸ¤” Is this just status update? (No â†’ Update tracker only, don't create new file)

### 3. Link, Don't Duplicate
- âœ… IMPLEMENTATION_TRACKER.md has summary + link to detailed doc
- âŒ Don't copy/paste content between files
- âœ… Each piece of information lives in ONE place

### 4. Archive, Don't Delete
If doc becomes obsolete:
1. Move to `docs/archive/` folder
2. Add "ARCHIVED" prefix to filename
3. Add note at top: "This document is archived. See [new location] for current version."

---

## Quick Reference: Where Does This Go?

| Information Type | Location | Example |
|------------------|----------|---------|
| Task completion status | IMPLEMENTATION_TRACKER.md | "âœ… Task #8 complete - Nov 2, 2025" |
| Progress % update | IMPLEMENTATION_TRACKER.md | "Week 4-5: 75% complete" |
| Code statistics | IMPLEMENTATION_TRACKER.md | "710 lines production code" |
| Design patterns used | Task completion doc | "TASK8_COMPLETION_SUMMARY.md â†’ Design Patterns section" |
| Testing strategy | Task completion doc | "TASK8_COMPLETION_SUMMARY.md â†’ Testing Strategy section" |
| Integration guide | Task completion doc | "TASK8_COMPLETION_SUMMARY.md â†’ Integration Points section" |
| Setup instructions | Setup guide | "nhie-mock-guide.md â†’ Setup Commands section" |
| Troubleshooting | Setup guide or task doc | "nhie-mock-guide.md â†’ Troubleshooting section" |
| Feature requirements | Specification doc | "registration-form-spec.md" |
| Acceptance criteria | Specification doc | "registration-form-spec.md â†’ Acceptance Criteria" |
| Architecture decisions | AGENTS.md or tracker | "AGENTS.md â†’ CRITICAL ARCHITECTURE RULES" |
| Domain rules | AGENTS.md | "AGENTS.md â†’ Ghana Health Domain Rules" |

---

## Document Lifecycle

```
1. PLAN
   â””â”€> Create specification doc (docs/specs/)
       Example: registration-form-spec.md

2. BUILD
   â””â”€> Update IMPLEMENTATION_TRACKER.md with progress
       Example: "âœ… Registration form: 50% complete"

3. COMPLETE (Simple Task)
   â””â”€> Update IMPLEMENTATION_TRACKER.md only
       Example: "âœ… Validator complete - Nov 2, 2025"

4. COMPLETE (Complex Task)
   â”œâ”€> Update IMPLEMENTATION_TRACKER.md with summary
   â”‚   Example: "âœ… NHIEIntegrationService complete - 710 lines"
   â””â”€> Create detailed technical doc (docs/setup/)
       Example: TASK8_COMPLETION_SUMMARY.md

5. DEPLOY
   â””â”€> Create/update setup guide (docs/setup/)
       Example: openmrs-docker-setup.md

6. MAINTAIN
   â””â”€> Update docs when architecture/requirements change
       Single source of truth prevents drift
```

---

## Benefits of This Structure

âœ… **Single Source of Truth** - IMPLEMENTATION_TRACKER.md tells you what exists  
âœ… **No Duplication** - Each fact lives in one place  
âœ… **Easy Maintenance** - Update one file, not five  
âœ… **Clear Hierarchy** - Tracker â†’ Detailed docs â†’ Supporting guides  
âœ… **Scalable** - Works for 20-week project or 2-year project  
âœ… **AI-Friendly** - Agents query tracker, then dive into specific docs  
âœ… **Team-Friendly** - New developers know where to look  


---

## Update — Nov 2, 2025: New/Updated Documentation Entries

- Added: NHIE transaction logging reference
  - Path: ackend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/README-TRANSACTION-LOGGING.md
  - Purpose: Canonical spec for ghanaemr_nhie_transaction_log and logger usage

- Updated: Schema reference
  - Path: docs/db/liquibase-schema.md
  - Purpose: Align canonical NHIE tables (transaction log, coverage cache) and note logger alignment

- Updated: QA test plan
  - Path: docs/qa/test-plan.md
  - Purpose: Document NHIEIntegrationService test suite, coverage target, run commands

- Updated: AGENTS.md
  - New section: “NHIE Transaction Logging (Implementation Note — Nov 2, 2025)”
  - Purpose: Team guidance for using NHIETransactionLogger, table name, PII masking expectations

- Tracker: IMPLEMENTATION_TRACKER.md
  - Week 4–5 update block summarizing tests + logger abstraction
## Related Documents

- [IMPLEMENTATION_TRACKER.md](../../IMPLEMENTATION_TRACKER.md) - Single source of truth
- [AGENTS.md](../../AGENTS.md) - Ghana domain rules, NHIE architecture, code patterns
- [README.md](../../README.md) - Project overview, quick start guide
- [docs/setup/](../setup/) - Setup guides and operational documentation
- [docs/specs/](../specs/) - Feature specifications and requirements

---

**Questions?** Check IMPLEMENTATION_TRACKER.md first. If you need deeper technical details, follow the links to task completion summaries.

