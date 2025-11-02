# UgandaEMR DHIS2 Integration Module: Analysis and Recommendations

**Date:** November 1, 2025

## 1. Introduction

This document provides an analysis of the UgandaEMR DHIS2 integration module, based on the file structure and common OpenMRS development patterns found in the `METS-Programme/openmrs-module-ugandaemr-reports` repository.

The goal is to extract actionable insights that can be directly applied to the development of the **NHIE Patient Sync** feature for the Ghana EMR project, as defined in `IMPLEMENTATION_TRACKER.md` and `AGENTS.md`.

The analysis focuses on three key areas:
1.  **Data Mapping:** Transforming internal OpenMRS data to an external format.
2.  **API Client Implementation:** Managing HTTP communication and authentication.
3.  **Background Jobs & Retry Logic:** Ensuring reliable, asynchronous data submission.

---

## 2. Analysis of the UgandaEMR DHIS2 Module

The integration appears to be centered around a dedicated `dhis2-integration` sub-module within the main reports module. Key files identified are `DHIS2ServiceImpl.java`, `DHIS2Utils.java`, and `DHIS2Metadata.java`.

### 2.1. Data Mapping

**How it Works in UgandaEMR:**

The data mapping process is likely driven by the OpenMRS Reporting Framework.

1.  **Report Execution:** A service method in `DHIS2ServiceImpl.java` probably takes an OpenMRS `ReportDefinition` as a parameter. It executes this report to get a `DataSet`.
2.  **Data Transformation:** The code iterates through the rows of the `DataSet`. For each row, it extracts values (e.g., patient counts, observation values).
3.  **Metadata Mapping:** The `DHIS2Metadata.java` file or a similar mechanism likely holds the mappings between OpenMRS concepts/identifiers and the required DHIS2 UIDs (Data Element UID, Category Option Combo UID, etc.).
4.  **Payload Construction:** The transformed data is then assembled into a `DHIS2Data` Plain Old Java Object (POJO), which directly models the JSON structure required by the DHIS2 `dataValueSets` API endpoint.

**Adoption for Ghana NHIE Integration:**

This pattern is directly transferable for building the **FHIR R4 Patient resource mapper**.

*   **Create a `GhanaPatientToFhirMapper.java` class.** This class will be responsible for converting an OpenMRS `Patient` object into a HAPI FHIR `Patient` resource.
*   **Use a dedicated `NHIEFhirMapping.java` class** (similar to `DHIS2Metadata.java`) to store the canonical URIs for Ghana-specific identifiers, as defined in `AGENTS.md`:
    *   Ghana Card: `http://moh.gov.gh/fhir/identifier/ghana-card`
    *   NHIS Number: `http://moh.gov.gh/fhir/identifier/nhis`
    *   Folder Number: `http://moh.gov.gh/fhir/identifier/folder-number`
*   **Implement the Mapping Logic:** The mapper service will take an OpenMRS `Patient` object, create a new HAPI FHIR `Patient` resource, and populate it by mapping the fields.

**Example Snippet (for `GhanaPatientToFhirMapper.java`):**
```java
public org.hl7.fhir.r4.model.Patient toFhirPatient(org.openmrs.Patient openmrsPatient) {
    org.hl7.fhir.r4.model.Patient fhirPatient = new org.hl7.fhir.r4.model.Patient();

    // 1. Map Identifiers
    PatientIdentifier ghanaCard = openmrsPatient.getPatientIdentifier("Ghana Card");
    if (ghanaCard != null) {
        fhirPatient.addIdentifier()
            .setSystem(NHIEFhirMapping.GHANA_CARD_SYSTEM)
            .setValue(ghanaCard.getIdentifier());
    }
    // ... map NHIS and Folder Number similarly

    // 2. Map Name
    PersonName name = openmrsPatient.getPersonName();
    fhirPatient.addName()
        .setFamily(name.getFamilyName())
        .addGiven(name.getGivenName());

    // 3. Map Gender, Birthdate, etc.
    // ...

    return fhirPatient;
}
```

### 2.2. API Client Implementation

**How it Works in UgandaEMR:**

The API client is likely a utility class that handles the direct HTTP communication.

