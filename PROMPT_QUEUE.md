# Active Task Queue

**Active Tasks:** 1
**Next Task:** User Journey Alignment & Navigation Improvements

**For Workers:** CRITICAL task ready for implementation - see Task 10 below.

**Important:** If your task requires OpenMRS backend work (database, Java, Spring config), see [OPENMRS_PROMPT_GUIDE.md](../OPENMRS_PROMPT_GUIDE.md) for specialized workflow.

**When new tasks are added:**
- [ ] Read AGENTS.md Task Management Workflow section
- [ ] Change status to [WIP] IN PROGRESS when starting
- [ ] Execute ALL steps (no skipping)
- [ ] Run ALL verification commands
- [ ] **PERFECT HANDSHAKE:** If part of sequence, ADD next task BEFORE completing
- [ ] Update IMPLEMENTATION_TRACKER.md BEFORE deleting task

---

## [ACTIVE] ACTIVE (1 Task)

**Phase 2: OPD Core Workflow (Week 6-11)** - Starting November 2, 2025

**Recent Completions:**
- [DONE] Task 9: OPD Consultation Module - Frontend - Completed Nov 3, 2025
- [DONE] Task 5: NHIE Patient Sync Integration (Week 4-5) - Completed Nov 2, 2025
- [DONE] Task 4: Backend Report API Endpoints - Completed Nov 3, 2025
- [DONE] Task 3: Frontend Pages (Login, Dashboard, Patient List) - Completed Nov 3, 2025
- [DONE] Task 2: Auth Endpoints (Login, Logout, Session) - Completed Nov 2, 2025

---

## [WIP] Task 10: User Journey Alignment & Navigation Improvements (Priority: CRITICAL)

**Created:** 2025-11-03 22:00 UTC
**Priority:** CRITICAL (Blocking issue - must complete before Task 11)
**Estimated Time:** 12-15 hours (3 sprints recommended)
**Dependencies:** Task 9 completed
**Status:** [WIP] IN PROGRESS - Currently implementing Phase 2, Step 2.2 (Backend Queue Service)

### Context & Background

After completing Task 9 (OPD Consultation Module), comprehensive research of EMR industry standards revealed that MedReg's user journey has critical gaps that prevent effective clinical workflow.

