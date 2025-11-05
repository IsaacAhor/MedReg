# OpenMRS Backend Task Guide

**Purpose:** This file tracks all OpenMRS backend configuration, database schema, Java service implementation, and Spring wiring tasks that require OpenMRS MCP access.

**For Regular Workers (No OpenMRS MCP):** When you identify OpenMRS backend work, add a new entry here with status `TODO` and include all context.

**For OpenMRS Workers (With OpenMRS MCP):** Copy the entire prompt block for a `TODO` task, execute it, then update status to `DONE`.

---

## 🚨 BEFORE STARTING ANY TASK 🚨

**STOP!** Have you read [AGENTS.md](AGENTS.md) in this session?

- ✅ **Yes** → Proceed with OpenMRS tasks below
- ❌ **No** → **READ [AGENTS.md](AGENTS.md) NOW** before continuing

**You must understand:**
- Java 8 ONLY (not Java 11+)
- OpenMRS Platform 2.4.0 ONLY (not 3.x)
- MySQL 5.7 ONLY (not 8.0)
- OpenMRS config.xml structure requirements (child elements, not attributes)

**Every OpenMRS task requires this knowledge.** Missing it causes errors and delays.

---

## Active Task Summary

| ID | Task | Status | Priority | Dependencies |
|----|------|--------|----------|--------------|
| OPM-000 | Complete OpenMRS Module Loading Fix | DONE | CRITICAL | None |
| OPM-001 | Queue Management Database Schema | DONE | CRITICAL | OPM-000 |
| OPM-002 | Queue Service Spring Bean Registration | TODO | CRITICAL | OPM-001 |
| OPM-003 | Patient Registration Auto-Queue Addition | TODO | HIGH | OPM-001, OPM-002 |
| OPM-004 | Location UUIDs Configuration | TODO | HIGH | None |

**NOTE:** OPM-000 and OPM-001 completed on November 5, 2025. Module successfully loads on Platform 2.4.0 with all database tables created. Production environment now running on Reference Application 2.12.0 (Platform 2.4.0).

---

## Task Status Legend

- **TODO** - Not started, ready for OpenMRS worker
- **IN_PROGRESS** - Currently being worked on
- **BLOCKED** - Waiting on dependency or decision
- **DONE** - Completed and verified
- **CANCELLED** - No longer needed

---

## OPM-000: Complete OpenMRS Module Loading Fix

**Status:** ✅ DONE (100% Complete - November 5, 2025)
**Priority:** CRITICAL
**Created:** 2025-11-05
**Completed:** 2025-11-05
**Dependencies:** None

### Context

Ghana EMR module fails to load due to incomplete config.xml structure. Two validation errors discovered sequentially:

**Resolution Summary:**
- ✅ Error #1 FIXED: "Name cannot be empty" (attributes → child elements)
- ✅ Error #2 FIXED: Added `<package>` element to config.xml
- ✅ Platform downgraded from 2.6.0 → 2.4.0 (Reference Application 2.12.0)
- ✅ Module builds successfully (20MB with 27 JARs)
- ✅ Test environment deployed successfully (Platform 2.4.0)
- ✅ Production environment updated to Platform 2.4.0
- ✅ Module loads successfully with no errors
- ✅ Liquibase migrations executed successfully

### Required Fix

Add `<package>org.openmrs.module.ghanaemr</package>` to config.xml after `<version>` element.

### Next Steps

1. Add package element to config.xml
2. Rebuild: `mvn clean package -Dmaven.test.skip=true`
3. Rebuild Docker: `docker-compose -f docker-compose.test.yml build --no-cache`
4. Restart environment: `docker-compose -f docker-compose.test.yml down -v && up -d`
5. Verify module loads: `docker logs medreg-test-openmrs 2>&1 | grep -i "ghana"`

### Technical Details

See [OPENMRS_MODULE_FIX_IMPLEMENTATION.md](OPENMRS_MODULE_FIX_IMPLEMENTATION.md) Step 1.5 for complete corrected config.xml

---

## OPM-001: Queue Management Database Schema

**Status:** ✅ DONE (100% Complete - November 5, 2025)
**Priority:** CRITICAL
**Created:** 2025-11-03
**Completed:** 2025-11-05
**Dependencies:** OPM-000
**Related Files:**
- `backend/openmrs-module-ghanaemr/api/src/main/resources/liquibase-queue-management.xml` (already created)
- `backend/openmrs-module-ghanaemr/api/src/main/resources/liquibase.xml` (already includes the file)

### Context

The queue management system needs a database table `ghanaemr_patient_queue` to track patients as they move through Triage → Consultation → Pharmacy workflow stations.

**Completion Summary:**
- ✅ Liquibase changeset file `liquibase-queue-management.xml` created
- ✅ Main `liquibase.xml` includes: `<include file="liquibase-queue-management.xml"/>`
- ✅ Module Activator class created (`GhanaEMRActivator.java`)
- ✅ `config.xml` updated with activator reference
- ✅ Module built successfully (110KB OMOD)
- ✅ Module loads successfully on Platform 2.4.0
- ✅ All database tables created: ghanaemr_patient_queue, ghanaemr_nhie_transaction_log, ghanaemr_nhie_coverage_cache
- ✅ All foreign keys (6) and indexes (2) created on ghanaemr_patient_queue
- ✅ Liquibase migrations executed successfully

**What This Task Does:**
1. Builds the OpenMRS module with Maven
2. Deploys the module to OpenMRS
3. Verifies Liquibase created the `ghanaemr_patient_queue` table
4. Verifies all indexes and foreign keys created successfully

### Database Schema Details

**Table:** `ghanaemr_patient_queue`

