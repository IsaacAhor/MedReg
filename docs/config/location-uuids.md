# OPD Workflow Location UUIDs

**Last Updated:** November 9, 2025  
**Source:** Verified during runtime validation task on November 5 (see `IMPLEMENTATION_TRACKER.md`, Week 3 notes)

| Location     | UUID                                   | Purpose                                      |
|--------------|----------------------------------------|----------------------------------------------|
| Triage       | `0f1f6b3e-1c2d-4a5b-9c6d-7e8f90a1b2c3` | Intake + vitals capture                      |
| Consultation | `1a2b3c4d-5e6f-4a70-8b90-1c2d3e4f5a6b` | Clinician encounter + diagnosis/prescription |
| Pharmacy     | `2b3c4d5e-6f70-4a81-9b01-2c3d4e5f6a7b` | Dispensing + billing confirmation            |

These UUIDs must stay consistent across environments so queue transitions and dashboard KPIs resolve the correct OpenMRS locations.

---

## Frontend Configuration

Set the following values in your `.env.local` (or equivalent deployment secrets):

```bash
NEXT_PUBLIC_TRIAGE_LOCATION_UUID=0f1f6b3e-1c2d-4a5b-9c6d-7e8f90a1b2c3
NEXT_PUBLIC_CONSULTATION_LOCATION_UUID=1a2b3c4d-5e6f-4a70-8b90-1c2d3e4f5a6b
NEXT_PUBLIC_PHARMACY_LOCATION_UUID=2b3c4d5e-6f70-4a81-9b01-2c3d4e5f6a7b
NEXT_PUBLIC_QUEUE_POLL_INTERVAL=10000
```

Used by:
- Queue pages (`/opd/*-queue`)
- Dashboard KPI widgets
- Registration flow auto-dispatch (`/api/v1/ghana/patients`)
- OPD form handoffs (triage → consultation → pharmacy)

---

## Backend Global Properties

Seed these OpenMRS global properties (via REST or SQL) so server-side components can resolve the same locations:

| Property                                   | Value (UUID)                               |
|--------------------------------------------|--------------------------------------------|
| `ghanaemr.triage.location.uuid`            | `0f1f6b3e-1c2d-4a5b-9c6d-7e8f90a1b2c3`     |
| `ghanaemr.consultation.location.uuid`      | `1a2b3c4d-5e6f-4a70-8b90-1c2d3e4f5a6b`     |
| `ghanaemr.pharmacy.location.uuid`          | `2b3c4d5e-6f70-4a81-9b01-2c3d4e5f6a7b`     |

REST helper:

```bash
curl -u admin:Admin123 -X POST \
  "http://localhost:8080/openmrs/ws/rest/v1/systemsetting" \
  -H "Content-Type: application/json" \
  -d '{"property":"ghanaemr.triage.location.uuid","value":"0f1f6b3e-1c2d-4a5b-9c6d-7e8f90a1b2c3"}'
# Repeat for consultation + pharmacy properties
```

The database bootstrap script (`mysql-init/01-init-ghana-emr.sql`) now seeds these properties automatically for fresh environments.

---

## Verification Checklist

```bash
# (1) Confirm locations exist
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e \
  "SELECT name, uuid FROM location WHERE uuid IN ('0f1f6b3e-1c2d-4a5b-9c6d-7e8f90a1b2c3','1a2b3c4d-5e6f-4a70-8b90-1c2d3e4f5a6b','2b3c4d5e-6f70-4a81-9b01-2c3d4e5f6a7b');"

# (2) Frontend env wiring
grep -E 'LOCATION_UUID|QUEUE_POLL' frontend/.env.local

# (3) Backend global properties
curl -s -u admin:Admin123 \
  "http://localhost:8080/openmrs/ws/rest/v1/systemsetting?q=ghanaemr&v=default" | jq
```

If any UUID is missing, recreate the location through the OpenMRS admin UI or REST API, then update this document to preserve the authoritative mapping.
