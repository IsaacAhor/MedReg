# Pharmacy Module Tasks - Week 9 MVP

This file contains 7 tasks for the Pharmacy Module (Week 9 of 20-week MVP):
- 3 Backend tasks (for OPENMRS_PROMPT_GUIDE.md)
- 4 Frontend tasks (for PROMPT_QUEUE.md)

---

## BACKEND TASKS (Add to OPENMRS_PROMPT_GUIDE.md)

### Update Active Task Summary Table

Add these rows to the table at line 30-36:

```markdown
| OPM-005 | Pharmacy Service Layer (Service + DAO) | TODO | HIGH | OPM-001 |
| OPM-006 | Pharmacy REST Controller | TODO | HIGH | OPM-005 |
| OPM-007 | Pharmacy Service Unit Tests | TODO | MEDIUM | OPM-005 |
```

---

## OPM-005: Pharmacy Service Layer (Service + DAO)

**Status:** TODO
**Priority:** HIGH
**Created:** 2025-11-08
**Dependencies:** OPM-001 (Queue table exists for pharmacy queue filtering)
**Related Files:**
- `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/pharmacy/PharmacyService.java` (to be created)
- `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/pharmacy/impl/PharmacyServiceImpl.java` (to be created)
- `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/pharmacy/db/PharmacyDAO.java` (to be created)
- `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/pharmacy/db/hibernate/HibernatePharmacyDAO.java` (to be created)
- `backend/openmrs-module-ghanaemr/api/src/main/resources/moduleApplicationContext.xml` (update to register beans)

### Context

Week 9 of the MVP requires a Pharmacy Module for dispensing workflow. This task creates the service layer that:
1. Retrieves pending prescriptions (DrugOrders) for a location
2. Marks prescriptions as dispensed with timestamp
3. Queries patient prescription history

**Current State:**
- ✅ Consultation module creates DrugOrders (Week 7-8 complete)
- ✅ Patient queue table exists (OPM-001 complete)
- ❌ No PharmacyService implementation yet
- ❌ No DAO for pharmacy operations yet

**What This Task Does:**
1. Create PharmacyService interface with 3 methods:
   - `getPendingPrescriptions(locationUuid, status)` - Get dispensing queue
   - `dispensePrescription(drugOrderUuid, dispensedBy, notes)` - Mark as dispensed
   - `getPatientPrescriptionHistory(patientUuid, limit)` - View history
2. Implement PharmacyServiceImpl using OpenMRS OrderService
3. Create PharmacyDAO interface and HibernatePharmacyDAO implementation
4. Register Spring beans in moduleApplicationContext.xml
5. Build and deploy module

### Related Frontend Context

**Frontend pages that depend on this:**
- `frontend/src/app/opd/pharmacy/page.tsx` - Pharmacy queue page (Task 14)
- `frontend/src/app/api/pharmacy/queue/[location]/route.ts` - BFF API (Task 13)
- `frontend/src/app/api/pharmacy/dispense/route.ts` - Dispense endpoint (Task 13)

**NOTE:** Inventory/stock tracking is deferred to v2 per 08_MVP_Build_Strategy.md line 174

---

### ✂️ COPY FROM HERE ✂️

## Self-Contained Prompt for OpenMRS Worker

**Task:** Create PharmacyService layer for dispensing workflow

**Context:** You have OpenMRS MCP access. Week 9 MVP requires pharmacy dispensing. This task creates the service layer that interacts with OpenMRS OrderService to manage drug prescriptions.

**Prerequisites:**
- OPM-001 completed (patient queue table exists)
- Java 8, OpenMRS 2.4.0, Maven installed
- Docker container `medreg-openmrs` running

**Architecture Overview:**
```
Frontend BFF API
     ↓
PharmacyController (REST)
     ↓
PharmacyService (business logic)
     ↓
OpenMRS OrderService + PharmacyDAO
     ↓
Database (order, drug_order, patient_queue tables)
```

**Steps to Execute:**

### 1. Create PharmacyService Interface

```bash
# Create directory if needed
mkdir -p backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/pharmacy
```

**File:** `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/pharmacy/PharmacyService.java`

