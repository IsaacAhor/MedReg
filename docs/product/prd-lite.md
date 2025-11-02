# PRD-Lite (Pilot) - MedReg MVP User Stories

## Objectives

The primary objective of this Minimum Viable Product (MVP) is to deliver an NHIE-compliant EMR system that proves end-to-end Outpatient Department (OPD) workflow for a single pilot facility in Ghana. This MVP will demonstrate MedReg's capability to meet critical national requirements for patient registration, NHIS eligibility, clinical documentation, and data synchronization with the National Health Information Exchange (NHIE).

## Scope In/Out

*   **In Scope:** Core OPD workflow, patient registration, NHIS eligibility, basic consultation, dispensing, cash/NHIS billing, NHIE patient/encounter synchronization, basic reporting.
*   **Out of Scope (for MVP):** Inpatient management, ANC, Immunization, Lab/Imaging order entry, advanced reporting, complex claims adjudication, telemedicine, patient portal.
*   **Reference:** For a detailed build strategy, refer to `08_MVP_Build_Strategy.md`.

## MVP User Stories & Acceptance Criteria

### 1. Patient Registration & Identification

**User Story:** As a Registration Clerk, I need to register new patients and identify returning patients using Ghana-specific identifiers so that patient records are accurate and linked to national systems.

**Acceptance Criteria:**
*   **New Patient Registration:**
    *   System allows capture of full name, gender, date of birth, contact phone, and address (Region, District, Town/Village).
    *   System enforces Ghana Card format `GHA-XXXXXXXXX-X` and performs Luhn checksum validation for new registrations.
    *   System allows capture of NHIS number in format `[REGION_CODE][DISTRICT_CODE]-[7DIGITS]`.
    *   System automatically generates a unique Facility Folder Number in format `[REGION]-[FACILITY]-[YEAR]-[SEQUENCE]`.
    *   Upon successful registration, the system submits the patient's demographic data to the NHIE and stores the returned National MPI ID.
    *   System handles cases where NHIE returns a duplicate patient (e.g., patient already exists in MPI).
*   **Returning Patient Identification:**
    *   System allows searching for patients by Ghana Card, NHIS number, Facility Folder Number, or Name + Date of Birth.
    *   System retrieves patient demographics and their National MPI ID.

### 2. NHIS Eligibility Verification

**User Story:** As a Registration Clerk, I need to quickly verify a patient's NHIS eligibility so that I can correctly bill for services and inform the patient of their coverage status.

**Acceptance Criteria:**
*   System allows real-time eligibility check for a given NHIS number via the NHIE.
*   System displays the NHIS status (e.g., "ACTIVE", "EXPIRED", "NOT FOUND") and expiry date.
*   System prevents NHIS billing if the patient's NHIS status is "EXPIRED" or "NOT FOUND".
*   System provides an option to proceed as a cash patient if NHIS is not active.

### 3. Triage & Vitals Capture

**User Story:** As a Nurse, I need to record patient vital signs and chief complaint so that the doctor has essential information before consultation.

**Acceptance Criteria:**
*   System allows recording of weight (kg), height (cm), temperature (°C), and blood pressure (mmHg).
*   System calculates and displays BMI automatically.
*   System allows free-text entry for Chief Complaint.
*   System flags abnormal vital signs (e.g., high BP, fever) based on configurable thresholds.

### 4. Clinical Consultation & Diagnosis

**User Story:** As a Doctor, I need to document patient consultations, assign diagnoses, and create treatment plans so that patient care is recorded and consistent.

**Acceptance Criteria:**
*   System allows free-text entry for History of Presenting Illness, Review of Systems, and Physical Examination findings.
*   System allows selection of primary and secondary diagnoses using ICD-10 codes (with search functionality).
*   System allows entry of prescriptions, including drug name (from Ghana Essential Medicines List), dosage, frequency, and duration.
*   System allows ordering of basic lab tests (e.g., Malaria RDT, Hemoglobin) and imaging (e.g., X-ray).
*   Upon completion, the system creates an encounter record and submits relevant clinical data (diagnosis, procedures) to the NHIE.

### 5. Pharmacy Dispensing

**User Story:** As a Pharmacist, I need to dispense prescribed medications and record the dispensed items so that drug stock is managed and patient records are updated.

**Acceptance Criteria:**
*   System displays pending prescriptions for a patient.
*   System allows selection of dispensed medications, quantity, and batch number.
*   System updates local drug stock levels upon dispensing.
*   System flags if a prescribed drug is out of stock.

### 6. Billing & Claims Export

**User Story:** As a Cashier, I need to generate bills for cash patients and prepare claims for NHIS patients so that the facility can collect revenue.

**Acceptance Criteria:**
*   **Cash Billing:**
    *   System calculates total bill based on services rendered and dispensed medications.
    *   System generates a printable receipt for cash payments.
*   **NHIS Claims Preparation:**
    *   System identifies all NHIS-eligible services and medications for an encounter.
    *   System groups services and medications by G-DRG or Fee-for-Service codes.
    *   System generates a summary of potential NHIS claims for review.
    *   System allows export of claims data in a format compatible with NHIE batch submission (for future integration).

### 7. NHIE Data Synchronization

**User Story:** As a System Administrator, I need to ensure that patient and encounter data is reliably synchronized with the NHIE, even during network outages, so that national health records are up-to-date.

**Acceptance Criteria:**
*   System automatically queues patient registration and encounter submission data when the NHIE is unreachable.
*   System automatically attempts to synchronize queued data with exponential backoff when network connectivity is restored.
*   System uses idempotency keys to prevent duplicate submissions to the NHIE.
*   System provides a dashboard to monitor the status of queued and synchronized transactions.
*   System logs all NHIE transaction attempts and their outcomes.

### 8. Basic Reporting

**User Story:** As a Facility Manager, I need to view basic operational reports so that I can monitor patient flow and service utilization.

**Acceptance Criteria:**
*   System generates a daily OPD register (patient name, folder number, time in, time out, diagnosis).
*   System provides a summary report of NHIS vs. Cash patients for a given period.
*   System lists the top 10 diagnoses for a given period.
