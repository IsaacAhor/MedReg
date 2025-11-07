# MVP Simplification Proposal

**Objective:** Deliver a functional, stable, and reliable MVP to secure the Ghana Ministry of Health contract by focusing on core requirements and reducing complexity.

The current MVP scope is too broad for the 16-20 week timeline and introduces significant risks of instability and delays. This proposal outlines a leaner, more strategic MVP.

---

## Proposed Lean MVP Scope

### 1. Core Patient Identity Management
- **Patient Registration:** Register a patient with essential demographics.
- **Ghana Card Validation:** Capture and validate Ghana Card numbers (format and Luhn checksum).
- **NHIS Number Capture:** Store the patient's NHIS number.
- **Folder Number Generation:** Automatically generate a unique patient folder number.
- **Underlying Action:** Creates a patient record in OpenMRS.

### 2. Critical National Integrations (The "Hook")
- **NHIS Eligibility Check:** A real-time check to verify if a patient's insurance is active. This is a key feature for government stakeholders.
- **Patient Sync to NHIE:** Push new patient registrations to the National Health Information Exchange (NHIE). This demonstrates compliance with national standards.

### 3. Simplified Clinical Workflow (Proof of Concept)
- **Record a Simple Visit:** Instead of a full OPD workflow (triage, pharmacy, billing), create a single "OPD Visit" encounter.
- **Capture Chief Complaint:** A single text field for the reason for the visit.
- **Record a Single Diagnosis:** Allow searching and adding ONE diagnosis from a predefined list (e.g., the top 20 common diagnoses).
- **DEFERRED:** Full Triage, Pharmacy, and Billing modules.

### 4. Minimalist Admin & User Management
- **Two Roles Only:**
    - **Admin:** Can manage users and system settings.
    - **User:** Can register patients and record visits.
- **DEFERRED:** Complex role-based access control (8+ roles), multi-tenancy, and facility-level administration.

### 5. Essential Reporting & Viewing
- **Patient Search:** Ability to find patients by name, folder number, or Ghana Card.
- **Patient Dashboard:** A simple view of patient demographics and a list of their past visits.
- **NHIE Sync Status:** A clear indicator to show if a patient's record has been successfully synced with the national exchange.

---

## Justification for this Lean Approach

1.  **Focus on the Core Ask:** The primary goal is to win the government contract. The most critical features are demonstrating compliance and integration with Ghana's national health systems (Ghana Card, NHIS, NHIE). This proposal delivers on that.
2.  **Drastically Reduce Risk:** The original scope's complexity is a major risk. A smaller, rock-solid MVP is far more impressive and less likely to fail during a demo than a feature-rich but buggy application.
3.  **Achieve a Faster, More Stable Delivery:** This lean scope is achievable within the 16-20 week timeline, leaving more room for testing, polish, and bug fixing.
4.  **Build a Strong Foundation:** This "walking skeleton" creates a stable base. Once the contract is secured, we can build out the more complex workflows like pharmacy, billing, and labs on a proven foundation.
5.  **Tell a Clear Story:** The story to the MoH becomes: "We have built a modern, stable EMR that is already compliant with your national systems. We are ready to be your partner and expand the feature set with you."

By adopting this strategy, we can deliver an MVP that is not only functional but also a powerful statement of our capabilities and readiness to meet the government's needs.

---

## What to Keep vs. What to Postpone

### Keep and Focus On (Core MVP)

Based on the current project state, the following components are aligned with the lean MVP and should be the focus of development:

- **Backend (OpenMRS Module):**
    - `GhanaPatientService`: The core logic for patient registration and validation.
    - `GhanaPatientController`: The REST API endpoint for patient creation.
    - `NHIEIntegrationService` & `NHIEHttpClient`: The foundation for connecting to the national health exchange.
    - `FhirPatientMapper`: Logic for converting OpenMRS patients to the required FHIR format.
    - **Endpoint to Keep:** `GET /ws/rest/v1/ghana/coverage?nhis={number}` for eligibility checks.
    - **Endpoint to Keep:** `POST /ws/rest/v1/ghana/patients/{uuid}/sync-nhie` for patient synchronization.

