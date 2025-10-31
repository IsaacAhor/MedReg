# AI-Assisted Development: Capabilities, Limitations, and Strategy

## Executive Summary

**Can AI code agents/assistants build Ghana EMR to win the contract?**

**Short Answer**: AI alone cannot. AI + expert human team can, with 40-60% productivity boost.

**Realistic Assessment**:
- AI can generate 70-80% of boilerplate code (FHIR converters, CRUD operations, tests)
- AI cannot handle Ghana-specific business logic without domain knowledge documentation
- AI cannot manage government relationships, clinical workflows, or user experience
- AI is a **productivity multiplier**, not a **human replacement**

**Winning Strategy**: Expert team (6-8 people) + AI assistants = MVP in 4-5 months at $70-80K cost vs traditional 11 people × 6 months at $105K.

---

## What AI Coding Assistants CAN Do

### 1. Boilerplate Code Generation (90% AI Success Rate)

**OpenMRS Entity Classes**
- Generate Patient, Encounter, Observation entities
- Getters/setters, constructors, equals/hashCode
- Hibernate annotations

**Example Capability**:
Prompt: "Generate OpenMRS entity class for NHIE transaction log with fields: transaction ID, type, payload, timestamp, status, error message"

AI Output: Complete Java class extending BaseOpenmrsData with proper annotations, extending correct base class, following OpenMRS conventions.

**Value**: Saves 2-3 hours per entity × 20-30 entities = 40-90 hours saved

### 2. FHIR Resource Conversion (80% AI Success Rate)

**OpenMRS ↔ FHIR Mappings**
- Convert OpenMRS Patient to FHIR Patient resource
- Convert Encounter + Observations to FHIR Bundle
- Parse FHIR Coverage resource to OpenMRS attributes

**Example Capability**:
Prompt: "Convert OpenMRS Patient with Ghana Card identifier to FHIR R4 Patient resource with identifier system http://moh.gov.gh/fhir/identifier/ghana-card"

AI Output: Complete FHIR conversion method with proper resource construction, identifier mapping, error handling.

**Value**: Saves 4-6 hours per converter × 15-20 converters = 60-120 hours saved

### 3. REST API Implementation (85% AI Success Rate)

**Controller and Service Layer**
- Spring REST controllers with proper annotations
- Service methods with Context.getService() pattern
- Error handling and validation
- DTO classes

**Example Capability**:
Prompt: "Create Spring REST controller for Ghana patient search by Ghana Card number using OpenMRS Context pattern"

AI Output: Complete controller with @RestController, proper exception handling, OpenMRS service access.

**Value**: Saves 3-4 hours per endpoint × 25-30 endpoints = 75-120 hours saved

### 4. Database Schema and Migrations (75% AI Success Rate)

**Liquibase Changesets**
- Table creation SQL
- Foreign key relationships
- Index definitions
- Data migration scripts

**Example Capability**:
Prompt: "Generate Liquibase changeset to create nhie_transaction_log table with columns: id, uuid, transaction_type, payload (TEXT), timestamp, status, retry_count"

AI Output: Complete Liquibase XML with proper column definitions, primary key, timestamps.

**Value**: Saves 1-2 hours per table × 10-15 tables = 10-30 hours saved

### 5. Unit Tests (85% AI Success Rate)

**Test Case Generation**
- JUnit test classes
- Mock objects and stubs
- Test data setup
- Assertions

**Example Capability**:
Prompt: "Generate JUnit test for Ghana Card validator that checks format GHA-XXXXXXXXX-X with valid and invalid cases"

AI Output: Complete test class with @Test methods, multiple test cases, assertions.

**Value**: Saves 1-2 hours per service × 20-30 services = 20-60 hours saved

### 6. Documentation (90% AI Success Rate)

**Code Documentation**
- JavaDoc comments
- README files
- API documentation
- User guides (with human review)

**Example Capability**:
Prompt: "Generate JavaDoc for NHIE integration service including parameter descriptions, return values, exceptions thrown, usage examples"

AI Output: Complete JavaDoc with @param, @return, @throws, code examples.

