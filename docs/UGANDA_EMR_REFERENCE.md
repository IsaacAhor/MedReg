# External References for Ghana EMR Project

## Uganda EMR (METS-Programme) - African Regional Context

**Organization:** https://github.com/METS-Programme  
**Location:** Uganda  
**Relevance:** Production OpenMRS implementation in African context with NHIE-like central sync  
**Last Updated:** Active development (4-5 days ago as of 2025-11-01)  
**License:** Mozilla Public License 2.0 (compatible with OpenMRS, can fork/adapt with attribution)

---

## Critical Repositories for Ghana EMR

### Customization Guidelines (Do not duplicate)
**Guide:** https://mets-programme.gitbook.io/ugandaemr-technical-guide/guidelines-for-customizing-ugandaemr  
**Key Sections to Reuse/Align With:**
- Feature Toggles – enable/disable features without code changes
- Permission Restrictions – granular privileges and role-based access
- Custom Modules – extend via OMODs rather than modifying core/distribution

When documenting OpenMRS customization patterns in this repo, link to the above guide and only capture Ghana-specific deltas (NHIE, NHIS, Ghana Card, folder number) to avoid duplication.

### Metadata Management (Concepts/Locations/Programs)
**Guide:** https://mets-programme.gitbook.io/ugandaemr-technical-guide/metadata-management  
**Reuse Principle:** Defer to this guide for metadata packaging, versioning, and deployment (e.g., concept dictionary, identifier types, locations). In Ghana EMR, define only Ghana-specific metadata; package via metadata modules or deployment bundles rather than ad-hoc SQL.

### Form Management
**Guide:** https://mets-programme.gitbook.io/ugandaemr-technical-guide/form-management  
**Reuse Principle:** Follow form lifecycle/versioning and deployment patterns (e.g., HTML Form Entry/JSON forms as applicable). In this repo, document only Ghana-specific forms and validations; reference this guide for general form management practices.

### Report Development Guidelines
**Guide:** https://mets-programme.gitbook.io/ugandaemr-technical-guide/report-development-guidelines  
**Reuse Principle:** Use the Reporting module patterns (datasets, indicators, parameters). Ghana EMR docs should define only the Ghana-specific reports (OPD register, NHIS vs Cash, top diagnoses, revenue) and link to this guide for framework usage.

### Creating a Custom Module
**Guide:** https://mets-programme.gitbook.io/ugandaemr-technical-guide/creating-a-custom-module  
**Reuse Principle:** Extend OpenMRS via modules (OMOD) instead of modifying core or distributions. Apply the same module scaffolding, dependency, and packaging guidance here; only note Ghana-specific services/controllers.

### Releasing
**Guide:** https://mets-programme.gitbook.io/ugandaemr-technical-guide/releasing  
**Reuse Principle:** Align with release/versioning, tagging, and distribution packaging practices. Ghana EMR should follow similar release checklists; capture only Ghana NHIE/NHIS configuration specifics here.

### 1. openmrs-module-ugandaemr-sync ⭐⭐⭐⭐⭐
**Repository:** https://github.com/METS-Programme/openmrs-module-ugandaemr-sync  
**Language:** Java  
**Forks:** 26  
**Relevance:** **CRITICAL - Direct applicability to NHIE integration**

#### What It Does:
- Syncs OpenMRS data to central REST server using FHIR R4 bundles
- Queue-based async submission with retry logic
- Scheduled tasks for automated data export
- Connection availability checks before sync attempts
- Status tracking (PENDING, SUCCESS, FAILED, DLQ)

#### Key Code Patterns:

**A. FHIR Resource Generation:**
```java
// From SyncFHIRRecord.java
public Collection<SyncFhirResource> generateCaseBasedFHIRResourceBundles(
    SyncFhirProfile syncFhirProfile) {
    // 1. Query OpenMRS data (Patient, Encounter, Observation)
    // 2. Convert to FHIR R4 resources
    // 3. Bundle resources per patient/case
    // 4. Save to sync queue (sync_fhir_resource table)
}
```

**B. Queue-Based Sync with Retry:**
```java
// From SendFhirResourceTask.java (Scheduled Task)
public void execute() {
    UgandaEMRSyncService ugandaEMRSyncService = Context.getService(UgandaEMRSyncService.class);
    SyncFHIRRecord syncFHIRRecord = new SyncFHIRRecord();
    List<SyncFhirProfile> syncFhirProfiles = ugandaEMRSyncService.getAllSyncFhirProfile()
        .stream()
        .filter(syncFhirProfile -> syncFhirProfile.getProfileEnabled())
        .collect(Collectors.toList());

    for (SyncFhirProfile syncFhirProfile : syncFhirProfiles) {
        syncFHIRRecord.sendFhirResourcesTo(syncFhirProfile);
    }
}

// From SyncFHIRRecord.java
public List<Map> sendFhirResourcesTo(SyncFhirProfile syncFhirProfile) {
    List<SyncFhirResource> syncFhirResources = ugandaEMRSyncService.getUnSyncedFHirResources(syncFhirProfile);
    
    for (SyncFhirResource syncFhirResource : syncFhirResources) {
        boolean connectionStatus = ugandaEMRHttpURLConnection.isConnectionAvailable();
        
        if (connectionStatus) {
            // POST FHIR bundle to central server
            Map response = ugandaEMRHttpURLConnection.sendPostBy(...);
            
            if (response.get("responseCode").equals(200)) {
                syncFhirResource.setSynced(true);
                syncFhirResource.setSyncedDate(new Date());
                ugandaEMRSyncService.saveFHIRResource(syncFhirResource);
            }
            // On failure, remains in queue for retry
        }
    }
}
```

