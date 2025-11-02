# AGENTS.md - MedReg: Ghana EMR MVP

**Project**: MedReg (Ghana NHIE-Compliant Electronic Medical Records System)  
**Repository**: https://github.com/IsaacAhor/MedReg  
**Timeline**: 16-20 weeks to functional MVP  
**Target**: Win MoH pilot facility + position for EOI Q1 2026  
**Approach**: AI-first development with startup velocity  
**Current Status**: Week 1 Complete ✅ (See [IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md))

---

## Project Overview

**GitHub Repository:** https://github.com/IsaacAhor/MedReg  
**Implementation Tracker:** [IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md)  
**Branch:** main  
**First Commit:** October 31, 2025 (97 files, 23,077+ lines)

### Tech Stack
**Backend:**
- OpenMRS Platform 2.6.0 (core EMR engine)
- Java 8, Spring Framework
- MySQL 5.7 (required - OpenMRS 2.6.0 MySQL Connector/J incompatible with MySQL 8.0)
- HAPI FHIR 5.x (FHIR library)
- Maven 3.6+

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

### MVP Scope (What We're Building)
✅ **IN SCOPE:**
1. Patient Registration (Ghana Card, NHIS, folder number, demographics)
2. OPD Workflow (triage, consultation, pharmacy, billing)
3. NHIS Integration (eligibility check, claims export)
4. NHIE Sync (patient + encounter submission to national HIE)
5. Basic Reports (OPD register, NHIS vs Cash, top diagnoses, revenue)
6. User Management (6 roles: Admin, Doctor, Nurse, Pharmacist, Records, Cashier)

❌ **OUT OF SCOPE (Defer to v2):**
- IPD/Admissions, ANC, Lab results entry, Appointments, SMS, Advanced reports, Offline mode, Multi-facility, Referrals

### Reference Documents
- `08_MVP_Build_Strategy.md` - 16-20 week build timeline, team structure, budget
- `02_NHIE_Integration_Technical_Specifications.md` - NHIE architecture, OAuth, FHIR profiles
- `03_Ghana_Health_Domain_Knowledge.md` - Ghana health system, NHIS rules, workflows
- `07_AI_Agent_Architecture.md` - 17 specialized agents, interaction patterns

---

## CRITICAL ARCHITECTURE RULES ⚠️

### NHIE Middleware Architecture (NON-NEGOTIABLE)
```
Facility EMR → NHIE Middleware → Backend Systems (NHIA/MPI/SHR)
     ↑              ↓
     └──────────────┘
    (All communication routes through NHIE)
```

**RULES:**
1. ❌ **NEVER generate code that connects directly to NHIA backend**
2. ❌ **NEVER generate code that connects directly to National MPI**
3. ✅ **ALWAYS route through NHIE middleware** (OpenHIM Interoperability Layer)
4. ✅ Facility EMR submits to NHIE, NHIE routes internally to NHIA/MPI
5. ✅ Responses flow back: NHIA → NHIE → Facility EMR

**Why This Matters:**
- Ghana MoH mandate: All facilities connect via NHIE (no direct backend access)
- Violating this = disqualification from MoH contract
- NHIE provides: authentication, authorization, audit logging, message routing

**Implementation:**
- OpenMRS module calls `NHIEIntegrationService` 
- Service calls `NHIEHttpClient` → posts to NHIE endpoints
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
# Expected: "OpenMRS Platform 2.6.0-SNAPSHOT.0 Running!"
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
- Missing hyphens → Auto-insert if 13 digits provided
- Lowercase "gha" → Normalize to "GHA"
- Spaces → Strip before validation
- Invalid checksum → Reject with clear error message

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
- OpenMRS "M" → FHIR "male"
- OpenMRS "F" → FHIR "female"
- OpenMRS "O" → FHIR "other"
- OpenMRS "U" → FHIR "unknown"

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

After 8 failed attempts → Move to Dead-Letter Queue (DLQ) for manual review

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
- **Java version:** Java 8 (OpenMRS 2.6.0 requirement)
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
  - Order: Java std lib → Third-party → OpenMRS → Project
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
  - Order: React → Third-party → @/ imports → Relative imports

---

## Security Rules

