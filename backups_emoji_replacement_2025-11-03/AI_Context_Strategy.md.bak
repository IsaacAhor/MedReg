# AI Context Feeding Strategy for Ghana EMR Project

## Overview
By creating comprehensive context documents for AI coding assistants, we can shift from "AI generates 60% boilerplate" to "AI generates 85% functional code including domain logic."

---

## 1. OpenMRS Documentation Package

### What to Include
```
/ai-context/
├── openmrs-patterns/
│   ├── 01-context-service-pattern.md          # Context.getService() vs @Autowired
│   ├── 02-hibernate-session-management.md     # Manual session handling
│   ├── 03-concept-dictionary-usage.md         # How to query/create Concepts safely
│   ├── 04-privilege-role-system.md            # Security annotations
│   ├── 05-metadata-sharing.md                 # Module interdependencies
│   └── 06-form-entry-syntax.md                # HTML Form Entry DSL
│
├── openmrs-apis/
│   ├── patient-service-api.md                 # PatientService methods with examples
│   ├── encounter-service-api.md               # EncounterService methods
│   ├── obs-service-api.md                     # ObsService methods
│   ├── location-service-api.md                # LocationService methods
│   └── user-service-api.md                    # UserService methods
│
└── openmrs-modules/
    ├── fhir2-module-integration.md            # How to extend FHIR2 module
    ├── rest-webservices-usage.md              # REST API patterns
    └── html-form-entry-examples.md            # Real-world forms
```

### Example Document: `01-context-service-pattern.md`
```markdown
# OpenMRS Context Service Pattern

## ❌ WRONG (Standard Spring)
```java
@Autowired
private PatientService patientService;
```

## ✅ CORRECT (OpenMRS Pattern)
```java
PatientService patientService = Context.getPatientService();
```

## Why?
OpenMRS uses Context-based service retrieval for:
- Runtime privilege checking
- Session management
- Module dependency injection

## In Controllers
```java
@Controller
public class GhanaPatientController {
    
    @RequestMapping("/patient/{uuid}")
    public String getPatient(@PathVariable String uuid) {
        // Always get service from Context
        PatientService ps = Context.getPatientService();
        Patient patient = ps.getPatientByUuid(uuid);
        
        // Check privilege
        if (!Context.hasPrivilege("View Patients")) {
            throw new APIAuthenticationException("Insufficient privileges");
        }
        
        return patient;
    }
}
```

## In Services (Module)
```java
public class GhanaNHIEService {
    
    public void submitClaim(Claim claim) {
        // Get required services
        PatientService ps = Context.getPatientService();
        EncounterService es = Context.getEncounterService();
        
        Patient patient = ps.getPatient(claim.getPatientId());
        Encounter encounter = es.getEncounter(claim.getEncounterId());
        
        // Business logic here
    }
}
```
```

---

## 2. Ghana Domain Knowledge Base

### Structure
```
/domain-knowledge/
├── ghana-health-system/
│   ├── nhis-business-rules.md                 # NHIS claim logic
│   ├── ghana-card-validation.md               # ID validation rules
│   ├── folder-number-format.md                # Patient identifier format
│   ├── facility-codes.md                      # 950 facility codes
│   └── administrative-structure.md            # 16 regions, 260 districts
│
├── clinical-protocols/
│   ├── malaria-treatment-protocol.md          # Per Ghana STG
│   ├── pediatric-dosing.md                    # Weight-based dosing
│   ├── anc-guidelines.md                      # 4-visit ANC model
│   ├── immunization-schedule.md               # Ghana EPI schedule
│   └── referral-criteria.md                   # When to refer up
│
├── data-standards/
│   ├── patient-demographics.md                # Required fields per MoH
│   ├── diagnosis-coding.md                    # ICD-10 Ghana subset
│   ├── procedure-coding.md                    # CPT codes used in Ghana
│   └── drug-dictionary.md                     # Essential medicines list
│
└── workflows/
    ├── outpatient-consultation.md             # OPD workflow
    ├── admission-discharge.md                 # IPD workflow
    ├── pharmacy-dispensing.md                 # Dispensary workflow
    └── lab-test-ordering.md                   # Lab workflow
```