```java
package org.openmrs.module.ghanaemr.api.pharmacy;

import org.openmrs.DrugOrder;
import org.openmrs.api.OpenmrsService;
import java.util.List;
import java.util.Date;

/**
 * Pharmacy service for managing medication dispensing
 * MVP Scope: Dispensing workflow only (no inventory tracking)
 */
public interface PharmacyService extends OpenmrsService {

    /**
     * Get pending prescriptions for a location
     * @param locationUuid Location UUID (e.g., Pharmacy location)
     * @param status Order status filter (e.g., "ACTIVE")
     * @return List of pending DrugOrders
     */
    List<DrugOrder> getPendingPrescriptions(String locationUuid, String status);

    /**
     * Mark a prescription as dispensed
     * @param drugOrderUuid UUID of the DrugOrder
     * @param dispensedBy User UUID who dispensed
     * @param notes Optional dispensing notes
     * @param dispensedAt Timestamp of dispensing
     * @return Updated DrugOrder
     */
    DrugOrder dispensePrescription(String drugOrderUuid, String dispensedBy, String notes, Date dispensedAt);

    /**
     * Get prescription history for a patient
     * @param patientUuid Patient UUID
     * @param limit Maximum number of records
     * @return List of DrugOrders (recent first)
     */
    List<DrugOrder> getPatientPrescriptionHistory(String patientUuid, int limit);
}
```

### 2. Create PharmacyServiceImpl

**File:** `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/pharmacy/impl/PharmacyServiceImpl.java`

```java
package org.openmrs.module.ghanaemr.api.pharmacy.impl;

import org.openmrs.DrugOrder;
import org.openmrs.Order;
import org.openmrs.api.OrderService;
import org.openmrs.api.impl.BaseOpenmrsService;
import org.openmrs.module.ghanaemr.api.pharmacy.PharmacyService;
import org.openmrs.module.ghanaemr.api.pharmacy.db.PharmacyDAO;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Date;

@Transactional
public class PharmacyServiceImpl extends BaseOpenmrsService implements PharmacyService {

    private PharmacyDAO dao;
    private OrderService orderService;

    public void setDao(PharmacyDAO dao) {
        this.dao = dao;
    }

    public void setOrderService(OrderService orderService) {
        this.orderService = orderService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DrugOrder> getPendingPrescriptions(String locationUuid, String status) {
        if (locationUuid == null || locationUuid.trim().isEmpty()) {
            throw new IllegalArgumentException("Location UUID cannot be null or empty");
        }
        return dao.getPendingDrugOrders(locationUuid, status);
    }

    @Override
    @Transactional
    public DrugOrder dispensePrescription(String drugOrderUuid, String dispensedBy, String notes, Date dispensedAt) {
        if (drugOrderUuid == null || drugOrderUuid.trim().isEmpty()) {
            throw new IllegalArgumentException("DrugOrder UUID cannot be null or empty");
        }

        // Get the DrugOrder
        Order order = orderService.getOrderByUuid(drugOrderUuid);
        if (order == null || !(order instanceof DrugOrder)) {
            throw new IllegalArgumentException("DrugOrder not found: " + drugOrderUuid);
        }

        DrugOrder drugOrder = (DrugOrder) order;

        // Mark as COMPLETED using OpenMRS OrderService
        // NOTE: OpenMRS 2.4.0 uses discontinueOrder for this
        Order discontinueOrder = orderService.discontinueOrder(
            drugOrder,
            "Dispensed",
            dispensedAt,
            orderService.getOrderByUuid(dispensedBy), // dispensedBy as provider
            drugOrder.getEncounter()
        );

        // Store dispensing notes in obs or custom table if needed
        // For MVP, we just use the discontinue reason

        return (DrugOrder) discontinueOrder;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DrugOrder> getPatientPrescriptionHistory(String patientUuid, int limit) {
        if (patientUuid == null || patientUuid.trim().isEmpty()) {
            throw new IllegalArgumentException("Patient UUID cannot be null or empty");
        }
        return dao.getPatientDrugOrderHistory(patientUuid, limit);
    }
}
```

### 3. Create PharmacyDAO Interface

**File:** `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/pharmacy/db/PharmacyDAO.java`

```java
package org.openmrs.module.ghanaemr.api.pharmacy.db;

import org.openmrs.DrugOrder;
import java.util.List;

/**
 * DAO for pharmacy operations
 */
public interface PharmacyDAO {

    /**
     * Get pending drug orders for a location
     */
    List<DrugOrder> getPendingDrugOrders(String locationUuid, String status);

    /**
     * Get patient drug order history
     */
    List<DrugOrder> getPatientDrugOrderHistory(String patientUuid, int limit);
}
```

