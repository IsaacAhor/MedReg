# Ghana NHIE Integration: Technical Requirements and Specifications

## Overview

National Health Information Exchange (NHIE) is Ghana's mandatory middleware for all health data integrations. Every EMR system must integrate exclusively through NHIE—no direct connections to backend systems (NHIA, MPI, SHR) permitted.

### NHIE as Middleware: Three-Tier Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│  Facility EMR   │ ◄─────► │ NHIE Middleware  │ ◄─────► │  Backend Systems    │
│  (OpenMRS)      │         │  (OpenHIM)       │         │                     │
│                 │         │                  │         │  - NHIA (claims)    │
│  YOUR CODE      │         │  - Client Reg    │         │  - National MPI     │
│  INTEGRATES     │         │  - SHR           │         │  - SHR Database     │
│  HERE ───►      │         │  - Router        │         │  - Terminology      │
└─────────────────┘         └──────────────────┘         └─────────────────────┘
     ✅ YES                       GOVERNMENT                    ❌ NO DIRECT
   Facilities connect             CONTROLLED                   Facility Access
   to NHIE only                   Middleware
```

**Critical Understanding**:
- **NHIE is middleware**: It sits between facilities and national backend systems
- **Facilities authenticate with NHIE**: Not with NHIA, MPI, or other backends
- **NHIE routes internally**: Determines which backend system(s) to call
- **No bypass**: Government policy requires ALL integrations through NHIE to prevent vendor lock-in

**NHIE Role (from speech.md)**
- "National backbone for health data"
- "Every health data/system integration will now exist and occur" through NHIE
- Enables "facilities to continue care even if their local system goes down"
- Centralizes patient identity, eligibility checking, claims processing, and referrals

**Critical Requirement**: NHIE integration is non-negotiable for vendor approval.

---

## Expected NHIE Architecture

### Educated Guess Based on African HIE Standards

Since Ghana NHIE specifications are not yet publicly available, we base this on:
1. **Kenya HIE** (most mature African implementation)
2. **Rwanda OpenMRS-HIE integration** (proven in production)
3. **OpenHIE architecture** (African standard pattern)

**Confidence Level: 90-95%** that Ghana will follow this model

### Core Components

**1. Client Registry (Master Patient Index)**
- Assigns unique national patient identifier
- Cross-references Ghana Card, NHIS number, facility folder numbers
- Deduplicates patient records across facilities
- Provides patient search/match functionality

**2. Shared Health Record (SHR)**
- Stores longitudinal patient health records
- Accepts encounter data from facilities
- Serves consolidated patient history
- Enables continuity of care across facilities

**3. Interoperability Layer (OpenHIM)**
- API gateway for all health system integrations
- Routes requests to appropriate backend systems
- Enforces authentication and authorization
- Logs all transactions for audit
- Manages rate limiting and throttling

**4. Terminology Service**
- Manages standard code systems (ICD-10, SNOMED, LOINC)
- Maps local facility codes to national standards
- Validates concept references in submissions
- Supports multiple languages (English, Twi, Ga, Ewe, etc.)

**5. Facility Registry**
- Maintains official facility codes and metadata
- Used for routing and authorization
- Links facilities to regions/districts

**6. Provider Registry**
- Manages healthcare worker identities
- Links providers to facilities
- Used for encounter attribution

**7. NHIS Integration Service (NHIA Backend)**
- **CRITICAL**: NHIA (National Health Insurance Authority) is the backend system that facilities cannot access directly
- NHIE middleware handles eligibility verification requests
- NHIE routes claims to NHIA backend
- NHIE returns claims status and payments from NHIA
- **Architecture**: Facility EMR → NHIE Middleware → NHIA Backend → NHIE Middleware → Facility EMR
- **Constraint**: ❌ NO direct facility-to-NHIA connections permitted

---

## Technical Standards and Protocols

### Primary Standard: HL7 FHIR R4

**Why FHIR R4**
- Modern RESTful API standard
- JSON-based (easier than HL7 v2.x)
- Widely adopted in African HIE projects (Kenya, Rwanda, South Africa)
- Strong OpenMRS support via FHIR2 module
- Modular resource-based architecture

**Expected FHIR Resources**

**Patient Resource (Client Registry)**
- Ghana Card identifier (primary)
- NHIS number (required for claims)
- Facility folder number (local MRN)
- Demographics: name, gender, birthDate, address
- Telecom: phone, email
- Extensions: ethnicity, language preference

**Encounter Resource (SHR)**
- Patient reference
- Facility location reference
- Provider reference
- Service type (OPD, IPD, Emergency)
- Diagnosis codes (ICD-10)
- Period (admission/discharge dates)

**Observation Resource (SHR)**
- Vital signs (BP, temperature, weight, height)
- Lab results (LOINC codes)
- Clinical findings
- Patient reference and encounter reference

**Condition Resource (SHR)**
- Diagnoses with ICD-10 codes
- Clinical status (active, resolved)
- Severity
- Onset and resolution dates

**MedicationRequest Resource (SHR)**
- Prescriptions with Ghana Essential Medicines List codes
- Dosage instructions
- Dispense authorization

**DocumentReference Resource (SHR)**
- Discharge summaries
- Referral letters
- Lab reports
- Imaging reports
- PDF/images as attachments

**Coverage Resource (NHIS Integration)**
- NHIS membership details
- Coverage period (active/expired)
- Beneficiary relationship
- Coverage class (scheme type)

**Claim Resource (NHIS Integration)**
- Itemized services with tariff codes
- Diagnoses justifying services
- Provider and facility details
- Total amount claimed
- Supporting documentation references

**ClaimResponse Resource (NHIS Integration)**
- Claim adjudication results
- Approved/rejected/pending status
- Payment amount
- Rejection reasons

**ServiceRequest Resource (Referrals)**
- Referral request from facility A to facility B
- Service category (specialist consult, imaging, etc.)
- Priority (urgent, routine)
- Clinical justification

### IHE Profiles (Expected)

**PIXm (Patient Identity Cross-referencing)**
- Mobile-friendly patient identity management
- Matches patients across different facility systems
- Supports Ghana Card, NHIS, folder number cross-reference

**PDQm (Patient Demographics Query)**
- Mobile patient search
- Find patient by name, Ghana Card, NHIS number
- Returns matching patient resources

**MHD (Mobile Health Documents)**
- Submit and retrieve clinical documents
- Supports PDF discharge summaries, referral letters
- Includes metadata (author, date, document type)

**ATNA (Audit Trail and Node Authentication)**
- Logs all access to patient data
- Records who accessed what data when
- Required for data protection compliance

---

## API Endpoints and Operations

### Expected NHIE Base URL
```
https://nhie.moh.gov.gh/fhir/
```

### Patient Management

**Search for Patient**
```
GET /Patient?identifier=GHA-123456789-1
GET /Patient?identifier=http://moh.gov.gh/nhis|GA01-1234567
GET /Patient?name=Mensah&birthdate=1985-03-15&gender=male
```

**Create Patient**
```
POST /Patient
Content-Type: application/fhir+json
```

**Update Patient**
```
PUT /Patient/{id}
Content-Type: application/fhir+json
```

**Get Patient History**
```
GET /Patient/{id}/_history
```

### Encounter Submission

**Submit Encounter**
```
POST /Encounter
Content-Type: application/fhir+json
```

**Search Encounters for Patient**
```
GET /Encounter?patient={patient-id}&date=ge2025-01-01
```

### Observations

**Submit Observations**
```
POST /Observation
Content-Type: application/fhir+json
```

**Batch Submit (Multiple Observations)**
```
POST /
Content-Type: application/fhir+json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [...]
}
```

### NHIS Integration

**Check Eligibility**
```
POST /Coverage/$eligibility-check
Content-Type: application/fhir+json
{
  "resourceType": "Parameters",
  "parameter": [
    {"name": "patient", "valueReference": {"reference": "Patient/123"}},
    {"name": "serviceDate", "valueDate": "2025-10-29"}
  ]
}
```

**Submit Claim**
```
POST /Claim
Content-Type: application/fhir+json
```

**Check Claim Status**
```
GET /ClaimResponse?claim={claim-id}
```

### Referrals

**Submit Referral**
```
POST /ServiceRequest
Content-Type: application/fhir+json
```

**Query Incoming Referrals**
```
GET /ServiceRequest?performer=Location/{facility-id}&status=active
```

### Documents

**Submit Document**
```
POST /DocumentReference
Content-Type: application/fhir+json
```

**Retrieve Documents**
```
GET /DocumentReference?patient={patient-id}&type=discharge-summary
```

---

## Authentication and Security

### OAuth 2.0 Client Credentials Flow

**Expected Pattern**
1. Facility system registers with NHIE (receives client_id and client_secret)
2. Request access token before each API call
3. Include Bearer token in Authorization header
4. Tokens expire after 1 hour (refresh as needed)

**Token Endpoint**
```
POST https://nhie.moh.gov.gh/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={your-client-id}
&client_secret={your-client-secret}
&scope=patient.read patient.write encounter.write claim.write
```

**Using Token**
```
GET https://nhie.moh.gov.gh/fhir/Patient/123
Authorization: Bearer {access-token}
```

### Mutual TLS (mTLS)

**Expected for Production**
- Facility systems must present client certificate issued by Ghana CA
- NHIE validates certificate before accepting connection
- Adds additional authentication layer beyond OAuth

**Certificate Requirements**
- Subject: CN=facility-code (e.g., CN=GA-0001)
- Issued by Ghana Ministry of Health Certificate Authority
- Valid for 1-2 years (must renew)
- Private key must be securely stored

### IP Whitelisting

**Possible Additional Security**
- Facilities register static IP addresses
- NHIE firewall only accepts requests from registered IPs
- Prevents unauthorized access even with stolen credentials

---

## Data Validation and Quality Rules

### Patient Identifiers

**Ghana Card Format**
- Pattern: `GHA-XXXXXXXXX-X` (GHA followed by 9 digits, dash, check digit)
- Required for all new patient registrations
- Must be unique across NHIE

**NHIS Number Format**
- Pattern: `[REGION][DISTRICT]-[7DIGITS]` (e.g., GA01-1234567)
- Region code: 2 letters (GA=Greater Accra, AH=Ashanti, etc.)
- District code: 2 digits
- Must validate against NHIS registry

**Folder Number Format**
- Pattern: `[REGION]-[FACILITY]-[YEAR]-[SEQUENCE]` (e.g., GA-0001-2025-00123)
- Region: 2-letter code
- Facility: 4-digit facility code
- Year: 4-digit year
- Sequence: 5-digit incrementing number

### Clinical Data Validation

**Required Fields for Encounter**
- Patient reference (valid NHIE patient ID)
- Facility location (valid facility code)
- Provider reference (valid provider ID)
- Service type (from approved value set)
- At least one diagnosis (ICD-10 code)
- Encounter date/time

**Diagnosis Codes**
- Must use ICD-10 codes
- Ghana maintains subset of commonly used codes
- Invalid codes rejected by NHIE

**Procedure Codes**
- Ghana uses subset of ICD-10-PCS or CPT codes
- Required for surgical procedures and imaging
- Must match approved tariff list

**Drug Codes**
- Ghana Essential Medicines List codes
- Maps to international standards (ATC, RxNorm)
- Required for prescription and dispensing records

---

## Error Handling and Retry Logic

### HTTP Status Codes

**Success Codes**
- `200 OK`: Successful GET/PUT
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE

**Client Error Codes**
- `400 Bad Request`: Invalid FHIR resource syntax
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Token valid but insufficient permissions
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Duplicate identifier (patient already exists)
- `422 Unprocessable Entity`: Valid syntax but business rule violation

**Server Error Codes**
- `500 Internal Server Error`: NHIE system error
- `502 Bad Gateway`: Backend service (NHIS, MPI) unavailable
- `503 Service Unavailable`: NHIE maintenance or overload
- `504 Gateway Timeout`: Backend service timeout

### Retry Strategy

**Transient Errors (Retry Recommended)**
- 500, 502, 503, 504: Network or temporary service issues
- Exponential backoff: Wait 1s, 2s, 4s, 8s, 16s before retries
- Maximum 5 retry attempts
- Use idempotency keys to prevent duplicates

**Permanent Errors (Do Not Retry)**
- 400, 401, 403, 404, 422: Fix data or authorization before retrying
- Log error and alert administrator
- Return error to user for correction

### Idempotency

**Use Idempotency Keys**
- Include `X-Idempotency-Key` header with UUID
- NHIE recognizes duplicate requests with same key
- Prevents duplicate patient registrations or claim submissions

**Example**
```
POST /Patient
Authorization: Bearer {token}
X-Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/fhir+json
```

---

## Offline Scenarios and Queue Management

### Challenge: Rural Connectivity

**Problem**
- Many Ghanaian facilities have unreliable internet
- Power outages common in rural areas
- Cannot halt patient care during outages

**Solution Pattern**
- Local OpenMRS server continues operations offline
- Queue all NHIE transactions locally
- Sync when connectivity restored

### Queue Design

**Queue Structure**
- Transaction ID (UUID)
- Transaction type (patient registration, encounter submit, claim submit)
- Payload (FHIR resource JSON)
- Timestamp (when transaction created)
- Retry count
- Status (pending, in-progress, success, failed)
- Idempotency key
- Error message (if failed)

**Queue Priority**
1. **Urgent**: Referrals, emergency encounters
2. **High**: Patient registrations, encounters
3. **Medium**: Claims, eligibility checks
4. **Low**: Historical data backfill

**Conflict Resolution**
- If patient updated both locally and via NHIE during outage:
  - Use "last write wins" with timestamp
  - Merge non-conflicting fields
  - Flag conflicts for manual review
  - Log all conflicts for audit

**Storage Limit**
- Queue capacity: 72 hours of typical transaction volume
- Approximately 500-1000 transactions per facility per day
- Compressed queue: ~50MB storage
- Alert when queue >50% capacity

---

## Performance and Scalability Requirements

### Expected Transaction Volumes

**National Scale (950 Facilities)**
- Patient lookups: 100,000+ per day
- Encounter submissions: 50,000+ per day
- Eligibility checks: 40,000+ per day
- Claim submissions: 10,000+ per day
- Document uploads: 5,000+ per day

**Per-Facility Volumes**
- Small facility (50-100 patients/day): 200 NHIE transactions/day
- Medium facility (200-500 patients/day): 800 transactions/day
- Large facility (1000+ patients/day): 2,000+ transactions/day

### Response Time SLAs (Expected)

**Patient Search/Lookup**
- Target: <500ms
- Maximum: 2 seconds

**Eligibility Check**
- Target: <1 second
- Maximum: 5 seconds (depends on NHIS backend)

**Encounter Submission**
- Target: <1 second
- Maximum: 3 seconds

**Claim Submission**
- Target: <2 seconds
- Maximum: 10 seconds (complex validation)

**Batch Operations**
- 100 observations in bundle: <5 seconds
- 1000 observations in bundle: <30 seconds

### Rate Limiting

**Expected Limits**
- Requests per facility: 100 per minute
- Burst capacity: 200 per minute (short spikes allowed)
- Daily cap: 50,000 per facility per day

**Handling Rate Limits**
- NHIE returns `429 Too Many Requests`
- Response includes `Retry-After` header
- Wait specified time before retry
- Implement request queuing to smooth traffic

---

## Audit and Compliance Requirements

### Audit Logging

**Required Log Fields**
- Timestamp (ISO 8601 format with timezone)
- Facility code
- User ID (healthcare worker who initiated action)
- Action type (create, read, update, delete)
- Resource type (Patient, Encounter, etc.)
- Resource ID
- Patient identifier (Ghana Card or NHIS)
- Request IP address
- Response status code
- Idempotency key

**Retention Requirements**
- Minimum 7 years (medical record standard)
- Tamper-proof logging (write-only, cryptographically signed)
- Exportable for compliance audits

**Privacy Protection**
- Do not log full patient names or sensitive data in audit logs
- Use patient ID references only
- Encrypt audit logs at rest
- Restrict audit log access to authorized compliance officers

### Data Protection Compliance

**Ghana Data Protection Act (Act 843)**
- Obtain patient consent for data sharing
- Patient has right to access their NHIE data
- Patient can request corrections
- Patient can request data export

**NHIE Responsibilities**
- Patient consent tracking
- Audit trail of all access
- Encryption in transit (TLS 1.3)
- Encryption at rest (AES-256)
- Regular security audits

**Facility Responsibilities**
- Train staff on data protection
- Obtain consent during registration
- Respect patient access/correction requests
- Report data breaches to NHIE within 72 hours

---

## Testing and Certification

### NHIE Conformance Testing

**Expected Process**
1. Register facility system with NHIE sandbox
2. Receive sandbox credentials (client_id, client_secret)
3. Pass required test scenarios
4. Receive conformance certificate
5. Apply for production access

**Test Scenarios (Expected)**

**Patient Management**
- Create new patient with Ghana Card
- Search patient by NHIS number
- Update patient demographics
- Handle duplicate patient (409 Conflict)

**Encounter Submission**
- Submit OPD encounter with observations
- Submit IPD encounter with admission/discharge
- Submit emergency encounter
- Handle validation errors (missing diagnosis, invalid provider)

**NHIS Integration**
- Check eligibility for active member
- Check eligibility for expired member
- Submit simple claim (OPD consultation)
- Submit complex claim (surgery with multiple items)
- Handle claim rejection

**Referral Workflow**
- Submit referral from facility A to facility B
- Query incoming referrals at facility B
- Update referral status (accepted, completed)

**Offline Sync**
- Queue transactions during simulated outage
- Sync transactions after connectivity restored
- Handle conflicts (patient updated during outage)

**Error Handling**
- Retry on 500/503 errors
- Handle rate limiting (429)
- Use idempotency keys correctly

**Security**
- Authenticate with OAuth 2.0
- Handle token expiration and refresh
- Connect with mTLS (production only)

### Performance Testing

**Load Test Requirements**
- Simulate typical daily volume (e.g., 800 transactions for medium facility)
- Peak load: 3x typical (morning rush, end-of-day batch)
- Sustained load: Run for 8 hours
- Success criteria: <2% error rate, meet response time SLAs

---

## Integration Patterns for OpenMRS

### Architecture Approach

**NHIE Adapter Module**
- Standalone OpenMRS module
- Handles all NHIE communication
- Provides service interfaces for other modules
- Manages authentication, retry, queueing, audit

**Module Responsibilities**
1. OAuth 2.0 token management (request, cache, refresh)
2. FHIR resource conversion (OpenMRS domain ↔ FHIR)
3. API client (HTTP requests to NHIE endpoints)
4. Queue management (offline transactions)
5. Error handling and retry logic
6. Audit logging
7. Configuration management (NHIE endpoints, credentials)

### Data Flow Examples

**Patient Registration Flow**
1. User enters patient demographics in OpenMRS UI
2. OpenMRS saves Patient to local database
3. NHIE adapter triggered by event listener
4. Adapter converts OpenMRS Patient → FHIR Patient resource
5. Adapter requests OAuth token if expired
6. Adapter POSTs to NHIE /Patient endpoint
7. NHIE returns patient ID (MPI ID)
8. Adapter saves MPI ID as patient identifier in OpenMRS
9. Adapter logs transaction to audit table

**Encounter Submission Flow**
1. Clinician completes encounter form
2. OpenMRS saves Encounter + Observations
3. NHIE adapter triggered by encounter save event
4. Adapter converts Encounter + Observations → FHIR Bundle
5. Adapter validates required fields (diagnosis, provider)
6. Adapter POSTs bundle to NHIE
7. NHIE returns encounter ID
8. Adapter updates OpenMRS encounter with NHIE ID
9. Adapter logs transaction

**Eligibility Check Flow**
1. Receptionist enters NHIS number during registration
2. OpenMRS triggers eligibility check
3. Adapter calls NHIE eligibility operation
4. NHIE queries NHIS backend
5. NHIE returns Coverage resource (active/expired)
6. Adapter stores coverage status as patient attribute
7. UI displays eligibility status to user

**Offline Queue Flow**
1. Network outage detected (NHIE unreachable)
2. Adapter queues all outbound transactions locally
3. User continues normal workflow (unaware of outage)
4. Queue monitor checks connectivity every 60 seconds
5. When connectivity restored, queue processor starts
6. Adapter submits queued transactions with idempotency keys
7. Successfully synced transactions removed from queue
8. Failed transactions flagged for manual review

---

## Reference Documentation

### Kenya HIE (Closest Reference)
- FHIR Implementation Guide: https://build.fhir.org/ig/Kenya-Health-Information-Exchange/hie-implementation-guide/
- Patient profiles, value sets, operation definitions
- Use as template while awaiting Ghana specs

### OpenHIE Architecture
- Official site: https://ohie.org/
- Architecture blueprints
- Component specifications (OpenHIM, Client Registry, SHR)

### HL7 FHIR R4
- Official spec: https://hl7.org/fhir/R4/
- Resource definitions
- REST API operations
- Search parameters

### OpenMRS FHIR2 Module
- Documentation: https://wiki.openmrs.org/display/projects/FHIR2+Module
- Supported resources
- Extension points
- Implementation examples

---

## Next Steps for Implementation

### Phase 1: Discovery (Ongoing)
- Contact MoH Digital Health Unit for NHIE specifications
- Join Ghana eHealth stakeholder meetings
- Study Kenya HIE implementation guide
- Document gaps between Kenya and expected Ghana requirements

### Phase 2: Development Preparation
- Set up development environment with OpenMRS 2.6.0
- Install FHIR2 module and dependencies
- Create NHIE adapter module skeleton
- Implement OAuth 2.0 client
- Build FHIR conversion services

### Phase 3: Sandbox Testing
- Register with NHIE sandbox (when available)
- Implement test scenarios
- Debug integration issues
- Pass conformance tests

### Phase 4: Pilot Deployment
- Deploy to 1-2 pilot facilities
- Monitor real-world transaction volumes
- Gather user feedback
- Optimize performance based on actual usage

### Phase 5: Production Scale
- Apply for NHIE production access
- Deploy to additional facilities
- Provide ongoing support and monitoring
- Iterate based on lessons learned