### PII Handling (CRITICAL ⚠️)
1. ❌ **NEVER log Ghana Card numbers in plain text**
2. ❌ **NEVER log NHIS numbers in plain text**
3. ❌ **NEVER log patient names in plain text**
4. ❌ **NEVER log phone numbers in plain text**
5. ✅ **Always mask PII in logs:** `GHA-1234****-*`, `NHIS: 0123****`, `Name: K***e M****h`

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
- **JWT Tokens (frontend):** 1-hour expiry, refresh token pattern
- **Password Policy:** Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
- **Session Timeout:** 30 minutes inactivity

### Authorization (Role-Based Access Control)
| Role | Permissions |
|------|-------------|
| Admin | All operations, user management, system config |
| Doctor | View patients, create encounters, prescribe drugs, view reports |
| Nurse | View patients, triage, vitals entry, view encounters |
| Pharmacist | View patients, dispense drugs, view prescriptions |
| Records Officer | Register patients, search patients, print records |
| Cashier | View encounters, billing, receipts, revenue reports |

**Enforcement:**
- Backend: Check `Context.hasPrivilege("Privilege Name")` before operations
- Frontend: Hide UI elements based on user role (not security, just UX)
- Database: OpenMRS `user_role` and `privilege` tables

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

**Strategic Value:**
- ✅ Unblocks Week 4-5 NHIE integration work (no waiting for MoH sandbox)
- ✅ Enables comprehensive E2E testing (all scenarios: success, errors, retries)
- ✅ Demo-ready: Mock returns rich data that looks identical to real NHIE
- ✅ Zero code changes needed when switching to real NHIE (config-only)

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
# ✅ NHIE mock is healthy
# ✅ Patient created successfully
# ✅ Patient found by Ghana Card
# ✅ Duplicate prevention works
# ✅ NHIS eligibility check passed
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

### OpenMRS Platform 2.6.0
- **Java 8 only:** Cannot upgrade to Java 11+ (breaking changes in OpenMRS core)
- **MySQL 5.7 required:** MySQL 8.0 NOT compatible
  - **Issue:** OpenMRS 2.6.0 uses MySQL Connector/J 5.1.x which doesn't support MySQL 8.0's removed `storage_engine` variable
  - **Solution:** Use `mysql:5.7` Docker image (already configured in docker-compose.yml)
  - **DO NOT** attempt to use MySQL 8.0 - database connection will fail
- **No built-in UI:** OpenMRS Platform 2.6.0 has no user interface by design (since v2.0)
  - **This is CORRECT and EXPECTED:** Platform = core only, Distribution = platform + modules + UI
  - **For Option B:** Perfect - we're using Next.js frontend, not OpenMRS UI
  - **Verification:** Platform page shows "Running! ...but no user interface module is installed"
  - **REST API works perfectly:** http://localhost:8080/openmrs/ws/rest/v1/session
- **openmrs-core vs reference-application-distro:**
  - `openmrs/openmrs-core:2.6.0` = Platform ONLY, no REST API module
  - `openmrs/openmrs-reference-application-distro:2.11.0` = Platform + REST API + 30+ modules (correct choice)
  - **Always use reference-application-distro** for development

### OpenMRS 2.x vs O3 (3.x) Decision

**Current Choice: OpenMRS 2.6.0 Platform + Next.js Frontend (Option B) ✅**

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
- **Backend:** Uses SAME REST/FHIR API as 2.x (can run on top of OpenMRS 2.6.0 database)
- **Maturity:** Production-ready, actively developed, growing community

**Why O3 Makes Sense Post-MVP (v2 Consideration):**
1. **Backend Compatible:** O3 runs on our existing OpenMRS 2.6.0 backend (no migration!)
2. **Better UX:** Modern UI/UX vs building everything from scratch in Next.js
3. **Reusable Components:** Pre-built React components for patient dashboard, forms, etc.
4. **Multi-facility:** Microfrontend architecture scales better than monolithic Next.js
5. **Community Support:** Active O3 development, regular updates, Slack support

**Decision Matrix:**

| Factor | OpenMRS 2.x + Next.js (Current) | OpenMRS O3 |
|--------|----------------------------------|------------|
| MVP Timeline (16-20 weeks) | ✅ Fast - familiar stack | ❌ Slow - learning curve |
| Custom Ghana UI/UX | ✅ Full control | ⚠️ Must work within O3 patterns |
| Backend Integration | ✅ Direct REST API access | ✅ Same REST API |
| Developer Learning Curve | ✅ Next.js (known) | ❌ Single-SPA + O3 patterns (new) |
| Maintenance Complexity | ⚠️ Custom codebase | ✅ Community modules |
| Future Scalability | ⚠️ Monolithic frontend | ✅ Microfrontends |
| Multi-facility Support | ❌ Harder to scale | ✅ Designed for it |

