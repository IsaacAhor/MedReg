# MedReg - Quick Reference Card

**Last Updated**: November 1, 2025  
**Status**: âœ… Week 1 + Week 2-3 Patient Registration Complete

## ðŸŽ¯ Current Status

- âœ… **Patient Registration Working**: End-to-end registration functional
- âœ… **First Patient Registered**: Kwabena Kofi Nyarko (GHA-123456789-7)
- âœ… **Ghana Card Validation**: Format + Luhn checksum working
- âœ… **NHIS Storage**: Person attribute persisted
- âœ… **MCP Tools**: OpenMRS + MySQL MCP servers operational
- ðŸš€ **2+ Weeks Ahead of Schedule**

---

## ðŸš€ Quick Start

### Start Everything
```powershell
# Backend
docker-compose up -d

# Frontend (in new terminal)
cd frontend
npm run dev
```

### Register a Patient (Quick Test)
1. Navigate to http://localhost:3000/patients/register
2. Fill in form with valid Ghana Card (e.g., GHA-123456789-7)
3. Submit â†’ Patient created in OpenMRS + MySQL
4. Verify in OpenMRS UI: http://localhost:8080/openmrs

### Stop Everything
```powershell
docker-compose down
```

---

## ðŸ”— Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **OpenMRS** | http://localhost:8080/openmrs | admin / Admin123 |
| **Frontend** | http://localhost:3000 | (no auth yet) |
| **Patient Registration** | http://localhost:3000/patients/register | âœ… Working |
| **MySQL** | localhost:3306 | openmrs_user / openmrs_password |
| **OpenMRS REST API** | http://localhost:8080/openmrs/ws/rest/v1 | admin / Admin123 |

---

## ðŸ³ Docker Commands

```powershell
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f openmrs
docker-compose logs -f mysql

# Check service status
docker-compose ps

# Restart service
docker-compose restart openmrs

# Stop all services
docker-compose down

# Stop and remove all data (clean slate)
docker-compose down -v

# Rebuild containers
docker-compose up -d --build
```

---

## ðŸ’» Frontend Commands

```powershell
cd frontend

# Development
npm run dev              # Start dev server
npm run build            # Production build
npm start                # Start production server

# Testing
npm test                 # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # E2E tests

# Code Quality
npm run lint             # Run ESLint
npm run format           # Run Prettier
```

---

## ðŸ—„ï¸ Database Commands

```powershell
# Connect to MySQL
docker exec -it medreg-mysql mysql -u openmrs_user -p openmrs
# Password: openmrs_password

# Backup database
docker exec medreg-mysql mysqldump -u openmrs_user -popenmrs_password openmrs > backup.sql

# Restore database
docker exec -i medreg-mysql mysql -u openmrs_user -popenmrs_password openmrs < backup.sql
```

---

## ðŸ“‚ Project Structure

```
MedReg/
â”œâ”€â”€ docker-compose.yml           # Docker orchestration
â”œâ”€â”€ openmrs-runtime.properties   # OpenMRS config
â”œâ”€â”€ mysql-init/                  # DB init scripts
â”œâ”€â”€ frontend/                    # Next.js app
â”‚   â”œâ”€â”€ src/app/                # App router pages
â”‚   â”œâ”€â”€ src/components/         # React components
â”‚   â”œâ”€â”€ src/lib/                # Utils & API clients
â”‚   â””â”€â”€ src/hooks/              # Custom hooks
â”œâ”€â”€ docs/                        # Documentation
â”‚   â”œâ”€â”€ setup/                  # Setup guides
â”‚   â”œâ”€â”€ specs/                  # Feature specs
â”‚   â””â”€â”€ mapping/                # FHIR mappings
â””â”€â”€ domain-knowledge/            # Ghana domain specs
```

---

## ðŸŽ¯ Week 1 Checklist

- [x] Docker + OpenMRS setup
- [x] Next.js frontend setup
- [x] Facility metadata config
- [x] Documentation created
- [ ] User roles configured (manual)
- [ ] Authentication UI (in progress)

---

## ðŸ”§ Configuration Files