**C. Connection Availability Check:**
```java
// From UgandaEMRHttpURLConnection.java
public boolean isConnectionAvailable() {
    try {
        URL url = new URL("http://www.google.com");
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setConnectTimeout(5000);
        connection.connect();
        return connection.getResponseCode() == 200;
    } catch (Exception e) {
        return false;
    }
}
```

#### Database Schema (Relevant Tables):
```sql
-- Sync profiles (e.g., "HIV Data", "OPD Data", "Lab Results")
CREATE TABLE sync_fhir_profile (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(38),
    name VARCHAR(255),
    profile_enabled BOOLEAN,
    sync_limit INT,  -- Max resources per sync batch
    scheduled_task_name VARCHAR(255)
);

-- FHIR resources waiting to sync
CREATE TABLE sync_fhir_resource (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(38),
    generator_profile_id INT,  -- FK to sync_fhir_profile
    resource TEXT,  -- FHIR JSON bundle
    synced BOOLEAN DEFAULT FALSE,
    synced_date DATETIME,
    date_created DATETIME
);

-- Sync cases (patient-specific tracking)
CREATE TABLE sync_fhir_case (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(38),
    profile_id INT,  -- FK to sync_fhir_profile
    patient_id INT,  -- FK to patient
    case_identifier VARCHAR(255),
    date_created DATETIME
);

-- Sync profile logs (audit trail)
CREATE TABLE sync_fhir_profile_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(38),
    profile_id INT,  -- FK to sync_fhir_profile
    resource_type VARCHAR(50),  -- Patient, Encounter, Observation
    sync_date DATETIME,
    status VARCHAR(20)  -- SUCCESS, FAILED
);
```

#### Ghana EMR Adaptation Strategy:

**1. Replace Central Server with NHIE:**
```java
// Ghana: Add OAuth 2.0 token management
public class NHIEAuthService {
    private String accessToken;
    private Date tokenExpiry;
    
    public String getAccessToken() {
        if (accessToken == null || tokenExpiry.before(new Date())) {
            refreshToken();
        }
        return accessToken;
    }
    
    private void refreshToken() {
        // POST to NHIE OAuth endpoint
        Map<String, String> params = new HashMap<>();
        params.put("grant_type", "client_credentials");
        params.put("client_id", NHIE_CLIENT_ID);
        params.put("client_secret", NHIE_CLIENT_SECRET);
        
        Map response = httpClient.postFormData(NHIE_TOKEN_URL, params);
        accessToken = (String) response.get("access_token");
        int expiresIn = (int) response.get("expires_in");
        tokenExpiry = new Date(System.currentTimeMillis() + (expiresIn - 300) * 1000);  // Refresh 5 min early
}
}

---

## Regional HIE Patterns (Kenya)

Organization: Palladium Kenya (KenyaEMR)  
Org Repositories: https://github.com/orgs/palladiumkenya/repositories?type=all

Key repositories to study for middleware mechanics:
- openmrs-module-kenyaemrIL  
  https://github.com/palladiumkenya/openmrs-module-kenyaemrIL  
  Interoperability Layer patterns (routing, queuing, external exchange boundaries).

- SyncAllEMRs  
  https://github.com/palladiumkenya/SyncAllEMRs  
  Synchronization orchestration and cross‑site patterns.

- openmrs-config-kenyaemr  
  https://github.com/palladiumkenya/openmrs-config-kenyaemr  
  Distribution/metadata packaging approach aligned with modular deployments.

- openmrs-content-kenyahmis  
  https://github.com/palladiumkenya/openmrs-content-kenyahmis  
  Content/report assets organization and packaging.

Reuse principle for Ghana:
- Borrow IL mechanics (retries/backoff, transaction logging, DLQ, module boundaries).  
- Do not copy Kenya-specific business logic or direct KHIE endpoints.  
- Strictly adhere to Ghana NHIE rules in AGENTS.md: always route via NHIE; never call NHIA/MPI directly.
// Ghana: Update sync method to use OAuth
public List<Map> sendToNHIE(SyncFhirProfile syncFhirProfile) {
    NHIEAuthService authService = Context.getService(NHIEAuthService.class);
    String token = authService.getAccessToken();
    
    for (SyncFhirResource syncFhirResource : unSyncedResources) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", "Bearer " + token);
        headers.put("Content-Type", "application/fhir+json");
        headers.put("X-Request-ID", UUID.randomUUID().toString());
        
        Map response = httpClient.sendPost(
            NHIE_BASE_URL + "/Patient",  // or /Encounter, /Coverage
            syncFhirResource.getResource(),
            headers
        );
        
        // Handle response codes per AGENTS.md retry policy
        int statusCode = (int) response.get("responseCode");
        if (statusCode == 200 || statusCode == 201) {
            markSynced(syncFhirResource);
        } else if (statusCode == 401) {
            authService.refreshToken();
            retry(syncFhirResource);
        } else if (isRetryable(statusCode)) {
            scheduleRetry(syncFhirResource);
        } else {
            moveToDLQ(syncFhirResource);
        }
    }
}
```