**Value**: Saves 15-20 hours documentation per module × 5-8 modules = 75-160 hours saved

### 7. SQL Queries and Reporting (80% AI Success Rate)

**Query Generation**
- Complex SELECT queries with JOINs
- Aggregation and grouping
- Performance optimization hints
- Report data extraction

**Example Capability**:
Prompt: "Generate SQL query to count malaria cases by district in October 2025 using OpenMRS encounter, observation, and location tables"

AI Output: Complete SQL with proper JOINs, WHERE clause, GROUP BY, filtering.

**Value**: Saves 1-2 hours per report × 10-15 reports = 10-30 hours saved

### 8. Configuration Files (85% AI Success Rate)

**System Configuration**
- Docker compose files
- Nginx configuration
- Spring application.properties
- Module config.xml

**Example Capability**:
Prompt: "Generate Docker Compose file for OpenMRS with MySQL 8.0, Redis cache, and Nginx reverse proxy"

AI Output: Complete docker-compose.yml with service definitions, volumes, networks.

**Value**: Saves 2-3 hours per config × 8-10 configs = 16-30 hours saved

---

## What AI Coding Assistants CANNOT Do (Or Do Poorly)

### 1. Ghana-Specific Business Logic (20% AI Success Rate Without Context)

**Why AI Fails**:
- NHIS eligibility rules not in training data
- Ghana Card validation format unknown to AI
- NHIS claims adjudication logic specific to Ghana
- Folder number generation scheme unique per facility

**Example Failure**:
Prompt: "Generate NHIS eligibility checker for Ghana"

AI Output: Generic eligibility checker without Ghana-specific rules (membership status check, expiry date validation, exemption categories, geographic restrictions).

**Solution**: Document Ghana domain knowledge (see Domain Knowledge Base), then AI can generate 75%+ correct code.

**Human Requirement**: Clinical Informaticist to document rules, Backend Developer to review AI output.

### 2. OpenMRS Platform Quirks (40% AI Success Rate)

**Why AI Struggles**:
- Context.getService() pattern not standard Spring (AI defaults to @Autowired)
- Concept dictionary usage requires understanding of OpenMRS data model
- Voiding vs retiring vs deleting has specific semantics
- Event listeners and module loading order

**Example Failure**:
Prompt: "Create OpenMRS service to save patient"

AI Output: Uses @Autowired instead of Context.getService(), forgets required fields (location on observations), doesn't handle voiding.

**Solution**: Document OpenMRS patterns (see OpenMRS Development Patterns), then AI generates 80%+ correct code.

**Human Requirement**: Technical Lead with OpenMRS expertise to review and correct.

### 3. NHIE Integration Real-World Debugging (10% AI Success Rate)

**Why AI Fails**:
- NHIE error responses not documented publicly
- Network issues, timeout handling requires operational context
- OAuth token refresh edge cases with NHIE middleware
- Idempotency and conflict resolution strategy
- Understanding NHIE's internal routing to backends (NHIA, MPI, SHR)

**Example Failure**:
Prompt: "Handle NHIE 422 error with message 'Invalid tariff code'"

AI Output: Generic error handling, no specific guidance on how to fix (query Ghana tariff database, map to valid code, retry). May incorrectly suggest direct NHIA connection.

**Solution**: Capture NHIE error scenarios during testing, document solutions, then AI can handle future similar errors. Always clarify NHIE is middleware, not direct backend access.

**Human Requirement**: Technical Lead to design retry strategy, Backend Developer to implement and test real NHIE integration, understanding middleware architecture.

### 4. Clinical Workflow Design (5% AI Success Rate)

**Why AI Fails**:
- Clinical workflows vary by facility type (teaching hospital vs health center)
- User preferences and work habits (paper-first vs digital-first)
- Regulatory requirements (MoH reporting formats)
- Cultural context (patient privacy expectations)

**Example Failure**:
Prompt: "Design OPD registration workflow for Ghana facility"

AI Output: Generic patient registration steps without Ghana-specific requirements (Ghana Card mandatory, NHIS verification, folder number generation, location-based identifier assignment).

