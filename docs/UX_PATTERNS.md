# UX Patterns

## Why No Marketing Homepage

MedReg is a clinical EMR. Industry-standard user journeys (UgandaEMR, OpenMRS O3, Bahmni) start users inside the system, not on a marketing page. The root route `/` detects session and redirects:
- Authenticated users → `/dashboard`
- Unauthenticated users → `/login`

This reduces friction, avoids dead ends, and aligns with OPD-first workflow.

## Navigation Architecture

- Global header with quick patient search and primary routes
- Role-oriented queue links: Triage Queue, Consult Queue, Pharmacy Queue
- Patients and Reports always available from the header

## Queue-First Workflow

Reception registers the patient to the queue. Nurses, doctors, and pharmacists work from their queues. Completing a step moves the patient to the next station automatically.

## Role-Based Landing

Dashboard widgets adapt to role:
- Nurse → Triage queue snapshot
- Doctor → Consultation queue snapshot
- Pharmacist → Pharmacy queue snapshot

## Automatic Workflow Routing

When OPD forms are launched from a queue (`queueUuid` present):
- Triage save → move to Consultation queue
- Consultation save → move to Pharmacy queue
- Dispense save → mark visit complete

## Breadcrumb Navigation

Every page displays a simple, consistent breadcrumb:
`Dashboard / Section / Page`

Examples:
- `Dashboard / Triage Queue / Record Vitals`
- `Dashboard / Patients / Register`

## Success Feedback Pattern

- Use toast notifications for success and error
- After success, auto-redirect after ~1.5s to the next logical page (queue)
- Keep users on the form when errors occur to retry

## Patient Search (Two Access Points)

- Global header: quick find by Ghana Card, Folder Number, or Name
- Patients page: full list with filters and navigation to details

## Mobile/Tablet Optimization

- Buttons large enough for touch targets
- Tables scroll horizontally on small screens
- Minimal modal usage; prefer full pages for forms

## References

- UgandaEMR success story: https://openmrs.org/ugandaemr-o3-success-story/
- OpenMRS 3.x patterns: https://o3-docs.openmrs.org/
- Bahmni EMR: https://www.bahmni.org/