**2. Create Ghana-Specific FHIR Profiles:**
```java
// Ghana: Register NHIE sync profiles on module startup
public void registerGhanaSyncProfiles() {
    // 1. Patient Registration -> NHIE MPI
    SyncFhirProfile patientSync = new SyncFhirProfile();
    patientSync.setName("NHIE Patient Sync");
    patientSync.setProfileEnabled(true);
    patientSync.setSyncLimit(50);  // Max 50 patients per batch
    patientSync.setScheduledTaskName("Send Patients to NHIE");
    saveSyncFhirProfile(patientSync);
    
    // 2. OPD Encounters -> NHIE SHR
    SyncFhirProfile encounterSync = new SyncFhirProfile();
    encounterSync.setName("NHIE Encounter Sync");
    encounterSync.setProfileEnabled(true);
    encounterSync.setSyncLimit(100);
    encounterSync.setScheduledTaskName("Send Encounters to NHIE");
    saveSyncFhirProfile(encounterSync);
    
    // 3. NHIS Coverage Check (pull, not push)
    SyncFhirProfile coverageSync = new SyncFhirProfile();
    coverageSync.setName("NHIS Coverage Check");
    coverageSync.setProfileEnabled(true);
    coverageSync.setScheduledTaskName("Check NHIS Coverage");
    saveSyncFhirProfile(coverageSync);
}
```

**3. Add Exponential Backoff Retry:**
```java
// Ghana: Implement retry policy from AGENTS.md
public void scheduleRetry(SyncFhirResource resource) {
    int retryCount = resource.getRetryCount();
    int[] RETRY_DELAYS_MS = {0, 5000, 30000, 120000, 600000, 3600000, 7200000, 14400000};
    
    if (retryCount >= 8) {
        moveToDLQ(resource);
        return;
    }
    
    int delay = RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)];
    
    // Schedule task to retry after delay
    Timer timer = new Timer();
    timer.schedule(new TimerTask() {
        @Override
        public void run() {
            resource.setRetryCount(retryCount + 1);
            sendToNHIE(resource);
        }
    }, delay);
}
```

#### Why This Matters:
- **Proven in production:** Uganda EMR uses this for national data aggregation
- **Async + queue = resilient:** Network outages don't lose data, just delays sync
- **FHIR R4 compatible:** NHIE expects FHIR, Uganda already does this
- **African context:** Designed for unreliable networks, frequent power outages

---

### 2. openmrs-module-ugandaemr ⭐⭐⭐⭐
**Repository:** https://github.com/METS-Programme/openmrs-module-ugandaemr  
**Language:** Java  
**Forks:** 29  
**Stars:** 1  
**Relevance:** Core OpenMRS module architecture, identifier generation, queue management

#### What It Does:
- Core Uganda EMR customizations
- Patient identifier generation (UIC - Unique Identification Code)
- Queue management system (triage -> clinician -> pharmacy -> dispensary)
- Custom validators (NIN - National Identification Number)
- Transfer in/out tracking
- Service/DAO/REST controller patterns

#### Key Code Patterns:

**A. Patient Identifier Generation:**
```java
// From UgandaEMRServiceImpl.java - UIC generation algorithm
public String generatePatientUIC(Patient patient) {
    String familyNameCode = "";
    String givenNameCode = "";
    String middleNameCode = "";
    String countryCode = "";
    String genderCode = "";
    Date dob = patient.getBirthdate();
    
    if (dob == null) {
        return null;
    }
    
    Calendar cal = Calendar.getInstance();
    cal.setTime(dob);
    String monthCode = "";
    String year = (cal.get(Calendar.YEAR) + "").substring(2, 4);
    
    if (cal.get(Calendar.MONTH) <= 8) {
        monthCode = "0" + (cal.get(Calendar.MONTH) + 1);
    } else {
        monthCode = "" + (cal.get(Calendar.MONTH) + 1);
    }
    
    if (patient.getGender().equals("F")) {
        genderCode = "2";
    } else {
        genderCode = "1";
    }
    
    if (patient.getPerson().getPersonAddress() != null && 
        !patient.getPerson().getPersonAddress().getCountry().isEmpty()) {
        countryCode = patient.getPerson().getPersonAddress()
                              .getCountry().substring(0, 2).toUpperCase();
    } else {
        countryCode = "XX";
    }
    
    if (patient.getFamilyName() != null && !patient.getFamilyName().isEmpty()) {
        String firstLetter = replaceLettersWithNumber(patient.getFamilyName().substring(0, 1));
        String secondLetter = replaceLettersWithNumber(patient.getFamilyName().substring(1, 2));
        String thirdLetter = replaceLettersWithNumber(patient.getFamilyName().substring(2, 3));
        familyNameCode = firstLetter + secondLetter + thirdLetter;
    } else {
        familyNameCode = "X";
    }
    
    // Similar encoding for given name and middle name
    
    return countryCode + "-" + monthCode + year + "-" + genderCode + "-" + givenNameCode + familyNameCode + middleNameCode;
}

// Example UIC: UG-0123-1-ABC123X (Uganda, Jan 2023, Male, name codes)
```

