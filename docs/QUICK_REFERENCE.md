# MedReg - Quick Reference Card

## 🚀 Quick Start

### Start Everything
```powershell
# Backend
docker-compose up -d

# Frontend (in new terminal)
cd frontend
npm run dev
```

### Stop Everything
```powershell
docker-compose down
```

---

## 🔗 Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| OpenMRS | http://localhost:8080/openmrs | admin / Admin123 |
| Frontend | http://localhost:3000 | (after auth implemented) |
| MySQL | localhost:3306 | openmrs_user / openmrs_password |

---

## 🐳 Docker Commands

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

## 💻 Frontend Commands

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

## 🗄️ Database Commands

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

## 📂 Project Structure

```
MedReg/
├── docker-compose.yml           # Docker orchestration
├── openmrs-runtime.properties   # OpenMRS config
├── mysql-init/                  # DB init scripts
├── frontend/                    # Next.js app
│   ├── src/app/                # App router pages
│   ├── src/components/         # React components
│   ├── src/lib/                # Utils & API clients
│   └── src/hooks/              # Custom hooks
├── docs/                        # Documentation
│   ├── setup/                  # Setup guides
│   ├── specs/                  # Feature specs
│   └── mapping/                # FHIR mappings
└── domain-knowledge/            # Ghana domain specs
```

---

## 🎯 Week 1 Checklist

- [x] Docker + OpenMRS setup
- [x] Next.js frontend setup
- [x] Facility metadata config
- [x] Documentation created
- [ ] User roles configured (manual)
- [ ] Authentication UI (in progress)

---

## 🔧 Configuration Files

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

## 🐛 Troubleshooting

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

## 📚 Key Documents

| Document | Purpose |
|----------|---------|
| README.md | Project overview |
| AGENTS.md | AI agent context (READ THIS!) |
| docs/setup/week1-setup-guide.md | Detailed setup |
| docs/setup/week1-implementation-summary.md | What's done |
| .github/copilot-instructions.md | Copilot guidelines |

---

## 🔐 Security Notes

- **Never commit** `.env.local` or secrets
- **Always mask** PII in logs (Ghana Card, NHIS numbers)
- **Use placeholders** for NHIE credentials until obtained
- **Session timeout**: 30 minutes
- **Password policy**: 8+ chars, mixed case, digit, special char

---

## 🎓 Ghana-Specific Rules

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

## 🌐 NHIE Integration

### Endpoints
- **Base URL**: `https://nhie-sandbox.moh.gov.gh/fhir`
- **OAuth**: `https://nhie-sandbox.moh.gov.gh/oauth/token`

### Retry Policy
- Max attempts: 8
- Delays: 5s → 30s → 2m → 10m → 1h
- DLQ after 8 failures

---

## 📞 Support

- **Repository**: https://github.com/IsaacAhor/MedReg
- **OpenMRS Wiki**: https://wiki.openmrs.org/
- **Next.js Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com/docs

---

## ⚡ Pro Tips

1. **Use GitHub Copilot** - AGENTS.md has all context
2. **Check docker-compose logs** before debugging
3. **Always restart OpenMRS** after config changes
4. **Use npm** (project standard) (faster, better)
5. **Read AGENTS.md** - It's your single source of truth

---

**Print this card and keep it handy! 📄**