### Example Document: `nhis-business-rules.md`
```markdown
# NHIS Business Rules for Ghana EMR

## Claim Eligibility Rules

### Rule 1: Active Membership Check
```
IF patient.nhisStatus == "ACTIVE" 
   AND patient.nhisExpiryDate > current_date
THEN allow_claim = TRUE
ELSE reject_claim("Patient NHIS membership expired or inactive")
```

**Code Example AI Should Generate:**
```java
public ClaimValidationResult validateNHISEligibility(Patient patient) {
    PersonAttribute nhisStatus = patient.getAttribute("NHIS Status");
    PersonAttribute nhisExpiry = patient.getAttribute("NHIS Expiry Date");
    
    if (nhisStatus == null || !"ACTIVE".equals(nhisStatus.getValue())) {
        return ClaimValidationResult.rejected(
            "NHIS membership is not active. Patient must renew membership."
        );
    }
    
    Date expiryDate = parseDate(nhisExpiry.getValue());
    if (expiryDate.before(new Date())) {
        return ClaimValidationResult.rejected(
            "NHIS membership expired on " + formatDate(expiryDate)
        );
    }
    
    return ClaimValidationResult.approved();
}
```

### Rule 2: Tariff Code Validation
```
IF service.tariffCode NOT IN approved_tariff_codes
THEN reject_claim("Invalid tariff code")

IF service.tariffCode requires_authorization
   AND claim.authorizationNumber IS NULL
THEN reject_claim("Authorization required for this service")
```

**Code Example AI Should Generate:**
```java
public ClaimValidationResult validateTariffCode(String tariffCode, BigDecimal amount) {
    // Query Ghana tariff database
    GhanaNHISTariff tariff = ghanaConfigService.getTariff(tariffCode);
    
    if (tariff == null) {
        return ClaimValidationResult.rejected(
            "Tariff code " + tariffCode + " is not recognized by NHIS"
        );
    }
    
    if (tariff.requiresAuthorization() && claim.getAuthNumber() == null) {
        return ClaimValidationResult.rejected(
            "Service requires prior authorization. Contact NHIS for approval."
        );
    }
    
    if (amount.compareTo(tariff.getMaxAmount()) > 0) {
        return ClaimValidationResult.rejected(
            "Amount GHS " + amount + " exceeds tariff cap of GHS " + tariff.getMaxAmount()
        );
    }
    
    return ClaimValidationResult.approved();
}
```

### Rule 3: Geographic Restrictions
```
IF patient.nhisRegion != facility.region
   AND service.type == "PRIMARY_CARE"
THEN reject_claim("Patient must use facility in their registered region for primary care")
```

## Claim Submission Rules

### Submission Window
- Claims must be submitted within **30 days** of service date
- Late claims (31-60 days) subject to 20% penalty
- Claims >60 days automatically rejected

### Batch Processing
- Minimum batch size: 10 claims
- Maximum batch size: 500 claims
- Batch must be single facility, single month

## Documentation Requirements

### Minimum Documentation
Every claim MUST include:
- Patient folder number
- NHIS number
- Diagnosis (ICD-10 code)
- Service date
- Tariff code
- Amount claimed
- Provider signature (digital or physical)

### Additional Documentation by Service Type
- **Surgery**: Operative notes, anesthesia record
- **Admission**: Admission note, discharge summary
- **High-cost drugs**: Prescription, treatment protocol
- **Imaging**: Radiologist report
```

---

## 3. NHIE Integration Specifications (When Available)

### Document Structure
```
/nhie-specs/
├── patient-registration-api.md                # POST /Patient endpoint
├── encounter-submission-api.md                # POST /Encounter endpoint
├── claim-submission-api.md                    # POST /Claim endpoint
├── document-submission-api.md                 # POST /DocumentReference endpoint
├── authentication-flow.md                     # OAuth2 + mTLS setup
├── error-handling.md                          # Error codes and retry logic
└── test-scenarios.md                          # Test cases with expected results
```

