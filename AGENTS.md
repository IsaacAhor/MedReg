# AGENTS.md - MedReg: Ghana EMR MVP

**Project**: MedReg (Ghana NHIE-Compliant Electronic Medical Records System)  
**Repository**: https://github.com/IsaacAhor/MedReg  
**Timeline**: 16-20 weeks to functional MVP  
**Target**: Win MoH pilot facility + position for EOI Q1 2026  
**Approach**: AI-first development with startup velocity  
**Current Status**: Week 2 Complete [DONE] - Module Builds Successfully (See [IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md))

---

## [WARNING] CRITICAL REQUIREMENTS - READ FIRST [WARNING]

### [WARNING] NON-NEGOTIABLE TECHNOLOGY CONSTRAINTS

**THESE ARE HARD REQUIREMENTS, NOT RECOMMENDATIONS:**

#### 1. Java Version: JAVA 8 ONLY (1.8.0_472)
- [PROHIBITED] **DO NOT upgrade to Java 11, 17, or 21**
- [PROHIBITED] **OpenMRS 2.4.0 BREAKS with Java 11+**
- [DONE] **MUST use:** Eclipse Temurin OpenJDK 8u472-b08
- [WARNING] **Consequence of upgrade:** 30+ compilation errors, broken dependencies, 4-6 week migration to OpenMRS 3.x
- **Verify:** `java -version` must show `1.8.0_472`

