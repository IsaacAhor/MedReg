# Registration Form Spec

Scope
- Demographics, identifiers (Ghana Card, NHIS, Folder Number), optional photo.

Validations
- Ghana Card: `GHA-XXXXXXXXX-X` with Luhn checksum (real-time validation).
- NHIS: 10 digits (optional at registration).
- Phone: `+233XXXXXXXXX` format.
- DOB: cannot be in the future.
- Folder number: auto-generated `[REGION]-[FACILITY]-[YEAR]-[SEQUENCE]` (backend service).

Search
- By Ghana Card, NHIS, folder number, name + DOB.

Frontend (Next.js)
- Page: `frontend/src/app/patients/register/page.tsx`
- Libraries: React Hook Form + Zod, shadcn/ui Form components, TanStack Query.
- Fields: Ghana Card, NHIS (optional), Given/Family/Middle names, DOB (date input), Gender (M/F/O), Phone, Address (Region dropdown, District, Town, Street).
- On success: redirect to success page `/patients/{uuid}/success?folder={folderNumber}`.

Backend (BFF + OpenMRS)
- BFF Route: `POST /api/patients` (Next.js route handler)
  - Duplicate check: `GET /openmrs/ws/rest/v1/patient?identifier={ghanaCard}` (409 if exists)
  - Person create: `POST /openmrs/ws/rest/v1/person`
  - Folder number: `POST /openmrs/ws/ghana/foldernumber/allocate` (preferred) or systemsetting fallback
  - Patient create: `POST /openmrs/ws/rest/v1/patient` with identifiers [Ghana Card, Folder Number]
  - Response: `{ success, patient: { uuid, ghanaCard(masked), folderNumber } }`
- Search (placeholder): `GET /api/patients?q={query}` → proxies to OpenMRS
- Auth: OpenMRS Basic (dev) managed by BFF; browser never calls OpenMRS directly in prod.
- PII: Mask identifiers in responses and logs.
