# Patient FHIR Mapping

Identifiers
- Ghana Card -> identifier system: http://moh.gov.gh/fhir/identifier/ghana-card
- NHIS -> identifier system: http://moh.gov.gh/fhir/identifier/nhis
- Folder Number -> local identifier system

Elements
- name, gender, birthDate, telecom, address

Conflict Handling
- 409 existing patient: fetch, reconcile identifiers, store NHIE id.
