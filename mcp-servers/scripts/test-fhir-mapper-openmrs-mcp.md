# Codex MCP Prompt: Test FHIR Patient Mapper via OpenMRS MCP

## Context
You implemented `FhirPatientMapper.java` to convert OpenMRS patients to FHIR R4 for NHIE. This prompt validates the mapper using the OpenMRS MCP server (not raw SQL).

## Objective
Validate mapping for the test patient with Ghana Card `GHA-123456789-7` using the OpenMRS MCP tools, then confirm the produced FHIR JSON matches Ghana NHIE requirements.

## Step 1: Fetch Patient Using OpenMRS MCP

Use the `ghana-emr-openmrs` MCP server’s `search_patient` tool to retrieve the patient by Ghana Card.

```
MCP Server: ghana-emr-openmrs
Tool: search_patient
Input:
  query: "GHA-123456789-7"
  limit: 1

Expect:
  - One patient result (PII-masked)
  - Contains identifiers including Ghana Card, optionally NHIS and Folder Number
  - Includes patient UUID for cross-checks
```

If no result is returned, register the patient using `create_patient` (same MCP server) following AGENTS.md validation rules:

```
MCP Server: ghana-emr-openmrs
Tool: create_patient
Input (example):
  givenName: "Kwabena"
  middleName: "Kofi"
  familyName: "Nyarko"
  gender: "M"
  dateOfBirth: "1991-01-01"
  ghanaCard: "GHA-123456789-7"
  nhisNumber: "0123456789"
  phone: "+233244123456"
  address: "123 Main St"
  city: "Accra"
  region: "Greater Accra"
  regionCode: "GA"
  facilityCode: "KBTH"
```

Re-run `search_patient` to confirm the record exists.

## Step 2: Build and Run Mapper Tests

Run the mapper unit tests to ensure mapping logic passes locally:

```
cd backend/openmrs-module-ghanaemr/api
mvn test -Dtest=FhirPatientMapperTest
```

Expect:
- Tests pass (>90% coverage for the mapper)
- No violations of identifier system URIs

## Step 3: Generate FHIR JSON for the Patient

In a small harness (or debugger), convert the OpenMRS patient to FHIR and print JSON using `FhirPatientMapper`:

```java
// Pseudocode snippet for interactive run
FhirPatientMapper mapper = new FhirPatientMapper();
org.openmrs.Patient openMrsPatient = Context.getPatientService().getPatientByUuid("<uuid-from-mcp>");
org.hl7.fhir.r4.model.Patient fhirPatient = mapper.toFhirPatient(openMrsPatient);
String json = mapper.toJson(fhirPatient);
System.out.println(json);
```

Alternatively, extend `FhirPatientMapperTest` with a test that loads a real patient by UUID when an env var like `TEST_PATIENT_UUID` is provided.

## Step 4: Validate Against Ghana NHIE Rules

Confirm the FHIR JSON contains:
- Identifiers with canonical systems:
  - Ghana Card: `http://moh.gov.gh/fhir/identifier/ghana-card`
  - NHIS: `http://moh.gov.gh/fhir/identifier/nhis`
  - Folder Number: `http://moh.gov.gh/fhir/identifier/folder-number`
- Name: given + family names
- Gender mapping: OpenMRS M/F/O/U → FHIR male/female/other/unknown
- Birthdate in `YYYY-MM-DD`
- Optional telecom and address if present

Example expected structure:

```json
{
  "resourceType": "Patient",
  "identifier": [
    { "system": "http://moh.gov.gh/fhir/identifier/ghana-card", "value": "GHA-123456789-7" },
    { "system": "http://moh.gov.gh/fhir/identifier/nhis", "value": "0123456789" },
    { "system": "http://moh.gov.gh/fhir/identifier/folder-number", "value": "GA-KBTH-2025-000123" }
  ],
  "name": [{ "use": "official", "family": "Nyarko", "given": ["Kwabena", "Kofi"] }],
  "gender": "male",
  "birthDate": "1991-01-01",
  "telecom": [{ "system": "phone", "value": "+233244123456", "use": "mobile" }],
  "address": [{ "use": "home", "city": "Accra", "state": "Greater Accra", "country": "GH" }]
}
```

## Step 5: Report Results

Use this summary format:

```
FHIR PATIENT MAPPER TEST RESULTS (OpenMRS MCP)
==============================================

Patient: <name_from_mcp_result>
Ghana Card: <ghana_card_value>
Database Status: ✅ FOUND VIA MCP / ❌ NOT FOUND

Required Fields (FHIR):
  ✅ Identifiers: <count> (<list_systems>)
  ✅ Name: <full_name>
  ✅ Gender: <gender_value> → FHIR: <fhir_gender>
  ✅ Birth Date: <birthdate_value>

Optional Fields:
  ⚠️ NHIS Number: <present/missing>
  ⚠️ Folder Number: <present/missing>
  ⚠️ Phone Number: <present/missing>
  ⚠️ Address: <present/missing>

Mapping Issues:
  - <any issues or "No issues found">

Recommendation:
  <follow-up actions if needed>
```

## Success Criteria

✅ Patient found via `ghana-emr-openmrs.search_patient`  
✅ Mapper tests pass with Maven  
✅ FHIR JSON contains canonical identifier systems  
✅ Gender and birth date correctly mapped  
✅ Optional fields included when available  

---

Codex Commands:

```
codex -f mcp-servers/scripts/test-fhir-mapper-openmrs-mcp.md
```

