# Ghana Health Domain Knowledge Base

## Overview

This document captures Ghana-specific healthcare system knowledge, clinical workflows, administrative structures, and business rules required for building EMR system that serves Ghanaian facilities effectively.

**Purpose**: Enable development team (including AI coding assistants) to generate domain-appropriate functionality without requiring constant clinical expert consultation.

---

## Ghana Health System Structure

### Administrative Hierarchy

**National Level**
- Ministry of Health (policy and oversight)
- Ghana Health Service (service delivery operations)
- National Health Insurance Authority (NHIS management)
- Teaching Hospitals (tertiary care, medical education)

**Regional Level (16 Regions)**
1. Greater Accra Region (capital)
2. Ashanti Region
3. Western Region
4. Western North Region
5. Central Region
6. Eastern Region
7. Volta Region
8. Oti Region
9. Northern Region
10. Savannah Region
11. North East Region
12. Upper East Region
13. Upper West Region
14. Bono Region
15. Bono East Region
16. Ahafo Region

**District Level (260 Districts)**
- District Health Directorates
- District Hospitals
- Health Centers
- CHPS (Community-based Health Planning and Services) compounds

### Facility Classification

**Tertiary Care (Teaching Hospitals)**
- Korle Bu Teaching Hospital (Accra)
- Komfo Anokye Teaching Hospital (Kumasi)
- Tamale Teaching Hospital
- Cape Coast Teaching Hospital
- Service population: Entire country (referral center)
- Staff: 1000+ including specialists
- Beds: 1000-2000
- Services: All specialties, complex surgeries, ICU, research

**Regional Hospitals**
- One per region (16 facilities)
- Service population: Regional (1-5 million people)
- Staff: 200-500
- Beds: 200-500
- Services: General surgery, internal medicine, OB/GYN, pediatrics, basic imaging

**District Hospitals**
- Multiple per region (100+ nationwide)
- Service population: District (50,000-300,000)
- Staff: 50-150
- Beds: 50-150
- Services: Outpatient, inpatient, basic surgery, maternity, pharmacy, lab

**Health Centers**
- Sub-district level (400+ nationwide)
- Service population: Sub-district (10,000-50,000)
- Staff: 10-30
- Beds: 10-30 (if any)
- Services: Outpatient, antenatal care, immunization, basic lab

**CHPS Compounds**
- Community level (2000+ nationwide)
- Service population: Community (1,000-5,000)
- Staff: 2-5 (community health nurses)
- Services: Preventive care, health education, immunization, family planning

---

## Patient Demographics and Identifiers

### National Identification Systems

**Ghana Card (National ID)**
- Issued by: National Identification Authority (NIA)
- Format: `GHA-XXXXXXXXX-X` (GHA + 9 digits + check digit)
- Example: GHA-123456789-1
- Coverage: 17+ million issued (75%+ of adults)
- Required for: NHIS registration, voting, banking, government services
- EMR requirement: Primary patient identifier, MANDATORY for new registrations

**National Health Insurance Scheme (NHIS) Number**
- Issued by: National Health Insurance Authority
- Format: `[REGION_CODE][DISTRICT_CODE]-[7DIGITS]`
- Example: GA01-1234567 (Greater Accra, Accra Metropolitan District)
- Coverage: 12+ million active members (40% population)
- Validity: Annual renewal required
- EMR requirement: Required for claims processing

**Facility Folder Number (Medical Record Number)**
- Issued by: Individual facility
- Format: `[REGION]-[FACILITY]-[YEAR]-[SEQUENCE]`
- Example: GA-0001-2025-00123
- Unique per facility (not shared across facilities)
- EMR requirement: Local identifier, assigned at first visit

**Birth Registration Number**
- Issued by: Births and Deaths Registry
- Used for: Children <18 years before Ghana Card issued
- Format varies

### Required Patient Information

**Minimum Data Set**
- Full name (given name, family name)
- Gender (male, female, other, unknown)
- Date of birth (required) OR Age estimate if DOB unknown
- Ghana Card number (MANDATORY for adults)
- Contact phone number (mobile)
- Address (at minimum: region, district, town/village)

