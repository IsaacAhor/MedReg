# Active Task Queue

**Active Tasks:** 5
**Next Task:** Task 12: Admin Dashboard KPIs (HIGH)

**For Workers:** Execute tasks in FIFO order (First In, First Out). Use the command: "Refer to PROMPT_QUEUE.md pending task and complete it. Follow AGENTS.md rules, update IMPLEMENTATION_TRACKER.md when done."

**Important:**
- Holistic Build & Integration Rule (MANDATORY): Every task must ensure the backend, frontend, REST, and app UI still work together end-to-end. Do not break the app.
- If your task requires OpenMRS backend work (database, Java, Spring config), see [OPENMRS_PROMPT_GUIDE.md](../OPENMRS_PROMPT_GUIDE.md) for specialized workflow.

---

## Task Template (Use for all new tasks)

## Task [N]: [Task Title] ([Priority])
**Status:** [QUEUED] QUEUED
**Assigned to:** Next Available Worker
**Due:** YYYY-MM-DD HH:MM UTC
**Estimated:** X hours

### Self-Contained Execution Instructions

**When you see this task, execute these steps IN ORDER:**

#### 1. Read Context
- **Core Documents:**
    - `AGENTS.md` (especially Code Patterns, Security, and relevant Domain Rules)
    - `IMPLEMENTATION_TRACKER.md` (for overall project status)
- **API & Data:**
    - `docs/api/rest-api-reference.md` (for any REST API work)
    - `docs/db/data-dictionary.md` (for any database or service layer work)
- **Development Patterns:**
    - `docs/development/cookbook.md` (for step-by-step implementation recipes)
- **User Workflow (for UI tasks):**
    - `docs/training/roles/[relevant-role].md` (e.g., `doctor.md`)
- **Task-Specific Specs:**
    - `docs/specs/[relevant-spec].md`

#### 2. Create/Modify These Files
- [List exact files to create or modify]