#### 2. MySQL Version: MYSQL 5.7 ONLY
- [PROHIBITED] **DO NOT use MySQL 8.0 or higher**
- [PROHIBITED] **MySQL 8.0 is INCOMPATIBLE** (MySQL Connector/J 5.1.x doesn't support removed `storage_engine` variable)
- [DONE] **MUST use:** MySQL 5.7 (Docker: `mysql:5.7`)
- [WARNING] **Consequence of upgrade:** Database connection failures, OpenMRS won't start
- **Verify:** `docker exec mysql mysql --version` must show `5.7.x`

#### 3. OpenMRS Platform: 2.4.0 ONLY
- [PROHIBITED] **DO NOT upgrade to OpenMRS 3.x (O3) during MVP**
- [DONE] **MUST use:** OpenMRS Platform 2.4.0 with reference-application-distro:2.12.0
- [WARNING] **CRITICAL NOTE:** OpenMRS Platform 2.4.0 does may NOT come with a user interface (UI) module. When navigating to http://localhost:8080/openmrs/, you will see a message like: "If you are seeing this page, it means that the OpenMRS Platform is running successfully, but no user interface module is installed. Learn about the available User Interface Modules. If you are a developer, you can access the REST API. (See REST documentation for clients)". This is expected, as the project uses a separate Next.js frontend.
- [WARNING] **CRITICAL NOTE:** Platform 2.6.0 does NOT exist in OpenMRS 2.x (only in 3.x architecture)
- [WARNING] **Consequence of upgrade:** Complete architecture rewrite, microfrontend migration, 4-6 week delay
- **Why locked:** 16-20 week MVP timeline, MoH pilot deadline Q1 2026

#### 4. Critical Dependencies (Version Locked)
- **Mockito:** 3.12.4 (NOT 5.x - requires Java 11+)
- **HAPI FHIR:** 5.5.3 (R4 compatible with OpenMRS 2.4.0)
- **Spring Framework:** 4.x (OpenMRS 2.4.0 bundled, NOT Spring Boot)
- **Maven:** 3.9.x (build tool)

### Why These Constraints Exist

**OpenMRS 2.4.0 + Java 8 = Production-Proven Stack**
- 100+ implementations worldwide (Uganda, Kenya, Rwanda, Haiti)
- Stable API, well-documented, extensive community support
- Zero breaking changes during 16-20 week MVP timeline
- Latest stable 2.x platform (Reference Application 2.12.0)

**Migration Path (Post-MVP v2):**
1. [DONE] Complete MVP with Java 8 + OpenMRS 2.4.0 (Week 1-16)
2. [DONE] Win MoH pilot facility (Q1 2026)
3. [DONE] Deploy to production (Q2 2026)
4. [ACTIVE] **Then consider:** Migrate to OpenMRS 3.x (O3) + Java 11/17/21 (Q3 2026)

### Pre-Development Checklist

**Before writing ANY code, verify:**
```bash
# 1. Java version
java -version
# Expected: openjdk version "1.8.0_472"

# 2. Maven version
mvn -version
# Expected: Apache Maven 3.9.x, Java version: 1.8.0_472

# 3. MySQL version (if running)
docker exec mysql mysql --version
# Expected: mysql  Ver 14.14 Distrib 5.7.x

# 4. OpenMRS version
grep "<openmrs.version>" backend/*/pom.xml
# Expected: <openmrs.version>2.4.0</openmrs.version>
```

**All checks MUST pass before proceeding!**

### OpenMRS Module config.xml Structure (CRITICAL)

**INCIDENT**: November 4-5, 2025 - 6+ hour module loading failure due to incorrect config.xml structure

**OpenMRS ModuleFileParser expects child elements, NOT attributes:**

[BAD] **WRONG** (Attributes - causes "Name cannot be empty" error):
```xml
<module configVersion="1.2" moduleId="ghanaemr" name="Ghana EMR" version="0.1.0">
```

[DONE] **CORRECT** (Child Elements):
```xml
<module configVersion="1.2">
    <id>ghanaemr</id>
    <name>Ghana EMR</name>
    <version>${project.version}</version>
    <activator>org.openmrs.module.ghanaemr.GhanaEMRActivator</activator>
    ...
</module>
```

**Why This Matters**:
- ModuleFileParser calls `getElementTrimmed(rootNode, "name")` which looks for `<name>` element text content
- Attributes are ignored → parser finds empty string → "Name cannot be empty" exception
- Module silently fails to load with cryptic error message

**Build Validation** (MANDATORY before deployment):
```bash
cd backend/openmrs-module-ghanaemr
mvn clean package
./scripts/validate-omod.sh omod/target/openmrs-module-ghanaemr-*.omod
```

**Validation Script Checks**:
- [DONE] config.xml uses child elements (not attributes)
- [DONE] OMOD size is ~20MB (not 110KB - missing dependencies)
- [DONE] All 27 transitive dependencies bundled (HAPI FHIR, Gson, OkHttp)
- [DONE] Activator class exists in OMOD

**See**: [OPENMRS_MODULE_FIX_IMPLEMENTATION.md](OPENMRS_MODULE_FIX_IMPLEMENTATION.md) for complete fix details

---

## Project Overview

**GitHub Repository:** https://github.com/IsaacAhor/MedReg  
**Implementation Tracker:** [IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md)  
**Branch:** main  
**First Commit:** October 31, 2025 (97 files, 23,077+ lines)  
**Latest Milestone:** OpenMRS Module Build Success (November 2, 2025)

### Tech Stack
**Backend:**
- OpenMRS Platform 2.4.0 (core EMR engine, Reference Application 2.12.0)
- Java 8, Spring Framework (Eclipse Temurin OpenJDK 8u472-b08)
- MySQL 5.7 (required - OpenMRS 2.4.0 MySQL Connector/J incompatible with MySQL 8.0)
- HAPI FHIR 5.5.3 (FHIR R4 library)
- Maven 3.9.9 (build tool)
- Apache HttpClient 4.5.13 (NHIE communication)

**Frontend (Option B - CHOSEN):**
- Next.js 14.x (App Router)
- TypeScript 5.x (strict mode)
- shadcn/ui components + Radix UI primitives
- Tailwind CSS 3.x
- TanStack Query 5.x (server state management)
- React Hook Form 7.x + Zod (forms + validation)
- Axios (HTTP client for OpenMRS REST API)

**Deployment:**
- Backend: Ubuntu 22.04 server, Docker containers
- Frontend: Vercel (free tier) or Netlify
- Database: MySQL 5.7 (same server or managed instance)
- CI/CD: GitHub Actions (https://github.com/IsaacAhor/MedReg)

### Build Status (November 2, 2025)

**[DONE] OpenMRS Module Build: SUCCESS**
- API Module: 21 source files compiled
- OMOD Module: 7 source files compiled
- Build time: 4 seconds
- Artifact: `openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod` (31KB)
- Location: `openmrs-modules/` directory (ready for Docker deployment)

**Build Command:**
```bash
cd backend/openmrs-module-ghanaemr
mvn clean package -Dmaven.test.skip=true
```

**Known Issues Resolved:**
- [DONE] Mockito 5.x incompatibility with Java 8 (downgraded to 3.12.4)
- [DONE] FHIR Patient class ambiguity (15+ locations fixed with fully qualified names)
- [DONE] OpenMRS API method signatures (getPatientsByIdentifier -> getPatients)
- [DONE] Java 8 Stream API compatibility (method references -> lambdas)
- [DONE] Missing dependencies (Apache HttpClient 4.5.13 added)

### MVP Scope (What We're Building)
[DONE] **IN SCOPE:**
1. Patient Registration (Ghana Card, NHIS, folder number, demographics)
2. OPD Workflow (triage, consultation, pharmacy, billing)
3. NHIS Integration (eligibility check, claims export)
4. NHIE Sync (patient + encounter submission to national HIE)
5. Basic Reports (OPD register, NHIS vs Cash, top diagnoses, revenue)
6. **Admin Dashboard** (System KPIs, NHIE sync monitor, user management) - **CRITICAL FOR DEMO DAY**
7. **User Management (8 roles - White-Label Multi-Tenant Ready):**
   - **Platform Admin** (Super Admin): Multi-facility oversight, system config, cross-facility analytics
   - **Facility Admin**: Per-facility user management, reports, NHIE monitoring
   - **Clinical Roles**: [Doctor](docs/training/roles/doctor.md), [Nurse](docs/training/roles/nurse.md), [Pharmacist](docs/training/roles/pharmacist.md), Records Officer, Cashier, NHIS Officer

[PROHIBITED] **OUT OF SCOPE (Defer to v2):**
- IPD/Admissions, ANC, Lab results entry, Appointments, SMS, Advanced reports, Offline mode, Multi-facility deployment (single-facility MVP first), Referrals

### Reference Documents
- `08_MVP_Build_Strategy.md` - 16-20 week build timeline, team structure, budget
- `02_NHIE_Integration_Technical_Specifications.md` - NHIE architecture, OAuth, FHIR profiles
- `03_Ghana_Health_Domain_Knowledge.md` - Ghana health system, NHIS rules, workflows
- `07_AI_Agent_Architecture.md` - 17 specialized agents, interaction patterns

- Internal references:
  - docs/UGANDA_EMR_REFERENCE.md
  - docs/KENYA_EMR_REFERENCE.md
  - docs/runbooks/OPENMRS_REST_LOGIN_RECOVERY_TASKBOOK.md

---

## CRITICAL ARCHITECTURE RULES [WARNING]

### Task Management Workflow (MANDATORY)

[WARNING] **BEFORE STARTING ANY WORK: Check PROMPT_QUEUE.md for active tasks!**

**Purpose:** Streamline task execution with single-command workflow. All tasks are pre-defined with self-contained instructions, verification steps, and file update requirements.

#### **How It Works**

**Human types ONE command:**
```
"Refer to PROMPT_QUEUE.md pending task and complete it. Follow AGENTS.md rules, update IMPLEMENTATION_TRACKER.md when done."
```

**Worker executes automatically:**
1. Opens `PROMPT_QUEUE.md`
2. Finds FIRST task marked [QUEUED] QUEUED or [WIP] IN PROGRESS
3. Executes ALL steps in "Self-Contained Execution Instructions"
4. Runs verification tests (MANDATORY)
5. Updates related files (IMPLEMENTATION_TRACKER.md, etc.)
6. Moves task to `TASK_HISTORY.md` with completion details
7. Deletes task from `PROMPT_QUEUE.md`
8. Notifies human with summary

#### **File Structure**

| File | Purpose | Who Writes | Who Deletes |
|------|---------|-----------|-------------|
| **PROMPT_QUEUE.md** | Active tasks only (FIFO queue) | Human defines tasks | Worker after completion |
| **TASK_HISTORY.md** | Completed tasks (audit trail) | Worker moves tasks here | NEVER (permanent record) |
| **IMPLEMENTATION_TRACKER.md** | Overall project progress | Worker updates on completion | NEVER (living document) |

#### **Task Status Indicators**

- [QUEUED] **QUEUED** - Task defined, waiting to start
- [WIP] **IN PROGRESS** - Worker currently executing (change status when you start)
- [DONE] **SUCCESS** - Task completed successfully (in TASK_HISTORY.md only)
- [WARNING] **PARTIAL** - Task partially complete, needs follow-up (rare)
- [FAILED] **FAILED** - Task abandoned due to blockers (escalate to human)

#### **Task Definition Template**

When human adds new task to PROMPT_QUEUE.md:

```markdown
## Task N: [Title] ([Priority])
**Status:** [QUEUED] QUEUED  
**Assigned to:** Next Available Worker  
**Due:** YYYY-MM-DD HH:MM UTC  
**Estimated:** X hours  

### Self-Contained Execution Instructions

**When you see this task, execute these steps IN ORDER:**

#### 1. Read Context
- AGENTS.md sections: [Relevant sections]
- IMPLEMENTATION_TRACKER.md: [Week/phase]
- [Other context files]

#### 2. Create/Modify These Files
[List exact files to create or modify]

#### 3. Implementation Requirements
[Detailed technical requirements with code patterns]

#### 4. Technical Constraints (NON-NEGOTIABLE)
- [DONE] [Constraint 1]
- [DONE] [Constraint 2]
[Follow AGENTS.md rules]

#### 5. Verification (MANDATORY - Run These Commands)
[Exact commands to verify implementation]

#### 6. Update Files (MANDATORY - Do This BEFORE Deleting Task)
**A. Update IMPLEMENTATION_TRACKER.md:**
[Exact text to add/modify]

**B. Move Task to TASK_HISTORY.md:**
[Instructions for completion record]

**C. Delete Task from PROMPT_QUEUE.md:**
[Instructions for queue cleanup]

**D. Perfect Handshake - Add Next Task (If Applicable):**
[If this task is part of a larger sequence, add the next task to PROMPT_QUEUE.md NOW]
[Include all context from THIS task so next worker has full picture]
[Example: If you just completed "Backend API", add "Frontend Integration" task]

#### 7. Notify Human (MANDATORY FORMAT)

**REQUIRED: Use this exact structure in your completion message:**

```
[DONE] Task N Complete: [Task Title]

**Summary:**
- [Key accomplishment 1]
- [Key accomplishment 2]
- [Key accomplishment 3]

**Files Created/Modified:**
- [file1.ts] - [brief description]
- [file2.tsx] - [brief description]

**Verification Results:**
[DONE] [Command 1] - SUCCESS
[DONE] [Command 2] - SUCCESS

**Updated Documentation:**
[DONE] IMPLEMENTATION_TRACKER.md - [What was updated]
[DONE] TASK_HISTORY.md - Task N archived

**Queue Status:**
- Active Tasks: [N]
- Next Task: [Task X: Title] or [Empty - No tasks queued]

**Perfect Handshake:**
- [DONE] Added Task [N+1] to PROMPT_QUEUE.md - [Next logical task title]
  OR
- [WARNING] No follow-up task needed - sequence complete

---

**NEXT WORKER COMMAND (Copy & Paste):**
```
Refer to PROMPT_QUEUE.md pending task and complete it. Follow AGENTS.md rules, update IMPLEMENTATION_TRACKER.md when done.
```
```

**Why This Format?**
- [DONE] Provides completion summary (what was done)
- [DONE] Shows verification passed (quality assurance)
- [DONE] Confirms documentation updated (traceability)
- [DONE] Includes ready-to-use next worker command (seamless handoff)
- [DONE] Shows queue status (progress visibility)
- [DONE] **Perfect Handshake**: Next task already queued with full context (NO WORK LOST between sessions)

### Acceptance Criteria (Self-Check Before Marking Complete)
- [ ] [Criterion 1]
- [ ] [Criterion 2]
[All must be checked before moving to TASK_HISTORY.md]
```
Holistic Integration Acceptance (REQUIRED):
- [ ] Backend builds successfully (Maven) and REST session endpoint returns 200
- [ ] Frontend builds successfully (Next.js) and core UI routes render
- [ ] Critical user journey for this task works end-to-end without regressions


#### **Worker Responsibilities**
\nHolistic Integration Acceptance (REQUIRED):\n- [ ] Backend builds successfully (Maven) and REST session endpoint returns 200\n- [ ] Frontend builds successfully (Next.js) and core UI routes render\n- [ ] Critical user journey for this task works end-to-end without regressions\n

**When executing task from PROMPT_QUEUE.md:**

1. [DONE] **Change status to [WIP] IN PROGRESS** when you start (update PROMPT_QUEUE.md header)
2. [DONE] **Follow ALL steps** in "Self-Contained Execution Instructions" (no skipping)
3. [DONE] **Run verification commands** (compilation, tests, manual checks)
4. [DONE] **Update files in order:**
   - First: Implementation files (code, config)
   - Second: IMPLEMENTATION_TRACKER.md (mark task complete)
   - Third: TASK_HISTORY.md (move task with completion details)
   - Last: PROMPT_QUEUE.md (delete task, update header counts)
5. [DONE] **Notify human with MANDATORY format** (see Step 7 in task template above):
   - Completion summary
   - Files created/modified
   - Verification results
   - Documentation updates
   - Queue status
   - **NEXT WORKER COMMAND** (ready to copy & paste)
6. [DONE] **BEFORE completing task - Ensure perfect handshake:**
   - If this task is part of a larger sequence, ADD the next logical task to PROMPT_QUEUE.md
   - Include all context, dependencies, and self-contained instructions
   - Reference what was just completed so next worker has full context
   - This ensures NO WORK IS LOST between sessions
7. [PROHIBITED] **DO NOT delete task** from PROMPT_QUEUE.md until ALL acceptance criteria checked

**If you encounter blockers:**
1. Document the issue in task notes
2. Change status to [WARNING] BLOCKED
3. Leave task in PROMPT_QUEUE.md (do NOT move to TASK_HISTORY.md)
4. Notify human: "Task N blocked: [reason]. Need: [what's needed to unblock]."

#### **Benefits of This Workflow**

| Benefit | Description |
|---------|-------------|
| **Single Command** | Human types one sentence, worker executes entire task |
| **Self-Contained** | Each task has ALL context, no hunting for requirements |
| **Audit Trail** | TASK_HISTORY.md preserves what was done, when, by whom |
| **Verification Enforced** | Tasks include mandatory test commands |
| **File Updates Enforced** | Explicit checklist prevents forgetting IMPLEMENTATION_TRACKER.md |
| **Parallel Work Ready** | Multiple workers can take different tasks (Task 1, Task 2, etc.) |
| **Error Recovery** | If worker crashes, task still in PROMPT_QUEUE.md with all details |
| **Progress Visibility** | Human checks PROMPT_QUEUE.md (active) + TASK_HISTORY.md (done) |

#### **Example Workflow Session**

**Monday 9 AM - Human adds 3 tasks to PROMPT_QUEUE.md:**
- Task 1: Auth endpoints (HIGH PRIORITY)
- Task 2: Report stubs (MEDIUM PRIORITY)
- Task 3: Fix NHIE bug (LOW PRIORITY)

**Monday 10 AM - Human tells Copilot:**
```
"Refer to PROMPT_QUEUE.md pending task and complete it. Follow AGENTS.md rules, update IMPLEMENTATION_TRACKER.md when done."
```

**Monday 10:05 AM - Copilot:**
- Opens PROMPT_QUEUE.md
- Sees Task 1 is [QUEUED] QUEUED
- Changes status to [WIP] IN PROGRESS
- Executes steps 1-7 from task instructions
- Updates IMPLEMENTATION_TRACKER.md Week 3
- Moves Task 1 to TASK_HISTORY.md (with completion details)
- Deletes Task 1 from PROMPT_QUEUE.md
- Notifies: "Task 1 complete. Auth endpoints ready."

**Monday 2 PM - Human tells Codex:**
```
"Refer to PROMPT_QUEUE.md pending task and complete it. Follow AGENTS.md rules, update IMPLEMENTATION_TRACKER.md when done."
```

**Monday 2:05 PM - Codex:**
- Opens PROMPT_QUEUE.md
- Sees Task 2 is [QUEUED] QUEUED (Task 1 already gone)
- Changes status to [WIP] IN PROGRESS
- Executes Task 2 (report stubs)
- Notifies: "Task 2 complete. Report stubs ready."

**Monday 5 PM - Human reviews:**
- PROMPT_QUEUE.md: Only Task 3 remains ([QUEUED] QUEUED)
- TASK_HISTORY.md: Shows Task 1 + Task 2 completed (audit trail)
- IMPLEMENTATION_TRACKER.md: Week 3 shows 2/3 tasks complete

#### **Integration with Other AGENTS.md Rules**

**Task execution MUST follow:**
- [DONE] **Documentation Creation Rule** - Check existing docs before creating new files
- [DONE] **Code Generation Rules** - Incremental generation, compile after every 50-100 lines
- [DONE] **Security Rules** - PII masking, no secrets in logs
- [DONE] **Testing Standards** - Unit tests for all new code
- [DONE] **Performance Validation** - N+1 query checks, indexes

**Tasks in PROMPT_QUEUE.md reference these rules explicitly** in "Technical Constraints" sections.

---

### Documentation Creation Rule (MANDATORY)

**[WARNING] BEFORE CREATING ANY NEW .md FILE: Check existing documentation first!**

**RULE: NO NEW DOCUMENTATION FILES without checking if existing files can host the content.**

**Process (MANDATORY for ALL workers):**

1. **Search existing .md files first:**
   ```bash
   # Check if content fits in existing docs
   grep -r "topic keyword" *.md docs/**/*.md
   ```

2. **Check these files FIRST (in priority order):**
   - [DONE] **IMPLEMENTATION_TRACKER.md** - Progress, milestones, build guides, troubleshooting
   - [DONE] **AGENTS.md** - Architecture, domain rules, code patterns, setup commands
   - [DONE] **README.md** - Quick start, project overview, basic setup
   - [DONE] **docs/QUICK_REFERENCE.md** - Commands, snippets, examples
   - [DONE] **docs/setup/** - Setup guides, configuration, operational procedures
   - [DONE] **docs/specs/** - Feature specifications, UI/UX specs
   - [DONE] **docs/mapping/** - FHIR mapping, data transformation
   - [DONE] **docs/security/** - Security policies, audit, privileges

3. **Only create NEW file if:**
   - [BAD] Content doesn't fit any existing file's purpose
   - [BAD] Would make existing file too large (>3000 lines)
   - [BAD] Requires separate versioning/tracking
   - [DONE] Is a distinct, standalone topic (e.g., new integration guide)

4. **If creating new file:**
   - Update `docs/DOCUMENTATION_STRUCTURE.md` with new file reference
   - Add link from related existing docs
   - Justify why new file needed (comment in PR)

**Why This Rule Exists:**
- [DONE] Maintains Single Source of Truth (see docs/DOCUMENTATION_STRUCTURE.md)
- [DONE] Prevents duplicate information across files
- [DONE] Reduces maintenance burden (fewer files to update)
- [DONE] Easier for workers to find information (consolidated docs)
- [DONE] Reduces context switching (related info in one place)

**Example Decision Process:**
```
Question: "Should I create build-troubleshooting.md?"
1. Check IMPLEMENTATION_TRACKER.md Week 2 -> Already has build errors section [DONE]
2. Check AGENTS.md -> Has setup commands section [DONE]
3. Decision: Add to IMPLEMENTATION_TRACKER.md Week 2, not new file [BAD]

Question: "Should I create kenya-hie-integration-guide.md?"
1. Check docs/setup/ -> No Kenya-specific guide [BAD]
2. Check UGANDA_EMR_REFERENCE.md -> Different country [BAD]
3. Check AGENTS.md -> Too specific for architecture doc [BAD]
4. Decision: Create new file (distinct integration topic) [DONE]
```

**Enforcement:**
- AI workers: Check existing docs before suggesting new files
- Code reviews: Reject PRs with unnecessary new .md files
- Monthly audit: Consolidate redundant documentation

---

### Code Generation Rules (MANDATORY)

**[WARNING] BEFORE GENERATING ANY CODE: Verify constraints and compile incrementally!**

**RULE: NO LARGE CODE GENERATION without incremental compilation and validation.**

#### 1. **Check Project Constraints FIRST** [DONE]

Before writing any code, verify:

```bash
# Check Java version
java -version    # MUST be Java 8 (1.8.0_472)

# Check OpenMRS version
grep "openmrs-api" backend/*/pom.xml    # MUST be 2.4.0

# Check dependency versions
grep -E "(mockito|hapi.fhir|httpclient)" backend/*/pom.xml
```

**Required Constraints:**
- [DONE] **Java 8 only** (no Java 11+ features: var, new switch, records, sealed classes)
- [DONE] **OpenMRS 2.4.0 API** (not 3.x, not 1.x)
- [DONE] **MySQL 5.7** (not 8.0 - connector incompatibility)
- [DONE] **Mockito 3.12.4** (not 5.x - requires Java 11+)
- [DONE] **HAPI FHIR 5.5.3** (R4 compatible with OpenMRS 2.4.0)
- [DONE] **Spring Framework** (OpenMRS 2.4 uses Spring 4.x, not Spring Boot)

**If you assume wrong version = 30+ compilation errors!**

#### 2. **Incremental Code Generation (50-100 Lines Max)** [ACTIVE]

**NEVER generate 500+ lines without compiling!**

**Process:**
```
Generate 50 lines -> Compile -> Fix errors -> Generate next 50 -> Repeat
```

**Bad Example (Caused Week 2 Errors):**
```
[FAILED] Generate NHIEIntegrationServiceImpl.java (560 lines)
[FAILED] Hope it compiles
[FAILED] Discover 20+ errors later
```

**Good Example:**
```
[DONE] Generate NHIEIntegrationServiceImpl skeleton (50 lines)
[DONE] Run: mvn clean compile
[DONE] Fix any errors (FHIR class ambiguity, imports)
[DONE] Generate syncPatientToNHIE method (80 lines)
[DONE] Run: mvn clean compile
[DONE] Fix method signature errors
[DONE] Generate helper methods (100 lines)
[DONE] Run: mvn clean compile
[DONE] All green -> Continue
```

#### 3. Compilation Validation After Every Change

**MANDATORY: Compile after adding/modifying any file**

```bash
# Backend (Java)
cd backend/openmrs-module-ghanaemr
mvn clean compile -Dmaven.test.skip=true

# If errors: FIX BEFORE CONTINUING!
# Don't generate more broken code on top of broken code
```

**Red Flags (Stop and Fix):**
- [BAD] "cannot find symbol: class X" -> Missing import or wrong class name
- [BAD] "reference to X is ambiguous" -> Class name collision (use fully qualified names)
- [BAD] "cannot find symbol: method X()" -> Wrong API method (check OpenMRS Javadocs)
- [BAD] "incompatible types" -> Wrong Java version features or API mismatch

#### 4. Avoid Common Java 8 + OpenMRS 2.4 Pitfalls

**Known Error Patterns from Week 2 (30+ errors fixed):**

##### Error Pattern 1: FHIR Class Ambiguity
```java
// [BAD] - Ambiguous (Patient exists in both OpenMRS and FHIR)
import org.hl7.fhir.r4.model.*;
Patient fhirPatient = mapper.toFhirPatient(patient);

// [DONE] GOOD - Fully qualified
import org.hl7.fhir.r4.model.HumanName;
import org.hl7.fhir.r4.model.Identifier;
org.hl7.fhir.r4.model.Patient fhirPatient = mapper.toFhirPatient(patient);
```

**Conflicting Classes:**
- `Patient`: OpenMRS vs FHIR
- `Person`: OpenMRS vs FHIR
- `Address`: OpenMRS vs FHIR
- `Observation`: OpenMRS vs FHIR

**Solution:** Use fully qualified names for ALL FHIR classes.

##### Error Pattern 2: OpenMRS 2.4 API Method Names
```java
// [BAD] - Method doesn't exist in OpenMRS 2.4
List<Patient> patients = patientService.getPatientsByIdentifier(identifier);

// [DONE] GOOD - Correct OpenMRS 2.4 API
List<Patient> patients = patientService.getPatients(null, identifier, null, true);
```

**Check OpenMRS API:** https://docs.openmrs.org/doc/org/openmrs/api/PatientService.html

##### Error Pattern 3: Mockito Version (Java 8)
```xml
<!-- [BAD] - Mockito 5.x requires Java 11+ -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.12.0</version>
</dependency>

<!-- [DONE] GOOD - Mockito 3.x supports Java 8 -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>3.12.4</version>
</dependency>
```

##### Error Pattern 4: Java 8 Stream API Limitations
```java
// [BAD] - Method reference doesn't work in Java 8 Optional.flatMap
.map(Set::stream)

// [DONE] GOOD - Use explicit lambda
.flatMap(set -> set.stream())
```

##### Error Pattern 5: Wrong OpenMRS Class Names
```java
// [BAD] - Class doesn't exist in OpenMRS 2.4
ConceptReferenceSource source = term.getConceptSource();

// [DONE] GOOD - Correct class name
ConceptSource source = term.getConceptSource();
```

##### Error Pattern 6: Missing Dependencies
```java
// If you use: import org.apache.http.*;
// MUST add to pom.xml:
<dependency>
    <groupId>org.apache.httpcomponents</groupId>
    <artifactId>httpclient</artifactId>
    <version>4.5.13</version>
</dependency>
```

#### 5. Test Before Committing

**NEVER commit code that doesn't compile!**

```bash
# Full build validation
cd backend/openmrs-module-ghanaemr
mvn clean package -Dmaven.test.skip=true

# Expected output:
# [INFO] BUILD SUCCESS
# [INFO] Total time: 4.006 s

# If BUILD FAILURE: Fix errors before committing!
```

#### 6. Consult Documentation BEFORE Assuming

**Before writing code that uses:**

| Technology | Check These Docs First |
|------------|------------------------|
| OpenMRS API | https://docs.openmrs.org/doc/ |
| HAPI FHIR | https://hapifhir.io/hapi-fhir/docs/ |
| Mockito | https://javadoc.io/doc/org.mockito/mockito-core/3.12.4/ |
| Spring Framework | Check OpenMRS bundled version (4.x, not 5.x) |
| Java 8 | https://docs.oracle.com/javase/8/docs/api/ |

**Don't assume methods exist - verify first!**

#### 7. **Code Generation Checklist** [DONE]

Before generating any Java class:

- [ ] Java version verified (Java 8)
- [ ] OpenMRS version verified (2.4.0)
- [ ] Dependencies checked in pom.xml
- [ ] OpenMRS API docs consulted for method signatures
- [ ] FHIR classes will use fully qualified names
- [ ] Will compile after every 50-100 lines
- [ ] Will run mvn compile before marking task complete
- [ ] Will fix errors before generating more code
- [ ] Will test with mvn clean package before committing

#### 8. Error Recovery Process

**If compilation errors occur:**

1. **Stop generating new code immediately**
2. **Read error messages carefully**
3. **Check this section for known error patterns**
4. **Fix errors one at a time**
5. **Compile after each fix**
6. **Only continue when BUILD SUCCESS**

**Example Error Fix Session:**
```bash
# Error 1: FHIR Patient ambiguity (15 errors)
# Fix: Add fully qualified names -> mvn compile
# Result: 15 errors -> 8 errors [DONE]

# Error 2: getPatientsByIdentifier not found (8 errors)
# Fix: Change to getPatients(...) -> mvn compile
# Result: 8 errors -> 3 errors [DONE]

# Error 3: Mockito version (3 errors)
# Fix: Downgrade pom.xml -> mvn compile
# Result: 3 errors -> 0 errors [DONE] BUILD SUCCESS
```

#### 9. Why These Rules Exist

**Week 2 Lesson Learned:**
- Codex generated 2,000+ lines of code (NHIEIntegrationService, NHIEHttpClient, FhirPatientMapper)
- **30+ compilation errors** discovered later
- **2-3 hours fixing errors** that could have been caught incrementally
- **Root cause:** Generated large blocks without compilation validation

**Prevention Strategy:**
- [DONE] Generate 50-100 lines at a time
- [DONE] Compile after each block
- [DONE] Fix errors immediately
- [DONE] Never generate 500+ lines without testing
- [DONE] Check project constraints FIRST
- [DONE] Consult docs instead of assuming

**Result:** **Zero compilation errors** in generated code! [SUCCESS]

#### 10. Success Metrics

**Target:** 
- [DONE] 100% of generated code compiles on first `mvn compile`
- [DONE] Zero "cannot find symbol" errors
- [DONE] Zero "incompatible types" errors
- [DONE] Zero dependency resolution errors

**How to Achieve:**
1. Check constraints before coding
2. Generate incrementally (50-100 lines)
3. Compile after every increment
4. Fix errors before continuing
5. Consult docs, don't assume

**This prevents another Week 2 debugging marathon!**

---

### Additional Code Quality Rules

**Beyond compilation: Logic, security, and integration correctness**

#### 11. Logic Validation

**MANDATORY checks before considering code "complete":**

```bash
# 1. Test with actual data
# Don't just compile - run with realistic inputs

# 2. Test edge cases
# What happens with: null, empty string, max length, special characters?

# 3. Verify business logic
# Check AGENTS.md for Ghana domain rules
# - Ghana Card: Must use Luhn checksum algorithm (not just format check)
# - NHIS: 10 digits (optional at registration, required for eligibility)
# - Folder Number: [REGION]-[FACILITY]-[YEAR]-[SEQUENCE] format
```

**Common Logic Errors:**
```java
// [BAD] - Only checks format, not checksum
if (ghanaCard.matches("^GHA-\\d{9}-\\d$")) {
    return true; // WRONG! Missing Luhn validation
}

// [DONE] GOOD - Validates format AND checksum
if (ghanaCard.matches("^GHA-\\d{9}-\\d$")) {
    return validateGhanaCardChecksum(ghanaCard); // Luhn algorithm
}
```

#### 12. Security Validation

**MANDATORY: Check for security issues before committing**

```bash
# 1. Search for PII in logs
grep -r "logger.*Patient\|logger.*ghanaCard\|logger.*nhis" backend/

# 2. Check for hardcoded secrets
grep -r "password.*=\|secret.*=\|key.*=" backend/ | grep -v ".example"

# 3. Verify PII masking
# All Ghana Cards in logs must be: GHA-1234****-*
# All NHIS numbers must be: 0123******
```

**PII Masking Rules (NON-NEGOTIABLE):**
- [PROHIBITED] NEVER log: Full Ghana Card, NHIS number, patient name, phone, address
- [DONE] ALWAYS mask: `maskGhanaCard()`, `maskNHIS()`, `maskName()`, `maskPhone()`
- [DONE] Use masked values in: Logs, error messages, transaction logging, audit trails

**Example:**
```java
// [BAD] - Logs full Ghana Card
logger.info("Registering patient with Ghana Card: " + ghanaCard);

// [DONE] GOOD - Logs masked Ghana Card
logger.info("Registering patient with Ghana Card: " + maskGhanaCard(ghanaCard));
```

#### 13. Integration Testing

**MANDATORY: Test integrations before marking complete**

```bash
# 1. Test against NHIE mock server
./scripts/test-nhie-mock.ps1

# 2. Test OpenMRS REST API
curl -u admin:Admin123 http://localhost:8080/openmrs/ws/rest/v1/session

# 3. Test database persistence
# Register patient -> Query database -> Verify data stored correctly
```

**Integration Checklist:**
- [ ] OpenMRS REST API responds correctly
- [ ] Database foreign keys don't break
- [ ] NHIE mock server accepts requests
- [ ] FHIR JSON matches expected format
- [ ] Error responses handled gracefully
- [ ] Retry logic works (test with 429, 5xx)

#### 14. Unit Test Requirements

**MANDATORY: Write tests for all new code**

**Minimum Test Coverage:**
- Service classes: >80% coverage
- Mappers/Converters: >90% coverage
- Validators: 100% coverage
- Controllers: >70% coverage

**Test Naming Convention:**
```java
@Test
public void testMethodName_Scenario_ExpectedResult() {
    // Example: testRegisterPatient_ValidGhanaCard_Success()
    // Example: testRegisterPatient_InvalidGhanaCard_ThrowsException()
}
```

**Required Test Scenarios:**
1. **Happy path** (valid input -> success)
2. **Invalid input** (validation errors)
3. **Edge cases** (null, empty, max length)
4. **Error handling** (exceptions, network failures)
5. **Idempotency** (calling twice produces same result)

**Example:**
```java
// Don't just test success - test failures too!

@Test
public void testValidateGhanaCard_ValidCard_ReturnsTrue() {
    assertTrue(validator.validate("GHA-123456789-0"));
}

@Test(expected = ValidationException.class)
public void testValidateGhanaCard_InvalidChecksum_ThrowsException() {
    validator.validate("GHA-123456789-5"); // Wrong checksum
}

@Test(expected = ValidationException.class)
public void testValidateGhanaCard_Null_ThrowsException() {
    validator.validate(null); // Edge case
}
```

#### 15. Database Schema Validation

**MANDATORY: Verify Liquibase migrations**

For a detailed explanation of table relationships, refer to the [Data Dictionary](docs/db/data-dictionary.md).

```bash
# 1. Check migration syntax
mvn liquibase:validate

# 2. Dry-run migration (don't apply to production)
mvn liquibase:updateSQL

# 3. Verify indexes exist
# Check for indexes on: patient_id, encounter_id, status, created_at
```

**Schema Design Rules:**
- [DONE] Foreign keys MUST have indexes
- [DONE] Query filter columns MUST have indexes (status, created_at)
- [DONE] Large TEXT columns (JSON) should NOT be indexed
- [DONE] Timestamps MUST be NOT NULL with default (CURRENT_TIMESTAMP)
- [DONE] Status enums MUST be VARCHAR(20) not INT

**Example:**
```xml
<!-- [BAD] - Missing index on foreign key -->
<addForeignKeyConstraint constraintName="fk_patient_id"
    baseTableName="nhie_transaction_log"
    baseColumnNames="patient_id"
    referencedTableName="patient"
    referencedColumnNames="patient_id"/>

<!-- [DONE] GOOD - Add index BEFORE foreign key -->
<createIndex tableName="nhie_transaction_log" indexName="idx_patient_id">
    <column name="patient_id"/>
</createIndex>
<addForeignKeyConstraint .../>
```

#### 16. Frontend Code Quality

**TypeScript/React rules (if generating frontend code):**

```bash
# 1. TypeScript compilation
cd frontend
npm run type-check

# 2. Linting
npm run lint

# 3. Test React components
npm test
```

**React Component Rules:**
- [DONE] Use TypeScript interfaces for props
- [DONE] Use Zod for form validation (not manual checks)
- [DONE] Use TanStack Query for API calls (not raw fetch)
- [DONE] Use shadcn/ui components (not custom HTML)
- [DONE] Handle loading and error states
- [DONE] Mask PII in UI (Ghana Card, NHIS)

**Example:**
```tsx
// [BAD] - No loading/error states, plain fetch
function PatientList() {
    const [patients, setPatients] = useState([]);
    useEffect(() => {
        fetch('/api/patients').then(r => r.json()).then(setPatients);
    }, []);
    return <div>{patients.map(p => <div>{p.name}</div>)}</div>;
}

// [DONE] GOOD - TanStack Query, loading/error handling, PII masking
function PatientList() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['patients'],
        queryFn: () => patientApi.list()
    });
    
    if (isLoading) return <Spinner />;
    if (error) return <ErrorAlert message={error.message} />;
    
    return <div>{data.map(p => (
        <div key={p.uuid}>
            {p.name} - {maskGhanaCard(p.ghanaCard)}
        </div>
    ))}</div>;
}
```

#### 17. Performance Validation

**Check for common performance issues:**

```bash
# 1. N+1 query detection
# Look for loops that call database inside:
grep -A 10 "for.*Patient\|while.*Patient" backend/

# 2. Missing indexes (slow queries)
# Check EXPLAIN PLAN for queries with >100ms execution time

# 3. Memory leaks
# Look for: unclosed streams, static collections, event listeners
```

**Performance Rules:**
- [DONE] Use `@Transactional(readOnly=true)` for read-only queries
- [DONE] Fetch associations with JOIN FETCH (avoid N+1)
- [DONE] Paginate large result sets (max 50 per page)
- [DONE] Cache expensive operations (NHIS eligibility for 24 hours)
- [DONE] Close resources in try-with-resources or finally blocks

**Example:**
```java
// [BAD] - N+1 query problem
List<Patient> patients = patientService.getPatients();
for (Patient p : patients) {
    p.getIdentifiers().size(); // Lazy load = 1 query per patient!
}

// [DONE] GOOD - Fetch with JOIN
@Query("SELECT DISTINCT p FROM Patient p " +
       "LEFT JOIN FETCH p.identifiers " +
       "WHERE p.voided = false")
List<Patient> findAllWithIdentifiers();
```

#### 18. Context Verification

**MANDATORY: Verify you're building the right thing**

```bash
# Before starting ANY task:
# 1. Check IMPLEMENTATION_TRACKER.md - Is this task in scope?
# 2. Check AGENTS.md - What are the Ghana domain rules?
# 3. Check docs/specs/ - Is there a spec for this feature?
```

**Questions to Ask:**
- Is this feature in the MVP scope? (Check AGENTS.md "MVP Scope")
- What are the Ghana-specific rules? (Ghana Card format, NHIS validation, folder number)
- What's the workflow? (Check domain-knowledge/workflows/)
- Are there existing patterns? (Check AGENTS.md "OpenMRS Code Patterns")

**Example Decision:**
```
Task: "Build NHIS claims submission"

Check 1: AGENTS.md MVP Scope
[BAD] "NHIS Integration (eligibility check, claims export)"
-> Claims EXPORT in scope, not SUBMISSION

Check 2: Is claims submission needed?
[BAD] MVP focus: Eligibility check only
[DONE] Defer claims submission to v2

Decision: DON'T build it! Focus on eligibility check.
```

#### 19. Code Review Self-Checklist

**Before marking task complete, self-review:**

- [ ] Code compiles (`mvn clean package`)
- [ ] Unit tests pass (`mvn test`)
- [ ] Integration tests pass (NHIE mock working)
- [ ] No PII in logs (grep for Ghana Card, NHIS)
- [ ] No hardcoded secrets (grep for passwords, keys)
- [ ] Performance acceptable (<2s for API calls)
- [ ] Error handling comprehensive (4xx, 5xx, network errors)
- [ ] Documentation updated (Javadoc, README)
- [ ] AGENTS.md constraints followed (Java 8, OpenMRS 2.4)
- [ ] Ghana domain rules correct (Ghana Card checksum, NHIS format)

#### 20. Gradual Rollout Strategy

**Don't deploy untested code to production!**

**Deployment Phases:**
1. **Local testing** (your machine)
2. **NHIE mock testing** (against mock server)
3. **Staging environment** (test with realistic data)
4. **Pilot facility** (1 facility, supervised)
5. **Production rollout** (gradual expansion)

**Red Flags (DO NOT DEPLOY):**
- [BAD] "Works on my machine" but not tested elsewhere
- [BAD] Integration tests failing
- [BAD] Performance untested (don't know if it scales)
- [BAD] No rollback plan (what if it breaks production?)

---

### Confidence Level Update

**With These Additional Rules:**

| Category | Coverage | Confidence | Previous |
|----------|----------|------------|----------|
| **Compilation Errors** | 95% | [DONE] High | 95% |
| **Runtime Errors** | 70% | [WARNING] Good | 30% -> **+40%** |
| **Security Issues** | 80% | [DONE] High | 40% -> **+40%** |
| **Integration Bugs** | 75% | [WARNING] Good | 50% -> **+25%** |
| **Performance Problems** | 60% | [WARNING] Medium | 20% -> **+40%** |
| **Testing Quality** | 80% | [DONE] High | 30% -> **+50%** |
| **Frontend Issues** | 65% | [WARNING] Good | 10% -> **+55%** |

**Overall Confidence: 85-90%** [DONE] - Comprehensive rules covering most failure modes.

**Remaining 10-15% Gap:**
- Creative bugs (unique to this project)
- Deployment/infrastructure issues
- Third-party API changes
- Human judgment calls (architecture decisions)

**These require human oversight - AI cannot prevent 100% of errors!**

---

### NHIE Gateway Architecture (NON-NEGOTIABLE)

**Ghana's NHIE is a standards-based, state-controlled exchange** - NOT a single product, but an architectural pattern that provides **"one way in, one way out"** for all national health integrations.

```
Facility EMR -> NHIE Gateway (Single Entry Point) -> Backend Systems
                     ↓
    ┌────────────────┼────────────────┐
    │                │                │
  NHIA          DHIMS2/GHS      National MPI
(Eligibility,    (Aggregate     (Patient
 Claims)          Reports)       Registry)
    │                │                │
    └────────────────┼────────────────┘
                     ↓
           Shared Health Record (SHR)
    (National ePharmacy, Telemedicine, Lab Results)
```

**RULES:**
1. [PROHIBITED] **NEVER generate code that connects directly to NHIA backend**
2. [PROHIBITED] **NEVER generate code that connects directly to National MPI**
3. [PROHIBITED] **NEVER generate code that connects directly to DHIMS2**
4. [DONE] **ALWAYS route through NHIE gateway** (single secure entry point)
5. [DONE] Facility EMR submits FHIR resources to NHIE, NHIE routes internally to NHIA/MPI/SHR
6. [DONE] Responses flow back: NHIA -> NHIE -> Facility EMR
7. [DONE] NHIE enforces standards (FHIR R4, ICD-10, national medicines list)
8. [DONE] NHIE provides: OAuth 2.0 authentication, audit logging, terminology validation, routing

**Why This Matters:**
- **Ghana MoH mandate**: All facilities connect via NHIE (no direct backend access)
- **Violating this = disqualification from MoH contract**
- **NHIE is vendor-agnostic**: Any EMR meeting MoH conformance criteria can integrate
- **Sovereign control**: MoH controls authentication, authorization, audit logs
- **Full interoperability**: NHIE routes to NHIA, DHIMS2, MPI, SHR, ePharmacy, telemedicine

**NHIE Technical Characteristics:**
- **Standards-based**: HL7/FHIR R4 payloads, validated code sets (ICD-10, LOINC)
- **May use OpenHIM or equivalent** gateway/mediation layer (transparent to EMR)
- **OAuth 2.0 client credentials**: EMRs authenticate with MoH-issued credentials
- **Centralized audit**: All transactions logged for compliance and analytics
- **Policy enforcement**: Rate limits, request tracing, terminology validation

**Implementation:**
- OpenMRS module calls `NHIEIntegrationService` 
- Service calls `NHIEHttpClient` -> posts to NHIE endpoints
- NHIE handles routing to NHIA internally (transparent to our code)

---

## Setup Commands

### First Time Setup
```bash
# Clone repository
git clone https://github.com/IsaacAhor/MedReg.git
cd MedReg

# Backend setup
docker-compose up -d mysql
# Wait 30 seconds for MySQL to initialize
docker-compose up -d openmrs
# Wait 3-5 minutes for OpenMRS to start (first time takes longer)

# Verify OpenMRS is running
# Navigate to: http://localhost:8080/openmrs
# Expected: "OpenMRS Platform 2.4.0 Running!"
# Message about "no user interface module" is NORMAL - we're using Next.js frontend

# Verify REST API is working (CRITICAL - this is what we need!)
curl http://localhost:8080/openmrs/ws/rest/v1/session
# Expected: {"sessionId":"...","authenticated":false}

# Test authentication
curl -u admin:Admin123 http://localhost:8080/openmrs/ws/rest/v1/session
# Expected: {"authenticated":true,"user":{"username":"admin",...}}

# Frontend setup (Option B)
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with NEXT_PUBLIC_OPENMRS_API_URL=http://localhost:8080/openmrs/ws/rest/v1
npm run dev
# Frontend available at http://localhost:3000
```

### Development Commands
```bash
# Backend
mvn clean install                    # Build OpenMRS module
mvn test                            # Run unit tests
mvn test -Dtest=PatientServiceTest  # Run specific test
docker-compose logs -f openmrs      # View OpenMRS logs

# REST API Testing (PowerShell)
Invoke-WebRequest -Uri "http://localhost:8080/openmrs/ws/rest/v1/session"
$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:Admin123"))
Invoke-WebRequest -Uri "http://localhost:8080/openmrs/ws/rest/v1/session" -Headers @{Authorization="Basic $cred"}

# Frontend
npm run dev                         # Start Next.js dev server
npm run build                       # Production build
npm test                            # Run Vitest tests
npm run test:watch                  # Watch mode
npm run lint                        # ESLint + TypeScript checks
npm run format                      # Prettier formatting

# Database
mysql -h localhost -P 3307 -u openmrs_user -p openmrs  # Connect to MySQL
# Password: openmrs_password
# Note: External port is 3307, internal port is 3306
```

### Testing Commands
```bash
# Backend tests
mvn test                                    # All unit tests
mvn verify                                  # Integration tests
mvn test -Dtest.groups=NHIE                # NHIE integration tests only

# Frontend tests
npm test                                    # All Vitest tests
npm test src/components/PatientForm.test.tsx  # Specific test
npm run test:coverage                       # Coverage report (target >70%)
npm run test:e2e                            # Playwright E2E tests

# Integration tests (requires backend + frontend running)
cd tests/integration
npm test                                    # Full OPD workflow tests
```

---

## Ghana Health Domain Rules

### Ghana Card Validation
**Format:** `GHA-XXXXXXXXX-X` (3 chars + hyphen + 9 digits + hyphen + 1 check digit)

**Validation Rules:**
1. Must start with "GHA-"
2. Next 9 characters must be digits (0-9)
3. Last character after second hyphen is Luhn checksum digit
4. Total length: 15 characters exactly
5. Case-insensitive (normalize to uppercase)

**Regex:** `^GHA-\d{9}-\d$`

**Checksum Algorithm (Luhn):**
```java
public static boolean validateGhanaCardChecksum(String ghanaCard) {
    // Extract 9 digits + check digit
    String digits = ghanaCard.replaceAll("[^0-9]", ""); // "XXXXXXXXXX"
    if (digits.length() != 10) return false;
    
    int sum = 0;
    for (int i = 0; i < 9; i++) {
        int digit = Character.getNumericValue(digits.charAt(i));
        if (i % 2 == 0) digit *= 2;
        if (digit > 9) digit -= 9;
        sum += digit;
    }
    int checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit == Character.getNumericValue(digits.charAt(9));
}
```

**Example Valid Ghana Cards:**
- `GHA-123456789-0`
- `GHA-987654321-5`

**Common Errors to Handle:**
- Missing hyphens -> Auto-insert if 13 digits provided
- Lowercase "gha" -> Normalize to "GHA"
- Spaces -> Strip before validation
- Invalid checksum -> Reject with clear error message

---

### NHIS Number Format
**Format:** 10 digits (no hyphens, no letters)

**Validation:**
- Regex: `^\d{10}$`
- Length: exactly 10 characters
- All numeric (0-9)
- Optional at registration (patient can register without NHIS number)
- Required for NHIS eligibility check and claims

**Examples:**
- Valid: `0123456789`, `9876543210`
- Invalid: `012-345-6789` (hyphens), `12345` (too short), `NHIS123456` (letters)

---

### Folder Number Generation
**Format:** `[REGION]-[FACILITY]-[YEAR]-[SEQUENCE]`

**Rules:**
1. REGION: 2-letter Ghana region code (see table below)
2. FACILITY: 4-character facility code (configured in facility metadata)
3. YEAR: 4-digit year (e.g., 2025)
4. SEQUENCE: 6-digit auto-incrementing sequence (padded with zeros)

**Example:** `GAR-KBTH-2025-000123` (123rd patient registered at Korle Bu Teaching Hospital in 2025)

**Ghana Region Codes (All 16 Regions):**
| Code | Region                |
|------|-----------------------|
| AR   | Ashanti               |
| BER  | Bono East             |
| BR   | Bono                  |
| CR   | Central               |
| ER   | Eastern               |
| GAR  | Greater Accra         |
| NER  | North East            |
| NR   | Northern              |
| NWR  | North West            |
| OR   | Oti                   |
| SR   | Savannah              |
| UER  | Upper East            |
| UWR  | Upper West            |
| VR   | Volta                 |
| WR   | Western               |
| WNR  | Western North         |

**Note:** Ghana reorganized from 10 to 16 regions in 2019. Old region codes (BA=Brong Ahafo) are deprecated.

**Implementation:**
```java
public String generateFolderNumber(String facilityCode, String regionCode) {
    int year = LocalDate.now().getYear();
    String prefix = regionCode + "-" + facilityCode + "-" + year;
    
    // Query last sequence for this prefix
    int lastSequence = patientDao.getLastSequenceForPrefix(prefix);
    int nextSequence = lastSequence + 1;
    
    return String.format("%s-%06d", prefix, nextSequence);
}
```

**Thread Safety:** Use database sequence or lock to prevent duplicate folder numbers in concurrent registrations.

---

### Top 20 Ghana OPD Diagnoses (ICD-10)
Generate quick-pick buttons for these common diagnoses:

| Diagnosis | ICD-10 | Diagnosis | ICD-10 |
|-----------|--------|-----------|--------|
| Malaria (uncomplicated) | B54 | Typhoid fever | A01.0 |
| Upper respiratory tract infection | J06.9 | Gastroenteritis | A09 |
| Hypertension | I10 | Diabetes mellitus type 2 | E11.9 |
| Pneumonia | J18.9 | Urinary tract infection | N39.0 |
| Acute gastritis | K29.0 | Skin infection | L08.9 |
| Musculoskeletal pain | M79.9 | Diarrhea | A09 |
| Anemia | D64.9 | Conjunctivitis | H10.9 |
| Asthma | J45.9 | Peptic ulcer disease | K27.9 |
| Otitis media | H66.9 | Dental caries | K02.9 |
| Arthritis | M19.9 | Road traffic accident injury | V89.2 |

**Usage:** Frontend autocomplete should prioritize these 20 diagnoses, then search full ICD-10 database.

---

### Ghana Essential Medicines List (Top 50 Drugs)
**Categories:**
- Antimalarials: Artemether-Lumefantrine, Artesunate, Quinine
- Antibiotics: Amoxicillin, Ciprofloxacin, Metronidazole, Ceftriaxone, Azithromycin
- Analgesics: Paracetamol, Ibuprofen, Diclofenac, Tramadol
- Antihypertensives: Amlodipine, Enalapril, Hydrochlorothiazide, Atenolol
- Antidiabetics: Metformin, Glibenclamide, Insulin (NPH, Regular)
- Antimalarials: ACT (Artemether-Lumefantrine)
- Supplements: Folic Acid, Ferrous Sulfate, Multivitamins

**Dosage Format:** `[DRUG] [STRENGTH] [FORM]`  
Example: `Amoxicillin 500mg Capsule`, `Paracetamol 500mg Tablet`

**Prescription Format:**
```
Drug: Amoxicillin 500mg Capsule
Dosage: 1 capsule
Frequency: 3 times daily (TDS)
Duration: 7 days
Instructions: Take with food
```

---

## OpenMRS Code Patterns
This section provides high-level patterns. For practical, step-by-step implementation guides, see the [Developer's Cookbook](docs/development/cookbook.md).

### Service Layer Pattern
```java
@Service
@Transactional
public class GhanaPatientService {
    
    @Autowired
    private PatientService patientService;
    
    @Autowired
    private PersonService personService;
    
    /**
     * Register new patient with Ghana-specific validation
     * @throws ValidationException if Ghana Card invalid
     */
    public Patient registerPatient(GhanaPatientDTO dto) {
        // 1. Validate Ghana Card format + checksum
        if (!GhanaCardValidator.isValid(dto.getGhanaCard())) {
            throw new ValidationException("Invalid Ghana Card format");
        }
        
        // 2. Check for existing patient with same Ghana Card
        Patient existing = findByGhanaCard(dto.getGhanaCard());
        if (existing != null) {
            throw new DuplicatePatientException("Patient already exists");
        }
        
        // 3. Create OpenMRS Patient
        Patient patient = new Patient();
        PersonName name = new PersonName(dto.getGivenName(), dto.getMiddleName(), dto.getFamilyName());
        patient.addName(name);
        patient.setGender(dto.getGender());
        patient.setBirthdate(dto.getDateOfBirth());
        
        // 4. Set Ghana Card as identifier
        PatientIdentifier ghanaCardId = new PatientIdentifier();
        ghanaCardId.setIdentifierType(getGhanaCardIdentifierType());
        ghanaCardId.setIdentifier(dto.getGhanaCard());
        ghanaCardId.setPreferred(true);
        patient.addIdentifier(ghanaCardId);
        
        // 5. Generate folder number
        String folderNumber = generateFolderNumber(dto.getFacilityCode(), dto.getRegionCode());
        PatientIdentifier folderNumberId = new PatientIdentifier();
        folderNumberId.setIdentifierType(getFolderNumberIdentifierType());
        folderNumberId.setIdentifier(folderNumber);
        patient.addIdentifier(folderNumberId);
        
        // 6. Set NHIS number (optional)
        if (dto.getNhisNumber() != null) {
            PersonAttribute nhisAttr = new PersonAttribute();
            nhisAttr.setAttributeType(getNhisNumberAttributeType());
            nhisAttr.setValue(dto.getNhisNumber());
            patient.addAttribute(nhisAttr);
        }
        
        // 7. Save patient
        return patientService.savePatient(patient);
    }
}
```

### REST Controller Pattern
See the complete [API Reference Guide](docs/api/rest-api-reference.md) for all endpoints.

```java
@RestController
@RequestMapping("/api/v1/ghana/patients")
public class GhanaPatientController {
    
    @Autowired
    private GhanaPatientService ghanaPatientService;
    
    @PostMapping
    public ResponseEntity<?> registerPatient(@Valid @RequestBody GhanaPatientDTO dto) {
        try {
            Patient patient = ghanaPatientService.registerPatient(dto);
            return ResponseEntity.created(URI.create("/api/v1/ghana/patients/" + patient.getUuid()))
                                 .body(PatientMapper.toDTO(patient));
        } catch (ValidationException e) {
            return ResponseEntity.badRequest()
                                 .body(new ErrorResponse("VALIDATION_ERROR", e.getMessage()));
        } catch (DuplicatePatientException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                                 .body(new ErrorResponse("DUPLICATE_PATIENT", e.getMessage()));
        }
    }
    
    @GetMapping("/{uuid}")
    public ResponseEntity<?> getPatient(@PathVariable String uuid) {
        Patient patient = patientService.getPatientByUuid(uuid);
        if (patient == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(PatientMapper.toDTO(patient));
    }
}
```

### Transaction Management
- **All service methods must be `@Transactional`**
- Use `@Transactional(readOnly = true)` for read-only operations (performance)
- Never call transactional methods from within same class (Spring proxy limitation)
- For long-running operations, break into smaller transactions

### Exception Handling
```java
// Custom exceptions
public class ValidationException extends RuntimeException { }
public class DuplicatePatientException extends RuntimeException { }
public class NHIEIntegrationException extends RuntimeException { }

// Global exception handler
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException e) {
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("VALIDATION_ERROR", e.getMessage()));
    }
}
```

---

## NHIE Integration Specification

### Authentication (OAuth 2.0 Client Credentials)
```
POST https://nhie.moh.gov.gh/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=${NHIE_CLIENT_ID}
&client_secret=${NHIE_CLIENT_SECRET}
&scope=patient.write encounter.write coverage.read

Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Token Management:**
1. Cache token in memory (don't request on every API call)
2. Refresh 5 minutes before expiry (proactive refresh)
3. On 401 response, refresh immediately and retry once
4. Store token in thread-safe cache (e.g., `ConcurrentHashMap`)

**mTLS (Mutual TLS):**
- NHIE may require client certificates (not confirmed yet)
- If required: Store keystore at `src/main/resources/nhie-keystore.jks`
- Configure in `NHIEHttpClient`: `sslContext.loadKeyMaterial(keystore, password)`

---

### FHIR Resource Profiles

#### Patient Resource (Submit to NHIE)
```json
{
  "resourceType": "Patient",
  "identifier": [
    {
      "system": "http://moh.gov.gh/fhir/identifier/ghana-card",
      "value": "GHA-123456789-0"
    },
    {
      "system": "http://moh.gov.gh/fhir/identifier/nhis",
      "value": "0123456789"
    },
    {
      "system": "http://moh.gov.gh/fhir/identifier/folder-number",
      "value": "GA-KBTH-2025-000123"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "Mensah",
      "given": ["Kwame", "Kofi"]
    }
  ],
  "gender": "male",
  "birthDate": "1985-03-15",
  "telecom": [
    {
      "system": "phone",
      "value": "+233244123456",
      "use": "mobile"
    }
  ],
  "address": [
    {
      "use": "home",
      "text": "123 Main St, Accra",
      "city": "Accra",
      "district": "Accra Metro",
      "state": "Greater Accra",
      "country": "GH"
    }
  ]
}
```

**Identifier System URIs (CANONICAL - DO NOT CHANGE):**
- Ghana Card: `http://moh.gov.gh/fhir/identifier/ghana-card`
- NHIS Number: `http://moh.gov.gh/fhir/identifier/nhis`
- Folder Number: `http://moh.gov.gh/fhir/identifier/folder-number`

**Gender Mapping:**
- OpenMRS "M" -> FHIR "male"
- OpenMRS "F" -> FHIR "female"
- OpenMRS "O" -> FHIR "other"
- OpenMRS "U" -> FHIR "unknown"

---

#### Encounter Resource (Submit OPD Visit to NHIE)
```json
{
  "resourceType": "Encounter",
  "identifier": [
    {
      "system": "http://moh.gov.gh/fhir/identifier/encounter",
      "value": "GA-KBTH-2025-000123-001"
    }
  ],
  "status": "finished",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "AMB",
    "display": "ambulatory"
  },
  "type": [
    {
      "coding": [
        {
          "system": "http://moh.gov.gh/fhir/encounter-type",
          "code": "OPD",
          "display": "Outpatient Department"
        }
      ]
    }
  ],
  "subject": {
    "reference": "Patient/[NHIE-PATIENT-ID]",
    "identifier": {
      "system": "http://moh.gov.gh/fhir/identifier/ghana-card",
      "value": "GHA-123456789-0"
    }
  },
  "period": {
    "start": "2025-10-30T09:30:00+00:00",
    "end": "2025-10-30T10:15:00+00:00"
  },
  "reasonCode": [
    {
      "coding": [
        {
          "system": "http://hl7.org/fhir/sid/icd-10",
          "code": "B54",
          "display": "Malaria, unspecified"
        }
      ]
    }
  ],
  "diagnosis": [
    {
      "condition": {
        "reference": "Condition/[CONDITION-ID]"
      },
      "use": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/diagnosis-role",
            "code": "AD",
            "display": "Admission diagnosis"
          }
        ]
      }
    }
  ]
}
```

**Encounter Status:** `planned`, `arrived`, `in-progress`, `finished`, `cancelled`  
**Class Code:** Always use `AMB` (ambulatory) for OPD visits

---

#### Coverage Resource (NHIS Eligibility Check)
```
GET https://nhie.moh.gov.gh/fhir/Coverage?beneficiary.identifier=http://moh.gov.gh/fhir/identifier/nhis|0123456789
Authorization: Bearer {access_token}

Response (Active NHIS):
{
  "resourceType": "Coverage",
  "id": "coverage-123",
  "status": "active",
  "subscriber": {
    "reference": "Patient/patient-456"
  },
  "beneficiary": {
    "reference": "Patient/patient-456"
  },
  "payor": [
    {
      "display": "National Health Insurance Authority"
    }
  ],
  "period": {
    "start": "2025-01-01",
    "end": "2025-12-31"
  }
}

Response (Expired/Not Found):
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "not-found",
      "diagnostics": "No active NHIS coverage found for this beneficiary"
    }
  ]
}
```

**Cache Coverage Response:**
- TTL: 24 hours (don't query NHIE on every visit)
- Store in `nhie_coverage_cache` table: `nhis_number`, `status`, `valid_from`, `valid_to`, `cached_at`
- Refresh if cached entry >24 hours old
- Manual refresh button in UI for edge cases

---

### NHIE API Endpoints

**Base URL:** `https://nhie.moh.gov.gh/fhir` (production)  
**Sandbox:** `https://nhie-sandbox.moh.gov.gh/fhir` (for development)

**Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/Patient` | Submit new patient to NHIE |
| PUT | `/Patient/{id}` | Update patient demographics |
| GET | `/Patient?identifier={system}|{value}` | Search patient by identifier |
| POST | `/Encounter` | Submit OPD encounter to NHIE |
| GET | `/Coverage?beneficiary.identifier={system}|{value}` | Check NHIS eligibility |
| POST | `/Claim` | Submit NHIS claim (future - not MVP) |

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/fhir+json
Accept: application/fhir+json
X-Request-ID: {uuid}  (for tracing)
```

---

### Error Handling & Retry Logic

**HTTP Status Code Handling:**

| Status | Meaning | Action |
|--------|---------|--------|
| 200/201 | Success | Process response, mark transaction complete |
| 400 | Bad Request (validation error) | DO NOT RETRY, log error, surface to user |
| 401 | Unauthorized (token expired) | Refresh token ONCE, retry request |
| 403 | Forbidden (insufficient permissions) | DO NOT RETRY, escalate to admin |
| 404 | Not Found | DO NOT RETRY (patient doesn't exist in NHIE) |
| 409 | Conflict (duplicate patient) | Fetch existing patient, reconcile identifiers |
| 422 | Unprocessable Entity (business rule violation) | DO NOT RETRY, move to dead-letter queue (DLQ) |
| 429 | Rate Limit | Retry with exponential backoff (5s, 30s, 2m, 10m) |
| 500/502/503 | Server Error | Retry with exponential backoff |
| Timeout | Network timeout | Retry with exponential backoff |

**Retry Policy (Exponential Backoff):**
```
Attempt 1: Immediate
Attempt 2: 5 seconds
Attempt 3: 30 seconds
Attempt 4: 2 minutes
Attempt 5: 10 minutes
Attempt 6: 1 hour
Max Attempts: 8
```

After 8 failed attempts -> Move to Dead-Letter Queue (DLQ) for manual review

**Implementation:**
```java
@Service
public class NHIERetryService {
    
    private static final int[] RETRY_DELAYS_MS = {0, 5000, 30000, 120000, 600000, 3600000};
    
    @Async
    public void retryFailedTransaction(NHIETransaction transaction) {
        int attempt = transaction.getRetryCount();
        
        if (attempt >= 8) {
            moveToDLQ(transaction);
            return;
        }
        
        try {
            Thread.sleep(RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]);
            
            // Retry submission
            NHIEResponse response = nhieClient.submit(transaction);
            
            if (response.isSuccess()) {
                markComplete(transaction, response);
            } else if (isRetryable(response.getStatus())) {
                scheduleRetry(transaction);
            } else {
                moveToDLQ(transaction);
            }
        } catch (Exception e) {
            scheduleRetry(transaction);
        }
    }
}
```

**Transaction Logging:**
Create `nhie_transaction_log` table to track all NHIE API calls:
```sql
CREATE TABLE nhie_transaction_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(36) NOT NULL,
    patient_id INT,
    encounter_id INT,
    resource_type VARCHAR(50),  -- Patient, Encounter, Coverage, Claim
    http_method VARCHAR(10),
    endpoint VARCHAR(255),
    request_body TEXT,
    response_status INT,
    response_body TEXT,
    retry_count INT DEFAULT 0,
    status VARCHAR(20),  -- PENDING, SUCCESS, FAILED, DLQ
    created_at DATETIME,
    updated_at DATETIME,
    INDEX idx_patient_id (patient_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

---

## Frontend Patterns (Next.js + TypeScript)

### Component Structure
```tsx
// src/components/patients/PatientRegistrationForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useRegisterPatient } from '@/hooks/useRegisterPatient';

// Zod schema for validation
const patientSchema = z.object({
  ghanaCard: z.string()
    .regex(/^GHA-\d{9}-\d$/, 'Invalid Ghana Card format (GHA-XXXXXXXXX-X)')
    .refine(validateGhanaCardChecksum, 'Invalid Ghana Card checksum'),
  nhisNumber: z.string()
    .regex(/^\d{10}$/, 'NHIS number must be 10 digits')
    .optional()
    .or(z.literal('')),
  givenName: z.string().min(2, 'Given name required'),
  familyName: z.string().min(2, 'Family name required'),
  dateOfBirth: z.date().max(new Date(), 'Date of birth cannot be in future'),
  gender: z.enum(['M', 'F', 'O']),
  phone: z.string().regex(/^\+233\d{9}$/, 'Phone must be Ghana format (+233XXXXXXXXX)'),
});

type PatientFormData = z.infer<typeof patientSchema>;

export function PatientRegistrationForm() {
  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      ghanaCard: '',
      nhisNumber: '',
      givenName: '',
      familyName: '',
      gender: 'M',
      phone: '+233',
    },
  });

  const registerPatient = useRegisterPatient();

  const onSubmit = async (data: PatientFormData) => {
    try {
      const patient = await registerPatient.mutateAsync(data);
      // Redirect to patient dashboard
      router.push(`/patients/${patient.uuid}`);
    } catch (error) {
      // Error handled by mutation error handler
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="ghanaCard"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghana Card Number *</FormLabel>
              <FormControl>
                <Input placeholder="GHA-123456789-0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* More fields... */}
        
        <Button type="submit" disabled={registerPatient.isPending}>
          {registerPatient.isPending ? 'Registering...' : 'Register Patient'}
        </Button>
      </form>
    </Form>
  );
}
```

### TanStack Query Pattern
```tsx
// src/hooks/useRegisterPatient.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '@/lib/api/patients';
import { toast } from 'sonner';

export function useRegisterPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientApi.register,
    onSuccess: (data) => {
      // Invalidate patients query to refetch list
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient registered successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to register patient';
      toast.error(message);
    },
  });
}
```

### API Client Pattern
```tsx
// src/lib/api/patients.ts
import axios from '@/lib/axios';