**Recommended Additional Data**
- NHIS number (if enrolled)
- NHIS expiry date
- Next of kin (name, relationship, phone)
- Ethnicity (see ethnic groups below)
- Language preference
- Religion
- Occupation
- Marital status

**Address Structure**
- Country: Ghana (GH)
- Region: One of 16 regions
- District: One of 260 districts
- Town/Village: Free text
- GPS address (if available): Ghana PostGPS format (e.g., GA-123-4567)
- Landmark: Free text (common in urban areas)

### Ethnic Groups (Major)

1. Akan (47% of population)
   - Sub-groups: Asante, Fante, Akuapem, Kwahu, Akyem, etc.
2. Mole-Dagbani (17%)
   - Sub-groups: Dagomba, Mamprusi, Gonja, etc.
3. Ewe (14%)
4. Ga-Dangme (7%)
5. Gurma (6%)
6. Guan (4%)
7. Grusi (3%)
8. Mande (2%)
9. Other (foreign nationals, mixed)

**Clinical Relevance**: Some genetic conditions have ethnic clustering (e.g., sickle cell disease higher in Akan and Ewe populations)

### Languages

**Official Language**: English (used in EMR, medical documentation)

**Major Local Languages** (staff may need to speak):
1. Twi/Akan (most widely spoken)
2. Ga (Greater Accra)
3. Ewe (Volta region)
4. Dagbani (Northern region)
5. Hausa (Northern regions)
6. Frafra (Upper East)
7. Nzema (Western region)

**EMR Implication**: Consider multi-language UI for patient-facing screens (registration kiosks, appointment reminders)

---

## National Health Insurance Scheme (NHIS)

### NHIS Overview

**Purpose**: Universal health coverage for Ghanaian citizens
**Established**: 2003 (Act 650, later replaced by Act 852 in 2012)
**Coverage**: ~12 million active members (40% population)
**Premium**: Tiered based on income; exemptions for children <18, elderly 70+, pregnant women, indigents

### NHIS Membership Categories

**Premium Paying Adults**
- Age 18-69
- Employed or self-employed
- Annual premium: GHS 10-40 based on income tier
- Renewal: Annually

**Exempt Categories**
1. **Children under 18**: Free enrollment under parent's membership
2. **Elderly (70+)**: Free enrollment
3. **Pregnant women**: Free antenatal, delivery, postnatal care
4. **Indigents**: Certified poor, free enrollment
5. **Core poor**: Social welfare cases
6. **SSNIT contributors**: Pensioners contributing to Social Security

### NHIS Coverage

**Covered Services (95%+ of common conditions)**
- Outpatient consultations
- Inpatient admission and feeding
- Essential medicines (Ghana Essential Medicines List)
- Emergency care
- Maternity care (antenatal, delivery, postnatal)
- Surgical operations
- Laboratory tests (common panels)
- X-ray and ultrasound
- Dental care (extractions)
- Eye care (basic)

**Excluded Services**
- Cosmetic surgery
- HIV/AIDS antiretroviral drugs (separate program)
- Cancer chemotherapy (separate program, but some coverage)
- Prostheses (artificial limbs)
- Appliances (glasses, hearing aids)
- Medical examination for school, work, travel
- Morgue services

### NHIS Eligibility Verification

**Business Rules**

**Rule 1: Active Membership Check**
- Patient must have valid NHIS number
- Membership status must be "ACTIVE"
- Expiry date must be future date (not expired)
- If expired: Patient must renew before services covered

**Rule 2: Exemption Category Verification**
- Children <18: Check birthdate, confirm parent membership
- Pregnant women: Check ANC registration
- Elderly 70+: Check birthdate
- Indigents: Check certification from Department of Social Welfare

**Rule 3: Service Coverage Check**
- Requested service must be on NHIS benefits package
- If excluded service: Inform patient of out-of-pocket payment requirement
- If covered but requires authorization: Prior authorization needed