#### 3. Implementation Requirements
- [Detailed technical requirements with code patterns]
- [Reference recipes from the Developer's Cookbook where applicable]

#### 4. Technical Constraints (NON-NEGOTIABLE)
- [DONE] Adhere to all constraints in `AGENTS.md` (Java 8, OpenMRS 2.4.0, etc.).
- [DONE] Follow the patterns and recipes outlined in the project documentation.

#### 5. Verification (MANDATORY - Run These Commands)
- `cd frontend && npm run lint && npm run type-check`
- `cd backend/openmrs-module-ghanaemr && mvn clean package -Dmaven.test.skip=true`
- Manually test the end-to-end flow, following the workflow in the relevant `docs/training/roles/` guide.
- [Add any other specific verification commands]

#### 6. Update Files (MANDATORY - Do This BEFORE Deleting Task)
**A. Update IMPLEMENTATION_TRACKER.md:**
- Mark the relevant task/milestone as COMPLETED and add a summary.

**B. Move Task to TASK_HISTORY.md:**
- Archive this task with a "SUCCESS" status and a summary of the outcome.

**C. Delete Task from PROMPT_QUEUE.md:**
- Remove this task from the queue.

**D. Perfect Handshake - Add Next Task (If Applicable):**
- Add the next logical task to this file, using this template.

#### 7. Notify Human (MANDATORY FORMAT)
```
[DONE] Task [N] Complete: [Task Title]

**Summary:**
- [Key accomplishment 1]
- [Key accomplishment 2]

**Files Created/Modified:**
- [file1.ts] - [brief description]
- [file2.tsx] - [brief description]

**Verification Results:**
[DONE] All verification commands passed.
[DONE] Manual E2E testing based on role-specific guide(s) was successful.

**Updated Documentation:**
[DONE] IMPLEMENTATION_TRACKER.md updated.
[DONE] TASK_HISTORY.md updated.

**Queue Status:**
- Active Tasks: [N]
- Next Task: [Task X: Title] or [Empty - No tasks queued]
```
---

## Task 12: Admin Dashboard KPIs (HIGH)
**Status:** [QUEUED] QUEUED  
**Assigned to:** Next Available Worker  
**Due:** 2025-11-11 17:00 UTC  
**Estimated:** 6 hours

### Self-Contained Execution Instructions

**When you see this task, execute these steps IN ORDER:**

#### 1. Read Context
- Core: `AGENTS.md` (constraints), `IMPLEMENTATION_TRACKER.md` (Phase 2 progress)
- Specs/Reference: `docs/UX_PATTERNS.md` (dashboard widgets), `docs/USER_JOURNEYS.md` (role dashboards)

#### 2. Create/Modify These Files
- Backend (OMOD):
  - `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/OPDMetricsController.java` (ensure KPIs returned)
  - `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/NHIEMetricsController.java` (NHIE backlog/last sync)
- Frontend:
  - `frontend/src/app/dashboard/page.tsx` (add KPI cards wired to REST)
  - `frontend/src/components/dashboard/KpiCard.tsx` (new component if missing)
- Config:
  - `.env.local` keys used by dashboard (encounter type UUIDs, location UUIDs already present)

#### 3. Implementation Requirements
- KPIs (minimum):
  - Today’s OPD encounters (by encounter type + optional location)
  - Queue lengths: triage, consultation, pharmacy (via existing queue API)
  - NHIE backlog count and last success timestamp
- REST endpoints:
  - Use existing `/ws/rest/v1/ghana/opd/metrics` and `/ws/rest/v1/ghana/nhie/metrics` (add fields if needed)
- Frontend dashboard:
  - Display KPI cards with loading/error states and auto-refresh (30–60s)
  - Respect role-based access (admins, facility admins visible; clinicians minimal)

#### 4. Technical Constraints (NON-NEGOTIABLE)
- Java 8, OpenMRS 2.4.0, MySQL 5.7
- Avoid logging PII; use masked identifiers

#### 5. Verification (MANDATORY)
- `cd backend/openmrs-module-ghanaemr && mvn clean package -Dmaven.test.skip=true`
- `cd frontend && npm run lint && npm run type-check`
- Manual: Dashboard renders KPI values without errors (requires running backend)

#### 6. Update Files (MANDATORY)
- Update IMPLEMENTATION_TRACKER.md (Admin Dashboard KPIs completed)
- Move this task to TASK_HISTORY.md as SUCCESS
- Delete task from PROMPT_QUEUE.md and add next logical task (e.g., “User Management: Roles & Permissions validation”)
## Task 13: Pharmacy BFF API Routes (HIGH)

**Status:** [QUEUED] QUEUED
**Assigned to:** Next Available Worker
**Due:** 2025-11-12 17:00 UTC
**Estimated:** 3 hours

### Self-Contained Execution Instructions

**When you see this task, execute these steps IN ORDER:**

#### 1. Read Context
- **Core Documents:**
    - `AGENTS.md` (especially BFF patterns, Next.js API routes)
    - `IMPLEMENTATION_TRACKER.md` (Week 9 status)
    - `08_MVP_Build_Strategy.md` (Week 9 requirements, lines 167-174)
- **API Reference:**
    - `docs/api/rest-api-reference.md`
- **Related Code:**
    - `frontend/src/app/api/opd/consultation/route.ts` (example BFF pattern)
    - `frontend/src/lib/openmrs-client.ts` (HTTP client)

#### 2. Create/Modify These Files
- `frontend/src/app/api/pharmacy/queue/[location]/route.ts` (new file)
- `frontend/src/app/api/pharmacy/dispense/route.ts` (new file)
- `frontend/src/app/api/pharmacy/patient/[patientId]/history/route.ts` (new file)

#### 3. Implementation Requirements

**Task:** Create 3 BFF (Backend-for-Frontend) API routes that proxy calls to OpenMRS pharmacy endpoints.

**Architecture:**
```
Frontend Component
    ↓
Next.js BFF API Route (/api/pharmacy/*)
    ↓
OpenMRS REST API (/ws/rest/v1/ghana/pharmacy/*)
    ↓
PharmacyController (created in OPM-006)
```

**Route 1: Get Pharmacy Queue**

**File:** `frontend/src/app/api/pharmacy/queue/[location]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { openmrsClient } from '@/lib/openmrs-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { location: string } }
) {
  try {
    const locationUuid = params.location;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'ACTIVE';

    // Call OpenMRS pharmacy queue endpoint
    const response = await openmrsClient.get(
      `/ws/rest/v1/ghana/pharmacy/queue/${locationUuid}`,
      { params: { status } }
    );

    // Add computed fields for frontend
    const queueWithMetadata = response.data.queue.map((item: any) => ({
      ...item,
      waitTime: computeWaitTime(item.dateActivated),
      displayName: `${item.patient?.name} - ${item.drug}`,
      priority: item.urgent ? 'high' : 'normal',
    }));

    return NextResponse.json({
      ...response.data,
      queue: queueWithMetadata,
    });
  } catch (error: any) {
    console.error('Pharmacy queue API error:', error);

    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch pharmacy queue',
        message: error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}

function computeWaitTime(dateActivated: string): number {
  const now = new Date().getTime();
  const activated = new Date(dateActivated).getTime();
  return Math.floor((now - activated) / 1000 / 60); // minutes
}
```

**Route 2: Dispense Prescription**

**File:** `frontend/src/app/api/pharmacy/dispense/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { openmrsClient } from '@/lib/openmrs-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { drugOrderUuid, notes } = body;

    // Validate required fields
    if (!drugOrderUuid) {
      return NextResponse.json(
        { error: 'drugOrderUuid is required' },
        { status: 400 }
      );
    }

    // Call OpenMRS dispense endpoint
    const response = await openmrsClient.post(
      '/ws/rest/v1/ghana/pharmacy/dispense',
      {
        drugOrderUuid,
        notes: notes || '',
      }
    );

    return NextResponse.json({
      success: true,
      ...response.data,
    });
  } catch (error: any) {
    console.error('Dispense API error:', error);

    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    if (error.response?.status === 400) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: error.response?.data?.message || error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to dispense prescription',
        message: error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
```

**Route 3: Patient Prescription History**

**File:** `frontend/src/app/api/pharmacy/patient/[patientId]/history/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { openmrsClient } from '@/lib/openmrs-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const patientUuid = params.patientId;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Call OpenMRS patient history endpoint
    const response = await openmrsClient.get(
      `/ws/rest/v1/ghana/pharmacy/patient/${patientUuid}/history`,
      { params: { limit } }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Patient history API error:', error);

    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch patient prescription history',
        message: error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
```

#### 4. Technical Constraints (NON-NEGOTIABLE)
- [DONE] Use Next.js 14 App Router (not Pages Router)
- [DONE] All API routes must use TypeScript
- [DONE] Use existing `openmrsClient` from `lib/openmrs-client.ts`
- [DONE] Return proper HTTP status codes (200, 400, 401, 500)
- [DONE] Add error handling for all network calls
- [DONE] Do NOT log sensitive patient data

#### 5. Verification (MANDATORY - Run These Commands)

```bash
cd frontend

# Type check
npm run type-check

# Expected: No TypeScript errors

# Lint check
npm run lint

# Expected: No linting errors

# Build check
npm run build

# Expected: Build succeeds, no errors in pharmacy API routes
```

**Manual Test (requires OpenMRS running):**

```bash
# Test 1: Get pharmacy queue
curl http://localhost:3000/api/pharmacy/queue/2b3c4d5e-6f70-4a81-9b01-2c3d4e5f6a7b

# Expected: JSON response with count and queue array

# Test 2: Dispense (requires valid drugOrderUuid)
curl -X POST http://localhost:3000/api/pharmacy/dispense \
  -H "Content-Type: application/json" \
  -d '{"drugOrderUuid": "test-uuid", "notes": "Test dispense"}'

# Expected: 400 error if drugOrderUuid invalid, or success response
```

#### 6. Update Files (MANDATORY - Do This BEFORE Deleting Task)

**A. Update IMPLEMENTATION_TRACKER.md:**

Add under Week 9 section:

```markdown
### Task 13: Pharmacy BFF API Routes (November X, 2025)

**Status:** [DONE] COMPLETED

**Summary:**
- Created 3 Next.js BFF API routes for pharmacy operations
- GET /api/pharmacy/queue/[location] - Fetch dispensing queue with wait times
- POST /api/pharmacy/dispense - Mark prescription as dispensed
- GET /api/pharmacy/patient/[patientId]/history - View prescription history
- All routes include proper error handling and auth checks

**Files Created:**
- frontend/src/app/api/pharmacy/queue/[location]/route.ts
- frontend/src/app/api/pharmacy/dispense/route.ts
- frontend/src/app/api/pharmacy/patient/[patientId]/history/route.ts

**Verification:**
- [DONE] TypeScript type-check passed
- [DONE] ESLint passed
- [DONE] Build succeeded
- [DONE] Manual API tests successful
```

**B. Move Task to TASK_HISTORY.md:**

Copy entire task block to TASK_HISTORY.md with status [DONE] SUCCESS and timestamp.

**C. Delete Task from PROMPT_QUEUE.md:**

Remove this task completely.

**D. Perfect Handshake - Add Next Task:**

Add Task 14 to PROMPT_QUEUE.md (Pharmacy Queue Page) - see below for template.

#### 7. Notify Human (MANDATORY FORMAT)

```
[DONE] Task 13 Complete: Pharmacy BFF API Routes

**Summary:**
- Created 3 BFF API routes for pharmacy module
- Routes: queue/[location], dispense, patient/[id]/history
- Added error handling, auth checks, wait time computation

**Files Created:**
- frontend/src/app/api/pharmacy/queue/[location]/route.ts (72 lines)
- frontend/src/app/api/pharmacy/dispense/route.ts (58 lines)
- frontend/src/app/api/pharmacy/patient/[patientId]/history/route.ts (48 lines)

**Verification Results:**
[DONE] TypeScript type-check passed
[DONE] ESLint passed with 0 warnings
[DONE] Next.js build succeeded
[DONE] Manual curl tests successful (queue returns data, dispense validates input)

**Updated Documentation:**
[DONE] IMPLEMENTATION_TRACKER.md updated (Week 9 section)
[DONE] TASK_HISTORY.md updated

**Queue Status:**
- Active Tasks: 4
- Next Task: Task 14 - Pharmacy Queue Page (shadcn/ui table component)

**Ready for:** Frontend pharmacy queue page development (Task 14)
```

### Acceptance Criteria
- [ ] All 3 API routes created with TypeScript
- [ ] Routes proxy to correct OpenMRS endpoints
- [ ] Error handling covers 401, 400, 500 cases
- [ ] Wait time computed for queue items
- [ ] Type-check passes
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Manual tests verify API functionality

---

## Task 14: Pharmacy Queue Page (HIGH)

**Status:** [QUEUED] QUEUED
**Assigned to:** Next Available Worker
**Due:** 2025-11-13 17:00 UTC
**Estimated:** 4 hours

### Self-Contained Execution Instructions

#### 1. Read Context
- `AGENTS.md` (shadcn/ui patterns, TanStack Query usage)
- `docs/UX_PATTERNS.md` (queue page patterns)
- `docs/USER_JOURNEYS.md` (pharmacist workflow)
- `frontend/src/app/opd/triage-queue/page.tsx` (example queue page)
- `frontend/src/app/opd/consultation-queue/page.tsx` (example queue page)

#### 2. Create/Modify These Files
- `frontend/src/app/opd/pharmacy-queue/page.tsx` (already exists - UPDATE IT)
- `frontend/src/hooks/pharmacy/usePharmacyQueue.ts` (new file)
- `frontend/src/lib/schemas/pharmacy.ts` (new file - Zod schemas)

#### 3. Implementation Requirements

**Task:** Build pharmacy queue page with shadcn/ui Table component showing pending prescriptions.

**Features:**
1. Real-time queue polling (30-second interval)
2. Table with columns: Patient, Drug, Dosage, Frequency, Duration, Wait Time, Actions
3. Filter by patient name or drug name
4. Sort by wait time (ascending/descending)
5. "Dispense" button opens modal (Task 15)
6. Loading states and error handling
7. Empty state when no prescriptions

**File 1: Zod Schema**

**File:** `frontend/src/lib/schemas/pharmacy.ts`

```typescript
import { z } from 'zod';

export const pharmacyQueueItemSchema = z.object({
  uuid: z.string().uuid(),
  orderNumber: z.string(),
  drug: z.string(),
  dose: z.number(),
  doseUnits: z.string(),
  frequency: z.string(),
  duration: z.number().optional(),
  durationUnits: z.string().optional(),
  quantity: z.number().optional(),
  quantityUnits: z.string().optional(),
  instructions: z.string().optional(),
  dateActivated: z.string(),
  status: z.string(),
  waitTime: z.number(), // in minutes
  displayName: z.string(),
  priority: z.enum(['normal', 'high']).default('normal'),
  patient: z.object({
    uuid: z.string().uuid(),
    name: z.string(),
    identifier: z.string(),
  }),
  encounter: z
    .object({
      uuid: z.string().uuid(),
      date: z.string(),
    })
    .optional(),
});

export const pharmacyQueueResponseSchema = z.object({
  count: z.number(),
  queue: z.array(pharmacyQueueItemSchema),
  location: z.string(),
});

export const dispenseRequestSchema = z.object({
  drugOrderUuid: z.string().uuid(),
  notes: z.string().optional(),
});

export type PharmacyQueueItem = z.infer<typeof pharmacyQueueItemSchema>;
export type PharmacyQueueResponse = z.infer<typeof pharmacyQueueResponseSchema>;
export type DispenseRequest = z.infer<typeof dispenseRequestSchema>;
```

**File 2: TanStack Query Hook**

**File:** `frontend/src/hooks/pharmacy/usePharmacyQueue.ts`

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { pharmacyQueueResponseSchema, dispenseRequestSchema } from '@/lib/schemas/pharmacy';
import type { PharmacyQueueResponse, DispenseRequest } from '@/lib/schemas/pharmacy';

const PHARMACY_LOCATION_UUID =
  process.env.NEXT_PUBLIC_PHARMACY_LOCATION_UUID || '2b3c4d5e-6f70-4a81-9b01-2c3d4e5f6a7b';

const POLL_INTERVAL = parseInt(process.env.NEXT_PUBLIC_QUEUE_POLL_INTERVAL || '30000', 10);

export function usePharmacyQueue() {
  return useQuery<PharmacyQueueResponse>({
    queryKey: ['pharmacy-queue', PHARMACY_LOCATION_UUID],
    queryFn: async () => {
      const response = await axios.get(`/api/pharmacy/queue/${PHARMACY_LOCATION_UUID}`);
      return pharmacyQueueResponseSchema.parse(response.data);
    },
    refetchInterval: POLL_INTERVAL, // Poll every 30 seconds
    refetchOnWindowFocus: true,
  });
}

export function useDispensePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DispenseRequest) => {
      dispenseRequestSchema.parse(data);
      const response = await axios.post('/api/pharmacy/dispense', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate queue to refresh after dispensing
      queryClient.invalidateQueries({ queryKey: ['pharmacy-queue'] });
    },
  });
}
```

**File 3: Pharmacy Queue Page**

**File:** `frontend/src/app/opd/pharmacy-queue/page.tsx`

```typescript
'use client';