**Key Columns:**
- `queue_id` (PK, auto-increment)
- `patient_id` (FK to patient table)
- `visit_id` (FK to visit table)
- `location_from_id` (FK to location - where patient came from)
- `location_to_id` (FK to location - where patient is going)
- `status` (VARCHAR: PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- `queue_number` (VARCHAR: TR001, CN001, PH001 format)
- `priority` (INT: 1-10, default 5)
- `date_created`, `date_changed`, `creator`, `changed_by`

**Indexes:**
- `idx_queue_status` (for filtering by status)
- `idx_queue_location_to` (for location-based queue queries)
- `idx_queue_date_created` (for sorting by wait time)
- `idx_queue_patient` (for patient lookup)

### Related Frontend Context

**Frontend pages that depend on this:**
- `frontend/src/app/opd/triage-queue/page.tsx` - Needs to query triage queue
- `frontend/src/app/opd/consultation-queue/page.tsx` - Needs to query consultation queue
- `frontend/src/app/opd/pharmacy-queue/page.tsx` - Needs to query pharmacy queue

**Frontend API routes:**
- `frontend/src/app/api/opd/queue/[location]/route.ts` - GET queue by location
- `frontend/src/app/api/opd/queue/move/route.ts` - POST to move patient to next station

### Related Backend Code (Already Created)

**Java Service Classes (Already Exist):**
- `backend/.../api/queue/PatientQueueService.java` (interface)
- `backend/.../api/queue/impl/PatientQueueServiceImpl.java` (implementation)
- `backend/.../api/queue/db/PatientQueueDAO.java` (DAO interface)
- `backend/.../api/queue/db/hibernate/HibernatePatientQueueDAO.java` (DAO implementation)
- `backend/.../api/queue/model/PatientQueue.java` (entity model)
- `backend/.../api/queue/model/QueueStatus.java` (enum)

### BLOCKER REPORT - Module Not Loading (RESOLVED)

**Date:** 2025-11-04
**Severity:** CRITICAL → RESOLVED
**Attempts:** 15+ deployment methods tried over 6 hours
**Resolution Date:** 2025-11-04 04:30 AM
**Status:** ROOT CAUSE IDENTIFIED - Docker build approach was fundamentally flawed

**Problem:** The Ghana EMR module (OMOD) is physically present in the Docker container but OpenMRS completely ignores it. No loading attempt, no errors, complete silence.

**Evidence:**
```bash
# Module EXISTS in container
$ docker exec medreg-openmrs ls -lh /usr/local/tomcat/.OpenMRS/modules/
-rwxr-xr-x 1 root root 110K openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod

# Module NOT in REST API
$ curl -u admin:Admin123 http://localhost:8080/openmrs/ws/rest/v1/module | grep ghana
(empty - module not loaded)

# NO logs mentioning module
$ grep -i ghana /usr/local/tomcat/.OpenMRS/openmrs.log
(empty - no loading attempt logged)

# NO lib-cache directory
$ ls /usr/local/tomcat/.OpenMRS/.openmrs-lib-cache/ | grep ghana
(empty - module never unpacked)
```

**Deployment Methods Attempted:**
1. ✗ Copied to `/usr/local/tomcat/webapps/openmrs/WEB-INF/bundledModules/`
2. ✗ Created custom Docker image with module baked into bundledModules
3. ✗ Copied to Application Data directory (`/usr/local/tomcat/.OpenMRS/modules/`)
4. ✗ Cold start with cache clear (`rm -rf .openmrs-lib-cache/*`)
5. ✗ Multiple container restarts (docker-compose restart)
6. ✗ Full down/up cycle (docker-compose down && up)
7. ✗ Direct OMOD file volume mount in docker-compose.yml
8. ✗ Cleared Docker build cache and rebuilt
9. ✗ Verified and re-verified module structure (config.xml, Activator class, etc.)

**Module Validation:**
- ✅ config.xml format valid (moduleId="ghanaemr", activator specified)
- ✅ Activator class compiled and present in API JAR
- ✅ Liquibase files present in resources
- ✅ Spring context file (moduleApplicationContext.xml) present
- ✅ Platform version requirement correct (2.6.0)
- ✅ No dependency conflicts
- ✅ File permissions correct (755)
- ✅ OMOD structure validated with unzip

**ROOT CAUSE IDENTIFIED:**

The custom Dockerfile approach was fundamentally broken. The issue was NOT with module packaging (which was correct all along), but with HOW the Docker image was built:

1. **Dockerfile copied module to `/usr/local/tomcat/webapps/openmrs/WEB-INF/bundledModules/` at BUILD TIME**
2. **Tomcat extracts `openmrs.war` at RUNTIME, OVERWRITING the entire `/webapps/openmrs/` directory**
3. **Result: Module was lost before OpenMRS even started scanning for modules**

**Evidence:**
- Base image deployment: OpenMRS started in 71 seconds (normal)
- Custom image deployment: OpenMRS "deployed" in 200ms (impossible - WAR not extracted)
- OMOD structure validation: ✅ config.xml, liquibase.xml, activator all present and correct

**WORKING SOLUTION:**

Use volume mounting to Application Data directory WITHOUT custom Docker build:

```yaml
openmrs:
  image: openmrs/openmrs-reference-application-distro:2.11.0  # Use base image directly
  volumes:
    - openmrs_data:/usr/local/tomcat/.OpenMRS
    - ./backend/openmrs-module-ghanaemr/omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod:/usr/local/tomcat/.OpenMRS/modules/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod
```

**Critical Caveat:**
Volume-mounted modules are NOT automatically scanned on existing installations. Must either:
1. Start with fresh volumes (`docker-compose down -v && docker-compose up`)
2. Use entrypoint script to copy module before OpenMRS starts
3. Upload via OpenMRS Admin UI after first start

**Recommended Production Approach:**
Create custom entrypoint script that copies module into Application Data directory BEFORE starting Tomcat:

```bash
#!/bin/bash
# Copy Ghana EMR module to modules directory if not already present
if [ ! -f /usr/local/tomcat/.OpenMRS/modules/ghanaemr.omod ]; then
    cp /modules-to-install/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod /usr/local/tomcat/.OpenMRS/modules/
fi
# Start OpenMRS
exec catalina.sh run
```

**Files Modified for This Attempt:**
- Created: `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/GhanaEMRActivator.java`
- Updated: `backend/openmrs-module-ghanaemr/omod/src/main/resources/config.xml`
- Created: `backend/openmrs-module-ghanaemr/Dockerfile`
- Updated: `docker-compose.yml`

**Recommendation:**
PAUSE further attempts until we get guidance from OpenMRS community experts or switch to a fundamentally different deployment approach.

---

### ✂️ COPY FROM HERE ✂️

## Self-Contained Prompt for OpenMRS Worker

**Task:** Build and deploy OpenMRS module to create queue management database schema

**Context:** You have OpenMRS MCP access. The MedReg application needs a queue management table to track patients through the OPD workflow (Triage → Consultation → Pharmacy).

**Prerequisites:**
- Docker container `medreg-openmrs` running
- Docker container `medreg-mysql` running
- MySQL credentials: root/root_password, database: openmrs

**Steps to Execute:**

### 1. Verify Liquibase Files Exist

```bash
# Check main liquibase file
cat backend/openmrs-module-ghanaemr/api/src/main/resources/liquibase.xml | grep "liquibase-queue-management"

# Expected output: <include file="liquibase-queue-management.xml"/>

# Check queue changeset exists
ls -la backend/openmrs-module-ghanaemr/api/src/main/resources/liquibase-queue-management.xml

# Expected: File exists with ~200 lines
```

### 2. Build OpenMRS Module

```bash
cd backend/openmrs-module-ghanaemr

# Clean and build (skip tests for speed)
mvn clean install -DskipTests

# Expected output: BUILD SUCCESS
# Look for: ghanaemr-1.0.0-SNAPSHOT.omod in omod/target/
```

### 3. Deploy Module to OpenMRS

```bash
# Copy OMOD file to OpenMRS modules directory
docker cp omod/target/ghanaemr-1.0.0-SNAPSHOT.omod medreg-openmrs:/openmrs/data/modules/

# Restart OpenMRS to load the module
docker restart medreg-openmrs

# Wait for OpenMRS to restart (2-3 minutes)
# Monitor logs for startup completion
docker logs -f medreg-openmrs | grep "Started OpenMRS"
```

### 4. Verify Database Table Created

```bash
# Check table exists
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e "SHOW TABLES LIKE 'ghanaemr_patient_queue';"

# Expected output:
# +---------------------------------------------------+
# | Tables_in_openmrs (ghanaemr_patient_queue)       |
# +---------------------------------------------------+
# | ghanaemr_patient_queue                           |
# +---------------------------------------------------+

# Verify table structure
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e "DESCRIBE ghanaemr_patient_queue;"

# Expected columns:
# - queue_id (bigint, PK, auto_increment)
# - patient_id (int)
# - visit_id (int)
# - location_from_id (int)
# - location_to_id (int)
# - status (varchar 20)
# - queue_number (varchar 20)
# - priority (int, default 5)
# - date_created, date_changed, creator, changed_by, voided, etc.
```

### 5. Verify Indexes Created

```bash
# Check indexes
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e "SHOW INDEX FROM ghanaemr_patient_queue;"

# Expected indexes:
# - PRIMARY (queue_id)
# - idx_queue_status
# - idx_queue_location_to
# - idx_queue_date_created
# - idx_queue_patient
# - FK indexes for foreign keys
```

### 6. Verify Foreign Keys Created

```bash
# Check foreign key constraints
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e "
SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'ghanaemr_patient_queue'
AND CONSTRAINT_SCHEMA = 'openmrs'
AND REFERENCED_TABLE_NAME IS NOT NULL;
"

# Expected foreign keys:
# - patient_id → patient.patient_id
# - visit_id → visit.visit_id
# - location_from_id → location.location_id
# - location_to_id → location.location_id
# - creator → users.user_id
# - changed_by → users.user_id
```

### 7. Verify Liquibase Changelog Recorded

```bash
# Check Liquibase recorded the changesets
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e "
SELECT ID, AUTHOR, FILENAME, DATEEXECUTED, EXECTYPE
FROM DATABASECHANGELOG
WHERE FILENAME = 'liquibase-queue-management.xml'
ORDER BY DATEEXECUTED DESC;
"

# Expected: At least one row showing successful execution
```

### 8. Test Table with Sample Data

```bash
# Insert test queue entry (we'll delete it after)
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e "
USE openmrs;

-- Get a real patient_id, visit_id, location_id from database
SELECT
    p.patient_id,
    v.visit_id,
    l.location_id AS triage_location,
    u.user_id
FROM patient p
JOIN visit v ON p.patient_id = v.patient_id
JOIN location l ON l.name LIKE '%triage%' OR l.name LIKE '%Triage%'
JOIN users u ON u.username = 'admin'
WHERE p.voided = 0 AND v.voided = 0
LIMIT 1;
"

# Use the IDs from above to insert test row
# Replace <patient_id>, <visit_id>, <location_id>, <user_id> with actual values
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e "
USE openmrs;

INSERT INTO ghanaemr_patient_queue
(patient_id, visit_id, location_to_id, status, queue_number, priority, date_created, creator, uuid)
VALUES
(<patient_id>, <visit_id>, <location_id>, 'PENDING', 'TR001', 5, NOW(), <user_id>, UUID());

-- Verify insert
SELECT * FROM ghanaemr_patient_queue ORDER BY date_created DESC LIMIT 1;

-- Clean up test data
DELETE FROM ghanaemr_patient_queue WHERE queue_number = 'TR001';
"
```

### Success Criteria

Mark this task as **DONE** when:
- ✅ Table `ghanaemr_patient_queue` exists in OpenMRS database
- ✅ All columns present with correct data types
- ✅ All indexes created
- ✅ All foreign keys created
- ✅ Liquibase changelog recorded
- ✅ Test insert/select/delete successful
- ✅ OpenMRS logs show no errors related to module

### Troubleshooting

**Problem:** Table not created after module deployment

**Solution:**
```bash
# Check OpenMRS logs for Liquibase errors
docker logs medreg-openmrs | grep -i "liquibase\|error\|exception" | tail -50

# Common issues:
# 1. Liquibase changeset ID already ran (check DATABASECHANGELOG table)
# 2. Foreign key references non-existent table (check table names)
# 3. Duplicate index names (check existing indexes)
```

**Problem:** BUILD FAILURE when running Maven

**Solution:**
```bash
# Check Java version
java -version
# Required: Java 8 or 11

# Check Maven version
mvn -version
# Required: Maven 3.6+

# Clear Maven cache and retry
mvn clean install -U -DskipTests
```

### Update Status After Completion

After successfully completing this task, update this file:

1. Change status at top: `OPM-001: Queue Management Database Schema | TODO` → `DONE`
2. Add completion date
3. Copy verification output to a new section below:

```markdown
### Completion Report (OPM-001)

**Completed:** YYYY-MM-DD
**Completed By:** [Your Name/Worker ID]

**Verification Output:**

[Paste output from step 4 (DESCRIBE table)]

[Paste output from step 5 (SHOW INDEX)]

[Paste output from step 6 (Foreign keys)]

**Notes:** [Any issues encountered or deviations from plan]
```

### ✂️ COPY TO HERE ✂️

---

### Blocker Report (OPM-001)

**Observed:** 2025-11-03
**Worker:** Codex (OpenMRS MCP)

**Summary:** After redeploying the refreshed module and restarting OpenMRS, the queue table `ghanaemr_patient_queue` was not created. Liquibase changelog shows no entries corresponding to `liquibase-queue-management.xml`.

**Evidence (verification outputs):

1) Table existence check (information_schema):

