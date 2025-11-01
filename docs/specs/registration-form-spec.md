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
- On success: redirect to patient dashboard `/patients/{uuid}`.

Backend (OpenMRS)
- Endpoint: `POST /ws/rest/v1/ghana/patients` (register)
- Endpoint: `GET /ws/rest/v1/ghana/patients/search?q={query}` (search, 50/page)
- Auth: OpenMRS `Context`-based (session or Basic auth header)
- Response (register): `{ uuid, ghanaCard (masked), folderNumber }`
- PII: Mask identifiers and names in responses and audit logs.
