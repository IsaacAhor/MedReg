# MedReg - Ghana EMR MVP

**Ghana NHIE-Compliant Electronic Medical Records System**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Java](https://img.shields.io/badge/Java-8-orange)]()
[![OpenMRS](https://img.shields.io/badge/OpenMRS-2.6.0-blue)]()
[![License](https://img.shields.io/badge/license-MPL%202.0-blue)]()

---

## 🚨 CRITICAL: READ BEFORE STARTING 🚨

### ⚠️ MANDATORY TECHNOLOGY VERSIONS (DO NOT CHANGE)

This project has **HARD REQUIREMENTS** due to OpenMRS 2.4.0 compatibility:

| Technology | Required Version | ❌ DO NOT USE | Why Locked |
|------------|------------------|---------------|------------|
| **Java** | **8 (1.8.0_472)** | Java 11, 17, 21 | OpenMRS 2.4.0 breaks with Java 11+ |
| **MySQL** | **5.7.x** | MySQL 8.0+ | Connector/J incompatibility |
| **OpenMRS** | **2.6.0** | OpenMRS 3.x (O3) | 4-6 week migration effort |
| **Mockito** | **3.12.4** | Mockito 5.x | Requires Java 11+ |
| **Maven** | **3.9.x** | N/A | Current stable |

### 🔍 Verify Your Environment (Required Before Contributing)

```bash
# Check Java version (MUST be 1.8.0_472)
java -version

# Check Maven version (MUST use Java 8)
mvn -version

# Check MySQL version (MUST be 5.7.x)
docker exec mysql mysql --version
```

**If any version is wrong, DO NOT PROCEED. See [Setup Guide](#quick-start) to fix.**

---

## 🎯 Project Overview

**What:** Electronic Medical Records (EMR) system for Ghana's healthcare facilities  
**Target:** Win Ministry of Health (MoH) pilot facility + EOI Q1 2026  
**Timeline:** 16-20 weeks to functional MVP  
**Status:** Week 2 Complete - Module Builds Successfully ✅

### Key Features (MVP Scope)
- ✅ Patient Registration (Ghana Card, NHIS, folder number)
- ✅ OPD Workflow (triage → consultation → pharmacy → billing)
- ✅ NHIS Integration (eligibility check, claims export)
- ✅ NHIE Sync (patient + encounter → national HIE)
- ✅ Reports (OPD register, NHIS vs Cash, top diagnoses, revenue)
- ✅ Admin Dashboard (KPIs, NHIE monitoring, user management)
- ✅ 8-Role User Management (Platform Admin, Facility Admin, Doctor, Nurse, Pharmacist, Records, Cashier, NHIS Officer)

---

## 🚀 Quick Start

### Prerequisites

**MUST have these EXACT versions installed:**

1. **Java 8 (OpenJDK 1.8.0_472)**
   ```bash
   # Download: Eclipse Temurin OpenJDK 8
   # Windows: https://adoptium.net/temurin/releases/?version=8
   # Set JAVA_HOME: C:\Program Files\Eclipse Adoptium\jdk-8.0.472.8-hotspot
   ```

2. **Maven 3.9.x**
   ```bash
   # Download: https://maven.apache.org/download.cgi
   # Add to PATH: C:\path\to\apache-maven-3.9.x\bin
   ```

3. **Docker Desktop**
   ```bash
   # Download: https://www.docker.com/products/docker-desktop
   # Required for MySQL 5.7 + OpenMRS containers
   ```

4. **Node.js 18+ (for frontend)**
   ```bash
   # Download: https://nodejs.org/
   # Only needed if working on Next.js frontend
   ```

### Installation

```bash
# 1. Clone repository
git clone https://github.com/IsaacAhor/MedReg.git
cd MedReg

# 2. Verify Java version (CRITICAL CHECK)
java -version
# Expected output: openjdk version "1.8.0_472"
# If wrong version, STOP and install Java 8 first!

# 3. Start backend (Docker containers)
docker-compose up -d mysql
# Wait 30 seconds for MySQL initialization

docker-compose up -d openmrs
# Wait 3-5 minutes for first-time startup

# 4. Verify OpenMRS is running
# Browser: http://localhost:8080/openmrs
# Expected: "OpenMRS Platform 2.6.0 Running!" (no UI is normal - we use REST API)

# 5. Verify REST API (CRITICAL - this is what we need)
curl http://localhost:8080/openmrs/ws/rest/v1/session
# Expected: {"sessionId":"...","authenticated":false}

# 6. Test authentication
curl -u admin:Admin123 http://localhost:8080/openmrs/ws/rest/v1/session
# Expected: {"authenticated":true,"user":{"username":"admin",...}}

# 7. Build custom OpenMRS module
cd backend/openmrs-module-ghanaemr
mvn clean package -Dmaven.test.skip=true
# Expected: BUILD SUCCESS (4-5 seconds)

# 8. Start frontend (optional - if working on UI)
cd ../../frontend
npm install
cp .env.example .env.local
npm run dev
# Frontend: http://localhost:3000
```

### Verify Installation Success

**All these must pass:**
- ✅ `java -version` shows `1.8.0_472`
- ✅ `mvn -version` shows `Java version: 1.8.0_472`
- ✅ MySQL container running: `docker ps | grep mysql` (port 3307)
- ✅ OpenMRS container running: `docker ps | grep openmrs` (port 8080)
- ✅ OpenMRS REST API responds: `curl http://localhost:8080/openmrs/ws/rest/v1/session`
- ✅ Module builds: `mvn clean package` → BUILD SUCCESS

---

## 📚 Documentation

**Essential Reading (in order):**

1. **[AGENTS.md](AGENTS.md)** - 🚨 **START HERE** - Architecture rules, Ghana domain knowledge, code patterns, setup commands
2. **[IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md)** - Week-by-week progress, build guides, troubleshooting
3. **[docs/setup/week1-setup-guide.md](docs/setup/week1-setup-guide.md)** - Detailed backend setup walkthrough
4. **[docs/UGANDA_EMR_REFERENCE.md](docs/UGANDA_EMR_REFERENCE.md)** - NHIE integration patterns from Uganda EMR

**Architecture & Planning:**
- [08_MVP_Build_Strategy.md](08_MVP_Build_Strategy.md) - 16-20 week timeline, team structure, budget
- [02_NHIE_Integration_Technical_Specifications.md](02_NHIE_Integration_Technical_Specifications.md) - NHIE OAuth, FHIR profiles, endpoints
- [03_Ghana_Health_Domain_Knowledge.md](03_Ghana_Health_Domain_Knowledge.md) - Ghana Card, NHIS, folder numbers, workflows

**Development Guides:**
- [04_OpenMRS_Development_Patterns.md](04_OpenMRS_Development_Patterns.md) - OpenMRS service patterns, REST controllers, transactions
- [docs/setup/nhie-mock-guide.md](docs/setup/nhie-mock-guide.md) - NHIE mock server setup (HAPI FHIR + Docker)
- [docs/setup/location-based-login-guide.md](docs/setup/location-based-login-guide.md) - Location-based login implementation

---

## 🏗️ Tech Stack

### Backend
- **OpenMRS Platform 2.6.0** (EMR engine)
- **Java 8** (Eclipse Temurin 1.8.0_472)
- **Spring Framework 4.x** (bundled with OpenMRS)
- **MySQL 5.7** (database)
- **HAPI FHIR 5.7.0** (FHIR R4 for NHIE integration)
- **Maven 3.9.x** (build tool)
- **Docker** (containerization)

### Frontend (Option B - Next.js)
- **Next.js 14.x** (App Router)
- **TypeScript 5.x** (strict mode)
- **shadcn/ui** + Radix UI (components)
- **Tailwind CSS 3.x** (styling)
- **TanStack Query 5.x** (server state)
- **React Hook Form 7.x** + Zod (forms + validation)
- **Axios** (OpenMRS REST API client)

### Deployment
- **Backend:** Ubuntu 22.04 + Docker
- **Frontend:** Vercel / Netlify
- **Database:** MySQL 5.7 (managed or self-hosted)
- **CI/CD:** GitHub Actions

---

## 🛠️ Development

### Build Commands

```bash
# Backend (OpenMRS module)
cd backend/openmrs-module-ghanaemr
mvn clean install                    # Full build with tests
mvn clean package -Dmaven.test.skip=true  # Quick build
mvn test                            # Run tests only
mvn test -Dtest=PatientServiceTest  # Run specific test

# Frontend (Next.js)
cd frontend
npm run dev                         # Development server (http://localhost:3000)
npm run build                       # Production build
npm test                            # Run Vitest tests
npm run test:watch                  # Watch mode
npm run lint                        # ESLint + TypeScript checks
npm run format                      # Prettier formatting
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d mysql
docker-compose up -d openmrs

# View logs
docker-compose logs -f openmrs
docker-compose logs -f mysql

# Stop services
docker-compose down

# Restart after code changes
docker-compose restart openmrs

# Clean restart (remove volumes)
docker-compose down -v
docker-compose up -d
```

### Database Access

```bash
# Connect to MySQL (external port 3307)
mysql -h localhost -P 3307 -u openmrs_user -p openmrs
# Password: openmrs_password

# Or via Docker
docker exec -it mysql mysql -u openmrs_user -p openmrs
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend/openmrs-module-ghanaemr
mvn test                                    # All unit tests
mvn verify                                  # Integration tests
mvn test -Dtest.groups=NHIE                # NHIE integration tests only
```

### Frontend Tests
```bash
cd frontend
npm test                                    # All Vitest tests
npm test src/components/PatientForm.test.tsx  # Specific test
npm run test:coverage                       # Coverage report (target >70%)
npm run test:e2e                            # Playwright E2E tests
```

### Test Coverage Goals
- **Backend:** >70% line coverage
- **Frontend:** >70% line coverage
- **E2E:** Critical flows (patient registration, OPD workflow)

---

## 🚧 Common Issues & Solutions

### Issue 1: Wrong Java Version

**Symptom:**
```
mvn clean package
[ERROR] Failed to execute goal: Unsupported major.minor version 52.0
```

**Solution:**
```bash
# Check Java version
java -version
# If not 1.8.0_472, install Java 8 and set JAVA_HOME

# Windows: Set JAVA_HOME in System Environment Variables
# JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-8.0.472.8-hotspot
# PATH += %JAVA_HOME%\bin
```

### Issue 2: MySQL 8.0 Compatibility Error

**Symptom:**
```
OpenMRS startup fails with: "Unknown system variable 'storage_engine'"
```

**Solution:**
```bash
# MUST use MySQL 5.7, not 8.0
# Check docker-compose.yml:
# mysql:
#   image: mysql:5.7  # NOT mysql:8.0
docker-compose down -v
docker-compose up -d mysql
```

### Issue 3: OpenMRS Shows "No UI Module Installed"

**This is NORMAL!** OpenMRS Platform 2.6.0 has no UI by design.

**What to do:**
- ✅ Verify REST API works: `curl http://localhost:8080/openmrs/ws/rest/v1/session`
- ✅ Use Next.js frontend (http://localhost:3000)
- ✅ Or use Postman/curl for API testing

### Issue 4: Module Build Fails (30+ Errors)

**Symptom:**
```
[ERROR] cannot find symbol: class Patient (ambiguous reference)
[ERROR] method getPatientsByIdentifier not found
```

**Solution:**
```bash
# These were fixed in Week 2. If you see these:
# 1. Pull latest code: git pull origin main
# 2. Check pom.xml has correct versions:
#    - mockito: 3.12.4 (not 5.x)
#    - openmrs-api: 2.6.0
# 3. Clean build: mvn clean install -U
```

**See [IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md) Week 2 for detailed fixes.**

---

## 📖 Contributing

### Before You Start
1. **Read AGENTS.md** - Architecture rules, Ghana domain knowledge
2. **Verify environment** - Java 8, MySQL 5.7, OpenMRS 2.4.0
3. **Check PROMPT_QUEUE.md** - See if there's an active task

### Workflow
1. Create feature branch: `git checkout -b feature/patient-registration`
2. Write code (follow patterns in AGENTS.md)
3. Test locally: `mvn test` (backend) + `npm test` (frontend)
4. Commit: `git commit -m "[Week X] Feature: Patient registration"`
5. Push: `git push origin feature/patient-registration`
6. Create Pull Request (use PR template)

### Code Style
- **Backend:** Java 8, 4-space indent, 120-char lines, Javadoc required
- **Frontend:** TypeScript strict, 2-space indent, single quotes
- **Testing:** >70% coverage, all tests pass before PR

---

## 🗺️ Roadmap

### ✅ Week 1-2: Foundation (COMPLETE)
- [x] Docker environment setup
- [x] OpenMRS 2.4.0 + MySQL 5.7 running
- [x] REST API verified
- [x] Custom module builds successfully
- [x] 30+ compilation errors fixed

### 🔄 Week 3-4: Core Backend (IN PROGRESS)
- [ ] Patient registration service (Ghana Card validation)
- [ ] NHIS integration (eligibility check)
- [ ] NHIE mock server setup
- [ ] Patient sync to NHIE

### 📅 Week 5-8: OPD Workflow
- [ ] Triage service (vitals entry)
- [ ] Consultation service (diagnosis, prescriptions)
- [ ] Pharmacy service (dispensing)
- [ ] Billing service (NHIS vs Cash)

### 📅 Week 9-12: Frontend + Reports
- [ ] Next.js patient registration form
- [ ] OPD workflow UI
- [ ] Admin dashboard (KPIs, NHIE monitoring)
- [ ] Basic reports (OPD register, NHIS vs Cash)

### 📅 Week 13-16: Testing + Deployment
- [ ] E2E testing (Playwright)
- [ ] User acceptance testing (UAT)
- [ ] Production deployment (Ubuntu + Docker)
- [ ] MoH pilot facility onboarding

### 📅 Post-MVP (Q2-Q3 2026)
- [ ] Scale to 5-10 facilities
- [ ] Advanced reports (analytics dashboard)
- [ ] OpenMRS 3.x (O3) migration evaluation
- [ ] Java 11/17 upgrade (if O3 migration)

---

## 📜 License

Mozilla Public License 2.0 (MPL 2.0)

See [LICENSE](LICENSE) for details.

---

## 🤝 Support

**Documentation:** [AGENTS.md](AGENTS.md) | [IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md)  
**Issues:** https://github.com/IsaacAhor/MedReg/issues  
**Discussions:** https://github.com/IsaacAhor/MedReg/discussions  

**Emergency Contact:** See AGENTS.md "Support & Escalation" section

---

## ⚡ Quick Commands Cheat Sheet

```bash
# Verify environment
java -version           # MUST be 1.8.0_472
mvn -version            # MUST show Java 1.8.0_472
docker ps               # MySQL + OpenMRS running

# Start backend
docker-compose up -d

# Build module
cd backend/openmrs-module-ghanaemr && mvn clean package -Dmaven.test.skip=true

# Test REST API
curl -u admin:Admin123 http://localhost:8080/openmrs/ws/rest/v1/session

# Start frontend
cd frontend && npm run dev

# View logs
docker-compose logs -f openmrs

# Clean restart
docker-compose down -v && docker-compose up -d
```

---

**Built with ❤️ for Ghana's healthcare system**  
**Target: Win MoH pilot facility Q1 2026** 🇬🇭