### 4. Create HibernatePharmacyDAO Implementation

**File:** `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/pharmacy/db/hibernate/HibernatePharmacyDAO.java`

```java
package org.openmrs.module.ghanaemr.api.pharmacy.db.hibernate;

import org.hibernate.Criteria;
import org.hibernate.SessionFactory;
import org.hibernate.criterion.Order;
import org.hibernate.criterion.Restrictions;
import org.openmrs.DrugOrder;
import org.openmrs.module.ghanaemr.api.pharmacy.db.PharmacyDAO;
import java.util.List;

public class HibernatePharmacyDAO implements PharmacyDAO {

    private SessionFactory sessionFactory;

    public void setSessionFactory(SessionFactory sessionFactory) {
        this.sessionFactory = sessionFactory;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<DrugOrder> getPendingDrugOrders(String locationUuid, String status) {
        Criteria criteria = sessionFactory.getCurrentSession().createCriteria(DrugOrder.class);

        // Filter by status (ACTIVE orders only)
        criteria.add(Restrictions.eq("voided", false));

        // Join with encounter to filter by location
        criteria.createAlias("encounter", "enc");
        criteria.createAlias("enc.location", "loc");
        criteria.add(Restrictions.eq("loc.uuid", locationUuid));

        // Order by date created (oldest first - FIFO queue)
        criteria.addOrder(Order.asc("dateActivated"));

        return criteria.list();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<DrugOrder> getPatientDrugOrderHistory(String patientUuid, int limit) {
        Criteria criteria = sessionFactory.getCurrentSession().createCriteria(DrugOrder.class);

        // Filter by patient
        criteria.createAlias("patient", "pat");
        criteria.add(Restrictions.eq("pat.uuid", patientUuid));
        criteria.add(Restrictions.eq("voided", false));

        // Order by date (recent first)
        criteria.addOrder(Order.desc("dateActivated"));

        // Limit results
        if (limit > 0) {
            criteria.setMaxResults(limit);
        }

        return criteria.list();
    }
}
```

### 5. Register Spring Beans

**File:** `backend/openmrs-module-ghanaemr/api/src/main/resources/moduleApplicationContext.xml`

**Add these beans inside the `<beans>` element:**

```xml
<!-- Pharmacy Service -->
<bean id="pharmacyService"
      class="org.springframework.transaction.interceptor.TransactionProxyFactoryBean">
    <property name="transactionManager" ref="transactionManager"/>
    <property name="target">
        <bean class="org.openmrs.module.ghanaemr.api.pharmacy.impl.PharmacyServiceImpl">
            <property name="dao" ref="pharmacyDAO"/>
            <property name="orderService" ref="orderService"/>
        </bean>
    </property>
    <property name="transactionAttributes">
        <props>
            <prop key="*">PROPAGATION_REQUIRED</prop>
        </props>
    </property>
</bean>

<!-- Pharmacy DAO -->
<bean id="pharmacyDAO"
      class="org.openmrs.module.ghanaemr.api.pharmacy.db.hibernate.HibernatePharmacyDAO">
    <property name="sessionFactory" ref="sessionFactory"/>
</bean>
```

### 6. Build OpenMRS Module

```bash
cd backend/openmrs-module-ghanaemr

# Clean build
mvn clean package -Dmaven.test.skip=true

# Expected: BUILD SUCCESS
# Expected output should show:
# [INFO] BUILD SUCCESS
# [INFO] Total time: ~45 seconds
```

### 7. Deploy Updated Module

```bash
# Copy new OMOD to OpenMRS
docker cp omod/target/ghanaemr-1.0.0-SNAPSHOT.omod medreg-openmrs:/openmrs/data/modules/

# Restart OpenMRS
docker restart medreg-openmrs

# Wait 2-3 minutes for restart
sleep 180

# Check logs for successful startup
docker logs medreg-openmrs 2>&1 | tail -50 | grep -i "Started OpenMRS"
```

### 8. Verify Spring Beans Loaded

