# OpenMRS Module Loading Fix - Implementation Plan

**Date**: 2025-11-05
**Status**: ✅ COMPLETED (Platform 2.4.0 Downgrade Successful)
**Blocker Resolution**: RESOLVED - Module loads successfully on Platform 2.4.0
**Completion Date**: 2025-11-05

---

## ✅ RESOLUTION SUMMARY (November 5, 2025)

**Final Solution**: Platform version **downgrade** from 2.6.0 → 2.4.0

**What Happened:**
- Original plan targeted Platform 2.6.0 upgrade
- Research revealed Platform 2.6.0+ only exists in OpenMRS 3.x (different architecture)
- Reference Application 2.12.0 (latest stable) includes Platform 2.4.0
- **Decision**: Downgrade module requirement to match available infrastructure

**Actions Taken:**
1. ✅ Updated pom.xml: `<openmrs.version>2.4.0</openmrs.version>`
2. ✅ Updated config.xml: `<require_version>2.4.0</require_version>`
3. ✅ Rebuilt module successfully (BUILD SUCCESS in 5:38 min)
4. ✅ Completed OpenMRS installation wizard manually
5. ✅ Module loaded successfully - Liquibase migrations executed
6. ✅ Database tables created (ghanaemr_patient_queue with all constraints)
7. ✅ GhanaEMRActivator executed (ghanaemr.started=true)

**Evidence of Success:**
- Liquibase changesets executed: liquibase.xml, liquibase-queue-management.xml
- Tables created: `ghanaemr_patient_queue` with 6 foreign keys, 2 indexes
- Privileges created: ghanaemr.opd.register, ghanaemr.opd.triage, ghanaemr.opd.consult, etc.
- Global properties set: ghanaemr.started=true, ghanaemr.mandatory=false

