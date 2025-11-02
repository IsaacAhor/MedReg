# Privileges Matrix - MedReg EMR

**Last Updated:** November 2, 2025  
**Version:** MVP v1.0 (White-Label Multi-Tenant Architecture)

---

## Overview

MedReg implements Role-Based Access Control (RBAC) with **8 distinct roles** designed for white-label, multi-tenant deployment. This matrix defines privileges for each role across the EMR system.

---

## User Roles (8 Total)

### Administrative Roles (2)

#### 1. Platform Admin (Super Admin)
**Purpose:** Multi-facility oversight, system configuration, cross-facility analytics, branding management

**Use Case:** MedReg platform administrators managing multiple hospitals/clinics

**Scope:** All facilities (can switch between facilities via dropdown)

**Key Privileges:**
- Multi-facility access (view/manage all facilities)
- System configuration (NHIE endpoints, global settings, branding)
- Cross-facility analytics and reporting
- Create Facility Admin accounts for new facilities
- View audit logs across all facilities

---

#### 2. Facility Admin
**Purpose:** Per-facility operations management, user management, reports, NHIE monitoring

**Use Case:** Hospital IT managers, medical directors, facility administrators

**Scope:** Single assigned facility only

**Key Privileges:**
- User management (create/disable Doctor, Nurse, Pharmacist, Records, Cashier, NHIS Officer accounts)
- View admin dashboard (KPIs, system health)
- NHIE sync monitoring (pending/failed transactions, retry)
- Facility settings (region code, contact info, NHIE mode)
- View audit logs (facility-specific)
- Generate reports (OPD register, NHIS vs Cash, revenue)

---

### Clinical Roles (6)

#### 3. Doctor
**Purpose:** Patient consultation, diagnosis, prescription

**Scope:** Single facility

**Key Privileges:**
- View patients (read demographics, medical history)
- Create encounters (consultation notes)
- Record diagnoses (ICD-10 codes)
- Prescribe medications
- Order lab tests
- View reports (clinical statistics)
- NHIS eligibility check (verify patient coverage)

---

#### 4. Nurse
**Purpose:** Triage, vitals capture, patient care

**Scope:** Single facility

**Key Privileges:**
- View patients
- Create triage encounters (vitals only)
- Record vital signs (BP, temperature, weight, height, pulse, RR)
- View encounters (read-only access to consultation notes)
- NHIS eligibility check

---

#### 5. Pharmacist
**Purpose:** Medication dispensing, inventory management

**Scope:** Single facility

**Key Privileges:**
- View patients
- View prescriptions (from doctors)
- Dispense medications (mark as dispensed, record quantity)
- View encounters (limited: diagnosis + prescriptions only)

---

#### 6. Records Officer
**Purpose:** Patient registration, records management

**Scope:** Single facility

**Key Privileges:**
- Register patients (Ghana Card, NHIS, demographics)
- Search patients (by Ghana Card, NHIS, name, folder number)
- Edit patient demographics (correct errors)
- Print records (folder labels, patient summaries)
- NHIS eligibility check
- View patients

---

#### 7. Cashier
**Purpose:** Billing, payment collection, receipts

**Scope:** Single facility

**Key Privileges:**
- View encounters (for billing purposes)
- Create bills (service charges, drug charges)
- Record payments (cash, mobile money)
- Generate receipts (printable)
- View revenue reports (daily/weekly/monthly)
- View patients (basic demographics for billing)

---

#### 8. NHIS Officer (Optional)
**Purpose:** NHIS-specific operations (eligibility, claims)

**Scope:** Single facility

**Key Privileges:**
- Register patients (NHIS enrollment)
- NHIS eligibility check (verify active coverage)
- NHIS claims export (monthly batch generation)
- NHIS-specific reports (NHIS vs Cash, claims pending)
- Edit patient demographics (NHIS number updates)
- View patients

**Note:** This role can be combined with Records Officer in smaller facilities

---

## Privilege Matrix