```bash
# Check for pharmacy service bean initialization
docker logs medreg-openmrs 2>&1 | grep -i "pharmacyService\|pharmacyDAO"

# Expected output (similar to):
# INFO: Creating bean 'pharmacyDAO'
# INFO: Creating bean 'pharmacyService'
# INFO: Autowiring by type from bean name 'pharmacyService'
```

### 9. Test Service via MCP (If Available)

```bash
# Use OpenMRS MCP to verify service is available
# Query: "Check if PharmacyService bean is registered in Spring context"

# Or use Groovy console at: http://localhost:8080/openmrs/admin/maintenance/groovyConsole.form
```

**Groovy test code:**

```groovy
import org.openmrs.api.context.Context

// Get the service bean
def pharmacyService = Context.getService("org.openmrs.module.ghanaemr.api.pharmacy.PharmacyService")

// Verify it's not null
assert pharmacyService != null : "PharmacyService not found in Spring context"

// Verify methods exist
assert pharmacyService.metaClass.respondsTo(pharmacyService, "getPendingPrescriptions")
assert pharmacyService.metaClass.respondsTo(pharmacyService, "dispensePrescription")
assert pharmacyService.metaClass.respondsTo(pharmacyService, "getPatientPrescriptionHistory")

println "✅ PharmacyService successfully loaded in Spring context"
println "✅ Service class: ${pharmacyService.class.name}"
```

### Success Criteria

Mark this task as **DONE** when:
- ✅ All 4 Java files created (Service interface, ServiceImpl, DAO interface, DAO impl)
- ✅ Spring beans registered in moduleApplicationContext.xml
- ✅ Module builds successfully without errors
- ✅ Module deploys to OpenMRS without errors
- ✅ OpenMRS logs show pharmacyService and pharmacyDAO beans initialized
- ✅ No ClassNotFoundException or BeanCreationException errors
- ✅ (Optional) Groovy console test passes

### Troubleshooting

**Problem:** `ClassNotFoundException` for PharmacyService

**Solution:**
```bash
# Verify class files are in the OMOD JAR
jar -tf omod/target/ghanaemr-1.0.0-SNAPSHOT.omod | grep -i pharmacy

# Expected output:
# org/openmrs/module/ghanaemr/api/pharmacy/PharmacyService.class
# org/openmrs/module/ghanaemr/api/pharmacy/impl/PharmacyServiceImpl.class
# org/openmrs/module/ghanaemr/api/pharmacy/db/PharmacyDAO.class
# org/openmrs/module/ghanaemr/api/pharmacy/db/hibernate/HibernatePharmacyDAO.class
```

**Problem:** `UnsatisfiedDependencyException` - orderService not found

**Solution:**
- Verify `orderService` is referenced correctly (lowercase 'o')
- This is a core OpenMRS service, Spring provides it automatically
- Do NOT define orderService bean yourself

**Problem:** Hibernate query fails with "could not resolve property: location"

**Solution:**
- Check OpenMRS 2.4.0 data model - Encounter has `location` property
- Verify alias names in Criteria API match entity relationships
- Use `createAlias("encounter.location", "loc")` syntax

### Update Status After Completion

1. In OPENMRS_PROMPT_GUIDE.md, change status:
   ```markdown
   **Status:** ✅ DONE (Completed: 2025-11-XX)
   ```

2. Add completion report:
   ```markdown
   ### Completion Report (OPM-005)

   **Completed:** 2025-11-XX
   **Completed By:** [Worker name]

   **Verification Output:**
   [Paste Maven build output showing BUILD SUCCESS]
   [Paste Docker logs showing bean initialization]
   [Paste Groovy test output if available]

   **Notes:** [Any deviations or issues encountered]
   ```

3. Update Active Task Summary table - change status to DONE

### ✂️ COPY TO HERE ✂️

---

## OPM-006: Pharmacy REST Controller

**Status:** TODO
**Priority:** HIGH
**Created:** 2025-11-08
**Dependencies:** OPM-005 (PharmacyService must exist)
**Related Files:**
- `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/PharmacyController.java` (to be created)

### Context

This task creates the REST API endpoints that the frontend will call for pharmacy operations.

**Current State:**
- ✅ Consultation creates DrugOrders (Week 7-8)
- ❌ No REST endpoints for pharmacy yet (Task OPM-005 creates service)

