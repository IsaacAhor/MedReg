# MedReg Week 1 Setup Guide

## Development Environment Setup (Windows)

### Day 1-2: Backend Setup

#### Prerequisites
1. **Install Docker Desktop** for Windows
   - Download from: https://www.docker.com/products/docker-desktop/
   - Enable WSL 2 backend (recommended)
   - Allocate at least 4GB RAM to Docker

2. **Install Git**
   - Download from: https://git-scm.com/download/win
   - Use Git Bash or PowerShell

#### Backend Installation Steps

```powershell
# 1. Clone repository
git clone https://github.com/IsaacAhor/MedReg.git
cd MedReg

# 2. Start MySQL container
docker-compose up -d mysql

# 3. Wait 30 seconds for MySQL to initialize
# Check MySQL health
docker-compose ps

# 4. Start OpenMRS container
docker-compose up -d openmrs

# 5. Wait 3-5 minutes for OpenMRS to start (first time takes longer)
# Monitor logs
docker-compose logs -f openmrs

# 6. Access OpenMRS
# URL: http://localhost:8080/openmrs
# Username: admin
# Password: Admin123
```

#### Verify Backend Installation

1. Navigate to http://localhost:8080/openmrs
2. Login with admin/Admin123
3. You should see OpenMRS Reference Application dashboard
4. Check System Administration → Manage Modules (all modules should be started)

#### Troubleshooting Backend

```powershell
# If OpenMRS won't start, check logs
docker-compose logs openmrs

# If MySQL connection fails, restart services
docker-compose down
docker-compose up -d

# If ports are in use, modify docker-compose.yml ports
# MySQL: Change "3306:3306" to "3307:3306"
# OpenMRS: Change "8080:8080" to "8081:8080"

# Clean slate (removes all data)
docker-compose down -v
docker-compose up -d
```

---

### Day 1-2: Frontend Setup (Option B)

#### Prerequisites

1. **Install Node.js 18+**
   - Download from: https://nodejs.org/ (LTS version)
   - Verify: `node --version` (should be 18.x or higher)

2. **Install pnpm** (recommended) or npm
   ```powershell
   npm install -g pnpm
   ```

#### Frontend Installation Steps

```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (this may take 3-5 minutes)
pnpm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Edit .env.local (optional, defaults should work)
# Ensure NEXT_PUBLIC_OPENMRS_API_URL=http://localhost:8080/openmrs/ws/rest/v1

# 5. Start development server
pnpm dev

# Frontend available at http://localhost:3000
```

#### Verify Frontend Installation

1. Navigate to http://localhost:3000
2. You should see MedReg homepage with "Login" and "Patient Registry" buttons
3. Check browser console for no errors
4. Hot reload should work (edit src/app/page.tsx and save)

#### Troubleshooting Frontend

```powershell
# If pnpm install fails
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# If port 3000 is in use
# Edit package.json: "dev": "next dev -p 3001"

# Check for TypeScript errors
pnpm build

# Clear Next.js cache
rm -rf .next
pnpm dev
```

---

### Day 3-4: User Roles Configuration (OpenMRS Backend)

#### Access OpenMRS Admin Panel

1. Login to http://localhost:8080/openmrs (admin/Admin123)
2. Navigate to: System Administration → Manage Roles
3. Create the following roles:

#### Role 1: Admin
- **Privileges**: All (superuser)
- **Description**: System administrator with full access

#### Role 2: Doctor
- **Privileges**:
  - View Patients
  - Edit Patients
  - Add Encounters
  - Edit Encounters
  - View Observations
  - Add Observations
  - View Orders
  - Add Orders
  - View Diagnoses
  - Add Diagnoses
  - View Reports

#### Role 3: Nurse
- **Privileges**:
  - View Patients
  - Edit Patients (limited)
  - Add Encounters
  - View Observations
  - Add Observations (vitals only)
  - View Orders

