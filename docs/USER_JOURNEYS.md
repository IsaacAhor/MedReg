# User Journeys

## Journey 1: Patient Registration + First Consultation

1) Register patient at `/patients/register`
- Validate Ghana Card (format + checksum), optional NHIS
- On save, patient is added to the Triage queue

2) Triage
- Nurse opens `Triage Queue` → Start → record vitals
- Save moves patient to `Consultation Queue`

3) Consultation
- Doctor opens `Consultation Queue` → Start
- Record chief complaint, select diagnoses, prescribe, order labs
- Save moves patient to `Pharmacy Queue`

4) Pharmacy
- Pharmacist opens `Pharmacy Queue` → Start
- Select billing (NHIS/Cash) and dispense
- Save marks visit complete

## Journey 2: Follow-Up Visit (Existing Patient)

1) Search patient from global header or Patients page
2) Open patient hub → select OPD step (triage/consultation/dispense)
3) Continue standard queue flow as above

## Journey 3: Admin Monitors NHIE Sync Issues

1) Dashboard shows NHIE status and DLQ count
2) Admin navigates to NHIE queue page for details and retry guidance

## Journey 4: Doctor Views Reports

1) From header, open Reports
2) Download OPD register, NHIS vs Cash, Top Diagnoses, Revenue

## Navigation Patterns Summary

- Root redirect → `/dashboard` or `/login`
- Header: MedReg brand, patient search, role queues, reports
- Breadcrumbs on all OPD and patient pages
- Queue-first, auto-routing between stations