**What This Task Does:**
1. Create PharmacyController with 3 endpoints:
   - `GET /ws/rest/v1/ghana/pharmacy/queue/{locationUuid}` - Pending prescriptions
   - `POST /ws/rest/v1/ghana/pharmacy/dispense` - Dispense a prescription
   - `GET /ws/rest/v1/ghana/pharmacy/patient/{patientUuid}/history` - Prescription history
2. Add authentication checks
3. Add error handling
4. Return JSON responses

### Related Frontend Context

**Frontend BFF routes that call these endpoints:**
- `frontend/src/app/api/pharmacy/queue/[location]/route.ts` (Task 13)
- `frontend/src/app/api/pharmacy/dispense/route.ts` (Task 13)

---

### ✂️ COPY FROM HERE ✂️

## Self-Contained Prompt for OpenMRS Worker

**Task:** Create PharmacyController REST endpoints

**Context:** You have OpenMRS MCP access. OPM-005 created the PharmacyService. This task exposes it via REST API.

**Prerequisites:**
- OPM-005 completed (PharmacyService bean exists)
- Module can build and deploy

**Steps to Execute:**

### 1. Create PharmacyController

**File:** `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/PharmacyController.java`

```java
package org.openmrs.module.ghanaemr.web;

import org.openmrs.DrugOrder;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.api.pharmacy.PharmacyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/rest/v1/ghana/pharmacy")
public class PharmacyController {

    /**
     * GET /rest/v1/ghana/pharmacy/queue/{locationUuid}
     * Get pending prescriptions for pharmacy queue
     */
    @RequestMapping(value = "/queue/{locationUuid}", method = RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<?> getQueue(@PathVariable String locationUuid,
                                       @RequestParam(defaultValue = "ACTIVE") String status) {
        try {
            if (!Context.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(errorResponse("Authentication required"));
            }

            PharmacyService pharmacyService = Context.getService(PharmacyService.class);
            List<DrugOrder> drugOrders = pharmacyService.getPendingPrescriptions(locationUuid, status);

            // Transform to JSON-friendly format
            List<Map<String, Object>> queue = drugOrders.stream().map(this::serializeDrugOrder).collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("count", queue.size());
            response.put("queue", queue);
            response.put("location", locationUuid);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse("Failed to retrieve pharmacy queue: " + e.getMessage()));
        }
    }

    /**
     * POST /rest/v1/ghana/pharmacy/dispense
     * Mark a prescription as dispensed
     */
    @RequestMapping(value = "/dispense", method = RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<?> dispensePrescription(@RequestBody Map<String, String> payload) {
        try {
            if (!Context.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(errorResponse("Authentication required"));
            }

            String drugOrderUuid = payload.get("drugOrderUuid");
            String dispensedBy = Context.getAuthenticatedUser().getUuid();
            String notes = payload.get("notes");

            if (drugOrderUuid == null || drugOrderUuid.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(errorResponse("drugOrderUuid is required"));
            }

            PharmacyService pharmacyService = Context.getService(PharmacyService.class);
            DrugOrder dispensed = pharmacyService.dispensePrescription(
                drugOrderUuid,
                dispensedBy,
                notes,
                new Date()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("drugOrder", serializeDrugOrder(dispensed));
            response.put("message", "Prescription dispensed successfully");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(errorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse("Failed to dispense prescription: " + e.getMessage()));
        }
    }

    /**
     * GET /rest/v1/ghana/pharmacy/patient/{patientUuid}/history
     * Get patient's prescription history
     */
    @RequestMapping(value = "/patient/{patientUuid}/history", method = RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<?> getPatientHistory(@PathVariable String patientUuid,
                                                @RequestParam(defaultValue = "10") int limit) {
        try {
            if (!Context.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(errorResponse("Authentication required"));
            }

            PharmacyService pharmacyService = Context.getService(PharmacyService.class);
            List<DrugOrder> history = pharmacyService.getPatientPrescriptionHistory(patientUuid, limit);

            List<Map<String, Object>> prescriptions = history.stream()
                .map(this::serializeDrugOrder)
                .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("patientUuid", patientUuid);
            response.put("count", prescriptions.size());
            response.put("prescriptions", prescriptions);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse("Failed to retrieve patient history: " + e.getMessage()));
        }
    }

    // Helper methods

    private Map<String, Object> serializeDrugOrder(DrugOrder drugOrder) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("uuid", drugOrder.getUuid());
        dto.put("orderNumber", drugOrder.getOrderNumber());
        dto.put("drug", drugOrder.getDrug() != null ? drugOrder.getDrug().getDisplayName() : "Unknown");
        dto.put("dose", drugOrder.getDose());
        dto.put("doseUnits", drugOrder.getDoseUnits() != null ? drugOrder.getDoseUnits().getDisplayString() : "");
        dto.put("frequency", drugOrder.getFrequency() != null ? drugOrder.getFrequency().getConcept().getDisplayString() : "");
        dto.put("duration", drugOrder.getDuration());
        dto.put("durationUnits", drugOrder.getDurationUnits() != null ? drugOrder.getDurationUnits().getDisplayString() : "");
        dto.put("quantity", drugOrder.getQuantity());
        dto.put("quantityUnits", drugOrder.getQuantityUnits() != null ? drugOrder.getQuantityUnits().getDisplayString() : "");
        dto.put("instructions", drugOrder.getDosingInstructions());
        dto.put("dateActivated", drugOrder.getDateActivated());
        dto.put("status", drugOrder.getAction().toString());

        // Patient info
        if (drugOrder.getPatient() != null) {
            Map<String, String> patient = new HashMap<>();
            patient.put("uuid", drugOrder.getPatient().getUuid());
            patient.put("name", drugOrder.getPatient().getPersonName().getFullName());
            patient.put("identifier", drugOrder.getPatient().getPatientIdentifier().getIdentifier());
            dto.put("patient", patient);
        }

        // Encounter info
        if (drugOrder.getEncounter() != null) {
            Map<String, String> encounter = new HashMap<>();
            encounter.put("uuid", drugOrder.getEncounter().getUuid());
            encounter.put("date", drugOrder.getEncounter().getEncounterDatetime().toString());
            dto.put("encounter", encounter);
        }

        return dto;
    }

    private Map<String, Object> errorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", true);
        error.put("message", message);
        return error;
    }
}
```