**EMR Workflow**
1. Registration clerk enters NHIS number
2. System queries NHIE middleware for eligibility
3. NHIE routes request to NHIA backend (internally)
4. NHIE returns Coverage resource with status from NHIA
5. System displays: ACTIVE (green), EXPIRED (red), NOT FOUND (yellow)
6. If ACTIVE: Proceed with service, flag as NHIS claim
7. If EXPIRED: Inform patient, offer renewal or cash payment
8. If NOT FOUND: Register as cash patient or verify number

**Note**: Facility EMR never communicates directly with NHIA—all requests go through NHIE middleware.

---

## NHIS Claims Processing

### Tariff System

**Ghana Diagnosis Related Grouping (G-DRG)**
- Case-based payment system
- Groups conditions into categories with fixed payment
- Example: Uncomplicated malaria (OPD) = GHS 25
- Example: Normal vaginal delivery = GHS 250
- Example: Cesarean section = GHS 600

**Fee-for-Service (Selected Services)**
- Some services paid per item
- Example: X-ray chest = GHS 20
- Example: Hemoglobin test = GHS 5
- Example: Suturing wound = GHS 30

**Medicines Tariff**
- Ghana Essential Medicines List with fixed prices
- Example: Paracetamol tablet = GHS 0.05
- Example: Amoxicillin capsule = GHS 0.20
- Example: Antimalarial (ACT) = GHS 2.50

### Claims Submission Rules

**Rule 1: Eligibility Confirmation**
- Claim can only be submitted for ACTIVE NHIS members
- Must include valid NHIS number in claim
- Expiry date must cover service date

**Rule 2: Service Authorization**
- Some procedures require prior authorization
- Authorization must be obtained before service delivery
- Authorization number must be included in claim

**Services Requiring Authorization**
- Surgeries >GHS 5,000
- MRI/CT scans
- Specialist referrals (in some cases)
- Extended hospital stay (>14 days)

**Rule 3: Documentation Requirements**
- Minimum documentation for every claim:
  - Patient folder number
  - NHIS number
  - Diagnosis (ICD-10 code)
  - Service date
  - Tariff code or G-DRG code
  - Amount claimed
  - Provider name and signature
  
- Additional documentation by service type:
  - Surgery: Operative notes, anesthesia record
  - Admission: Admission note, discharge summary
  - High-cost drugs: Prescription, treatment protocol
  - Imaging: Radiologist report

**Rule 4: Timely Submission**
- Claims must be submitted within 30 days of service date
- Late claims (31-60 days): 20% penalty applied to reimbursement
- Claims >60 days: Automatically rejected

**Rule 5: Batch Requirements**
- Claims submitted in batches (not individual)
- Minimum batch size: 10 claims
- Maximum batch size: 500 claims
- Batch must be single facility, single month
- Batch submission: Monthly cycle

**Rule 6: Geographic Restrictions**
- Primary care: Patient must use facility in their registered region
- Exception: Emergencies allowed at any facility
- Referrals: Must have referral letter from lower-level facility

### Claims Adjudication Process

**CRITICAL ARCHITECTURE**: 
- NHIA (National Health Insurance Authority) is the backend system
- Facilities submit claims to NHIE middleware
- NHIE routes internally to NHIA backend
- Flow: Facility -> NHIE -> NHIA -> NHIE -> Facility
- [FAILED] NO direct facility-to-NHIA connections permitted

**Step 1: Facility Submission**
- Facility compiles monthly claims batch
- Validates data completeness
- Submits via NHIE to NHIA

**Step 2: NHIA Validation (Backend Processing)**
- Checks eligibility for each claim
- Validates tariff codes
- Verifies authorization (if required)
- Checks for duplicate claims

**Step 3: Adjudication Decision**
- APPROVED: Full reimbursement
- PARTIALLY APPROVED: Some items rejected, reduced payment
- REJECTED: No payment, reason provided

**Common Rejection Reasons**
- Patient NHIS expired on service date
- Service not covered under NHIS
- Missing or invalid tariff code
- No prior authorization for required service
- Incomplete documentation
- Duplicate claim (already paid)
- Claim submitted too late (>60 days)

