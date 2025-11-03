# Location-Based Login Implementation Guide

## Overview
Location-based login ensures that each user session is tied to a specific physical work location (service point) within the facility. This is critical for queue management, patient flow tracking, and location-specific reporting.

## Why Location-Based Login?

### Benefits
1. **Accurate Queue Management**: System knows exactly which room a patient is in
2. **Better Patient Flow**: Clear tracking from Registration → Triage → Consultation → Pharmacy
3. **Location-Specific Reports**: "How many patients did Reception process today?"
4. **Multi-User Coordination**: Multiple staff in different rooms without confusion
5. **Audit Trails**: "Patient registered by Records Officer at Reception at 9:30 AM"

### OPD Workflow Example
```
Patient arrives
    ↓
1. RECEPTION (Records Officer) → Patient added to "Reception Queue"
    ↓
2. TRIAGE (Nurse) → Patient moved to "Triage Queue", vitals recorded
    ↓
3. CONSULTATION (Doctor) → Patient moved to "OPD Room 1 Queue", diagnosis + prescription
    ↓
4. PHARMACY (Pharmacist) → Patient moved to "Pharmacy Queue", drugs dispensed
    ↓
5. CASHIER (Cashier) → Patient moved to "Cashier Queue", payment + receipt
```

## Implementation Components

### 1. Frontend Components

#### LocationSelector (`frontend/src/components/auth/location-selector.tsx`)
- Fetches locations from OpenMRS REST API with `Login Location` tag
- Auto-selects if only one location available
- Shows parent location for context (e.g., "Reception" under "Outpatient Department")
- Handles loading states and errors gracefully
- Provides fallback default locations if API fails

#### Enhanced LoginForm (`frontend/src/components/auth/login-form.tsx`)
- Adds `locationUuid` to form schema (required field)
- Integrates LocationSelector component
- Validates location selection before submission
- Shows clear error if location not selected

### 2. Backend Authentication Flow

