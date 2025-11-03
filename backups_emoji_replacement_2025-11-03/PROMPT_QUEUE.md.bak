# Active Task Queue

**Active Tasks:** 0
**Next Task:** None

**For Workers:** Queue is currently empty. Wait for new tasks to be added.

**When new tasks are added:**
- [ ] Read AGENTS.md Task Management Workflow section
- [ ] Change status to 🟡 IN PROGRESS when starting
- [ ] Execute ALL steps (no skipping)
- [ ] Run ALL verification commands
- [ ] **PERFECT HANDSHAKE:** If part of sequence, ADD next task BEFORE completing
- [ ] Update IMPLEMENTATION_TRACKER.md BEFORE deleting task

---

## ?? ACTIVE (1 Task)

**Phase 2: OPD Core Workflow (Week 6-11)** - Starting November 2, 2025

**Recent Completions:**
- ✅ Task 5: NHIE Patient Sync Integration (Week 4-5) - Completed Nov 2, 2025
- ✅ Task 4: Backend Report API Endpoints - Completed Nov 3, 2025
- ✅ Task 3: Frontend Pages (Login, Dashboard, Patient List) - Completed Nov 3, 2025
- ✅ Task 2: Auth Endpoints (Login, Logout, Session) - Completed Nov 2, 2025

---

## Task 8: OPD Consultation Module - Backend (Week 7-8) (MEDIUM PRIORITY)

**Created:** 2025-11-02 16:30 UTC  
**Priority:** MEDIUM  
**Estimated Time:** 8-10 hours  
**Dependencies:** Task 7 (Triage frontend complete)  
**Status:** 🟡 IN PROGRESS

### Context & Background

Implement the **core OPD consultation workflow** where doctors record patient complaints, diagnoses (ICD-10), prescriptions (drug orders), and lab orders. This is the heart of the EMR system and most time-consuming task in Phase 2.

**Ghana-Specific Requirements:**
- **Top 20 Ghana Diagnoses:** Quick-pick buttons for common diagnoses (Malaria, URTI, Hypertension, etc.)
- **Essential Medicines:** Search from Ghana Essential Medicines List (50 drugs)
- **Lab Orders:** Top 10 tests (FBC, Malaria test, Blood Sugar, Urinalysis, etc.)
- **Encounter Type:** "OPD Consultation" encounter with observations and orders
- **NHIE Integration:** After consultation saved, trigger NHIE encounter submission (async)

### Self-Contained Execution Instructions

**READ THESE FILES FIRST:**
- `AGENTS.md` - OpenMRS Code Patterns (Encounter/Obs creation, Order API)
- `docs/mapping/encounter-observation-fhir-mapping.md` - OpenMRS to FHIR mapping
- `03_Ghana_Health_Domain_Knowledge.md` - Top 20 diagnoses, essential medicines
- `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/impl/TriageServiceImpl.java` - Pattern for creating encounters

---

### Implementation Steps (Detailed in Task Description)

**This task is complex and split into multiple sub-steps:**

1. **Database Schema:** Create ICD-10 diagnosis concepts, drug concepts, lab order concepts (Liquibase)
2. **ConsultationService Interface:** Define methods (recordConsultation, addDiagnosis, prescribeDrug, orderLab)
3. **ConsultationServiceImpl:** Implement service logic (create encounter, add observations, create drug orders, lab orders)
4. **ConsultationController:** REST endpoints (POST /consultation, GET /consultation/{uuid})
5. **Unit Tests:** Test consultation recording, diagnosis validation, drug ordering
6. **NHIE Integration:** Trigger `NHIEIntegrationService.submitEncounter()` after consultation saved

**Estimated Breakdown:**
- Schema creation: 2 hours
- Service implementation: 4 hours
- Controller + tests: 2 hours
- NHIE integration: 2 hours

**For detailed execution steps, see Task 8 full description in PROMPT_QUEUE.md after Task 7 completes.**

---

### Acceptance Criteria

- [ ] ConsultationService created with 4+ methods
- [ ] Encounter creation working (type: "OPD Consultation")
- [ ] Diagnosis stored as coded observations (ICD-10)
- [ ] Drug prescriptions create OpenMRS DrugOrder objects
- [ ] Lab orders create OpenMRS TestOrder objects
- [ ] NHIE encounter submission triggered after save
- [ ] Unit tests: >80% coverage
- [ ] Compilation: BUILD SUCCESS
- [ ] REST API tested with Postman/curl

---

**END OF ACTIVE QUEUE (3 Tasks Added)**

---

## How to Add New Tasks

When adding new tasks, use this template:

```markdown
## 🔵 Task N: [Task Title] ([Priority: HIGH/MEDIUM/LOW])

**Created:** YYYY-MM-DD HH:MM UTC
**Priority:** [HIGH/MEDIUM/LOW]
**Estimated Time:** X-Y hours
**Dependencies:** [List dependencies]
**Status:** 🔵 QUEUED

### Context & Background
[Provide context about what needs to be done and why]

### Self-Contained Execution Instructions

**READ THESE FILES FIRST (Required Context):**
- [List files to read for context]

### STEP 1: [Step Title]
[Detailed instructions]

**Verification:**
```bash
# Commands to verify this step
```

### STEP 2: [Next Step]
[Continue with all steps...]

### Expected Deliverables
[List what should be created/modified]

### Success Criteria
[List acceptance criteria]

### Perfect Handshake (CRITICAL)
**BEFORE completing this task:**
- [ ] Check if this is part of a larger sequence
- [ ] If YES: Add next logical task to PROMPT_QUEUE.md with full context
- [ ] Include: What THIS task did, what NEXT task needs, all dependencies
- [ ] This ensures NO WORK IS LOST between sessions

---
```

**Next Worker Command (Copy & Paste when task added):**
```
Refer to PROMPT_QUEUE.md pending task and complete it. Follow AGENTS.md rules, update IMPLEMENTATION_TRACKER.md when done.
```