| Privilege | Platform Admin | Facility Admin | Doctor | Nurse | Pharmacist | Records | Cashier | NHIS Officer |
|-----------|----------------|----------------|--------|-------|------------|---------|---------|--------------|
| **System & Multi-Facility** |
| Multi-facility access | ✅ All | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System configuration | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Branding management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cross-facility analytics | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User Management** |
| Manage users | ✅ | ✅ Facility | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View admin dashboard | ✅ | ✅ | ⚠️ Reports | ❌ | ❌ | ❌ | ❌ | ⚠️ NHIS |
| NHIE sync monitor | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Facility settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit logs | ✅ All | ✅ Facility | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Patient Registration** |
| Register patients | ✅ | ✅ | ⚠️ Emergency | ⚠️ Emergency | ❌ | ✅ | ❌ | ✅ |
| View patients | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit demographics | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Search patients | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Print records | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Clinical Workflows** |
| Create encounters | ✅ | ✅ | ✅ | ⚠️ Triage | ❌ | ❌ | ❌ | ❌ |
| View encounters | ✅ | ✅ | ✅ | ✅ | ⚠️ Limited | ✅ | ✅ | ✅ |
| Record vitals | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Record diagnosis | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Prescribe drugs | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Order lab tests | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pharmacy** |
| View prescriptions | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Dispense drugs | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Billing** |
| Create bills | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Record payments | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Generate receipts | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View revenue reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **NHIS** |
| Eligibility check | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Claims export | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| NHIS reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Reports** |
| OPD register | ✅ | ✅ | ✅ | ⚠️ View | ❌ | ❌ | ❌ | ✅ |
| NHIS vs Cash | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Top diagnoses | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Revenue summary | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

**Legend:**
- ✅ **Full access** - Can perform operation without restrictions
- ⚠️ **Partial access** - Limited access with conditions (see notes)
- ❌ **No access** - Cannot perform operation

---

## Implementation

### Backend (OpenMRS)

**Privilege Names:**
```java
// System & Multi-Facility
public static final String PRIV_MANAGE_FACILITIES = "Manage Facilities";
public static final String PRIV_SYSTEM_CONFIGURATION = "System Configuration";
public static final String PRIV_VIEW_ALL_FACILITIES = "View All Facilities";

// User Management
public static final String PRIV_MANAGE_USERS = "Manage Users";
public static final String PRIV_VIEW_ADMIN_DASHBOARD = "View Admin Dashboard";
public static final String PRIV_MONITOR_NHIE_SYNC = "Monitor NHIE Sync";
public static final String PRIV_MANAGE_FACILITY_SETTINGS = "Manage Facility Settings";
public static final String PRIV_VIEW_AUDIT_LOGS = "View Audit Logs";

// Patient Registration
public static final String PRIV_REGISTER_PATIENTS = "Register Patients";
public static final String PRIV_VIEW_PATIENTS = "View Patients";
public static final String PRIV_EDIT_PATIENT_DEMOGRAPHICS = "Edit Patient Demographics";
public static final String PRIV_SEARCH_PATIENTS = "Search Patients";
public static final String PRIV_PRINT_RECORDS = "Print Records";

// Clinical Workflows
public static final String PRIV_CREATE_ENCOUNTERS = "Create Encounters";
public static final String PRIV_VIEW_ENCOUNTERS = "View Encounters";
public static final String PRIV_RECORD_VITALS = "Record Vitals";
public static final String PRIV_RECORD_DIAGNOSIS = "Record Diagnosis";
public static final String PRIV_PRESCRIBE_DRUGS = "Prescribe Drugs";
public static final String PRIV_ORDER_LAB_TESTS = "Order Lab Tests";

// Pharmacy
public static final String PRIV_VIEW_PRESCRIPTIONS = "View Prescriptions";
public static final String PRIV_DISPENSE_DRUGS = "Dispense Drugs";

// Billing
public static final String PRIV_CREATE_BILLS = "Create Bills";
public static final String PRIV_RECORD_PAYMENTS = "Record Payments";
public static final String PRIV_GENERATE_RECEIPTS = "Generate Receipts";
public static final String PRIV_VIEW_REVENUE_REPORTS = "View Revenue Reports";

// NHIS
public static final String PRIV_CHECK_NHIS_ELIGIBILITY = "Check NHIS Eligibility";
public static final String PRIV_EXPORT_NHIS_CLAIMS = "Export NHIS Claims";
public static final String PRIV_VIEW_NHIS_REPORTS = "View NHIS Reports";

// Reports
public static final String PRIV_VIEW_OPD_REGISTER = "View OPD Register";
public static final String PRIV_VIEW_NHIS_CASH_REPORT = "View NHIS vs Cash Report";
public static final String PRIV_VIEW_DIAGNOSIS_REPORT = "View Diagnosis Report";
```