#### Login Route (`frontend/src/app/api/auth/login/route.ts`)
Enhanced to:
1. Accept `locationUuid` in login payload
2. Authenticate with OpenMRS REST API (Basic Auth)
3. Fetch location details from `/location/{uuid}?v=full`
4. Fetch provider for logged-in user from `/provider?user={uuid}`
5. Store in cookies:
   - `omrsAuth=1` (authenticated flag)
   - `omrsSessionId={JSESSIONID}` (OpenMRS session)
   - `omrsUser={username}` (username)
   - `omrsLocation={locationUuid}` (selected location)
   - `omrsProvider={providerUuid}` (user's provider record)

#### Session Route (`frontend/src/app/api/auth/session/route.ts`)
Returns enhanced session data:
```json
{
  "authenticated": true,
  "user": { "username": "nurse_ama" },
  "sessionLocation": { "uuid": "triage-001" },
  "currentProvider": { "uuid": "provider-uuid" }
}
```

### 3. Location Metadata Setup

#### Location Tags
- **Login Location**: User can select this location at login
- **Queue Room**: Patients can be queued here
- **Visit Location**: Patient visits can occur here
- **Main Pharmacy**: Main pharmacy for drug dispensing

#### Default Locations
1. **Ghana EMR Facility** (Parent)
2. **Reception** (Login, Queue, Visit)
3. **Triage** (Login, Queue, Visit)
4. **OPD Room 1** (Login, Queue, Visit)
5. **OPD Room 2** (Login, Queue, Visit)
6. **Pharmacy** (Login, Queue, Visit, Main Pharmacy)
7. **Cashier** (Login, Queue, Visit)
8. **Laboratory** (Login, Visit)

## Setup Instructions

### Option 1: PowerShell Script (Recommended)
```powershell
cd c:\temp\AI\MedReg
.\scripts\setup-locations.ps1
```

### Option 2: SQL Script (Manual)
```bash
mysql -u root -p openmrs < scripts/setup-locations.sql
```

### Option 3: OpenMRS Initializer Module
1. Copy metadata files to OpenMRS application data directory:
   ```
   {OPENMRS_DATA_DIR}/configuration/
   ```
2. Restart OpenMRS server
3. Initializer module auto-imports CSV files

## Verification

### 1. Check Location Tags
```bash
curl -u admin:Admin123 http://localhost:8080/openmrs/ws/rest/v1/locationtag?v=full
```

Expected response includes:
- Login Location
- Queue Room
- Visit Location
- Main Pharmacy

### 2. Check Login Locations
```bash
curl -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/location?tag=Login Location&v=default"
```

Expected: 7 locations (Reception, Triage, OPD Room 1, OPD Room 2, Pharmacy, Cashier, Laboratory)

### 3. Test Login Flow
1. Navigate to http://localhost:3000/login
2. Enter credentials (admin / Admin123)
3. **Location dropdown should appear** with 7 locations
4. Select "Reception"
5. Click "Sign In"
6. Check browser cookies: `omrsLocation` should be set to location UUID

## Usage in Application Code

### Frontend (Next.js)
```tsx
import { useSession } from '@/hooks/useAuth';

export function QueueList() {
  const { data: session } = useSession();
  
  // Filter queue by current user's location
  const { data: patients } = usePatientQueue({
    location: session?.sessionLocation?.uuid,
    status: 'pending'
  });
  
  return <Table data={patients} />;
}
```

### Backend (OpenMRS Module)
```java
// Get session location from context
Location sessionLocation = Context.getUserContext().getLocation();

// Filter patients by location
List<PatientQueue> queue = patientQueueService.getQueueByLocation(
    sessionLocation.getUuid(), 
    QueueStatus.PENDING
);
```

## Customization for Production

### Facility-Specific Locations
Each Ghana facility should customize locations to match their physical layout:

**Example: District Hospital**
```
Main Hospital Building
├── OPD Block
│   ├── Reception
│   ├── Triage
│   ├── Consultation Room 1
│   ├── Consultation Room 2
│   ├── Minor Theatre
│   └── Dressing Room
├── Pharmacy
├── Laboratory
│   ├── Sample Collection
│   └── Analysis Lab
├── Radiology
└── Accounts
    ├── Cashier 1 (NHIS)
    └── Cashier 2 (Cash)
```

### Adding New Locations
```bash
# Via REST API
curl -X POST \
  -H "Authorization: Basic {base64(admin:Admin123)}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Minor Theatre",
    "description": "Minor surgical procedures",
    "parentLocation": "facility-001",
    "tags": [
      {"uuid": "b8bbf83e-645f-451f-8efe-a0db56f09676"},  // Login Location
      {"uuid": "1c783dca-fd54-4ea8-a0fc-2875374e9d42"},  // Queue Room
      {"uuid": "37dd4458-dc9e-4ae6-a1f1-789c1162d37b"}   // Visit Location
    ]
  }' \
  http://localhost:8080/openmrs/ws/rest/v1/location
```

## Troubleshooting

### Location dropdown not showing
1. Check OpenMRS is running: http://localhost:8080/openmrs
2. Verify locations exist:
   ```bash
   curl -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/location?tag=Login Location"
   ```
3. Check browser console for API errors
4. Run setup script again: `.\scripts\setup-locations.ps1`

### "Work location is required" error
- Location dropdown didn't load properly
- Check network tab for failed `/location` API call
- Verify OpenMRS REST API is accessible

### Location not saved in session
- Check cookies: `omrsLocation` should be set
- Verify login route is setting cookie correctly
- Check browser console for JavaScript errors

## Next Steps (Week 4 - OPD Workflow)

With location-based login implemented, you can now:

1. **Queue Management**: Filter queues by location
2. **Patient Routing**: Move patients between service points
3. **Location Metrics**: Track wait times per location
4. **Provider Assignment**: Associate providers with locations
5. **Location-Specific Reports**: OPD register per consultation room

## Related Documentation

- [AGENTS.md](../AGENTS.md#location-based-login) - Architecture overview
- [Uganda EMR Reference](./UGANDA_EMR_REFERENCE.md) - Location patterns
- [OpenMRS Location API](https://rest.openmrs.org/#locations) - REST API docs

---

**Implementation Date**: November 2, 2025  
**Status**: ✅ Complete - Ready for Week 4 (OPD Workflow)
