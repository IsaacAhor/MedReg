# AI Agent Architecture for Ghana EMR Project

## Overview

This document defines specialized AI agents that would work collaboratively to accelerate Ghana EMR development. Each agent is designed for specific tasks with defined inputs, outputs, and knowledge domains.

**Agent Philosophy**: Specialized agents with clear responsibilities > One general-purpose agent

**Integration Pattern**: Agents work in pipeline, with human oversight at critical decision points

---

## Agent Taxonomy

### Tier 1: Code Generation Agents (Direct Development)
1. OpenMRS Service Generator Agent
2. FHIR Converter Agent
3. REST API Builder Agent
4. Database Schema Agent
5. Test Generator Agent

### Tier 2: Domain Expert Agents (Knowledge Application)
6. Ghana Health Domain Agent
7. NHIS Business Rules Agent
8. Clinical Workflow Agent

### Tier 3: Integration Agents (System Connectivity)
9. NHIE Integration Agent
10. Offline Sync Agent

### Tier 4: Quality Assurance Agents (Validation)
11. Code Review Agent
12. Security Audit Agent
13. Performance Optimizer Agent

### Tier 5: Documentation Agents (Knowledge Management)
14. Technical Documentation Agent
15. User Manual Generator Agent

### Tier 6: Orchestration Agents (Coordination)
16. Project Coordinator Agent
17. Requirement Analyzer Agent

---

## Tier 1: Code Generation Agents

### 1. OpenMRS Service Generator Agent

**Purpose**: Generate OpenMRS service layer code following platform conventions

**Knowledge Base**:
- OpenMRS development patterns (Context.getService(), privilege checking)
- OpenMRS data model (Patient, Encounter, Obs, Concept)
- Base class hierarchy (BaseOpenmrsData, BaseOpenmrsMetadata)
- Voiding/retiring semantics
- Event listener patterns

**Inputs**:
- Service name (e.g., "GhanaNHISIntegrationService")
- Required operations (e.g., "checkEligibility", "submitClaim")
- Dependencies (other services needed)
- Business rules reference (from Ghana Health Domain Agent)

**Outputs**:
- Service interface (Java interface)
- Service implementation class (with Context.getService() patterns)
- Spring configuration (moduleApplicationContext.xml entries)
- Privilege definitions (config.xml entries)
- Unit test skeleton

**Example Task**:
```
Input: "Create service for Ghana folder number generation with methods: 
generateFolderNumber(Location, Date), validateFolderNumber(String)"

Output: Complete GhanaFolderNumberService with:
- Interface definition
- Implementation using OpenMRS LocationService
- Format: [REGION]-[FACILITY]-[YEAR]-[SEQUENCE]
- Validation regex
- Unit tests for valid/invalid formats
```

**Integration Points**:
- Receives requirements from Requirement Analyzer Agent
- Sends generated code to Code Review Agent
- Queries Ghana Health Domain Agent for business rules

---

### 2. FHIR Converter Agent

**Purpose**: Generate bidirectional converters between OpenMRS domain objects and FHIR R4 resources

**Knowledge Base**:
- HL7 FHIR R4 specification (Patient, Encounter, Observation, Coverage, Claim resources)
- OpenMRS FHIR2 module patterns
- Ghana NHIE profiles (identifier systems, extensions, value sets)
- HAPI FHIR library usage

**Inputs**:
- Source type (OpenMRS Patient, Encounter, Obs)
- Target FHIR resource (Patient, Encounter, Observation)
- Required mappings (Ghana Card -> identifier, NHIS number -> Coverage)
- Extension definitions (Ghana-specific fields)

**Outputs**:
- Converter class (e.g., PatientToFhirPatientConverter)
- Reverse converter (FhirPatientToPatientConverter)
- Validation logic (required fields, format checks)
- Unit tests with sample data
- Null-safe handling

**Example Task**:
```
Input: "Convert OpenMRS Patient with Ghana Card, NHIS number, folder number 
to FHIR R4 Patient resource"

Output: Complete converter with:
- Ghana Card mapped to identifier system http://moh.gov.gh/fhir/identifier/ghana-card
- NHIS number mapped to http://moh.gov.gh/fhir/identifier/nhis
- Folder number as local identifier
- Name, gender, birthDate, address mappings
- Null handling for optional fields
- Test cases (patient with all IDs, patient with Ghana Card only, etc.)
```

**Integration Points**:
- Receives NHIE profile specs from NHIE Integration Agent
- Sends converters to Code Review Agent
- Uses OpenMRS patterns from OpenMRS Service Generator Agent

---

### 3. REST API Builder Agent

**Purpose**: Generate Spring REST controllers with proper OpenMRS patterns and error handling

**Knowledge Base**:
- Spring REST annotations (@RestController, @RequestMapping, @PathVariable)
- OpenMRS REST module conventions
- HTTP status codes and error responses
- Authentication and authorization
- DTO pattern for API responses

**Inputs**:
- Endpoint specification (URL, HTTP method, parameters)
- Service layer reference (which OpenMRS service to call)
- Required privileges (who can access this endpoint)
- Response format (JSON structure)
- Error scenarios (validation, not found, unauthorized)

**Outputs**:
- REST controller class
- DTO classes (request/response objects)
- Exception handlers
- API documentation (JavaDoc + OpenAPI spec)
- Integration tests (REST Assured or MockMvc)

**Example Task**:
```
Input: "Create REST endpoint GET /api/patient/search?ghanaCard={number} 
that searches patient by Ghana Card, requires 'View Patients' privilege"

Output: Complete controller with:
- @RestController with proper mapping
- Context.getPatientService() usage
- Ghana Card identifier type lookup
- PatientDTO response object
- 404 if not found, 403 if no privilege
- Unit tests with mocked services
```