### Backend
- `openmrs-runtime.properties` - OpenMRS settings
- `docker-compose.yml` - Container orchestration
- `mysql-init/01-init-ghana-emr.sql` - DB schema

### Frontend
- `.env.local` - Environment variables
- `next.config.mjs` - Next.js config
- `tailwind.config.ts` - Tailwind config
- `tsconfig.json` - TypeScript config

---

## ðŸ› Troubleshooting

### Backend Issues

**OpenMRS won't start:**
```powershell
# Check MySQL is running
docker-compose ps

# View logs
docker-compose logs openmrs

# Restart services
docker-compose down
docker-compose up -d
```

**Port conflicts:**
- MySQL port 3306 in use? Change to 3307 in docker-compose.yml
- OpenMRS port 8080 in use? Change to 8081 in docker-compose.yml

### Frontend Issues

**Dependencies won't install:**
```powershell
rm -rf node_modules
rm package-lock.json
npm install
```

**Port 3000 in use:**
Edit package.json: `"dev": "next dev -p 3001"`

**TypeScript errors:**
```powershell
rm -rf .next
npm run build
```

---

## ðŸ“š Key Documents

| Document | Purpose |
|----------|---------|
| README.md | Project overview |
| AGENTS.md | AI agent context (READ THIS!) |
| docs/setup/week1-setup-guide.md | Detailed setup |
| docs/setup/week1-implementation-summary.md | What's done |
| .github/copilot-instructions.md | Copilot guidelines |

---

## ðŸ” Security Notes

- **Never commit** `.env.local` or secrets
- **Always mask** PII in logs (Ghana Card, NHIS numbers)
- **Use placeholders** for NHIE credentials until obtained
- **Session timeout**: 30 minutes
- **Password policy**: 8+ chars, mixed case, digit, special char

---

## ðŸŽ“ Ghana-Specific Rules

### Ghana Card Format
```
GHA-XXXXXXXXX-X
```
- Must validate Luhn checksum
- Regex: `^GHA-\d{9}-\d$`

### NHIS Number Format
```
0123456789
```
- Exactly 10 digits
- Regex: `^\d{10}$`

### Folder Number Format
```
[REGION]-[FACILITY]-[YEAR]-[SEQUENCE]
```
Example: `GA-KBTH-2025-000123`

---

## ðŸŒ NHIE Integration

### Transaction Logging & Tests (Nov 2, 2025)

- Use NHIETransactionLogger (default writes to ghanaemr_nhie_transaction_log and sets creator).
- Service masks PII before logging via maskPII(String) and maskIdentifier(String).
- Files:
  - Logger API: backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/NHIETransactionLogger.java
  - Default Logger: backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/DefaultNHIETransactionLogger.java
  - Service usage: backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/impl/NHIEIntegrationServiceImpl.java
- Docs:
  - Spec: backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/README-TRANSACTION-LOGGING.md
  - Schema: docs/db/liquibase-schema.md
  - Agent guidance: AGENTS.md (NHIE Transaction Logging note)
- Run tests:
  - mvn -q -pl backend/openmrs-module-ghanaemr -am clean test
  - Coverage target: >90% for NHIEIntegrationService paths

### Endpoints
- **Base URL**: `https://nhie-sandbox.moh.gov.gh/fhir`
- **OAuth**: `https://nhie-sandbox.moh.gov.gh/oauth/token`

### Retry Policy
- Max attempts: 8
- Delays: 5s â†’ 30s â†’ 2m â†’ 10m â†’ 1h
- DLQ after 8 failures

---

## ðŸ“ž Support

- **Repository**: https://github.com/IsaacAhor/MedReg
- **OpenMRS Wiki**: https://wiki.openmrs.org/
- **Next.js Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com/docs

---

## âš¡ Pro Tips

1. **Use GitHub Copilot** - AGENTS.md has all context
2. **Check docker-compose logs** before debugging
3. **Always restart OpenMRS** after config changes
4. **Use npm** (project standard) (faster, better)
5. **Read AGENTS.md** - It's your single source of truth

---

**Print this card and keep it handy! ðŸ“„**