export const patientApi = {
  register: async (data: PatientRegistrationData) => {
    const response = await axios.post('/api/v1/ghana/patients', data);
    return response.data;
  },
  
  search: async (query: string) => {
    const response = await axios.get('/api/v1/ghana/patients', {
      params: { q: query },
    });
    return response.data;
  },
  
  getById: async (uuid: string) => {
    const response = await axios.get(`/api/v1/ghana/patients/${uuid}`);
    return response.data;
  },
};
```

### Axios Configuration
```tsx
// src/lib/axios.ts
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_OPENMRS_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('openmrs_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle errors)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

---

## Code Style Guidelines

### Backend (Java)
- **Java version:** Java 8 (OpenMRS 2.4.0 requirement)
- **Naming:**
  - Classes: `PascalCase` (e.g., `PatientService`)
  - Methods: `camelCase` (e.g., `registerPatient()`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`)
- **Formatting:**
  - Indentation: 4 spaces (no tabs)
  - Line length: 120 characters max
  - Braces: Always use, even for single-line if/for
- **Comments:**
  - Javadoc for all public methods
  - Inline comments for complex logic only
  - No commented-out code in commits
- **Imports:**
  - No wildcard imports (no `import java.util.*`)
  - Order: Java std lib -> Third-party -> OpenMRS -> Project
- **Testing:**
  - All service methods must have unit tests
  - Test method naming: `testMethodName_Scenario_ExpectedResult()`
  - Use Mockito for mocking dependencies

### Frontend (TypeScript)
- **TypeScript strict mode:** Enabled (no `any` types unless necessary)
- **Naming:**
  - Components: `PascalCase` (e.g., `PatientForm`)
  - Hooks: `camelCase` starting with `use` (e.g., `useRegisterPatient`)
  - Files: `kebab-case` or `PascalCase` (e.g., `patient-form.tsx` or `PatientForm.tsx`)
- **Formatting:**
  - Indentation: 2 spaces
  - Quotes: Single quotes for strings, double quotes for JSX attributes
  - Semicolons: Required
  - Trailing commas: Always (makes git diffs cleaner)
- **React Patterns:**
  - Prefer functional components (no class components)
  - Use hooks (useState, useEffect, useQuery, useMutation)
  - Extract reusable logic into custom hooks
  - Keep components small (<200 lines, split if larger)
- **shadcn/ui Usage:**
  - Always use shadcn/ui components (Button, Input, Form, etc.)
  - Don't create custom basic components (use shadcn primitives)
  - Customize via `className` and Tailwind utilities
- **Imports:**
  - Use absolute imports with `@/` alias (e.g., `@/components/ui/button`)
  - Order: React -> Third-party -> @/ imports -> Relative imports

---

## Security Rules

### PII Handling (CRITICAL [WARNING])
1. [PROHIBITED] **NEVER log Ghana Card numbers in plain text**
2. [PROHIBITED] **NEVER log NHIS numbers in plain text**
3. [PROHIBITED] **NEVER log patient names in plain text**
4. [PROHIBITED] **NEVER log phone numbers in plain text**
5. [DONE] **Always mask PII in logs:** `GHA-1234****-*`, `NHIS: 0123****`, `Name: K***e M****h`

**Implementation:**
```java
// BAD - logs full Ghana Card
logger.info("Registering patient with Ghana Card: " + ghanaCard);

// GOOD - masks Ghana Card
logger.info("Registering patient with Ghana Card: " + maskGhanaCard(ghanaCard));

private String maskGhanaCard(String ghanaCard) {
    if (ghanaCard.length() < 15) return "***";
    return ghanaCard.substring(0, 8) + "****-*";
}
```

### Authentication
- **OpenMRS Session:** Use OpenMRS built-in session management
- **Location-Based Login:** User must select work location at login (REQUIRED for queue management)
- **JWT Tokens (frontend):** 1-hour expiry, refresh token pattern
- **Password Policy:** Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
- **Session Timeout:** 30 minutes inactivity

#### Location-Based Login (Implemented Nov 2, 2025)
**Critical for OPD Workflow (Week 4)**

Users must select their physical work location when logging in. This location is stored in the session and used for:
1. **Queue Filtering**: Show only patients in user's location
2. **Patient Routing**: Move patients between service points (Reception -> Triage -> Consultation)
3. **Location Metrics**: Track wait times, patient count per location
4. **Audit Trails**: "Patient registered by Records Officer at Reception at 9:30 AM"

**Login Flow:**
```tsx
// User enters: username, password, location
// Backend stores in cookies:
// - omrsAuth=1 (authenticated)
// - omrsLocation={locationUuid} (selected location)
// - omrsProvider={providerUuid} (user's provider record)

// Session response:
{
  "authenticated": true,
  "user": { "username": "nurse_ama" },
  "sessionLocation": { 
    "uuid": "triage-001",
    "display": "Triage"
  },
  "currentProvider": {
    "uuid": "provider-uuid"
  }
}
```

**Default Locations:**
- Reception (Registration)
- Triage (Vital Signs)
- OPD Room 1 (Consultation)
- OPD Room 2 (Consultation)
- Pharmacy (Dispensing)
- Cashier (Billing)
- Laboratory (Tests)

**Setup:** Run `.\scripts\setup-locations.ps1` to create location tags and default locations.

**Documentation:** See `docs/setup/location-based-login-guide.md` for full implementation details.

### Authorization (Role-Based Access Control)

**8 Roles (White-Label Multi-Tenant Architecture):**

| Role | Permissions | Scope | Notes |
|------|-------------|-------|-------|
| **Platform Admin** | All operations, multi-facility oversight, system configuration, cross-facility analytics, branding management | **All facilities** | Super admin for MedReg platform deployment |
| **Facility Admin** | User management, reports, NHIE monitoring, facility settings, audit logs | **Single facility** | Per-facility operations manager |
| **Doctor** | View patients, create encounters, prescribe drugs, view reports | **Single facility** | Clinical role |
| **Nurse** | View patients, triage, vitals entry, view encounters | **Single facility** | Clinical role |
| **Pharmacist** | View patients, dispense drugs, view prescriptions | **Single facility** | Clinical role |
| **Records Officer** | Register patients, search patients, print records | **Single facility** | Clinical role |
| **Cashier** | View encounters, billing, receipts, revenue reports | **Single facility** | Clinical role |
| **NHIS Officer** | NHIS eligibility checks, claims export, NHIS-specific reports | **Single facility** | Optional role (can be combined with Records Officer) |

**Privilege Matrix:**

| Privilege | Platform Admin | Facility Admin | Doctor | Nurse | Pharmacist | Records | Cashier | NHIS Officer |
|-----------|----------------|----------------|--------|-------|------------|---------|---------|--------------|
| **Multi-Facility Access** | [DONE] All | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] |
| **System Configuration** | [DONE] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] |
| **Manage Users** | [DONE] | [DONE] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] |
| **View Admin Dashboard** | [DONE] | [DONE] | [WARNING] Reports only | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [WARNING] NHIS reports |
| **NHIE Sync Monitor** | [DONE] | [DONE] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] |
| **Facility Settings** | [DONE] | [DONE] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] |
| **Audit Logs** | [DONE] | [DONE] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] |
| **Register Patients** | [DONE] | [DONE] | [WARNING] Emergency | [WARNING] Emergency | [FAILED] | [DONE] | [FAILED] | [DONE] |
| **View Patients** | [DONE] | [DONE] | [DONE] | [DONE] | [DONE] | [DONE] | [DONE] | [DONE] |
| **Edit Patient Demographics** | [DONE] | [DONE] | [FAILED] | [FAILED] | [FAILED] | [DONE] | [FAILED] | [DONE] |
| **Create Encounters** | [DONE] | [DONE] | [DONE] | [WARNING] Triage only | [FAILED] | [FAILED] | [FAILED] | [FAILED] |
| **View Encounters** | [DONE] | [DONE] | [DONE] | [DONE] | [DONE] | [DONE] | [DONE] | [DONE] |
| **Prescribe Drugs** | [DONE] | [FAILED] | [DONE] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] |
| **Dispense Drugs** | [DONE] | [FAILED] | [FAILED] | [FAILED] | [DONE] | [FAILED] | [FAILED] | [FAILED] |
| **Billing** | [DONE] | [DONE] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [DONE] | [FAILED] |
| **NHIS Eligibility Check** | [DONE] | [DONE] | [DONE] | [DONE] | [FAILED] | [DONE] | [FAILED] | [DONE] |
| **NHIS Claims Export** | [DONE] | [DONE] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [FAILED] | [DONE] |
| **View Reports** | [DONE] | [DONE] | [DONE] | [WARNING] Limited | [FAILED] | [FAILED] | [DONE] | [DONE] |

**Legend:** [DONE] Full access | [WARNING] Partial access | [FAILED] No access

**Enforcement:**
- **Backend**: Check `Context.hasPrivilege("Privilege Name")` before operations
- **Facility Scope**: Check `user.getFacility().equals(patient.getFacility())` (multi-tenant isolation)
- **Frontend**: Hide UI elements based on user role (not security, just UX)
- **Database**: OpenMRS `user_role` and `privilege` tables + custom `user_facility` mapping table

**White-Label Isolation (Multi-Tenant):**
- Platform Admin can switch between facilities (dropdown in header)
- Facility Admin/Clinical users see ONLY their assigned facility data
- Database queries auto-filter by `facility_id` (row-level security)
- NHIE transactions tagged with `facility_code` for multi-facility deployments

### NHIE Authentication
- **OAuth 2.0 Client Credentials:** Store `client_id` and `client_secret` in environment variables
- **DO NOT commit secrets to Git** (use `.env` files, add to `.gitignore`)
- **Token Storage:** In-memory cache only (never persist to database or disk)

### Database Security
- **Backups:** Daily encrypted backups to cloud storage (AWS S3, DigitalOcean Spaces)
- **Encryption at Rest:** Enable MySQL encryption (`innodb_encrypt_tables=ON`)
- **SQL Injection Prevention:** Always use prepared statements (Hibernate/JPA handles this)
- **Least Privilege:** Database user has only required permissions (no DROP, TRUNCATE in production)

### Audit Logging
Log all sensitive operations to `audit_log` table:
- Patient registration (who, when, patient Ghana Card masked)
- Patient updates (who, when, what changed)
- Encounter creation (who, when, patient Ghana Card masked)
- NHIS eligibility checks (who, when, NHIS number masked, result)
- NHIE submissions (who, when, resource type, status)
- User login/logout (who, when, IP address)

**DO NOT log:** Full PII, passwords, tokens, secrets

---

## Testing Standards

### Backend Testing (JUnit + Mockito)
**Coverage Target:** >70% line coverage

**Unit Tests:**
```java
@RunWith(MockitoJUnitRunner.class)
public class GhanaPatientServiceTest {
    
    @Mock
    private PatientService patientService;
    
    @InjectMocks
    private GhanaPatientService ghanaPatientService;
    
    @Test
    public void testRegisterPatient_ValidGhanaCard_Success() {
        // Arrange
        GhanaPatientDTO dto = new GhanaPatientDTO();
        dto.setGhanaCard("GHA-123456789-0");
        dto.setGivenName("Kwame");
        dto.setFamilyName("Mensah");
        
        // Act
        Patient patient = ghanaPatientService.registerPatient(dto);
        
        // Assert
        assertNotNull(patient);
        assertEquals("GHA-123456789-0", patient.getGhanaCard());
        verify(patientService, times(1)).savePatient(any(Patient.class));
    }
    
    @Test(expected = ValidationException.class)
    public void testRegisterPatient_InvalidGhanaCard_ThrowsException() {
        // Arrange
        GhanaPatientDTO dto = new GhanaPatientDTO();
        dto.setGhanaCard("INVALID");
        
        // Act
        ghanaPatientService.registerPatient(dto);
        
        // Should throw ValidationException
    }
}
```

**Integration Tests:**
```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = {"classpath:test-applicationContext.xml"})
public class NHIEIntegrationTest {
    
    @Autowired
    private NHIEIntegrationService nhieService;
    
    @Test
    public void testSubmitPatient_ToNHIESandbox_ReturnsPatientId() {
        // Requires NHIE sandbox running
        Patient patient = createTestPatient();
        
        NHIEResponse response = nhieService.submitPatient(patient);
        
        assertTrue(response.isSuccess());
        assertNotNull(response.getNhiePatientId());
    }
}
```

### Frontend Testing (Vitest + React Testing Library)
**Coverage Target:** >70% line coverage

**Component Tests:**
```tsx
// src/components/patients/PatientRegistrationForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientRegistrationForm } from './PatientRegistrationForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('PatientRegistrationForm', () => {
  it('validates Ghana Card format on blur', async () => {
    render(<PatientRegistrationForm />);
    
    const input = screen.getByLabelText(/Ghana Card Number/i);
    await userEvent.type(input, 'INVALID');
    await userEvent.tab(); // Trigger blur
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid Ghana Card format/i)).toBeInTheDocument();
    });
  });
  
  it('submits form with valid data', async () => {
    const mockRegister = jest.fn().mockResolvedValue({ uuid: '123' });
    
    render(<PatientRegistrationForm onSubmit={mockRegister} />);
    
    await userEvent.type(screen.getByLabelText(/Ghana Card/i), 'GHA-123456789-0');
    await userEvent.type(screen.getByLabelText(/Given Name/i), 'Kwame');
    await userEvent.type(screen.getByLabelText(/Family Name/i), 'Mensah');
    await userEvent.click(screen.getByRole('button', { name: /Register/i }));
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
        ghanaCard: 'GHA-123456789-0',
        givenName: 'Kwame',
        familyName: 'Mensah',
      }));
    });
  });
});
```

**E2E Tests (Playwright):**
```typescript
// tests/e2e/patient-registration.spec.ts
import { test, expect } from '@playwright/test';