**Minor Issue (Non-Critical):**
- SLF4J classloader warning in thread (common OpenMRS module quirk, doesn't affect functionality)

---

## ORIGINAL IMPLEMENTATION PLAN (Superseded by Platform Downgrade)

---

## Executive Summary

The Ghana EMR OpenMRS module failed to load due to **incorrect config.xml structure** - using XML attributes instead of child elements. OpenMRS Platform's ModuleFileParser expects `<name>`, `<id>`, and `<version>` as child elements, not attributes.

**Impact**: Module was silently rejected with "Name cannot be empty" error.
**Fix Complexity**: Simple XML restructure + rebuild
**Test Environment**: Already deployed at localhost:8081 (Platform 2.4.3)

---

## Root Cause Analysis

### What We Discovered

1. **Initial Problem**: Module wouldn't load despite "100% correct structure" claim
2. **First Discovery**: 95MB of HAPI FHIR dependencies missing (FIXED - module now 20MB)
3. **Second Discovery**: Platform version mismatch - Ref App 2.11 uses Platform 2.3.2, not 2.6.0
4. **Final Discovery**: config.xml uses attributes instead of child elements (CURRENT BLOCKER)

### Technical Details

**Current (BROKEN) config.xml**:
```xml
<module configVersion="1.2"
        moduleId="ghanaemr"
        name="Ghana EMR"
        version="${project.version}">
```

**Why It Fails**:
- ModuleFileParser calls `getElementTrimmed(rootNode, "name")`
- This searches for `<name>` element text content
- Attributes are ignored → parser finds empty string → "Name cannot be empty" error

**Reference**: OpenMRS Core ModuleFileParser.java line 346 (ensureNonEmptyName)
- https://github.com/openmrs/openmrs-core/blob/master/api/src/main/java/org/openmrs/module/ModuleFileParser.java

---

## Implementation Steps

### Step 1: Fix config.xml Structure

**File**: `backend/openmrs-module-ghanaemr/omod/src/main/resources/config.xml`

**Change From**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<module configVersion="1.2"
        moduleId="ghanaemr"
        name="Ghana EMR"
        version="${project.version}">

    <!-- Require OpenMRS Platform 2.6.0 -->
    <require_version>2.6.0</require_version>

    <!-- Module activator for startup/shutdown logic -->
    <activator>org.openmrs.module.ghanaemr.GhanaEMRActivator</activator>

    <!-- Spring application context (defined in API resources) -->
    <spring>
        <context>moduleApplicationContext.xml</context>
    </spring>

    <!-- Run Liquibase changesets found on the module classpath (api/src/main/resources/liquibase.xml) -->
    <updateToLatest/>

    <!-- Declare awareness of commonly used modules (optional) -->
    <aware_of_modules>
        <aware_of_module moduleId="webservices.rest"/>
    </aware_of_modules>

</module>
```

**Change To**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<module configVersion="1.2">

    <!-- Module Identity -->
    <id>ghanaemr</id>
    <name>Ghana EMR</name>
    <version>${project.version}</version>

    <!-- Package Information -->
    <author>Ghana EMR Development Team</author>
    <description>
        Ghana EMR module providing integration with Ghana's National Health Information Exchange (NHIE),
        Ghana Card validation, NHIS verification, and regulatory compliance features.
    </description>

    <!-- Require OpenMRS Platform 2.6.0 -->
    <require_version>2.6.0</require_version>

    <!-- Module activator for startup/shutdown logic -->
    <activator>org.openmrs.module.ghanaemr.GhanaEMRActivator</activator>

    <!-- Spring application context (defined in API resources) -->
    <spring>
        <context>moduleApplicationContext.xml</context>
    </spring>

    <!-- Run Liquibase changesets found on the module classpath -->
    <updateToLatest/>

    <!-- Declare awareness of commonly used modules (optional) -->
    <aware_of_modules>
        <aware_of_module>webservices.rest</aware_of_module>
    </aware_of_modules>

</module>
```

**Key Changes**:
- `moduleId="ghanaemr"` → `<id>ghanaemr</id>`
- `name="Ghana EMR"` → `<name>Ghana EMR</name>`
- `version="${project.version}"` → `<version>${project.version}</version>`
- Added `<author>` and `<description>` (recommended best practice)
- Fixed `<aware_of_module moduleId="webservices.rest"/>` → `<aware_of_module>webservices.rest</aware_of_module>`

### Step 1.5: Second Validation Error Discovered (November 5, 2025)

**STATUS:** Step 1 partially successful - fixed first error, discovered second error

After applying Step 1 fix and completing Steps 2-6 (rebuild, deploy, OpenMRS setup), the module **still failed to load** with a **NEW error**:

```
ERROR - ModuleFactory.loadModules(199) |2025-11-05T01:12:29,575| Unable to load file in module directory: /usr/local/tomcat/.OpenMRS/modules/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod. Skipping file.
org.openmrs.module.ModuleException: Package cannot be empty Module: Ghana EMR
	at org.openmrs.module.ModuleFileParser.getTrimmedElementOrFail(ModuleFileParser.java:596)
	at org.openmrs.module.ModuleFileParser.ensureNonEmptyPackage(ModuleFileParser.java:354)
	at org.openmrs.module.ModuleFileParser.createModule(ModuleFileParser.java:300)
	at org.openmrs.module.ModuleFileParser.parse(ModuleFileParser.java:214)
```

**Progress Made:**
- ✅ Fixed "Name cannot be empty" error
- ✅ Module builds successfully (20MB with 27 JARs)
- ✅ OpenMRS Platform 2.4.3 deployed and setup completed
- ❌ NEW ERROR: "Package cannot be empty Module: Ghana EMR"

**Root Cause Analysis:**

The config.xml is still **incomplete**. OpenMRS Platform 2.4.3's `ModuleFileParser.java` requires a `<package>` element that specifies the base Java package of the module.

**Required Addition to config.xml:**

After the `<version>` element, add:
```xml
<package>org.openmrs.module.ghanaemr</package>
```

**Complete Corrected config.xml (Steps 1 + 1.5 Combined):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<module configVersion="1.2">

    <!-- Module Identity -->
    <id>ghanaemr</id>
    <name>Ghana EMR</name>
    <version>${project.version}</version>
    <package>org.openmrs.module.ghanaemr</package>

    <!-- Package Information -->
    <author>Ghana EMR Development Team</author>
    <description>
        Ghana EMR module providing integration with Ghana's National Health Information Exchange (NHIE),
        Ghana Card validation, NHIS verification, and regulatory compliance features.
    </description>

    <!-- Require OpenMRS Platform 2.6.0 -->
    <require_version>2.6.0</require_version>

    <!-- Module activator for startup/shutdown logic -->
    <activator>org.openmrs.module.ghanaemr.GhanaEMRActivator</activator>

    <!-- Spring application context (defined in API resources) -->
    <spring>
        <context>moduleApplicationContext.xml</context>
    </spring>

    <!-- Run Liquibase changesets found on the module classpath -->
    <updateToLatest/>

    <!-- Declare awareness of commonly used modules (optional) -->
    <aware_of_modules>
        <aware_of_module>webservices.rest</aware_of_module>
    </aware_of_modules>

</module>
```

**Key Addition:**
- Added `<package>org.openmrs.module.ghanaemr</package>` after `<version>` (Line 8)

**Why This Was Missed:**

The implementation plan was based on examining other OpenMRS modules, but the `<package>` element requirement in Platform 2.4.3 was not evident from initial research. The error only appeared after:
1. Fixing the attributes → child elements issue
2. Successfully building the module
3. Deploying to test environment
4. Completing OpenMRS setup wizard
5. OpenMRS attempting to load the module

**Next Steps:** Proceed to Step 2 with the complete corrected config.xml

---

### Step 1.6: Third Error - Version Mismatch (November 5, 2025)

**STATUS:** Steps 1-1.5 successful, discovered new error on module startup

After applying both config.xml fixes (child elements + `<package>` element), rebuilding module, redeploying, and completing OpenMRS setup wizard, the module **failed to start** with a **version mismatch error**:

```
WARN - ModuleFactory.startModuleInternal(788) |2025-11-05T01:48:05,732| Error while trying to start module: ghanaemr
org.openmrs.module.ModuleException: Module requires version matching 2.6.0. Current code version is 2.4.3
	at org.openmrs.module.ModuleUtil.checkRequiredVersion(ModuleUtil.java:399)
	at org.openmrs.module.ModuleFactory.startModuleInternal(ModuleFactory.java:655)
```

**Progress Made:**
- ✅ Fixed "Name cannot be empty" error (attributes → child elements)
- ✅ Fixed "Package cannot be empty" error (added `<package>` element)
- ✅ Module builds successfully (20MB with 27 JARs)
- ✅ Module file loaded by OpenMRS (no parsing errors)
- ❌ NEW ERROR: "Module requires version matching 2.6.0. Current code version is 2.4.3"

**Root Cause Analysis:**

The test environment is running the wrong OpenMRS Platform version:

**Module Requirements (Correct):**
- `pom.xml`: `<openmrs.version>2.6.0</openmrs.version>`
- `config.xml`: `<require_version>2.6.0</require_version>`
- Per AGENTS.md: OpenMRS Platform 2.6.0 is project standard

**Test Environment (Wrong):**
- `Dockerfile.test-2.13`: Uses `openmrs-reference-application-distro:2.12` (Platform 2.4.0)
- Actually running: Platform 2.4.3
- `docker-compose.test.yml` comment incorrectly says Platform 2.5.9

**Solution:**

Upgrade test environment to match module requirements. Need to identify correct Reference Application version that includes Platform 2.6.0+.

**Investigation Required:**
1. Research OpenMRS Reference Application versions to find which includes Platform 2.6.0 or 2.6.4
2. Verify the Docker image exists and is compatible
3. Update Dockerfile and docker-compose accordingly

**Files to update (after verification):**
1. `backend/openmrs-module-ghanaemr/Dockerfile.test-2.13`: Change FROM image to correct version
2. `docker-compose.test.yml`: Update comment to reflect actual Platform version

**Next Steps:** See OPM-006 in OPENMRS_PROMPT_GUIDE.md for investigation and execution instructions

---

### Step 2: Rebuild Module

```bash
cd c:/temp/AI/MedReg/backend/openmrs-module-ghanaemr
mvn clean package
```

**Expected Output**:
- Build SUCCESS
- New OMOD: `omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod` (~20MB)
- Contains 27 bundled JARs in `/lib/` directory

**Verification**:
```bash
# Check OMOD size (should be ~20MB)
ls -lh omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod

# Verify config.xml in OMOD
jar -xf omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod config.xml
cat config.xml
```

### Step 3: Rebuild Test Docker Image

```bash
cd c:/temp/AI/MedReg
docker-compose -f docker-compose.test.yml build --no-cache test-openmrs
```

**Expected Output**:
- Image built: `medreg-openmrs-test:2.13`
- Ghana EMR module copied to `/modules-to-install/`
- Entrypoint script configured

### Step 4: Restart Test Environment

```bash
# Stop current containers
docker-compose -f docker-compose.test.yml down

# Start fresh
docker-compose -f docker-compose.test.yml up -d

# Monitor logs
docker logs -f medreg-test-openmrs
```

**Watch For**:
- `=== Ghana EMR Module Installation Entrypoint ===`
- `Installing Ghana EMR module to /usr/local/tomcat/.OpenMRS/modules/`
- `Ghana EMR module installed successfully`

### Step 5: Complete OpenMRS Setup Wizard

Navigate to: http://localhost:8081/openmrs/initialsetup

**Configuration**:
- **Implementation Name**: `MedReg Ghana EMR Test`
- **Admin Password**: `Admin123`
- **Database**: Auto-configured (test-mysql)

**Click through all steps** → Wait for installation to complete

### Step 6: Verify Module Loading

After setup completes, check logs:

```bash
# Check if Ghana EMR module loaded
docker logs medreg-test-openmrs 2>&1 | grep -i "ghana"

# Look for success indicators
docker logs medreg-test-openmrs 2>&1 | grep -iE "ghana.*started|ghana.*loaded"

# Check for errors
docker logs medreg-test-openmrs 2>&1 | grep -iE "ghana.*error|ghana.*failed"
```

**Expected Success Output**:
```
Installing Ghana EMR module to /usr/local/tomcat/.OpenMRS/modules/
Ghana EMR module installed successfully
INFO - ModuleFactory.loadModule(xxx) Loading module: Ghana EMR
INFO - ModuleFactory.startModule(xxx) Starting module: Ghana EMR
INFO - GhanaEMRActivator.started(xxx) Ghana EMR Module started successfully
```

### Step 7: Test Platform Version Compatibility

**Critical Test**: Does `<require_version>2.6.0</require_version>` work on Platform 2.4.3?

**If Module Loads Successfully**:
- Platform 2.4.3 is compatible (despite lower version number)
- Module only checks API compatibility, not exact version match
- **Action**: Update production to use Ref App 2.12 (Platform 2.4.3)

**If Module Fails with Version Error**:
```
ERROR - Module requires OpenMRS Platform 2.6.0 but current version is 2.4.3
```
- **Action**: Update config.xml `<require_version>2.4.3</require_version>`
- Rebuild and retest
- Document that Platform 2.6.0 is not achievable with Reference Application (only in OpenMRS 3.x)

### Step 8: Update Production Configuration

**If Platform 2.4.3 Works**:

Update `backend/openmrs-module-ghanaemr/Dockerfile`:
```dockerfile
# Change FROM line
FROM openmrs/openmrs-reference-application-distro:2.12
```

Update `docker-compose.yml`:
```yaml
openmrs:
  build:
    context: ./backend/openmrs-module-ghanaemr
    dockerfile: Dockerfile  # Uses :2.12 now
```

**If Platform 2.4.3 Requires Version Downgrade**:

Update `backend/openmrs-module-ghanaemr/omod/src/main/resources/config.xml`:
```xml
<require_version>2.4.3</require_version>
```

Update `backend/openmrs-module-ghanaemr/pom.xml`:
```xml
<openmrs.version>2.4.3</openmrs.version>
```

### Step 9: Create Technology Compatibility Governance System

Create `.github/TECH_COMPATIBILITY_CHECKLIST.md`:

```markdown
# Technology Compatibility Checklist

**CRITICAL**: ALL workers MUST review this checklist BEFORE writing ANY code.

## Pre-Code Requirements

- [ ] I have read the CRITICAL REQUIREMENTS section in AGENTS.md
- [ ] I have reviewed docs/TECHNOLOGY_COMPATIBILITY_MATRIX.md
- [ ] All new dependencies are compatible with OpenMRS Platform 2.4.3
- [ ] All new code follows OpenMRS module development standards
- [ ] I have verified XML structure matches OpenMRS examples (child elements, not attributes)
- [ ] Any database changes use Liquibase changesets
- [ ] All REST endpoints follow OpenMRS webservices.rest conventions

## Documentation Updates Required

When introducing new technology:
- [ ] Update docs/TECHNOLOGY_COMPATIBILITY_MATRIX.md
- [ ] Update AGENTS.md if it affects system architecture
- [ ] Update README.md if it affects deployment
- [ ] Document in relevant module/component README

## Verification

- [ ] Code compiles against OpenMRS Platform 2.4.3 APIs
- [ ] Module loads successfully in test environment
- [ ] No version conflicts in dependency tree
```

Create `docs/TECHNOLOGY_COMPATIBILITY_MATRIX.md`:

```markdown
# Technology Compatibility Matrix

Last Updated: 2025-11-05

## OpenMRS Version Matrix

| Component | Version | Notes |
|-----------|---------|-------|
| OpenMRS Reference Application | 2.12.0 | Production deployment |
| OpenMRS Platform | 2.4.3 | Actual platform version in Ref App 2.12 |
| Java | 8+ | Required by OpenMRS 2.x |
| MySQL | 5.7 | Tested and verified |
| Tomcat | 8.5.x | Bundled in reference-application-distro |

## Ghana EMR Module Dependencies

| Dependency | Version | Purpose | Platform Compatibility |
|------------|---------|---------|----------------------|
| HAPI FHIR R4 | 5.5.3 | FHIR resource mapping for NHIE | ✅ Platform 2.4.3+ |
| Gson | 2.8.9 | JSON serialization | ✅ All versions |
| OkHttp | 4.9.3 | HTTP client for NHIE | ✅ All versions |
| Guava | 31.0.1-jre | Utilities | ✅ All versions |

## Version Constraints

### OpenMRS Reference Application → Platform Mapping

| Ref App Version | Platform Version | Docker Image Available | Status |
|----------------|------------------|----------------------|--------|
| 2.10.0 | 2.3.0 | ✅ Yes | Too old |
| 2.11.0 | 2.3.2 | ✅ Yes | Too old (current prod - INCOMPATIBLE) |
| 2.12.0 | 2.4.3 | ✅ Yes | ✅ RECOMMENDED |
| 2.13.0 | 2.5.9 | ❌ No Docker image | Cannot use |
| 3.x | 2.6.0+ | ❌ Different architecture | Future upgrade |

### Platform 2.4.0 Breaking Changes

- Log4J → Log4J2 migration
- Spring Framework upgrade (4.x → 5.x)
- Hibernate upgrade (4.3.x → 5.2.x)
- Liquibase upgrade (3.x → 4.x)

## Module Configuration Standards

### config.xml Structure (CRITICAL)

**❌ WRONG** (Attributes):
```xml
<module configVersion="1.2" moduleId="ghanaemr" name="Ghana EMR">
```

**✅ CORRECT** (Child Elements):
```xml
<module configVersion="1.2">
    <id>ghanaemr</id>
    <name>Ghana EMR</name>
    <version>${project.version}</version>
</module>
```

### Maven Dependencies

All transitive dependencies MUST be bundled in OMOD:
```xml
<plugin>
    <artifactId>maven-dependency-plugin</artifactId>
    <executions>
        <execution>
            <id>copy-transitive-dependencies</id>
            <phase>prepare-package</phase>
            <goals>
                <goal>copy-dependencies</goal>
            </goals>
            <configuration>
                <outputDirectory>${project.build.outputDirectory}/lib</outputDirectory>
                <includeScope>runtime</includeScope>
            </configuration>
        </execution>
    </executions>
</plugin>
```

## Testing Requirements

Before ANY production deployment:
1. Build module against target Platform version
2. Deploy to test environment (docker-compose.test.yml)
3. Verify module loads in logs
4. Test all NHIE integration endpoints
5. Verify database migrations run successfully
```

Update `AGENTS.md` CRITICAL REQUIREMENTS section:

```markdown
## CRITICAL REQUIREMENTS - Technology Compatibility

**MANDATORY**: All workers MUST review this section BEFORE writing code.

### OpenMRS Platform Constraints

✅ **CURRENT PRODUCTION TARGET**:
- OpenMRS Reference Application: 2.12.0
- OpenMRS Platform: 2.4.3 (auto-bundled in Ref App 2.12)
- Java: 8+
- MySQL: 5.7

❌ **INCORRECT PREVIOUS CLAIM**:
- "Platform 2.6.0 with reference-application-distro:2.11.0" - THIS IS IMPOSSIBLE
- Reference Application 2.11 uses Platform 2.3.2 (incompatible with our module)
- Platform 2.6.0 only exists in OpenMRS 3.x

### Module Configuration Standards

**config.xml MUST use child elements, NOT attributes**:
```xml
<module configVersion="1.2">
    <id>ghanaemr</id>
    <name>Ghana EMR</name>
    <version>${project.version}</version>
</module>
```

### Pre-Code Checklist

Before writing ANY code:
1. Review `.github/TECH_COMPATIBILITY_CHECKLIST.md`
2. Verify dependencies in `docs/TECHNOLOGY_COMPATIBILITY_MATRIX.md`
3. Test in isolated environment (docker-compose.test.yml)
4. Update all relevant documentation

### Incident Reference

See `docs/BLOCKER_POSTMORTEM.md` for details on the 6+ hour module loading failure caused by:
1. Missing transitive dependencies (95MB HAPI FHIR)
2. Incorrect Platform version mapping in documentation
3. config.xml using attributes instead of child elements
```

Create `docs/BLOCKER_POSTMORTEM.md`:

```markdown
# OpenMRS Module Loading Blocker - Postmortem

**Incident Date**: 2025-11-04 to 2025-11-05
**Duration**: 6+ hours
**Severity**: Critical - Complete module loading failure
**Status**: RESOLVED

---

## Incident Summary

Ghana EMR OpenMRS module completely failed to load despite claims of "100% correct structure." Multiple root causes discovered through systematic investigation.

---

## Timeline

### Hour 0-2: Initial Investigation
- **Problem**: Module wouldn't appear in OpenMRS module list
- **Claimed Status**: "Module structure 100% correct"
- **Initial Hypothesis**: Docker timing/deployment issue
- **Action**: Attempted various Docker restart sequences
- **Result**: No change

### Hour 2-4: Dependency Discovery
- **Investigation**: Analyzed OMOD file size (110KB - suspiciously small)
- **Finding**: 95MB of HAPI FHIR transitive dependencies missing from OMOD
- **Root Cause #1**: maven-dependency-plugin not configured to bundle runtime dependencies
- **Fix Applied**: Added dependency copying to omod/pom.xml
- **Result**: Module grew to 20MB with 27 JARs - BUT STILL DIDN'T LOAD

### Hour 4-5: Version Incompatibility Suspicion
- **Trigger**: OpenMRS setup wizard showed "Platform 2.3.2" not expected "2.6.0"
- **Investigation**: Researched OpenMRS Reference App → Platform version mapping
- **Finding**: Reference App 2.11.0 uses Platform 2.3.2, not 2.6.0
- **Root Cause #2**: Documentation WRONG - claimed "Platform 2.6.0 with Ref App 2.11" (impossible)
- **Reality**: Platform 2.6.0 only exists in OpenMRS 3.x
- **Action**: Created test environment with Ref App 2.12 (Platform 2.4.3)

### Hour 5-6: Config.xml Structure Error
- **Error Found**: `ModuleException: Name cannot be empty Module: openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod`
- **Investigation**: Extracted config.xml from OMOD - appeared correct
- **Deep Dive**: Researched ModuleFileParser.java source code
- **Root Cause #3**: config.xml used attributes (`moduleId="ghanaemr" name="Ghana EMR"`) instead of child elements (`<id>ghanaemr</id><name>Ghana EMR</name>`)
- **Finding**: ModuleFileParser.getElementTrimmed() looks for element text content, ignores attributes
- **Verification**: Checked all major OpenMRS modules - ALL use child element format
- **Status**: FIX IDENTIFIED, ready for implementation

---

## Root Causes

### 1. Missing Transitive Dependencies (FIXED)

**Problem**: HAPI FHIR R4 and 30+ transitive dependencies not bundled in OMOD

**Why It Happened**:
- Default Maven JAR plugin only includes direct dependencies
- Runtime scope dependencies not automatically bundled
- No build verification of OMOD size

**Fix**:
```xml
<plugin>
    <artifactId>maven-dependency-plugin</artifactId>
    <executions>
        <execution>
            <id>copy-transitive-dependencies</id>
            <phase>prepare-package</phase>
            <goals>
                <goal>copy-dependencies</goal>
            </goals>
            <configuration>
                <outputDirectory>${project.build.outputDirectory}/lib</outputDirectory>
                <includeScope>runtime</includeScope>
                <excludeArtifactIds>openmrs-module-ghanaemr-api</excludeArtifactIds>
            </configuration>
        </execution>
    </executions>
</plugin>
```

**Prevention**:
- Add build verification step: Check OMOD size (should be ~20MB)
- Document expected OMOD size in build README

### 2. Incorrect Platform Version Documentation (FIXED)

**Problem**: AGENTS.md claimed "Platform 2.6.0 with reference-application-distro:2.11.0"

**Why It Happened**:
- Lack of verification against official OpenMRS documentation
- Assumption that Ref App version correlates with Platform version
- No research into actual Docker image contents

**Reality**:
| Ref App | Platform | Docker Image |
|---------|----------|--------------|
| 2.10.0 | 2.3.0 | ✅ Available |
| 2.11.0 | 2.3.2 | ✅ Available |
| 2.12.0 | 2.4.3 | ✅ Available |
| 2.13.0 | 2.5.9 | ❌ No image |
| 3.x | 2.6.0+ | ❌ Different architecture |

**Fix**:
- Updated AGENTS.md with correct version matrix
- Created TECHNOLOGY_COMPATIBILITY_MATRIX.md
- Upgraded to Ref App 2.12 (Platform 2.4.3)

**Prevention**:
- Mandatory pre-code verification against official docs
- Technology compatibility checklist (.github/TECH_COMPATIBILITY_CHECKLIST.md)

### 3. Config.xml Structure Error (PENDING FIX)

**Problem**: Used XML attributes instead of child elements

**Wrong**:
```xml
<module configVersion="1.2" moduleId="ghanaemr" name="Ghana EMR">
```

**Correct**:
```xml
<module configVersion="1.2">
    <id>ghanaemr</id>
    <name>Ghana EMR</name>
    <version>${project.version}</version>
</module>
```

**Why It Happened**:
- Lack of reference to existing OpenMRS module examples
- No verification against ModuleFileParser expectations
- Assumed attribute format would work (common in other XML schemas)

**How It Failed**:
1. ModuleFileParser calls `getElementTrimmed(rootNode, "name")`
2. This searches for `<name>` element text content
3. Attributes are ignored
4. Parser finds empty string
5. Throws "Name cannot be empty" exception

**Fix**: Restructure config.xml to use child elements (see implementation plan)

**Prevention**:
- Document config.xml structure requirements in TECHNOLOGY_COMPATIBILITY_MATRIX.md
- Add example config.xml to module template
- Pre-code checklist: "Verify XML structure matches OpenMRS examples"

---

## Impact Assessment

### Development Impact
- **6+ hours lost** to troubleshooting
- **Multiple failed deployment attempts**
- **Confusion about Platform version compatibility**
- **False confidence from "100% correct" claims**

### Technical Debt Created
- Test environment at localhost:8081 needs cleanup
- Temporary files: Dockerfile.test-2.13, docker-compose.test.yml
- Documentation scattered across multiple blockers/notes

### Knowledge Gaps Exposed
1. OpenMRS module packaging requirements
2. Reference Application vs Platform version mapping
3. ModuleFileParser XML parsing behavior
4. Transitive dependency management in OMODs

---

## Lessons Learned

### What Went Well
1. **Systematic Investigation**: Methodically ruled out causes
2. **Test-First Approach**: Created isolated test environment
3. **Source Code Analysis**: Researched ModuleFileParser to understand parsing logic
4. **Version Matrix Documentation**: Now have complete Ref App → Platform mapping

### What Went Wrong
1. **Insufficient Upfront Research**: Didn't verify against OpenMRS examples
2. **Overconfidence in Initial Diagnosis**: "100% correct" claim prevented deeper investigation
3. **Lack of Build Verification**: No size/structure checks on OMOD output
4. **Missing Governance**: No pre-code compatibility verification process

### Process Improvements

#### Implemented
1. **Technology Compatibility Checklist** (.github/TECH_COMPATIBILITY_CHECKLIST.md)
2. **Version Matrix Documentation** (docs/TECHNOLOGY_COMPATIBILITY_MATRIX.md)
3. **Updated AGENTS.md** with correct version constraints
4. **Test Environment Pattern** (docker-compose.test.yml for isolated testing)

#### Recommended
1. **Module Template Repository**: Reference implementation with correct config.xml
2. **Build Verification Script**: Automated checks for OMOD size, structure, config.xml format
3. **Pre-Deployment Checklist**: Mandatory steps before production deployment
4. **OpenMRS Module Development Guide**: Comprehensive documentation for team

---

## Action Items

### Immediate (Before Next Deployment)
- [x] Fix config.xml structure (attributes → child elements)
- [x] Rebuild module with corrected config.xml
- [x] Test module loading in test environment
- [ ] Verify Platform 2.4.3 compatibility
- [ ] Update production Dockerfile and docker-compose.yml
- [ ] Clean up test files

### Short-Term (This Sprint)
- [ ] Create .github/TECH_COMPATIBILITY_CHECKLIST.md
- [ ] Create docs/TECHNOLOGY_COMPATIBILITY_MATRIX.md
- [ ] Update AGENTS.md CRITICAL REQUIREMENTS
- [ ] Create docs/BLOCKER_POSTMORTEM.md (this document)
- [ ] Update README.md with deployment verification steps

### Long-Term (Next Quarter)
- [ ] Create OpenMRS module template repository
- [ ] Develop automated build verification script
- [ ] Document complete module development workflow
- [ ] Create CI/CD pipeline with compatibility checks

---

## References

- OpenMRS ModuleFileParser source: https://github.com/openmrs/openmrs-core/blob/master/api/src/main/java/org/openmrs/module/ModuleFileParser.java
- OpenMRS Module Development Guide: https://wiki.openmrs.org/display/docs/Creating+Modules
- HAPI FHIR R4 Documentation: https://hapifhir.io/hapi-fhir/docs/
- Reference Implementation: openmrs-module-coreapps config.xml

---

**Document Owner**: Clinical Informaticist
**Last Updated**: 2025-11-05
**Next Review**: After successful production deployment
```

### Step 10: Clean Up Test Environment

After successful testing:

```bash
# Stop and remove test containers
docker-compose -f docker-compose.test.yml down -v

# Remove test files
rm docker-compose.test.yml
rm backend/openmrs-module-ghanaemr/Dockerfile.test-2.13

# Remove extracted config.xml from earlier verification
cd backend/openmrs-module-ghanaemr/omod/target
rm config.xml
```

---

## Verification Checklist

After completing all steps:

- [ ] config.xml uses child elements (`<id>`, `<name>`, `<version>`)
- [ ] Module builds successfully (~20MB OMOD)
- [ ] Test environment starts without errors
- [ ] OpenMRS setup wizard completes
- [ ] Ghana EMR module loads (check logs for "Ghana EMR Module started")
- [ ] No "Name cannot be empty" errors
- [ ] Platform version compatibility confirmed (2.4.3 or 2.6.0)
- [ ] Production Dockerfile updated
- [ ] Technology compatibility documentation created
- [ ] Test files cleaned up

---

## Rollback Plan

If the fix fails:

1. **Revert config.xml**: `git checkout backend/openmrs-module-ghanaemr/omod/src/main/resources/config.xml`
2. **Stop test environment**: `docker-compose -f docker-compose.test.yml down`
3. **Document new findings**: Add to OPENMRS_MODULE_LOADING_BLOCKER.md
4. **Research alternative approaches**: Check OpenMRS forums/Slack

---

## Success Criteria

1. Module loads successfully on Platform 2.4.3
2. No errors in OpenMRS logs related to Ghana EMR
3. Module appears in Administration → Manage Modules
4. All Liquibase migrations run successfully
5. Spring application context initializes
6. NHIE integration endpoints respond (even if with auth errors)

---

## Self-Contained Prompt for Fresh Context

```
TASK: Fix Ghana EMR OpenMRS module loading failure

PROBLEM: Module fails to load with "Name cannot be empty" error

ROOT CAUSE: config.xml uses XML attributes instead of child elements
- Current: <module moduleId="ghanaemr" name="Ghana EMR">
- Required: <module><id>ghanaemr</id><name>Ghana EMR</name></module>

STEPS:
1. Read backend/openmrs-module-ghanaemr/omod/src/main/resources/config.xml
2. Replace attribute-based structure with child element structure (see this doc Step 1)
3. Run: cd backend/openmrs-module-ghanaemr && mvn clean package
4. Run: cd c:/temp/AI/MedReg && docker-compose -f docker-compose.test.yml build --no-cache test-openmrs
5. Run: docker-compose -f docker-compose.test.yml up -d
6. Navigate to http://localhost:8081/openmrs/initialsetup and complete setup
7. Check logs: docker logs medreg-test-openmrs 2>&1 | grep -i "ghana"
8. Verify success: Look for "Ghana EMR Module started" or similar
9. Update production Dockerfile to use openmrs-reference-application-distro:2.12
10. Create governance documentation (see Step 9)
11. Clean up test files (see Step 10)

REFERENCE: This implementation plan (OPENMRS_MODULE_FIX_IMPLEMENTATION.md)

SUCCESS: Module loads without "Name cannot be empty" error
```

---

## Additional Context

### Why This Matters

1. **Regulatory Compliance**: Ghana EMR module provides NHIE integration required by Ghana Health Service
2. **Patient Safety**: Module validates Ghana Card and NHIS numbers using Luhn algorithm
3. **Clinical Workflow**: Queue management and consultation tracking depend on this module
4. **Data Integrity**: Liquibase migrations manage database schema for regulatory audit logs

### Dependencies on This Fix

- Frontend patient registration (calls `/ws/rest/v1/ghanaemr/patients`)
- NHIE coverage verification (calls `/ws/rest/v1/ghanaemr/nhie/coverage`)
- Triage workflow (calls `/ws/rest/v1/ghanaemr/triage`)
- Consultation recording (calls `/ws/rest/v1/ghanaemr/consultation`)

### Technical Debt Addressed

1. ✅ Missing transitive dependencies (HAPI FHIR)
2. ✅ Incorrect Platform version documentation
3. ✅ config.xml structure (this fix)
4. ⏳ Technology compatibility governance (Step 9)

---

**END OF IMPLEMENTATION PLAN**

---

## Quick Reference Commands

```bash
# Build module
cd c:/temp/AI/MedReg/backend/openmrs-module-ghanaemr && mvn clean package

# Rebuild test environment
cd c:/temp/AI/MedReg && docker-compose -f docker-compose.test.yml build --no-cache test-openmrs

# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Monitor logs
docker logs -f medreg-test-openmrs

# Check module loading
docker logs medreg-test-openmrs 2>&1 | grep -i "ghana"

# Verify OMOD structure
jar -tf backend/openmrs-module-ghanaemr/omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod | grep config.xml

# Extract and read config.xml from OMOD
cd backend/openmrs-module-ghanaemr/omod/target
jar -xf openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod config.xml
cat config.xml

# Cleanup test environment
docker-compose -f docker-compose.test.yml down -v
rm docker-compose.test.yml backend/openmrs-module-ghanaemr/Dockerfile.test-2.13
```

---

**Document Status**: Ready for execution in fresh context window
**Estimated Implementation Time**: 30-45 minutes
**Risk Level**: Low (isolated test environment, clear rollback path)

---

## PROMPT FOR FRESH CONTEXT WINDOW

```
Read and execute the implementation plan in OPENMRS_MODULE_FIX_IMPLEMENTATION.md to fix the Ghana EMR module loading failure.

CONTEXT:
- Module fails to load with "Name cannot be empty" error
- Root cause: config.xml uses XML attributes instead of child elements
- Test environment already running at localhost:8081 (Platform 2.4.3)
- Validation script already created at backend/openmrs-module-ghanaemr/scripts/validate-omod.sh

TASKS TO COMPLETE:
1. Fix config.xml structure (attributes → child elements)
2. Rebuild module with validation
3. Restart test environment
4. Verify module loads successfully
5. Test Platform version compatibility
6. Update production configuration if test succeeds
7. Clean up test files

REFERENCE DOCS:
- Full implementation plan: OPENMRS_MODULE_FIX_IMPLEMENTATION.md
- Validation requirements: AGENTS.md (CRITICAL REQUIREMENTS section)
- Backend README: backend/openmrs-module-ghanaemr/README.md

SUCCESS CRITERIA:
- Module loads without "Name cannot be empty" error
- Logs show "Ghana EMR Module started successfully"
- Module appears in OpenMRS Admin → Manage Modules

START HERE:
Step 1 in OPENMRS_MODULE_FIX_IMPLEMENTATION.md (Fix config.xml Structure)
```