import { useState, useMemo } from 'react';
import { usePharmacyQueue } from '@/hooks/pharmacy/usePharmacyQueue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, ArrowUpDown, Pill } from 'lucide-react';
import type { PharmacyQueueItem } from '@/lib/schemas/pharmacy';

export default function PharmacyQueuePage() {
  const { data, isLoading, error } = usePharmacyQueue();
  const [searchFilter, setSearchFilter] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter and sort queue
  const filteredQueue = useMemo(() => {
    if (!data?.queue) return [];

    let filtered = data.queue;

    // Apply search filter
    if (searchFilter) {
      const lowerSearch = searchFilter.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.patient.name.toLowerCase().includes(lowerSearch) ||
          item.drug.toLowerCase().includes(lowerSearch) ||
          item.patient.identifier.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort by wait time
    filtered.sort((a, b) => {
      return sortAsc ? a.waitTime - b.waitTime : b.waitTime - a.waitTime;
    });

    return filtered;
  }, [data, searchFilter, sortAsc]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading pharmacy queue...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load pharmacy queue. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Pharmacy Dispensing Queue
          </CardTitle>
          <CardDescription>
            {data?.count || 0} prescription{data?.count !== 1 ? 's' : ''} pending
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name, drug, or ID..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortAsc(!sortAsc)}
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Wait Time {sortAsc ? '↑' : '↓'}
            </Button>
          </div>

          {/* Queue Table */}
          {filteredQueue.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Pill className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No prescriptions in queue</p>
              <p className="text-sm">Pending prescriptions will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Drug</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Wait Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueue.map((item) => (
                  <TableRow key={item.uuid}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.patient.name}
                        {item.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.patient.identifier}</TableCell>
                    <TableCell>{item.drug}</TableCell>
                    <TableCell>
                      {item.dose} {item.doseUnits}
                    </TableCell>
                    <TableCell>{item.frequency}</TableCell>
                    <TableCell>
                      {item.duration} {item.durationUnits}
                    </TableCell>
                    <TableCell>
                      <WaitTimeBadge waitTime={item.waitTime} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => alert(`Dispense modal - Task 15`)}>
                        Dispense
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WaitTimeBadge({ waitTime }: { waitTime: number }) {
  let variant: 'default' | 'secondary' | 'destructive' = 'default';

  if (waitTime > 60) {
    variant = 'destructive'; // Over 1 hour
  } else if (waitTime > 30) {
    variant = 'secondary'; // Over 30 minutes
  }

  return (
    <Badge variant={variant}>
      {waitTime} min
    </Badge>
  );
}
```

#### 4. Technical Constraints (NON-NEGOTIABLE)
- [DONE] Use shadcn/ui components only (Table, Card, Badge, Button, Input)
- [DONE] Use TanStack Query for data fetching with 30s polling
- [DONE] Use Zod for schema validation
- [DONE] TypeScript strict mode
- [DONE] Responsive design (works on mobile/tablet/desktop)

#### 5. Verification (MANDATORY)

```bash
cd frontend

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Manual test: Visit http://localhost:3000/opd/pharmacy-queue
# - Should see "Loading pharmacy queue..." initially
# - Should see table with prescriptions (if any exist)
# - Should see empty state if no prescriptions
# - Search filter should work
# - Sort button should toggle wait time order
```

#### 6. Update Files (MANDATORY)

**A. Update IMPLEMENTATION_TRACKER.md:** Add Task 14 completion summary

**B. Move Task to TASK_HISTORY.md:** Archive with [DONE] SUCCESS status

**C. Delete Task from PROMPT_QUEUE.md**

**D. Perfect Handshake:** Add Task 15 (Dispense Modal Component)

#### 7. Notify Human

```
[DONE] Task 14 Complete: Pharmacy Queue Page

**Summary:**
- Created pharmacy queue page with shadcn/ui Table
- Real-time polling every 30 seconds
- Search filter (patient/drug/ID)
- Sort by wait time
- Empty state handling

**Files Created:**
- frontend/src/app/opd/pharmacy-queue/page.tsx (updated, 180 lines)
- frontend/src/hooks/pharmacy/usePharmacyQueue.ts (65 lines)
- frontend/src/lib/schemas/pharmacy.ts (45 lines)

**Verification Results:**
[DONE] TypeScript passed
[DONE] Lint passed
[DONE] Build succeeded
[DONE] Manual test: Table renders, search works, sort works

**Queue Status:**
- Next Task: Task 15 - Dispense Modal Component
```

### Acceptance Criteria
- [ ] Pharmacy queue page renders without errors
- [ ] Table displays all queue columns
- [ ] Search filter works (patient, drug, ID)
- [ ] Sort by wait time works
- [ ] Real-time polling active (30s interval)
- [ ] Empty state shows when no prescriptions
- [ ] Loading state shows during fetch
- [ ] Error state shows on API failure
- [ ] Dispense button present (opens alert for now)

---

## Task 15: Dispense Modal Component (HIGH)

**Status:** [QUEUED] QUEUED
**Assigned to:** Next Available Worker
**Due:** 2025-11-14 17:00 UTC
**Estimated:** 3 hours

### Self-Contained Execution Instructions

#### 1. Read Context
- `AGENTS.md` (modal patterns, form handling)
- `docs/UX_PATTERNS.md` (modal dialogs)
- `frontend/src/components` (existing modal examples)

#### 2. Create/Modify These Files
- `frontend/src/components/pharmacy/DispenseModal.tsx` (new file)
- `frontend/src/app/opd/pharmacy-queue/page.tsx` (update to use modal)

#### 3. Implementation Requirements

**Task:** Create modal dialog for dispensing prescriptions with confirmation.

**Features:**
1. Modal shows drug details (name, dosage, frequency, duration)
2. Shows patient info (name, ID)
3. Optional notes textarea
4. Confirm and Cancel buttons
5. Loading state during dispense API call
6. Toast notification on success/error
7. Closes modal on success

**File 1: Dispense Modal Component**

**File:** `frontend/src/components/pharmacy/DispenseModal.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useDispensePrescription } from '@/hooks/pharmacy/usePharmacyQueue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pill } from 'lucide-react';
import type { PharmacyQueueItem } from '@/lib/schemas/pharmacy';

interface DispenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PharmacyQueueItem | null;
}

export function DispenseModal({ isOpen, onClose, item }: DispenseModalProps) {
  const [notes, setNotes] = useState('');
  const { mutate: dispense, isPending } = useDispensePrescription();
  const { toast } = useToast();

  const handleDispense = () => {
    if (!item) return;

    dispense(
      {
        drugOrderUuid: item.uuid,
        notes,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Prescription dispensed',
            description: `${item.drug} dispensed to ${item.patient.name}`,
          });
          setNotes('');
          onClose();
        },
        onError: (error: any) => {
          toast({
            title: 'Dispensing failed',
            description: error.response?.data?.message || 'An error occurred',
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Dispense Prescription
          </DialogTitle>
          <DialogDescription>Confirm medication dispensing for this patient</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Patient</Label>
              <p className="font-medium">{item.patient.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Patient ID</Label>
              <p className="font-medium">{item.patient.identifier}</p>
            </div>
          </div>

          {/* Drug Details */}
          <div className="border rounded-lg p-4 space-y-2 bg-muted/20">
            <div>
              <Label className="text-muted-foreground">Medication</Label>
              <p className="font-medium text-lg">{item.drug}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Dosage</Label>
                <p>
                  {item.dose} {item.doseUnits}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Frequency</Label>
                <p>{item.frequency}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Duration</Label>
                <p>
                  {item.duration} {item.durationUnits}
                </p>
              </div>
              {item.quantity && (
                <div>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <p>
                    {item.quantity} {item.quantityUnits}
                  </p>
                </div>
              )}
            </div>
            {item.instructions && (
              <div>
                <Label className="text-muted-foreground">Instructions</Label>
                <p className="text-sm">{item.instructions}</p>
              </div>
            )}
          </div>

          {/* Dispensing Notes */}
          <div>
            <Label htmlFor="notes">Dispensing Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this dispensing..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleDispense} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Dispense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**File 2: Update Pharmacy Queue Page**

**Update:** `frontend/src/app/opd/pharmacy-queue/page.tsx`

```typescript
// Add import at top
import { DispenseModal } from '@/components/pharmacy/DispenseModal';

// Add state in component
const [selectedItem, setSelectedItem] = useState<PharmacyQueueItem | null>(null);

// Update Dispense button in table
<Button
  size="sm"
  onClick={() => setSelectedItem(item)}
>
  Dispense
</Button>

// Add modal before closing </div>
<DispenseModal
  isOpen={selectedItem !== null}
  onClose={() => setSelectedItem(null)}
  item={selectedItem}
/>
```

#### 4. Technical Constraints (NON-NEGOTIABLE)
- [DONE] Use shadcn/ui Dialog component
- [DONE] Use TanStack Query mutation (useDispensePrescription)
- [DONE] Toast notifications for success/error
- [DONE] Loading state during API call
- [DONE] TypeScript strict mode

#### 5. Verification (MANDATORY)

```bash
cd frontend

npm run type-check
npm run lint
npm run build

# Manual test:
# 1. Visit http://localhost:3000/opd/pharmacy-queue
# 2. Click "Dispense" button on any prescription
# 3. Modal should open with drug details
# 4. Add notes and click "Confirm Dispense"
# 5. Should see loading spinner
# 6. Should see success toast
# 7. Modal should close
# 8. Queue should refresh (item removed)
```

#### 6. Update Files (MANDATORY)

**A. Update IMPLEMENTATION_TRACKER.md:** Add Task 15 completion

**B. Move Task to TASK_HISTORY.md**

**C. Delete Task from PROMPT_QUEUE.md**

**D. Perfect Handshake:** Add Task 16 (E2E Pharmacy Testing)

#### 7. Notify Human

```
[DONE] Task 15 Complete: Dispense Modal Component

**Summary:**
- Created dispense modal with drug details display
- Integrated with useDispensePrescription mutation
- Added notes textarea for pharmacist comments
- Toast notifications for success/error
- Loading states during API call

**Files Created:**
- frontend/src/components/pharmacy/DispenseModal.tsx (155 lines)

**Files Modified:**
- frontend/src/app/opd/pharmacy-queue/page.tsx (added modal integration)

**Verification Results:**
[DONE] TypeScript passed
[DONE] Lint passed
[DONE] Build succeeded
[DONE] Manual test: Modal opens, dispense works, queue refreshes

**Queue Status:**
- Next Task: Task 16 - E2E Pharmacy Workflow Testing
```

### Acceptance Criteria
- [ ] DispenseModal component renders
- [ ] Shows patient info (name, ID)
- [ ] Shows complete drug details
- [ ] Notes textarea works
- [ ] Confirm button calls dispense API
- [ ] Loading state shows during API call
- [ ] Success toast appears on success
- [ ] Error toast appears on failure
- [ ] Modal closes on success
- [ ] Queue refreshes after dispensing

---

## Task 16: E2E Pharmacy Workflow Testing (MEDIUM)

**Status:** [QUEUED] QUEUED
**Assigned to:** Next Available Worker
**Due:** 2025-11-15 17:00 UTC
**Estimated:** 3 hours

### Self-Contained Execution Instructions

#### 1. Read Context
- `AGENTS.md` (testing guidelines)
- `docs/USER_JOURNEYS.md` (pharmacist workflow)
- All previous Tasks 13-15

#### 2. Create/Modify These Files
- `PHARMACY_E2E_TEST_REPORT.md` (new file - test documentation)
- `docs/training/roles/pharmacist.md` (update with pharmacy workflow)

#### 3. Implementation Requirements

**Task:** Perform end-to-end testing of complete pharmacy workflow and document results.

**Test Scenarios:**

**Scenario 1: Consultation → Pharmacy Queue**
1. Doctor creates consultation with prescription (use existing consultation module)
2. Verify prescription appears in pharmacy queue at `/opd/pharmacy-queue`
3. Verify patient details, drug details, wait time shown correctly

**Scenario 2: Dispense Prescription**
1. Pharmacist clicks "Dispense" button
2. Modal opens with drug details
3. Add notes: "Dispensed with counseling on side effects"
4. Click "Confirm Dispense"
5. Verify success toast
6. Verify prescription removed from queue
7. Verify in OpenMRS that DrugOrder status changed

**Scenario 3: Search and Filter**
1. Create 3+ prescriptions for different patients
2. Test search by patient name
3. Test search by drug name
4. Test search by patient ID
5. Verify results filtered correctly

**Scenario 4: Sort by Wait Time**
1. Create prescriptions with different timestamps
2. Test sort ascending (oldest first)
3. Test sort descending (newest first)
4. Verify order changes

**Scenario 5: Error Handling**
1. Disconnect backend
2. Verify error message shown
3. Reconnect backend
4. Verify queue loads again

**Scenario 6: Real-time Polling**
1. Open pharmacy queue in browser
2. In another tab, create new consultation with prescription
3. Wait 30 seconds
4. Verify new prescription appears automatically

**Documentation:**

Create `PHARMACY_E2E_TEST_REPORT.md`:

```markdown
# Pharmacy Module E2E Test Report

**Date:** 2025-11-XX
**Tester:** [Worker name]
**Environment:** Local development (OpenMRS 2.4.0, Next.js 14)

## Test Results Summary

- **Total Scenarios:** 6
- **Passed:** X
- **Failed:** Y
- **Blocked:** Z

## Scenario 1: Consultation → Pharmacy Queue

**Status:** [PASS/FAIL]

**Steps:**
1. Created consultation for patient "John Doe"
2. Prescribed: Paracetamol 500mg, 3 times daily, 5 days
3. Navigated to /opd/pharmacy-queue

**Expected:** Prescription appears in queue
**Actual:** [Describe what happened]
**Screenshot:** [Optional]

## Scenario 2: Dispense Prescription

[Similar format for each scenario...]

## Issues Found

### Issue 1: [Title]
- **Severity:** Critical/High/Medium/Low
- **Description:** [Describe issue]
- **Steps to Reproduce:** [Numbered steps]
- **Expected:** [What should happen]
- **Actual:** [What actually happened]
- **Fix Needed:** [Suggested fix]

## Performance Observations

- Queue load time: X seconds
- Search filter response: X ms
- Dispense API call: X seconds
- Polling interval verified: 30 seconds

## Browser Compatibility

- [DONE] Chrome 120+ (tested)
- [ ] Firefox (not tested - defer to QA)
- [ ] Safari (not tested - defer to QA)

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

## Sign-off

Module ready for: [Demo / Pilot / Production / Needs fixes]

**Tested by:** [Worker name]
**Date:** 2025-11-XX
```

**Update User Guide:**

**File:** `docs/training/roles/pharmacist.md`

Add pharmacy workflow section:

```markdown
## Pharmacy Dispensing Workflow

### Step 1: Access Pharmacy Queue
1. Click "Pharmacy Queue" in navigation
2. View list of pending prescriptions

### Step 2: Verify Prescription
1. Check patient name and ID
2. Review drug name, dosage, frequency, duration
3. Check for urgent/high priority flags

### Step 3: Dispense Medication
1. Click "Dispense" button
2. Review drug details in modal
3. Add dispensing notes (optional)
4. Click "Confirm Dispense"
5. Verify success message

### Step 4: Patient Counseling
1. Explain dosage and frequency
2. Discuss side effects
3. Answer patient questions

### Features:
- **Search:** Find prescriptions by patient name, drug, or ID
- **Sort:** Order queue by wait time
- **Real-time Updates:** Queue refreshes every 30 seconds
```

#### 4. Technical Constraints (NON-NEGOTIABLE)
- [DONE] Test all 6 scenarios
- [DONE] Document results in markdown
- [DONE] Include screenshots for critical issues
- [DONE] Test on Chrome browser minimum

#### 5. Verification (MANDATORY)

```bash
# No automated tests for this task
# Manual verification checklist:

# [ ] All 6 scenarios tested
# [ ] PHARMACY_E2E_TEST_REPORT.md created
# [ ] docs/training/roles/pharmacist.md updated
# [ ] At least 3 prescriptions created and dispensed successfully
# [ ] Search, sort, polling all verified working
# [ ] Issues documented (if any)
```

#### 6. Update Files (MANDATORY)

**A. Update IMPLEMENTATION_TRACKER.md:**

```markdown
### Week 9: Pharmacy Module (November X-Y, 2025)

**Status:** [DONE] COMPLETED

**Summary:**
- Completed full pharmacy dispensing workflow
- Backend: PharmacyService, PharmacyController, unit tests (OPM-005, 006, 007)
- Frontend: BFF API routes, queue page, dispense modal (Tasks 13-15)
- E2E testing: 6 scenarios tested, all passing (Task 16)

**Deliverables:**
- Pharmacy queue displays pending prescriptions
- Dispense modal with drug details and notes
- Real-time polling every 30 seconds
- Search and sort functionality
- Toast notifications

**Files Created:** [List all files]

**Verification:**
- [DONE] Backend builds successfully
- [DONE] Frontend builds successfully
- [DONE] All E2E scenarios pass
- [DONE] User guide updated

**Milestone 2 Progress:** Ready for Week 10 (NHIE Encounter Sync)
```

**B. Move Task to TASK_HISTORY.md**

**C. Delete Task from PROMPT_QUEUE.md**

**D. Perfect Handshake:** NO NEXT TASK (Week 9 complete!)

Update PROMPT_QUEUE.md header:
```markdown
**Active Tasks:** 0
**Next Task:** Week 10 - NHIE Encounter Sync (backend task - see OPENMRS_PROMPT_GUIDE.md)
```

#### 7. Notify Human

```
[DONE] Task 16 Complete: E2E Pharmacy Workflow Testing

**Summary:**
- Tested 6 end-to-end scenarios
- All scenarios PASSED
- Created comprehensive test report
- Updated pharmacist user guide

**Files Created:**
- PHARMACY_E2E_TEST_REPORT.md (test documentation)

**Files Modified:**
- docs/training/roles/pharmacist.md (added pharmacy workflow)

**Test Results:**
- Scenario 1 (Consultation → Queue): PASS
- Scenario 2 (Dispense): PASS
- Scenario 3 (Search/Filter): PASS
- Scenario 4 (Sort): PASS
- Scenario 5 (Error Handling): PASS
- Scenario 6 (Real-time Polling): PASS

**Issues Found:** 0 critical, 0 high, 0 medium

**Updated Documentation:**
[DONE] IMPLEMENTATION_TRACKER.md updated (Week 9 COMPLETE)
[DONE] TASK_HISTORY.md updated (all 7 pharmacy tasks archived)

**Queue Status:**
- Active Tasks: 0
- Week 9 Status: COMPLETE ✅
- Next Phase: Week 10 - NHIE Encounter Sync

**🎉 PHARMACY MODULE COMPLETE - READY FOR DEMO! 🎉**
```

### Acceptance Criteria
- [ ] All 6 test scenarios executed
- [ ] PHARMACY_E2E_TEST_REPORT.md created
- [ ] Test results documented (pass/fail for each)
- [ ] Issues logged (if any found)
- [ ] Pharmacist user guide updated
- [ ] Screenshots included for any failures
- [ ] Module deemed ready for next phase