test('complete patient registration flow', async ({ page }) => {
  await page.goto('http://localhost:3000/patients/register');
  
  // Fill form
  await page.fill('input[name="ghanaCard"]', 'GHA-123456789-0');
  await page.fill('input[name="givenName"]', 'Kwame');
  await page.fill('input[name="familyName"]', 'Mensah');
  await page.selectOption('select[name="gender"]', 'M');
  await page.fill('input[name="phone"]', '+233244123456');
  
  // Submit
  await page.click('button:has-text("Register Patient")');
  
  // Verify redirect to patient dashboard
  await expect(page).toHaveURL(/\/patients\/[a-f0-9-]+$/);
  await expect(page.locator('h1')).toContainText('Kwame Mensah');
});
```

---

## NHIE Mock Server (Development Infrastructure)

### Overview
Since Ghana NHIE sandbox is not yet available (30% uptime, specs pending), we use a production-grade HAPI FHIR mock server for development and testing. This mock simulates NHIE endpoints with realistic FHIR R4 responses, enabling immediate E2E testing without blocking on external infrastructure.

**[WARNING] IMPORTANT: Current Mock is NOT True Middleware**

Our HAPI FHIR mock is a **FHIR server**, not a **middleware layer**. Key differences:

**What it IS:**
- [DONE] FHIR R4 endpoint that stores patient/encounter/coverage data
- [DONE] Validates FHIR resource structure and returns standard error codes
- [DONE] Supports conditional creates (idempotency via If-None-Exist)
- [DONE] Persists data across restarts (PostgreSQL)

**What it is NOT (middleware gaps):**
- [FAILED] No OpenHIM-style routing to downstream systems (NHIA/MPI/SHR)
- [FAILED] No OAuth 2.0 client-credentials authentication
- [FAILED] No central audit trail or policy enforcement (rate limits, throttling)
- [FAILED] No mediator behaviors (queueing, retries, DLQ at gateway layer)

**Why This is Acceptable for MVP:**
- Our `NHIEHttpClient.java` architecture is correct (routes through service layer)
- Real NHIE will be a black box to us (we just POST to it)
- Config-based URL swap works (mock -> sandbox -> production)
- Zero code changes needed when switching to real NHIE

**Future Enhancement (Optional - Week 12-14):**
If time permits and MoH wants to see deeper middleware understanding, we can add OpenHIM + Keycloak layer:
```
EMR -> OpenHIM Gateway -> HAPI FHIR
         ↓
    (OAuth check, rate limits, audit log, routing logic)