**Solution**: Clinical Informaticist documents workflows, AI can then generate forms and validation rules.

**Human Requirement**: Clinical Informaticist (Ghana healthcare experience) + UX Designer.

### 5. Government Relationship and Procurement (0% AI Success Rate)

**Why AI Fails**:
- Government procurement processes unique to Ghana
- Relationship building with MoH officials
- Negotiation and contract terms
- Cultural and political sensitivities

**Example Failure**:
Prompt: "Generate response to Ghana MoH Expression of Interest"

AI Output: Generic RFP response template without understanding of Ghana context (vendor lock-in pain points, NHIE mandatory requirement, cost sensitivities after $77M failure).

**Solution**: Human-only. AI can help format documents but cannot strategize or build relationships.

**Human Requirement**: Project Manager (Ghana government experience) + Business Development.

### 6. Security Compliance and Audit (30% AI Success Rate)

**Why AI Struggles**:
- Ghana Data Protection Act specifics
- MoH security requirements (mTLS certificates, audit log formats)
- Penetration testing and vulnerability assessment
- Compliance documentation

**Example Failure**:
Prompt: "Implement Ghana Data Protection Act compliance for EMR"

AI Output: Generic GDPR-like compliance (not Ghana-specific), missing audit log retention requirements, no mTLS certificate handling.

**Solution**: Security specialist documents requirements, AI can then generate audit logging code, encryption helpers.

**Human Requirement**: Security Specialist (consultant) + DevOps Engineer.

### 7. User Experience and Training (20% AI Success Rate)

**Why AI Struggles**:
- User research requires talking to real users
- Usability testing needs real clinicians
- Training materials need local language and context
- Change management and user adoption strategies

**Example Failure**:
Prompt: "Create user training manual for Ghana EMR"

AI Output: Generic EMR training manual without Ghana-specific screenshots, local language examples, or addressing common user pain points (power outages, slow internet).

**Solution**: Training Coordinator creates outline and structure, AI fills in detailed content, human reviews and localizes.

**Human Requirement**: Training Coordinator + Clinical Informaticist.

### 8. Performance Optimization and Scaling (40% AI Success Rate)

**Why AI Struggles**:
- Requires profiling real production data
- Optimization depends on specific bottlenecks (database queries, network latency, UI rendering)
- Trade-offs between performance, maintainability, cost

**Example Failure**:
Prompt: "Optimize OpenMRS patient search query"

AI Output: Generic indexing suggestions without analyzing actual query execution plan or data distribution.

**Solution**: DevOps Engineer profiles production system, identifies bottlenecks, then AI can suggest specific optimizations.

**Human Requirement**: Technical Lead + DevOps Engineer.

---

## Quantitative Impact Analysis

### Traditional Development (No AI)

**Team**: 11 people × 6 months = 66 person-months
**Timeline**: 6 months to MVP
**Cost**: ~$105,000
**Code Output**: ~50,000 lines of code
**Productivity**: 750 lines/person-month

### AI-Assisted Development (With Context Documentation)

**Team**: 6-8 people × 4-5 months = 24-40 person-months
**Timeline**: 4-5 months to MVP
**Cost**: ~$70,000-$80,000
**Code Output**: ~50,000 lines of code (same functionality)
**Productivity**: 1,250-2,100 lines/person-month (67-180% boost)

**Breakdown of AI Contribution**:

| Task Category | % of Total Work | AI Can Do | Human Must Do | Net AI Contribution |
|--------------|----------------|-----------|----------------|---------------------|
| Boilerplate code | 25% | 90% | 10% | 22.5% work saved |
| FHIR conversion | 15% | 80% | 20% | 12% work saved |
| REST APIs | 20% | 85% | 15% | 17% work saved |
| Database schema | 5% | 75% | 25% | 3.75% work saved |
| Unit tests | 10% | 85% | 15% | 8.5% work saved |
| Documentation | 5% | 90% | 10% | 4.5% work saved |
| Business logic | 10% | 20% | 80% | 2% work saved |
| Integration debugging | 5% | 10% | 90% | 0.5% work saved |
| UI/UX | 5% | 30% | 70% | 1.5% work saved |
| **TOTAL** | **100%** | - | - | **72.25% work saved** |