**Step 4: Payment**
- Approved claims: Payment within 60-90 days
- Payment via electronic transfer to facility bank account
- Remittance advice shows claim-by-claim breakdown

**EMR Functionality Requirements**
- Track claim status (submitted, pending, approved, rejected, paid)
- Display rejection reasons for follow-up
- Alert for claims approaching 30-day deadline
- Generate claims reports for finance department
- Reconcile payments received against claims submitted

---

## Clinical Workflows

### Outpatient Department (OPD) Workflow

**Step 1: Registration/Triage**
- New patient: Register demographics, assign folder number, create paper/electronic folder
- Returning patient: Retrieve folder, update contact if changed
- NHIS verification: Check eligibility if NHIS patient
- Vital signs: Weight, height, temperature, blood pressure (recorded by nurse)
- Chief complaint: Brief reason for visit
- Queue assignment: Join clinical consultation queue

**Step 2: Clinical Consultation**
- Doctor/Nurse reviews patient history
- Physical examination
- Diagnosis (ICD-10 code)
- Treatment plan: Prescriptions, investigations (lab/imaging), referrals
- Medical notes: Free text or structured form
- Follow-up: Next appointment date if needed

**Step 3: Pharmacy**
- Patient takes prescription to pharmacy
- Pharmacist dispenses medications
- Counseling on drug use, side effects
- Record dispensed medications and quantity

**Step 4: Laboratory/Imaging (if ordered)**
- Patient goes to lab/imaging department
- Sample collection or imaging procedure
- Results entered into system (manual or interface)
- Results available to clinician

**Step 5: Billing/Checkout**
- NHIS patient: Generate claim, patient pays nothing or nominal co-pay
- Cash patient: Calculate bill, patient pays, issue receipt
- Patient receives medications and departs

**Typical OPD Visit Duration**: 1-4 hours (depends on wait times, investigations)

### Inpatient Department (IPD) Workflow

**Step 1: Admission**
- Admission source: Emergency, OPD referral, specialist referral, direct admission
- Admission clerk: Register patient if new, verify NHIS eligibility
- Bed assignment: Ward and bed number
- Admission note: Doctor writes provisional diagnosis, history, examination, management plan
- Admission date/time recorded

**Step 2: Daily Ward Rounds**
- Medical team reviews patient daily
- Progress notes: Clinical status, investigations, medication changes
- Treatment sheet: Medications, IV fluids, nursing care orders

**Step 3: Investigations and Procedures**
- Lab tests: Blood, urine, other samples sent to lab
- Imaging: X-ray, ultrasound ordered
- Procedures: Surgeries, endoscopies scheduled and performed
- Results reviewed and documented

**Step 4: Medication Administration**
- Nurses administer medications per treatment sheet
- Document medication administration (time, dose)
- Monitor patient response

**Step 5: Discharge**
- Discharge decision: Patient condition improved, stable for home
- Discharge summary: Diagnosis, procedures, medications, follow-up plan
- Pharmacy: Dispense take-home medications
- Billing: Calculate total cost (bed days, procedures, meds, investigations)
- NHIS claim: Generate claim for insured patients
- Patient education: Discharge instructions, warning signs
- Discharge date/time recorded

**Step 6: Follow-Up**
- Schedule follow-up appointment (if needed)
- Referral to specialist or higher-level facility (if needed)

**Typical IPD Length of Stay**
- Uncomplicated delivery: 1-2 days
- Malaria: 2-3 days
- Pneumonia: 3-5 days
- Surgery: 5-10 days
- Complex cases: 2+ weeks

### Antenatal Care (ANC) Workflow

**Ghana ANC Model**: Focused Antenatal Care (4+ visits recommended)

**First Visit (Before 16 weeks gestation)**
- Registration: Enroll in ANC program, open ANC card
- History: Obstetric history (gravida, parity, previous deliveries), medical history
- Physical exam: Height, weight, blood pressure, fundal height
- Lab tests: Blood group, hemoglobin, urinalysis, HIV test, syphilis test
- Medications: Folic acid, iron supplementation, antimalarial prophylaxis
- Education: Nutrition, danger signs, birth preparedness
- Next visit: Scheduled for 20-24 weeks