**Integration Points**:
- Calls OpenMRS Service Generator Agent for service layer
- Sends API specs to Technical Documentation Agent
- Receives requirements from Requirement Analyzer Agent

---

### 4. Database Schema Agent

**Purpose**: Generate Liquibase changesets for database schema evolution

**Knowledge Base**:
- Liquibase XML syntax and best practices
- OpenMRS database conventions (id, uuid, creator, date_created, etc.)
- MySQL data types and constraints
- Foreign key relationships to core OpenMRS tables
- Index strategy for performance

**Inputs**:
- Table specification (name, columns, relationships)
- Data types and constraints (NOT NULL, UNIQUE, etc.)
- Relationships (foreign keys to patient, encounter, location tables)
- Migration version

**Outputs**:
- Liquibase changeset XML
- Rollback changeset (for safe migration)
- Index definitions
- Sample data insert (for testing)
- Migration documentation

**Example Task**:
```
Input: "Create table nhie_transaction_log with columns: id (PK), uuid (unique), 
transaction_type (VARCHAR), payload (TEXT), timestamp, status (VARCHAR), 
retry_count (INT), error_message (TEXT), patient_id (FK to patient)"

Output: Complete Liquibase changeset with:
- Table creation with proper column types
- Primary key and UUID constraint
- Foreign key to patient table
- Index on patient_id and timestamp
- Index on status for queue queries
- Rollback changeset (DROP TABLE)
```

**Integration Points**:
- Receives schema requirements from OpenMRS Service Generator Agent
- Sends migrations to Code Review Agent
- Coordinates with Performance Optimizer Agent for indexing

---

### 5. Test Generator Agent

**Purpose**: Generate comprehensive unit, integration, and acceptance tests

**Knowledge Base**:
- JUnit 5 patterns and assertions
- Mockito for mocking OpenMRS services
- OpenMRS BaseModuleContextSensitiveTest pattern
- Test data builders (patient, encounter, obs)
- REST Assured for API testing
- Test coverage best practices

**Inputs**:
- Class to test (service, controller, converter)
- Test scenarios (happy path, edge cases, error cases)
- Dependencies to mock
- Expected behaviors

**Outputs**:
- Unit test class (JUnit + Mockito)
- Integration test class (with real OpenMRS context)
- Test data builders/fixtures
- Assertion helpers
- Test documentation

**Example Task**:
```
Input: "Generate tests for GhanaCardValidator.validate(String ghanaCard) 
that should accept format GHA-XXXXXXXXX-X and reject invalid formats"

Output: Complete test class with:
- Test valid Ghana Card (GHA-123456789-1) -> passes
- Test missing prefix (123456789-1) -> fails
- Test wrong format (GHA-12345-1) -> fails
- Test null input -> fails gracefully
- Test empty string -> fails
- Parameterized tests for multiple valid/invalid cases
```

**Integration Points**:
- Generates tests for all code from other generation agents
- Sends coverage reports to Code Review Agent
- Receives test scenarios from Ghana Health Domain Agent (edge cases)

---

## Tier 2: Domain Expert Agents

### 6. Ghana Health Domain Agent

**Purpose**: Provide authoritative Ghana healthcare system knowledge

**Knowledge Base**:
- Ghana health system structure (16 regions, 260 districts, facility types)
- Patient identifiers (Ghana Card, NHIS, folder number formats)
- Clinical workflows (OPD, IPD, ANC, immunization)
- Common diagnoses and treatments
- Essential medicines list
- Referral pathways
- Reporting requirements (DHIMS2)
- Data protection regulations

**Inputs**:
- Query about Ghana healthcare context
- Validation request (is this workflow correct?)
- Format verification (is this Ghana Card valid?)

**Outputs**:
- Structured knowledge (JSON, markdown)
- Business rules (machine-readable format)
- Validation functions
- Reference data (region codes, facility codes)

**Example Task**:
```
Input: "What are the required fields for patient registration in Ghana facility?"

Output: 
- MANDATORY: Full name, gender, date of birth, Ghana Card (if adult 18+)
- REQUIRED: Contact phone, address (region, district)
- RECOMMENDED: NHIS number, next of kin, ethnicity, language
- FORMAT RULES: Ghana Card = GHA-XXXXXXXXX-X, NHIS = [REGION][DISTRICT]-[7DIGITS]
```

**Integration Points**:
- Feeds all other agents with Ghana-specific requirements
- Validates outputs from code generation agents
- Updates OpenMRS Service Generator with business rules

---

### 7. NHIS Business Rules Agent

**Purpose**: Encode National Health Insurance Scheme rules and claim adjudication logic

**CRITICAL UNDERSTANDING**: NHIS (National Health Insurance Authority) is a **backend system** that facilities cannot access directly. All NHIS interactions (eligibility checks, claim submissions) must go through **NHIE middleware**.

**Architecture**:
```
Facility EMR 
    ↓ (checks eligibility rules locally first)
NHIE Middleware
    ↓ (routes to NHIA backend)
NHIA (National Health Insurance Authority)
    ↓ (returns eligibility/claim status)
NHIE Middleware
    ↓ (returns response)
Facility EMR
```

**Knowledge Base**:
- NHIS eligibility rules (active membership, expiry dates, exemptions)
- NHIS coverage (included/excluded services)
- Claims processing rules (tariff codes, authorization requirements, documentation)
- Geographic restrictions (primary care in registered region)
- Submission timelines (30-day window)
- Batch requirements (10-500 claims)
- **NHIE middleware endpoints** for eligibility and claims (not direct NHIA access)

**Inputs**:
- Eligibility check request (patient NHIS number, service date)
- Claim validation request (service, diagnosis, amount)
- Tariff code lookup