**Recommendation:**
- ✅ **MVP (Now):** Continue with OpenMRS 2.6.0 + Next.js frontend (Option B)
- 📝 **Post-MVP (v2):** Evaluate O3 migration after pilot success
- 🔄 **Migration Path:** Backend stays the same, only frontend changes
- 📚 **Resources:** Bookmark [O3 Developer Docs](https://openmrs.atlassian.net/wiki/spaces/docs/pages/151093495) for future reference

**Key Insight:**
> O3 is a frontend framework, not a platform upgrade. We can switch to O3 later WITHOUT changing our OpenMRS 2.6.0 backend. This gives us flexibility to deliver MVP fast with Next.js, then adopt O3's modern UI/UX post-pilot if needed.

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

**External References (African Regional Context):**
- **Uganda EMR (METS-Programme):** https://github.com/METS-Programme
  - **openmrs-module-ugandaemr-sync** (Java, 26 forks, actively maintained): Central server sync with FHIR bundles
    - **CRITICAL for NHIE integration pattern**
    - Queue-based sync with retry logic
    - FHIR R4 resource generation (Patient, Encounter, Observation)
    - Scheduled tasks for async data submission
    - Connection availability checks
    - **Ghana Use:** Adapt for NHIE integration (replace central server URL with NHIE endpoints, add OAuth 2.0)
  - **openmrs-module-ugandaemr** (Java, 29 forks, actively maintained): Core Uganda EMR module
    - Patient identifier generation algorithms (UIC)
    - Queue management system (triage → clinician → pharmacy)
    - Service/DAO/REST controller patterns
    - Custom identifier validators (NIN - similar to Ghana Card)
    - Transfer in/out tracking
    - **Ghana Use:** Reference for service layer architecture, queue workflow, identifier generation
  - **openmrs-module-ugandaemr-reports** (Java, 38 forks): Government reporting module
    - DHIS2 integration patterns
    - SQL-based report generation
    - **Ghana Use:** Reference for MoH report structure (OPD register, NHIS vs Cash, etc.)
  - **esm-ugandaemr-core** (TypeScript, 29 forks, O3 microfrontend): OpenMRS 3.x implementation
    - Built on OHRI framework (HIV Reference Implementation)
    - Login, patient chart, navigation modules
    - **Ghana Use:** If we adopt O3 post-MVP, shows O3 is production-ready in African context
  - **ugandaemr-metadata**: Metadata deployment patterns (concepts, forms, encounter types)
    - **Ghana Use:** Reference for metadata initializer patterns
  - **ugandaemr-technicalguide**: Developer documentation
    - **Ghana Use:** OpenMRS best practices from African implementation
  - **License:** Mozilla Public License 2.0 (compatible with OpenMRS, can fork/adapt with attribution)

**OpenMRS & Framework Documentation:**
- **OpenMRS Wiki:** https://wiki.openmrs.org/
- **OpenMRS Github:** https://github.com/openmrs
- **OpenMRS REST API Docs:** https://rest.openmrs.org/
- **HAPI FHIR Docs:** https://hapifhir.io/hapi-fhir/docs/
- **Next.js Docs:** https://nextjs.org/docs
- **shadcn/ui Docs:** https://ui.shadcn.com/docs

**Ghana MoH Contact:**
- **Ghana MoH Digital Health:** info@moh.gov.gh

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-30 | Initial AGENTS.md creation |
| 1.1 | 2025-11-01 | **Critical architecture updates**: MySQL 5.7 requirement (not 8.0), REST API verification process, OpenMRS Platform "no UI" clarification, reference-application-distro vs openmrs-core guidance, OpenMRS 2.x vs O3 decision matrix |
| 1.2 | 2025-11-01 | **External references added**: Uganda EMR (METS-Programme) repositories evaluated and documented - critical NHIE sync patterns, queue management, identifier generation, reports, O3 implementation, metadata deployment. See docs/REFERENCES.md for detailed code adaptation strategies. |

---

**Remember:** This file is living documentation. Update it whenever you make architecture decisions, discover new patterns, or encounter edge cases. All AI coding agents will automatically reference the latest version.