**Adjusted for Context Documentation Effort**:
- Creating AI context docs: 2-3 weeks (5% of total timeline)
- Net productivity gain: 72% - 5% = **67% effective AI contribution**

**Human Effort Reduced by**: ~40% (from 66 person-months → 40 person-months)

---

## Real-World AI-Assisted Development Scenarios

### Scenario 1: NHIE Patient Registration

**Task**: Implement patient registration via NHIE

**Without AI**:
1. Backend Dev designs API structure (2 hours)
2. Backend Dev implements OpenMRS Patient creation (3 hours)
3. Backend Dev implements FHIR Patient conversion (4 hours)
4. Backend Dev implements NHIE HTTP client (3 hours)
5. Backend Dev implements error handling (2 hours)
6. Backend Dev writes unit tests (3 hours)
7. QA tests integration (2 hours)
**Total**: 19 hours

**With AI (Context-Aware)**:
1. Backend Dev designs API structure (2 hours)
2. AI generates OpenMRS Patient creation (30 min review)
3. AI generates FHIR Patient conversion (1 hour review + adjustments)
4. AI generates NHIE HTTP client (1 hour review)
5. Backend Dev implements Ghana-specific validation (Ghana Card format) (1.5 hours)
6. AI generates error handling (30 min review)
7. AI generates unit tests (1 hour review)
8. QA tests integration (2 hours)
**Total**: 9.5 hours

**Savings**: 50% time reduction

### Scenario 2: Ghana NHIS Eligibility Checker

**Task**: Implement NHIS eligibility verification via NHIE middleware

**Without AI**:
1. Clinical Informaticist documents NHIS rules (4 hours)
2. Backend Dev implements eligibility logic (6 hours)
3. Backend Dev implements NHIE middleware eligibility API call (3 hours)
4. Backend Dev implements caching (2 hours)
5. Backend Dev writes unit tests (3 hours)
6. QA tests various scenarios (3 hours)
**Total**: 21 hours

**With AI (Domain Knowledge Documented)**:
1. Clinical Informaticist documents NHIS rules in structured format (4 hours)
2. AI generates eligibility logic from rules (2 hour review + adjustments)
3. AI generates NHIE middleware eligibility API call (1 hour review)
4. AI generates caching logic (1 hour review)
5. AI generates unit tests covering all rule branches (1.5 hours review)
6. QA tests various scenarios (3 hours)
**Total**: 12.5 hours

**Savings**: 40% time reduction

**Note**: Local eligibility validation reduces NHIE API calls; actual eligibility check flows through NHIE to NHIA backend.

### Scenario 3: OpenMRS Concept Dictionary for Ghana

**Task**: Create Ghana-specific concepts (diagnoses, tests, drugs)

**Without AI**:
1. Clinical Informaticist identifies required concepts (8 hours)
2. Clinical Informaticist maps to CIEL/ICD-10 (6 hours)
3. Backend Dev creates concept SQL inserts (8 hours)
4. Backend Dev creates concept sets (vitals, lab panels) (4 hours)
5. QA validates concepts in UI (3 hours)
**Total**: 29 hours

**With AI (Clinical Informaticist Provides List)**:
1. Clinical Informaticist identifies required concepts (8 hours)
2. Clinical Informaticist maps to CIEL/ICD-10 (6 hours)
3. AI generates concept SQL inserts from CSV (2 hours review)
4. AI generates concept sets from structure (1 hour review)
5. QA validates concepts in UI (3 hours)
**Total**: 20 hours

**Savings**: 31% time reduction

---

## AI Tool Recommendations

### Best AI Coding Assistants for Ghana EMR Project

**1. GitHub Copilot**
- **Strengths**: Excellent for Java/Spring, inline code completion, OpenMRS patterns (if exposed to OpenMRS docs)
- **Weaknesses**: Limited context window (cannot see entire codebase), no OpenMRS-specific training
- **Use Case**: Real-time code completion while writing FHIR converters, REST APIs
- **Cost**: $10-20/user/month
- **Recommendation**: Use for all developers

