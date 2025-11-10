# Ghana EMR Module - Spring Bean Dependency Fix

**Date:** November 10, 2025
**Incident:** Ghana EMR module fails to load with missing Spring bean errors
**Status:** ✅ CODE FIXES IMPLEMENTED - ⏳ RUNTIME VERIFICATION PENDING
**Impact:** OpenMRS startup blocked, REST API unavailable, all services unavailable

**⚠️ CURRENT STATUS (November 10, 2025 - 15:30 UTC):**
- ✅ All code changes completed (Spring XML, @Service annotations removed, Jackson dependencies added)
- ✅ Module rebuilt successfully (19MB OMOD with Jackson JARs)
- ✅ Docker image rebuilt with fixed module
- ⏳ **Runtime verification PENDING** - OpenMRS NOT yet initialized (0 database tables)
- 📋 **Next Step:** Initialize OpenMRS to verify fixes work at runtime

**📖 For Complete Context:** See [OPENMRS_ISSUES_AND_RESOLUTIONS.md](../../OPENMRS_ISSUES_AND_RESOLUTIONS.md) for comprehensive documentation of all OpenMRS issues and their current status.

---

## ⚡ Quick Start (For Next Worker)

**If you just need to fix this NOW, skip to:**
→ [Solution: Permanent Fix](#solution-permanent-fix) (Steps 1-6)

**Time Required:** 15-30 minutes  
**Prerequisites:** Java 8, Maven 3.9.x, Docker running  
**Risk Level:** LOW (fully reversible, rollback plan included)

**Files You'll Modify:**
1. `backend/openmrs-module-ghanaemr/api/src/main/resources/moduleApplicationContext.xml` (add 3 bean definitions)
2. `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/service/impl/GhanaPatientServiceImpl.java` (remove 1 line: @Service annotation)

**Verification:** 7-step checklist provided in [Verification Checklist](#verification-checklist) section

---

## Executive Summary

The Ghana EMR custom OpenMRS module fails to load due to missing Spring bean definitions for two critical components: `SequenceProvider` and `NHIETransactionLogger`. This causes cascading Spring context initialization failure, blocking the entire OpenMRS platform from starting.

**Root Cause:** Implementation classes exist but lack Spring wiring (no @Service annotations, no bean definitions in `moduleApplicationContext.xml`).

**Solution:** Add explicit Spring bean definitions for missing dependencies.

**Timeline to Fix:** 15-30 minutes (implementation + rebuild + deploy + verification)

---

## Incident Timeline

| Time | Event |
|------|-------|
| 2025-11-09 | Ghana EMR module deployed to OpenMRS container |
| 2025-11-10 00:41 | Module activator starts, sets global properties |
| 2025-11-10 00:42 | Spring context initialization fails with `NoSuchBeanDefinitionException` |
| 2025-11-10 00:42 | OpenMRS startup blocked, REST API returns HTTP 500 |
| 2025-11-10 01:00 | Investigation begins - module removed temporarily as workaround |
| 2025-11-10 01:30 | Root cause analysis completed - missing Spring bean definitions identified |

---

## Technical Analysis

### Issue #1: Missing SequenceProvider Bean [CRITICAL - BLOCKER]

**Error Message:**
```
org.springframework.beans.factory.NoSuchBeanDefinitionException: 
No qualifying bean of type 'org.openmrs.module.ghanaemr.util.SequenceProvider' available: 
expected at least 1 bean which qualifies as autowire candidate
```

**Root Cause Chain:**
1. `GhanaPatientServiceImpl` has `@Service` annotation → Spring discovers it
2. Constructor requires `SequenceProvider` parameter:
   ```java
   public GhanaPatientServiceImpl(SequenceProvider sequenceProvider) {
       this.folderNumberGenerator = new FolderNumberGenerator(sequenceProvider);
   }
   ```
3. Spring searches for `SequenceProvider` bean → NOT FOUND
4. Reasons for not found:
   - `DatabaseSequenceProvider` class exists ✅
   - **Missing** `@Service` or `@Component` annotation ❌
   - **Missing** bean definition in `moduleApplicationContext.xml` ❌
   - Component scan cannot discover it ❌
5. Spring context initialization FAILS
6. Module cannot load
7. OpenMRS startup BLOCKED

**Files Involved:**
- `api/src/main/java/org/openmrs/module/ghanaemr/service/impl/GhanaPatientServiceImpl.java`
- `api/src/main/java/org/openmrs/module/ghanaemr/util/DatabaseSequenceProvider.java`
- `api/src/main/java/org/openmrs/module/ghanaemr/util/SequenceProvider.java` (interface)
- `api/src/main/resources/moduleApplicationContext.xml`

---

### Issue #2: Missing NHIETransactionLogger Bean [HIGH - NOT IMMEDIATE BLOCKER]

**Potential Error:**
```
org.springframework.beans.factory.NoSuchBeanDefinitionException: 
No qualifying bean of type 'org.openmrs.module.ghanaemr.api.nhie.NHIETransactionLogger' available
```

**Root Cause:**
- `DefaultNHIETransactionLogger` exists but lacks `@Service` annotation
- `NHIEIntegrationServiceImpl` has constructor overload accepting `NHIETransactionLogger`
- Not currently blocking (default constructor used), but will fail if constructor injection attempted

**Files Involved:**
- `api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/DefaultNHIETransactionLogger.java`
- `api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/NHIEIntegrationServiceImpl.java`
- `api/src/main/resources/moduleApplicationContext.xml`

---

### Issue #3: Inconsistent Spring Configuration Patterns [MEDIUM]

**Observation:**
Mixed Spring configuration approaches across the module:

**Services WITH @Service annotation (auto-discovered):**
- ✅ GhanaPatientServiceImpl
- ✅ TriageServiceImpl  
- ✅ ConsultationServiceImpl
- ✅ NHIECoverageServiceImpl
- ✅ NHIEIntegrationServiceImpl

**Utility classes WITHOUT Spring wiring:**
- ❌ DatabaseSequenceProvider (needs sessionFactory dependency)
- ❌ DefaultNHIETransactionLogger (no dependencies)

**Explicit bean definitions in moduleApplicationContext.xml:**
- ✅ PatientQueueDAO (Hibernate DAO - requires sessionFactory)
- ✅ PatientQueueService (Transaction proxy pattern)

**Problem:** Inconsistent patterns make debugging difficult and hide missing dependencies.

---

## Module Structure Analysis

### Current Module Files

**Total Java files:** 54  
**Total XML files:** 12

**Service Implementations:**
1. `TriageServiceImpl.java` - @Service ✅
2. `GhanaPatientServiceImpl.java` - @Service ✅ (but constructor dep missing)
3. `ConsultationServiceImpl.java` - @Service ✅
4. `PatientQueueServiceImpl.java` - Explicit bean ✅
5. `NHIECoverageServiceImpl.java` - @Service ✅
6. `NHIEIntegrationServiceImpl.java` - @Service ✅

**Utility Classes:**
1. `DatabaseSequenceProvider.java` - NO Spring wiring ❌
2. `DefaultNHIETransactionLogger.java` - NO Spring wiring ❌

**Module Configuration:**
- `config.xml` - Structure correct ✅
- `moduleApplicationContext.xml` - Missing bean definitions ❌
- `GhanaEMRActivator.java` - Simple and safe (no premature bean access) ✅
- Component scan enabled: `<context:component-scan base-package="org.openmrs.module.ghanaemr" />`

---

## Solution: Permanent Fix

### Strategy: Explicit Bean Definitions (Hybrid Approach)

**Rationale:**
- Keep @Service annotations on services (auto-discovery)
- Add explicit bean definitions for utility classes with complex dependencies
- Provides clear dependency wiring for sessionFactory injection
- Consistent with existing PatientQueueService pattern

### Implementation Steps

#### Step 1: Update moduleApplicationContext.xml

Add these bean definitions after the existing `patientQueueService` bean:

```xml
<!-- SequenceProvider for folder number generation -->
<bean id="sequenceProvider" 
      class="org.openmrs.module.ghanaemr.util.DatabaseSequenceProvider">
    <property name="sessionFactory" ref="sessionFactory" />
</bean>

<!-- NHIETransactionLogger for NHIE transaction audit logging -->
<bean id="transactionLogger" 
      class="org.openmrs.module.ghanaemr.api.nhie.DefaultNHIETransactionLogger">
    <!-- No dependencies - uses JDBC directly via Context.getRuntimeProperties() -->
</bean>

<!-- GhanaPatientService with explicit constructor injection -->
<bean id="ghanaPatientService" 
      class="org.openmrs.module.ghanaemr.service.impl.GhanaPatientServiceImpl">
    <constructor-arg ref="sequenceProvider" />
</bean>
```

**Why explicit bean for GhanaPatientService?**
- Remove @Service annotation from GhanaPatientServiceImpl
- Explicit constructor injection ensures SequenceProvider dependency is satisfied
- Prevents Spring auto-wiring ambiguity

#### Step 2: Remove @Service Annotation from GhanaPatientServiceImpl

**File:** `api/src/main/java/org/openmrs/module/ghanaemr/service/impl/GhanaPatientServiceImpl.java`

**Change:**
```java
// BEFORE:
@Service
@Transactional
public class GhanaPatientServiceImpl implements GhanaPatientService {

// AFTER:
@Transactional
public class GhanaPatientServiceImpl implements GhanaPatientService {
```

**Reason:** Explicit bean definition in XML takes precedence. Removing @Service prevents duplicate bean registration.

#### Step 3: Rebuild Module

```bash
cd backend/openmrs-module-ghanaemr
mvn clean package -Dmaven.test.skip=true
```

**Expected Output:**
```
[INFO] BUILD SUCCESS
[INFO] Total time: 4-6 seconds
```

**Verify Artifact:**
```bash
ls -lh omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod
# Expected: 17MB (includes all dependencies)
```

#### Step 4: Deploy to OpenMRS Container

```bash
# Stop OpenMRS
docker stop medreg-openmrs

# Clear module cache
docker exec medreg-openmrs rm -rf /usr/local/tomcat/.OpenMRS/.openmrs-lib-cache

# Copy new module (backup old one first)
docker exec medreg-openmrs mv /usr/local/tomcat/.OpenMRS/modules/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod /tmp/ghana-old.omod 2>/dev/null || true

docker cp omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod medreg-openmrs:/usr/local/tomcat/.OpenMRS/modules/

# Restart OpenMRS
docker start medreg-openmrs

# Wait for startup (2-3 minutes)
sleep 120
```

#### Step 5: Verify Module Loaded Successfully

```bash
# Check logs for successful module loading
docker logs medreg-openmrs 2>&1 | grep -i "ghana"

# Expected output:
# INFO - GhanaEMRActivator.started() - Ghana EMR Module started successfully
# INFO - GhanaEMRActivator.started() - Ghana EMR Queue Management System initialized
# INFO - GhanaEMRActivator.started() - Ghana EMR NHIE Integration Services initialized
```

```bash
# Check for Spring bean errors (should be NONE)
docker logs medreg-openmrs 2>&1 | grep -i "NoSuchBeanDefinitionException\|UnsatisfiedDependencyException"

# Expected: No output (errors not found)
```

```bash
# Test REST API
curl -s -u admin:Admin123 http://localhost:8080/openmrs/ws/rest/v1/session | grep authenticated

# Expected: "authenticated":true
```

#### Step 6: Test Module Functionality

```bash
# Test that GhanaPatientService can be retrieved
docker exec medreg-openmrs cat > /tmp/test-service.groovy << 'EOF'
import org.openmrs.api.context.Context
import org.openmrs.module.ghanaemr.service.GhanaPatientService

Context.openSession()
Context.authenticate("admin", "Admin123")

try {
    def service = Context.getService(GhanaPatientService.class)
    println("✅ GhanaPatientService retrieved successfully: " + service.getClass().getName())
} catch (Exception e) {
    println("❌ Failed to retrieve GhanaPatientService: " + e.getMessage())
} finally {
    Context.closeSession()
}
EOF

# Run test (if groovysh available)
# docker exec medreg-openmrs groovysh /tmp/test-service.groovy
```

---

## Verification Checklist

After fix implementation, verify ALL items:

### Build Verification
- [ ] `mvn clean package` completes without errors
- [ ] OMOD artifact is ~17MB (not 31KB - that indicates missing dependencies)
- [ ] No compilation warnings related to Spring annotations

### Deployment Verification  
- [ ] Old module backed up to /tmp/ghana-old.omod
- [ ] New module copied to /usr/local/tomcat/.OpenMRS/modules/
- [ ] Module cache cleared (.openmrs-lib-cache deleted)
- [ ] OpenMRS container restarted cleanly

### Module Loading Verification
- [ ] No `NoSuchBeanDefinitionException` errors in logs
- [ ] No `UnsatisfiedDependencyException` errors in logs
- [ ] GhanaEMRActivator.started() message appears in logs
- [ ] Module appears in "Manage Modules" page (if UI available)

### REST API Verification
- [ ] http://localhost:8080/openmrs/ returns 200 (not 500)
- [ ] http://localhost:8080/openmrs/ws/rest/v1/session returns JSON with `authenticated: true`
- [ ] No Servlet.init() exceptions in logs

### Service Bean Verification
- [ ] `Context.getService(GhanaPatientService.class)` works (no APIException)
- [ ] SequenceProvider bean can be retrieved from Spring context
- [ ] NHIETransactionLogger bean can be retrieved from Spring context

### Functional Verification
- [ ] Folder number generation works (test patient registration)
- [ ] NHIE transaction logging works (test NHIE integration)
- [ ] Queue management works (test patient queue operations)

---

## Rollback Plan

If fix causes new issues:

### Quick Rollback (Remove Module)
```bash
docker exec medreg-openmrs mv /usr/local/tomcat/.OpenMRS/modules/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod /tmp/ghana-disabled.omod
docker exec medreg-openmrs rm -rf /usr/local/tomcat/.OpenMRS/.openmrs-lib-cache
docker restart medreg-openmrs
```

### Restore Previous Version
```bash
docker exec medreg-openmrs mv /tmp/ghana-old.omod /usr/local/tomcat/.OpenMRS/modules/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod
docker restart medreg-openmrs
```

### Return to Baseline (No Ghana EMR Module)
```bash
# OpenMRS 2.4.0 Reference Application works fine without custom module
# Task 13 (billing concepts) can be completed via REST API directly
docker exec medreg-openmrs rm /usr/local/tomcat/.OpenMRS/modules/openmrs-module-ghanaemr-*.omod
docker restart medreg-openmrs
```

---

## Lessons Learned

### What Went Wrong
1. **Mixed Configuration Patterns:** Some services used @Service (auto-discovery), others needed explicit beans. Inconsistent approach caused confusion.
2. **Constructor Dependency Not Validated:** GhanaPatientServiceImpl constructor dependency wasn't caught until runtime in production environment.
3. **Insufficient Integration Testing:** Module built successfully but failed at Spring context initialization (later lifecycle stage).
4. **No Module Loading Tests:** No automated tests verify module loads in OpenMRS container.

### Prevention Strategies
1. **Standardize Spring Configuration:**
   - **Rule:** All services with no-arg constructors → @Service annotation
   - **Rule:** All services with dependencies → Explicit bean definitions in XML
   - **Rule:** All utility classes with sessionFactory dependency → Explicit beans
   
2. **Add Module Loading Tests:**
   - Create integration test that loads module in test OpenMRS instance
   - Verify all required beans can be retrieved from Spring context
   - Add to CI/CD pipeline
   
3. **Document Spring Patterns:**
   - Add SPRING_CONFIG.md to document when to use @Service vs explicit beans
   - Add examples for common patterns (DAO, service, utility classes)
   
4. **Pre-deployment Validation:**
   - Run module in test OpenMRS container before production deployment
   - Check logs for Spring errors before declaring success
   - Test REST API accessibility after module deployment

### Future Improvements
1. Add unit tests for DatabaseSequenceProvider
2. Add integration tests for module loading
3. Add Spring bean validation in module activator
4. Document all Spring dependencies in module README
5. Create automated deployment script with verification steps
6. Add health check endpoint to verify module loaded correctly

---

## Related Documentation

- **IMPLEMENTATION_TRACKER.md** - Week 2-3: Patient Registration (module build history)
- **AGENTS.md** - OpenMRS Code Patterns section (Spring configuration guidance)
- **docs/development/cookbook.md** - OpenMRS module development recipes
- **docs/setup/openmrs-docker-setup.md** - OpenMRS container configuration
- **docs/runbooks/OPENMRS_REST_LOGIN_RECOVERY_TASKBOOK.md** - Previous OpenMRS troubleshooting incident

---

## Contact & Escalation

**Issue Owner:** Ghana EMR Development Team  
**Severity:** CRITICAL (blocks all development)  
**Resolution Time:** 15-30 minutes (implementation) + 2-3 minutes (OpenMRS restart)  
**Next Steps:** Implement fix, verify all checklist items, update IMPLEMENTATION_TRACKER.md

---

**Status:** Ready for implementation  
**Approval Required:** No (fix is safe and reversible)  
**Estimated Completion:** November 10, 2025 02:00 UTC