**Second Visit (20-24 weeks)**
- Vital signs: Weight, blood pressure
- Fundal height measurement
- Fetal heart tones
- Tetanus toxoid vaccination (if not previously immunized)
- Review lab results from first visit
- Next visit: 28-32 weeks

**Third Visit (28-32 weeks)**
- Vital signs, fundal height, fetal heart tones
- Check for anemia (hemoglobin if indicated)
- Review medications (iron, folic acid)
- Next visit: 36 weeks

**Fourth Visit (36+ weeks)**
- Vital signs, fundal height, fetal presentation
- Birth plan discussion: Facility delivery, transport plan
- Danger signs review
- Next visit: 40 weeks or labor onset

**Additional Visits**
- If high-risk (e.g., hypertension, diabetes, twins): More frequent visits
- Post-term (>40 weeks): Weekly visits until delivery

**Delivery**
- ANC card brought to facility during labor
- Delivery documented: Date/time, mode (vaginal/cesarean), outcome (live/stillbirth), birth weight
- Postnatal care: Mother and baby check before discharge

**Postnatal Follow-Up**
- Visit at 6 weeks post-delivery
- Check mother's recovery, family planning counseling
- Baby growth monitoring, immunizations

**EMR Requirements**
- ANC module with visit tracking (1st, 2nd, 3rd, 4th visits)
- Flag high-risk pregnancies
- Alert for overdue visits
- Print ANC card summary for patient
- Link to child health record after delivery

### Immunization Workflow (Child Welfare Clinic)

**Ghana Expanded Programme on Immunization (EPI) Schedule**

**At Birth**
- BCG (tuberculosis) - single dose
- Oral Polio Vaccine (OPV-0) - birth dose
- Hepatitis B - birth dose

**6 Weeks**
- OPV-1
- Pentavalent-1 (DPT-HepB-Hib)
- Pneumococcal Conjugate Vaccine (PCV-1)
- Rotavirus-1

**10 Weeks**
- OPV-2
- Pentavalent-2
- PCV-2
- Rotavirus-2

**14 Weeks**
- OPV-3
- Pentavalent-3
- PCV-3
- Inactivated Polio Vaccine (IPV)
- Rotavirus-3

**9 Months**
- Measles-Rubella (MR-1)
- Yellow Fever
- Meningococcal A

**18 Months**
- Measles-Rubella (MR-2)

**EMR Requirements**
- Immunization module with schedule tracking
- Alert for due/overdue immunizations
- Print immunization card for parent
- Adverse event reporting
- Stock management for vaccines

---

## Common Diagnoses and ICD-10 Codes

### Top 10 OPD Diagnoses in Ghana

1. **Malaria** - B54 (Unspecified malaria)
   - Clinical features: Fever, chills, headache, body aches
   - Diagnosis: RDT (Rapid Diagnostic Test) or microscopy
   - Treatment: Artemisinin-based Combination Therapy (ACT)

2. **Upper Respiratory Tract Infection (URTI)** - J06.9
   - Clinical features: Cough, sore throat, runny nose
   - Treatment: Symptomatic (paracetamol), antibiotics if bacterial

3. **Diarrhea** - A09 (Infectious gastroenteritis)
   - Clinical features: Loose stools, abdominal pain, vomiting
   - Treatment: ORS (Oral Rehydration Solution), zinc, antibiotics if severe

4. **Hypertension** - I10 (Essential hypertension)
   - Chronic condition, requires ongoing management
   - Treatment: Antihypertensives, lifestyle modifications

5. **Skin Infections** - L08.9 (Local infection of skin, unspecified)
   - Includes boils, abscesses, fungal infections
   - Treatment: Antibiotics, antifungals

6. **Rheumatism/Musculoskeletal Pain** - M79.9 (Soft tissue disorder, unspecified)
   - Clinical features: Joint pain, back pain
   - Treatment: NSAIDs, physiotherapy