**2. Cursor IDE**
- **Strengths**: Large context window, can index entire codebase, custom instructions per project
- **Weaknesses**: Still learning OpenMRS patterns, needs explicit context docs
- **Use Case**: Generate entire modules (NHIE adapter), refactoring large code sections
- **Cost**: $20/user/month
- **Recommendation**: Use for Technical Lead and senior developers

**3. ChatGPT (GPT-4) / Claude**
- **Strengths**: Excellent for documentation, architecture design, problem-solving, long-form code generation
- **Weaknesses**: No direct IDE integration, manual copy-paste workflow
- **Use Case**: Generate documentation, design patterns, troubleshoot complex issues
- **Cost**: $20-30/user/month
- **Recommendation**: Use for Technical Lead, Clinical Informaticist (documentation)

**4. Tabnine**
- **Strengths**: Fast inline completion, supports Java/JavaScript, on-premise deployment option (data privacy)
- **Weaknesses**: Less powerful than Copilot for complex code generation
- **Use Case**: Fast autocomplete during coding
- **Cost**: $12-39/user/month
- **Recommendation**: Alternative to Copilot if data privacy critical

### AI Tool Strategy by Role

**Technical Lead**
- Cursor (architecture, module generation) + ChatGPT (design discussions) + GitHub Copilot (coding)

**Backend Developers**
- GitHub Copilot (primary) + ChatGPT (problem-solving)

**Frontend Developer**
- GitHub Copilot (React components) + ChatGPT (UI patterns)

**DevOps Engineer**
- ChatGPT (infrastructure as code generation) + Copilot (scripting)

**QA Engineer**
- ChatGPT (test case generation) + Copilot (test automation code)

**Clinical Informaticist**
- ChatGPT (documentation, clinical protocol formatting)

**Cost per Month**: $20 × 8 people = $160/month (negligible compared to salaries)

---

## Best Practices for AI-Assisted Development

### 1. Create Comprehensive Context Documentation

**Before Development Starts**:
- OpenMRS patterns document (Context.getService(), concept dictionary, data model)
- Ghana domain knowledge base (NHIS rules, Ghana Card format, clinical workflows)
- NHIE integration specifications (API endpoints, auth, error codes)

**Format for AI Consumption**:
- Markdown files in project repository
- Structured sections (Overview, Pattern, Example, Anti-patterns)
- Code examples (correct and incorrect patterns side-by-side)

**Update Frequency**: Every sprint (capture new patterns, edge cases discovered)

### 2. Use AI for First Draft, Human for Review

**Workflow**:
1. Human writes detailed prompt with context (reference docs, requirements)
2. AI generates code (60-90% complete)
3. Human reviews for: Ghana-specific logic, OpenMRS conventions, edge cases
4. Human tests in real environment (not just unit tests)
5. Human refactors if needed

**Time Split**: AI generation (20% of time), Human review/test/refactor (80% of time)

### 3. Prompt Engineering Best Practices

**Good Prompt Structure**:
```
Context: [Provide background - "Building NHIE integration for Ghana EMR using OpenMRS"]
Requirement: [Specific task - "Create service to check NHIS eligibility"]
Constraints: [Technical limits - "Must use Context.getService() pattern, handle network timeout"]
Input/Output: [Data structures - "Input: NHIS number string, Output: boolean + expiry date"]
Example: [Similar code or pattern from codebase]
```

**Bad Prompt**:
"Create NHIS checker" (too vague, AI will generate generic code)

### 4. Iterative Refinement

**Don't Expect Perfect Code on First Try**:
- AI generates initial version (70% correct)
- Human identifies issues
- Human refines prompt with specific corrections
- AI regenerates improved version (85% correct)
- Repeat until 95%+ correct

**Typical Iterations**: 2-3 per complex feature

### 5. Test AI-Generated Code Rigorously