1.  **HTTP Client:** `DHIS2Utils.java` probably uses a standard Java HTTP client library like Apache HttpClient.
2.  **Authentication:** DHIS2 typically uses HTTP Basic Authentication. The client likely reads a username and password from OpenMRS Global Properties, Base64 encodes them, and adds them to the `Authorization` header of every request.
3.  **Request Execution:** A method like `sendData(DHIS2Data data)` would serialize the `DHIS2Data` object to a JSON string, create an `HttpPost` request to the DHIS2 API endpoint, set the `Content-Type` and `Authorization` headers, and execute the request.

**Adoption for Ghana NHIE Integration:**

The Ghana NHIE requires a more modern OAuth 2.0 Client Credentials flow, as specified in `AGENTS.md`. Your `NHIEHttpClient` will be more complex than the UgandaEMR equivalent.

*   **Use a Robust HTTP Client:** Use a modern library like OkHttp or Apache HttpClient 5.x.
*   **Implement Token Management:**
    *   Create a dedicated `NHIETokenManager.java` service.
    *   This service will be responsible for requesting an access token from the NHIE OAuth endpoint (`https://nhie-sandbox.moh.gov.gh/oauth/token`).
    *   It must cache the token in memory (e.g., in a `volatile` variable or a `ConcurrentHashMap`).
    *   It should implement the **proactive token refresh** logic mentioned in `AGENTS.md` (refreshing 5 minutes before expiry).
*   **Create an `AuthorizationInterceptor`:** Use the interceptor pattern in your HTTP client to automatically add the `Authorization: Bearer {access_token}` header to every outgoing request to the NHIE FHIR endpoints. This separates the concern of authentication from the business logic of the API calls.

**Example Snippet (for `NHIETokenManager.java`):**
```java
@Service
public class NHIETokenManager {
    private volatile String accessToken;
    private volatile Instant tokenExpiry;

    @Scheduled(fixedRate = 60000) // Check every minute
    public void refreshTokenIfNeeded() {
        if (accessToken == null || Instant.now().isAfter(tokenExpiry.minus(5, ChronoUnit.MINUTES))) {
            // Logic to call NHIE OAuth endpoint and get a new token
            // Update accessToken and tokenExpiry
        }
    }

    public String getAccessToken() {
        if (accessToken == null) {
            refreshTokenIfNeeded();
        }
        return accessToken;
    }
}
```

### 2.3. Background Jobs & Retry Logic

**How it Works in UgandaEMR:**

While some actions might be synchronous, a robust implementation would use the OpenMRS Scheduler for background processing.

1.  **Scheduler Task:** A class implementing the OpenMRS `Task` interface would be defined.
2.  **Task Configuration:** This task would be configured in the module's `config.xml` to run on a schedule (e.g., every 15 minutes).
3.  **Execution Logic:** The `execute()` method of the task would query for reports or data that have not yet been sent to DHIS2, and then call the `DHIS2Service` to send them.
4.  **Retry Logic:** Retries are likely implemented as a simple loop within the service method, attempting a request a few times before marking it as failed. A persistent queue is less likely but possible.

**Adoption for Ghana NHIE Integration:**

Your project plan in `AGENTS.md` and `IMPLEMENTATION_TRACKER.md` specifies a more resilient, database-backed queuing and retry mechanism. This is a significant improvement over a simple, in-memory retry loop.

*   **Create a Transaction Log Table:** Implement the `nhie_transaction_log` table exactly as specified in `AGENTS.md`. This is your persistent queue.
*   **Use Spring's `@Async` and `@Scheduled`:**
    *   When a patient is registered, the main thread should save the patient to the local DB and create a record in `nhie_transaction_log` with `status = 'PENDING'`.
    *   A separate, asynchronous method annotated with `@Async` should then be called to make the *first* attempt to send the data to the NHIE.
*   **Implement a Scheduled Retry Job:**
    *   Create a service with a `@Scheduled` method that runs periodically (e.g., every 5 minutes).
    *   This job will query the `nhie_transaction_log` for records with `status = 'FAILED'` and a `retry_count < 8`.
    *   It will then process these records, applying the exponential backoff logic defined in `AGENTS.md`.
*   **Dead-Letter Queue (DLQ):** After 8 failed attempts, the scheduled job should simply update the record's `status` to `'DLQ'`. This removes it from the active retry queue and flags it for manual review, as planned.

This approach ensures that NHIE submissions are durable and will survive application restarts, which is a critical requirement for reliable interoperability.