7. **Anemia** - D64.9 (Anemia, unspecified)
   - Common in women and children
   - Causes: Iron deficiency, sickle cell, malaria
   - Treatment: Iron supplementation, treat underlying cause

8. **Eye Infections** - H10.9 (Conjunctivitis, unspecified)
   - Clinical features: Red eyes, discharge
   - Treatment: Antibiotic eye drops

9. **Urinary Tract Infection** - N39.0
   - Clinical features: Burning urination, frequency
   - Treatment: Antibiotics

10. **Diabetes Mellitus** - E11 (Type 2 diabetes)
    - Chronic condition, increasing prevalence
    - Treatment: Oral hypoglycemics, insulin, diet control

### Top IPD Diagnoses

1. **Malaria (Severe)** - B50-B54
2. **Pneumonia** - J18.9
3. **Gastroenteritis with Dehydration** - A09
4. **Pregnancy and Childbirth Complications** - O00-O99
5. **Anemia (Severe)** - D64.9
6. **Sickle Cell Crisis** - D57
7. **Typhoid Fever** - A01.0
8. **Sepsis** - A41
9. **Road Traffic Accidents** - V01-V99
10. **Surgical Conditions** (Appendicitis, Hernia, etc.) - K35, K40

---

## Essential Medicines List (Ghana)

### Common Medications by Category

**Antimalarials**
- Artemether-Lumefantrine (Coartem) - First-line for uncomplicated malaria
- Artesunate injection - Severe malaria
- Quinine - Alternative for severe malaria

**Antibiotics**
- Amoxicillin - First-line for respiratory, skin infections
- Cotrimoxazole (Septrin) - UTIs, diarrhea
- Metronidazole - Anaerobic infections, giardia
- Ciprofloxacin - UTIs, typhoid
- Benzylpenicillin injection - Severe infections, pneumonia
- Gentamicin injection - Severe infections, neonatal sepsis

**Analgesics/Antipyretics**
- Paracetamol (Acetaminophen) - Fever, mild pain
- Ibuprofen - Inflammation, moderate pain
- Diclofenac - Musculoskeletal pain
- Pethidine injection - Severe pain (labor, post-op)

**Antihypertensives**
- Amlodipine - Calcium channel blocker
- Enalapril - ACE inhibitor
- Hydrochlorothiazide - Diuretic
- Methyldopa - Pregnancy-safe antihypertensive

**Antidiabetics**
- Metformin - First-line for type 2 diabetes
- Glibenclamide - Sulfonylurea
- Insulin (NPH, Regular) - Type 1 diabetes, uncontrolled type 2

**IV Fluids**
- Normal Saline 0.9%
- Dextrose 5%
- Ringer's Lactate

**Vaccines**
- BCG, OPV, Pentavalent, PCV, Rotavirus, MR, Yellow Fever (per EPI schedule)

**Antimicrobials for TB**
- Rifampicin, Isoniazid, Ethambutol, Pyrazinamide (fixed-dose combinations)

**Antiretrovirals (separate HIV program, not NHIS)**
- TDF-3TC-EFV (first-line)
- AZT-3TC-NVP (alternative)

**Maternal/Child Health**
- Folic acid
- Iron sulfate
- Oxytocin injection (labor)
- Magnesium sulfate (pre-eclampsia)
- Oral Rehydration Solution (ORS)
- Zinc (diarrhea management)

**EMR Implications**
- Drug dictionary must match Ghana Essential Medicines List
- NHIS only covers medicines on the list
- Non-essential drugs: Patient pays out-of-pocket
- Stock management: Track availability, alert low stock

---

## Clinical Protocols and Guidelines

### Ghana Standard Treatment Guidelines (STG)

**Published by**: Ghana Health Service
**Purpose**: Standardize clinical practice, ensure quality care, guide NHIS coverage decisions

**Key Protocols**

**Malaria Management**
- Diagnosis: RDT or microscopy required before treatment (no presumptive treatment)
- Uncomplicated malaria: Artemether-Lumefantrine (ACT) × 3 days
- Severe malaria: Artesunate IV/IM, then oral ACT after able to take orally
- Pediatric dosing: Weight-based (5-15 kg, 15-25 kg, 25-35 kg, >35 kg)