```
See `docs/setup/nhie-mock-guide.md` "Upgrade Path" section for details. This would take 2-3 days to set up and would demonstrate enterprise middleware architecture to MoH.

**Strategic Value:**
- [DONE] Unblocks Week 4-5 NHIE integration work (no waiting for MoH sandbox)
- [DONE] Enables comprehensive E2E testing (all scenarios: success, errors, retries)
- [DONE] Demo-ready: Mock returns rich data that looks identical to real NHIE
- [DONE] Zero code changes needed when switching to real NHIE (config-only)

### Architecture

```
┌─────────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│  Ghana EMR Backend  │ ──────► │  NHIE Mock (8090)    │ ──────► │  PostgreSQL DB  │
│  (OpenMRS 8080)     │         │  (HAPI FHIR v7.0.2)  │         │  (Port 5433)    │
│                     │         │                      │         │                 │
│  NHIEHttpClient     │         │  FHIR R4 endpoints:  │         │  Persistent     │
│  - submitPatient()  │         │  - POST /Patient     │         │  mock data      │
│  - checkCoverage()  │         │  - GET /Coverage     │         │  (11 patients)  │
└─────────────────────┘         └──────────────────────┘         └─────────────────┘
```

### Docker Services

**Added to `docker-compose.yml`:**
```yaml
nhie-mock:
  image: hapiproject/hapi:v7.0.2
  container_name: medreg-nhie-mock
  ports: ["8090:8080"]
  environment:
    hapi.fhir.fhir_version: R4
    hapi.fhir.server_address: http://localhost:8090/fhir
    spring.datasource.url: jdbc:postgresql://nhie-mock-db:5432/hapi
  depends_on: [nhie-mock-db]