**Ghana Adaptation:**
```java
// Ghana Folder Number: GA-KBTH-2025-000123 (region-facility-year-sequence)
public String generateGhanaFolderNumber(String facilityCode, String regionCode) {
    int year = LocalDate.now().getYear();
    String prefix = regionCode + "-" + facilityCode + "-" + year;
    
    // Thread-safe sequence using database lock
    int nextSequence = getNextSequence(prefix);
    
    return String.format("%s-%06d", prefix, nextSequence);
}

// Thread-safe sequence increment
@Transactional
private int getNextSequence(String prefix) {
    // SELECT last_seq FROM folder_number_sequence WHERE prefix = :prefix FOR UPDATE
    FolderNumberSequence sequence = dao.getSequenceForUpdate(prefix);
    
    if (sequence == null) {
        sequence = new FolderNumberSequence(prefix, 0);
        dao.saveSequence(sequence);
    }
    
    sequence.setLastSeq(sequence.getLastSeq() + 1);
    dao.saveSequence(sequence);
    
    return sequence.getLastSeq();
}
```

**B. Queue Management System:**
```java
// From UgandaEMRServiceImpl.java - Check-in patient to queue
public CheckInPatient checkInPatient(Patient patient, 
                                     Location currentLocation, 
                                     Location locationTo, 
                                     Location queueRoom, 
                                     Provider provider, 
                                     String visitComment, 
                                     String patientStatus, 
                                     String visitTypeUuid,
                                     Integer priority) {
    PatientQueue patientQueue = new PatientQueue();
    PatientQueueingService patientQueueingService = Context.getService(PatientQueueingService.class);
    
    if (patientStatus != null && patientStatus.equals("emergency")) {
        patientQueue.setPriority(priority == null ? 0 : priority);
        patientQueue.setPriorityComment(patientStatus);
    }
    
    if (visitComment != null) {
        patientQueue.setComment(visitComment);
    }
    
    Visit visit = createVisitForToday(patient, currentLocation.getParentLocation(), visitTypeUuid);
    patientQueue.setLocationFrom(currentLocation);
    patientQueue.setPatient(patient);
    patientQueue.setLocationTo(locationTo);
    patientQueue.setQueueRoom(queueRoom);
    patientQueue.setProvider(provider);
    patientQueue.setStatus(PatientQueue.Status.PENDING);
    patientQueue.setCreator(Context.getAuthenticatedUser());
    patientQueue.setDateCreated(new Date());
    patientQueueingService.assignVisitNumberForToday(patientQueue);
    patientQueueingService.savePatientQue(patientQueue);
    
    CheckInPatient checkInPatient = new CheckInPatient();
    checkInPatient.setPatientQueue(patientQueue);
    checkInPatient.setVisit(visit);
    
    return checkInPatient;
}
```

**Ghana Adaptation:**
```java
// Ghana OPD workflow: Triage -> Consultation -> Pharmacy -> Billing
public enum OPDStation {
    TRIAGE("Triage", "triage"),
    CONSULTATION("Consultation", "consultation"),
    PHARMACY("Pharmacy", "pharmacy"),
    BILLING("Billing", "billing");
}

public class GhanaPatientQueueService {
    
    // Register patient and send to triage
    public PatientQueue registerAndQueue(Patient patient, String visitType) {
        Visit visit = createOPDVisit(patient);
        
        PatientQueue queue = new PatientQueue();
        queue.setPatient(patient);
        queue.setVisit(visit);
        queue.setLocationFrom(getReceptionLocation());
        queue.setLocationTo(getTriageLocation());
        queue.setStatus(PatientQueue.Status.PENDING);
        queue.setQueueNumber(generateQueueNumber());  // T001, T002, ...
        queue.setDateCreated(new Date());
        
        return patientQueueingService.savePatientQue(queue);
    }
    
    // Move patient to next station
    public PatientQueue moveToNextStation(PatientQueue currentQueue, OPDStation nextStation) {
        currentQueue.setStatus(PatientQueue.Status.COMPLETED);
        patientQueueingService.savePatientQue(currentQueue);
        
        PatientQueue newQueue = new PatientQueue();
        newQueue.setPatient(currentQueue.getPatient());
        newQueue.setVisit(currentQueue.getVisit());
        newQueue.setLocationFrom(currentQueue.getLocationTo());
        newQueue.setLocationTo(getStationLocation(nextStation));
        newQueue.setStatus(PatientQueue.Status.PENDING);
        newQueue.setQueueNumber(generateQueueNumber(nextStation));
        
        return patientQueueingService.savePatientQue(newQueue);
    }
}
```

**C. Custom Identifier Validator:**
```java
// From NINIdentifierValidator.java (Uganda NIN)
public class NINIdentifierValidator implements IdentifierValidator {
    
    private static final String ALLOWED_CHARS = "ABCDEFGHJKLMNPRSTUVWXY";
    
    @Override
    public boolean isValid(String identifier) {
        if (identifier == null || identifier.length() != 14) {
            return false;
        }
        
        // Format: CM12345678ABC (2 letters + 8 digits + 3 letters)
        if (!Character.isLetter(identifier.charAt(0)) || 
            !Character.isLetter(identifier.charAt(1))) {
            return false;
        }
        
        for (int i = 2; i < 10; i++) {
            if (!Character.isDigit(identifier.charAt(i))) {
                return false;
            }
        }
        
        for (int i = 10; i < 13; i++) {
            if (!Character.isLetter(identifier.charAt(i)) || 
                !ALLOWED_CHARS.contains(String.valueOf(identifier.charAt(i)))) {
                return false;
            }
        }
        
        return true;
    }
}
```