### 2. Build Module

```bash
cd backend/openmrs-module-ghanaemr
mvn clean package -Dmaven.test.skip=true

# Expected: BUILD SUCCESS
```

### 3. Deploy Module

```bash
docker cp omod/target/ghanaemr-1.0.0-SNAPSHOT.omod medreg-openmrs:/openmrs/data/modules/
docker restart medreg-openmrs
sleep 180
```

### 4. Test Endpoints

```bash
# Test 1: Get pharmacy queue (should return empty list if no prescriptions)
curl -X GET \
  'http://localhost:8080/openmrs/ws/rest/v1/ghana/pharmacy/queue/2b3c4d5e-6f70-4a81-9b01-2c3d4e5f6a7b' \
  -H 'Authorization: Basic QWRtaW46QWRtaW4xMjM=' \
  -H 'Content-Type: application/json'

# Expected: {"count": 0, "queue": [], "location": "..."}

# Test 2: Get patient history (use a real patient UUID from your system)
curl -X GET \
  'http://localhost:8080/openmrs/ws/rest/v1/ghana/pharmacy/patient/PATIENT_UUID/history?limit=5' \
  -H 'Authorization: Basic QWRtaW46QWRtaW4xMjM=' \
  -H 'Content-Type: application/json'

# Expected: {"patientUuid": "...", "count": N, "prescriptions": [...]}
```

### Success Criteria

- ✅ PharmacyController.java created with 3 endpoints
- ✅ Module builds successfully
- ✅ Module deploys without errors
- ✅ GET /queue endpoint returns JSON response
- ✅ GET /patient/{uuid}/history endpoint returns JSON response
- ✅ POST /dispense endpoint accepts requests (full test requires DrugOrder to exist)
- ✅ Authentication checks prevent unauthenticated access

### Troubleshooting

**Problem:** 404 Not Found when calling endpoints

**Solution:**
- Verify URL path: `/openmrs/ws/rest/v1/ghana/pharmacy/...`
- Check OpenMRS logs for controller registration
- Ensure `@Controller` and `@RequestMapping` annotations present

**Problem:** 500 Internal Server Error

**Solution:**
- Check OpenMRS logs: `docker logs medreg-openmrs | tail -100`
- Verify PharmacyService bean is loaded (from OPM-005)
- Check for NullPointerException in stack trace