```
mysql> SELECT COUNT(*) AS tables_count
       FROM information_schema.tables
       WHERE table_schema='openmrs'
         AND table_name='ghanaemr_patient_queue';

tables_count
0
```

2) Liquibase changelog (recent entries):

```
mysql> SELECT ID, AUTHOR, FILENAME, DATEEXECUTED, EXECTYPE
       FROM liquibasechangelog
       ORDER BY DATEEXECUTED DESC LIMIT 10;

ID	AUTHOR	FILENAME	DATEEXECUTED	EXECTYPE
20161011-001	themoonraker13	liquibase.xml	2025-11-01 01:58:10	EXECUTED
2018Jun28-1	Chew Chia Shao Yuan	liquibase.xml	2025-11-01 01:58:09	EXECUTED
appframework-1	djazayeri	liquibase.xml	2025-11-01 01:58:09	EXECUTED
... (core modules only; no ghanaemr queue entry)
```

3) OMOD contents (no liquibase files bundled):

```
unzip -l /usr/local/tomcat/.OpenMRS/modules/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod

... (only web controllers/classes; no config.xml, no liquibase.xml, no /lib with API jar)
```

**Root cause (likely):** The OMOD packaging does not include a module `config.xml` (and related packaging) that registers Liquibase changes or bundles the API jar/resources where `liquibase.xml` and `liquibase-queue-management.xml` reside. As a result, OpenMRS did not execute the queue changeset on startup.