**Outputs**:
- **Local validation** rules (check before calling NHIE - reduces unnecessary API calls)
- Business rule functions (Java methods for pre-flight validation)
- **NHIE integration specs** (how to call NHIE for actual eligibility/claims)
- Test scenarios (valid/invalid claims)
- Error messages (user-friendly explanations)

**Example Task**:
```
Input: "Validate NHIS claim for surgery costing GHS 8,000 without authorization"

Output:
- Status: REJECTED (local validation, before calling NHIE)
- Reason: "Surgeries costing more than GHS 5,000 require prior authorization. 
  Please obtain authorization number from NHIA before submitting claim."
- Rule: requiresAuthorization(tariffCode) && amount > 5000 && authNumber == null
- Fix: "Contact NHIA at +233-XXX to request authorization"

IMPORTANT: This is LOCAL validation. Actual claim submission goes:
1. Pass local validation rules (this agent)
2. Submit via NHIE Integration Agent -> NHIE middleware
3. NHIE routes internally to NHIA backend
4. NHIA adjudicates and returns via NHIE
```

**Integration Points**:
- Feeds OpenMRS Service Generator Agent with local validation logic
- Works with NHIE Integration Agent for actual NHIE middleware calls
- Provides test data to Test Generator Agent
- **Never generates direct NHIA connections** (all via NHIE middleware)

---

### 8. Clinical Workflow Agent

**Purpose**: Design and validate clinical workflows for Ghana facility types

**Knowledge Base**:
- Facility-specific workflows (teaching hospital vs health center vs CHPS)
- Standard workflows (OPD registration -> consultation -> pharmacy -> billing)
- ANC visit schedules (4-visit model)
- Immunization schedules (Ghana EPI)
- Emergency pathways
- Referral procedures

**Inputs**:
- Facility type (teaching hospital, district hospital, health center, CHPS)
- Workflow to design (e.g., "OPD consultation")
- User roles involved (receptionist, nurse, doctor, pharmacist)

**Outputs**:
- Workflow diagram (BPMN or flowchart)
- Step-by-step procedures
- Form requirements per step
- Role-based task assignments
- Validation rules per step

**Example Task**:
```
Input: "Design OPD workflow for district hospital"

Output:
Step 1: Registration (Receptionist)
- Check if returning patient (search by Ghana Card or name)
- If new: Register demographics, Ghana Card, NHIS
- Verify NHIS eligibility via NHIE
- Assign folder number
- Print OPD card

Step 2: Triage (Nurse)
- Record vital signs (weight, height, temp, BP)
- Chief complaint
- Assign priority (urgent, routine)
- Queue for consultation

Step 3: Consultation (Doctor)
- Review history and vital signs
- Physical examination
- Diagnosis (ICD-10)
- Prescriptions
- Lab/imaging orders
- Referral (if needed)
- Next appointment

Step 4: Pharmacy (Pharmacist)
- Dispense medications
- Counseling
- Record dispensed items

Step 5: Billing (Clerk)
- Calculate charges
- If NHIS: Flag for claims
- If cash: Collect payment
```

**Integration Points**:
- Feeds form requirements to REST API Builder Agent
- Validates UI workflows with User Manual Generator Agent
- Provides workflow logic to OpenMRS Service Generator Agent

---

## Tier 3: Integration Agents

### 9. NHIE Integration Agent

**Purpose**: Generate all code for integrating with National Health Information Exchange (NHIE) middleware

**CRITICAL UNDERSTANDING**: NHIE is the **middleware/integration layer** that sits between facility EMRs and national systems (NHIA, MPI, etc.). All facilities must integrate through NHIE - no direct connections to NHIA or other national systems.

**NHIE Architecture**:
```
Facility EMR (OpenMRS) 
    ↓ (FHIR/REST)
NHIE Middleware (OpenHIM + Client Registry + SHR)
    ↓ (routes to appropriate backend)
    ├─-> NHIA (for claims/eligibility)
    ├─-> National MPI (for patient identity)
    ├─-> SHR (for encounter history)
    └─-> Terminology Service
```

**Knowledge Base**:
- NHIE middleware architecture (OpenHIM, Client Registry, Shared Health Record)
- NHIE exposes: Patient search, encounter submission, eligibility queries, claim submission
- NHIE routes internally to: NHIA (claims), MPI (identity), SHR (clinical data)
- HL7 FHIR R4 profiles for Ghana NHIE
- OAuth 2.0 client credentials flow (facility -> NHIE authentication)
- Mutual TLS (mTLS) certificate handling
- NHIE error codes and retry strategies
- Idempotency patterns
- Rate limiting handling