#### Role 4: Pharmacist
- **Privileges**:
  - View Patients
  - View Orders
  - Edit Orders (dispense only)
  - View Drug Orders
  - Dispense Drug Orders

#### Role 5: Records Officer
- **Privileges**:
  - Add Patients
  - Edit Patients
  - View Patients
  - Search Patients
  - Print Records

#### Role 6: Cashier
- **Privileges**:
  - View Patients
  - View Encounters
  - View Orders
  - Add Payments
  - View Payments
  - Print Receipts
  - View Reports (revenue)

---

### Day 3-4: Authentication UI (Option B Frontend)

#### Create Login Page

```powershell
# 1. Create login page directory
mkdir -p src/app/login

# 2. Files to create (see below for content):
# - src/app/login/page.tsx (login form)
# - src/components/auth/login-form.tsx (form component)
# - src/lib/api/auth.ts (auth API client)
# - src/hooks/useAuth.ts (auth hook)
```

#### Test Authentication

```powershell
# 1. Start frontend (if not running)
pnpm dev

# 2. Navigate to http://localhost:3000/login
# 3. Enter credentials: admin / Admin123
# 4. Should redirect to dashboard on success
# 5. Protected routes should redirect to /login if not authenticated
```

---

### Day 5: Facility Metadata Configuration

#### Setup Facility Configuration in OpenMRS

1. Login to OpenMRS admin panel
2. Navigate to: System Administration → Settings → Facility Configuration
3. Set the following:

```
Facility Code: KBTH
Facility Name: Korle Bu Teaching Hospital
Region Code: GA
Region Name: Greater Accra
District: Accra Metro
```

#### Verify Configuration

```powershell
# Check openmrs-runtime.properties
cat openmrs-runtime.properties

# Should see:
# ghana.facility.code=KBTH
# ghana.facility.region=GA
```

---

## Week 1 Completion Checklist

### Backend
- [ ] Docker Desktop installed and running
- [ ] MySQL container running (port 3306)
- [ ] OpenMRS container running (port 8080)
- [ ] Can login to OpenMRS admin panel
- [ ] 6 user roles configured (Admin, Doctor, Nurse, Pharmacist, Records, Cashier)
- [ ] Facility metadata set (KBTH, GA region)

### Frontend
- [ ] Node.js 18+ installed
- [ ] pnpm installed
- [ ] All dependencies installed (package.json)
- [ ] Development server running (port 3000)
- [ ] Can view homepage at localhost:3000
- [ ] No TypeScript/ESLint errors
- [ ] Login page created and functional
- [ ] Authentication flow working

### Documentation
- [ ] README.md reviewed
- [ ] AGENTS.md reviewed
- [ ] .github/copilot-instructions.md configured
- [ ] Week 1 goals understood

---

## Next Steps (Week 2-3)

Once Week 1 setup is complete, proceed to:
1. Patient registration form implementation
2. Ghana Card validation logic
3. Folder number generation
4. Patient search functionality

---

## Getting Help

### Common Issues

**Issue: OpenMRS won't start**
- Check Docker has enough RAM (4GB minimum)
- Check MySQL is healthy: `docker-compose ps`
- View logs: `docker-compose logs openmrs`

**Issue: Frontend build errors**
- Run `pnpm install` again
- Delete node_modules and reinstall
- Check Node.js version (must be 18+)

**Issue: Cannot connect to OpenMRS API**
- Verify OpenMRS is running: http://localhost:8080/openmrs
- Check .env.local has correct NEXT_PUBLIC_OPENMRS_API_URL
- Check CORS settings in next.config.mjs

### Resources
- OpenMRS Wiki: https://wiki.openmrs.org/
- Next.js Docs: https://nextjs.org/docs
- shadcn/ui Docs: https://ui.shadcn.com/docs
- TanStack Query: https://tanstack.com/query/latest

---

**Week 1 Target**: By end of week, you should have a working development environment with OpenMRS backend + Next.js frontend, user roles configured, and authentication working.