**Remediation Plan:**
- Add `omod/src/main/resources/config.xml` with proper module metadata and database update configuration referencing `liquibase.xml` on the classpath.
- Update `omod/pom.xml` to build a proper `.omod` artifact that bundles the API jar (containing `liquibase.xml` and changesets) under `/lib` and includes `config.xml` at the root.
- Rebuild and redeploy the module, then re-run the OPM-001 verification queries.

**Next Steps (proposed tasks):**
- OPM-001A: Fix OMOD packaging and Liquibase registration (CRITICAL)
  - Deliver: valid `.omod` with `config.xml`, API jar under `/lib`, and Liquibase changes registered
  - Verify: `liquibasechangelog` contains entries for `liquibase-queue-management.xml`; table exists

Until the above is addressed, OPM-001 remains BLOCKED.

---

## OPM-002: Queue Service Spring Bean Registration

**Status:** TODO
**Priority:** CRITICAL
**Created:** 2025-11-03
**Dependencies:** OPM-001 (Database table must exist first)
**Related Files:**
- `backend/openmrs-module-ghanaemr/api/src/main/resources/moduleApplicationContext.xml` (already created)
- `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/queue/PatientQueueService.java`

### Context

The Java service classes for queue management are already written, but Spring needs to know about them. This task registers the `PatientQueueService` bean in the Spring application context.

**Current State:**
- ✅ Java service interface created: `PatientQueueService.java`
- ✅ Java service implementation created: `PatientQueueServiceImpl.java`
- ✅ DAO interface created: `PatientQueueDAO.java`
- ✅ DAO implementation created: `HibernatePatientQueueDAO.java`
- ✅ Spring config file created: `moduleApplicationContext.xml`
- ❌ Spring bean not yet registered (needs edit + module rebuild/deploy)

**What This Task Does:**
1. Verifies `moduleApplicationContext.xml` contains bean definitions
2. If missing, adds bean definitions for service and DAO
3. Rebuilds and redeploys module
4. Verifies beans are loaded by Spring

### Related Frontend Context

**Frontend API routes that depend on this:**
- `frontend/src/app/api/opd/queue/[location]/route.ts` - Calls OpenMRS REST endpoint that uses `PatientQueueService`
- `frontend/src/app/api/opd/queue/move/route.ts` - Calls OpenMRS REST endpoint to move patients

---

### ✂️ COPY FROM HERE ✂️

## Self-Contained Prompt for OpenMRS Worker

**Task:** Register PatientQueueService Spring beans in OpenMRS module

**Context:** You have OpenMRS MCP access. The queue service Java classes are written, but Spring doesn't know about them yet. This task registers the beans so OpenMRS can inject them.

**Prerequisites:**
- OPM-001 completed (database table exists)
- Docker container `medreg-openmrs` running

**Steps to Execute:**

### 1. Check Current Spring Configuration

```bash
# View current moduleApplicationContext.xml
cat backend/openmrs-module-ghanaemr/api/src/main/resources/moduleApplicationContext.xml

# Look for:
# - <bean id="patientQueueService" ...>
# - <bean id="patientQueueDAO" ...>
```