### Update Status After Completion

1. Change status to DONE in OPENMRS_PROMPT_GUIDE.md
2. Add completion report with curl test outputs
3. Update Active Task Summary table

### ✂️ COPY TO HERE ✂️

---

## OPM-007: Pharmacy Service Unit Tests

**Status:** TODO
**Priority:** MEDIUM
**Created:** 2025-11-08
**Dependencies:** OPM-005 (PharmacyService implementation)
**Related Files:**
- `backend/openmrs-module-ghanaemr/api/src/test/java/org/openmrs/module/ghanaemr/api/pharmacy/PharmacyServiceTest.java` (to be created)

### Context

Add unit tests for PharmacyService to ensure dispensing logic works correctly.

**Current State:**
- ✅ PharmacyService implementation exists (OPM-005)
- ❌ No unit tests yet

**What This Task Does:**
1. Create PharmacyServiceTest with JUnit + Mockito
2. Test getPendingPrescriptions()
3. Test dispensePrescription()
4. Test getPatientPrescriptionHistory()
5. Run tests and verify all pass

### Related Frontend Context

Tests ensure backend logic is correct before frontend integration (Tasks 13-16).

---

### ✂️ COPY FROM HERE ✂️

## Self-Contained Prompt for OpenMRS Worker

**Task:** Create unit tests for PharmacyService

**Context:** OPM-005 created PharmacyService. Add unit tests to verify logic.

**Prerequisites:**
- OPM-005 completed
- JUnit 4.x and Mockito 3.12.4 in pom.xml (already configured)

**Steps to Execute:**

### 1. Create Test Class

**File:** `backend/openmrs-module-ghanaemr/api/src/test/java/org/openmrs/module/ghanaemr/api/pharmacy/PharmacyServiceTest.java`

```java
package org.openmrs.module.ghanaemr.api.pharmacy;

import org.junit.Before;
import org.junit.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openmrs.DrugOrder;
import org.openmrs.Order;
import org.openmrs.api.OrderService;
import org.openmrs.module.ghanaemr.api.pharmacy.db.PharmacyDAO;
import org.openmrs.module.ghanaemr.api.pharmacy.impl.PharmacyServiceImpl;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

public class PharmacyServiceTest {

    @Mock
    private PharmacyDAO dao;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private PharmacyServiceImpl pharmacyService;

    @Before
    public void setUp() {
        MockitoAnnotations.initMocks(this);
    }

    @Test
    public void testGetPendingPrescriptions_Success() {
        // Arrange
        String locationUuid = "pharmacy-location-uuid";
        String status = "ACTIVE";
        List<DrugOrder> mockOrders = new ArrayList<>();
        DrugOrder order1 = new DrugOrder();
        order1.setUuid("order-1");
        mockOrders.add(order1);

        when(dao.getPendingDrugOrders(locationUuid, status)).thenReturn(mockOrders);

        // Act
        List<DrugOrder> result = pharmacyService.getPendingPrescriptions(locationUuid, status);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("order-1", result.get(0).getUuid());
        verify(dao, times(1)).getPendingDrugOrders(locationUuid, status);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetPendingPrescriptions_NullLocation() {
        // Act
        pharmacyService.getPendingPrescriptions(null, "ACTIVE");

        // Assert - expects IllegalArgumentException
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetPendingPrescriptions_EmptyLocation() {
        // Act
        pharmacyService.getPendingPrescriptions("", "ACTIVE");

        // Assert - expects IllegalArgumentException
    }

    @Test
    public void testDispensePrescription_Success() {
        // Arrange
        String drugOrderUuid = "drug-order-uuid";
        String dispensedBy = "pharmacist-uuid";
        String notes = "Dispensed at 10:30 AM";
        Date dispensedAt = new Date();

        DrugOrder mockOrder = new DrugOrder();
        mockOrder.setUuid(drugOrderUuid);

        when(orderService.getOrderByUuid(drugOrderUuid)).thenReturn(mockOrder);
        when(orderService.discontinueOrder(any(DrugOrder.class), anyString(), any(Date.class), any(), any()))
            .thenReturn(mockOrder);

        // Act
        DrugOrder result = pharmacyService.dispensePrescription(drugOrderUuid, dispensedBy, notes, dispensedAt);

        // Assert
        assertNotNull(result);
        verify(orderService, times(1)).getOrderByUuid(drugOrderUuid);
        verify(orderService, times(1)).discontinueOrder(any(), anyString(), any(), any(), any());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testDispensePrescription_NullUuid() {
        // Act
        pharmacyService.dispensePrescription(null, "user", "notes", new Date());

        // Assert - expects IllegalArgumentException
    }

    @Test(expected = IllegalArgumentException.class)
    public void testDispensePrescription_OrderNotFound() {
        // Arrange
        when(orderService.getOrderByUuid("non-existent-uuid")).thenReturn(null);

        // Act
        pharmacyService.dispensePrescription("non-existent-uuid", "user", "notes", new Date());

        // Assert - expects IllegalArgumentException
    }

    @Test
    public void testGetPatientPrescriptionHistory_Success() {
        // Arrange
        String patientUuid = "patient-uuid";
        int limit = 10;
        List<DrugOrder> mockHistory = new ArrayList<>();
        DrugOrder order1 = new DrugOrder();
        order1.setUuid("order-1");
        mockHistory.add(order1);

        when(dao.getPatientDrugOrderHistory(patientUuid, limit)).thenReturn(mockHistory);

        // Act
        List<DrugOrder> result = pharmacyService.getPatientPrescriptionHistory(patientUuid, limit);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("order-1", result.get(0).getUuid());
        verify(dao, times(1)).getPatientDrugOrderHistory(patientUuid, limit);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetPatientPrescriptionHistory_NullPatient() {
        // Act
        pharmacyService.getPatientPrescriptionHistory(null, 10);

        // Assert - expects IllegalArgumentException
    }
}
```