**Never Deploy AI Code Without Testing**:
- Unit tests (AI can generate these too)
- Integration tests (test against real NHIE sandbox)
- Manual QA (real user workflows)
- Code review by Technical Lead

**Common AI Mistakes to Watch For**:
- Missing null checks
- Incorrect exception handling (catching Exception instead of specific types)
- Not following OpenMRS conventions (using @Autowired instead of Context)
- Hardcoded values instead of configuration
- Missing audit logging

### 6. Build Reusable Prompt Library

**Capture Successful Prompts**:
- Create "prompts/" folder in repository
- Document prompts that generated good code
- Share across team
- Build prompt templates for common tasks

**Example Prompt Library**:
- `prompt-openmrs-service.md` - Template for OpenMRS service class
- `prompt-fhir-converter.md` - Template for FHIR resource conversion
- `prompt-rest-controller.md` - Template for REST API endpoint
- `prompt-liquibase-changeset.md` - Template for database migration

---

## AI vs Human: Decision Framework

**Use AI When**:
- Task is well-defined with clear inputs/outputs
- Similar examples exist in training data or documentation
- Task is repetitive (CRUD operations, boilerplate)
- Fast iteration needed (prototyping, exploration)
- Documentation or test generation

**Use Human When**:
- Business logic requires domain expertise (Ghana-specific rules)
- Architecture decisions (trade-offs, scalability, maintainability)
- Stakeholder communication (government, users)
- Creative problem-solving (novel technical challenges)
- Security-critical code (authentication, authorization, encryption)
- Performance optimization (profiling, bottleneck identification)

**Use AI + Human Together When**:
- Complex feature development (AI generates structure, human adds domain logic)
- Integration work (AI generates client code, human debugs real API)
- Refactoring (AI suggests improvements, human evaluates trade-offs)
- Code review (AI checks style/conventions, human checks business logic)

---

## Realistic Expectations: What "Winning" Looks Like

### With AI Assistance

**Timeline**: 4-5 months to MVP (vs 6 months without AI)
**Team Size**: 6-8 people (vs 11 without AI)
**Cost**: $70-80K (vs $105K without AI)
**Quality**: Same or better (more time for testing, refinement)
**Knowledge Transfer**: Better documented (AI forces documentation-driven development)

### Success Factors Beyond AI

**1. Technical Lead with OpenMRS Expertise (Non-Negotiable)**
- AI cannot replace deep platform knowledge
- Critical for architecture, code review, mentoring team

**2. Clinical Informaticist (Ghana Context)**
- AI cannot replace domain expertise
- Critical for workflows, business rules, user acceptance

**3. Government Relationships**
- AI cannot build trust with MoH
- Critical for contract award, pilot facility access, NHIE specs

**4. User-Centered Design**
- AI cannot do user research, usability testing
- Critical for adoption (technology is easy, adoption is hard)

**5. Operational Excellence**
- AI cannot monitor production, respond to outages
- Critical for maintaining facilities after deployment

---

## Conclusion: AI as Productivity Multiplier

**Final Verdict**: **AI + Expert Team = Winning Strategy**

**Why This Works**:
1. AI accelerates routine development (70-80% of codebase)
2. Humans focus on high-value work (domain logic, architecture, relationships)
3. Context documentation benefits both AI and human developers (knowledge management)
4. Smaller team is more agile (faster decisions, less coordination overhead)
5. Cost advantage (40% cheaper) makes bid more competitive

**Why AI Alone Fails**:
1. Ghana-specific knowledge not in AI training data
2. OpenMRS platform quirks require expertise
3. Government procurement requires human relationships
4. User adoption requires change management (AI cannot do this)
5. Real-world integration debugging needs operational experience

**Investment Recommendation**:
- Spend 2-3 weeks creating context documentation (5% of timeline)
- Equip all developers with AI tools ($160/month team cost)
- Hire expert Technical Lead (non-negotiable, $4K/month)
- Build lean but expert team (6-8 people)
- Leverage AI for 67% productivity boost
- **Result**: Deliver winning EMR solution at 40% lower cost than traditional approach

**This is how Ghana EMR gets built AND wins the contract.**