**Pneumonia Management**
- Diagnosis: Cough, fever, fast breathing, chest indrawing
- Mild (outpatient): Amoxicillin PO × 5 days
- Severe (inpatient): Benzylpenicillin IV + Gentamicin IV × 7 days
- Oxygen therapy if hypoxic

**Diarrhea Management**
- Assessment: Dehydration status (no dehydration, some dehydration, severe dehydration)
- No dehydration: ORS at home, zinc × 10 days
- Some dehydration: ORS at facility, zinc
- Severe dehydration: IV fluids (Ringer's Lactate or Normal Saline), then ORS
- Antibiotics only if bloody diarrhea or cholera suspected

**Hypertension Management**
- Target: <140/90 mmHg (or <130/80 if diabetic)
- First-line: Thiazide diuretic (HCTZ) or Calcium channel blocker (Amlodipine)
- If not controlled: Add ACE inhibitor (Enalapril)
- Lifestyle: Salt reduction, weight loss, exercise

**Diabetes Management**
- Target: Fasting glucose <7 mmol/L, HbA1c <7%
- First-line: Metformin + lifestyle modifications
- If not controlled: Add Glibenclamide
- Insulin: If oral agents fail or type 1 diabetes
- Monitor: Fasting glucose, HbA1c every 3 months, foot care, eye exam annually

**Antenatal Care**
- 4+ visits (focused ANC model)
- Investigations: Hemoglobin, blood group, HIV, syphilis, urinalysis
- Medications: Folic acid, iron, antimalarial prophylaxis (IPTp)
- Tetanus toxoid: 2 doses if not previously immunized
- Birth preparedness: Facility delivery, transport plan

**Pediatric Dosing**
- Most drugs: Weight-based dosing (mg/kg)
- Weight bands common: <5 kg, 5-10 kg, 10-15 kg, 15-25 kg, >25 kg
- Paracetamol: 10-15 mg/kg every 6 hours
- Amoxicillin: 25 mg/kg every 8 hours

**Referral Criteria**
- Refer to higher-level facility if:
  - Severe condition requiring ICU, specialist care
  - Diagnostic facility not available (e.g., CT scan)
  - Surgical procedure beyond facility capacity
  - Complications during pregnancy/delivery
  - Failed treatment at lower level

**EMR Functionality**
- Embed clinical protocols in decision support
- Alert if dosing outside standard range
- Suggest investigations per STG
- Flag referral criteria met
- Generate referral letter with clinical summary

---

## Referral System

### Referral Pathway

**Level 1: CHPS** -> **Level 2: Health Center** -> **Level 3: District Hospital** -> **Level 4: Regional Hospital** -> **Level 5: Teaching Hospital**

Patients should follow this hierarchy, but emergencies can bypass.

### Referral Letter Requirements

**Mandatory Information**
- Patient demographics (name, age, gender, Ghana Card, NHIS number)
- Referring facility and provider name
- Date of referral
- Reason for referral (diagnosis, indication)
- Summary of clinical findings
- Investigations done and results
- Treatment given
- Urgency (urgent, routine)
- Receiving facility (if known)

**Referral Process**
1. Clinician writes referral letter
2. Patient given copy of referral letter
3. Copy filed in patient folder
4. Referral logged in register
5. Patient travels to referred facility (self-transport or ambulance)
6. Referred facility receives patient, reads referral letter
7. Referred facility provides care
8. Referred facility ideally sends feedback to referring facility (often not done)

**EMR Requirements**
- Generate referral letter from template
- Record referral in patient chart
- Track referral outcomes (did patient arrive? what was outcome?)
- Submit referral data to NHIE (enable receiving facility to access history)

---

## Data Protection and Consent

### Ghana Data Protection Act (Act 843, 2012)

**Key Principles**
- Personal data must be processed lawfully and fairly
- Collected for specified, explicit, legitimate purposes
- Adequate, relevant, and limited to purpose
- Accurate and kept up to date
- Retained no longer than necessary
- Processed securely

**Patient Rights**
- Right to be informed (how data will be used)
- Right to access (request copy of their medical record)
- Right to rectification (correct inaccurate data)
- Right to erasure (limited in medical context due to legal retention requirements)
- Right to data portability (receive data in usable format)

**Healthcare Exemptions**
- Medical records must be retained for minimum 7 years (some teaching hospitals: permanent)
- Patient cannot demand deletion of medical records (legal, clinical safety reasons)
- But patient can restrict unnecessary sharing

### Consent for Data Sharing

**Required Consent**
- Share data with NHIE: General consent at registration (one-time)
- Share data for research: Specific consent per study
- Share data with third parties (insurance, employers): Explicit written consent

**Implied Consent**
- Healthcare team at treating facility: Implied consent (part of care)
- Referrals: Implied consent (necessary for continuity)

**EMR Requirements**
- Capture consent at registration (checkbox: "I consent to share my health data with NHIE")
- Log all data access (who viewed patient chart, when)
- Provide patient portal for accessing own data (optional but recommended)
- Data export function (patient can request data in PDF or FHIR format)
- Audit trail: 7+ year retention

---

## Reporting and Analytics

### Mandatory Reports for Ghana Health Service

**Monthly Facility Report**
- OPD attendance (total visits, new vs returning)
- IPD admissions and discharges
- Deliveries (normal vs cesarean)
- Deaths (by age group, cause)
- Disease surveillance (malaria, diarrhea, pneumonia, etc.)
- Immunization coverage
- Family planning (new acceptors, continuing)

**DHIMS2 (District Health Information Management System 2)**
- National HMIS platform
- Facilities report monthly via web interface
- Data aggregated at district, regional, national levels

**EMR Integration**
- Generate DHIMS2 report data from EMR
- Export to DHIMS2 format (ideally auto-submit via API)
- Reduce manual double-entry burden

### NHIS Claims Report

**Monthly Claims Summary**
- Total claims submitted
- Total amount claimed
- Claims approved/rejected
- Payment received
- Outstanding claims

### Internal Facility Reports

**Daily Reports**
- OPD attendance
- IPD census (bed occupancy)
- Deliveries
- Deaths
- Revenue collected

**Weekly Reports**
- Disease trends (malaria cases, etc.)
- Drug stock levels
- Equipment downtime

**Ad-Hoc Reports**
- Patient list by diagnosis
- Defaulter tracking (TB, ART, chronic disease follow-ups)
- Appointment list for upcoming days
- Lab pending results

---

## Summary for Development Team

**Core Ghana Domain Knowledge**
- 16 regions, 260 districts, 950 facilities (ranging from CHPS to teaching hospitals)
- Ghana Card (national ID) is PRIMARY patient identifier
- NHIS (national insurance) covers 40% of population, requires eligibility verification
- Top diagnoses: Malaria, URTI, diarrhea, hypertension
- Clinical protocols: Ghana STG must guide treatment workflows
- Referral system: Hierarchical (CHPS -> Health Center -> District -> Regional -> Teaching)
- Data protection: Consent required for NHIE sharing, 7+ year audit log retention
- NHIS claims: 30-day submission window, batch processing, G-DRG tariff system

**EMR Must Support**
- Ghana Card, NHIS number, folder number as patient identifiers
- NHIS eligibility checking via NHIE
- Claims generation with G-DRG codes
- Referral letter generation
- Immunization schedule tracking (Ghana EPI)
- ANC visit tracking (4-visit model)
- DHIMS2 monthly reporting
- Offline capability (rural connectivity issues)
- Multi-language support (English, Twi, Ga, Ewe minimum)

**Cultural and Operational Context**
- Many patients have low literacy (icon-based UI helps)
- Mobile phone ownership high (SMS appointment reminders useful)
- Power outages common (offline mode, UPS required)
- Internet unreliable in rural areas (local server, queue and sync)
- Paper-based systems still prevalent (hybrid paper/digital workflows)
- Strong community health worker network (CHPS compounds, mobile health)
