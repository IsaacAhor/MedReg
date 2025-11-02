# OpenMRS Docker Setup

- Purpose: Run OpenMRS RefApp + MySQL locally with pinned versions.
- Outcome: Dev stack running with FHIR2, REST, HTML Form Entry, Initializer.

Sections
- Prereqs (Docker, Docker Compose)
- Images and versions to use
- docker-compose.yml example
- Environment variables
- Module list and enabling
- First-time setup steps
- Common issues and fixes

---

Deploying Custom Modules (Ghana Folder Number)

Purpose
- Provide a thread‑safe, server‑side folder number generator via REST endpoint.

Build
```bash
cd backend/ghana-foldernumber
mvn clean install
```

Deploy
1) Copy `omod/target/ghana-foldernumber-omod-0.1.0-SNAPSHOT.omod` into the OpenMRS modules directory inside the container (or host volume), e.g. `/openmrs/data/modules/`
2) Restart OpenMRS container
3) Verify module loaded in logs

Endpoint
- POST `/openmrs/ws/ghana/foldernumber/allocate?regionCode=GA&facilityCode=KBTH`
- Auth: Basic (admin/Admin123 in dev)
- Response: `{ "folderNumber": "GA-KBTH-2025-000001" }`

Database
- Liquibase creates table `gh_folder_number_sequence(prefix PK, last_seq INT)` on module startup.
