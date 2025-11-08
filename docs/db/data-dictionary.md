# Data Dictionary

This document explains the key data models and their relationships, particularly between the custom GhanaEMR tables and the core OpenMRS schema.

## Core OpenMRS Tables of Interest

-   **`patient`**: The central patient record. Linked via `patient_id`.
-   **`person`**: Demographic information about an individual (name, gender, birthdate). A patient is a person.
-   **`person_attribute`**: Used to store additional information about a person, such as the NHIS Number. This is a key-value store.
-   **`patient_identifier`**: Used to store patient identifiers like the Ghana Card and Folder Number.
-   **`encounter`**: Represents a patient's visit or interaction, such as a Triage or Consultation.
-   **`obs`**: (Observations) Used to store clinical data, like vital signs, diagnoses, and lab results, linked to an encounter.

## Custom GhanaEMR Tables

### `ghanaemr_patient_queue`

-   **Purpose:** Manages the flow of patients through different service points (Triage, Consultation, Pharmacy).
-   **Key Relationships:**
    -   `patient_id` -> `patient.patient_id`
    -   `location_to_id` -> `location.location_id` (where the patient is going)
    -   `visit_id` -> `visit.visit_id`

### `ghanaemr_nhie_transaction_log`

-   **Purpose:** Provides an audit trail for all communications with the National Health Information Exchange (NHIE).
-   **Key Relationships:**
    -   `patient_id` -> `patient.patient_id`
    -   `encounter_id` -> `encounter.encounter_id`

*(This document will be updated as the data model evolves.)*