**Inputs**:
- NHIE operation (patient search, encounter submit, eligibility check, claim submit)
- NHIE endpoint URL (e.g., https://nhie.moh.gov.gh/fhir/)
- Authentication credentials (client_id, client_secret for NHIE)
- FHIR resources to exchange

**Outputs**:
- NHIE client service (HTTP client with OAuth for NHIE endpoints)
- Request/response handlers (facility -> NHIE communication only)
- Error handling and retry logic (for NHIE middleware failures)
- Idempotency key management
- Transaction logging (all NHIE middleware calls)
- Integration tests (against NHIE sandbox)

**Example Task**:
```
Input: "Create NHIE patient registration client that POSTs FHIR Patient to 
https://nhie.moh.gov.gh/fhir/Patient with OAuth 2.0 auth"

Output:
- NHIEPatientClient class with:
  - OAuth token manager (authenticate with NHIE middleware)
  - POST method to NHIE endpoint (NHIE routes internally to MPI)
  - Idempotency key generation (prevent duplicate registrations)
  - 409 Conflict handler (NHIE says patient exists -> search via NHIE instead)
  - 422 handler (NHIE validation error -> log and alert)
  - Retry on 500/503 (NHIE middleware or backend system down)
  - Transaction log to nhie_transaction_log table (facility -> NHIE calls only)
  - Unit tests with mocked HTTP client
  - Integration test with NHIE sandbox

IMPORTANT: Never attempt direct connection to NHIA or MPI - all calls go through NHIE middleware.
```

**Integration Points**:
- Uses FHIR resources from FHIR Converter Agent
- Logs transactions via Database Schema Agent
- Receives NHIE middleware specs from Requirement Analyzer Agent
- Sends integration patterns to Technical Documentation Agent

**Critical Constraints**:
- [FAILED] NO direct connections to NHIA for claims
- [FAILED] NO direct connections to National MPI for patient identity
- [DONE] ALL integrations route through NHIE middleware
- [DONE] NHIE handles routing to appropriate backend systems internally

---

### 10. Offline Sync Agent

**Purpose**: Generate code for offline queue management and synchronization

**Knowledge Base**:
- Message queue patterns (RabbitMQ, local SQLite queue)
- Conflict resolution strategies (last-write-wins, merge, manual review)
- Idempotency enforcement
- Network connectivity detection
- Batch synchronization
- Queue prioritization (urgent, high, medium, low)

**Inputs**:
- Transactions to queue (patient registration, encounter submit, claim submit)
- Connectivity status (online, offline)
- Sync policy (immediate, batch hourly, batch daily)
- Conflict scenarios

**Outputs**:
- Queue manager service
- Sync scheduler (periodic background job)
- Conflict resolver
- Connectivity monitor
- Queue storage (database tables or message broker config)
- Sync status dashboard data

**Example Task**:
```
Input: "Create offline queue for NHIE encounter submissions that syncs when 
connectivity restored"

Output:
- OfflineQueueService with:
  - enqueue(Encounter, operation="submit") -> saves to local queue table
  - Connectivity monitor (ping NHIE every 60 seconds)
  - When online: processQueue() -> submit queued encounters with idempotency keys
  - Success: Remove from queue
  - Failure: Increment retry_count, exponential backoff
  - Max retries: Flag for manual review
  - Queue priority: Urgent (referrals) > High (encounters) > Medium (claims)
  - Conflict detection: If encounter updated locally AND at NHIE during outage
```

**Integration Points**:
- Wraps NHIE Integration Agent calls
- Uses Database Schema Agent for queue tables
- Sends sync status to Technical Documentation Agent (operational runbooks)

---

## Tier 4: Quality Assurance Agents

### 11. Code Review Agent

**Purpose**: Automated code review for OpenMRS conventions, best practices, and security

**Knowledge Base**:
- OpenMRS coding standards
- Java best practices (SOLID principles, clean code)
- Security patterns (input validation, SQL injection prevention, XSS protection)
- Performance anti-patterns (N+1 queries, missing indexes)
- Common bugs (null pointer, resource leaks, race conditions)

**Inputs**:
- Pull request or code diff
- Target files (Java, XML, SQL)

**Outputs**:
- Review comments (inline feedback)
- Severity levels (critical, major, minor, suggestion)
- Pass/fail decision
- Refactoring suggestions
- Links to documentation

**Example Task**:
```
Input: Code review for GhanaNHISService.checkEligibility()

Output:
[DONE] PASS: Uses Context.getService() correctly
[FAILED] CRITICAL: No null check on patient.getAttribute("NHIS Number") - will throw NPE if attribute missing
[WARNING] MAJOR: Missing privilege check - should verify user has "Check NHIS Eligibility" privilege
[WARNING] MINOR: Method is 45 lines - consider extracting validation logic to separate method
💡 SUGGESTION: Add @Cacheable annotation - eligibility unlikely to change within hour
```

**Integration Points**:
- Reviews output from all Tier 1 Code Generation Agents
- Sends feedback to human developers for resolution
- Updates knowledge base with common issues for future prevention

---

### 12. Security Audit Agent

**Purpose**: Identify security vulnerabilities and ensure compliance

**Knowledge Base**:
- OWASP Top 10 vulnerabilities
- Ghana Data Protection Act requirements
- Healthcare data security standards
- Authentication/authorization best practices
- Encryption requirements (at rest, in transit)
- Audit logging standards

**Inputs**:
- Codebase (all Java, JavaScript, configuration files)
- Deployment configuration (Docker, Kubernetes, Nginx)
- Access control policies

**Outputs**:
- Security findings (vulnerability list with severity)
- Compliance checklist (Data Protection Act adherence)
- Remediation steps
- Security test cases
- Penetration test scenarios

**Example Task**:
```
Input: Audit NHIE integration code for security vulnerabilities

Output:
[FAILED] CRITICAL: OAuth client secret stored in plaintext in config.xml
  Fix: Move to encrypted properties or environment variables

[FAILED] HIGH: No rate limiting on patient search endpoint - vulnerable to DoS
  Fix: Implement rate limiting (100 requests/minute per user)

[WARNING] MEDIUM: Patient data logged in debug statements
  Fix: Remove PHI from logs, use patient ID only

[WARNING] MEDIUM: No audit log for NHIE transaction failures
  Fix: Log all NHIE calls to audit table with user, action, timestamp

[DONE] PASS: All NHIE calls use TLS 1.3
[DONE] PASS: Passwords hashed with bcrypt
```

**Integration Points**:
- Audits code from all generation agents
- Sends findings to human Security Specialist
- Updates Security patterns for future code generation

---

### 13. Performance Optimizer Agent

**Purpose**: Analyze and optimize performance bottlenecks

**Knowledge Base**:
- Database query optimization (indexes, query rewriting)
- Caching strategies (Redis, in-memory)
- N+1 query detection and resolution
- Batch processing patterns
- Connection pooling
- Frontend performance (lazy loading, code splitting)

**Inputs**:
- Slow query logs
- Application profiling data
- Load test results
- Performance requirements (response time SLAs)

**Outputs**:
- Bottleneck analysis
- Optimization recommendations
- Refactored code (optimized queries, caching)
- Index suggestions
- Load test scenarios

**Example Task**:
```
Input: Patient search by name taking 3 seconds (requirement: <500ms)

Output:
[FAILED] BOTTLENECK: Full table scan on person_name table (450,000 rows)
  Cause: No index on given_name and family_name columns
  Fix: CREATE INDEX idx_person_name ON person_name(family_name, given_name)

[FAILED] BOTTLENECK: Loading all patient attributes (15 queries per patient)
  Cause: Lazy loading triggers separate query for each attribute
  Fix: Use JOIN FETCH in query to eager load attributes

💡 OPTIMIZATION: Add Redis cache for frequently searched patients
  Cache key: ghana-card-{number}
  TTL: 1 hour
  Expected: 90%+ cache hit rate, <50ms cached response

Projected improvement: 3000ms -> 300ms (10x faster)
```

**Integration Points**:
- Analyzes code from all generation agents
- Works with Database Schema Agent to add indexes
- Updates OpenMRS Service Generator with caching patterns

---

## Tier 5: Documentation Agents

### 14. Technical Documentation Agent

**Purpose**: Generate comprehensive technical documentation

**Knowledge Base**:
- Documentation templates (architecture, API, deployment)
- Markdown formatting
- Diagram generation (PlantUML, Mermaid)
- JavaDoc standards
- OpenAPI specification

**Inputs**:
- Codebase (classes, methods, APIs)
- Architecture decisions
- Deployment configuration

**Outputs**:
- Architecture documentation (system design, component diagrams)
- API documentation (OpenAPI spec, endpoint descriptions)
- Developer guide (setup, contribution guidelines)
- Deployment guide (installation, configuration)
- Operations runbook (monitoring, troubleshooting)

**Example Task**:
```
Input: Generate API documentation for Ghana patient search endpoints

Output:
# Patient Search API

## Endpoint: GET /api/patient/search

Search for patients using various identifiers.

### Query Parameters
- `ghanaCard` (string, optional): Ghana Card number (format: GHA-XXXXXXXXX-X)
- `nhis` (string, optional): NHIS number (format: [REGION][DISTRICT]-[7DIGITS])
- `folderNumber` (string, optional): Facility folder number
- `name` (string, optional): Patient name (partial match)

### Response
200 OK - Array of PatientDTO objects
404 Not Found - No patients match criteria
400 Bad Request - Invalid query parameter format
403 Forbidden - User lacks "View Patients" privilege

### Example Request
```http
GET /api/patient/search?ghanaCard=GHA-123456789-1
Authorization: Bearer {token}
```

### Example Response
```json
[
  {
    "uuid": "abc-123",
    "ghanaCard": "GHA-123456789-1",
    "nhis": "GA01-1234567",
    "name": "Kwame Mensah",
    "gender": "male",
    "birthDate": "1985-03-15"
  }
]
```

**Integration Points**:
- Documents code from all generation agents
- Generates diagrams for architecture decisions
- Creates OpenAPI specs from REST API Builder Agent output

---

### 15. User Manual Generator Agent

**Purpose**: Generate end-user training materials and manuals

**Knowledge Base**:
- Adult learning principles
- Healthcare worker workflows
- Ghana healthcare terminology
- Screenshot annotation
- Step-by-step instruction format
- Multi-language support (English, Twi, Ga)

**Inputs**:
- System functionality (features, screens, workflows)
- User roles (receptionist, nurse, doctor, pharmacist)
- Screenshots or UI mockups
- Clinical workflows from Clinical Workflow Agent

**Outputs**:
- User manual (PDF, web-based)
- Quick reference guides
- Training slides
- Video script outlines
- Job aids (cheat sheets)

**Example Task**:
```
Input: Generate user manual section for OPD patient registration (receptionist role)

Output:
# Patient Registration at OPD

## Who: Receptionist
## When: When patient arrives for consultation
## Time: 5-10 minutes

### Steps

1. **Ask if patient has visited before**
   - If YES: Go to Step 2 (Search Patient)
   - If NO: Go to Step 5 (New Patient Registration)

2. **Search for Returning Patient**
   - Click "Search Patient" button
   - Enter Ghana Card number OR patient name
   - Click "Search"
   
   [SCREENSHOT: Patient search screen with Ghana Card field highlighted]

3. **Verify Patient Identity**
   - Check patient photo (if available)
   - Confirm name and date of birth with patient
   - Update contact phone if changed

4. **Check NHIS Status**
   - Click "Verify NHIS" button
   - System displays: [DONE] ACTIVE or [FAILED] EXPIRED
   - If EXPIRED: Inform patient to renew before services covered
   
   [SCREENSHOT: NHIS status screen showing active membership]

5. **For New Patient: Register Demographics**
   Required fields (marked with *):
   - Full name *
   - Gender *
   - Date of birth *
   - Ghana Card number * (adults only)
   - Contact phone *
   - Region and District *
   
   Optional fields:
   - NHIS number
   - Next of kin
   
   [SCREENSHOT: New patient registration form]

6. **Generate Folder Number**
   - System automatically generates folder number
   - Format: GA-0001-2025-00123 (region-facility-year-sequence)
   - Print folder label

7. **Send to Triage**
   - Click "Send to Triage" button
   - Patient joins queue for vital signs

### Common Problems

**Problem**: Ghana Card number rejected as invalid
**Solution**: Check format is GHA-XXXXXXXXX-X (capital letters, exact digits)

**Problem**: Patient says they have NHIS but system shows expired
**Solution**: Ask patient to show NHIS card. If expired, patient must renew at NHIS office before services covered.
```

**Integration Points**:
- Receives workflows from Clinical Workflow Agent
- Uses screenshots from UI development
- Coordinates with Training Coordinator for training delivery

---

## Tier 6: Orchestration Agents

### 16. Project Coordinator Agent

**Purpose**: Coordinate agent activities and manage dependencies

**Knowledge Base**:
- Project plan (milestones, dependencies)
- Agent capabilities and limitations
- Resource allocation
- Risk management
- Agile methodology (sprint planning, backlog management)

**Inputs**:
- Project requirements (from human Project Manager)
- Sprint goals
- Team capacity
- Blockers and risks

**Outputs**:
- Task assignments to agents
- Dependency graph
- Progress reports
- Risk alerts
- Sprint summary

**Example Task**:
```
Input: Sprint Goal - "Complete NHIE patient registration integration"

Output:
Task Breakdown:
1. [Ghana Health Domain Agent] Document Ghana Card and NHIS identifier formats
   Status: [DONE] Complete | Output: ghana-identifiers.md

2. [FHIR Converter Agent] Generate Patient -> FHIR Patient converter
   Status: [ACTIVE] In Progress | Depends on: #1 | ETA: 2 hours

3. [NHIE Integration Agent] Create NHIE patient registration client
   Status: ⏸️ Blocked | Depends on: #2 | Blocker: Waiting for NHIE sandbox credentials

4. [OpenMRS Service Generator Agent] Create GhanaPatientService wrapper
   Status: 📋 Queued | Depends on: #3

5. [REST API Builder Agent] Create patient search API
   Status: 📋 Queued | Depends on: #4

6. [Test Generator Agent] Generate integration tests
   Status: 📋 Queued | Depends on: #5

7. [Technical Documentation Agent] Document patient registration flow
   Status: 📋 Queued | Depends on: #6

[WARNING] RISK ALERT: Task #3 blocked on NHIE sandbox access. Action: Project Manager to follow up with MoH Digital Health Unit.

Progress: 15% complete (1/7 tasks done)
```

**Integration Points**:
- Orchestrates all other agents
- Reports to human Project Manager
- Escalates blockers requiring human intervention

---

### 17. Requirement Analyzer Agent

**Purpose**: Parse requirements and decompose into agent-executable tasks

**Knowledge Base**:
- User story format (Agile)
- Acceptance criteria
- OpenMRS capabilities
- Ghana health system requirements
- Technical feasibility assessment

**Inputs**:
- User stories (from Business Analyst or Product Owner)
- Feature requests
- Bug reports

**Outputs**:
- Refined requirements (clear, testable)
- Task breakdown (assigned to specific agents)
- Acceptance criteria
- Definition of Done
- Risk assessment

**Example Task**:
```
Input: User Story - "As a receptionist, I want to verify NHIS eligibility 
so that I can inform patients if they are covered"

Output:
Refined Requirements:
1. Display NHIS verification button on patient registration screen
2. Query NHIE Coverage resource when button clicked
3. Display status: ACTIVE (green), EXPIRED (red), NOT FOUND (yellow)
4. Show expiry date if active
5. Response time: <2 seconds
6. Handle network errors gracefully (offline queue if NHIE unavailable)

Task Breakdown:
- [NHIS Business Rules Agent] Document eligibility check rules
- [NHIE Integration Agent] Create NHIE Coverage query client
- [OpenMRS Service Generator Agent] Create GhanaNHISService.checkEligibility()
- [REST API Builder Agent] Create POST /api/nhis/check-eligibility endpoint
- [Frontend Developer] Add "Verify NHIS" button and status display (HUMAN)
- [Test Generator Agent] Generate eligibility check tests (active, expired, not found)

Acceptance Criteria:
[DONE] When receptionist clicks "Verify NHIS", system displays status within 2 seconds
[DONE] Active membership shows green checkmark and expiry date
[DONE] Expired membership shows red X and message to renew
[DONE] Not found shows yellow warning and prompt to verify number
[DONE] Network error shows error message and allows retry

Definition of Done:
[DONE] Code reviewed and merged
[DONE] Unit tests pass (>80% coverage)
[DONE] Integration test with NHIE sandbox passes
[DONE] Manual QA by receptionist at pilot facility
[DONE] Documentation updated

Risk Assessment:
[WARNING] MEDIUM: NHIE may not have Coverage endpoint yet (mitigation: use mock for now, integrate when available)
[WARNING] LOW: Network latency in rural areas (mitigation: offline queue, retry logic)
```

**Integration Points**:
- Receives requirements from human Product Owner/Business Analyst
- Feeds tasks to Project Coordinator Agent
- Validates feasibility with domain agents (Ghana Health Domain, NHIS Business Rules)

---

## Agent Interaction Patterns

### Pattern 1: Sequential Pipeline (Simple Task)

**Example**: Generate FHIR Patient converter

```
Requirement Analyzer Agent
  ↓ [task specification]
FHIR Converter Agent
  ↓ [generated code]
Code Review Agent
  ↓ [approval or feedback]
Test Generator Agent
  ↓ [tests]
Technical Documentation Agent
  ↓ [JavaDoc]
[DONE]
```

### Pattern 2: Parallel Generation (Independent Tasks)

**Example**: Build multiple FHIR converters simultaneously

```
Requirement Analyzer Agent
  ↓ [task specification]
  ├─-> FHIR Converter Agent (Patient)
  ├─-> FHIR Converter Agent (Encounter)
  └─-> FHIR Converter Agent (Observation)
    ↓ [all complete]
Code Review Agent (batch review)
  ↓
[MERGE]
```

### Pattern 3: Iterative Refinement (Complex Task)

**Example**: Design clinical workflow with domain validation

```
Requirement Analyzer Agent
  ↓ [initial requirement]
Clinical Workflow Agent (draft workflow)
  ↓ [workflow v1]
Ghana Health Domain Agent (validate against Ghana practices)
  ↓ [feedback: missing NHIS verification step]
Clinical Workflow Agent (refine workflow)
  ↓ [workflow v2]
NHIS Business Rules Agent (validate NHIS steps)
  ↓ [feedback: approved]
[FINALIZED]
```

### Pattern 4: Coordinated Multi-Agent (Feature Development)

**Example**: Complete NHIE patient registration feature

```
Project Coordinator Agent (orchestrate)
  ↓
  ├─-> Ghana Health Domain Agent (identifier formats)
  │     ↓
  ├─-> FHIR Converter Agent (Patient converter)
  │     ↓
  ├─-> NHIE Integration Agent (registration client)
  │     ↓
  ├─-> OpenMRS Service Generator (wrapper service)
  │     ↓
  ├─-> REST API Builder Agent (API endpoint)
  │     ↓
  └─-> Test Generator Agent (integration tests)
        ↓
Code Review Agent (review all outputs)
  ↓
Security Audit Agent (security check)
  ↓
Technical Documentation Agent (document feature)
  ↓
[COMPLETE]
```

---

## Human-in-the-Loop Decision Points

### Critical Decisions (Require Human)

1. **Architecture Design**
   - Agent: Project Coordinator suggests options
   - Human: Technical Lead makes final decision
   - Why: Trade-offs require business context

2. **Ghana-Specific Business Logic**
   - Agent: NHIS Business Rules Agent proposes rules based on documentation
   - Human: Clinical Informaticist validates against real-world practice
   - Why: Domain expertise not fully capturable by AI

3. **User Experience**
   - Agent: Clinical Workflow Agent designs workflow
   - Human: UX Designer and clinical users validate usability
   - Why: User preference and cultural context

4. **Security Policies**
   - Agent: Security Audit Agent identifies vulnerabilities
   - Human: Security Specialist decides mitigation strategy
   - Why: Risk tolerance and compliance interpretation

5. **Government Relations**
   - Agent: Requirement Analyzer Agent drafts RFP response
   - Human: Project Manager tailors and submits
   - Why: Relationship building and political sensitivity

6. **Production Deployment**
   - Agent: Performance Optimizer suggests configuration
   - Human: DevOps Engineer monitors and intervenes if issues
   - Why: Real-world operational complexity

### Agent Escalation Triggers

**When Agents Should Escalate to Humans**:
- Conflicting requirements (e.g., performance vs security trade-off)
- Ghana-specific edge case not in knowledge base
- NHIE API behaves differently than documented
- Test failure root cause unclear
- Security vulnerability with no clear fix
- User feedback contradicts design assumptions
- Budget or timeline constraints require priority decisions

---

## Agent Performance Metrics

### Generation Quality Metrics

**Code Review Pass Rate**
- Target: >85% of agent-generated code passes review without major issues
- Measure: % of agent outputs approved by Code Review Agent

**Test Pass Rate**
- Target: >95% of agent-generated tests pass on first run
- Measure: % of Test Generator Agent outputs that execute successfully

**Human Rework Time**
- Target: <20% of total development time spent fixing agent outputs
- Measure: Hours spent by human developers correcting agent code vs total hours

### Productivity Metrics

**Tasks Completed by Agents**
- Target: 70%+ of tasks fully automated (requirements -> tested code)
- Measure: # of tasks completed without human coding / total tasks

**Time Savings**
- Target: 40-60% reduction in development time vs traditional approach
- Measure: Compare sprint velocity with/without agents

**Knowledge Capture**
- Target: 100% of domain rules documented and agent-accessible
- Measure: # of documented rules / # of edge cases encountered

---

## Implementation Roadmap

### Phase 1: Foundation Agents (Month 1)

**Priority Agents**:
1. Requirement Analyzer Agent (parse user stories)
2. Ghana Health Domain Agent (knowledge base)
3. NHIS Business Rules Agent (eligibility/claims rules)
4. OpenMRS Service Generator Agent (core code generation)

**Outcome**: Can generate basic OpenMRS services with Ghana business rules

### Phase 2: Integration Agents (Month 2)

**Priority Agents**:
5. FHIR Converter Agent (OpenMRS ↔ FHIR)
6. NHIE Integration Agent (NHIE client)
7. Database Schema Agent (migrations)
8. Test Generator Agent (test automation)

**Outcome**: Can build end-to-end NHIE integration features

### Phase 3: Quality Agents (Month 3)

**Priority Agents**:
9. Code Review Agent (automated review)
10. Security Audit Agent (vulnerability detection)
11. Performance Optimizer Agent (bottleneck analysis)

**Outcome**: Agent-generated code meets production quality standards

### Phase 4: Documentation Agents (Month 4)

**Priority Agents**:
12. Technical Documentation Agent (developer docs)
13. User Manual Generator Agent (end-user guides)
14. Clinical Workflow Agent (workflow design)

**Outcome**: Complete documentation and training materials generated

### Phase 5: Orchestration (Month 5)

**Priority Agents**:
15. Project Coordinator Agent (multi-agent coordination)
16. REST API Builder Agent (API generation)
17. Offline Sync Agent (queue management)

**Outcome**: Fully orchestrated agent pipeline, minimal human intervention for routine tasks

---

## Technology Stack for Agent Implementation

### Agent Framework Options

**LangChain + Custom Tools**
- Pros: Mature framework, extensive tooling, Python-based
- Cons: Requires custom integration with Java codebase
- Use for: Orchestration, documentation agents

**Semantic Kernel (Microsoft)**
- Pros: Multi-language (C#, Java, Python), enterprise-ready
- Cons: Newer, smaller community
- Use for: Code generation agents integrated with IDE

**AutoGPT / BabyAGI Pattern**
- Pros: Autonomous task execution, self-prompting
- Cons: Can diverge from requirements, harder to control
- Use for: Research agents, requirement analysis

**Custom Agent Framework**
- Pros: Full control, tailored to Ghana EMR needs
- Cons: More development effort
- Use for: Domain-specific agents (Ghana Health, NHIS Business Rules)

### Knowledge Base Storage

**Vector Database** (Pinecone, Weaviate, Chroma)
- Store: OpenMRS patterns, Ghana domain knowledge, FHIR specs
- Use for: Semantic search, context retrieval for agents

**Graph Database** (Neo4j)
- Store: Concept relationships, dependency graphs, workflow models
- Use for: Complex query patterns, relationship navigation

**Structured Database** (PostgreSQL)
- Store: Business rules, tariff codes, facility metadata
- Use for: Exact match queries, transactional data

### LLM Selection

**OpenAI GPT-4** (or GPT-4 Turbo)
- Best for: General code generation, documentation, reasoning
- Cost: $0.03 per 1K input tokens, $0.06 per 1K output tokens
- Use for: Most agents

**Anthropic Claude** (Claude 3 Opus/Sonnet)
- Best for: Long context (200K tokens), detailed analysis
- Cost: Similar to GPT-4
- Use for: Code review, security audit (needs large context)

**Open-Source Models** (Llama 3, CodeLlama, Mistral)
- Best for: Cost savings, data privacy (on-premise)
- Cons: Lower quality than GPT-4 for complex tasks
- Use for: Simple pattern matching, template generation

**Specialized Models**
- CodeLlama: Code generation
- BioGPT: Clinical text processing
- Use for: Domain-specific tasks

---

## Cost-Benefit Analysis

### Agent Development Cost (One-Time)

| Agent | Development Effort | Cost Estimate |
|-------|-------------------|---------------|
| Requirement Analyzer | 2 weeks | $8,000 |
| Ghana Health Domain | 1 week | $4,000 |
| NHIS Business Rules | 1 week | $4,000 |
| OpenMRS Service Generator | 3 weeks | $12,000 |
| FHIR Converter | 2 weeks | $8,000 |
| NHIE Integration | 2 weeks | $8,000 |
| Test Generator | 2 weeks | $8,000 |
| Code Review | 2 weeks | $8,000 |
| Documentation (2 agents) | 2 weeks | $8,000 |
| Project Coordinator | 1 week | $4,000 |
| **TOTAL** | **18 weeks** | **$72,000** |

### Operational Cost (Ongoing)

**LLM API Calls**
- Code generation: ~10M tokens/month @ $0.045/1K = $450/month
- Documentation: ~5M tokens/month @ $0.045/1K = $225/month
- Review/audit: ~3M tokens/month @ $0.045/1K = $135/month
- **Total LLM Cost**: ~$810/month

**Infrastructure**
- Vector database hosting: $50/month
- Agent orchestration platform: $100/month
- Knowledge base storage: $50/month
- **Total Infrastructure**: $200/month

**Total Monthly Operational Cost**: ~$1,010/month

### Return on Investment

**Without Agents** (Traditional Development):
- Team: 11 people × 6 months = $105,000
- Timeline: 6 months

**With Agents** (AI-Assisted):
- Agent Development: $72,000 (one-time)
- Reduced Team: 6-8 people × 4 months = $56,000
- Agent Operations: $1,010 × 4 = $4,040
- **Total: $132,040** (first project)

**Break-Even**: After first project, agents are reusable
**Second Project**: $56,000 + $4,040 = $60,040 (vs $105,000 traditional)
**Savings**: $44,960 (43% reduction)

**Long-Term** (5 projects over 2 years):
- Traditional: $105,000 × 5 = $525,000
- With Agents: $72,000 + ($60,000 × 5) = $372,000
- **Total Savings**: $153,000 (29% reduction)

---

## Conclusion

### Recommended Agent Implementation Strategy

**Phase 1 Priority** (Start immediately):
1. **Requirement Analyzer Agent** - Standardize requirement decomposition
2. **Ghana Health Domain Agent** - Centralize Ghana knowledge
3. **OpenMRS Service Generator Agent** - Highest code volume impact

**Phase 2 Priority** (Month 2):
4. **FHIR Converter Agent** - Critical for NHIE integration
5. **Test Generator Agent** - Quality assurance automation
6. **Code Review Agent** - Catch errors early

**Phase 3 Priority** (Month 3-4):
7. **NHIE Integration Agent** - Core business value
8. **Technical Documentation Agent** - Reduce documentation burden

**Defer to Later**:
- Performance Optimizer Agent (optimize after MVP working)
- User Manual Generator Agent (defer until pilot facility deployment)
- Offline Sync Agent (complex, lower priority for initial facilities)

### Success Metrics

**Week 4**: 3 priority agents operational, generating 50%+ of boilerplate code
**Week 8**: 6 agents operational, end-to-end feature generation (requirement -> tested code)
**Week 12**: Full agent pipeline, 70%+ automation rate, human review only

### Critical Success Factors

1. **Invest in Knowledge Base** - Agents are only as good as their training data
2. **Human Oversight** - Always review agent outputs, especially Ghana-specific logic
3. **Iterative Improvement** - Capture agent mistakes, refine prompts, update knowledge base
4. **Clear Boundaries** - Agents for repetitive tasks, humans for creative/strategic decisions
5. **Metrics-Driven** - Track agent performance, ROI, adjust strategy based on data

**Bottom Line**: Specialized AI agents can accelerate Ghana EMR development by 40-60%, but require upfront investment in agent development and knowledge base curation. Most valuable for projects with repetitive patterns (FHIR converters, REST APIs, business rules) and domain-specific requirements (Ghana health system).