### 2. Verify Bean Definitions Exist

**Expected content in `moduleApplicationContext.xml`:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans-3.0.xsd">

    <!-- Patient Queue Service -->
    <bean id="patientQueueService"
          class="org.springframework.transaction.interceptor.TransactionProxyFactoryBean">
        <property name="transactionManager" ref="transactionManager"/>
        <property name="target">
            <bean class="org.openmrs.module.ghanaemr.api.queue.impl.PatientQueueServiceImpl">
                <property name="dao" ref="patientQueueDAO"/>
            </bean>
        </property>
        <property name="transactionAttributes">
            <props>
                <prop key="*">PROPAGATION_REQUIRED</prop>
            </props>
        </property>
    </bean>

    <!-- Patient Queue DAO -->
    <bean id="patientQueueDAO"
          class="org.openmrs.module.ghanaemr.api.queue.db.hibernate.HibernatePatientQueueDAO">
        <property name="sessionFactory" ref="sessionFactory"/>
    </bean>

</beans>
```

**If beans are missing, add them using MCP tools or manual edit.**

### 3. Rebuild OpenMRS Module

```bash
cd backend/openmrs-module-ghanaemr

# Clean build
mvn clean install -DskipTests

# Expected: BUILD SUCCESS
```

### 4. Deploy Updated Module

```bash
# Copy new OMOD to OpenMRS
docker cp omod/target/ghanaemr-1.0.0-SNAPSHOT.omod medreg-openmrs:/openmrs/data/modules/

# Restart OpenMRS
docker restart medreg-openmrs

# Wait 2-3 minutes for restart
docker logs -f medreg-openmrs | grep "Started OpenMRS"
```

### 5. Verify Beans Loaded

```bash
# Check OpenMRS logs for Spring bean initialization
docker logs medreg-openmrs | grep -i "patientQueueService\|patientQueueDAO"

# Expected output (similar to):
# INFO: Creating bean 'patientQueueDAO'
# INFO: Creating bean 'patientQueueService'
# INFO: Autowiring by type from bean name 'patientQueueService' ...
```

### 6. Test Service via OpenMRS Groovy Console (Optional)

If OpenMRS has Groovy console enabled:

```groovy
// Access via: http://localhost:8080/openmrs/admin/maintenance/groovyConsole.form

import org.openmrs.api.context.Context

// Get the service bean
def queueService = Context.getService("org.openmrs.module.ghanaemr.api.queue.PatientQueueService")

// Verify it's not null
assert queueService != null : "Service not found in Spring context"

// Verify methods exist
assert queueService.metaClass.respondsTo(queueService, "addToQueue")
assert queueService.metaClass.respondsTo(queueService, "getQueueByLocationAndStatus")

println "✅ PatientQueueService successfully loaded in Spring context"
println "✅ Service class: ${queueService.class.name}"
```

### 7. Verify DAO Session Factory Injection

```bash
# Check OpenMRS logs for session factory injection
docker logs medreg-openmrs | grep -i "sessionFactory" | grep -i "patientQueue"

# Should see successful dependency injection
```

### Success Criteria

Mark this task as **DONE** when:
- ✅ `moduleApplicationContext.xml` contains bean definitions
- ✅ Module builds successfully
- ✅ Module deploys without errors
- ✅ OpenMRS logs show beans initialized
- ✅ No errors in OpenMRS logs related to bean creation
- ✅ (Optional) Groovy console test passes

### Troubleshooting

**Problem:** Bean creation fails with `ClassNotFoundException`

**Solution:**
```bash
# Verify Java class files are in the OMOD
jar -tf omod/target/ghanaemr-1.0.0-SNAPSHOT.omod | grep PatientQueue

# Expected output:
# org/openmrs/module/ghanaemr/api/queue/PatientQueueService.class
# org/openmrs/module/ghanaemr/api/queue/impl/PatientQueueServiceImpl.class
# org/openmrs/module/ghanaemr/api/queue/db/PatientQueueDAO.class
# org/openmrs/module/ghanaemr/api/queue/db/hibernate/HibernatePatientQueueDAO.class
```

**Problem:** `UnsatisfiedDependencyException` - sessionFactory not found

**Solution:**
- Ensure `moduleApplicationContext.xml` references `sessionFactory` (lowercase 's')
- This is provided by OpenMRS core, don't define it yourself

### Update Status After Completion

Update this file with completion report:

```markdown
### Completion Report (OPM-002)

**Completed:** YYYY-MM-DD
**Completed By:** [Your Name/Worker ID]

**Verification Output:**

[Paste OpenMRS log output showing bean initialization]

**Notes:** [Any issues or deviations]
```

### ✂️ COPY TO HERE ✂️

---

## OPM-003: Patient Registration Auto-Queue Addition

**Status:** TODO
**Priority:** HIGH
**Created:** 2025-11-03
**Dependencies:** OPM-001, OPM-002
**Related Files:**
- Backend: Need to create REST endpoint or modify existing patient registration handler
- Frontend: `frontend/src/app/patients/register/page.tsx` (already calls `/api/patients` POST)

### Context

When a patient is registered via the frontend form, they should automatically be added to the **Triage Queue** with status `PENDING`. Currently, registration only creates a patient record.

**Current State:**
- ✅ Frontend registration form works: `frontend/src/app/patients/register/page.tsx`
- ✅ Frontend calls: `POST /api/patients` (Next.js API route)
- ✅ Next.js API route calls: OpenMRS `/ws/rest/v1/patient` endpoint
- ❌ No automatic queue entry created after registration

**What This Task Does:**
1. Options:
   - **Option A:** Modify OpenMRS module to add event listener for new patient creation
   - **Option B:** Add queue entry via REST call from Next.js API route
2. When patient registered → automatically create queue entry with:
   - `location_to_id` = Triage location UUID
   - `status` = PENDING
   - `queue_number` = Auto-generated (TR001, TR002, etc.)
   - `priority` = 5 (default)

### Architectural Decision Needed

**Option A: OpenMRS Event Listener (Recommended)**
- Pros: Automatic, works for all patient creation paths
- Cons: Requires Java code, more complex

**Option B: Frontend API Route Call**
- Pros: Simpler, no Java code needed
- Cons: Only works when frontend creates patient, brittle

**Recommendation:** Use Option B initially for MVP speed, refactor to Option A later.

---

### ✂️ COPY FROM HERE (Option B - Frontend Implementation) ✂️

## Self-Contained Prompt for OpenMRS Worker

**Task:** Create REST endpoint for adding patient to queue, call from frontend after registration

**Context:** You have OpenMRS MCP access. When a patient is registered via frontend, they need to be added to the triage queue automatically.

**Prerequisites:**
- OPM-001 completed (database table exists)
- OPM-002 completed (Spring beans registered)
- Triage location UUID known (get from OpenMRS)

**Steps to Execute:**

### 1. Get Triage Location UUID from OpenMRS

```bash
# Option 1: Query via REST API
curl -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/location?q=triage&v=default" | jq