**Research Conducted:**
- UgandaEMR+ (1,700+ facilities): [Success story analysis](https://openmrs.org/ugandaemr-o3-success-story/)
- OpenMRS 3.x design patterns
- Bahmni EMR navigation architecture
- Complete codebase user journey mapping

**Key Findings:**
1. **Non-Standard Entry Point**: MedReg has marketing homepage (not aligned with clinical EMR standards)
2. **No Queue Management**: Manual UUID entry required, clinicians can't see waiting patients
3. **Navigation Gaps**: Dead ends after completing workflows, no global patient search
4. **Inconsistent UX**: Mixed success feedback patterns, no breadcrumbs

**Industry Standard** (UgandaEMR quote):
> "When a patient arrives at a facility, they are first registered into the queuing system at the reception. Triage nurses then log into the system to record the patient's vital signs, which are automatically forwarded to the appropriate clinician or lab technician based on the patient's needs."

**MedReg Current State**: No queue system, manual tracking required ❌

### Self-Contained Execution Instructions

**READ THESE FILES FIRST (Required Context):**
1. `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` - **COMPLETE implementation guide** (100+ pages with all code snippets, testing strategy, deployment steps)
2. `docs/UGANDA_EMR_REFERENCE.md` - UgandaEMR architecture patterns
3. `frontend/src/app/layout.tsx` - Current navigation structure
4. `frontend/src/app/page.tsx` - Current homepage (to be replaced)
5. `frontend/src/app/dashboard/page.tsx` - Current dashboard
6. `frontend/src/app/patients/[uuid]/page.tsx` - Patient Hub (shows workflow buttons already exist)

**CRITICAL**: The implementation plan document contains COMPLETE code for all components. DO NOT deviate from the plan without documenting reasons.

---

### IMPLEMENTATION OVERVIEW

This task is divided into **3 sequential phases**. Each phase must be completed and tested before moving to the next.

---

## PHASE 1: Fix Entry Point & Core Navigation (4 hours)

### STEP 1.1: Remove Marketing Homepage

**What to do:**
Replace `frontend/src/app/page.tsx` with redirect logic (no marketing content).

**Implementation:**
```typescript
// frontend/src/app/page.tsx - COMPLETE REPLACEMENT
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function HomePage() {
  const sessionCookie = cookies().get('omrsSession');

  if (sessionCookie) {
    // User is authenticated → Go to dashboard
    redirect('/dashboard');
  } else {
    // User not authenticated → Go to login
    redirect('/login');
  }
}
```

**Verification:**
```bash
# Test 1: Not authenticated
curl -I http://localhost:3001/
# Should redirect to /login

# Test 2: Authenticated (with session cookie)
curl -I -H "Cookie: omrsSession=xxx" http://localhost:3001/
# Should redirect to /dashboard
```

**Success Criteria:**
- [ ] Visiting `/` without session redirects to `/login`
- [ ] Visiting `/` with session redirects to `/dashboard`
- [ ] No marketing content visible
- [ ] No console errors

---

### STEP 1.2: Create Global Patient Search Component

**What to do:**
Create reusable patient search component for header navigation.

**File to create:** `frontend/src/components/patient/patient-search-header.tsx`

**Implementation:**
See complete code in `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` section 1.2 (lines 220-290).

**Key features:**
- Autocomplete dropdown using shadcn/ui Command component
- Search by Ghana Card, folder number, or name
- Minimum 2 characters to trigger search
- Debounced API calls to `/api/patients?q=...`
- Navigates to patient detail page on selection

**Verification:**
```bash
# Manual test in browser:
# 1. Type "GHA-123" in search box
# 2. Verify results appear within 500ms
# 3. Click result → navigates to /patients/[uuid]
# 4. Search by folder number → same behavior
# 5. Search by name → same behavior
```

**Success Criteria:**
- [ ] Search box visible in header
- [ ] Autocomplete dropdown shows results
- [ ] Search by Ghana Card works
- [ ] Search by folder number works
- [ ] Search by name works
- [ ] Selecting patient navigates to detail page
- [ ] Loading state shows while searching

---

### STEP 1.3: Update Global Navigation

**What to do:**
Modify `frontend/src/app/layout.tsx` to add patient search, "Patients" link, and update queue links.

**Implementation:**
See complete code in `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` section 1.2 (lines 300-350).

**Key changes:**
- Import `PatientSearchHeader` component
- Add search component to header
- Add "Patients" link to nav
- Change "Triage" → "Triage Queue"
- Change "Consult" → "Consult Queue"
- Change "Dispense" → "Pharmacy Queue"
- Add user dropdown menu with logout

**Verification:**
```bash
# Manual test:
# 1. Check header shows patient search
# 2. Check nav shows "Patients" link
# 3. Check "Triage Queue" link (not just "Triage")
# 4. Check user menu shows username
# 5. Check logout option works
```

**Success Criteria:**
- [ ] Patient search visible in header
- [ ] "Patients" link goes to `/patients`
- [ ] Queue links updated with correct text
- [ ] User menu shows current user
- [ ] Logout works and redirects to login

---

### STEP 1.4: Add Cancel Buttons to OPD Forms

**What to do:**
Add cancel buttons to triage, consultation, and dispense forms.

**Files to modify:**
1. `frontend/src/app/opd/triage/page.tsx`
2. `frontend/src/app/opd/consultation/page.tsx`
3. `frontend/src/app/opd/dispense/page.tsx`

**Pattern for each file:**
```typescript
// Find the submit button section, add cancel button before it
<div className="flex items-center gap-3">
  <Button
    type="button"
    variant="outline"
    onClick={() => router.push('/opd/triage-queue')} // or consultation-queue, pharmacy-queue
  >
    Cancel
  </Button>
  <Button type="submit" disabled={!allowed || mutation.isPending}>
    {mutation.isPending ? 'Saving…' : 'Save'}
  </Button>
</div>
```

**Verification:**
```bash
# Manual test each form:
# 1. Open triage form
# 2. Click Cancel → redirects to triage queue
# 3. Repeat for consultation and dispense
```

**Success Criteria:**
- [ ] Cancel button visible on triage form
- [ ] Cancel button visible on consultation form
- [ ] Cancel button visible on dispense form
- [ ] Clicking cancel navigates to appropriate queue page
- [ ] Cancel does not save data

---

### PHASE 1 COMPLETION CHECKLIST

Before proceeding to Phase 2, verify:

```
[ ] Homepage redirect works (authenticated & unauthenticated)
[ ] Global patient search works (3 search methods)
[ ] "Patients" link added to nav
[ ] Queue links updated in nav
[ ] User menu with logout works
[ ] Cancel buttons on all 3 OPD forms
[ ] No TypeScript errors
[ ] No console errors
[ ] All navigation links functional
```

**Estimated Time for Phase 1:** 4 hours

---

## PHASE 2: Queue Management System (5-6 hours)

**IMPORTANT**: Only start Phase 2 after Phase 1 is fully tested and working.

### STEP 2.1: Create Database Schema

**What to do:**
Create Liquibase changeset for patient queue table.

**File to create:** `backend/openmrs-module-ghanaemr/api/src/main/resources/liquibase-queue-management.xml`

**Implementation:**
See complete SQL in `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` section 2.1 (lines 580-700).

**Key fields:**
- `queue_id` (PK)
- `patient_id`, `visit_id` (FKs)
- `location_from_id`, `location_to_id` (workflow tracking)
- `status` (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- `queue_number` (TR001, CN001, PH001)
- `priority` (1-10, default 5)

**File to modify:** `backend/.../api/src/main/resources/liquibase.xml`
Add: `<include file="liquibase-queue-management.xml"/>`

**Verification:**
```bash
# Build and deploy module
cd backend/openmrs-module-ghanaemr
mvn clean install -DskipTests

# Check if table was created
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e "SHOW TABLES LIKE 'ghanaemr_patient_queue';"

# Verify table structure
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e "DESCRIBE ghanaemr_patient_queue;"
```

**Success Criteria:**
- [ ] Table `ghanaemr_patient_queue` created
- [ ] All foreign keys exist
- [ ] Indexes created (status, location, date)
- [ ] Liquibase changeset recorded
- [ ] No SQL errors in OpenMRS logs

---

### STEP 2.2: Create Backend Queue Service

**What to do:**
Create Java service for queue management (interface, implementation, DAO).

**Files to create:**
1. `backend/.../api/queue/PatientQueueService.java` (interface)
2. `backend/.../api/queue/model/PatientQueue.java` (entity)
3. `backend/.../api/queue/model/QueueStatus.java` (enum)
4. `backend/.../api/queue/impl/PatientQueueServiceImpl.java` (implementation)
5. `backend/.../api/queue/db/PatientQueueDAO.java` (DAO interface)
6. `backend/.../api/queue/db/hibernate/HibernatePatientQueueDAO.java` (DAO impl)

**Implementation:**
See complete code in `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` section 2.2 (lines 720-1050).

**Key methods:**
- `addToQueue(patient, visit, location, priority)` - Add patient to queue
- `getQueueByLocationAndStatus(location, status)` - Get waiting patients
- `moveToNextStation(currentQueue, nextLocation)` - Automatic routing
- `updateQueueStatus(queue, status)` - Update status
- `completeQueueEntry(queue)` - Mark as completed

**File to modify:** `backend/.../moduleApplicationContext.xml`
Register queue service bean.

**Verification:**
```bash
# Rebuild module
cd backend/openmrs-module-ghanaemr
mvn clean install -DskipTests

# Check for compilation errors
# Should see "BUILD SUCCESS"

# Deploy to OpenMRS
docker cp omod/target/ghanaemr-*.omod medreg-openmrs:/openmrs/data/modules/
docker restart medreg-openmrs
```

**Success Criteria:**
- [ ] All Java files compile successfully
- [ ] Service bean registered in Spring context
- [ ] Module deploys without errors
- [ ] OpenMRS logs show module started

---

### STEP 2.3: Create Frontend Queue API Routes

**What to do:**
Create Next.js API routes to access queue data.

**Files to create:**
1. `frontend/src/app/api/opd/queue/[location]/route.ts` - Get queue by location
2. `frontend/src/app/api/opd/queue/move/route.ts` - Move patient to next station

**Implementation:**
See complete code in `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` section 2.3 (lines 1060-1200).

**Key features:**
- GET `/api/opd/queue/[location]?status=PENDING` - Fetch waiting patients
- POST `/api/opd/queue/move` - Complete current queue, create next
- Calculate wait times (current time - date created)
- Error handling with proper status codes

**Verification:**
```bash
# Test queue API (after backend is deployed)
curl http://localhost:3001/api/opd/queue/<triage-location-uuid>?status=PENDING

# Should return:
# {"results": [], "total": 0}  (if no patients in queue)
```

**Success Criteria:**
- [ ] Queue API returns 200 status
- [ ] Empty queue returns {"results": [], "total": 0}
- [ ] API calculates wait times correctly
- [ ] Error handling returns proper HTTP codes

---

### STEP 2.4: Create Queue List Pages

**What to do:**
Create queue list pages for triage, consultation, and pharmacy.

**Files to create:**
1. `frontend/src/app/opd/triage-queue/page.tsx`
2. `frontend/src/app/opd/consultation-queue/page.tsx`
3. `frontend/src/app/opd/pharmacy-queue/page.tsx`

**Implementation:**
See complete code in `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` section 2.4 (lines 1210-1450).

**Key features:**
- Fetch queue data with 10-second polling
- Display queue table (number, patient, folder, Ghana Card, wait time, action)
- Color-coded wait times (green <15 min, yellow 15-30 min, red >30 min)
- Priority badges (Urgent, High, Normal)
- "Start" button opens workflow form with patientUuid pre-filled
- "Register New Patient" quick action
- "Refresh" button for manual update

**Verification:**
```bash
# Manual test (after registering test patient):
# 1. Register patient → Should appear in triage queue
# 2. Check triage queue page shows patient
# 3. Verify queue number (TR001)
# 4. Verify wait time calculates correctly
# 5. Click "Start Triage" → Opens form with patient UUID
```

**Success Criteria:**
- [ ] Triage queue page loads without errors
- [ ] Consultation queue page loads without errors
- [ ] Pharmacy queue page loads without errors
- [ ] Queue table shows correct columns
- [ ] Wait times update every 10 seconds
- [ ] "Start" button navigates to correct form
- [ ] Queue numbers display correctly

---

### STEP 2.5: Update Dashboard with Queue Widgets

**What to do:**
Add role-based queue widgets to dashboard.

**File to modify:** `frontend/src/app/dashboard/page.tsx`

**Implementation:**
See complete code in `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` section 2.5 (lines 1460-1600).

**Key features:**
- Role detection from cookies (nurse, doctor, pharmacist)
- Queue widget shows top 3 patients waiting
- Display count: "3 patients waiting"
- Quick "Start" buttons for first 3 patients
- "View All" navigates to queue page
- 10-second polling for real-time updates

**Verification:**
```bash
# Manual test for each role:
# 1. Login as nurse → See triage queue widget
# 2. Login as doctor → See consultation queue widget
# 3. Login as pharmacist → See pharmacy queue widget
# 4. Verify "View All" navigates to correct queue page
# 5. Verify "Start" button opens correct form
```

**Success Criteria:**
- [ ] Nurses see triage queue widget
- [ ] Doctors see consultation queue widget
- [ ] Pharmacists see pharmacy queue widget
- [ ] Widget shows patient count
- [ ] Top 3 patients displayed
- [ ] "View All" navigates correctly
- [ ] "Start" buttons work

---

### STEP 2.6: Integrate Queue with OPD Forms

**What to do:**
Update triage, consultation, dispense forms to:
1. Accept `queueUuid` query parameter
2. Move patient to next station after save
3. Redirect to queue page after success

**Files to modify:**
1. `frontend/src/app/opd/triage/page.tsx`
2. `frontend/src/app/opd/consultation/page.tsx`
3. `frontend/src/app/opd/dispense/page.tsx`

**Pattern for each file:**
```typescript
// 1. Get queueUuid from URL
const searchParams = useSearchParams();
const queueUuid = searchParams.get('queueUuid');

// 2. After successful save, move to next queue
if (queueUuid) {
  await fetch('/api/opd/queue/move', {
    method: 'POST',
    body: JSON.stringify({
      queueUuid,
      patientUuid,
      visitUuid,
      nextLocationUuid: NEXT_LOCATION_UUID,
    }),
  });
}

// 3. Redirect to queue page
router.push('/opd/triage-queue'); // or consultation-queue, pharmacy-queue
```

**Implementation:**
See complete code in `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` section 2.6 (lines 1620-1750).

**Verification:**
```bash
# End-to-end test:
# 1. Register patient → Check triage queue shows patient
# 2. Start triage from queue → Record vitals → Save
# 3. Verify patient disappears from triage queue
# 4. Check consultation queue → Patient should appear
# 5. Start consultation → Diagnose → Prescribe → Save
# 6. Verify patient moves to pharmacy queue
# 7. Dispense drugs → Save
# 8. Verify visit marked complete
```

**Success Criteria:**
- [ ] Triage save moves patient to consultation queue
- [ ] Consultation save moves patient to pharmacy queue
- [ ] Dispense save marks visit complete
- [ ] Queue entries updated correctly in database
- [ ] No duplicate queue entries
- [ ] Previous queue entry marked COMPLETED

---

### PHASE 2 COMPLETION CHECKLIST

Before proceeding to Phase 3, verify:

```
[ ] Database table created successfully
[ ] Backend queue service compiles and deploys
[ ] Queue API routes return data
[ ] Triage queue page shows patients
[ ] Consultation queue page shows patients
[ ] Pharmacy queue page shows patients
[ ] Dashboard shows role-appropriate queue widget
[ ] Queue polling updates every 10 seconds
[ ] Patient registration adds to triage queue
[ ] Complete triage moves to consultation queue
[ ] Complete consultation moves to pharmacy queue
[ ] Complete dispense marks visit complete
[ ] Queue numbers generate correctly (TR001, CN001, PH001)
[ ] Wait times calculate correctly
[ ] No database errors
[ ] No API errors
[ ] End-to-end workflow tested successfully
```

**Estimated Time for Phase 2:** 5-6 hours

---

## PHASE 3: Enhanced UX & Polish (3-4 hours)

**IMPORTANT**: Only start Phase 3 after Phase 2 is fully tested and queue system is working.

### STEP 3.1: Create Breadcrumb Component

**What to do:**
Create reusable breadcrumb navigation component.

**File to create:** `frontend/src/components/ui/breadcrumb.tsx`

**Implementation:**
See complete code in `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` section 3.1 (lines 1800-1850).

**Key features:**
- Accepts array of `{label, href}` items
- Clickable links for parent levels
- Chevron separator between items
- Last item not clickable (current page)

**Verification:**
```typescript
// Test in a page:
import { Breadcrumb } from '@/components/ui/breadcrumb';

<Breadcrumb items={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Triage Queue', href: '/opd/triage-queue' },
  { label: 'Record Vitals' },
]} />
```

**Success Criteria:**
- [ ] Breadcrumb renders correctly
- [ ] Parent links clickable
- [ ] Current page not clickable
- [ ] Chevron separators visible
- [ ] Hover states work

---

### STEP 3.2: Add Breadcrumbs to All Pages

**What to do:**
Import and add breadcrumb component to all OPD pages and patient pages.

**Files to modify (9 pages):**
1. `frontend/src/app/opd/triage-queue/page.tsx`
2. `frontend/src/app/opd/triage/page.tsx`
3. `frontend/src/app/opd/consultation-queue/page.tsx`
4. `frontend/src/app/opd/consultation/page.tsx`
5. `frontend/src/app/opd/pharmacy-queue/page.tsx`
6. `frontend/src/app/opd/dispense/page.tsx`
7. `frontend/src/app/patients/page.tsx`
8. `frontend/src/app/patients/register/page.tsx`
9. `frontend/src/app/patients/[uuid]/page.tsx`

**Pattern:**
```typescript
import { Breadcrumb } from '@/components/ui/breadcrumb';

// Add at top of page content, before main heading
<Breadcrumb items={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Current Section', href: '/current-section' },
  { label: 'Current Page' },
]} />

<h1>Page Title</h1>
```

**Breadcrumb structures:**
See `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` section 3.2 for exact breadcrumb structure for each page.

**Verification:**
```bash
# Manual test each page:
# 1. Visit page → Breadcrumb visible
# 2. Click parent link → Navigates correctly
# 3. Verify hierarchy makes sense
```

**Success Criteria:**
- [ ] Breadcrumbs visible on all 9 pages
- [ ] All breadcrumb links work
- [ ] Hierarchy logical (Dashboard → Section → Page)
- [ ] Consistent styling across pages

---

### STEP 3.3: Standardize Toast Notifications

**What to do:**
Install toast library and standardize success/error feedback across all forms.

**Install dependency:**
```bash
cd frontend
npm install sonner
```

**File to create:** `frontend/src/components/ui/toast-provider.tsx`

**Implementation:**
See complete code in `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` section 3.2 (lines 1900-1950).

**File to modify:** `frontend/src/app/layout.tsx`
Add `<ToastProvider />` to root layout.

**Files to update (3 OPD forms):**
1. `frontend/src/app/opd/triage/page.tsx`
2. `frontend/src/app/opd/consultation/page.tsx`
3. `frontend/src/app/opd/dispense/page.tsx`

**Pattern for each form:**
```typescript
import { toast } from 'sonner';

// On success:
toast.success('Operation successful', {
  description: 'Patient sent to next queue',
});

// Auto-redirect after 1.5 seconds
setTimeout(() => {
  router.push('/queue-page');
}, 1500);

// On error:
toast.error('Operation failed', {
  description: error.message,
});
// No redirect - keep on form to retry
```

**Verification:**
```bash
# Manual test each form:
# 1. Submit form successfully → Toast appears
# 2. Verify toast shows success message
# 3. Verify auto-redirect after 1.5 seconds
# 4. Cause error → Toast shows error message
# 5. Verify no redirect on error
```

**Success Criteria:**
- [ ] Toast library installed
- [ ] Toast provider added to layout
- [ ] Success toasts on all 3 forms
- [ ] Error toasts on all 3 forms
- [ ] Auto-redirect after success (1.5 sec)
- [ ] No redirect after error
- [ ] Toast disappears after 5 seconds
- [ ] Consistent messaging across forms

---

### STEP 3.4: Create Documentation

**What to do:**
Create two documentation files explaining UX patterns and user journeys.

**Files to create:**
1. `docs/UX_PATTERNS.md` - Design decisions and patterns
2. `docs/USER_JOURNEYS.md` - Complete user workflow walkthroughs

**Implementation:**
See complete documentation content in `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` sections 3.3 and 3.4 (lines 1960-2800).

**UX_PATTERNS.md should cover:**
- Why no marketing homepage
- Navigation architecture
- Queue-first workflow
- Role-based landing pages
- Automatic workflow routing
- Breadcrumb navigation
- Success feedback pattern
- Patient search (two access points)
- Mobile/tablet optimization
- References to industry standards

**USER_JOURNEYS.md should cover:**
- Journey 1: Patient Registration → First Consultation (complete flow)
- Journey 2: Follow-Up Visit (existing patient)
- Journey 3: Admin Monitors NHIE Sync Issues
- Journey 4: Doctor Views Reports
- Navigation patterns summary
- Key UX principles applied

**Verification:**
```bash
# Check documentation is complete:
cat docs/UX_PATTERNS.md | grep "Why No Marketing Homepage"
cat docs/USER_JOURNEYS.md | grep "Journey 1"

# Verify markdown formatting:
# Open files in VS Code, check for broken links
```

**Success Criteria:**
- [ ] UX_PATTERNS.md created with all sections
- [ ] USER_JOURNEYS.md created with all journeys
- [ ] Markdown formatting correct
- [ ] No broken links
- [ ] Code examples syntax-highlighted
- [ ] References include actual URLs
- [ ] Documentation explains WHY not just WHAT

---

### PHASE 3 COMPLETION CHECKLIST

Final verification before marking task complete:

```
[ ] Breadcrumb component created
[ ] Breadcrumbs on all 9 pages
[ ] Toast library installed (sonner)
[ ] Toast provider in layout
[ ] Success toasts on all forms
[ ] Error toasts on all forms
[ ] Auto-redirect after success (1.5 sec)
[ ] UX_PATTERNS.md created
[ ] USER_JOURNEYS.md created
[ ] Documentation complete and accurate
[ ] No TypeScript errors
[ ] No console errors
[ ] All links in docs work
```

**Estimated Time for Phase 3:** 3-4 hours

---

## FINAL VERIFICATION & DEPLOYMENT

### Pre-Deployment Checklist

```
[ ] All Phase 1 tests passing
[ ] All Phase 2 tests passing
[ ] All Phase 3 tests passing
[ ] No TypeScript compilation errors
[ ] No console errors
[ ] Database backup taken
[ ] Environment variables configured
[ ] Documentation reviewed
```

### Environment Variables to Configure

**Backend** (add to module config or global properties):
```properties
ghanaemr.triage.location.uuid=<get-from-openmrs>
ghanaemr.consultation.location.uuid=<get-from-openmrs>
ghanaemr.pharmacy.location.uuid=<get-from-openmrs>
```

**Frontend** (add to `frontend/.env.local`):
```bash
NEXT_PUBLIC_TRIAGE_LOCATION_UUID=<from-openmrs>
NEXT_PUBLIC_CONSULTATION_LOCATION_UUID=<from-openmrs>
NEXT_PUBLIC_PHARMACY_LOCATION_UUID=<from-openmrs>
NEXT_PUBLIC_QUEUE_POLL_INTERVAL=10000
```

**Get location UUIDs from OpenMRS:**
```bash
# Login to OpenMRS → Administration → Manage Locations
# Or via API:
curl -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/location?q=triage&v=default"
```

### Deployment Steps

```bash
# 1. Build backend module
cd backend/openmrs-module-ghanaemr
mvn clean install -DskipTests

# 2. Deploy to OpenMRS
docker cp omod/target/ghanaemr-*.omod medreg-openmrs:/openmrs/data/modules/
docker restart medreg-openmrs

# 3. Wait for OpenMRS to restart (2-3 minutes)
docker ps --filter name=medreg-openmrs

# 4. Verify database migration
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e "SHOW TABLES LIKE 'ghanaemr_patient_queue';"

# 5. Restart frontend (to pick up new .env.local)
cd frontend
npm run dev

# 6. Test homepage redirect
curl -I http://localhost:3001/
# Should see: Location: /login

# 7. Test queue API
curl http://localhost:3001/api/opd/queue/<location-uuid>?status=PENDING
# Should return: {"results": [], "total": 0}
```

### End-to-End Testing

**Complete OPD Workflow Test:**

1. **Register Patient**
   - Navigate to `/patients/register`
   - Fill form with test data
   - Submit
   - Verify: Patient appears in triage queue

2. **Triage**
   - Login as nurse
   - Dashboard should show "My Triage Queue" widget
   - Click "View All Queue"
   - Verify: Patient visible with queue number TR001
   - Click "Start Triage"
   - Record vitals
   - Click "Save Triage"
   - Verify: Toast appears "Triage saved successfully"
   - Verify: Auto-redirect to triage queue after 1.5 sec
   - Verify: Patient no longer in triage queue

3. **Consultation**
   - Login as doctor
   - Dashboard should show "My Consultation Queue" widget
   - Verify: Patient appears with queue number CN001
   - Click "Start"
   - Enter diagnoses, prescriptions (from 50 medicines), lab orders
   - Click "Save Consultation"
   - Verify: Toast appears
   - Verify: Redirect to consultation queue
   - Verify: Patient moved to pharmacy queue

4. **Pharmacy**
   - Login as pharmacist
   - Dashboard should show "My Pharmacy Queue" widget
   - Verify: Patient appears with queue number PH001
   - Click "Start"
   - Select billing type (NHIS/Cash)
   - Dispense drugs
   - Click "Dispense Drugs"
   - Verify: Toast appears
   - Verify: Redirect to pharmacy queue
   - Verify: Patient removed from queue

5. **Verify Database**
   ```sql
   -- Check queue entries created
   SELECT * FROM ghanaemr_patient_queue
   WHERE patient_id = <test-patient-id>
   ORDER BY date_created;

   -- Should see 3 rows:
   -- 1. Triage (COMPLETED)
   -- 2. Consultation (COMPLETED)
   -- 3. Pharmacy (COMPLETED)
   ```

**Success Criteria:**
- [ ] Patient flows through all 3 stations
- [ ] Queue numbers increment correctly
- [ ] Automatic routing works
- [ ] Dashboard widgets update in real-time
- [ ] Breadcrumbs visible on all pages
- [ ] Toast notifications appear
- [ ] Auto-redirects work
- [ ] Wait times calculate correctly
- [ ] No errors in browser console
- [ ] No errors in OpenMRS logs

---

## Expected Deliverables

### Files Created (21 total)

**Backend (7 files):**
1. `backend/.../liquibase-queue-management.xml`
2. `backend/.../api/queue/PatientQueueService.java`
3. `backend/.../api/queue/model/PatientQueue.java`
4. `backend/.../api/queue/model/QueueStatus.java`
5. `backend/.../api/queue/impl/PatientQueueServiceImpl.java`
6. `backend/.../api/queue/db/PatientQueueDAO.java`
7. `backend/.../api/queue/db/hibernate/HibernatePatientQueueDAO.java`

**Frontend (11 files):**
1. `frontend/src/components/patient/patient-search-header.tsx`
2. `frontend/src/app/opd/triage-queue/page.tsx`
3. `frontend/src/app/opd/consultation-queue/page.tsx`
4. `frontend/src/app/opd/pharmacy-queue/page.tsx`
5. `frontend/src/app/api/opd/queue/[location]/route.ts`
6. `frontend/src/app/api/opd/queue/move/route.ts`
7. `frontend/src/components/ui/breadcrumb.tsx`
8. `frontend/src/components/ui/toast-provider.tsx`

**Documentation (3 files):**
1. `docs/UX_PATTERNS.md`
2. `docs/USER_JOURNEYS.md`
3. `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` (already created)

### Files Modified (15 total)

**Phase 1:**
- `frontend/src/app/page.tsx`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/opd/triage/page.tsx`
- `frontend/src/app/opd/consultation/page.tsx`
- `frontend/src/app/opd/dispense/page.tsx`

**Phase 2:**
- `backend/.../liquibase.xml`
- `backend/.../moduleApplicationContext.xml`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/opd/triage/page.tsx` (queue integration)
- `frontend/src/app/opd/consultation/page.tsx` (queue integration)
- `frontend/src/app/opd/dispense/page.tsx` (queue integration)

**Phase 3:**
- `frontend/src/app/layout.tsx` (toast provider)
- 9 pages (breadcrumbs)
- 3 OPD pages (toast notifications)

---

## Success Criteria

**This task is complete when:**

1. ✓ **Phase 1 Complete**:
   - Homepage redirects correctly (no marketing content)
   - Global patient search works (Ghana Card, folder, name)
   - "Patients" link added to nav
   - Cancel buttons on all OPD forms

2. ✓ **Phase 2 Complete**:
   - Patient registration adds to triage queue
   - Nurses see triage queue on dashboard
   - Doctors see consultation queue on dashboard
   - Pharmacists see pharmacy queue on dashboard
   - Completing triage moves patient to consultation queue
   - Completing consultation moves patient to pharmacy queue
   - Completing dispense marks visit complete
   - Queue numbers generate correctly (TR001, CN001, PH001)
   - Wait times calculate and update

3. ✓ **Phase 3 Complete**:
   - Breadcrumbs on all pages
   - Toast notifications standardized
   - Auto-redirect after success
   - UX_PATTERNS.md complete
   - USER_JOURNEYS.md complete

4. ✓ **Testing Complete**:
   - End-to-end OPD workflow tested successfully
   - All manual test cases passing
   - No TypeScript errors
   - No console errors
   - No database errors

5. ✓ **Deployment Complete**:
   - Backend module deployed to OpenMRS
   - Database migration successful
   - Frontend deployed with updated .env.local
   - Environment variables configured
   - Smoke tests passing

6. ✓ **Documentation Complete**:
   - All 3 documentation files created
   - IMPLEMENTATION_TRACKER.md updated
   - TASK_HISTORY.md updated

---

## Perfect Handshake (CRITICAL)

**BEFORE completing this task:**

This task is part of the OPD workflow implementation sequence. After completing this task, the next logical task is:

**Task 11: OPD Workflow End-to-End Testing & Bug Fixes**

**What Task 10 accomplished:**
- Fixed entry point and navigation
- Implemented queue management system
- Added breadcrumbs and standardized UX
- Created comprehensive documentation

**What Task 11 needs to do:**
- Comprehensive testing of complete OPD workflow
- Load testing (100+ patients in queue)
- Performance optimization (queue polling, API response times)
- Bug fixes discovered during testing
- User acceptance testing with clinical staff
- Training materials creation

**Dependencies for Task 11:**
- Task 10 fully deployed and working
- Test patient data prepared
- Clinical staff available for UAT
- Performance testing tools configured

**Add Task 11 to PROMPT_QUEUE.md BEFORE marking Task 10 complete.**

---

## Rollback Plan

If critical issues arise during deployment:

```bash
# 1. Rollback backend
docker exec medreg-openmrs rm /openmrs/data/modules/ghanaemr-*.omod
docker restart medreg-openmrs

# 2. Rollback database (if needed)
docker exec -it medreg-mysql mysql -u root -proot_password openmrs < backup_YYYYMMDD.sql

# 3. Rollback frontend
git checkout HEAD -- frontend/src/app/page.tsx
git checkout HEAD -- frontend/src/app/layout.tsx
# ... revert other changed files

# 4. Restart frontend
cd frontend
npm run dev
```

**When to rollback:**
- Critical bug preventing login
- Database corruption
- Queue system causing infinite loops
- Performance degradation (>3 sec page load times)

---

## Additional Notes

**Time Management:**
- Phase 1 can be completed in one session (4 hours)
- Phase 2 should span 2 sessions (5-6 hours total)
- Phase 3 can be completed in one session (3-4 hours)
- Total: Plan for 3 development sessions over 1-2 weeks

**Testing Recommendations:**
- Test each phase before moving to next
- Use real test data (Ghana Card numbers, NHIS numbers)
- Test with multiple roles (nurse, doctor, pharmacist, admin)
- Test edge cases (empty queue, 100+ patients, network errors)

**Performance Considerations:**
- Queue polling every 10 seconds - acceptable for <50 concurrent users
- If performance issues arise, increase polling interval to 30 seconds
- Consider WebSocket implementation for v2 (real-time updates)
- Database indexes created on queue table for performance

**Security Considerations:**
- Queue API authenticated via session cookie
- Role-based access enforced (nurses only see triage queue, etc.)
- Patient data masked in queue display (Ghana Card truncated)
- Audit logging for queue actions (future enhancement)

---

**Document References:**
- **Primary Guide**: `docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md` (100+ pages with all code)
- **UgandaEMR Research**: `docs/UGANDA_EMR_REFERENCE.md`
- **White-Label Strategy**: `docs/product/WHITE_LABEL_ARCHITECTURE.md`

**Support:**
- Slack: #medreg-development
- Email: dev@medreg.com.gh
- GitHub Issues: https://github.com/medreg/medreg-emr/issues

---

**Task Created By**: AI Analysis (Claude Code)
**Status**: Ready for Implementation
**Priority**: CRITICAL
**Est. Completion**: Sprint 14-16 (Week 14-16)

---


## How to Add New Tasks

When adding new tasks, use this template:

```markdown
## [QUEUED] Task N: [Task Title] ([Priority: HIGH/MEDIUM/LOW])

**Created:** YYYY-MM-DD HH:MM UTC
**Priority:** [HIGH/MEDIUM/LOW]
**Estimated Time:** X-Y hours
**Dependencies:** [List dependencies]
**Status:** [QUEUED] QUEUED

### Context & Background
[Provide context about what needs to be done and why]

### Self-Contained Execution Instructions

**READ THESE FILES FIRST (Required Context):**
- [List files to read for context]

### STEP 1: [Step Title]
[Detailed instructions]

**Verification:**
```bash
# Commands to verify this step
```

### STEP 2: [Next Step]
[Continue with all steps...]

### Expected Deliverables
[List what should be created/modified]

### Success Criteria
[List acceptance criteria]

### Perfect Handshake (CRITICAL)
**BEFORE completing this task:**
- [ ] Check if this is part of a larger sequence
- [ ] If YES: Add next logical task to PROMPT_QUEUE.md with full context
- [ ] Include: What THIS task did, what NEXT task needs, all dependencies
- [ ] This ensures NO WORK IS LOST between sessions

---
```

**Next Worker Command (Copy & Paste when task added):**
```
Refer to PROMPT_QUEUE.md pending task and complete it. Follow AGENTS.md rules, update IMPLEMENTATION_TRACKER.md when done.
```



<!-- Queue empty -->