**Ghana Adaptation:**
```java
// Ghana Card Validator with Luhn checksum
public class GhanaCardValidator implements IdentifierValidator {
    
    @Override
    public boolean isValid(String identifier) {
        if (identifier == null) {
            return false;
        }
        
        // Normalize: uppercase, strip spaces
        identifier = identifier.toUpperCase().replaceAll("\\s", "");
        
        // Format: GHA-XXXXXXXXX-X (3 chars + hyphen + 9 digits + hyphen + 1 check digit)
        if (!identifier.matches("^GHA-\\d{9}-\\d$")) {
            return false;
        }
        
        // Validate Luhn checksum
        String digits = identifier.replaceAll("[^0-9]", "");  // Extract 10 digits
        if (digits.length() != 10) {
            return false;
        }
        
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
}

// Register validator in module activator
public class GhanaEMRActivator extends BaseModuleActivator {
    @Override
    public void started() {
        PatientIdentifierType ghanaCardType = 
            patientService.getPatientIdentifierTypeByUuid(GHANA_CARD_IDENTIFIER_TYPE_UUID);
        ghanaCardType.setValidator(new GhanaCardValidator());
        patientService.savePatientIdentifierType(ghanaCardType);
    }
}
```

---

### 3. openmrs-module-ugandaemr-reports ⭐⭐⭐
**Repository:** https://github.com/METS-Programme/openmrs-module-ugandaemr-reports  
**Language:** Java  
**Forks:** 38  
**Stars:** 2  
**Relevance:** Government reporting module structure

#### What It Does:
- MoH-required reports generation
- DHIS2 integration for national reporting
- SQL-based report queries
- Report scheduling and export (Excel, PDF, CSV)

#### Key Code Patterns:

**Report Definition Example:**
```java
// Uganda OPD Register Report (similar to Ghana MoH requirements)
public class OPDRegisterReport extends AbstractReport {
    
    public DataSetDefinition constructDataSetDefinition() {
        SqlDataSetDefinition dataSet = new SqlDataSetDefinition();
        dataSet.setName("OPD Register");
        dataSet.setSqlQuery(getOPDRegisterQuery());
        return dataSet;
    }
    
    private String getOPDRegisterQuery() {
        return "SELECT " +
               "  pi.identifier AS folder_number, " +
               "  CONCAT(pn.given_name, ' ', pn.family_name) AS patient_name, " +
               "  p.gender, " +
               "  TIMESTAMPDIFF(YEAR, p.birthdate, e.encounter_datetime) AS age, " +
               "  e.encounter_datetime AS visit_date, " +
               "  GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') AS diagnoses, " +
               "  CASE WHEN pa.value_text IS NOT NULL THEN 'NHIS' ELSE 'CASH' END AS payment_type, " +
               "  e.visit_id " +
               "FROM encounter e " +
               "INNER JOIN patient pt ON e.patient_id = pt.patient_id " +
               "INNER JOIN person p ON pt.patient_id = p.person_id " +
               "INNER JOIN person_name pn ON p.person_id = pn.person_id " +
               "INNER JOIN patient_identifier pi ON pt.patient_id = pi.patient_id " +
               "LEFT JOIN obs o ON e.encounter_id = o.encounter_id AND o.voided = 0 " +
               "LEFT JOIN concept c ON o.value_coded = c.concept_id " +
               "LEFT JOIN person_attribute pa ON p.person_id = pa.person_id " +
               "  AND pa.person_attribute_type_id = (SELECT person_attribute_type_id FROM person_attribute_type WHERE uuid = 'nhis_number_uuid') " +
               "WHERE e.encounter_type = (SELECT encounter_type_id FROM encounter_type WHERE uuid = 'opd_encounter_uuid') " +
               "  AND e.encounter_datetime BETWEEN :startDate AND :endDate " +
               "  AND e.voided = 0 " +
               "GROUP BY e.encounter_id " +
               "ORDER BY e.encounter_datetime";
    }
}
```

