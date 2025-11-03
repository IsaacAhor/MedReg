# White-Label Multi-Tenant Architecture - MedReg EMR

**Last Updated:** November 2, 2025  
**Version:** MVP v1.0  
**Purpose:** Enable MedReg deployment as white-labeled solution for multiple facilities with complete sovereignty

---

## Executive Summary

MedReg is designed from Day 1 as a **white-label, multi-tenant EMR platform** where:

1. **End users (doctors, nurses, patients) NEVER see "OpenMRS"** - They see only MedReg branding
2. **Facility admins manage their facility independently** - User management, reports, NHIE monitoring (100% MedReg UI)
3. **Platform admins oversee multiple facilities** - Cross-facility analytics, system configuration, branding
4. **Each facility operates in isolation** - Data privacy via row-level security, no cross-facility leaks

**Strategic Value:**
- **For Ghana MoH:** MedReg appears as Ghana's sovereign EMR (not "OpenMRS installation")
- **For Private Hospitals:** Can deploy as "MyHospital EMR" with custom branding
- **For MedReg Business:** Single codebase serves 100+ facilities (scalable SaaS model)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  END USER LAYER (100% MedReg Branding)                         │
├─────────────────────────────────────────────────────────────────┤
│  Doctor/Nurse/Pharmacist -> Next.js UI (localhost:3000)         │
│  - Patient Registration, OPD Workflow, Reports                  │
│  - Zero OpenMRS visibility                                      │
├─────────────────────────────────────────────────────────────────┤
│  ADMIN LAYER (Facility-Specific)                               │
├─────────────────────────────────────────────────────────────────┤
│  Facility Admin -> Admin Dashboard (/admin)                     │
│  - User Management (create doctors/nurses)                      │
│  - System Reports (OPD register, NHIS vs Cash, revenue)        │
│  - NHIE Sync Monitor (pending/failed transactions)             │
│  - Facility Settings (region code, NHIE mode)                  │
│  - Audit Logs (who did what, when)                             │
│  - 100% MedReg branding (no OpenMRS references)                │
├─────────────────────────────────────────────────────────────────┤
│  PLATFORM LAYER (Multi-Facility Oversight)                     │
├─────────────────────────────────────────────────────────────────┤
│  Platform Admin -> Multi-Facility Dashboard                     │
│  - Switch between facilities (dropdown)                         │
│  - Cross-facility analytics (total patients, encounters)       │
│  - System configuration (NHIE endpoints, global settings)      │
│  - Branding management (logos, colors per facility - v2)       │
├─────────────────────────────────────────────────────────────────┤
│  BACKEND LAYER (OpenMRS Platform 2.6.0 - Invisible)           │
├─────────────────────────────────────────────────────────────────┤
│  OpenMRS REST API (localhost:8080/openmrs/ws/rest/v1)         │
│  - Pure backend (no UI - by design since v2.0)                 │
│  - Never exposed to browser (Next.js BFF proxies all calls)    │
│  - Optional OpenMRS admin panel for IT staff only              │
│    (http://localhost:8080/openmrs/admin - rare advanced tasks) │
├─────────────────────────────────────────────────────────────────┤
│  DATABASE LAYER (MySQL 5.7 - Multi-Tenant Isolation)          │
├─────────────────────────────────────────────────────────────────┤
│  Row-Level Security:                                            │
│  - All queries auto-filter by facility_id (except Platform Admin)│
│  - patient table: facility_id column                            │
│  - encounter table: joins patient.facility_id                   │
│  - NHIE transaction log: facility_code column                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Two Admin Types (CRITICAL FOR WHITE-LABEL)

### 1. Platform Admin (Super Admin)

**Who:** MedReg company administrators, system integrators, MoH IT staff (for national deployment)

**Scope:** All facilities (can switch between facilities)

**Use Cases:**
- **Scenario 1:** MedReg deploys at 10 hospitals -> 1 Platform Admin manages all 10
- **Scenario 2:** MoH national rollout -> MoH IT staff (Platform Admin) oversees all 200+ facilities
- **Scenario 3:** System integrator troubleshoots issue across facilities

**Access:**
- [DONE] Multi-facility dashboard (switch facilities via dropdown)
- [DONE] Cross-facility analytics (total patients across all facilities, national stats)
- [DONE] System configuration (NHIE production endpoint, OAuth credentials, global settings)
- [DONE] Branding management (future v2: upload logo per facility, set primary colors)
- [DONE] Create Facility Admin accounts (onboard new facilities)
- [DONE] View audit logs across all facilities (for compliance monitoring)

**What They See:**
- Header: "MedReg Platform Admin | Facility: [Dropdown: Korle Bu | KATH | Tamale | All]"
- Dashboard: Aggregated KPIs (5,000 patients, 15,000 encounters, 98% NHIE sync rate across all facilities)
- Map view: Ghana map with facility markers (future v2)

**What They DON'T See:**
- [FAILED] OpenMRS branding (unless accessing OpenMRS admin panel for deep troubleshooting - rare)
- [FAILED] Other facilities' clinical data when viewing single facility (privacy enforced)

---

### 2. Facility Admin (Per-Facility Admin)

**Who:** Hospital IT managers, medical directors, operations managers, facility administrators

**Scope:** Single assigned facility only

**Use Cases:**
- **Scenario 1:** KBTH IT manager creates doctor accounts, monitors NHIE sync, generates weekly reports
- **Scenario 2:** Private hospital administrator manages facility settings, views revenue reports
- **Scenario 3:** Regional hospital director reviews OPD register, checks NHIS vs Cash ratio

**Access:**
- [DONE] Facility-specific admin dashboard (KPIs for their facility only)
- [DONE] User management (create/disable Doctor, Nurse, Pharmacist, Records Officer, Cashier, NHIS Officer)
- [DONE] System reports (OPD register, NHIS vs Cash, top diagnoses, revenue)
- [DONE] NHIE sync monitor (pending/failed transactions for their facility)
- [DONE] Facility settings (region code, contact info, NHIE mode: mock/sandbox/production)
- [DONE] Audit logs (who registered which patient, who created which encounter)

**What They See:**
- Header: "MedReg Admin Dashboard | Facility: Korle Bu Teaching Hospital"
- Dashboard: Facility-specific KPIs (250 patients, 1,200 encounters, 99% NHIE sync rate)
- No cross-facility data (privacy enforced at database level)

**What They DON'T See:**
- [FAILED] OpenMRS branding (100% MedReg admin UI)
- [FAILED] Other facilities' data (database queries filtered by facility_id)
- [FAILED] System-wide configuration (NHIE production endpoints, OAuth secrets)

---

## Role Comparison Matrix

| Feature | Platform Admin | Facility Admin | Clinical Users |
|---------|----------------|----------------|----------------|
| **Branding Visibility** |
| See "MedReg" branding | [DONE] Yes | [DONE] Yes | [DONE] Yes |
| See "OpenMRS" branding | [WARNING] Optional (admin panel) | [WARNING] Optional (rare) | [FAILED] Never |
| **Data Access** |
| Multi-facility access | [DONE] All facilities | [FAILED] Single facility | [FAILED] Single facility |
| Switch facilities | [DONE] Dropdown | [FAILED] | [FAILED] |
| View cross-facility analytics | [DONE] Yes | [FAILED] | [FAILED] |
| **User Management** |
| Create Facility Admins | [DONE] Yes | [FAILED] | [FAILED] |
| Create clinical users | [DONE] All facilities | [DONE] Own facility | [FAILED] |
| Disable users | [DONE] All facilities | [DONE] Own facility | [FAILED] |
| **System Configuration** |
| NHIE production endpoint | [DONE] Yes | [FAILED] | [FAILED] |
| OAuth credentials | [DONE] Yes | [FAILED] | [FAILED] |
| Branding (logo, colors) | [DONE] Yes (v2) | [FAILED] | [FAILED] |
| Facility settings | [DONE] All facilities | [DONE] Own facility | [FAILED] |
| **Monitoring** |
| NHIE sync monitor | [DONE] All facilities | [DONE] Own facility | [FAILED] |
| Audit logs | [DONE] All facilities | [DONE] Own facility | [FAILED] |
| System health | [DONE] All facilities | [DONE] Own facility | [FAILED] |
| **Reports** |
| OPD register | [DONE] All facilities | [DONE] Own facility | [WARNING] View-only (doctors) |
| NHIS vs Cash | [DONE] All facilities | [DONE] Own facility | [FAILED] |
| Revenue reports | [DONE] All facilities | [DONE] Own facility | [FAILED] |

---

## Database Multi-Tenant Isolation

### Row-Level Security (Facility Scope)

**Problem:** Multiple facilities share same database - must prevent cross-facility data leaks

**Solution:** Auto-filter all queries by `facility_id` for non-Platform Admin users

#### Patient Table
```sql
-- Add facility_id column (Liquibase migration)
ALTER TABLE patient ADD COLUMN facility_id INT NOT NULL;
ALTER TABLE patient ADD CONSTRAINT fk_patient_facility 
  FOREIGN KEY (facility_id) REFERENCES location(location_id);

-- Queries auto-filtered by facility_id
-- Non-Platform Admin users:
SELECT * FROM patient WHERE facility_id = :current_user_facility_id;

-- Platform Admin users:
SELECT * FROM patient; -- No filter (can see all facilities)
```

#### Encounter Table
```sql
-- Encounters inherit facility from patient
SELECT e.* FROM encounter e
JOIN patient p ON e.patient_id = p.patient_id
WHERE p.facility_id = :current_user_facility_id;
```

#### NHIE Transaction Log
```sql
-- Add facility_code for multi-facility deployment tracking
ALTER TABLE ghanaemr_nhie_transaction_log 
  ADD COLUMN facility_code VARCHAR(10);

-- Query filtered by facility
SELECT * FROM ghanaemr_nhie_transaction_log
WHERE facility_code = :current_user_facility_code;

-- Platform Admin: View all facilities' NHIE transactions
SELECT facility_code, COUNT(*) as total_transactions, 
       SUM(CASE WHEN status='SUCCESS' THEN 1 ELSE 0 END) as success_count
FROM ghanaemr_nhie_transaction_log
GROUP BY facility_code;
```

---

## Frontend Implementation

### Admin Dashboard Routes

```typescript
// src/app/admin/layout.tsx
import { requireAuth, requireRole } from '@/lib/auth';

export default async function AdminLayout({ children }) {
  await requireAuth();
  await requireRole(['Platform Admin', 'Facility Admin']); // Only admins
  
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

**Admin Routes:**
- `/admin/dashboard` - System KPIs, quick links
- `/admin/users` - User management (create/disable, assign roles)
- `/admin/nhie-sync` - NHIE sync monitor (pending/failed transactions, retry)
- `/admin/settings` - Facility settings (region code, NHIE mode, contact info)
- `/admin/audit-log` - Audit trail (who did what, when, PII masked)
- `/admin/reports/opd-register` - OPD register with filters
- `/admin/reports/nhis-vs-cash` - NHIS vs Cash summary
- `/admin/reports/revenue` - Revenue breakdown

### Platform Admin: Facility Switcher

```typescript
// src/components/admin/FacilitySwitcher.tsx
'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export function FacilitySwitcher() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: getCurrentUser });
  const { data: facilities } = useQuery({ 
    queryKey: ['facilities'], 
    queryFn: getAllFacilities,
    enabled: user?.role === 'Platform Admin' // Only Platform Admin sees dropdown
  });

  const switchFacility = useMutation({
    mutationFn: (facilityId: number) => 
      axios.post('/api/v1/admin/switch-facility', { facilityId }),
    onSuccess: () => {
      // Refresh dashboard data
      queryClient.invalidateQueries({ queryKey: ['stats', 'patients', 'encounters'] });
    },
  });

  if (user?.role !== 'Platform Admin') {
    // Facility Admin + clinical users see static facility name
    return <span className="font-semibold">{user?.facility.name}</span>;
  }

  return (
    <Select value={user.currentFacilityId} onValueChange={switchFacility.mutate}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select Facility" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Facilities (Aggregate)</SelectItem>
        {facilities?.map(f => (
          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## Backend Implementation

### Facility Scope Enforcement

```java
// backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/util/FacilityScopeUtil.java
public class FacilityScopeUtil {
    
    /**
     * Check if user can access given facility
     * @param facilityId Facility to access
     * @return true if Platform Admin OR user's assigned facility matches
     */
    public static boolean canAccessFacility(Integer facilityId) {
        User user = Context.getAuthenticatedUser();
        
        // Platform Admin: Access all facilities
        if (user.hasRole("Platform Admin")) {
            return true;
        }
        
        // Other users: Only their assigned facility
        Location userFacility = user.getUserProperty("facility");
        return userFacility != null && userFacility.getId().equals(facilityId);
    }
    
    /**
     * Apply facility filter to patient query
     * @param criteria Hibernate criteria
     */
    public static void applyFacilityFilter(Criteria criteria) {
        User user = Context.getAuthenticatedUser();
        
        // Platform Admin: No filter (see all)
        if (user.hasRole("Platform Admin")) {
            return;
        }
        
        // Other users: Filter by facility_id
        Location userFacility = user.getUserProperty("facility");
        if (userFacility != null) {
            criteria.add(Restrictions.eq("facility", userFacility));
        }
    }
}
```

### Privilege Checks

```java
// backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/impl/GhanaPatientServiceImpl.java
@Service
@Transactional
public class GhanaPatientServiceImpl implements GhanaPatientService {
    
    @Override
    @PreAuthorize("hasPrivilege('Register Patients')")
    public Patient registerPatient(GhanaPatientDTO dto) {
        // Check facility scope (prevent registering patient at different facility)
        if (!FacilityScopeUtil.canAccessFacility(dto.getFacilityId())) {
            throw new UnauthorizedException("Cannot register patient for different facility");
        }
        
        // Registration logic...
    }
    
    @Override
    @PreAuthorize("hasPrivilege('View Patients')")
    public List<Patient> searchPatients(String query, Integer page, Integer size) {
        Criteria criteria = sessionFactory.getCurrentSession()
            .createCriteria(Patient.class);
        
        // Apply facility filter (auto-filter by user's facility)
        FacilityScopeUtil.applyFacilityFilter(criteria);
        
        // Search logic...
    }
}
```

---

## Demo Day Strategy

### Scenario 1: Clinical Workflow Demo (Doctor Role)

**Stakeholder:** MoH Clinical Director  
**Role:** Doctor

**Demo Flow:**
1. Login as Dr. Kwame Mensah (Doctor role, KBTH)
2. Register patient: Ama Asante (Ghana Card, NHIS active)
3. Triage: Capture vitals (BP 120/80, Temp 37.2DEGC)
4. Consultation: Diagnose Malaria (B54), prescribe Artemether-Lumefantrine
5. Pharmacy: Dispense drugs
6. Billing: Generate receipt (NHIS covered)

**What They See:** 100% MedReg branding, clean healthcare UI, zero OpenMRS references

---

### Scenario 2: Admin Dashboard Demo (Facility Admin Role)

**Stakeholder:** Hospital IT Manager  
**Role:** Facility Admin

**Demo Flow:**
1. Login as Joseph Osei (Facility Admin, KBTH)
2. Admin Dashboard: Show KPIs (250 patients today, 1,200 encounters, GH₵ 45,000 revenue)
3. NHIE Sync Monitor: Show 98% success rate, 2 pending transactions
4. Click "Retry Now" on failed transaction -> Status changes to SUCCESS
5. User Management: Create new doctor account (Dr. Akua Owusu)
6. Audit Log: Show "Joseph Osei registered patient Ama Asante at 9:30 AM" (Ghana Card masked)

**What They See:** MedReg admin dashboard, real-time monitoring, zero OpenMRS branding

---

### Scenario 3: Multi-Facility Demo (Platform Admin Role - Optional)

**Stakeholder:** MoH CTO / MedReg CEO  
**Role:** Platform Admin

**Demo Flow:**
1. Login as Platform Admin
2. Header dropdown: Switch between KBTH, KATH, Tamale Teaching Hospital
3. Cross-facility dashboard: 5,000 patients, 15,000 encounters across 3 facilities
4. NHIE Sync Monitor: 48 pending across all facilities
5. Facility-specific drill-down: Click "KBTH" -> See KBTH-specific KPIs

**What They See:** Multi-facility oversight, aggregated analytics, facility switcher

---

## White-Label Benefits

### For Ghana MoH:
- [DONE] **Sovereignty:** MedReg appears as "Ghana's EMR", not "OpenMRS installation"
- [DONE] **No Vendor Lock-In:** Open-source foundation (can hire any OpenMRS developer)
- [DONE] **National Scale:** Single platform for 200+ facilities (not 200 separate installations)
- [DONE] **Audit Trail:** Platform Admin (MoH IT) oversees all facilities, compliance monitoring

### For Private Hospitals:
- [DONE] **Custom Branding:** Can deploy as "MyHospital EMR" (logo, colors)
- [DONE] **Independence:** Manage own facility without MedReg company involvement
- [DONE] **Cost-Effective:** Share infrastructure (SaaS model) but isolated data

### For MedReg Business:
- [DONE] **Scalability:** Single codebase serves 100+ facilities (economies of scale)
- [DONE] **SaaS Revenue:** Subscription model ($200-300/month per facility)
- [DONE] **Market Positioning:** "National EMR platform" (not just "another hospital software")

---

## Security & Compliance

### Data Isolation
- [DONE] Row-level security (database auto-filters by facility_id)
- [DONE] Backend privilege checks (Context.hasPrivilege)
- [DONE] Frontend role-based UI hiding (UX only, not security)
- [DONE] Audit logging (all admin operations logged with PII masked)

### PII Protection
- [DONE] Ghana Card masked in logs: `GHA-1234****-*`
- [DONE] NHIS masked in logs: `0123******`
- [DONE] Names masked in logs: `K***e M****h`
- [DONE] Phone masked in logs: `+233244***456`

### Session Security
- [DONE] Session timeout: 30 minutes inactivity
- [DONE] Password policy: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
- [DONE] OpenMRS session-based auth (server-side credentials, no tokens in browser)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2, 2025 | Initial white-label architecture documentation with 2 admin types, multi-tenant isolation, demo strategy |

---

## Next Steps

**Week 14 (November 21-28, 2025):**
- [ ] Implement Platform Admin + Facility Admin roles (backend metadata)
- [ ] Build Admin Dashboard UI (KPI cards, quick links)
- [ ] Build NHIE Sync Monitor UI (pending/failed transactions, retry button)

**Week 15-16 (December 5-19, 2025):**
- [ ] Build User Management UI (create/disable users, assign roles)
- [ ] Build Facility Settings UI (region code, NHIE mode, contact info)
- [ ] Build Audit Log Viewer (PII masked, date range filter)
- [ ] RBAC enforcement testing (verify role checks on backend + frontend)

**Demo Day (Week 16, December 19, 2025):**
- [ ] Demonstrate clinical workflow (Doctor role)
- [ ] Demonstrate admin dashboard (Facility Admin role)
- [ ] Demonstrate multi-facility oversight (Platform Admin role - optional)
- [ ] Prove 100% white-label (zero OpenMRS branding visible to end users)
