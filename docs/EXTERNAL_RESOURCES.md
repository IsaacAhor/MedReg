# External Resources - Quick Reference

**Purpose:** Centralized index of ALL external documentation, APIs, and resources  
**Last Updated:** November 2, 2025  
**Maintenance:** Update whenever new resources are discovered or links change

---

## Table of Contents

1. [OpenMRS Documentation](#openmrs-documentation)
2. [FHIR & HL7 Resources](#fhir--hl7-resources)
3. [Ghana Health System](#ghana-health-system)
4. [African Regional Context](#african-regional-context)
5. [Development Tools & Libraries](#development-tools--libraries)
6. [Community & Support](#community--support)
7. [Quick Bookmarks](#quick-bookmarks)

---

## OpenMRS Documentation

### Core Platform
- **Main Website:** https://openmrs.org/
- **Wiki (Primary Docs):** https://wiki.openmrs.org/
- **Developer Guide:** https://wiki.openmrs.org/display/docs/Developer+Guide
- **Platform Docs:** https://wiki.openmrs.org/display/docs/OpenMRS+Platform
- **Data Model:** https://wiki.openmrs.org/display/docs/Data+Model
- **Module Development:** https://devmanual.openmrs.org/case_study/yourfirstmodule/
- **System Administration:** https://wiki.openmrs.org/display/docs/System+Administration

### REST API
- **REST API Reference:** https://rest.openmrs.org/
- **REST API Wiki:** https://wiki.openmrs.org/display/docs/REST+Web+Services+API+For+Clients
- **Swagger UI (Local):** http://localhost:8080/openmrs/module/webservices/rest/apiDocs.htm

**Key Endpoints:**
```
Base URL: http://localhost:8080/openmrs/ws/rest/v1

Authentication:
- POST   /session                  # Login
- GET    /session                  # Check auth status
- DELETE /session                  # Logout

Patients:
- GET    /patient?q={query}        # Search patients
- GET    /patient/{uuid}           # Get patient by UUID
- POST   /patient                  # Create patient
- POST   /patient/{uuid}           # Update patient

Encounters:
- GET    /encounter                # List encounters
- POST   /encounter                # Create encounter
- GET    /encounter/{uuid}         # Get encounter

Observations:
- GET    /obs                      # List observations
- POST   /obs                      # Create observation

Identifiers:
- GET    /patientidentifiertype    # List identifier types
- POST   /patientidentifiertype    # Create identifier type

Concepts:
- GET    /concept?q={query}        # Search concepts
- GET    /concept/{uuid}           # Get concept
- POST   /concept                  # Create concept

Users & Roles:
- GET    /user                     # List users
- POST   /user                     # Create user
- GET    /role                     # List roles
- POST   /role                     # Create role
- GET    /privilege                # List privileges
```

### FHIR Module
- **FHIR2 Module Wiki:** https://wiki.openmrs.org/display/projects/FHIR2+Module
- **FHIR2 GitHub:** https://github.com/openmrs/openmrs-module-fhir2
- **FHIR Documentation:** https://wiki.openmrs.org/display/projects/FHIR+Module+Documentation
- **FHIR Endpoints (Local):** http://localhost:8080/openmrs/ws/fhir2/R4/

**FHIR R4 Endpoints:**
```
Base URL: http://localhost:8080/openmrs/ws/fhir2/R4

Patients:
- GET    /Patient?identifier={system}|{value}  # Search by identifier
- GET    /Patient/{id}                         # Get patient by ID
- POST   /Patient                              # Create patient (not recommended - use REST API)

Encounters:
- GET    /Encounter?patient={id}               # Get patient encounters
- POST   /Encounter                            # Create encounter

Observations:
- GET    /Observation?patient={id}             # Get patient observations
- GET    /Observation?encounter={id}           # Get encounter observations
```

### OpenMRS 3.x (O3)
- **O3 Documentation:** https://o3-docs.openmrs.org/
- **O3 Developer Docs:** https://openmrs.atlassian.net/wiki/spaces/docs/pages/151093495
- **O3 Frontend Framework:** https://github.com/openmrs/openmrs-esm-core
- **O3 Developer Guide:** https://openmrs.atlassian.net/wiki/spaces/docs/pages/25467860
- **Reference Application:** https://wiki.openmrs.org/display/projects/Reference+Application+Distribution

**Note:** MedReg uses OpenMRS Platform 2.6.0 + Next.js frontend (not O3). O3 is documented for post-MVP consideration.

### Key OpenMRS Concepts
- **Concept Dictionary:** https://wiki.openmrs.org/display/docs/Concept+Dictionary+Basics
- **Patient Identifiers:** https://wiki.openmrs.org/display/docs/Patient+Identifiers
- **HTML Form Entry:** https://wiki.openmrs.org/display/docs/HTML+Form+Entry
- **OCL for OpenMRS:** https://wiki.openmrs.org/display/projects/OCL+for+OpenMRS
- **ID Generation:** https://github.com/openmrs/openmrs-module-idgen
- **Liquibase Migrations:** https://wiki.openmrs.org/display/docs/Liquibase

### Security
- **User Management:** https://guide.openmrs.org/administering-openmrs/user-management-and-access-control/
- **Minimum Baseline Security Standard:** https://openmrs.atlassian.net/wiki/spaces/docs/pages/216530945
- **Offline & Internet FAQs:** https://openmrs.atlassian.net/wiki/spaces/docs/pages/152731650

### Docker Images
- **OpenMRS Platform Docker:** https://hub.docker.com/r/openmrs/openmrs-core
- **Reference Application Docker:** https://hub.docker.com/r/openmrs/openmrs-reference-application-distro

**MedReg Uses:**
```yaml
services:
  openmrs:
    image: openmrs/openmrs-reference-application-distro:2.11.0
    # Includes OpenMRS Platform 2.6.0 + REST module + 30+ modules
```

---

## FHIR & HL7 Resources

### FHIR Specifications
- **FHIR R4 Specification:** http://hl7.org/fhir/R4/
- **Patient Resource:** http://hl7.org/fhir/R4/patient.html
- **Encounter Resource:** http://hl7.org/fhir/R4/encounter.html
- **Observation Resource:** http://hl7.org/fhir/R4/observation.html
- **Coverage Resource:** http://hl7.org/fhir/R4/coverage.html (NHIS eligibility)
- **Claim Resource:** http://hl7.org/fhir/R4/claim.html (NHIS claims)
- **Condition Resource:** http://hl7.org/fhir/R4/condition.html (diagnoses)
- **MedicationRequest:** http://hl7.org/fhir/R4/medicationrequest.html (prescriptions)

### HAPI FHIR Library
- **HAPI FHIR Documentation:** https://hapifhir.io/hapi-fhir/docs/
- **HAPI FHIR GitHub:** https://github.com/hapifhir/hapi-fhir
- **HAPI FHIR JPA Starter:** https://github.com/hapifhir/hapi-fhir-jpaserver-starter

**MedReg Uses:**
- Backend: HAPI FHIR 5.x (Java library for FHIR resource generation)
- NHIE Mock: HAPI FHIR JPA Starter v7.0.2 (http://localhost:8090)

### Terminology Services
- **ICD-10 (WHO):** https://www.who.int/standards/classifications/classification-of-diseases
- **ICD-10 Browser:** https://icd.who.int/browse10/2019/en
- **LOINC (Lab Codes):** https://loinc.org/
- **SNOMED CT:** https://www.snomed.org/

---

## Ghana Health System

### National Health Insurance Authority (NHIA)
- **NHIA Website:** https://www.nhis.gov.gh/
- **About NHIS:** https://www.nhis.gov.gh/about.aspx
- **Claims Process:** https://www.nhis.gov.gh/claims.aspx
- **Provider Portal:** (Contact NHIA for credentials)
- **Tariff Codes:** (Not publicly available - contact NHIA for provider manual)

### Ghana Health Service
- **GHS Website:** https://ghs.gov.gh/
- **Facility Directory:** https://ghs.gov.gh/facilities/
- **DHIS2 Portal:** https://dhis2.ghs-moh.org/ (MoH reporting system)

### Ministry of Health (MoH)
- **MoH Website:** https://www.moh.gov.gh/
- **Digital Health Unit:** info@moh.gov.gh
- **NHIE Specifications:** (Contact Digital Health Unit - specs not yet public as of Nov 2025)

### Ghana Card (National Identification)
- **National Identification Authority:** https://www.nia.gov.gh/
- **Ghana Card Overview:** https://www.nia.gov.gh/ghanacard/
- **Format:** `GHA-XXXXXXXXX-X` (3 chars + hyphen + 9 digits + hyphen + 1 check digit)
- **Validation:** Luhn checksum algorithm
  ```typescript
  // Implementation: frontend/src/lib/validators/ghana-card.ts
  // See: AGENTS.md lines 200-230
  ```

### Ghana Administrative Regions (16 Regions)
**Reference:** `domain-knowledge/identifiers.md`

| Code | Region | Capital |
|------|--------|---------|
| AR | Ashanti | Kumasi |
| BER | Bono East | Techiman |
| BR | Bono | Sunyani |
| CR | Central | Cape Coast |
| ER | Eastern | Koforidua |
| GAR | Greater Accra | Accra |
| NER | North East | Nalerigu |
| NR | Northern | Tamale |
| NWR | North West | Wa |
| OR | Oti | Dambai |
| SR | Savannah | Damongo |
| UER | Upper East | Bolgatanga |
| UWR | Upper West | Wa |
| VR | Volta | Ho |
| WR | Western | Sekondi-Takoradi |
| WNR | Western North | Sefwi Wiawso |

---

## African Regional Context

### Uganda EMR (METS Programme) ⭐ **MOST RELEVANT**
**Complete documentation:** `docs/UGANDA_EMR_REFERENCE.md` (1000+ lines)

**GitHub Organization:** https://github.com/METS-Programme  
**License:** Mozilla Public License 2.0 (can fork/adapt with attribution)  
**Status:** Active development (last update 4-5 days ago as of Nov 2025)

**Critical Repositories:**

1. **openmrs-module-ugandaemr-sync** ⭐⭐⭐⭐⭐
   - **URL:** https://github.com/METS-Programme/openmrs-module-ugandaemr-sync
   - **Relevance:** NHIE integration pattern (queue + retry + FHIR sync)
   - **Key for Ghana:** OAuth 2.0 + exponential backoff + transaction logging

2. **openmrs-module-ugandaemr** ⭐⭐⭐⭐
   - **URL:** https://github.com/METS-Programme/openmrs-module-ugandaemr
   - **Relevance:** Core module architecture, identifier generation, queue management
   - **Key for Ghana:** Folder number generation, Ghana Card validator, OPD queue

3. **openmrs-module-ugandaemr-reports** ⭐⭐⭐
   - **URL:** https://github.com/METS-Programme/openmrs-module-ugandaemr-reports
   - **Relevance:** Government reporting patterns
   - **Key for Ghana:** MoH OPD register, NHIS vs Cash reports, DHIS2 integration

4. **esm-ugandaemr-core** (OpenMRS 3.x)
   - **URL:** https://github.com/METS-Programme/esm-ugandaemr-core
   - **Relevance:** O3 implementation in African context
   - **Key for Ghana:** Post-MVP migration path if we adopt O3

5. **ugandaemr-metadata**
   - **URL:** https://github.com/METS-Programme/ugandaemr-metadata
   - **Relevance:** Metadata deployment patterns

6. **ugandaemr-technicalguide**
   - **URL:** https://github.com/METS-Programme/ugandaemr-technicalguide
   - **Relevance:** OpenMRS best practices

**Uganda EMR Technical Guide:**
- **Customization Guidelines:** https://mets-programme.gitbook.io/ugandaemr-technical-guide/guidelines-for-customizing-ugandaemr
- **Metadata Management:** https://mets-programme.gitbook.io/ugandaemr-technical-guide/metadata-management
- **Form Management:** https://mets-programme.gitbook.io/ugandaemr-technical-guide/form-management
- **Report Development:** https://mets-programme.gitbook.io/ugandaemr-technical-guide/report-development-guidelines
- **Creating Custom Module:** https://mets-programme.gitbook.io/ugandaemr-technical-guide/creating-a-custom-module
- **Releasing:** https://mets-programme.gitbook.io/ugandaemr-technical-guide/releasing

### Kenya HIE
- **Architecture:** Similar to Ghana NHIE (national middleware for data sharing)
- **FHIR Standard:** FHIR R4 (same as Ghana)
- **Key Insight:** OpenMRS at facility → FHIR sync → National MPI/SHR (proven at scale)

### Rwanda EMR
- **Deployment:** All public facilities nationwide
- **Key Insight:** OpenMRS fully white-labeled (no OpenMRS branding visible to users)

---

## Development Tools & Libraries

### Frontend (Next.js)

#### Core Framework
- **Next.js:** https://nextjs.org/docs
- **React:** https://react.dev/
- **TypeScript:** https://www.typescriptlang.org/docs/

#### UI Components
- **shadcn/ui:** https://ui.shadcn.com/docs
- **Radix UI:** https://www.radix-ui.com/primitives/docs/overview/introduction
- **Lucide Icons:** https://lucide.dev/icons/
- **Tailwind CSS:** https://tailwindcss.com/docs

#### State Management & Data Fetching
- **TanStack Query (React Query):** https://tanstack.com/query/latest/docs/framework/react/overview
- **React Hook Form:** https://react-hook-form.com/get-started
- **Zod (Validation):** https://zod.dev/

#### Utilities
- **date-fns:** https://date-fns.org/docs/Getting-Started
- **clsx:** https://github.com/lukeed/clsx
- **Axios:** https://axios-http.com/docs/intro

### Backend (Java/Spring)

#### Spring Framework
- **Spring Boot:** https://spring.io/projects/spring-boot
- **Spring Security:** https://spring.io/projects/spring-security
- **Spring Data JPA:** https://spring.io/projects/spring-data-jpa

#### Testing
- **JUnit 5:** https://junit.org/junit5/docs/current/user-guide/
- **Mockito:** https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html
- **AssertJ:** https://assertj.github.io/doc/

#### Utilities
- **Apache Commons:** https://commons.apache.org/
- **Lombok:** https://projectlombok.org/features/
- **Jackson (JSON):** https://github.com/FasterXML/jackson-docs

### Database
- **MySQL 5.7 Documentation:** https://dev.mysql.com/doc/refman/5.7/en/
- **Liquibase:** https://docs.liquibase.com/home.html
- **Hibernate ORM:** https://hibernate.org/orm/documentation/5.6/

### DevOps & Deployment
- **Docker:** https://docs.docker.com/
- **Docker Compose:** https://docs.docker.com/compose/
- **GitHub Actions:** https://docs.github.com/en/actions
- **Vercel (Frontend Hosting):** https://vercel.com/docs

---

## Community & Support

### OpenMRS Community
- **OpenMRS Talk (Forum):** https://talk.openmrs.org/
- **OpenMRS Slack:** https://slack.openmrs.org/
- **OpenMRS IRC:** irc://irc.freenode.net/#openmrs
- **Mailing Lists:** https://wiki.openmrs.org/display/RES/Mailing+Lists

**Key Slack Channels:**
- **#dev** - Development questions
- **#implementers** - Implementation support
- **#fhir** - FHIR module discussions
- **#africa** - African implementations (Kenya, Uganda, Rwanda, etc.)

### Getting Help
1. **Technical Questions:** OpenMRS Talk (https://talk.openmrs.org/)
2. **Code Issues:** GitHub Issues on relevant repository
3. **Real-time Chat:** OpenMRS Slack #dev channel
4. **African Context:** Reach out to METS Programme (Uganda), Ampath (Kenya), Partners In Health

### Contributing Back
**If MedReg succeeds, consider contributing:**
- Ghana-specific modules back to OpenMRS community
- NHIE integration patterns (help other African countries)
- White-label patterns for national EMR deployments
- OpenMRS Talk: Share lessons learned from Ghana pilot

---

## Quick Bookmarks

### 🔥 Most Used (Bookmark These)

**Daily Development:**
1. **OpenMRS REST API:** https://rest.openmrs.org/
2. **FHIR R4 Spec:** http://hl7.org/fhir/R4/
3. **shadcn/ui Docs:** https://ui.shadcn.com/docs
4. **TanStack Query:** https://tanstack.com/query/latest
5. **Next.js Docs:** https://nextjs.org/docs

**African Context:**
6. **Uganda EMR Sync:** https://github.com/METS-Programme/openmrs-module-ugandaemr-sync
7. **Uganda EMR Core:** https://github.com/METS-Programme/openmrs-module-ugandaemr

**Ghana Domain:**
8. **Ghana Card Format:** `GHA-XXXXXXXXX-X` (Luhn checksum)
9. **NHIS Number Format:** 10 digits (no hyphens)
10. **Ghana Regions:** 16 total (GAR, AR, NR, etc.)

**Support:**
11. **OpenMRS Talk:** https://talk.openmrs.org/
12. **OpenMRS Slack:** https://slack.openmrs.org/

### 📦 MedReg Local Endpoints

**Development (Docker Compose):**
```bash
Frontend:            http://localhost:3000
OpenMRS REST API:    http://localhost:8080/openmrs/ws/rest/v1
OpenMRS FHIR R4:     http://localhost:8080/openmrs/ws/fhir2/R4
NHIE Mock Server:    http://localhost:8090/fhir
MySQL:               localhost:3307 (user: openmrs_user, password: openmrs_password)
```

**Swagger UI:**
```bash
OpenMRS REST API Docs:   http://localhost:8080/openmrs/module/webservices/rest/apiDocs.htm
```

**Authentication:**
```bash
# Get session (login)
curl -X POST http://localhost:8080/openmrs/ws/rest/v1/session \
  -u admin:Admin123

# Check auth status
curl http://localhost:8080/openmrs/ws/rest/v1/session

# PowerShell (Windows)
$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:Admin123"))
Invoke-WebRequest -Uri "http://localhost:8080/openmrs/ws/rest/v1/session" -Headers @{Authorization="Basic $cred"}
```

---

## File Location Index

**Where to find external resources in this project:**

| Resource Type | Primary Document | Lines |
|---------------|------------------|-------|
| Uganda EMR (detailed code examples) | `docs/UGANDA_EMR_REFERENCE.md` | All |
| OpenMRS REST API patterns | `AGENTS.md` | 1000-1100 |
| NHIE integration spec | `AGENTS.md` | 700-900 |
| Ghana domain rules | `AGENTS.md` | 150-400 |
| Frontend patterns | `AGENTS.md` | 1150-1250 |
| Setup commands | `docs/setup/week1-setup-guide.md` | All |
| NHIE mock server | `docs/setup/nhie-mock-guide.md` | All |
| Test scenarios | `docs/qa/test-plan.md` | All |
| Deployment guide | `docs/deploy/pilot-deployment-guide.md` | All |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2, 2025 | Initial consolidated external resources document |

---

**Maintenance Notes:**
- Update this file whenever new external resources are discovered
- Verify links quarterly (OpenMRS URLs sometimes change)
- Add new resources to appropriate section (maintain structure)
- Cross-reference with `AGENTS.md` and `docs/UGANDA_EMR_REFERENCE.md` to avoid duplication

**Related Documents:**
- **AGENTS.md** - Comprehensive AI agent guide (includes architecture patterns, code examples)
- **docs/UGANDA_EMR_REFERENCE.md** - Uganda EMR detailed code adaptation strategies
- **docs/QUICK_REFERENCE.md** - Quick commands and code snippets
- **docs/DOCUMENTATION_STRUCTURE.md** - Documentation organization

---

**Last Updated:** November 2, 2025  
**Maintained by:** MedReg Development Team  
**Questions?** Open issue on GitHub: https://github.com/IsaacAhor/MedReg/issues