# Option 2: Query database directly
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e "
SELECT location_id, name, uuid
FROM location
WHERE name LIKE '%triage%' OR name LIKE '%Triage%'
AND voided = 0;
"

# Save the UUID for later steps
# Example: 8d6c993e-c2cc-11de-8d13-0010c6dffd0f
```

### 2. Create OpenMRS REST Endpoint for Queue Addition

**Option 1: Using WebServices REST Module (Easier)**

Create a resource handler for queue operations. This requires modifying the OpenMRS module.

**File to create:** `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/rest/QueueResource.java`

```java
package org.openmrs.module.ghanaemr.web.rest;

import org.openmrs.Patient;
import org.openmrs.Visit;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.api.queue.PatientQueueService;
import org.openmrs.module.ghanaemr.api.queue.model.PatientQueue;
import org.openmrs.module.webservices.rest.web.RestConstants;
import org.openmrs.module.webservices.rest.web.annotation.Resource;
import org.openmrs.module.webservices.rest.web.v1_0.controller.BaseRestController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/rest/" + RestConstants.VERSION_1 + "/ghanaemr/queue")
public class QueueResource extends BaseRestController {

    @RequestMapping(method = RequestMethod.POST, value = "/add")
    @ResponseBody
    public Object addToQueue(
        @RequestParam("patientUuid") String patientUuid,
        @RequestParam("visitUuid") String visitUuid,
        @RequestParam("locationUuid") String locationUuid,
        @RequestParam(value = "priority", defaultValue = "5") Integer priority
    ) {
        PatientQueueService queueService = Context.getService(PatientQueueService.class);

        Patient patient = Context.getPatientService().getPatientByUuid(patientUuid);
        Visit visit = Context.getVisitService().getVisitByUuid(visitUuid);
        Location location = Context.getLocationService().getLocationByUuid(locationUuid);

        if (patient == null || visit == null || location == null) {
            return SimpleObject.create("error", "Invalid patient, visit, or location UUID");
        }

        PatientQueue queue = queueService.addToQueue(patient, visit, location, priority);

        return SimpleObject.create(
            "uuid", queue.getUuid(),
            "queueNumber", queue.getQueueNumber(),
            "status", queue.getStatus().toString(),
            "priority", queue.getPriority()
        );
    }
}
```

**Option 2: Simpler Approach - Use Groovy Script in OpenMRS**

If REST resource is too complex, use a scheduled task or manual script to add to queue.

### 3. Alternative: Direct Database Insert from Frontend

If REST endpoint creation is blocked, have the Next.js API route insert directly into database:

**File to modify:** `frontend/src/app/api/patients/route.ts`

After patient creation succeeds, add queue entry:

```typescript
// After successful patient creation
const patientResponse = await openmrsApi.post('/patient', patientData);
const patientUuid = patientResponse.data.uuid;

// Create visit for the patient
const visitResponse = await openmrsApi.post('/visit', {
  patient: patientUuid,
  visitType: VISIT_TYPE_UUID, // Get from env
  location: FACILITY_LOCATION_UUID,
  startDatetime: new Date().toISOString(),
});
const visitUuid = visitResponse.data.uuid;

// Add to triage queue (direct database insert)
await db.query(`
  INSERT INTO ghanaemr_patient_queue
  (patient_id, visit_id, location_to_id, status, queue_number, priority, date_created, creator, uuid)
  VALUES (
    (SELECT patient_id FROM patient WHERE uuid = ?),
    (SELECT visit_id FROM visit WHERE uuid = ?),
    (SELECT location_id FROM location WHERE uuid = ?),
    'PENDING',
    (SELECT CONCAT('TR', LPAD(COALESCE(MAX(CAST(SUBSTRING(queue_number, 3) AS UNSIGNED)), 0) + 1, 3, '0'))
     FROM ghanaemr_patient_queue
     WHERE queue_number LIKE 'TR%'),
    5,
    NOW(),
    (SELECT user_id FROM users WHERE username = 'admin'),
    UUID()
  )
`, [patientUuid, visitUuid, TRIAGE_LOCATION_UUID]);
```

### 4. Test End-to-End

```bash
# 1. Register a new patient via frontend
# Navigate to: http://localhost:3001/patients/register
# Fill form and submit

# 2. Check if queue entry created
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e "
SELECT
  pq.queue_number,
  pq.status,
  pq.priority,
  p.uuid AS patient_uuid,
  pn.given_name,
  pn.family_name,
  v.uuid AS visit_uuid,
  l.name AS location
FROM ghanaemr_patient_queue pq
JOIN patient p ON pq.patient_id = p.patient_id
JOIN person_name pn ON p.patient_id = pn.person_id AND pn.preferred = 1
JOIN visit v ON pq.visit_id = v.visit_id
JOIN location l ON pq.location_to_id = l.location_id
WHERE pq.status = 'PENDING'
ORDER BY pq.date_created DESC
LIMIT 5;
"

