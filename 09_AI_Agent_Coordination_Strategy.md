# AI Agent Coordination Strategy for Ghana EMR MVP

## Executive Summary

You're building with **AI coding agents as your development team** instead of traditional human developers. This document explains how to orchestrate 17 specialized agents (from `07_AI_Agent_Architecture.md`) to build the Ghana EMR MVP in 16-20 weeks.

**Key Insight**: AI agents can automate 70-80% of development work, but you still need human oversight for architecture decisions, clinical validation, and production deployment.

**Your Role**: Technical Lead + Project Orchestrator (you're the conductor, agents are the orchestra)

---

## Multi-Agent Architecture Overview

### Agent Organization (from 07_AI_Agent_Architecture.md)

**Tier 1: Code Generation Agents (5 agents)**
1. OpenMRS Backend Agent -> Patient registration, encounters, obs, orders
2. FHIR Converter Agent -> OpenMRS ↔ FHIR transformations
3. NHIE Integration Agent -> OAuth, mTLS, retry logic, queue management
4. Frontend Agent -> Next.js UI, forms, dashboards (Option B) or HTML Form Entry (Option A)
5. Database Agent -> MySQL schema, migrations, queries, indexes

**Tier 2: Domain Expert Agents (3 agents)**
6. Ghana Health Domain Agent -> NHIS rules, Ghana Card validation, folder numbers
7. NHIS Business Rules Agent -> Eligibility logic, claims validation, tariff codes
8. Clinical Workflow Agent -> OPD workflows, triage, consultation, pharmacy

**Tier 3: Integration Agents (2 agents)**
9. API Integration Agent -> OpenMRS REST API wrappers, error handling
10. Security Agent -> OAuth 2.0, role-based access, audit logs

**Tier 4: Quality Agents (3 agents)**
11. Testing Agent -> Unit tests, integration tests, test data generation
12. Code Review Agent -> Code quality, security vulnerabilities, best practices
13. Performance Agent -> Query optimization, caching, load testing

**Tier 5: Documentation Agents (2 agents)**
14. Technical Documentation Agent -> API docs, deployment guides, runbooks
15. User Documentation Agent -> User manuals, training materials, job aids

**Tier 6: Orchestration Agents (2 agents)**
16. **Project Coordinator Agent** -> Task decomposition, dependency management, progress tracking (THIS IS YOUR CENTRAL ORCHESTRATOR)
17. Deployment Agent -> CI/CD, Docker, database migrations, monitoring

---

## Agent Coordination Model

### Pattern 1: Human-in-the-Loop Orchestration (Recommended for MVP)

**You (Human Technical Lead)** ↔ **Project Coordinator Agent** ↔ **17 Specialized Agents**

```
┌─────────────────────────────────────────────────────────────┐
│  YOU (Human Technical Lead)                                  │
│  * High-level decisions (architecture, scope, priorities)   │
│  * Clinical validation with domain experts                   │
│  * MoH/pilot facility relationships                          │
│  * Final production deployment approval                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  PROJECT COORDINATOR AGENT (Your AI PM)                      │
│  * Task decomposition (break Week 1-4 goals into subtasks)  │
│  * Dependency management (Patient Registration -> NHIE Sync) │
│  * Agent assignment (route tasks to specialized agents)      │
│  * Progress tracking (what's done, what's blocked)           │
│  * Integration orchestration (combine agent outputs)         │
│  * Conflict resolution (when agents produce incompatible code)│
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┴────────┬────────────┬───────────┐
         ▼                  ▼            ▼           ▼
    ┌─────────┐      ┌──────────┐  ┌─────────┐  ┌──────┐
    │Backend  │      │Frontend  │  │Testing  │  │ ...  │
    │Agent    │      │Agent     │  │Agent    │  │(17)  │
    └─────────┘      └──────────┘  └─────────┘  └──────┘
```

**Why This Works**:
- You provide strategic direction, agents execute tactical work
- Project Coordinator Agent handles day-to-day orchestration (frees your time)
- Specialized agents focus on their domains (no context switching)
- Human validates critical decisions (clinical workflows, security, NHIE specs)

---

## Practical Implementation: Week 1 with AI Agents

### Day 1-2: Environment Setup

**Your Task** (Human):
1. Create GitHub repository
2. Set up development environment (local or cloud)
3. Install OpenMRS 2.4.0 + MySQL 5.7 (or use Docker)
4. Set up AI agent access (GitHub Copilot, Cursor, Claude/ChatGPT API keys)

**Agent Tasks** (via Project Coordinator Agent):

**Prompt to Project Coordinator Agent**:
```
Context: Ghana EMR MVP, Week 1 Day 1-2, environment setup phase
Reference: 08_MVP_Build_Strategy.md Phase 1 Week 1

Task: Set up OpenMRS 2.4.0 development environment
Subtasks:
1. Database schema initialization
2. OpenMRS configuration (global properties)
3. GitHub repository structure
4. Docker Compose for local development
5. CI/CD pipeline (GitHub Actions)

Assign specialized agents and coordinate their work.
```

**Project Coordinator Agent** decomposes and assigns:

1. **Database Agent** -> Create MySQL schema, user privileges, connection config
   - Prompt: "Create MySQL 5.7 database setup script for OpenMRS 2.4.0 with user `openmrs_user`, database `openmrs`, grant privileges, production-ready collation (utf8mb4)"

2. **Deployment Agent** -> Create Docker Compose with MySQL + OpenMRS + (Next.js if Option B)
   - Prompt: "Create Docker Compose file: MySQL 5.7, OpenMRS 2.4.0 Tomcat container, persistent volumes for database and OpenMRS data, environment variables for DB connection"

3. **Deployment Agent** -> Set up GitHub Actions for automated testing
   - Prompt: "Create GitHub Actions workflow: run on push to main, build OpenMRS module, run unit tests, report coverage"

4. **Technical Documentation Agent** -> Create README.md with setup instructions
   - Prompt: "Create README.md: prerequisites (Docker, JDK 8, Maven), clone repo, run `docker-compose up`, access OpenMRS at localhost:8080, default credentials"

**Your Role**: Review Docker Compose file, verify OpenMRS starts successfully, approve README

**Outcome**: Day 1-2 complete, development environment running

---

### Day 3-4: Patient Registration Module (Backend)

**Prompt to Project Coordinator Agent**:
```
Context: Ghana EMR MVP, Week 1 Day 3-4, patient registration backend
Reference: 08_MVP_Build_Strategy.md Phase 1 Week 2-3, 03_Ghana_Health_Domain_Knowledge.md

Task: Build patient registration backend (OpenMRS module)
Requirements:
- Ghana Card validation (GHA-XXXXXXXXX-X format, with checksum)
- NHIS number (optional at registration)
- Folder number auto-generation ([REGION]-[FACILITY]-[YEAR]-[SEQUENCE])
- Demographics: Name, DOB, Gender, Phone, Address (region/district/town)
- Photo capture (optional toggle)
- Patient search by Ghana Card, NHIS, Folder number, Name

Assign specialized agents.
```

**Project Coordinator Agent** assigns:

1. **Ghana Health Domain Agent** -> Generate Ghana Card validation logic
   - Prompt: "Generate Java method `validateGhanaCard(String ghanaCardNumber)` with format validation (GHA-XXXXXXXXX-X), checksum algorithm per Ghana Card spec, throw ValidationException with clear error messages"

2. **Database Agent** -> Create patient attributes table for Ghana-specific fields
   - Prompt: "Create Liquibase changeset: patient_attribute_type for Ghana Card (format text, required), NHIS number (text, optional), Folder number (text, unique), searchable flag true"

3. **OpenMRS Backend Agent** -> Create PatientRegistrationService with Ghana logic
   - Prompt: "Create Spring service `GhanaPatientRegistrationService`: method `registerPatient(GhanaPatientDTO dto)` that creates OpenMRS Patient, sets Ghana Card attribute, generates folder number, validates NHIS format if provided, returns PatientId"

4. **OpenMRS Backend Agent** -> Create REST endpoint for registration
   - Prompt: "Create Spring REST controller `/api/ghana/patients`: POST endpoint accepts GhanaPatientDTO (name, dob, gender, ghanaCard, nhisNumber, phone, address), calls GhanaPatientRegistrationService, returns 201 with patient resource URL, handles ValidationException -> 400 with error details"

5. **Testing Agent** -> Generate unit tests for validation logic
   - Prompt: "Create JUnit tests for `validateGhanaCard()`: valid Ghana Card passes, invalid format fails, invalid checksum fails, null input fails, test with 10 real Ghana Card numbers (anonymized)"

6. **Code Review Agent** -> Review generated code for security and best practices
   - Prompt: "Review GhanaPatientRegistrationService: check for SQL injection (use prepared statements), validate all user inputs, ensure Ghana Card stored encrypted at rest, check error messages don't leak sensitive data"

**Your Role**: 
- Review Ghana Card validation logic (is checksum algorithm correct?)
- Test with sample Ghana Card numbers
- Approve REST API contract (will frontend be able to use this?)

**Outcome**: Day 3-4 complete, patient registration backend working

---

### Day 5: Patient Registration Frontend (Option B: Next.js)

**Prompt to Project Coordinator Agent**:
```
Context: Ghana EMR MVP, Week 1 Day 5, patient registration frontend
Reference: 08_MVP_Build_Strategy.md Option B frontend stack

Task: Build patient registration form (Next.js + shadcn/ui)
Requirements:
- shadcn/ui Form components (Input, Select, DatePicker, Button)
- React Hook Form + Zod validation (Ghana Card format, NHIS format)
- TanStack Query for POST to /api/ghana/patients
- Error handling (display validation errors from backend)
- Success redirect to patient dashboard

Assign specialized agents.
```

**Project Coordinator Agent** assigns:

1. **Frontend Agent** -> Create Zod schema for patient registration form
   - Prompt: "Create Zod schema `patientRegistrationSchema`: ghanaCard (string, regex GHA-\\d{9}-\\d), nhisNumber (string, optional, regex \\d{10}), name (string, min 2 chars), dob (date, max today, min 1900), gender (enum Male/Female/Other), phone (string, Ghana format), address object (region, district, town)"

2. **Frontend Agent** -> Create patient registration form component
   - Prompt: "Create Next.js page `app/patients/register/page.tsx`: use shadcn/ui Form + Input + Select + DatePicker + Button, React Hook Form with patientRegistrationSchema, onSubmit calls registerPatient mutation (TanStack Query), displays loading spinner, shows error toast on failure, redirects to /patients/[id] on success"

3. **Frontend Agent** -> Create TanStack Query mutation for patient registration
   - Prompt: "Create `useMutation` hook `useRegisterPatient()`: POST to `/api/ghana/patients` with Axios, headers Content-Type application/json, Authorization Bearer token, on success invalidates patients query cache, on error extracts error message from response"

4. **Testing Agent** -> Create frontend tests for registration form
   - Prompt: "Create Vitest + React Testing Library tests for patient registration form: renders all fields, validates Ghana Card format on blur, shows error message for invalid NHIS number, disables submit button while loading, calls registerPatient on valid submit"

**Your Role**:
- Review form UX (is it intuitive for clinic staff?)
- Test with real clinic workflow (can they register patient in <2 minutes?)
- Approve UI design (matches Ghana health facility expectations?)

**Outcome**: Day 5 complete, patient registration frontend working

---

## Agent Communication Protocols

### Task Queue System (Recommended Tool: GitHub Issues + Labels)

**How It Works**:
1. You create high-level GitHub Issue: "Week 1: Patient Registration Module"
2. Project Coordinator Agent decomposes into subtasks, creates child issues:
   - Issue #1: Ghana Card validation logic (assigned: Ghana Health Domain Agent)
   - Issue #2: Patient attributes database schema (assigned: Database Agent)
   - Issue #3: Patient registration service (assigned: OpenMRS Backend Agent)
   - Issue #4: Patient registration REST API (assigned: OpenMRS Backend Agent)
   - Issue #5: Patient registration form (assigned: Frontend Agent)
3. Each specialized agent picks up assigned issue, generates code, creates Pull Request
4. Code Review Agent reviews PR, comments with issues
5. Specialized agent fixes issues, updates PR
6. You (human) do final review and merge
7. Project Coordinator Agent marks issue complete, moves to next task

**Labels for Organization**:
- `week-1`, `week-2`, etc. (timeline tracking)
- `backend`, `frontend`, `database`, `nhie-integration` (domain)
- `agent-assigned`, `agent-in-progress`, `agent-review`, `human-review`, `done`
- `blocked`, `needs-context`, `needs-decision` (flags for human intervention)

### Shared Context System (AGENTS.md - Industry Standard)

**Purpose**: Single source of truth that ALL AI coding agents automatically read

**Why AGENTS.md**:
- **Industry standard** used by 20,000+ open-source projects (OpenAI, Apache Airflow, Temporal)
- **Auto-recognized** by Cursor, GitHub Copilot, Aider, Zed, VS Code, RooCode, Jules, and 10+ other AI tools
- **One file to maintain** vs multiple scattered context docs
- **Nested support** for monorepos (root AGENTS.md + module-specific ones)
- **Predictable location** that agents check first before generating code

**Structure** (create Day 1):

```
c:\temp\AI\MedReg\
├── AGENTS.md           ← Root level (project-wide rules, Ghana domain, NHIE)
├── backend/
│   └── AGENTS.md       ← Backend-specific (OpenMRS patterns, Java conventions)
├── frontend/
│   └── AGENTS.md       ← Frontend-specific (Next.js patterns, shadcn/ui usage)
└── docs/
```

**Root AGENTS.md** contains:
1. **Project Overview** - Tech stack, timeline, MVP scope
2. **Critical Architecture Rules** - NHIE middleware (NO direct backend connections)
3. **Ghana Domain Rules** - Ghana Card validation, NHIS format, folder numbers, ICD-10 codes
4. **Setup Commands** - Docker, database, dev servers
5. **Code Style Guidelines** - Java/TypeScript conventions, OpenMRS patterns
6. **Testing Instructions** - How to run tests, coverage requirements
7. **NHIE Integration Spec** - OAuth, FHIR profiles, retry logic, error handling
8. **Security Rules** - PII handling, logging restrictions, encryption
9. **Pull Request Guidelines** - Commit format, testing requirements

**Usage**: 
- **Automatic**: Cursor, Copilot, Aider auto-load AGENTS.md when generating code
- **Explicit**: Reference in prompts: "Follow AGENTS.md guidelines for Ghana Card validation"
- **Nested**: Backend agents read `/backend/AGENTS.md` first, then fall back to root
- **Updates**: Update AGENTS.md when architecture decisions made -> all agents instantly see changes

**Configuration**:
- **Cursor**: Works automatically (no config needed)
- **Aider**: Add `read: AGENTS.md` to `.aider.conf.yml`
- **GitHub Copilot**: Works automatically in VS Code
- **Gemini CLI**: Add `{ "contextFileName": "AGENTS.md" }` to `.gemini/settings.json`

---

## Agent Error Handling and Conflict Resolution

### Scenario 1: Agent Produces Invalid Code

**Example**: Frontend Agent generates form with wrong Ghana Card regex

**Detection**: Code Review Agent catches in PR review, comments "Ghana Card regex incorrect, should be `GHA-\\d{9}-\\d` per `/docs/context/ghana-domain-rules.md`"

**Resolution**:
1. Project Coordinator Agent sees Code Review Agent's comment
2. Reassigns to Frontend Agent with context: "Fix Ghana Card regex per code review comment, reference `/docs/context/ghana-domain-rules.md` line 15"
3. Frontend Agent updates PR
4. Code Review Agent approves
5. You merge

**Prevention**: Keep AGENTS.md updated, agents auto-load it before generating code

---

### Scenario 2: Two Agents Produce Conflicting Code

**Example**: 
- FHIR Converter Agent generates `Patient.identifier[0].system = "http://moh.gov.gh/ghana-card"`
- NHIE Integration Agent expects `Patient.identifier[0].system = "http://ghana.gov/fhir/identifier/ghana-card"`

**Detection**: Integration tests fail (Testing Agent reports "NHIE patient submission failed: invalid identifier system")

**Resolution**:
1. Project Coordinator Agent analyzes error, identifies conflict
2. Checks AGENTS.md NHIE Integration section for correct identifier system
3. If spec unclear, **escalates to you** (human) to decide
4. You clarify: "Use `http://moh.gov.gh/fhir/identifier/ghana-card`"
5. You update AGENTS.md NHIE Integration section with canonical identifier system
6. Reassigns NHIE Integration Agent to fix code (agent auto-loads updated AGENTS.md)
7. Both agents now reference updated AGENTS.md (single source of truth)

**Key Insight**: Agent conflicts usually mean AGENTS.md needs clarification (fix the source, not the symptom)

---

### Scenario 3: Agent Gets Stuck (Can't Complete Task)

**Example**: NHIE Integration Agent can't complete OAuth 2.0 implementation because MoH hasn't provided token endpoint URL

**Detection**: Agent reports in PR: "Cannot complete: NHIE token URL not in `/docs/context/nhie-integration-spec.md`"

**Resolution**:
1. Project Coordinator Agent flags issue as `blocked`, `needs-decision`
2. **Escalates to you** (human)
3. You have 3 options:
   - **Option A**: Contact MoH, get real token URL, update AGENTS.md
   - **Option B**: Use Kenya HIE token URL as placeholder, document assumption
   - **Option C**: Defer NHIE integration, focus on other features, revisit Week 4
4. You decide (let's say Option B)
5. You update AGENTS.md NHIE Integration section: `NHIE_TOKEN_URL: https://kenya-hie.example.com/oauth/token # TODO: Replace with Ghana NHIE URL when MoH provides specs`
6. Project Coordinator Agent unblocks NHIE Integration Agent
7. Agent completes task with placeholder (reads updated AGENTS.md automatically)

**Key Insight**: Agents can't make strategic decisions (you must provide context or make the call)

---

## Human Oversight Requirements (You Can't Delegate These)

### 1. Architecture Decisions (10-15 hours/week)
- **What**: Technology choices, system design, data models, integration patterns
- **Why Agents Can't Do This**: Requires understanding of long-term implications, trade-offs, Ghana context
- **Examples**:
  - "Should we cache NHIS eligibility for 24 hours or query real-time?"
  - "How do we handle Ghana Card duplicates (same person, multiple cards)?"
  - "Do we need offline mode or online-only for MVP?"

### 2. Clinical Workflow Validation (5-10 hours/week)
- **What**: Verify workflows match real clinic operations
- **Why Agents Can't Do This**: Requires domain expertise, talking to doctors/nurses
- **Examples**:
  - Review consultation form with pilot facility doctor (is this how they work?)
  - Validate triage flow (do nurses really record all these vitals?)
  - Test pharmacy dispensing with actual pharmacist

### 3. Government Relations (5-10 hours/week)
- **What**: MoH communication, NHIE spec clarification, pilot facility coordination
- **Why Agents Can't Do This**: Requires human relationships, negotiation, political awareness
- **Examples**:
  - Email MoH Digital Health Unit for NHIE sandbox access
  - Call pilot facility Medical Director to schedule demo
  - Negotiate EOI submission terms with MoH procurement team

### 4. Production Deployment Approval (2-5 hours/week)
- **What**: Final review before deploying to pilot facility
- **Why Agents Can't Do This**: Requires risk assessment, accountability
- **Examples**:
  - Review deployment checklist (backups configured? SSL working? monitoring set up?)
  - Approve database migration (will this break existing data?)
  - Sign off on go-live (is the system ready for real patients?)

**Total Human Time**: 22-40 hours/week (you're Technical Lead + Project Manager, not just observer)

**Time Savings**: Agents handle 70-80% of coding (400-500 hours over 16 weeks), you focus on strategic work

---

## Day 1 Workflow Example (Your First Day with AI Agents)

### Morning: Setup (2-3 hours)

**9:00 AM - Your Tasks**:
1. Create GitHub repo: `ghana-emr-mvp`
2. **Create AGENTS.md file at root** (see template below)
3. Install AI tools (GitHub Copilot, Cursor, or API access to Claude/ChatGPT)
4. Configure tools to use AGENTS.md (Cursor auto-detects, Aider needs `.aider.conf.yml`)
5. Set up local OpenMRS 2.4.0 + MySQL (or Docker)

**10:00 AM - First Agent Prompt** (to Project Coordinator Agent):
```
You are the Project Coordinator Agent for Ghana EMR MVP.

Context:
- Project: Ghana NHIE-compliant EMR, 16-week MVP timeline
- Reference: 08_MVP_Build_Strategy.md (Phase 1 Week 1)
- Tech Stack: OpenMRS 2.4.0, MySQL 5.7, Next.js 14 (Option B)
- Team: 17 specialized AI agents (see 07_AI_Agent_Architecture.md)

Task: Week 1 Day 1 environment setup
Break down into subtasks, assign to specialized agents, create GitHub issues with labels.

Deliverables:
1. Docker Compose file (MySQL + OpenMRS + Next.js)
2. GitHub Actions CI/CD pipeline
3. README.md with setup instructions
4. Project structure (backend, frontend, docs folders)

Start coordination.
```

**Project Coordinator Agent Response**:
```
Subtasks created:

Issue #1: MySQL database setup script
- Assigned: Database Agent
- Label: week-1, backend, agent-assigned
- Due: Day 1 EOD

Issue #2: Docker Compose configuration
- Assigned: Deployment Agent
- Label: week-1, devops, agent-assigned
- Due: Day 1 EOD

Issue #3: GitHub Actions workflow
- Assigned: Deployment Agent
- Label: week-1, devops, agent-assigned
- Due: Day 1 EOD

Issue #4: README.md documentation
- Assigned: Technical Documentation Agent
- Label: week-1, documentation, agent-assigned
- Due: Day 1 EOD

Issue #5: Project folder structure
- Assigned: Database Agent
- Label: week-1, backend, agent-assigned
- Due: Day 1 EOD

Agents are working. Check back in 30 minutes.
```

---

### Afternoon: Review Agent Work (2 hours)

**2:00 PM - Check Agent Progress**:

**Your Prompt** (to Project Coordinator Agent):
```
Status update: What's complete? What's blocked?
```

**Project Coordinator Agent Response**:
```
Status:
[DONE] Issue #1 (Database Agent): Complete, PR #1 created
[DONE] Issue #2 (Deployment Agent): Complete, PR #2 created
[DONE] Issue #3 (Deployment Agent): Complete, PR #3 created
[DONE] Issue #4 (Technical Documentation Agent): Complete, PR #4 created
[PENDING] Issue #5 (Database Agent): In progress (60% done)

Action: Review PRs #1-4, provide feedback.
```

**Your Tasks**:
1. Review PR #1 (Database setup script)
   - Check: Does it create `openmrs_user` with correct privileges?
   - Check: Is database collation utf8mb4? (required for Ghana characters)
   - Approve and merge if good, comment with changes if not

2. Review PR #2 (Docker Compose)
   - Check: Are persistent volumes configured? (data survives container restart)
   - Check: Are environment variables externalized? (no hardcoded passwords)
   - Test: Run `docker-compose up`, does OpenMRS start?
   - Approve and merge

3. Review PR #3 (GitHub Actions)
   - Check: Does it run tests on every push?
   - Check: Does it fail fast if tests fail?
   - Approve and merge

4. Review PR #4 (README.md)
   - Check: Are setup instructions clear? (could a new developer follow them?)
   - Test: Follow instructions yourself, does it work?
   - Approve and merge

**3:00 PM - Provide Feedback** (example):

**Your Comment on PR #1**:
```
Good work, but 2 changes needed:
1. Change database collation from utf8mb3 to utf8mb4_unicode_ci (Ghana has characters outside BMP)
2. Add connection pool settings (max connections = 50 for production)

Database Agent: Please update and push new commit.
```

**Database Agent** (via Project Coordinator):
- Reads your comment
- Updates SQL script
- Pushes new commit
- Comments: "Changes made, please review"

**You**: Review again, approve, merge

---

### Evening: Start Week 1 Planning (1 hour)

**4:00 PM - Plan Week 1 Detailed Tasks**:

**Your Prompt** (to Project Coordinator Agent):
```
Environment setup complete. Now plan Week 1 Day 2-5 tasks.

Reference: AGENTS.md project overview, 08_MVP_Build_Strategy.md Phase 1 Week 1-2

Task: Patient Registration module
Follow all rules in AGENTS.md (Ghana Card validation, NHIE middleware architecture, etc.)

Break down patient registration into daily subtasks, assign agents, create issues.
```

**Project Coordinator Agent**:
```
Week 1 Day 2-3: Patient Registration Backend
Issue #6: Ghana Card validation logic (Ghana Health Domain Agent)
Issue #7: Patient attributes schema (Database Agent)
Issue #8: Patient registration service (OpenMRS Backend Agent)
Issue #9: Patient registration REST API (OpenMRS Backend Agent)
Issue #10: Unit tests (Testing Agent)

Week 1 Day 4: Patient Search
Issue #11: Patient search service (OpenMRS Backend Agent)
Issue #12: Patient search REST API (OpenMRS Backend Agent)
Issue #13: Search performance optimization (Performance Agent)

Week 1 Day 5: Patient Registration Frontend
Issue #14: Zod schema for registration form (Frontend Agent)
Issue #15: Registration form component (Frontend Agent)
Issue #16: TanStack Query mutation (Frontend Agent)
Issue #17: Frontend tests (Testing Agent)

All issues created with dependencies mapped. Agents will start Day 2 tasks tomorrow.
```

**5:00 PM - Day 1 Complete**:
- [DONE] AGENTS.md created (single source of truth for all agents)
- [DONE] Environment setup done (Docker, CI/CD, README)
- [DONE] Week 1 tasks planned and assigned
- [DONE] Agents ready to work Day 2 (will auto-load AGENTS.md)

**Your Day 1 Time**: ~5 hours (setup 2h, reviews 2h, planning 1h)
**Agent Time**: ~20 hours of work completed (4 agents × 5 hours each, parallelized to fit in 1 day)

**Productivity Multiplier**: 4× (you directed 5 hours, agents delivered 20 hours of output)

---

## Tools and Platforms for Agent Coordination

### Option 1: GitHub + AI Coding Assistants (Recommended for MVP)

**Stack**:
- **GitHub Issues**: Task queue, agent assignments, progress tracking
- **GitHub Projects**: Kanban board (To Do, In Progress, In Review, Done)
- **GitHub Copilot**: Code generation within VS Code (agents are Copilot prompts)
- **Cursor**: AI-first code editor with multi-file editing
- **Claude/ChatGPT**: Project Coordinator Agent (API or chat interface)

**Workflow**:
1. You create parent issue in GitHub: "Week 1: Patient Registration"
2. Prompt Claude/ChatGPT (Project Coordinator): "Decompose this into subtasks, assign to agents"
3. Project Coordinator creates child issues with agent assignments
4. You open VS Code, use GitHub Copilot to generate code for each issue (Copilot = specialized agent)
5. Create PR, use Claude to review code (Code Review Agent)
6. Merge, move issue to Done

**Cost**: 
- GitHub Copilot: $10/month
- Cursor: $20/month
- Claude API: ~$50-100/month (for Project Coordinator)
- **Total**: ~$80-130/month

---

### Option 2: Multi-Agent Frameworks (Advanced, for Future)

**Frameworks**:
- **LangGraph** (LangChain): Build agent workflows with state management
- **CrewAI**: Multi-agent system with role-based agents
- **AutoGPT**: Autonomous agent with planning and execution
- **Semantic Kernel** (Microsoft): Orchestrate AI agents with skills

**When to Use**: 
- After MVP (v2+)
- When you want fully autonomous agents (less human oversight)
- When you have complex workflows (20+ agents, parallel execution)

**MVP Recommendation**: Stick with Option 1 (GitHub + Copilot + Claude) for now, simpler and faster

---

## Realistic Expectations: What Agents CAN'T Do

### From 06_AI_Assisted_Development_Strategy.md

**Agents CANNOT (you must do these)**:

1. **Understand Ghana Health System Nuances Without Context** (20% of work)
   - Example: "Should we allow NHIS claims for non-essential drugs?"
   - Solution: You decide based on MoH policy, document in `/docs/context/nhis-business-rules.md`, agents follow

2. **Make Architecture Trade-off Decisions** (10% of work)
   - Example: "Should we cache eligibility for 24 hours or query real-time?"
   - Solution: You analyze (cost, latency, accuracy), decide, document rationale

3. **Debug NHIE Integration Issues** (10% of work)
   - Example: "NHIE returns 422 Unprocessable Entity, what's wrong?"
   - Solution: You analyze NHIE error response, check FHIR profile, fix mapping, update context doc

4. **Validate Clinical Workflows** (20% of work)
   - Example: "Is this triage form what nurses actually use?"
   - Solution: You demo to pilot facility nurses, gather feedback, revise requirements

5. **Handle Ambiguous Requirements** (10% of work)
   - Example: "What happens if patient has 2 active NHIS cards?"
   - Solution: You research (ask MoH, check Kenya EMR), decide policy, document

**Agent Strength**: 70-80% of routine coding (CRUD operations, REST APIs, form validation, unit tests, documentation)

**Your Strength**: 20-30% of strategic work (architecture, domain expertise, stakeholder management, production risk)

**Together**: 4-5× productivity multiplier (per 06_AI_Assisted_Development_Strategy.md)

---

## Weekly Cadence with AI Agents

### Monday: Planning Day (2-3 hours)

**9:00 AM - Weekly Kickoff**:
1. Review last week's progress (what shipped, what's blocked)
2. Plan this week's goals (reference 08_MVP_Build_Strategy.md timeline)
3. Prompt Project Coordinator Agent:
   ```
   Week [X] goals: [List goals from 08_MVP_Build_Strategy.md]
   Break down into daily tasks, assign agents, create GitHub issues.
   Flag any blockers or decisions needed from me.
   ```
4. Review agent's plan, approve or adjust
5. Agents start work

---

### Tuesday-Thursday: Development Days (3-4 hours/day)

**Daily Routine**:
- **Morning (30 min)**: Check overnight agent work, review PRs, provide feedback
- **Midday (1-2 hours)**: Handle escalations (agents blocked, need decisions, conflicting code)
- **Afternoon (1-2 hours)**: Deep work on strategic tasks (architecture docs, MoH communication, clinical validation)
- **Evening (30 min)**: Check end-of-day progress, unblock agents for overnight work

**Agent Work Happens 24/7**: Agents don't sleep, they can work overnight while you rest (time zone advantage!)

---

### Friday: Demo Day (2-3 hours)

**2:00 PM - Weekly Demo**:
1. Prompt Project Coordinator Agent: "Prepare demo of this week's features"
2. Agent compiles:
   - Features completed
   - Code statistics (lines added, tests written, coverage %)
   - Known issues
   - Next week preview
3. You demo to stakeholders (pilot facility, advisors, future investors)
4. Gather feedback
5. Update `/docs/context/` with new learnings
6. Agents incorporate feedback next week

---

### Weekend: Strategic Work (Optional, 2-4 hours)

**Your Focus**:
- Review 08_MVP_Build_Strategy.md timeline (are we on track?)
- Update lean documentation (clinical-workflows.md, ghana-data-dictionary.md)
- MoH communication (email follow-ups, NHIE spec requests)
- Pilot facility coordination (schedule visits, training prep)
- Financial planning (burn rate, runway, fundraising if needed)

**Agents**: Can work on backlog tasks (refactoring, additional tests, documentation improvements)

---

## Revised Budget for AI Agent Team

### Development Costs (16-20 weeks)

**Human Costs** (You as Technical Lead):
- Your time: 30-40 hours/week × 16-20 weeks = 480-800 hours
- Your salary equivalent: $0 if bootstrapping, or $3-5K/month × 4-5 months = $12-25K if paying yourself

**AI Agent Costs**:
| Item | Cost (16 weeks) | Cost (20 weeks) |
|------|-----------------|-----------------|
| GitHub Copilot | $10/month × 4-5 months = $40-50 | $50 |
| Cursor Pro | $20/month × 4-5 months = $80-100 | $100 |
| Claude API (Project Coordinator) | $50-100/month × 4-5 months = $200-500 | $250-500 |
| GPT-4 API (backup agents) | $50/month × 4-5 months = $200-250 | $250 |
| **Subtotal** | **$520-900** | **$650-900** |

**Other Costs** (unchanged from 08_MVP_Build_Strategy.md):
| Item | Cost |
|------|------|
| Cloud hosting (4-5 months) | $240-400 |
| NHIE sandbox access | $500-2,000 |
| Staging server | $160-200 |
| Clinical Informaticist (consultant, part-time) | $2,000-3,750 |
| Pilot deployment | $3,800-5,900 |
| **Subtotal** | **$6,700-12,250** |

### **Total MVP Budget with AI Agents**:
- **Option A (16 weeks)**: $7,220-13,150 (vs $34,920-53,200 with human devs = **79-75% cost savings**)
- **Option B (20 weeks)**: $7,350-13,150 (vs $44,700-68,950 with human devs = **81-81% cost savings**)

**If you pay yourself** (Technical Lead salary):
- **Option A**: $19,220-38,150 (still 45-28% cheaper than human team)
- **Option B**: $22,350-38,150 (still 50-45% cheaper than human team)

**Bottom Line**: AI agents reduce MVP cost by **50-80%** while maintaining 70-80% of development velocity

---

## Success Metrics for AI Agent Team

### Track These Weekly

**Agent Productivity**:
- Lines of code generated per week (target: 2,000-3,000)
- Pull requests created (target: 10-15/week)
- Test coverage % (target: >70%)
- Agent-generated code merged without changes (target: >60%)

**Human Efficiency**:
- Your time spent per week (target: 30-40 hours, not 60+)
- PR review time (target: <2 hours/day)
- Blocked agent time (target: <20% of agent time)
- Strategic work time (target: >40% of your time)

**Quality Metrics**:
- Bugs found in production (target: <5/week)
- Security vulnerabilities (target: 0 critical, <3 medium)
- Code review rejection rate (target: <30%)
- Agent code requiring human rewrite (target: <10%)

**Velocity Metrics**:
- Features completed per week (target: 2-3 major features)
- On-time delivery (target: >80% of weekly goals met)
- Sprint velocity trending (target: stable or increasing)

---

## Fallback Plan: When to Add Human Developers

**Red Flags** (consider hiring humans):

1. **Agent Productivity <50%** after 4 weeks
   - Many PRs rejected, requiring extensive rewrites
   - Agents frequently blocked, can't complete tasks
   - -> Hire 1 backend developer (part-time) to unblock agents

2. **You're Working >50 hours/week** consistently
   - Spending all day reviewing agent code, no strategic work time
   - -> Hire 1 Technical Lead to share orchestration work

3. **NHIE Integration Failing** after 8 weeks
   - Complex integration logic beyond agent capabilities
   - -> Hire OpenMRS expert contractor (2-week sprint) to build integration layer

4. **Pilot Facility Demo Disasters**
   - Features don't work as expected, clinical workflows wrong
   - -> Hire Clinical Informaticist (full-time) to validate workflows

**Hybrid Model** (agents + humans):
- Agents: 70% of work (CRUD, forms, tests, docs)
- 1-2 senior developers: 30% of work (NHIE integration, complex business logic, architecture)
- **Cost**: $10-20K (agent costs) + $6-16K (1-2 devs × 4 months) = $16-36K total
- **Still 30-50% cheaper** than full human team

---

## Key Takeaways

### 1. You Are the Orchestra Conductor
- Agents are instruments, you write the music (architecture, priorities, trade-offs)
- Project Coordinator Agent is your assistant conductor (task decomposition, progress tracking)
- You focus on strategic work (40% of time), agents handle tactical coding (60-70% of work)

### 2. AGENTS.md Is Your Unfair Advantage
- **Create AGENTS.md Day 1** (comprehensive template included below - covers OpenMRS patterns, Ghana domain, NHIE specs, security)
- **Update whenever you make decisions** (agents auto-load it before generating code)
- **Industry standard** = works across Cursor, Copilot, Aider, Zed, Jules, and 10+ tools
- Poor AGENTS.md = agent conflicts, code rewrites, delays
- **Comprehensive AGENTS.md** = consistent code, fewer reviews, 4-5× productivity

### 3. Human-in-the-Loop at Key Checkpoints
- Architecture decisions (you can't delegate these)
- Clinical workflow validation (demo to real nurses/doctors)
- Production deployment approval (you're accountable for pilot facility)
- Strategic planning (MoH relationships, EOI submission, fundraising)

### 4. Use GitHub as Coordination Platform
- Issues = task queue, Projects = Kanban board, PRs = code review workflow
- Labels for organization (week-1, backend, agent-assigned, blocked, needs-decision)
- Simple, transparent, no custom tools needed

### 5. Realistic Expectations
- Agents automate 70-80% of coding (per 06_AI_Assisted_Development_Strategy.md)
- You still need 30-40 hours/week (Technical Lead + PM role)
- Cost savings: 50-80% vs human team, velocity: 70-80% of human team
- **Net result**: Faster, cheaper MVP with acceptable quality trade-offs

### 6. Start Simple, Scale Later
- MVP: GitHub + Copilot + Claude (simple coordination)
- v2+: Consider multi-agent frameworks (LangGraph, CrewAI) for full automation
- Don't over-engineer coordination upfront (premature optimization)

---

## Next Steps: Your Week 1 Action Plan with AI Agents

### Tomorrow (Day 1):
1. [DONE] Create GitHub repo: `ghana-emr-mvp`
2. [DONE] **Create AGENTS.md at root** (comprehensive template provided below)
3. [DONE] Install AI tools (Copilot, Cursor, Claude API)
4. [DONE] Configure tools for AGENTS.md (Cursor auto-works, Aider needs config)
5. [DONE] Set up local OpenMRS + MySQL (or Docker)
6. [DONE] Prompt Project Coordinator Agent: "Week 1 Day 1 environment setup, follow AGENTS.md rules"
7. [DONE] Review agent work, merge PRs
8. [DONE] Plan Week 1 Day 2-5 tasks

### Week 1 (Day 2-5):
1. [DONE] Build patient registration backend (agents auto-follow AGENTS.md rules)
2. [DONE] Build patient registration frontend (Option B: Next.js + shadcn/ui)
3. [DONE] Update AGENTS.md as new patterns emerge (Ghana Card edge cases, etc.)
4. [DONE] Test with pilot facility staff (validate workflows)
5. [DONE] Friday demo to stakeholders

### Week 2-4:
1. [DONE] Continue building per 08_MVP_Build_Strategy.md timeline
2. [DONE] Update AGENTS.md as architecture decisions made (agents auto-sync)
3. [DONE] Week 4 milestone: NHIE patient sync working (first integration proof!)

**By Week 4**: You'll have proven your AI agent team can build real features, hit milestones, and save 50-80% cost vs human team.

**Your competitive advantage**: Speed + capital efficiency + modern tech stack = win MoH contract

---

## Bottom Line

**Can AI coding agents build Ghana EMR MVP?** 
[DONE] **Yes**, with your orchestration and strategic oversight

**How do they coordinate?** 
[DONE] **You + Project Coordinator Agent** decompose tasks -> assign to specialized agents -> review outputs -> integrate into codebase

**What's your role?** 
[DONE] **Technical Lead + Project Manager** (30-40 hours/week: architecture, decisions, clinical validation, MoH relations, deployment approval)

**What's the outcome?** 
[DONE] **16-20 week MVP** for $7-38K (vs $35-69K with humans) with 70-80% of human team velocity

**When do you hire humans?** 
[DONE] **Fallback plan** if agents <50% productive after 4 weeks, or NHIE integration too complex, or you're working >50 hours/week

**Your next action**: 
[DONE] **Start Day 1** tomorrow with Project Coordinator Agent + environment setup (see Day 1 Workflow Example)

---

**You're not replacing developers with AI agents. You're multiplying your productivity 4-5× so you (1 person) can do the work of 4-6 people.**

**That's the unfair advantage. That's how you win the MoH contract.**

