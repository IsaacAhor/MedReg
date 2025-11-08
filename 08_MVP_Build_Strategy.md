# Functional MVP Build Strategy: Startup Approach

## Executive Summary

Build a **working EMR in 20 weeks** (Option B: Next.js + shadcn/ui frontend) that wins pilot facility + positions for EOI submission Q1 2026. Focus: prove NHIE integration works, handle 80% of daily workflows, demonstrate cost advantage.

**Target**: 1 teaching hospital or regional hospital live by Week 20

---

## MVP Scope Definition

### What Goes IN the MVP (Must-Have)

**1. Patient Registration (Week 1-3)**
- Ghana Card entry + validation (GHA-XXXXXXXXX-X format)
- NHIS number entry (optional at registration)
- Folder number auto-generation ([REGION]-[FACILITY]-[YEAR]-[SEQUENCE])
- Demographics: Name, DOB, Gender, Phone, Address (region/district/town)
 - Photo capture (webcam/upload) — optional toggle for MVP
- **NHIE Integration**: Submit patient to NHIE, get national patient ID, handle duplicates

**2. OPD Workflow (Week 4-7)**
- **Triage**: Vitals entry (BP, Temp, Weight, Height, calculate BMI)
- **Consultation**: 
  - Complaints (free text)
  - Diagnosis (ICD-10 search with top 20 Ghana diagnoses as quick picks)
  - Prescriptions (drug search from essential medicines list, dosage, duration)
  - Lab orders (top 10 tests: FBC, Malaria, Blood Sugar, Urinalysis, etc.)
- **Pharmacy**: Dispensing queue, mark as dispensed
- **Billing/Cashier**: Service charges, drug charges, generate receipt
- **NHIE Integration**: Submit encounter to NHIE after consultation completed