# 3. Check frontend triage queue page
# Navigate to: http://localhost:3001/opd/triage-queue
# Should see newly registered patient in the queue
```

### Success Criteria

Mark this task as **DONE** when:
- ✅ Patient registration creates queue entry automatically
- ✅ Queue entry has correct location (Triage)
- ✅ Queue entry has status PENDING
- ✅ Queue number auto-generates (TR001, TR002, etc.)
- ✅ Visit is created and linked to queue entry
- ✅ Frontend triage queue page shows new patient
- ✅ No errors in console or logs

### Troubleshooting

**Problem:** Queue number generation fails (NULL or duplicate)

**Solution:**
```sql
-- Test queue number generation separately
SELECT CONCAT('TR', LPAD(COALESCE(MAX(CAST(SUBSTRING(queue_number, 3) AS UNSIGNED)), 0) + 1, 3, '0'))
FROM ghanaemr_patient_queue
WHERE queue_number LIKE 'TR%';

-- If fails, manually assign for testing:
UPDATE ghanaemr_patient_queue SET queue_number = 'TR001' WHERE queue_id = <id>;
```

### Update Status After Completion

```markdown
### Completion Report (OPM-003)

**Completed:** YYYY-MM-DD
**Completed By:** [Your Name/Worker ID]

**Implementation Approach:** [Option A or B]

**Verification Output:**

[Paste queue query results showing new patient]

**Notes:** [Any issues or deviations]
```

### ✂️ COPY TO HERE ✂️

---

## OPM-004: Location UUIDs Configuration

**Status:** TODO
**Priority:** HIGH
**Created:** 2025-11-03
**Dependencies:** None
**Related Files:**
- Frontend: `frontend/.env.local` (environment variables)
- Backend: OpenMRS global properties or module config

### Context

The queue system needs to know the UUIDs for Triage, Consultation, and Pharmacy locations. These are used to route patients through the workflow.

**Current State:**
- ❌ Location UUIDs not documented
- ❌ Frontend `.env.local` missing location UUID variables
- ❌ Backend may need global properties configured

**What This Task Does:**
1. Query OpenMRS for existing locations
2. Create locations if they don't exist (Triage, Consultation, Pharmacy)
3. Document UUIDs
4. Configure frontend environment variables
5. Configure backend global properties

---

### ✂️ COPY FROM HERE ✂️

## Self-Contained Prompt for OpenMRS Worker

**Task:** Configure location UUIDs for OPD workflow stations

**Context:** You have OpenMRS MCP access. The system needs to know which locations represent Triage, Consultation, and Pharmacy stations.

**Steps to Execute:**

### 1. Query Existing Locations

```bash
# Get all locations
curl -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/location?v=full" | jq '.results[] | {name: .name, uuid: .uuid}'

# Or via database
docker exec -it medreg-mysql mysql -u root -proot_password openmrs -e "
SELECT location_id, name, uuid, retired
FROM location
WHERE retired = 0
ORDER BY name;
"
```

### 2. Create Missing Locations

If Triage, Consultation, or Pharmacy locations don't exist:

```bash
# Create Triage location
curl -u admin:Admin123 -X POST "http://localhost:8080/openmrs/ws/rest/v1/location" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Triage",
    "description": "OPD Triage Station"
  }'

# Create Consultation location
curl -u admin:Admin123 -X POST "http://localhost:8080/openmrs/ws/rest/v1/location" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Consultation Room",
    "description": "OPD Consultation Station"
  }'

# Create Pharmacy location
curl -u admin:Admin123 -X POST "http://localhost:8080/openmrs/ws/rest/v1/location" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pharmacy",
    "description": "OPD Pharmacy Dispensing Station"
  }'
```

### 3. Get UUIDs and Document

```bash
# Get Triage UUID
TRIAGE_UUID=$(curl -s -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/location?q=Triage&v=default" | jq -r '.results[0].uuid')
echo "Triage UUID: $TRIAGE_UUID"

# Get Consultation UUID
CONSULTATION_UUID=$(curl -s -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/location?q=Consultation&v=default" | jq -r '.results[0].uuid')
echo "Consultation UUID: $CONSULTATION_UUID"

# Get Pharmacy UUID
PHARMACY_UUID=$(curl -s -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/location?q=Pharmacy&v=default" | jq -r '.results[0].uuid')
echo "Pharmacy UUID: $PHARMACY_UUID"
```

### 4. Configure Frontend Environment Variables

Create or update `frontend/.env.local`:

```bash
cat >> frontend/.env.local << EOF

# OPD Workflow Location UUIDs
NEXT_PUBLIC_TRIAGE_LOCATION_UUID=${TRIAGE_UUID}
NEXT_PUBLIC_CONSULTATION_LOCATION_UUID=${CONSULTATION_UUID}
NEXT_PUBLIC_PHARMACY_LOCATION_UUID=${PHARMACY_UUID}

# Queue polling interval (milliseconds)
NEXT_PUBLIC_QUEUE_POLL_INTERVAL=10000
EOF
```

### 5. Configure Backend Global Properties (Optional)

If backend code needs to access these UUIDs:

```bash
# Add global properties via REST API
curl -u admin:Admin123 -X POST "http://localhost:8080/openmrs/ws/rest/v1/systemsetting" \
  -H "Content-Type: application/json" \
  -d "{
    \"property\": \"ghanaemr.triage.location.uuid\",
    \"value\": \"${TRIAGE_UUID}\"
  }"

curl -u admin:Admin123 -X POST "http://localhost:8080/openmrs/ws/rest/v1/systemsetting" \
  -H "Content-Type: application/json" \
  -d "{
    \"property\": \"ghanaemr.consultation.location.uuid\",
    \"value\": \"${CONSULTATION_UUID}\"
  }"

curl -u admin:Admin123 -X POST "http://localhost:8080/openmrs/ws/rest/v1/systemsetting" \
  -H "Content-Type: application/json" \
  -d "{
    \"property\": \"ghanaemr.pharmacy.location.uuid\",
    \"value\": \"${PHARMACY_UUID}\"
  }"