**Role Configuration:**
```java
// Create roles with privileges
Role platformAdmin = new Role();
platformAdmin.setRole("Platform Admin");
platformAdmin.setDescription("Super admin with multi-facility oversight");
platformAdmin.addPrivilege(allPrivileges); // All privileges

Role facilityAdmin = new Role();
facilityAdmin.setRole("Facility Admin");
facilityAdmin.setDescription("Per-facility administrator");
facilityAdmin.addPrivilege("Manage Users");
facilityAdmin.addPrivilege("View Admin Dashboard");
facilityAdmin.addPrivilege("Monitor NHIE Sync");
// ... (full list in GhanaMetadataInitializer.java)
```

**Privilege Check:**
```java
@PreAuthorize("hasPrivilege('Register Patients')")
public Patient registerPatient(GhanaPatientDTO dto) {
    // Check facility scope for non-Platform Admin users
    if (!Context.hasPrivilege("View All Facilities")) {
        if (!dto.getFacilityId().equals(Context.getAuthenticatedUser().getFacility().getId())) {
            throw new UnauthorizedException("Cannot register patient for different facility");
        }
    }
    // Registration logic...
}
```

---

### Frontend (Next.js)

**Role-Based UI Rendering:**
```tsx
// Show admin dashboard link only for Platform Admin + Facility Admin
{(user.role === 'Platform Admin' || user.role === 'Facility Admin') && (
  <Link href="/admin/dashboard">
    <Button>Admin Dashboard</Button>
  </Link>
)}

// Show NHIE sync monitor only for admins
{hasPrivilege(user, 'Monitor NHIE Sync') && (
  <Link href="/admin/nhie-sync">
    <Badge>NHIE Sync Status</Badge>
  </Link>
)}

// Show register patient button for Records Officer + NHIS Officer + admins
{hasPrivilege(user, 'Register Patients') && (
  <Link href="/patients/register">
    <Button>Register Patient</Button>
  </Link>
)}
```

**Facility Scope Enforcement:**
```tsx
// Platform Admin sees facility dropdown
{user.role === 'Platform Admin' && (
  <Select value={currentFacility} onValueChange={switchFacility}>
    <SelectTrigger>
      <SelectValue placeholder="Select Facility" />
    </SelectTrigger>
    <SelectContent>
      {facilities.map(f => (
        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
)}

// Facility Admin + clinical users see static facility name
{user.role !== 'Platform Admin' && (
  <span className="font-semibold">{user.facility.name}</span>
)}
```

---

## White-Label Multi-Tenant Architecture

### Facility Isolation

**Database Row-Level Security:**
```sql
-- All queries auto-filter by facility_id for non-Platform Admin users
SELECT * FROM patient WHERE facility_id = :current_user_facility_id;
SELECT * FROM encounter WHERE patient_id IN (
  SELECT patient_id FROM patient WHERE facility_id = :current_user_facility_id
);
```

**Facility Switching (Platform Admin Only):**
```java
@PostMapping("/api/v1/admin/switch-facility")
@PreAuthorize("hasRole('Platform Admin')")
public ResponseEntity<?> switchFacility(@RequestParam Integer facilityId) {
    User user = Context.getAuthenticatedUser();
    Location facility = Context.getLocationService().getLocation(facilityId);
    
    // Store in session
    Context.getUserContext().setLocation(facility);
    
    return ResponseEntity.ok(Map.of("facility", facility.getName()));
}
```

---

## Demo Day Strategy

### What MoH Stakeholders See

**Clinical Director (Doctor role):**
- Sees: OPD workflow, patient records, reports
- Does NOT see: Admin dashboard, NHIE sync monitor, user management

**Finance Officer (Cashier role):**
- Sees: Billing, revenue reports, NHIS vs Cash summary
- Does NOT see: Admin dashboard, clinical notes, prescriptions

**IT Manager (Facility Admin role):**
- Sees: Admin dashboard with real-time KPIs, NHIE sync monitor, user management
- Can: Create doctor/nurse accounts, retry failed NHIE transactions, view audit logs
- Cannot: Access other facilities (if multi-facility deployment)

**MoH Official (Platform Admin role - for demo only):**
- Sees: Everything across all facilities (if multi-facility demo)
- Can: Switch between facilities, view cross-facility analytics, configure system

---

## Security Notes

1. **Privilege checks are ALWAYS enforced on backend** (frontend UI hiding is UX only, not security)
2. **Facility scope is checked for ALL operations** (except Platform Admin)
3. **Audit logs record ALL privilege-checked operations** (who, what, when, result)
4. **PII is masked in logs** (Ghana Card: `GHA-1234****-*`, NHIS: `0123****`)
5. **Session timeout: 30 minutes inactivity**
6. **Password policy: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char**

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2, 2025 | Initial comprehensive privileges matrix with 8 roles, white-label multi-tenant architecture |