**3. NHIS Integration (Week 8-10)**
- Eligibility check at registration (query NHIE -> NHIA)
- Display ACTIVE/EXPIRED/NOT FOUND status prominently
- Flag encounter as "NHIS" or "Cash" during billing
- Claims batch generation (monthly export in NHIE-compliant format)
- **Note**: Manual claims submission acceptable for MVP (don't automate adjudication workflow yet)

**4. Basic Reports (Week 11-12)**
- Daily attendance register (OPD headcount)
- NHIS vs Cash patient split
- Top 10 diagnoses (for MoH reporting)
- Revenue summary (daily/weekly/monthly)

**5. User Management (Week 1-2, parallel to registration)**
- **Roles (8 total - White-Label Multi-Tenant Ready):**
  - **Platform Admin** (Super Admin): Multi-facility oversight, system configuration, cross-facility analytics, branding management
  - **Facility Admin**: Single-facility user management, reports, NHIE monitoring, facility settings (replaces generic "Admin")
  - **Doctor**: View patients, create encounters, prescribe drugs, view reports
  - **Nurse**: View patients, triage, vitals entry, view encounters
  - **Pharmacist**: View patients, dispense drugs, view prescriptions
  - **Records Officer**: Register patients, search patients, print records
  - **Cashier**: View encounters, billing, receipts, revenue reports
  - **NHIS Officer** (optional): NHIS eligibility checks, claims export, NHIS-specific reports
- **Privileges:**
  - Platform Admin: All privileges across all facilities
  - Facility Admin: All privileges within assigned facility only
  - Clinical roles: Specific privileges (view patients, edit encounters, dispense drugs, generate reports)
  - **RBAC Enforcement:** Backend checks `hasPrivilege()` + facility scope, Frontend hides UI elements based on role
- **Facility Setup:**
  - Facility code (e.g., KBTH, KATH, TTHQ)
  - Region (16 Ghana regions)
  - Contact details (phone, email, address)
  - **White-Label Settings:**
    - Facility name (displayed in UI)
    - Logo upload (future: v2)
    - Primary color (future: v2)
    - NHIE endpoint (mock/sandbox/production)

### What Goes OUT of MVP (Defer to v2+)

[FAILED] **IPD/Admissions**: Complex, low volume, defer
[FAILED] **ANC Module**: Specialized workflow, build after OPD proven
[FAILED] **Lab Results Entry**: Labs can use paper for MVP, focus on ordering
[FAILED] **Appointment Scheduling**: Manual appointment books work for now
[FAILED] **SMS Notifications**: Nice-to-have, not essential
[FAILED] **Advanced Reporting**: MoH DHIMS2 integration, custom dashboards—defer
[FAILED] **Offline Mode**: Start online-only, add offline sync in v2 if needed
[FAILED] **Multi-facility**: Single facility first, scale after pilot success
[FAILED] **Referral Management**: Paper referral letters work for MVP

---

## 16-Week Build Timeline (Option A) / 20-Week Timeline (Option B)

### Phase 1: Foundation (Week 1-5 Option B)

**Week 1: Setup + User Management** [DONE] **COMPLETED (Nov 1, 2025)**
- [DONE] Day 1-2: OpenMRS 2.4.0 installation, MySQL 5.7, Docker Compose setup
- [DONE] Day 1-2 (Option B): Next.js 14 project setup, TypeScript 5.x strict mode, shadcn/ui installed
- [DONE] Day 3-4: User roles available (using OpenMRS defaults: Admin, Doctor, Nurse, etc.)
- [DONE] Day 3-4 (Option B): Authentication flow (OpenMRS session-based, BFF pattern implemented)
- [DONE] Day 5: Facility metadata (using Amani Hospital as default location)
- [DONE] **BONUS**: MCP infrastructure (OpenMRS + MySQL MCP servers with 24 tools, 5 validators)

**Week 2: Patient Registration** [DONE] **COMPLETED (Nov 1, 2025) - AHEAD BY 1 WEEK**
- [DONE] **Option B Implementation**: 
  - [DONE] shadcn/ui form components (Input, Select, DatePicker, Button, Form)
  - [DONE] React Hook Form + Zod validation (Ghana Card format + Luhn checksum, NHIS 10-digit format)
  - [DONE] TanStack Query 5.x for mutations (useRegisterPatient hook)
  - [DONE] Axios HTTP client via Next.js API route (BFF pattern)
- [DONE] Ghana Card validation logic (frontend Luhn checksum + backend format validation)
- [DONE] NHIS number validation (10 digits, stored as person attribute)
- [DONE] Patient demographics (name, DOB, gender, phone +233XXXXXXXXX, address with region codes)
- [DONE] Next.js API route (`/api/patients`) - creates Person + Patient via OpenMRS REST
- [DONE] Patient search working (visible in OpenMRS admin UI)
- [PENDING] Folder number auto-generation (deferred to Week 2 Day 5-6)
- [PENDING] Photo capture (deferred to v2)
- [PENDING] Advanced patient search UI (basic search works via OpenMRS UI)

**Week 3 (Option B): Frontend Integration & Backend APIs** [ACTIVE] **IN PROGRESS (Nov 2-3, 2025)**
- [DONE] Auth endpoints (login, logout, session, location) - **COMPLETE Nov 2**
  - Next.js API routes with secure cookie handling (HttpOnly, SameSite=Lax, 8-hour expiry)
  - OpenMRS session management via BFF pattern
  - Role-based authentication (8 roles: Platform Admin, Facility Admin, Doctor, Nurse, Pharmacist, Records Officer, Cashier, NHIS Officer)
  - Location-based login for OPD workflow
- [DONE] Backend report stubs (opd-register, nhis-vs-cash, top-diagnoses, revenue) - **COMPLETE Nov 3**
  - ReportsController.java with 4 endpoints
  - JSON and CSV export support
  - Authentication checks via Context.isAuthenticated()
  - Ready for frontend consumption
- [PENDING] Frontend pages (login, dashboard, patient list)
  - shadcn/ui components (Button, Card, Table, Form)
  - TanStack Query integration for data fetching
  - Responsive layout with role-aware navigation
- [PENDING] Connect frontend to backend APIs
  - Patient registration form -> POST /api/patients
  - Login form -> POST /api/auth/login
  - Dashboard -> GET /api/reports/*
  - Real-time OPD metrics display

**Week 4 (Option A) / Week 4-5 (Option B): NHIE Patient Sync** [PENDING] **SCHEDULED**
- [PENDING] OpenMRS -> FHIR Patient converter (backend)
- [PENDING] NHIE HTTP client (OAuth 2.0 + mTLS if required)
- [PENDING] Patient submission to NHIE
- [PENDING] Handle 409 conflicts (patient exists), fetch NHIE ID
- [PENDING] Transaction logging (nhie_transaction_log table)
- [PENDING] **Option B**: Patient dashboard UI with NHIE sync status indicators

**Milestone 1**: [DONE] **ACHIEVED (Nov 1, 2025)** - Register patients with Ghana Card + NHIS, persist to OpenMRS database
- [DONE] First patient registered: Kwabena Kofi Nyarko (Ghana Card: GHA-123456789-7, NHIS: 0123456789)
- [DONE] Database verified: Ghana Card identifier + NHIS attribute stored correctly
- [DONE] OpenMRS UI verified: Patient visible with all demographics
- [PENDING] NHIE sync pending (Week 2 Day 7)

---

### Phase 2: OPD Core Workflow (Week 6-11 Option B)

**Week 6 (Option B): Triage Module**
- **Backend**: Vitals Obs creation (OpenMRS)
- **Option B**: shadcn/ui vitals form (Input components for BP, Temp, Weight, Height)
- BMI auto-calculation (client-side + server validation)
- Triage queue UI (shows patients waiting for consultation)

**Week 7-8 (Option B): Consultation Module**
- **Backend**: Encounter creation, Obs for complaints/diagnosis/prescriptions, Order creation
- **Option B**: 
  - Complaints textarea (shadcn/ui Textarea)
  - Diagnosis search with autocomplete (shadcn/ui Command + Combobox, top 20 Ghana diagnoses)
  - Drug prescription form (searchable drug list, dosage/frequency/duration)
  - Lab order checkboxes (top 10 tests)
- Save encounter (creates OpenMRS Encounter with Obs)

**Week 9 (Option B): Pharmacy Module**
- **Backend**: Dispense order processing
- **Option A**: Simple dispensing queue page
- **Option B**: 
  - Dispensing queue table (shadcn/ui Table with filters)
  - Dispense modal with drug details
  - Mark as dispensed with timestamp
- Inventory/stock tracking deferred to v2

**Week 10-11 (Option B): NHIE Encounter Sync**
- **Backend**: OpenMRS Encounter -> FHIR Encounter/Observation converter
- Submit to NHIE after consultation saved
- Background job (every 5 minutes) to retry failed submissions
- **Option B Week 11**: NHIE sync status dashboard, retry UI for failed transactions

**Milestone 2**: Complete 50 end-to-end test encounters (registration -> triage -> consultation -> pharmacy -> NHIE sync)

---

### Phase 3: NHIS + Billing (Week 12-14 Option B)

**Week 12 (Option B): NHIS Eligibility Check**
- **Backend**: NHIE Coverage resource query, caching logic
- At registration: Query NHIE for Coverage resource
- **Option B**: shadcn/ui Badge components (ACTIVE=green, EXPIRED=red, NOT FOUND=yellow)
- Store eligibility status with patient visit
- Cache eligibility for 24 hours (reduce API calls)

**Week 13 (Option B): Billing/Cashier**
- **Backend**: Billing calculation, payment recording
- **Option B**:
  - shadcn/ui billing form (service charges, drug charges)
  - Total calculation with breakdown
  - Payment modal with receipt preview
- Service charge entry (consultation fee, lab fees)
- Drug charges (auto-calculated from pharmacy dispense)
- Cash payment recording
- Receipt generation (printable HTML) — PDF deferred to v2
- NHIS flag: "Bill to NHIS" checkbox if patient ACTIVE

**Week 12 (Option A) / Week 14 (Option B): NHIS Claims Export + Admin Dashboard (MVP White-Label Phase 1)**
- **Backend**: Claims batch query, CSV/Excel generation, Admin Dashboard APIs
- **Claims Export:**
  - Monthly claims batch: Filter encounters where "Bill to NHIS" = true
  - Export to CSV/Excel with fields: NHIS number, date, diagnosis, drugs, lab tests, tariff codes, amount
  - **Option B**: Claims export UI with date range selector, download button
  - Manual submission to NHIE (upload file via NHIE portal)
  - **Note**: Automated claims adjudication deferred to v2
- **Admin Dashboard (NEW - CRITICAL FOR DEMO DAY):**
  - **Backend APIs** (`/api/v1/ghana/stats`, `/api/v1/ghana/reports`, `/api/v1/ghana/nhie`):
    - System KPIs: Today's registrations, encounters, revenue, NHIE sync status
    - OPD register query with filters (date range, payment type)
    - NHIS vs Cash summary (aggregation by payment type)
    - NHIE transaction query (pending/failed transactions)
    - Retry transaction endpoint (`POST /api/v1/ghana/nhie/retry/{id}`)
  - **Frontend (Option B only):**
    - Admin Dashboard page (`/admin/dashboard`)
      - 4 KPI cards: Registrations, Encounters, Revenue, NHIE Status
      - Quick links to OPD Register, NHIS vs Cash, NHIE Monitor
    - NHIE Sync Monitor page (`/admin/nhie-sync`)
      - Real-time status cards (pending, success, failed, sync rate)
      - Pending/failed transactions table with "Retry Now" button
      - 10-second polling for live updates
    - **Role Access:** Facility Admin + Platform Admin can access admin dashboard
  - **User Roles Expansion (Backend):**
    - **NEW: Platform Admin** (Super Admin) - Multi-facility oversight, system configuration, cross-facility analytics
    - **NEW: Facility Admin** - Per-facility user management, reports, NHIE monitoring (replaces generic "Admin")
    - Existing: Doctor, Nurse, Pharmacist, Records Officer, Cashier (clinical roles unchanged)
  - **Estimated Effort:** 3 days (1 day backend APIs, 2 days frontend dashboard + NHIE monitor)

**Milestone 3**: Generate claims batch for 100 NHIS encounters, validate format with MoH. **NEW: Demo admin dashboard showing real-time NHIE sync (98% success rate) to prove reliability.**

---

### Phase 4: Reports + Polish (Week 15-20 Option B)

**Week 15-16 (Option B): Essential Reports**
- **Backend**: Report queries (daily OPD register, NHIS vs Cash, top diagnoses, revenue)
- **Option B**:
  - shadcn/ui Table components with sorting/filtering
  - shadcn/ui Card components for summary stats
  - Optional: Recharts for simple visualizations (bar chart for top diagnoses)
  - Date range pickers for report filtering
- Daily OPD register (patient list with diagnosis)
- NHIS vs Cash summary
- Top 10 diagnoses (past 7 days, 30 days)
- Revenue summary (cash collected, NHIS claims pending)
- **Admin Dashboard Polish (Option B):**
  - User Management UI (`/admin/users`) - Create/disable users, assign roles
  - Facility Settings UI (`/admin/settings`) - Region code, facility code, NHIE mode
  - Audit Log Viewer (`/admin/audit-log`) - Who did what, when (PII masked)
  - **Estimated Effort:** 4 days (2 days reports, 2 days admin UI polish)
- **Role-Based Access Control (RBAC) Enforcement:**
  - Platform Admin: All facilities, all operations, system configuration
  - Facility Admin: Single facility, user management, reports, NHIE monitoring
  - Clinical roles: Patient care operations only (no admin access)

**Week 14 (Option A) / Week 17 (Option B): Testing + Bug Fixes**
- End-to-end testing with real clinical scenarios
- NHIE integration testing (sandbox)
- Performance testing (50 concurrent users)
- Security audit (basic: SQL injection, XSS, privilege escalation)
- **Option B**: Cross-browser testing (Chrome, Firefox, Safari), responsive design validation

**Week 18-19 (Option B): User Training + Documentation**
- User manual (registration, OPD workflow, NHIS checking, reports)
- Training videos (5-10 minutes each for key workflows)
- Job aids (one-page quick reference cards)
- **Option B Week 19**: In-app help tooltips, onboarding tour

**Week 20 (Option B): Pilot Deployment**
- Deploy to pilot facility (teaching hospital or regional hospital)
- **Option B**: Frontend deployed to Vercel or Nginx, configure CORS
- On-site setup: Server installation, network config, printer setup
- Staff training (2 days: 1 day classroom, 1 day go-live support)
- Go-live with support team on-site

**Milestone 4**: Pilot facility live, 100+ patients registered, 200+ encounters in first week

---

## Team Structure for MVP (Bootstrap Mode)

### **ACTUAL TEAM (Nov 1, 2025): 100% AI + MCP Assistance**

**Reality Check**: We just completed Week 2-3 deliverables (patient registration) in **1 day** using:

1. **GitHub Copilot** (AI Pair Programmer)
   - Generated all boilerplate code (forms, validators, API routes, hooks)
   - Wrote Ghana Card Luhn checksum validator
   - Created Next.js API route with error handling
   - Generated TypeScript types and Zod schemas
   - **Time Saved**: ~60-70% on routine coding

2. **Codex CLI with MCP Servers** (AI Diagnostics Expert)
   - Diagnosed OpenMRS metadata issues (missing identifier types, attribute types)
   - Found correct UUIDs automatically (Ghana Card, NHIS, location)
   - Created missing metadata via REST API
   - Configured required identifiers (made Ghana Card primary)
   - Verified database persistence
   - **Time Saved**: ~80% on troubleshooting/debugging

3. **Human Developer** (Architecture + Integration)
   - Made technology decisions (Next.js, shadcn/ui, TanStack Query)
   - Designed BFF pattern for API security
   - Integrated AI-generated code into working system
   - Tested end-to-end flow
   - Committed and documented progress
   - **Time**: ~6-8 hours actual work

**Key Insight**: With AI + MCP, a **single experienced developer** can match the output of a 3-4 person team on routine tasks. Complex integration/architecture still requires human expertise.

---

### Minimal Team: 4-6 People (TRADITIONAL APPROACH - For Reference)

**1. Technical Lead / Full-Stack Developer** (You or hire)
- **Critical**: Must know OpenMRS + Spring + (React/Next.js if Option B)
- **Time**: Full-time (40 hours/week × 16 weeks Option A / 20 weeks Option B)
- **Cost**: 
  - Option A: $3-5K/month × 4 months = $12-20K
  - Option B: $3-5K/month × 5 months = $15-25K
- **Role**: Architecture, NHIE integration, complex features, code review

**2. Backend Developer**
- **Skills**: Java, OpenMRS, SQL, REST APIs, FHIR
- **Time**: Full-time (40 hours/week × 16 weeks Option A / 20 weeks Option B)
- **Cost**: 
  - Option A: $1.5-2K/month × 4 months = $6-8K
  - Option B: $1.5-2K/month × 5 months = $7.5-10K
- **Role**: Patient registration, OPD encounters, NHIS eligibility, database design, FHIR converters

**3. Frontend Developer**
- **Skills**: 
  - Option A: HTML/CSS, JavaScript, HTML Form Entry
  - Option B: **TypeScript, Next.js, React, shadcn/ui, Tailwind CSS** (senior level required)
- **Time**: Full-time (40 hours/week × 16 weeks Option A / 20 weeks Option B)
- **Cost**: 
  - Option A: $1.5-2K/month × 4 months = $6-8K
  - Option B: $2-3K/month × 5 months = $10-15K (premium for Next.js/TypeScript expertise)
- **Role**: User interface, forms, patient dashboard, reports, UX

**4. QA/Tester (Part-time)**
- **Skills**: Manual testing, test case writing, bug tracking
- **Time**: 
  - Option A: Part-time (20 hours/week × 12 weeks, starting Week 5)
  - Option B: Part-time (20 hours/week × 15 weeks, starting Week 6)
- **Cost**: 
  - Option A: $800-1K/month × 3 months = $2.4-3K
  - Option B: $800-1K/month × 3.75 months = $3-3.8K
- **Role**: Test all workflows, NHIE integration validation, user acceptance testing

**5. Clinical Informaticist (Consultant, part-time)**
- **Skills**: Clinical workflows, NHIS rules, Ghana health system knowledge
- **Time**: 
  - Option A: 10 hours/week × 16 weeks = 160 hours
  - Option B: 10 hours/week × 20 weeks = 200 hours
- **Cost**: 
  - Option A: $2-3K total
  - Option B: $2.5-3.75K total
- **Role**: Validate workflows, train pilot facility staff, liaison with MoH

**6. DevOps Engineer (Part-time)**
- **Skills**: Linux, Docker, CI/CD, backups, SSL, monitoring, Vercel (Option B)
- **Time**: 
  - Option A: Part-time (Weeks 1–2, 14–16; ~8–12 hrs/week)
  - Option B: Part-time (Weeks 1–2, 18–20; ~8–12 hrs/week)
- **Cost**: $1.5-2.5K total
- **Role**: Dockerized dev/staging, backups + restore drills, SSL/TLS, logs/metrics, pilot deployment hardening, **Option B: Vercel deployment, CORS config**

**Total Team Cost**: 
- **Option A**: $29.9K - $42.5K (16 weeks)
- **Option B**: $39.5K - $60.55K (20 weeks)

---

## Technology Stack (Optimized for Speed)

### Backend
- **OpenMRS Platform 2.6.0**: Core EMR engine
- **Database**: MySQL 5.7 (required by OpenMRS, non-negotiable)
  - **Note**: OpenMRS is tightly coupled to MySQL and won't run on PostgreSQL/Supabase without major rewrites
  - **Hosting Options**: 
    - Self-hosted MySQL on Ubuntu server (recommended for MVP)
    - Managed MySQL: AWS RDS, DigitalOcean Managed Database ($15-60/month)
    - DO NOT attempt PostgreSQL/Supabase for core OpenMRS database
- **API**: OpenMRS REST API + custom Spring controllers for NHIE
- **Optional Supabase Use**: For supplementary services only (NHIE logs, analytics cache, custom dashboards—NOT core EMR data)

### Frontend
- **Option A (Faster)**: OpenMRS Reference Application + HTML Form Entry
  - **Pros**: No React needed, faster development, proven in Kenya/Rwanda
  - **Cons**: Less modern UI, limited customization
  - **Timeline**: 16 weeks
  - **Recommendation**: Use if speed is critical and budget is tight

- **Option B (Modern UX)**: Next.js + TypeScript + shadcn/ui + React
  - **Stack**: 
    - Next.js 14.x (App Router)
    - TypeScript 5.x (type safety)
    - shadcn/ui (beautiful, accessible components)
    - Tailwind CSS 3.x (styling)
    - TanStack Query 5.x (API state management)
    - React Hook Form 7.x + Zod (forms + validation)
    - Axios (HTTP client for OpenMRS REST API)
  - **Architecture**: Next.js frontend ↔ OpenMRS REST API backend
  - **Pros**: Modern UI/UX, easier recruiting (React devs abundant), better maintainability, future-ready for patient portal/mobile
  - **Cons**: +4 weeks timeline (20 weeks total), requires senior frontend dev, two codebases to manage
  - **Cost Impact**: +$5-7K (extra month + senior dev premium)
  - **Recommendation**: Choose if you have strong Next.js/TypeScript dev and can afford 20-week timeline

**Startup Advice**: **Option B recommended** if timeline allows—modern UI improves MoH perception, easier recruiting, better foundation for v2 features

### NHIE Integration
- **HTTP Client**: Spring RestTemplate or OkHttp
- **FHIR Library**: HAPI FHIR 5.x (Java FHIR library)
- **Authentication**: OAuth 2.0 (Spring Security OAuth)
- **Queue**: Simple database queue (nhie_transaction_queue table) for retry logic

### Deployment
- **Frontend (Option B)**: 
  - **Dev**: Next.js dev server (localhost:3000)
  - **Production Options**:
    - Vercel (recommended, free tier, auto-deploy from Git)
    - Same Ubuntu server with Nginx reverse proxy
    - Note: Must configure CORS if frontend/backend on different domains
- **Backend**: Single Ubuntu 22.04 server (DigitalOcean/Linode $40-80/month)
- **Specs**: 8GB RAM, 4 vCPU, 160GB SSD (handles 50-100 users)
- **Database**: MySQL 5.7 installed on same server (or separate managed MySQL instance)
- **Backup**: Daily automated backups to cloud storage (DigitalOcean Spaces, AWS S3)
- **SSL**: Let's Encrypt (free)
- **Optional**: Supabase project (free tier) for NHIE transaction logs + real-time dashboards (keeps core EMR data separate)

---

## Budget Breakdown (Bootstrap Scenario)

### Development Costs (16 weeks Option A / 20 weeks Option B)
| Item | Option A Cost | Option B Cost |
|------|---------------|---------------|
| Technical Lead (4-5 months) | $12,000 - 20,000 | $15,000 - 25,000 |
| Backend Developer (4-5 months) | $6,000 - 8,000 | $7,500 - 10,000 |
| Frontend Developer (4-5 months) | $6,000 - 8,000 | $10,000 - 15,000 |
| QA/Tester (3-3.75 months, part-time) | $2,400 - 3,000 | $3,000 - 3,800 |
| Clinical Informaticist (consultant) | $2,000 - 3,000 | $2,500 - 3,750 |
| DevOps Engineer (part-time) | $1,500 - 2,500 | $1,500 - 2,500 |
| **Subtotal** | **$29,900 - 44,500** | **$39,500 - 60,050** |

### Infrastructure & Tools (16-20 weeks)
| Item | Option A Cost | Option B Cost |
|------|---------------|---------------|
| Cloud hosting (4-5 months) | $240 - 320 | $300 - 400 |
| Vercel hosting (Option B, free tier) | $0 | $0 |
| NHIE sandbox access (if paid) | $500 - 2,000 | $500 - 2,000 |
| GitHub Copilot (4 devs × 4-5 months) | $320 | $400 |
| Staging server | $160 | $200 |
| **Subtotal** | **$1,220 - 2,800** | **$1,400 - 3,000** |

### Pilot Deployment (Week 16)
| Item | Cost |
|------|------|
| On-premise server (if required) | $1,500 - 3,000 |
| Network equipment (router, switch) | $300 - 500 |
| Printer | $200 |
| Travel + accommodation (2 people × 3 days) | $800 - 1,200 |
| Contingency | $1,000 |
| **Subtotal** | **$3,800 - 5,900** |

### **Total MVP Budget**: 
- **Option A (16 weeks)**: $34,920 - $53,200
- **Option B (20 weeks)**: $44,700 - $68,950

**Lean Scenario** (if you're the Technical Lead): 
- **Option A**: $22,920 - $33,200
- **Option B**: $29,700 - $43,950

---

## Key Success Factors

### 1. Get NHIE Sandbox Access Early
- Contact MoH Digital Health Unit (info@moh.gov.gh) **this week**
- Request NHIE specifications + sandbox environment
- If specs not ready: Use Kenya HIE as proxy, refactor when Ghana specs available
- **Risk Mitigation**: Budget 20% contingency for NHIE spec changes

### 2. Secure Pilot Facility Early
- Target: 1 teaching hospital (Korle-Bu, Komfo Anokye) or regional hospital
- Pitch: "Free EMR pilot, NHIE-compliant, 16-week delivery, no vendor lock-in"
- Get written MOU: Access to facility, staff training time, 3-month pilot period
- **Why teaching hospital**: High volume, tech-savvy staff, visible reference site

### 3. Use AI Aggressively
- GitHub Copilot for ALL developers ($10/month/dev = best ROI)
- Create context docs (Week 1): OpenMRS patterns, Ghana domain knowledge, NHIE specs
- Use AI for boilerplate: FHIR converters, REST APIs, database queries, unit tests
- Expected: 40-50% time savings on routine tasks

### 4. Ruthless Scope Management
- Every feature request: "Does this block go-live at pilot facility?"
- If NO -> Defer to v2
- Track "v2 Feature Backlog" but don't build now
- **Remember**: Working system with 5 features > perfect system with 20 features that's not done

### 5. Weekly Demos
- Every Friday: Demo working features to stakeholders (pilot facility, advisors, investors if any)
- Forces prioritization, catches issues early, builds momentum
- Record demos -> Marketing material for EOI submission

---

## Risk Mitigation

### Risk 1: NHIE Specs Not Available
**Likelihood**: High (60%)
**Impact**: Medium (3-4 week delay)
**Mitigation**:
- Use Kenya HIE specs as proxy (90% likely similar)
- Build abstraction layer (NHIEAdapter interface) so backend can swap easily
- Budget 2 weeks for refactoring when Ghana specs available

### Risk 2: Can't Find OpenMRS Expertise
**Likelihood**: Medium (40%)
**Impact**: High (8-12 week delay)
**Mitigation**:
- Hire from Kenya/Rwanda OpenMRS community (remote OK)
- Contact Ampath, Partners In Health for contractor referrals
- Worst case: Bring consultant from Kenya for 2-week bootcamp ($5K)

### Risk 3: Pilot Facility Pulls Out
**Likelihood**: Low (20%)
**Impact**: Medium (3-4 week delay to find replacement)
**Mitigation**:
- Have 2 backup facilities identified
- Start relationship-building with MoH now
- Offer financial incentive (free support for 12 months post-pilot)

### Risk 4: Team Bandwidth Issues
**Likelihood**: Medium (50%)
**Impact**: Medium (2-4 week delay)
**Mitigation**:
- Keep team small and focused (4-5 people max)
- Hire full-time, not part-time (context switching kills productivity)
- Have 1 backup developer identified (can start within 2 weeks)

---

## Go-to-Market Strategy After MVP

### Month 5 (Post-Pilot)
1. **Capture Success Metrics**:
   - Patients registered: Target 500+ in 3 months
   - Encounters recorded: Target 1,500+ 
   - NHIE sync success rate: Target >95%
   - User satisfaction: Survey staff (target >80% satisfied)
   - Uptime: Target >98%

2. **Create Marketing Assets**:
   - Case study (2-page PDF with metrics)
   - Video demo (10 minutes showing full OPD workflow)
   - Testimonial from pilot facility Medical Director
   - Screenshots of key features

3. **Submit EOI (Q1 2026)**:
   - Highlight: Live reference site (not vaporware)
   - Emphasize: Open-source (no vendor lock-in)
   - Cost: $5-8K/facility vs $50K+ for proprietary
   - Proven NHIE integration (not theoretical)

### Month 6-12 (Scale)
- **Target**: Win 10-20 facility contract from MoH
- **Pricing**: $5-8K/facility setup + $200-300/month support
- **Revenue**: $50-160K upfront + $24-72K/year recurring
- **Expand Team**: Add 2-3 developers + 1 support engineer

---

## Critical Path: Next 4 Weeks

If you're starting today (October 30, 2025):

### Week 1 (Nov 4-8, 2025)
- [ ] Contact MoH Digital Health Unit (request NHIE specs + sandbox)
- [ ] Identify 3 potential pilot facilities, initiate conversations
- [ ] Recruit Technical Lead (if not you) - post on Ghana tech job boards, OpenMRS community
- [ ] Set up development environment:
  - OpenMRS 2.4.0 + MySQL + GitHub repo
  - **Option B**: Next.js 14 project + TypeScript + shadcn/ui + TanStack Query + React Hook Form
- [ ] Create AI context documentation (OpenMRS patterns, Ghana domain knowledge)

### Week 2 (Nov 11-15, 2025)
- [ ] Recruit Backend + Frontend developers (for Option B: ensure Next.js/TypeScript expertise)
- [ ] Finalize pilot facility MOU (signed agreement)
- [ ] Build patient registration module:
  - **Option A**: HTML Form Entry
  - **Option B**: Next.js form with shadcn/ui components, Zod validation
- [ ] Set up project management (GitHub Projects or Trello)
- [ ] Weekly demo #1 to pilot facility

### Week 3 (Nov 18-22, 2025)
- [ ] Complete patient registration + search
- [ ] Build user management (roles, privileges)
- [ ] **Option B**: Authentication UI (login, protected routes, role-based access)
- [ ] Start FHIR converter development (Patient resource)
- [ ] Weekly demo #2

### Week 4 (Nov 25-29, 2025)
- [ ] NHIE patient sync (first integration milestone!)
- [ ] Test with NHIE sandbox (or Kenya HIE if Ghana sandbox not ready)
- [ ] **Option B**: Patient dashboard UI with NHIE sync status
- [ ] Recruit QA/Tester + Clinical Informaticist
- [ ] Weekly demo #3 (show NHIE integration working!)

**By Week 4**: You should have:
- [DONE] 4-6 person team recruited
- [DONE] Pilot facility committed (signed MOU)
- [DONE] Patient registration working (with modern UI if Option B)
- [DONE] NHIE integration proven (patients syncing to sandbox)
- [DONE] Clear path to OPD workflow build

---

## Implementation Notes

### NHIE Configuration & Profiles
- Properties (module/global properties):
  - `ghana.nhie.baseUrl`
  - `ghana.nhie.oauth.tokenUrl`, `ghana.nhie.oauth.clientId`, `ghana.nhie.oauth.clientSecret`, `ghana.nhie.oauth.scopes`
  - `ghana.nhie.tls.enabled`, `ghana.nhie.tls.keystore.path`, `ghana.nhie.tls.keystore.password`
  - `ghana.nhie.timeout.connectMs`, `ghana.nhie.timeout.readMs`
  - `ghana.nhie.retry.maxAttempts`, `ghana.nhie.retry.initialDelayMs`, `ghana.nhie.retry.maxDelayMs`, `ghana.nhie.retry.multiplier`
  - `ghana.fhir.identifier.ghanaCard = http://moh.gov.gh/fhir/identifier/ghana-card`
  - `ghana.fhir.identifier.nhis = http://moh.gov.gh/fhir/identifier/nhis`
  - `ghana.fhir.identifier.folder = http://moh.gov.gh/fhir/identifier/folder-number`
- Make endpoints/profile IDs environment-driven (dev/staging/pilot).

### Error Handling & Retry Policy
- Taxonomy:
  - 400/404: validation/not found — do not retry, surface to user.
  - 401/403: auth — refresh token once; if fails, alert operator.
  - 409: conflict — fetch server representation, reconcile, mark resolved.
  - 422: business rule (e.g., invalid tariff) — do not retry automatically, move to DLQ.
  - 429/5xx/timeouts: transient — retry with backoff.
- Backoff: 5s -> 30s -> 2m -> 10m -> 1h (cap). `maxAttempts = 8` then DLQ.
- Operator actions: requeue DLQ, edit payload root-causes (where safe), download error report.

### Minimal Concept Pack (Liquibase seeder)
- Vitals: BP systolic/diastolic, Temp, Weight, Height, Pulse, RR, BMI (derived).
- Diagnoses: Top 20 Ghana OPD ICD‑10 codes (map to ICD‑10).
- Labs: 10 common tests (map to LOINC where possible).
- Install via changeset; document UUIDs and mappings for converter tests.

### Observability
- Structured JSON logs for NHIE calls: action, endpoint, status, latency, correlationId.
- Metrics: success/fail counters by resource; queue depth; retry count; DLQ size.
- Health endpoints: `GET /nhie/status` (auth + basic ping) and queue summary in operator UI.

### Security & Audit
- Privilege matrix per role (view/edit patients, encounters, billing, claims).
- ATNA-like audit rows: who/what/when/result for key operations.
- Secrets in environment variables; encrypted backups; note Ghana DPA alignment (retention, least privilege).

### Testing Harness & NHIE Mock
- HAPI FHIR/WireMock scenarios: 200, 401 (token expired), 409 (duplicate patient), 422 (invalid tariff), 500, timeout.
- Unit tests for FHIR converters; integration tests for queue + retry.

### Facility & Provider Codes
- Capture facility code and provider identifiers to populate Encounter.author and serviceProvider references correctly.

### Technology Clarifications
- Distro: Pin compatible versions after validation (e.g., Platform 2.6.x, RefApp 2.13.x, FHIR2 1.x). Record exact versions in repo once validated.
- Claims export: provide CSV for manual upload and optional FHIR Claim Bundle export behind a feature flag.
- Eligibility cache: default TTL 24h with manual refresh and forced refresh at claim time.

### Acceptance Criteria & Demo Script
- Patient create/search >95% success; eligibility <3s.
- Encounter + vitals posted to NHIE; visible in SHR mock.
- Claim submitted; `ClaimResponse` displayed; reject shows reason.
- Queue survives 72h outage; auto-resumes; no duplicate submissions post-replay.
- Privilege checks enforced for all sensitive actions.
- Demo path: Registration -> Eligibility -> OPD -> Claim -> simulate outage -> replay.

### Next Steps
- Scaffold Dockerized dev stack and pin module versions.
- Add Liquibase for `nhie_transaction_log` and `nhie_transaction_queue` (indexed by patient, status, created_at).
- Implement NHIE client with config keys above; add operator queue UI stub.
- Land converter unit tests and NHIE mock scenarios.

## Bottom Line Startup Advice

1. **Speed vs UX trade-off**: 
   - **Option A (16 weeks)**: Faster time-to-market, proven tech, functional UI
   - **Option B (20 weeks)**: +4 weeks but modern UI, easier recruiting, better foundation
2. **Choose Option B if**: You can afford extra $10-15K and 4 weeks, have/can find Next.js expert, UX matters for pitch
3. **Choose Option A if**: Speed critical (need demo by Dec/Jan), tight budget, can't find Next.js talent
4. **Pilot facility = validation + marketing**: One live site worth more than 100 PowerPoints
5. **OpenMRS = unfair advantage**: 10M patients proven, you're not building from scratch
6. **AI = force multiplier**: 40-50% time savings if you create context docs (works for both options)
7. **NHIE integration = barrier to entry**: Prove it works, you've eliminated 80% of competition

**Your Goal**: By January 2026 (EOI submission), walk into MoH with:
- Live EMR at teaching hospital
- 500+ patients registered
- 1,500+ encounters recorded
- >95% NHIE sync success rate
- Happy pilot facility testimonial
- **(Option B bonus)**: Modern UI that impresses decision-makers

**You'll win because**: You have proof, others have promises.

**Recommendation**: **Go with Option B** (Next.js + shadcn/ui) if you have 5 months and can find competent React/TypeScript dev. The modern UI will significantly improve your pitch to MoH, easier to recruit developers in Ghana, and sets better foundation for v2 features (patient portal, mobile app). The extra $10-15K and 4 weeks is worth the investment.

