# MedReg - Ghana EMR MVP

**Ghana NHIE-Compliant Electronic Medical Records System**

## Project Overview

MedReg is an Electronic Medical Records (EMR) system designed specifically for Ghana's healthcare system, with full integration to the National Health Information Exchange (NHIE). Built on OpenMRS 2.6.0 with a modern Next.js frontend.

**Timeline**: 20 weeks to functional MVP  
**Target**: Win MoH pilot facility + position for EOI Q1 2026

## Tech Stack

### Backend
- OpenMRS Platform 2.6.0
- Java 8, Spring Framework
- MySQL 8.0
- HAPI FHIR 5.x

### Frontend  
- Next.js 14.x (App Router)
- TypeScript 5.x (strict mode)
- shadcn/ui + Radix UI
- Tailwind CSS 3.x
- TanStack Query 5.x
- React Hook Form 7.x + Zod
- Axios

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend)
- npm (comes with Node.js)

### Backend Setup (OpenMRS + MySQL)

```powershell
# Start MySQL (wait 30 seconds for initialization)
docker-compose up -d mysql

# Start OpenMRS
docker-compose up -d openmrs

# OpenMRS will be available at http://localhost:8080/openmrs
# Default credentials: admin / Admin123
```

### Frontend Setup (Next.js)

Note: All browser requests go through Next.js route handlers under `/api/*` (BFF). Do not call OpenMRS directly from the browser or via rewrites.

```powershell
cd frontend

# Install dependencies
npm install

# Copy environment variables
Copy-Item .env.example .env.local -Force

# Start development server
npm run dev

# Frontend available at http://localhost:3000
```

## Project Structure

```
MedReg/
├── docker-compose.yml              # Docker orchestration
├── openmrs-runtime.properties      # OpenMRS configuration
├── mysql-init/                     # Database initialization scripts
├── openmrs-modules/                # Custom OpenMRS modules
├── frontend/                       # Next.js frontend
│   ├── src/
│   │   ├── app/                   # Next.js app router
│   │   ├── components/            # React components
│   │   ├── lib/                   # Utilities & API clients
│   │   └── hooks/                 # Custom React hooks
│   └── package.json
├── docs/                          # Documentation
└── domain-knowledge/              # Ghana health domain specs
```

## Development Commands

### Backend
```powershell
# View OpenMRS logs
docker-compose logs -f openmrs

# Restart OpenMRS
docker-compose restart openmrs

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Frontend
```powershell
cd frontend

# Development server
npm run dev

# Production build
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Lint
npm run lint

# Format code
npm run format

# E2E tests (Playwright)
npm run test:e2e
```

### Database
```powershell
# Connect to MySQL
docker exec -it medreg-mysql mysql -u openmrs_user -p openmrs
# Password: openmrs_password
```

## Week 1 Implementation Status

- [x] Docker and OpenMRS environment setup
- [x] Next.js 14 project initialization  
- [x] TypeScript configuration (strict mode)
- [x] Tailwind CSS + shadcn/ui setup
- [x] TanStack Query configuration
- [x] React Hook Form + Zod integration
- [ ] User roles and privileges configuration (In Progress)
- [ ] Authentication UI implementation (Next)
- [ ] Facility metadata configuration (Next)

## MVP Scope (What We're Building)

### IN SCOPE
1. **Patient Registration** - Ghana Card, NHIS, folder number, demographics
2. **OPD Workflow** - Triage, consultation, pharmacy, billing
3. **NHIS Integration** - Eligibility check, claims export
4. **NHIE Sync** - Patient + encounter submission to national HIE
5. **Basic Reports** - OPD register, NHIS vs Cash, top diagnoses, revenue
6. **User Management** - 6 roles (Admin, Doctor, Nurse, Pharmacist, Records, Cashier)

### OUT OF SCOPE (Defer to v2)
- IPD/Admissions
- ANC Module
- Lab results entry
- Appointment scheduling
- SMS notifications
- Advanced reporting
- Offline mode
- Multi-facility support

## Key Features

### Ghana-Specific
- **Ghana Card Validation** - Format: GHA-XXXXXXXXX-X with Luhn checksum
- **NHIS Integration** - Real-time eligibility checking
- **Folder Number Generation** - Format: [REGION]-[FACILITY]-[YEAR]-[SEQUENCE]
- **Top 20 Ghana Diagnoses** - Quick-pick ICD-10 codes
- **Essential Medicines List** - Common Ghana drugs

### NHIE Integration
- OAuth 2.0 authentication
- FHIR R4 patient/encounter submission
- Retry logic with exponential backoff
- Transaction logging and queue management

## Documentation

- `AGENTS.md` - Comprehensive AI agent context (READ THIS FIRST)
- `.github/copilot-instructions.md` - GitHub Copilot guidelines
- `docs/` - Technical specifications and guides
- `domain-knowledge/` - Ghana health system domain knowledge

## Security

- Session timeout: 30 minutes
- Password policy: 8+ chars, uppercase, lowercase, digit, special char
- PII masking in all logs
- Encrypted backups
- Role-based access control (RBAC)

## Support

- Repository: https://github.com/IsaacAhor/MedReg
- OpenMRS Wiki: https://wiki.openmrs.org/
- OpenMRS REST API: https://rest.openmrs.org/

## License

TBD

---

Built for Ghana's healthcare system
