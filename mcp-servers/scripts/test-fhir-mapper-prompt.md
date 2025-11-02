# Codex MCP Prompt: Test FHIR Patient Mapper with Real Database Data

## Context
You've just implemented the FHIR Patient Mapper (`FhirPatientMapper.java`) which converts OpenMRS patients to FHIR R4 Patient resources for NHIE integration. Now we need to test it with real patient data from the database.

## Objective
Verify that the FHIR Patient Mapper correctly converts the first registered patient (Kwabena Kofi Nyarko) from OpenMRS database format to FHIR R4 format.

## Step 1: Query Patient Data from Database

Use the MySQL MCP server to query the patient we registered on Nov 1, 2025:

```
Query the OpenMRS database to get complete patient information for Ghana Card "GHA-123456789-7":

1. Get patient basic info:
   SELECT p.patient_id, p.uuid, person_id 
   FROM patient p
   INNER JOIN patient_identifier pi ON p.patient_id = pi.patient_id
   INNER JOIN patient_identifier_type pit ON pi.identifier_type = pit.patient_identifier_type_id
   WHERE pit.name = 'Ghana Card' 
   AND pi.identifier = 'GHA-123456789-7'
   LIMIT 1;

2. Get all patient identifiers:
   SELECT pit.name as identifier_type, pi.identifier, pi.preferred
   FROM patient_identifier pi
   INNER JOIN patient_identifier_type pit ON pi.identifier_type = pit.patient_identifier_type_id
   WHERE pi.patient_id = <patient_id_from_step_1>
   ORDER BY pi.preferred DESC;

3. Get person demographics:
   SELECT pn.given_name, pn.middle_name, pn.family_name,
          p.gender, p.birthdate, p.birthdate_estimated
   FROM person p
   LEFT JOIN person_name pn ON p.person_id = pn.person_id AND pn.preferred = 1
   WHERE p.person_id = <person_id_from_step_1>;

4. Get person attributes (NHIS number):
   SELECT pat.name as attribute_type, pa.value
   FROM person_attribute pa
   INNER JOIN person_attribute_type pat ON pa.person_attribute_type_id = pat.person_attribute_type_id
   WHERE pa.person_id = <person_id_from_step_1>
   AND pat.name = 'NHIS Number';

5. Get person address:
   SELECT address1, address2, city_village, county_district, 
          state_province, country, preferred
   FROM person_address
   WHERE person_id = <person_id_from_step_1>
   AND preferred = 1;
```

## Step 2: Validate Data Completeness

Check that the patient has all required FHIR fields:
- ✅ At least one identifier (Ghana Card - REQUIRED)
- ✅ Name (given name + family name)
- ✅ Gender (M/F/O/U)
- ✅ Birth date
- ⚠️  NHIS number (optional, but should be present for this test patient)
- ⚠️  Folder number (optional, may not be present yet - that's OK)
- ⚠️  Phone number (optional)
- ⚠️  Address (optional)

## Step 3: Map to Expected FHIR JSON

Based on the database results, the expected FHIR R4 Patient resource should look like:

```json
{
  "resourceType": "Patient",
  "identifier": [
    {
      "system": "http://moh.gov.gh/fhir/identifier/ghana-card",
      "value": "GHA-123456789-7"
    },
    {
      "system": "http://moh.gov.gh/fhir/identifier/nhis",
      "value": "0123456789"
    },
    {
      "system": "http://moh.gov.gh/fhir/identifier/folder-number",
      "value": "<folder_number_from_db>"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "Nyarko",
      "given": ["Kwabena", "Kofi"]
    }
  ],
  "gender": "male",
  "birthDate": "1991-01-01",
  "telecom": [
    {
      "system": "phone",
      "value": "<phone_from_db_if_present>",
      "use": "mobile"
    }
  ],
  "address": [
    {
      "use": "home",
      "text": "<address_text>",
      "city": "<city_from_db>",
      "state": "<region_from_db>",
      "country": "GH"
    }
  ]
}
```

## Step 4: Identify Issues

Compare the database data with expected FHIR format and report:

1. **Missing Required Fields**: Any required FHIR fields missing from DB?
   - Ghana Card ✅
   - Name ✅
   - Gender ✅
   - Birth date ✅

2. **Missing Optional Fields**: Which optional fields are missing?
   - NHIS number ⚠️
   - Folder number ⚠️
   - Phone number ⚠️
   - Address ⚠️

3. **Data Quality Issues**: Any formatting problems?
   - Ghana Card format correct? (GHA-XXXXXXXXX-X)
   - NHIS format correct? (10 digits)
   - Gender valid? (M/F/O/U)
   - Birth date valid? (YYYY-MM-DD)

## Step 5: Report Results

Provide a summary in this format:

```
FHIR PATIENT MAPPER TEST RESULTS
=================================

Patient: <name_from_db>
Ghana Card: <ghana_card_value>
Database Status: ✅ COMPLETE / ⚠️ MISSING FIELDS / ❌ DATA ISSUES

Required Fields (FHIR):
  ✅ Identifiers: <count> found (<list_types>)
  ✅ Name: <full_name>
  ✅ Gender: <gender_value> → FHIR: <fhir_gender>
  ✅ Birth Date: <birthdate_value>

Optional Fields:
  ⚠️ NHIS Number: <present/missing>
  ⚠️ Folder Number: <present/missing>
  ⚠️ Phone Number: <present/missing>
  ⚠️ Address: <present/missing>

Mapping Issues:
  - <list_any_issues_here>
  - <or_state_"No issues found">

Recommendation:
  <action_needed_to_fix_any_issues>
```

## Expected Output

The mapper should successfully convert the database patient to FHIR format with:
- All required fields present
- Correct identifier system URIs (canonical)
- Proper gender mapping (M → male)
- Valid FHIR R4 JSON structure

## Success Criteria

✅ Query returns patient data successfully  
✅ All required FHIR fields present in database  
✅ Identifier system URIs match canonical values  
✅ Gender mapping correct  
✅ Birth date in correct format  
✅ JSON structure validates against FHIR R4 schema  

## If Issues Found

If any required data is missing:
1. Document the issue in IMPLEMENTATION_TRACKER.md
2. Create GitHub issue for tracking
3. Suggest SQL scripts to populate missing data
4. Recommend updates to patient registration form

---

**Codex Command:**
```
codex "Test FHIR patient mapper with real database patient GHA-123456789-7"
```