```

### 6. Verify Configuration

```bash
# Check frontend env file
cat frontend/.env.local | grep LOCATION_UUID

# Check backend global properties
curl -s -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/systemsetting?q=ghanaemr&v=full" | jq
```

### 7. Document in Project

Create a reference file: `docs/config/location-uuids.md`

```markdown
# OPD Workflow Location UUIDs

**Last Updated:** $(date)

| Location | UUID | Purpose |
|----------|------|---------|
| Triage | ${TRIAGE_UUID} | Initial patient assessment, vital signs |
| Consultation | ${CONSULTATION_UUID} | Doctor consultation, diagnosis, prescriptions |
| Pharmacy | ${PHARMACY_UUID} | Drug dispensing |

## Usage

**Frontend:**
- Configured in `frontend/.env.local`
- Accessed via `process.env.NEXT_PUBLIC_TRIAGE_LOCATION_UUID`

**Backend:**
- Configured in OpenMRS global properties
- Accessed via `Context.getAdministrationService().getGlobalProperty("ghanaemr.triage.location.uuid")`
```

### Success Criteria

Mark this task as **DONE** when:
- ✅ All 3 locations exist in OpenMRS (Triage, Consultation, Pharmacy)
- ✅ UUIDs documented in `docs/config/location-uuids.md`
- ✅ Frontend `.env.local` configured
- ✅ Backend global properties set (if needed)
- ✅ Verification commands pass

### Update Status After Completion

```markdown
### Completion Report (OPM-004)

**Completed:** YYYY-MM-DD
**Completed By:** [Your Name/Worker ID]

**Location UUIDs:**
- Triage: [UUID]
- Consultation: [UUID]
- Pharmacy: [UUID]

**Notes:** [Any issues or deviations]
```

### ✂️ COPY TO HERE ✂️

---

## How to Add New OpenMRS Tasks

When you (a worker without OpenMRS MCP access) identify new OpenMRS backend work:

1. **Create a new section** in this file with the next task ID (OPM-005, OPM-006, etc.)
2. **Set status to TODO**
3. **Include all context:**
   - What needs to be done (database, Java code, config)
   - Why it's needed (what frontend feature depends on it)
   - Related files (both backend and frontend)
4. **Write a self-contained prompt** between the ✂️ markers
5. **Add verification steps** with exact bash commands
6. **Update the Active Task Summary table** at the top

### Template for New Tasks

```markdown
## OPM-XXX: [Task Title]

**Status:** TODO
**Priority:** [CRITICAL/HIGH/MEDIUM/LOW]
**Created:** YYYY-MM-DD
**Dependencies:** [List other OPM tasks]
**Related Files:**
- Backend: [file paths]
- Frontend: [file paths]

### Context

[Explain what this task does and why it's needed]

**Current State:**
- ✅ [What's already done]
- ❌ [What needs to be done]

**What This Task Does:**
1. [Step 1]
2. [Step 2]

### Related Frontend Context

[What frontend pages/APIs depend on this backend work]

---

### ✂️ COPY FROM HERE ✂️

## Self-Contained Prompt for OpenMRS Worker

**Task:** [One-line description]

**Context:** [Brief context]

**Prerequisites:**
- [List dependencies and requirements]

**Steps to Execute:**

### 1. [Step Title]

```bash
# Bash commands with comments
```

[Explanation]

### 2. [Next Step]

[Continue with all steps...]

### Success Criteria

Mark this task as **DONE** when:
- ✅ [Criterion 1]
- ✅ [Criterion 2]

### Troubleshooting

**Problem:** [Common issue]

**Solution:**
```bash
# Fix commands
```

### Update Status After Completion

[Instructions for updating this file]

### ✂️ COPY TO HERE ✂️

---
```

## Worker Communication Protocol

### For Regular Workers (No OpenMRS MCP Access)

When you need OpenMRS backend work done:

1. **Add task to this file** using the template above
2. **Update status to TODO**
3. **Update Active Task Summary table**
4. **Inform human:** "I've added task OPM-XXX to OPENMRS_PROMPT_GUIDE.md. This requires a worker with OpenMRS MCP access."

### For Human (Task Coordinator)

When you see a new TODO task:

1. **Copy the entire prompt** between ✂️ markers
2. **Give to OpenMRS-capable worker** with instruction: "Execute this task and update the status in OPENMRS_PROMPT_GUIDE.md"

### For OpenMRS Workers (With MCP Access)

When you receive a prompt:

1. **Read the entire prompt carefully**
2. **Execute all steps in sequence**
3. **Run verification commands**
4. **Update status to DONE** with completion report
5. **Update Active Task Summary table**
6. **Inform human:** "Task OPM-XXX completed successfully. See OPENMRS_PROMPT_GUIDE.md for verification output."

---

## Status Summary

**Last Updated:** 2025-11-05

| Status | Count | Task IDs |
|--------|-------|----------|
| TODO | 3 | OPM-002, OPM-003, OPM-004 |
| IN_PROGRESS | 0 | - |
| BLOCKED | 0 | - |
| DONE | 2 | OPM-000, OPM-001 |
| CANCELLED | 0 | - |

---

## Next Steps

**For OpenMRS Worker:**

✅ **COMPLETED:** Platform 2.4.0 deployment and module loading (OPM-000, OPM-001)

**Ready to Execute:**
1. **OPM-002** (Spring Bean Registration) - Register PatientQueueService Spring beans
2. **OPM-004** (Location UUIDs) - Configure Triage, Consultation, Pharmacy location UUIDs
3. **OPM-003** (Auto-queue on registration) - Automatically add patients to triage queue after registration

**Recommended Execution Order:**
1. ✅ **OPM-000** (Module Loading Fix) - COMPLETED
2. ✅ **OPM-001** (Database Schema) - COMPLETED
3. **OPM-002** (Spring beans) - Next priority
4. **OPM-004** (Location UUIDs) - Can run in parallel with OPM-002
5. **OPM-003** (Auto-queue on registration) - Depends on all above