nhie-mock-db:
  image: postgres:15-alpine
  container_name: medreg-nhie-mock-db
  ports: ["5433:5432"]
  environment:
    POSTGRES_DB: hapi
    POSTGRES_USER: hapi
    POSTGRES_PASSWORD: hapi_password
  volumes: [nhie_mock_data:/var/lib/postgresql/data]
```

### Configuration (Environment-Based)

**Development Mode (Mock):**
```properties
# openmrs-runtime.properties
ghana.nhie.mode=mock
ghana.nhie.baseUrl=http://nhie-mock:8080/fhir
ghana.nhie.oauth.enabled=false
```

**Sandbox Mode (When Available):**
```properties
ghana.nhie.mode=sandbox
ghana.nhie.baseUrl=https://nhie-sandbox.moh.gov.gh/fhir
ghana.nhie.oauth.enabled=true
ghana.nhie.oauth.tokenUrl=https://nhie-sandbox.moh.gov.gh/oauth/token
ghana.nhie.oauth.clientId=${NHIE_CLIENT_ID}
ghana.nhie.oauth.clientSecret=${NHIE_CLIENT_SECRET}
```

**Production Mode:**
```properties
ghana.nhie.mode=production
ghana.nhie.baseUrl=https://nhie.moh.gov.gh/fhir
ghana.nhie.oauth.enabled=true
```

### Setup Commands

**First Time Setup:**
```powershell
cd c:\temp\AI\MedReg
.\scripts\setup-nhie-mock.ps1

# This will:
# 1. Start Docker containers (nhie-mock + nhie-mock-db)
# 2. Wait for services to be healthy (60-90 seconds)
# 3. Run 10 automated tests
# 4. Optionally preload 11 demo patients
```

**Test Mock Server:**
```powershell
.\scripts\test-nhie-mock.ps1

# Expected output:
# [DONE] NHIE mock is healthy
# [DONE] Patient created successfully
# [DONE] Patient found by Ghana Card
# [DONE] Duplicate prevention works
# [DONE] NHIS eligibility check passed
# Tests Passed: 10 / Tests Failed: 0
```

**Preload Demo Data:**
```powershell
.\scripts\preload-demo-data.ps1

# Loads 11 realistic Ghana patients:
# - Kwame Kofi Mensah (Accra, Greater Accra) - Active NHIS
# - Ama Abena Asante (Kumasi, Ashanti) - Active NHIS
# - Kofi Yaw Owusu (Tamale, Northern) - Active NHIS
# ... (8 more with active NHIS)
# - Nana Kwame Anane (Accra) - Expired NHIS (for testing)
```

### Mock Endpoints

**Base URL:** `http://localhost:8090/fhir`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/metadata` | GET | Server capabilities (health check) |
| `/Patient` | POST | Create patient |
| `/Patient/{id}` | GET | Get patient by ID |
| `/Patient?identifier={system}\|{value}` | GET | Search patient by Ghana Card/NHIS |
| `/Coverage?beneficiary.identifier={system}\|{value}` | GET | Check NHIS eligibility |
| `/Encounter` | POST | Submit OPD encounter |