### 2. Run Tests

```bash
cd backend/openmrs-module-ghanaemr

# Run only PharmacyServiceTest
mvn test -Dtest=PharmacyServiceTest

# Expected output:
# Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
# BUILD SUCCESS
```

### 3. Run All API Tests

```bash
# Run all tests in api module
mvn test -pl api

# Verify no regressions in other tests
```

### Success Criteria

- ✅ PharmacyServiceTest.java created with 8 test methods
- ✅ All 8 tests pass
- ✅ Code coverage for PharmacyServiceImpl methods: getPendingPrescriptions, dispensePrescription, getPatientPrescriptionHistory
- ✅ Tests verify null/empty input validation
- ✅ Tests verify DAO method calls
- ✅ No regressions in existing tests

### Troubleshooting

**Problem:** MockitoAnnotations.initMocks() deprecated warning

**Solution:**
- Mockito 3.12.4 supports initMocks()
- Ignore warning for Java 8 compatibility
- Alternative: Use @RunWith(MockitoJUnitRunner.class) annotation

**Problem:** Tests fail with NullPointerException

**Solution:**
- Ensure @Mock and @InjectMocks annotations present
- Verify initMocks() called in @Before method
- Check mock setup uses correct method signatures

### Update Status After Completion

1. Change status to DONE
2. Add completion report with test output
3. Update Active Task Summary table

### ✂️ COPY TO HERE ✂️

---

## FRONTEND TASKS (Add to PROMPT_QUEUE.md)

---

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

---

## Summary: Pharmacy Module Task Breakdown

**Backend Tasks (OPENMRS_PROMPT_GUIDE.md):**
1. OPM-005: Pharmacy Service Layer (Service + DAO) - 5 hours
2. OPM-006: Pharmacy REST Controller - 3 hours
3. OPM-007: Pharmacy Service Unit Tests - 2 hours

**Frontend Tasks (PROMPT_QUEUE.md):**
4. Task 13: Pharmacy BFF API Routes - 3 hours
5. Task 14: Pharmacy Queue Page - 4 hours
6. Task 15: Dispense Modal Component - 3 hours
7. Task 16: E2E Pharmacy Workflow Testing - 3 hours

**Total Estimated Time:** 23 hours (~3-4 days with 1 developer, ~1-2 days with 2 developers)

**Dependencies:**
- OPM-005 must complete before OPM-006
- OPM-005 must complete before OPM-007
- OPM-006 must complete before Task 13
- Task 13 must complete before Task 14
- Task 14 must complete before Task 15
- Tasks 13-15 must complete before Task 16

**Critical Path:** OPM-005 → OPM-006 → Task 13 → Task 14 → Task 15 → Task 16