**Ghana Adaptation:**
```java
// Ghana MoH OPD Register (from AGENTS.md requirements)
public class GhanaOPDRegisterReport extends AbstractReport {
    
    public DataSetDefinition constructDataSetDefinition() {
        SqlDataSetDefinition dataSet = new SqlDataSetDefinition();
        dataSet.setName("Ghana OPD Register");
        dataSet.setSqlQuery(getGhanaOPDRegisterQuery());
        dataSet.addParameter(new Parameter("startDate", "Start Date", Date.class));
        dataSet.addParameter(new Parameter("endDate", "End Date", Date.class));
        return dataSet;
    }
    
    private String getGhanaOPDRegisterQuery() {
        return "SELECT " +
               "  pi_folder.identifier AS folder_number, " +
               "  pi_ghana.identifier AS ghana_card, " +
               "  CONCAT(pn.given_name, ' ', pn.family_name) AS patient_name, " +
               "  p.gender, " +
               "  TIMESTAMPDIFF(YEAR, p.birthdate, e.encounter_datetime) AS age, " +
               "  e.encounter_datetime AS visit_date, " +
               "  " +
               "  -- Get vitals from observations" +
               "  MAX(CASE WHEN c_vitals.uuid = 'weight_concept_uuid' THEN o_vitals.value_numeric END) AS weight, " +
               "  MAX(CASE WHEN c_vitals.uuid = 'bp_systolic_uuid' THEN o_vitals.value_numeric END) AS bp_systolic, " +
               "  MAX(CASE WHEN c_vitals.uuid = 'bp_diastolic_uuid' THEN o_vitals.value_numeric END) AS bp_diastolic, " +
               "  MAX(CASE WHEN c_vitals.uuid = 'temperature_uuid' THEN o_vitals.value_numeric END) AS temperature, " +
               "  " +
               "  -- Get diagnoses" +
               "  GROUP_CONCAT(DISTINCT CONCAT(c_diag.name, ' (', c_diag.concept_code, ')') SEPARATOR '; ') AS diagnoses, " +
               "  " +
               "  -- Get prescriptions" +
               "  GROUP_CONCAT(DISTINCT CONCAT(drug.name, ' ', do.dose, ' ', do.dose_units, ' ', do.frequency, ' x ', do.duration, ' ', do.duration_units) SEPARATOR '; ') AS prescriptions, " +
               "  " +
               "  -- Payment type (NHIS vs Cash)" +
               "  CASE WHEN pa_nhis.value_text IS NOT NULL THEN 'NHIS' ELSE 'CASH' END AS payment_type, " +
               "  pa_nhis.value_text AS nhis_number, " +
               "  " +
               "  -- Provider" +
               "  CONCAT(provider_pn.given_name, ' ', provider_pn.family_name) AS provider_name " +
               "FROM encounter e " +
               "INNER JOIN patient pt ON e.patient_id = pt.patient_id " +
               "INNER JOIN person p ON pt.patient_id = p.person_id " +
               "INNER JOIN person_name pn ON p.person_id = pn.person_id AND pn.voided = 0 " +
               "INNER JOIN patient_identifier pi_folder ON pt.patient_id = pi_folder.patient_id " +
               "  AND pi_folder.identifier_type = (SELECT patient_identifier_type_id FROM patient_identifier_type WHERE uuid = 'folder_number_uuid') " +
               "LEFT JOIN patient_identifier pi_ghana ON pt.patient_id = pi_ghana.patient_id " +
               "  AND pi_ghana.identifier_type = (SELECT patient_identifier_type_id FROM patient_identifier_type WHERE uuid = 'ghana_card_uuid') " +
               "LEFT JOIN obs o_vitals ON e.encounter_id = o_vitals.encounter_id AND o_vitals.voided = 0 " +
               "LEFT JOIN concept c_vitals ON o_vitals.concept_id = c_vitals.concept_id " +
               "LEFT JOIN obs o_diag ON e.encounter_id = o_diag.encounter_id AND o_diag.voided = 0 " +
               "  AND o_diag.concept_id = (SELECT concept_id FROM concept WHERE uuid = 'diagnosis_concept_uuid') " +
               "LEFT JOIN concept c_diag ON o_diag.value_coded = c_diag.concept_id " +
               "LEFT JOIN drug_order do ON e.encounter_id = do.encounter_id AND do.voided = 0 " +
               "LEFT JOIN drug ON do.drug_inventory_id = drug.drug_id " +
               "LEFT JOIN person_attribute pa_nhis ON p.person_id = pa_nhis.person_id " +
               "  AND pa_nhis.person_attribute_type_id = (SELECT person_attribute_type_id FROM person_attribute_type WHERE uuid = 'nhis_number_attribute_uuid') " +
               "LEFT JOIN encounter_provider ep ON e.encounter_id = ep.encounter_id " +
               "LEFT JOIN provider ON ep.provider_id = provider.provider_id " +
               "LEFT JOIN person provider_person ON provider.person_id = provider_person.person_id " +
               "LEFT JOIN person_name provider_pn ON provider_person.person_id = provider_pn.person_id AND provider_pn.voided = 0 " +
               "WHERE e.encounter_type = (SELECT encounter_type_id FROM encounter_type WHERE uuid = 'opd_consultation_uuid') " +
               "  AND e.encounter_datetime BETWEEN :startDate AND :endDate " +
               "  AND e.voided = 0 " +
               "GROUP BY e.encounter_id " +
               "ORDER BY e.encounter_datetime, pi_folder.identifier";
    }
}
```

---

### 4. esm-ugandaemr-core ⭐⭐⭐
**Repository:** https://github.com/METS-Programme/esm-ugandaemr-core  
**Language:** TypeScript  
**Forks:** 29  
**Stars:** 5  
**Relevance:** OpenMRS 3.x (O3) implementation in African context

#### What It Does:
- OpenMRS 3.x microfrontend built on OHRI (OpenMRS HIV Reference Implementation)
- Modern React + TypeScript + Carbon Design System
- Login, patient chart, navigation modules
- Shows O3 is production-ready in African healthcare context

#### Why This Matters for Ghana EMR:
- **Post-MVP option:** If we adopt O3 after MVP, Uganda has already solved African-specific UI challenges
- **Proven in production:** METS-Programme uses this in live facilities
- **Community support:** Active development, bug fixes, feature updates
- **Backend compatibility:** Runs on same OpenMRS 2.x backend (no platform upgrade needed)

#### Decision:
Per AGENTS.md "OpenMRS 2.x vs O3" decision matrix:
- **MVP:** Stick with OpenMRS 2.6.0 Platform + Next.js frontend (Option B)
- **Post-MVP (v2):** Consider migrating frontend to O3 if:
  - Ghana MoH requires O3 UI standards
  - Community adoption increases
  - We need mobile-responsive UI
  - Uganda EMR O3 modules mature further