- **Frontend (Next.js):**
    - `PatientRegistrationForm.tsx`: The main form for capturing patient data. This should be simplified to match the lean MVP scope.
    - `useRegisterPatient.ts`: The hook for handling the form submission and API call.
    - **API Client:** The Axios setup for communicating with the OpenMRS backend.
    - **UI Components:** The existing `shadcn/ui` components for building the simplified UI.

- **Infrastructure:**
    - The existing Docker setup for `mysql:5.7` and `openmrs:2.4.0` is perfect and should be maintained.

### Postpone for Post-MVP (Version 2)

The following features from the original plan should be explicitly deferred to reduce complexity and risk:

- **Full OPD Workflow:**
    - **Triage Module:** Capturing vitals and initial assessments.
    - **Consultation Module:** Detailed clinical notes, history, and examinations.
    - **Pharmacy Module:** Prescription, dispensing, and inventory management.
    - **Billing Module:** Generating bills and handling payments for services and medications.

- **Complex User and Role Management:**
    - **8 Distinct User Roles:** The roles of Doctor, Nurse, Pharmacist, Records Officer, Cashier, and NHIS Officer are not needed for the lean MVP.
    - **White-Label / Multi-Tenant Architecture:** All features related to multi-facility oversight and platform administration.

- **Advanced Reporting:**
    - **Complex Dashboards:** Reports like OPD register, revenue reports, and diagnosis statistics.
    - **Claims Generation:** The "claims export" functionality for NHIS.

- **Other Features from Original "Out of Scope":**
    - IPD/Admissions, Antenatal Care (ANC), Laboratory results, Appointments, SMS notifications, and Offline mode remain out of scope.

---

## The Path to a Full-Featured EMR: A Phased Approach

The lean MVP is not the end of the journey; it is the critical first step. This focused approach allows us to build a stable foundation and then intelligently sequence the development of the full feature set. This roadmap outlines how we get everything "wired up correctly."

### Phase 1: The Lean MVP (The Core Engine)
*   **Goal:** Secure the government contract and establish a stable, compliant foundation.
*   **Focus:** 100% on the **3 Core Pillars**:
    1.  Compliant Patient Registration (Ghana Card, Folder Number).
    2.  National System Integration (NHIE/NHIS).
    3.  A Simple, Complete End-to-End Demo Workflow.
*   **Outcome:** A rock-solid, impressive MVP that proves our capability and wins the pilot.

---
*Following a successful MVP and contract award...*
---

### Phase 2: The Clinical Workflow
*   **Goal:** Enhance the system for daily use by clinicians at the pilot facility.
*   **Focus:** Wire the core clinical modules into the stable MVP foundation:
    *   **Triage:** Add vitals capture and queuing.
    *   **Consultation:** Expand to include detailed clinical notes, patient history, and full diagnosis/procedure coding.
*   **Outcome:** A system that is deeply useful for doctors and nurses.

### Phase 3: Business & Operations
*   **Goal:** Support the facility's financial and resource management processes.
*   **Focus:** Integrate the operational modules that depend on a stable clinical workflow:
    *   **Billing:** Connect clinical services to a robust billing and payment engine.
    *   **Pharmacy:** Link prescriptions to a full pharmacy and inventory management module.
*   **Outcome:** An EMR that supports the entire facility's operational loop.

### Phase 4: Enterprise Scale & Administration
*   **Goal:** Prepare the platform for a wide, multi-facility rollout.
*   **Focus:** Build the top-level administrative and scaling architecture:
    *   **Advanced Roles:** Implement the full matrix of 8+ user roles and permissions.
    *   **Multi-Tenancy:** Introduce the architecture to support multiple, distinct facilities.
    *   **Advanced Reporting:** Develop comprehensive operational and clinical reports.
*   **Outcome:** A mature, scalable, enterprise-ready EMR platform.

This phased strategy is the proven path to delivering a complex but reliable system. It mitigates risk, ensures each layer is built on a stable foundation, and delivers continuous value at every stage.

