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

**Important Note**: OpenMRS Platform 2.4.0 has NO built-in UI by design. This is expected and correct for Option B (Next.js frontend).

1. **Verify OpenMRS Platform is running**
   - Navigate to http://localhost:8080/openmrs
   - You should see: "OpenMRS Platform 2.4.0-SNAPSHOT.0 Running!"
   - Message "no user interface module is installed" is NORMAL - we're using Next.js instead

2. **Verify REST API is working** (CRITICAL - this is what we need!)
   ```powershell
   # Test unauthenticated session endpoint
   Invoke-WebRequest -Uri "http://localhost:8080/openmrs/ws/rest/v1/session" -Method Get
   # Expected: {"sessionId":"...","authenticated":false}
   
   # Test authenticated session endpoint
   $cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:Admin123"))
   Invoke-WebRequest -Uri "http://localhost:8080/openmrs/ws/rest/v1/session" -Headers @{Authorization="Basic $cred"} | Select-Object -ExpandProperty Content
   # Expected: {"authenticated":true,"user":{"username":"admin",...}}
   ```

3. **Verify database connection**
   ```powershell
   docker exec medreg-mysql mysql -u openmrs_user -popenmrs_password -e "SELECT COUNT(*) FROM openmrs.users;"
   # Expected: Should return count of users (at least 1 for admin)
   ```

**Success Criteria:**
- [DONE] OpenMRS platform page shows "Running!"
- [DONE] REST API `/session` endpoint returns JSON
- [DONE] Authentication with admin/Admin123 returns authenticated=true
- [DONE] MySQL queries execute successfully

#### Troubleshooting Backend

**Common Issues:**

1. **"No user interface module is installed"**
   - This is NORMAL and EXPECTED for OpenMRS Platform 2.4.0
   - We're using Next.js frontend (Option B), not OpenMRS UI
   - REST API still works perfectly (test with `/session` endpoint)

2. **MySQL connection errors with MySQL 8.0**
   - OpenMRS 2.4.0 requires MySQL 5.7 (not 8.0)
   - MySQL Connector/J 5.1.x incompatible with MySQL 8.0 storage_engine variable
   - Solution: Use `mysql:5.7` image in docker-compose.yml (already configured)

3. **REST API returns 404**
   - Check if using `openmrs-core` image (wrong - no REST module)
   - Solution: Use `openmrs-reference-application-distro:2.11.0` (already configured)
   - This image includes webservices.rest module

```powershell
# View OpenMRS logs
docker-compose logs -f openmrs

# Check if REST module loaded (look for "webservices.rest")
docker-compose logs openmrs | Select-String "webservices.rest"

# Restart services
docker-compose down
docker-compose up -d

# Clean slate (removes all data - WARNING: deletes database!)
docker-compose down -v
docker-compose up -d
```

---

### Day 1-2: Frontend Setup (Option B)

#### Prerequisites

1. **Install Node.js 18+**
   - Download from: https://nodejs.org/ (LTS version)
   - Verify: `node --version` (should be 18.x or higher)

2. Package manager: npm (standard)
   ```powershell
   
   ```

#### Frontend Installation Steps

```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (this may take 3-5 minutes)
npm install

# 3. Copy environment variables
Copy-Item .env.example .env.local -Force

# 4. Edit .env.local (optional, defaults should work)
# Ensure OPENMRS_BASE_URL=http://localhost:8080/openmrs/ws/rest/v1
# Ensure NEXT_PUBLIC_OPENMRS_API_URL=http://localhost:8080/openmrs/ws/rest/v1

# 5. Start development server
npm run dev

# Frontend available at http://localhost:3000
```

#### Verify Frontend Installation

1. Navigate to http://localhost:3000
2. You should see MedReg homepage with "Login" and "Patient Registry" buttons
3. Check browser console for no errors
4. Hot reload should work (edit src/app/page.tsx and save)

#### Troubleshooting Frontend

```powershell
# If npm install fails
rm -rf node_modules
rm package-lock.json
npm install

# If port 3000 is in use
# Edit package.json: "dev": "next dev -p 3001"

# Check for TypeScript errors
npm run build

# Clear Next.js cache
rm -rf .next
npm run dev
```

