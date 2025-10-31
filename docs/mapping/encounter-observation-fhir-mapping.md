# Encounter & Observation FHIR Mapping

Encounter
- patient, status, class, serviceType, period, location, participant.

Observation
- vitals and labs; coding via concept mappings (ICD-10 for diagnosis; LOINC for labs where applicable).

Bundle Strategy
- Encounter as focus + Observations in a transaction bundle.