### Example: `patient-registration-api.md`
```markdown
# NHIE Patient Registration API

## Endpoint
```
POST https://nhie.moh.gov.gh/fhir/Patient
Authorization: Bearer {access_token}
Content-Type: application/fhir+json
```

## Request Body
```json
{
  "resourceType": "Patient",
  "identifier": [
    {
      "system": "http://moh.gov.gh/fhir/identifier/ghana-card",
      "value": "GHA-123456789-1"
    },
    {
      "system": "http://moh.gov.gh/fhir/identifier/nhis",
      "value": "GA01-1234567"
    },
    {
      "system": "http://facility.gov.gh/fhir/identifier/folder-number",
      "value": "GA-0001-2025-00123"
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
  "address": [
    {
      "use": "home",
      "district": "Accra Metropolitan",
      "region": "Greater Accra",
      "country": "GH"
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "+233201234567",
      "use": "mobile"
    }
  ]
}
```

## Response (Success)
```json
{
  "resourceType": "Patient",
  "id": "nhie-patient-abc123",
  "identifier": [...],
  "meta": {
    "versionId": "1",
    "lastUpdated": "2025-10-29T10:30:00Z"
  }
}
```

## Error Codes
- `400` - Invalid request (missing required field)
- `401` - Authentication failed
- `409` - Patient already exists (duplicate Ghana Card)
- `422` - Business rule violation (e.g., invalid NHIS format)

## Business Rules
1. Ghana Card number is REQUIRED
2. Ghana Card must be unique across NHIE
3. NHIS number format: `[REGION][DISTRICT]-[7DIGITS]`
4. If patient <18 years, parent/guardian contact required
5. Address must include valid district code (see district_codes.csv)

## AI Code Generation Prompt
```
Generate OpenMRS service method that:
1. Converts OpenMRS Patient to FHIR Patient Resource
2. Includes all three identifiers (Ghana Card, NHIS, Folder Number)
3. Calls NHIE middleware API with OAuth2 token (NHIE routes internally to MPI)
4. Handles 409 conflict by searching existing patient via NHIE
5. Logs transaction to nhie_transaction_log table (facility → NHIE calls only)
6. Returns NHIE patient ID for future reference

IMPORTANT: Never generate direct connections to NHIA or National MPI—all calls go through NHIE middleware.
```
```

---

## 4. How to Use This with AI Coding Assistants

### Option A: GitHub Copilot / Cursor
1. **Create `.cursorrules` or `.github/copilot-instructions.md`**
```markdown
# Ghana EMR Project - AI Context

## Project Overview
Building OpenMRS-based EMR for Ghana Ministry of Health with mandatory NHIE integration.

## Critical Patterns
- Always use `Context.getService()` instead of `@Autowired`
- Patient identifiers: Ghana Card (required), NHIS number, Folder number
- All NHIE calls must be logged to `nhie_transaction_log`
- NHIS claims require active membership check before submission
- Folder numbers follow format: `{REGION}-{FACILITY}-{YEAR}-{SEQUENCE}`
- **NHIE Middleware**: NHIE is the middleware layer—facilities connect to NHIE only, NHIE routes to backends (NHIA, MPI, SHR)
- **No Direct Backend Access**: Never generate code connecting directly to NHIA or National MPI

## Reference Documents
Before generating code, check:
- `/ai-context/openmrs-patterns/` for OpenMRS-specific patterns
- `/domain-knowledge/ghana-health-system/` for business rules
- `/nhie-specs/` for API integration details

## Code Generation Rules
1. Include error handling for network failures (rural connectivity issues)
2. Add audit logging for all patient data access
3. Validate Ghana Card format: `GHA-\d{9}-\d`
4. Validate NHIS number format: `[A-Z]{2}\d{2}-\d{7}`
5. Use Ghana timezone (GMT) for all timestamps
```

2. **When prompting AI:**
```
"Generate a service method to submit NHIS claim. 
Context: Check /domain-knowledge/ghana-health-system/nhis-business-rules.md
Requirements: Validate active membership, check tariff code, log to NHIE"
```

### Option B: Claude / ChatGPT Projects
1. **Create "Ghana EMR Knowledge Base" project**
2. **Upload all context files** (OpenMRS patterns, domain knowledge, NHIE specs)
3. **Set project instructions:**
```
You are a Ghana EMR developer working with OpenMRS platform.

Key constraints:
- Use OpenMRS Context pattern for service access
- Follow Ghana NHIS business rules strictly
- All NHIE integration must handle offline scenarios
- Patient identifiers: Ghana Card (required), NHIS, Folder number

When generating code:
1. Reference uploaded OpenMRS pattern documents
2. Apply Ghana-specific business rules from domain knowledge
3. Include comprehensive error handling
4. Add audit trail logging
5. Write unit tests covering Ghana edge cases
```

### Option C: VS Code Copilot + RAG
1. **Install Copilot + Vector Database extension**
2. **Index your context documents**
3. **Query while coding:**
```
// AI will automatically pull relevant context
// Example: Start typing this comment
// TODO: Create NHIS claim validator with Ghana business rules

// AI sees "NHIS claim" and "Ghana business rules"
// Pulls from /domain-knowledge/ghana-health-system/nhis-business-rules.md
// Generates complete validation method with:
// - Active membership check
// - Tariff code validation
// - Authorization requirements
// - Geographic restrictions
```

---

## 5. Expected Impact on Team Size/Cost

### Before Context Documentation
- **Team needed**: 11 people
- **AI contribution**: 60-70% boilerplate only
- **Timeline**: 6 months
- **Cost**: ~$80,000

### After Context Documentation
- **Team needed**: 6-8 people (can reduce domain experts)
  - Technical Lead (OpenMRS expert) - Still required
  - 2 Backend Developers (vs 3) - AI handles more
  - 1 Frontend Developer - AI handles more
  - ~~Clinical Informaticist~~ → Part-time consultant (knowledge captured in docs)
  - DevOps Engineer
  - QA Engineer
  - ~~Business Analyst~~ → Part-time (requirements captured in docs)
  
- **AI contribution**: 80-85% of code including domain logic
- **Timeline**: 4-5 months (faster iteration with AI)
- **Cost**: ~$50,000-$60,000 (37-50% reduction)

### What Changes
- **AI can now generate**: NHIS validation logic, Ghana Card parsing, folder number generation, NHIE integration code, business rule enforcement
- **Humans still required for**: Clinical workflow design, NHIE debugging (when specs unclear), government relations, user training, security compliance
- **Key insight**: Context documentation is **one-time effort** (2-3 weeks) that **permanently** increases AI effectiveness

---

## 6. Implementation Timeline

### Phase 1: Context Creation (Weeks 1-3)
- **Week 1**: OpenMRS patterns documentation (Technical Lead)
- **Week 2**: Ghana domain knowledge (Clinical Informaticist + Business Analyst)
- **Week 3**: NHIE specs documentation (when available from MoH)

### Phase 2: AI Training Test (Week 4)
- Generate 3 test modules with AI using context:
  1. Ghana Card validator
  2. NHIS eligibility checker  
  3. Folder number generator
- **Success criteria**: AI generates 80%+ correct code on first try

### Phase 3: Full Development (Weeks 5-20)
- Use AI for all standard modules
- Human review/refinement of AI output
- Focus human expertise on edge cases

---

## 7. Maintenance Strategy

### Keep Context Updated
- **Monthly**: Update domain knowledge when NHIS rules change
- **Quarterly**: Review OpenMRS patterns if platform upgrades
- **As needed**: Update NHIE specs when MoH publishes changes

### Measure AI Effectiveness
Track metrics:
- % of AI-generated code accepted without modification
- Time saved per feature vs manual coding
- Defect rate in AI-generated vs human-written code

**Target**: 75%+ AI code acceptance rate = documentation is working

---

## Conclusion

**YES**, exposing AI to OpenMRS docs and domain knowledge would dramatically help:
- Shifts AI from "code generator" to "Ghana EMR expert"
- Reduces team from 11 → 6-8 people
- Cuts timeline from 6 → 4-5 months  
- Reduces cost from $80K → $50-60K
- Most importantly: Makes AI generate **working domain logic** not just boilerplate

**Investment required**: 2-3 weeks upfront documentation effort  
**Return**: 37-50% cost reduction + faster time-to-market + knowledge preservation

This is the **difference between "maybe feasible" and "definitely competitive"** for winning the Ghana contract.