---

### Day 3-4: User Roles Configuration (OpenMRS Backend)

#### Access OpenMRS Admin Panel

1. Login to http://localhost:8080/openmrs (admin/Admin123)
2. Navigate to: System Administration -> Manage Roles
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
New-Item -ItemType Directory -Force -Path src/app/login | Out-Null

# 2. Files to create (see below for content):
# - src/app/login/page.tsx (login form)
# - src/components/auth/login-form.tsx (form component)
# - src/lib/api/auth.ts (auth API client)
# - src/hooks/useAuth.ts (auth hook)
```

#### Test Authentication

```powershell
# 1. Start frontend (if not running)
npm run dev

# 2. Navigate to http://localhost:3000/login
# 3. Enter credentials: admin / Admin123
# 4. Should redirect to dashboard on success
# 5. Protected routes should redirect to /login if not authenticated
```

---

### Day 5: Facility Metadata Configuration

#### Setup Facility Configuration in OpenMRS

1. Login to OpenMRS admin panel
2. Navigate to: System Administration -> Settings -> Facility Configuration
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
Get-Content openmrs-runtime.properties

# Should see:
# ghana.facility.code=KBTH
# ghana.facility.region=GA
```

---

### [WARNING] IMPORTANT: Hardcoded UUIDs in API Route

The patient registration API route (`frontend/src/app/api/patients/route.ts`) contains **3 hardcoded UUIDs** that were created and verified during Week 2 development:

#### Ghana Metadata UUIDs (DO NOT CHANGE)

```typescript
// Line 69: NHIS Number Person Attribute Type
attributeType: 'f56fc097-e14e-4be6-9632-89ca66127784'

// Line 108: Ghana Card Identifier Type  
identifierType: 'd3132375-e07a-40f6-8912-384c021ed350'

// Line 109: Amani Hospital Location
location: 'aff27d58-a15c-49a6-9beb-d30dcfc0c66e'
```

#### How These Were Created

These UUIDs were created via **Codex MCP** during initial setup:

1. **NHIS Number Attribute Type** (`f56fc097-e14e-4be6-9632-89ca66127784`)
   - Created via: Codex MCP -> OpenMRS REST API
   - Name: "NHIS Number"
   - Format: text (10 digits)
   - Used to store patient NHIS number as person attribute

2. **Ghana Card Identifier Type** (`d3132375-e07a-40f6-8912-384c021ed350`)
   - Created via: Codex MCP -> OpenMRS REST API
   - Name: "Ghana Card"
   - Format: `^GHA-\d{9}-\d$`
   - Required: true (set by Codex to make Ghana Card the primary identifier)

3. **Amani Hospital Location** (`aff27d58-a15c-49a6-9beb-d30dcfc0c66e`)
   - Pre-existing location in OpenMRS
   - Found via: Codex MCP query
   - Used as default location for all patients

#### Verification

To verify these UUIDs exist in your OpenMRS instance:

```powershell
# Using Codex MCP (recommended)
codex
# Then ask: "Show me all person attribute types and identifier types with UUIDs"

# Or via OpenMRS UI
# Navigate to: Admin -> Person Attributes -> NHIS Number (check UUID)
# Navigate to: Admin -> Patient Identifier Types -> Ghana Card (check UUID)
# Navigate to: Admin -> Locations -> Amani Hospital (check UUID)
```

#### If UUIDs Don't Match

If you're setting up on a fresh OpenMRS instance and these UUIDs don't exist:

1. **Use Codex MCP to create metadata** (recommended):
   ```
   codex
   "Create Ghana Card identifier type with format ^GHA-\d{9}-\d$ and make it required"
   "Create NHIS Number person attribute type"
   "Find Amani Hospital location UUID"
   ```

2. **Update API route** with the new UUIDs returned by Codex

3. **Commit changes** to your fork

#### Why Hardcoded?