**Example Patient Creation:**
```bash
curl -X POST http://localhost:8090/fhir/Patient \
  -H "Content-Type: application/fhir+json" \
  -H "If-None-Exist: identifier=http://moh.gov.gh/fhir/identifier/ghana-card|GHA-123456789-0" \
  -d '{
    "resourceType": "Patient",
    "identifier": [{
      "system": "http://moh.gov.gh/fhir/identifier/ghana-card",
      "value": "GHA-123456789-0"
    }],
    "name": [{"family": "Mensah", "given": ["Kwame", "Kofi"]}],
    "gender": "male",
    "birthDate": "1985-03-15"
  }'

# Response: 201 Created (or 200 OK if duplicate with If-None-Exist header)
```

### Test Scenarios Preloaded

1. **Success (201 Created):** New patient with valid Ghana Card + NHIS
2. **Duplicate (200 OK):** Conditional create returns existing patient
3. **Invalid Request (400 Bad Request):** Missing required field (identifier)
4. **Active NHIS Coverage (200 OK):** `status: "active", valid until 2025-12-31`
5. **Expired NHIS Coverage (200 OK):** `status: "cancelled", valid until 2024-12-31`
6. **Patient Search (200 OK):** By Ghana Card, NHIS, or patient ID
7. **Performance (<2s):** Response times <500ms (cold start), <100ms (warm)

### Demo Data (11 Patients)

**Patient Profiles:**
- GHA-123456789-0: Kwame Kofi Mensah (Accra, Male, 1985-03-15) - Active NHIS
- GHA-987654321-5: Ama Abena Asante (Kumasi, Female, 1990-07-22) - Active NHIS
- GHA-555666777-8: Kofi Yaw Owusu (Tamale, Male, 1978-11-30) - Active NHIS
- GHA-111222333-4: Akosua Esi Boateng (Cape Coast, Female, 1992-05-18) - Active NHIS
- GHA-444555666-7: Kwabena Kwaku Agyei (Takoradi, Male, 1980-09-12) - Active NHIS
- GHA-777888999-0: Abena Adjoa Mensah (Sunyani, Female, 1995-02-28) - Active NHIS
- GHA-222333444-5: Yaw Kwesi Appiah (Ho, Male, 1988-06-05) - Active NHIS
- GHA-666777888-9: Akua Efua Osei (Koforidua, Female, 1993-10-14) - Active NHIS
- GHA-333444555-6: Kwame Agyeman Danquah (Bolgatanga, Male, 1982-12-20) - Active NHIS
- GHA-888999000-1: Adwoa Afia Frimpong (Wa, Female, 1991-04-09) - Active NHIS
- GHA-000111222-3: Nana Kwame Anane (Accra, Male, 1975-08-25) - **Expired NHIS**

**Each Patient Includes:**
- Valid Ghana Card (Luhn checksum compliant)
- 10-digit NHIS number
- Full name (given + middle + family, authentic Ghana names)
- Gender, date of birth, phone (+233 format)
- Address (city, district, state from all 10 Ghana regions)
- NHIS Coverage resource (active: 2025-01-01 to 2025-12-31, expired: 2024 dates)

### Integration with NHIEHttpClient

**Java Implementation:**
```java
// Get base URL from configuration
private String getBaseUrl() {
    String mode = Context.getAdministrationService()
        .getGlobalProperty("ghana.nhie.mode", "mock");
    
    switch (mode) {
        case "mock":
            return "http://nhie-mock:8080/fhir";  // Docker internal network
        case "sandbox":
            return "https://nhie-sandbox.moh.gov.gh/fhir";
        case "production":
            return "https://nhie.moh.gov.gh/fhir";
        default:
            throw new IllegalStateException("Invalid NHIE mode: " + mode);
    }
}

// Disable OAuth for mock
private boolean isOAuthEnabled() {
    return Boolean.parseBoolean(
        Context.getAdministrationService()
            .getGlobalProperty("ghana.nhie.oauth.enabled", "false")
    );
}
```

### Monitoring & Debugging

**View Logs:**
```powershell
docker logs -f medreg-nhie-mock        # HAPI FHIR logs
docker logs -f medreg-nhie-mock-db     # PostgreSQL logs
```

**Access Web UI:**
- Open browser: http://localhost:8090/
- Browse patients, search resources, view server metrics

**Check Health:**
```powershell
curl http://localhost:8090/fhir/metadata
# Should return CapabilityStatement with fhirVersion: "4.0.1"
```

**Reset Mock Data:**
```powershell
docker-compose stop nhie-mock nhie-mock-db
docker volume rm medreg_nhie_mock_data
docker-compose up -d nhie-mock nhie-mock-db
.\scripts\preload-demo-data.ps1
```

### Documentation

**Comprehensive Guide:**
- **Setup:** `docs/setup/nhie-mock-guide.md` (1000+ lines) - Complete Docker setup, Quick Reference, test scenarios, PowerShell scripts, demo data, troubleshooting
- **Scripts:** `scripts/setup-nhie-mock.ps1`, `scripts/test-nhie-mock.ps1`, `scripts/preload-demo-data.ps1`

### Demo Day Strategy

**Scenario 1: Real NHIE Sandbox Available (Best Case)**
- Configure `ghana.nhie.mode=sandbox`
- Change base URL to `https://nhie-sandbox.moh.gov.gh/fhir`
- Enable OAuth 2.0
- Test against real NHIE infrastructure

**Scenario 2: Mock Fallback (Backup Plan)**
- Mock returns realistic FHIR R4 responses (visually identical to real NHIE)
- Demo all integration scenarios (success, duplicates, errors, retries)
- Show comprehensive transaction logging (audit trail)
- Message: "Production-ready code, just need sandbox credentials to test live"

**Key Advantage:** Mock provides 100% reliability vs NHIE sandbox's 30% uptime

### Performance Benchmarks

| Operation | Mock Response Time | Real NHIE (Expected) |
|-----------|-------------------|---------------------|
| Create patient | 200-500ms (first), <100ms (subsequent) | 1-3 seconds |
| Search patient | 100-300ms | 500ms - 2s |
| Check eligibility | 100-300ms | 500ms - 2s |
| Server metadata | 50-100ms | 200-500ms |

**Concurrent Load:**
- 10 simultaneous patients: <2 seconds total
- 100 patients sequential: <30 seconds

### Known Limitations

1. **No OAuth 2.0:** Mock doesn't enforce authentication (add in NHIEHttpClient for sandbox)
2. **No Business Rules:** Mock doesn't validate Ghana-specific rules (e.g., NHIS payment status)
3. **No Rate Limiting:** Mock has no 429 errors (simulate in WireMock if needed)
4. **Cold Start:** First request takes 500ms (Hibernate warming up)

**Mitigation:** All limitations are acceptable for development. Real NHIE will have proper OAuth, business rules, and rate limiting.

### Switching to Real NHIE

**When MoH provides sandbox credentials:**
1. Update `openmrs-runtime.properties`: Set `ghana.nhie.mode=sandbox`
2. Add OAuth credentials: `ghana.nhie.oauth.clientId`, `ghana.nhie.oauth.clientSecret`
3. Enable OAuth: `ghana.nhie.oauth.enabled=true`
4. Restart OpenMRS: `docker-compose restart openmrs`

**Zero code changes needed.** All conditional logic already in place.

---

## Pull Request Guidelines

### PR Title Format
```
[Week X] Feature: Brief description

Examples:
[Week 1] Feature: Patient registration with Ghana Card validation
[Week 2] Fix: NHIE patient submission retry logic
[Week 3] Refactor: Extract Ghana Card validator to utility class
```

### PR Checklist
Before creating PR, ensure:
- [ ] All tests pass (`mvn test` for backend, `npm test` for frontend)
- [ ] No lint errors (`mvn checkstyle:check`, `npm run lint`)
- [ ] Code coverage >70% for new code
- [ ] No commented-out code
- [ ] No console.log statements (use proper logging)
- [ ] AGENTS.md updated if architecture/patterns changed
- [ ] README.md updated if setup commands changed
- [ ] Secrets not committed (check `.env.example` vs `.env.local`)

### PR Description Template
```markdown
## What does this PR do?
Brief description of changes

## Why is this needed?
Context/motivation (reference GitHub issue if applicable)

## How to test?
1. Step 1
2. Step 2
3. Expected result

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or migration plan documented)

## Screenshots (if UI changes)
[Attach screenshots]
```

### Code Review Expectations
- PRs reviewed within 24 hours (or flag as `urgent`)
- At least 1 approval required before merge
- AI agents can create PRs, but human must approve
- Reviewers check: functionality, security, performance, code style

---

## Environment Variables

### Backend (OpenMRS)
Create `openmrs-runtime.properties` in OpenMRS data directory:
```properties
# Database
connection.url=jdbc:mysql://localhost:3306/openmrs?autoReconnect=true&useUnicode=true&characterEncoding=UTF-8
connection.username=openmrs_user
connection.password=openmrs_password

# Facility Config
ghana.facility.code=KBTH
ghana.facility.region=GA

# NHIE Integration
ghana.nhie.baseUrl=https://nhie-sandbox.moh.gov.gh/fhir
ghana.nhie.oauth.tokenUrl=https://nhie-sandbox.moh.gov.gh/oauth/token
ghana.nhie.oauth.clientId=${NHIE_CLIENT_ID}
ghana.nhie.oauth.clientSecret=${NHIE_CLIENT_SECRET}
ghana.nhie.oauth.scopes=patient.write encounter.write coverage.read

# NHIE TLS (if required)
ghana.nhie.tls.enabled=false
ghana.nhie.tls.keystore.path=/path/to/nhie-keystore.jks
ghana.nhie.tls.keystore.password=${NHIE_KEYSTORE_PASSWORD}

# NHIE Retry Config
ghana.nhie.timeout.connectMs=10000
ghana.nhie.timeout.readMs=30000
ghana.nhie.retry.maxAttempts=8
ghana.nhie.retry.initialDelayMs=5000
ghana.nhie.retry.maxDelayMs=3600000
ghana.nhie.retry.multiplier=2.0
```

### Frontend (Next.js)
Create `.env.local` (DO NOT commit, add to `.gitignore`):
```bash
# OpenMRS API
NEXT_PUBLIC_OPENMRS_API_URL=http://localhost:8080/openmrs/ws/rest/v1

# Feature Flags
NEXT_PUBLIC_ENABLE_NHIE_SYNC=true
NEXT_PUBLIC_ENABLE_PHOTO_CAPTURE=false

# Sentry Error Tracking (production)
NEXT_PUBLIC_SENTRY_DSN=

# Analytics (production)
NEXT_PUBLIC_GA_TRACKING_ID=
```

Create `.env.example` (commit this as template):
```bash
NEXT_PUBLIC_OPENMRS_API_URL=http://localhost:8080/openmrs/ws/rest/v1
NEXT_PUBLIC_ENABLE_NHIE_SYNC=true
NEXT_PUBLIC_ENABLE_PHOTO_CAPTURE=false
```

---

## Deployment

### Development Environment
```bash
docker-compose up -d
# OpenMRS: http://localhost:8080/openmrs
# Frontend: http://localhost:3000
# MySQL: localhost:3306
```

### Staging Environment
```bash
# Backend (Ubuntu server)
cd /opt/ghana-emr
docker-compose -f docker-compose.staging.yml up -d

# Frontend (Vercel)
vercel deploy --prod
```

### Production Environment
**Backend:**
1. Provision Ubuntu 22.04 server (DigitalOcean, Linode, AWS EC2)
2. Install Docker + Docker Compose
3. Clone repo: `git clone https://github.com/your-org/ghana-emr-mvp.git /opt/ghana-emr`
4. Configure `.env` with production secrets
5. Run: `docker-compose -f docker-compose.prod.yml up -d`
6. Set up SSL: `certbot --nginx -d emr.yourdomain.com`
7. Configure Nginx reverse proxy
8. Set up daily backups (cron job to `mysqldump` + upload to S3)

**Frontend:**
1. Push to GitHub main branch
2. Vercel auto-deploys (or manual: `vercel --prod`)
3. Set environment variables in Vercel dashboard
4. Configure custom domain (if applicable)

### Database Migrations
**OpenMRS uses Liquibase for migrations:**
```xml
<!-- src/main/resources/liquibase.xml -->
<changeSet id="20251030-1" author="your-name">
    <comment>Add NHIE transaction log table</comment>
    <createTable tableName="nhie_transaction_log">
        <column name="id" type="BIGINT" autoIncrement="true">
            <constraints primaryKey="true"/>
        </column>
        <column name="transaction_id" type="VARCHAR(36)">
            <constraints nullable="false"/>
        </column>
        <!-- More columns... -->
    </createTable>
    <createIndex tableName="nhie_transaction_log" indexName="idx_transaction_status">
        <column name="status"/>
    </createIndex>
</changeSet>
```

**Running Migrations:**
- Development: Auto-run on OpenMRS startup
- Production: Review migration SQL first, then run manually with backup

---

## Performance Optimization

### Backend
1. **Database Indexing:**
   - Index Ghana Card, NHIS number, folder number (frequent lookups)
   - Index `nhie_transaction_log.status` (queue queries)
   - Composite index on `(patient_id, created_at)` for patient history
2. **Query Optimization:**
   - Use Hibernate/JPA criteria queries (not HQL strings)
   - Fetch only needed fields (`SELECT name, ghana_card` not `SELECT *`)
   - Paginate large result sets (max 50 records per page)
3. **Caching:**
   - Cache NHIS eligibility (24 hours)
   - Cache facility metadata (region codes, diagnosis list)
   - Use OpenMRS built-in cache (`Context.getService()` caches services)

### Frontend
1. **Code Splitting:**
   - Next.js automatically code-splits by route
   - Use `dynamic()` for heavy components: `const Chart = dynamic(() => import('./Chart'))`
2. **Image Optimization:**
   - Use Next.js `<Image>` component (auto-optimization)
   - Store patient photos in compressed format (JPEG 80% quality)
3. **API Calls:**
   - Use TanStack Query for caching (5-minute default, 24-hour for eligibility)
   - Debounce search inputs (300ms delay before API call)
   - Paginate patient lists (50 per page, infinite scroll)

---

## Monitoring & Observability

### Logging
**Backend:**
- Log level: INFO in production, DEBUG in development
- Log format: JSON (structured logging for easy parsing)
- Log aggregation: Ship logs to cloud (Logtail, Papertrail, CloudWatch)
- Retention: 90 days

**Frontend:**
- Console logs removed in production build (Vercel strips them)
- Errors sent to Sentry (production only)
- User analytics: Google Analytics or Plausible (privacy-friendly)

### Health Checks
**Backend:**
```java
@RestController
public class HealthController {
    
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", System.currentTimeMillis());
        health.put("database", checkDatabase());
        health.put("nhie", checkNHIE());
        return ResponseEntity.ok(health);
    }
}
```