---

### 5. ugandaemr-metadata ⭐⭐
**Repository:** https://github.com/METS-Programme/ugandaemr-metadata  
**Language:** Metadata files (JSON, XML)  
**Relevance:** Metadata deployment patterns

#### What It Does:
- Metadata initializer patterns (concepts, forms, encounter types, programs)
- Liquibase migrations for metadata
- Auto-setup on module startup

#### Key Code Patterns:

**Metadata Initializer (from ugandaemr module):**
```java
// From UgandaEMRActivator.java
public class UgandaEMRActivator extends BaseModuleActivator {
    
    @Override
    public void started() {
        UgandaEMRService ugandaEMRService = Context.getService(UgandaEMRService.class);
        
        // Install metadata bundles
        ugandaEMRService.installCommonMetadata();
        
        // Initialize forms
        ugandaEMRService.initialiseForms();
        
        // Set facility location
        ugandaEMRService.setHealthFacilityLocation();
        
        // Generate OpenMRS IDs for patients without
        ugandaEMRService.generateOpenMRSIdentifierForPatientsWithout();
        
        log.info("UgandaEMR Module started successfully");
    }
}

// From CommonMetadataBundle.java (using metadatadeploy module)
public class CommonMetadataBundle extends AbstractMetadataBundle {
    
    @Override
    public void install() throws Exception {
        // Install encounter types
        install(encounterType("OPD Consultation", 
                              "Outpatient Department Consultation", 
                              "opd_consultation_uuid"));
        
        // Install visit types
        install(visitType("OPD Visit", 
                          "Outpatient Department Visit", 
                          "opd_visit_uuid"));
        
        // Install identifier types
        install(patientIdentifierType("Ghana Card", 
                                      "National ID Card", 
                                      "^GHA-\\d{9}-\\d$", 
                                      new GhanaCardValidator(), 
                                      "ghana_card_uuid"));
        
        // Install concepts
        install(concept("Blood Pressure", 
                        "Numeric", 
                        "mm Hg", 
                        "bp_concept_uuid"));
    }
}
```

**Ghana Adaptation:**
```java
// Ghana Metadata Bundle
public class GhanaEMRMetadataBundle extends AbstractMetadataBundle {
    
    @Override
    public void install() throws Exception {
        // Ghana-specific encounter types
        install(encounterType("OPD Triage", "Triage encounter for vital signs", "ghana_opd_triage_uuid"));
        install(encounterType("OPD Consultation", "Doctor consultation", "ghana_opd_consultation_uuid"));
        install(encounterType("Pharmacy Dispense", "Medication dispensing", "ghana_pharmacy_dispense_uuid"));
        
        // Ghana-specific visit types
        install(visitType("OPD Visit", "Outpatient department visit", "ghana_opd_visit_uuid"));
        install(visitType("Emergency Visit", "Emergency department visit", "ghana_emergency_visit_uuid"));
        
        // Ghana-specific identifier types
        install(patientIdentifierType("Ghana Card", 
                                      "National ID Card (GHA-XXXXXXXXX-X)", 
                                      "^GHA-\\d{9}-\\d$", 
                                      new GhanaCardValidator(), 
                                      "ghana_card_uuid"));
        install(patientIdentifierType("Folder Number", 
                                      "Facility folder number (GA-KBTH-2025-000123)", 
                                      "^[A-Z]{2}-[A-Z]{4}-\\d{4}-\\d{6}$", 
                                      null, 
                                      "folder_number_uuid"));
        install(patientIdentifierType("NHIS Number", 
                                      "National Health Insurance Scheme Number", 
                                      "^\\d{10}$", 
                                      null, 
                                      "nhis_number_uuid"));
        
        // Ghana-specific person attributes
        install(personAttributeType("NHIS Number", 
                                    "National Health Insurance Number", 
                                    String.class, 
                                    null, 
                                    false, 
                                    1.0, 
                                    "nhis_number_attribute_uuid"));
        
        // Top 20 Ghana OPD diagnoses
        installGhanaDiagnoses();
        
        // Ghana essential medicines
        installGhanaMedicines();
        
        // Ghana-specific locations
        installGhanaLocations();
    }
    
    private void installGhanaDiagnoses() {
        // Malaria
        install(concept("Malaria (uncomplicated)", "Coded", null, "B54", "malaria_concept_uuid"));
        
        // URTI
        install(concept("Upper respiratory tract infection", "Coded", null, "J06.9", "urti_concept_uuid"));
        
        // Hypertension
        install(concept("Hypertension", "Coded", null, "I10", "hypertension_concept_uuid"));
        
        // ... remaining 17 diagnoses from AGENTS.md
    }
    
    private void installGhanaMedicines() {
        // Antimalarials
        install(drug("Artemether-Lumefantrine 20/120mg Tablet", 
                     "ACT", 
                     "artemether_lumefantrine_uuid"));
        
        // Antibiotics
        install(drug("Amoxicillin 500mg Capsule", 
                     "Antibiotic", 
                     "amoxicillin_500_uuid"));
        
        // Analgesics
        install(drug("Paracetamol 500mg Tablet", 
                     "Analgesic", 
                     "paracetamol_500_uuid"));
        
        // ... remaining essential medicines from AGENTS.md
    }
    
    private void installGhanaLocations() {
        // Ghana regions as location tags
        install(locationTag("Greater Accra", "Greater Accra Region", "greater_accra_tag_uuid"));
        install(locationTag("Ashanti", "Ashanti Region", "ashanti_tag_uuid"));
        // ... remaining 14 regions
        
        // Facility locations (example for Korle Bu)
        Location kbth = install(location("Korle Bu Teaching Hospital", 
                                         "Main referral hospital", 
                                         "kbth_uuid"));
        install(location("KBTH OPD", 
                         "Outpatient Department", 
                         "kbth_opd_uuid", 
                         kbth));
        install(location("KBTH Triage", 
                         "Triage Station", 
                         "kbth_triage_uuid", 
                         kbth));
        install(location("KBTH Consultation Room 1", 
                         "Consultation Room", 
                         "kbth_consult1_uuid", 
                         kbth));
        install(location("KBTH Pharmacy", 
                         "Pharmacy Dispensary", 
                         "kbth_pharmacy_uuid", 
                         kbth));
    }
}
```