- OpenMRS generates random UUIDs when creating metadata
- These specific UUIDs are tied to this OpenMRS instance
- Different installations will have different UUIDs
- **Future improvement**: Store UUIDs in environment variables or fetch dynamically

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
- [ ] npm installed
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
- Run `npm install` again
- Delete node_modules and reinstall
- Check Node.js version (must be 18+)

**Issue: Cannot connect to OpenMRS API**
- Verify OpenMRS is running: http://localhost:8080/openmrs
- Check .env.local has correct `OPENMRS_BASE_URL`
- Ensure frontend calls go through Next.js `/api/*` route handlers (BFF). Do not rewrite to OpenMRS directly.

### Resources
- OpenMRS Wiki: https://wiki.openmrs.org/
- Next.js Docs: https://nextjs.org/docs
- shadcn/ui Docs: https://ui.shadcn.com/docs
- TanStack Query: https://tanstack.com/query/latest

---

**Week 1 Target**: By end of week, you should have a working development environment with OpenMRS backend + Next.js frontend, user roles configured, and authentication working.

---

## Week 2 Addendum: Ghana Metadata + Folder Number

This addendum documents the exact metadata created and runtime behavior now that registration is working end‑to‑end.

### Ghana Metadata (UUIDs)
- Patient Identifier Type — Ghana Card: `d3132375-e07a-40f6-8912-384c021ed350`
  - Required: true
  - Regex: `^GHA-\d{9}-\d$`
  - Validator: none (frontend performs Luhn; server uses regex only)
- Person Attribute Type — NHIS Number: `f56fc097-e14e-4be6-9632-89ca66127784`
  - Searchable: true
  - Stored as person attribute (value = 10 digits)
- Patient Identifier Type — Folder Number: `c907a639-0890-4885-88f5-9314a55e263e`
  - Required: false
  - Regex: `^[A-Z]{2}-[A-Z0-9]{4}-\d{4}-\d{6}$`
- Location — Amani Hospital: `aff27d58-a15c-49a6-9beb-d30dcfc0c66e`

OpenMRS ID identifier type was set to required=false to unblock Ghana‑Card‑only registration while the IDGEN REST “nextIdentifier” endpoint is unavailable in this stack.

### Folder Number Generation
- Preferred: Thread‑safe backend module endpoint
  - Endpoint: `POST /openmrs/ws/ghana/foldernumber/allocate?regionCode=GA&facilityCode=KBTH`
  - Returns: `{ "folderNumber": "GA-KBTH-2025-000001" }`
  - Backed by table: `gh_folder_number_sequence(prefix PK, last_seq INT)`
- Fallback: System setting sequence (best effort, single‑node friendly)
  - Key format: `ghana.folder.sequence.{REGION}-{FACILITY}-{YEAR}`
  - Used only if the module endpoint is not available

### API Route Behavior (BFF)
- File: `frontend/src/app/api/patients/route.ts`
- Steps during registration:
  1) Duplicate check: `GET /ws/rest/v1/patient?identifier={ghanaCard}`; returns 409 on match
  2) Create person: `POST /ws/rest/v1/person` with demographics, address, NHIS attribute
  3) Generate folder number: calls module endpoint (preferred) or falls back to system setting
  4) Create patient: `POST /ws/rest/v1/patient` with identifiers [Ghana Card, Folder Number]
  5) Response includes `patient.uuid`, masked Ghana Card, and `folderNumber`

### Frontend UX Updates
- On success, user is redirected to `/patients/{uuid}/success?folder={folderNumber}` to clearly show the assigned folder number and actions.

### IDGEN Notes (OpenMRS ID)
- Autogeneration option exists for OpenMRS ID, but a working REST `nextIdentifier` endpoint is not exposed here.
- If/when server‑side autogen on save is reliable, you may set OpenMRS ID back to required=true.

### Validator Notes
- Ghana Card Luhn validation runs on the frontend (Zod refine + checksum).
- Server currently enforces regex only (no stock Luhn validator due to `GHA-` prefix and hyphens).
- Future: implement a custom `GhanaCardIdentifierValidator` in an OpenMRS module for server‑side parity.