**Monitoring:**
- Uptime monitoring: UptimeRobot (free, 5-minute checks)
- Server metrics: DigitalOcean built-in monitoring or Prometheus
- NHIE sync queue depth (alert if >100 pending transactions)

---

## Disaster Recovery

### Backup Strategy
1. **Database Backups:**
   - Frequency: Daily at 2 AM (low traffic time)
   - Retention: 30 daily, 12 monthly
   - Storage: Encrypted cloud storage (S3, Spaces)
   - Script: `mysqldump --single-transaction openmrs | gzip | aws s3 cp - s3://bucket/backups/$(date +%Y%m%d).sql.gz`

2. **Application Backups:**
   - Git commit history (code)
   - Docker images (versioned in Docker Hub)
   - Configuration files (encrypted, stored separately)

### Restore Procedure
```bash
# 1. Stop OpenMRS
docker-compose down

# 2. Download backup
aws s3 cp s3://bucket/backups/20251030.sql.gz /tmp/backup.sql.gz

# 3. Restore database
gunzip < /tmp/backup.sql.gz | mysql -u root -p openmrs

# 4. Restart OpenMRS
docker-compose up -d

# 5. Verify (check patient count, recent encounters)
```

**RTO (Recovery Time Objective):** 2 hours  
**RPO (Recovery Point Objective):** 24 hours (daily backups)

### Disaster Scenarios
| Scenario | Impact | Response |
|----------|--------|----------|
| Database corruption | High | Restore from last backup (24h data loss) |
| Server crash | High | Provision new server, restore from backup (2h downtime) |
| NHIE down | Medium | Queue transactions, auto-retry when NHIE back |
| Ransomware | Critical | Restore from offsite encrypted backup, rebuild server |

---

## Known Limitations & Workarounds

### OpenMRS Platform 2.4.0
- **Java 8 only:** Cannot upgrade to Java 11+ (breaking changes in OpenMRS core)
- **MySQL 5.7 required:** MySQL 8.0 NOT compatible
  - **Issue:** OpenMRS 2.4.0 uses MySQL Connector/J 5.1.x which doesn't support MySQL 8.0's removed `storage_engine` variable
  - **Solution:** Use `mysql:5.7` Docker image (already configured in docker-compose.yml)
  - **DO NOT** attempt to use MySQL 8.0 - database connection will fail
- **No built-in UI:** OpenMRS Platform 2.4.0 has no user interface by design (since v2.0)
  - **This is CORRECT and EXPECTED:** Platform = core only, Distribution = platform + modules + UI
  - **For Option B:** Perfect - we're using Next.js frontend, not OpenMRS UI
  - **Verification:** Platform page shows "Running! ...but no user interface module is installed"
  - **REST API works perfectly:** http://localhost:8080/openmrs/ws/rest/v1/session
- **openmrs-core vs reference-application-distro:**
  - `openmrs/openmrs-core:2.4.0` = Platform ONLY, no REST API module
  - `openmrs/openmrs-reference-application-distro:2.12.0` = Platform + REST API + 41 modules (correct choice)
  - **Always use reference-application-distro** for development
- **Platform 2.6.0 does NOT exist:** Latest stable Platform in 2.x line is 2.4.0 (Ref App 2.12.0)
  - Platform 2.6.0+ only exists in OpenMRS 3.x (completely different architecture)

### OpenMRS 2.x vs O3 (3.x) Decision

**Current Choice: OpenMRS 2.4.0 Platform + Next.js Frontend (Option B) [DONE]**

**Why NOT OpenMRS O3 for MVP:**
1. **Architecture Complexity:** O3 uses microfrontend architecture (Single-SPA) - steep learning curve
2. **Timeline Constraint:** 16-20 week MVP deadline too tight for O3 learning + customization
3. **Redundant Effort:** We're building custom Next.js frontend already - O3 is also a frontend framework
4. **MVP Focus:** Need backend integration (NHIE, Ghana domain) more than fancy UI framework
5. **Documentation Gap:** O3 docs focus on React microfrontends, not custom Next.js integration

**What is OpenMRS O3?**
- **O3 = OpenMRS 3.x frontend framework** (NOT a new platform version)
- **Architecture:** Decoupled frontend microservices + backend API
- **Stack:** React + TypeScript + Carbon Design System (IBM) + Single-SPA + Webpack
- **Key Feature:** Modern, mobile-responsive UI with better UX than Reference Application 2.x
- **Backend:** Uses SAME REST/FHIR API as 2.x (can run on top of OpenMRS 2.4.0 database)
- **Maturity:** Production-ready, actively developed, growing community

**Why O3 Makes Sense Post-MVP (v2 Consideration):**
1. **Backend Compatible:** O3 runs on our existing OpenMRS 2.4.0 backend (no migration!)
2. **Better UX:** Modern UI/UX vs building everything from scratch in Next.js
3. **Reusable Components:** Pre-built React components for patient dashboard, forms, etc.
4. **Multi-facility:** Microfrontend architecture scales better than monolithic Next.js
5. **Community Support:** Active O3 development, regular updates, Slack support

**Decision Matrix:**

| Factor | OpenMRS 2.x + Next.js (Current) | OpenMRS O3 |
|--------|----------------------------------|------------|
| MVP Timeline (16-20 weeks) | [DONE] Fast - familiar stack | [FAILED] Slow - learning curve |
| Custom Ghana UI/UX | [DONE] Full control | [WARNING] Must work within O3 patterns |
| Backend Integration | [DONE] Direct REST API access | [DONE] Same REST API |
| Developer Learning Curve | [DONE] Next.js (known) | [FAILED] Single-SPA + O3 patterns (new) |
| Maintenance Complexity | [WARNING] Custom codebase | [DONE] Community modules |
| Future Scalability | [WARNING] Monolithic frontend | [DONE] Microfrontends |
| Multi-facility Support | [FAILED] Harder to scale | [DONE] Designed for it |

**Recommendation:**
- [DONE] **MVP (Now):** Continue with OpenMRS 2.4.0 + Next.js frontend (Option B)
- 📝 **Post-MVP (v2):** Evaluate O3 migration after pilot success
- [ACTIVE] **Migration Path:** Backend stays the same, only frontend changes
- 📚 **Resources:** Bookmark [O3 Developer Docs](https://openmrs.atlassian.net/wiki/spaces/docs/pages/151093495) for future reference

**Key Insight:**
> O3 is a frontend framework, not a platform upgrade. We can switch to O3 later WITHOUT changing our OpenMRS 2.4.0 backend. This gives us flexibility to deliver MVP fast with Next.js, then adopt O3's modern UI/UX post-pilot if needed.

### NHIE Integration
- **Specs pending:** MoH hasn't finalized NHIE FHIR profiles yet
  - **Workaround:** Use Kenya HIE specs as proxy, refactor when Ghana specs available
- **Sandbox unstable:** NHIE sandbox has 30% uptime
  - **Workaround:** Mock NHIE responses in development, queue + retry in production
- **mTLS unclear:** Don't know if mTLS required until MoH confirms
  - **Workaround:** Implement mTLS support behind feature flag, disable by default

### Performance
- **OpenMRS slow start:** 3-5 minutes to start (large classpath, many modules loading)
  - **Workaround:** Keep OpenMRS running, don't restart frequently
  - **First start takes longest:** Liquibase migrations run on first start
- **Large database queries:** >100k patients slows down search
  - **Workaround:** Implement full-text search with Elasticsearch (v2 feature)

---

## Glossary

- **Ghana Card:** National ID card (like SSN in US)
- **NHIS:** National Health Insurance Scheme (government health insurance)
- **NHIA:** National Health Insurance Authority (manages NHIS)
- **NHIE:** National Health Information Exchange (middleware for data sharing)
- **MPI:** Master Patient Index (national patient registry)
- **SHR:** Shared Health Record (national encounter/clinical data repository)
- **OPD:** Outpatient Department (non-admitted patients)
- **IPD:** Inpatient Department (admitted patients)
- **ANC:** Antenatal Care (pregnancy care)
- **ICD-10:** International Classification of Diseases (diagnosis codes)
- **LOINC:** Logical Observation Identifiers Names and Codes (lab test codes)
- **FHIR:** Fast Healthcare Interoperability Resources (HL7 data standard)
- **OpenHIM:** Open Health Information Mediator (middleware platform)
- **MoH:** Ministry of Health
- **EOI:** Expression of Interest (government procurement process)

---

## Support & Escalation

### When to Escalate to Human
AI agents should escalate (create GitHub issue with `needs-decision` label) when:
1. **Ambiguous requirements:** Multiple valid approaches, need product decision
2. **Architecture changes:** Impacts multiple modules, need system-wide review
3. **Security concerns:** Potential vulnerability, need security expert review
4. **NHIE integration blocked:** Can't proceed without MoH specs or sandbox access
5. **Performance issues:** System slow, need profiling and optimization strategy
6. **Clinical workflow questions:** Need clinician input (e.g., "Is this how nurses really triage?")

### Resources

**📚 Comprehensive External Resources:**
- **docs/EXTERNAL_RESOURCES.md** - Centralized index of ALL external links and documentation
  - OpenMRS Documentation (Wiki, REST API, FHIR, O3, Docker)
  - FHIR & HL7 Resources (R4 specs, HAPI FHIR, ICD-10, LOINC)
  - Ghana Health System (NHIA, GHS, MoH, Ghana Card, 16 regions)
  - African Regional Context (Uganda EMR, Kenya HIE, Rwanda)
  - Development Tools & Libraries (Next.js, React, shadcn/ui, Spring, MySQL)
  - Community & Support (OpenMRS Talk, Slack)
  - Quick Bookmarks (12 daily-use links + local endpoints)

**🌍 African Regional Context (Detailed Code Patterns):**
- **docs/UGANDA_EMR_REFERENCE.md** - Uganda EMR code adaptation strategies (1000+ lines)
  - NHIE integration patterns (queue + retry + FHIR sync)
  - Patient identifier generation (UIC -> Ghana folder number)
  - Queue management (triage -> consultation -> pharmacy)
  - Government reporting (MoH OPD register, NHIS vs Cash)
  - Metadata deployment patterns
  - OpenMRS best practices from African implementation

**Key Uganda EMR Repositories:**
- **GitHub Organization:** https://github.com/METS-Programme
- **openmrs-module-ugandaemr-sync** ⭐ CRITICAL for NHIE integration
- **openmrs-module-ugandaemr** - Core module architecture
- **openmrs-module-ugandaemr-reports** - Government reporting
- **esm-ugandaemr-core** - OpenMRS 3.x implementation
- **License:** Mozilla Public License 2.0 (can fork/adapt with attribution)

**Quick Links (Most Used):**
- **OpenMRS REST API:** https://rest.openmrs.org/
- **FHIR R4 Spec:** http://hl7.org/fhir/R4/
- **OpenMRS Wiki:** https://wiki.openmrs.org/
- **shadcn/ui Docs:** https://ui.shadcn.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **HAPI FHIR Docs:** https://hapifhir.io/hapi-fhir/docs/

**Ghana MoH Contact:**
- **Ghana MoH Digital Health:** info@moh.gov.gh

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-30 | Initial AGENTS.md creation |
| 1.1 | 2025-11-01 | **Critical architecture updates**: MySQL 5.7 requirement (not 8.0), REST API verification process, OpenMRS Platform "no UI" clarification, reference-application-distro vs openmrs-core guidance, OpenMRS 2.x vs O3 decision matrix |
| 1.2 | 2025-11-01 | **External references added**: Uganda EMR (METS-Programme) repositories evaluated and documented - critical NHIE sync patterns, queue management, identifier generation, reports, O3 implementation, metadata deployment. See docs/UGANDA_EMR_REFERENCE.md for detailed code adaptation strategies. |
| 1.3 | 2025-11-02 | **Documentation consolidation**: Created EXTERNAL_RESOURCES.md (centralized index of all external links), renamed REFERENCES.md to UGANDA_EMR_REFERENCE.md (clearer purpose), updated Resources section to reference both comprehensive docs. All external OpenMRS/FHIR/Ghana/Tools links now in single source of truth. |
| 1.4 | 2025-11-03 | **🚨 CRITICAL REQUIREMENTS SECTION ADDED**: Added prominent "NON-NEGOTIABLE TECHNOLOGY CONSTRAINTS" warning at top of AGENTS.md with Java 8, MySQL 5.7, OpenMRS 2.4.0, Mockito 3.12.4 version locks. Created comprehensive README.md with version verification checklist. Updated IMPLEMENTATION_TRACKER.md with critical requirements table. Prevents accidental upgrades that would break 16-20 week MVP timeline. |
| 1.5 | 2025-11-05 | **✅ PLATFORM VERSION CORRECTION**: Updated all references from Platform 2.6.0 → 2.4.0 after discovering 2.6.0 does NOT exist in OpenMRS 2.x. Module successfully loads on Platform 2.4.0 (Reference Application 2.12.0). See [OPENMRS_MODULE_FIX_IMPLEMENTATION.md](OPENMRS_MODULE_FIX_IMPLEMENTATION.md) and [OPENMRS_MODULE_LOADING_BLOCKER.md](OPENMRS_MODULE_LOADING_BLOCKER.md) for complete resolution details. |

---

## NHIE Transaction Logging (Implementation Note — Nov 2, 2025)

- Always log NHIE API activity via `NHIETransactionLogger`; do not write JDBC in services.
- Default implementation `DefaultNHIETransactionLogger` writes to `ghanaemr_nhie_transaction_log` and populates `creator` (authenticated user id or 1).
- Always mask PII before logging. `NHIEIntegrationServiceImpl` applies `maskPII(String)` and `maskIdentifier(String)` to request/response bodies.
- Files:
  - Logger API: `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/NHIETransactionLogger.java`
  - Default Logger: `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/DefaultNHIETransactionLogger.java`
  - Service usage: `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/impl/NHIEIntegrationServiceImpl.java`
- Schema reference: `backend/openmrs-module-ghanaemr/api/src/main/resources/liquibase.xml` (table: `ghanaemr_nhie_transaction_log`)
- Tests (run `mvn -q -pl backend/openmrs-module-ghanaemr -am clean test`):
  - `NHIEIntegrationServiceTest.java` — success, duplicate, errors, PII masking
  - `NHIEIntegrationServiceLoggingTest.java` — verifies PENDING->SUCCESS/FAILED logs with masked payloads
  - `NHIEIntegrationServiceEdgeCasesTest.java` — edge cases and identifier masking

---

Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.3 | 2025-11-02 | Added NHIE transaction logger abstraction + tests; updated schema alignment and test guidance |

**Remember:** This file is living documentation. Update it whenever you make architecture decisions, discover new patterns, or encounter edge cases. All AI coding agents will automatically reference the latest version.
\n### Module Endpoints (Reports)\n- `GET /ws/rest/v1/ghana/reports/opd-register?date={YYYY-MM-DD}&encounterTypeUuid={uuid}`\n- `GET /ws/rest/v1/ghana/reports/nhis-vs-cash?date={YYYY-MM-DD}`\n- `GET /ws/rest/v1/ghana/reports/top-diagnoses?from={YYYY-MM-DD}&to={YYYY-MM-DD}&limit=10`\n\n\n### User Management (Seeded Roles)\n- Platform Admin\n- Facility Admin\n- Doctor\n- Nurse\n- Pharmacist\n- Records Officer\n- Cashier\n- NHIS Officer\n\n