---

### 6. ugandaemr-technicalguide ⭐⭐
**Repository:** https://github.com/METS-Programme/ugandaemr-technicalguide  
**Language:** Markdown documentation  
**Relevance:** OpenMRS development best practices

#### What It Contains:
- Module development guide
- REST API usage patterns
- Database schema documentation
- Deployment procedures
- Troubleshooting guide

#### Ghana Use:
- Reference for OpenMRS module development
- API usage examples
- Database design patterns
- Deployment checklists

---

## Implementation Priority for Ghana EMR

### Phase 1 (Week 2-4): Core Patterns
1. **Patient Identifier Generation:** Adapt Uganda UIC algorithm to Ghana folder number format
2. **Custom Validators:** Implement Ghana Card validator based on Uganda NIN pattern
3. **Queue Management:** Implement OPD workflow (triage -> consultation -> pharmacy) based on Uganda queue system

### Phase 2 (Week 5-8): NHIE Integration
1. **Sync Module Architecture:** Fork `openmrs-module-ugandaemr-sync` and adapt for NHIE
2. **OAuth 2.0 Integration:** Add token management (Uganda uses basic auth, Ghana needs OAuth)
3. **FHIR Resource Generation:** Reuse Uganda FHIR R4 patterns, adapt to NHIE profiles
4. **Retry Logic:** Implement exponential backoff from AGENTS.md using Uganda queue patterns

### Phase 3 (Week 9-12): Reports & UI
1. **MoH Reports:** Adapt Uganda report queries for Ghana MoH requirements
2. **Queue UI:** Build Next.js queue management screens based on Uganda REST API patterns
3. **Metadata Deployment:** Implement Ghana metadata bundle using Uganda initializer patterns

### Phase 4 (Week 13-16): Testing & Pilot
1. **Integration Testing:** Test NHIE sync with Uganda-style scheduled tasks
2. **Load Testing:** Verify queue system handles 50+ patients/day
3. **Pilot Deployment:** Deploy to pilot facility using Uganda deployment guide

---

## License Compliance

**Uganda EMR License:** Mozilla Public License 2.0 (MPL 2.0)

**Ghana EMR Obligations:**
1. [DONE] **Can use:** Fork, modify, adapt Uganda EMR code for Ghana EMR
2. [DONE] **Can distribute:** Deploy Ghana EMR to multiple facilities
3. [DONE] **Can commercialize:** Charge for support/hosting (if applicable)
4. [WARNING] **Must attribute:** Include copyright notice in modified files
5. [WARNING] **Must disclose source:** If we modify Uganda EMR modules, must make source available
6. [WARNING] **Must use same license:** Ghana-specific modules built on Uganda code must be MPL 2.0

**Recommended Approach:**
1. Create separate `openmrs-module-ghanaemr` module (not fork of ugandaemr)
2. Reference Uganda patterns, but implement Ghana-specific logic
3. Add attribution in module README: "Inspired by METS-Programme/openmrs-module-ugandaemr"
4. Keep Ghana EMR repo public on GitHub (align with MPL 2.0 spirit)

---

## Contact METS-Programme

If we need clarification on implementation patterns or licensing:
- **GitHub:** Open issue on relevant repository
- **OpenMRS Talk:** Post in community forums (https://talk.openmrs.org/)
- **Direct Contact:** Check repository READMEs for maintainer contacts

**Note:** Uganda EMR is actively maintained (last update 4-5 days ago), so community is responsive.

---

## Summary

**METS-Programme (Uganda EMR) is HIGHLY RELEVANT to Ghana EMR project:**

[DONE] **Central server sync module** - Exactly what we need for NHIE integration  
[DONE] **Queue management system** - Perfect for Ghana OPD workflow  
[DONE] **Identifier generation patterns** - Adapt UIC algorithm to Ghana folder number  
[DONE] **Government reporting** - Similar MoH requirements  
[DONE] **OpenMRS 3.x experience** - Post-MVP migration path  
[DONE] **African context** - Proven in production with similar challenges (power, network)  
[DONE] **License compatible** - MPL 2.0 allows fork/adapt with attribution  
[DONE] **Active maintenance** - Community responsive, regular updates  

**Recommended Action:** Add all 6 repositories to Ghana EMR documentation with specific code adaptation strategies. Reference throughout Week 2-16 development.
