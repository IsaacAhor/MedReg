# Codex MCP Prompt: Test FHIR Encounter Mapper via OpenMRS MCP

## Context
You added `FhirEncounterMapper.java` to convert OpenMRS encounters to FHIR R4 Encounter resources for NHIE. This prompt validates mapping using the OpenMRS MCP server.

## Objective
Validate mapping for a known OPD encounter for a patient (Ghana Card `GHA-123456789-7`) via the OpenMRS MCP tools, then confirm produced FHIR JSON complies with NHIE.

## Step 1: Fetch Patient Using OpenMRS MCP

Use `ghana-emr-openmrs.search_patient` to find the patient and capture the `uuid`.

```
MCP Server: ghana-emr-openmrs
Tool: search_patient
Input:
  query: "GHA-123456789-7"
  limit: 1
```

If not found, register using `create_patient` (see patient prompt for input example), then re-run search.

## Step 2: Identify an OPD Encounter

Using OpenMRS (UI or API), identify an OPD encounter UUID for that patient (or create a test encounter via UI). Capture `encounter.uuid` and ensure it belongs to an OPD visit.

## Step 3: Generate FHIR Encounter JSON

In a small harness (or test extension):

```java
FhirEncounterMapper mapper = new FhirEncounterMapper();
org.openmrs.Encounter omrsEncounter = Context.getEncounterService().getEncounterByUuid("<encounter-uuid>");
org.hl7.fhir.r4.model.Encounter fhirEncounter = mapper.toFhirEncounter(omrsEncounter);
String json = ca.uhn.fhir.context.FhirContext.forR4().newJsonParser().setPrettyPrint(true).encodeResourceToString(fhirEncounter);
System.out.println(json);
```

## Step 4: Validate Against NHIE Rules

Confirm the JSON contains:
- Identifier system: `http://moh.gov.gh/fhir/identifier/encounter` (value stable per client)
- Status: `finished`
- Class: coding system `http://terminology.hl7.org/CodeSystem/v3-ActCode`, code `AMB`
- Type: coding system `http://moh.gov.gh/fhir/encounter-type`, code `OPD`
- Subject: `reference: Patient/<uuid>` and identifier with Ghana Card when present
- Period: start from encounterDatetime; end from visit stopDatetime if set
- ReasonCode: ICD-10 code from encounter obs when available (system `http://hl7.org/fhir/sid/icd-10`)

## Step 5: Report Results

```
FHIR ENCOUNTER MAPPER TEST RESULTS (OpenMRS MCP)
===============================================

Encounter: <encounter-uuid>
Patient Ghana Card: <ghana-card>

Fields:
  ✅ Identifier: <value>
  ✅ Status: finished
  ✅ Class: AMB
  ✅ Type: OPD
  ✅ Subject: Patient/<uuid> (Ghana Card id present: <yes/no>)
  ✅ Period: <start> — <end or null>
  ⚠️ ReasonCode: <ICD-10 code/display or missing>

Issues:
  - <any issues or "No issues found">
```

---

Codex Commands:

```
codex -f mcp-servers/scripts/test-fhir-encounter-openmrs-mcp.md
```

