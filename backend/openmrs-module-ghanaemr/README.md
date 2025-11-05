# Ghana EMR OpenMRS Module

**Module ID**: ghanaemr
**Version**: 0.1.0-SNAPSHOT
**Required Platform**: OpenMRS 2.6.0+

---

## Building the Module

### Quick Build (Recommended)

```bash
cd backend/openmrs-module-ghanaemr
mvn clean package
./scripts/validate-omod.sh omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod
```

The validation script checks:
- ✅ config.xml structure (child elements, not attributes)
- ✅ OMOD size (~20MB with dependencies)
- ✅ All 27 transitive dependencies bundled
- ✅ Activator class exists

### Expected Output

```
Building Ghana EMR Module...
[INFO] BUILD SUCCESS
[INFO] Total time: 45 s

=== OpenMRS OMOD Validation Script ===
Validating: omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod

OMOD Size: 20MB
Checking for config.xml... Found
Extracting config.xml...
Validating config.xml structure...
  <id>ghanaemr</id>
  <name>Ghana EMR</name>
  <version>0.1.0-SNAPSHOT</version>
Checking bundled dependencies...
  Found 27 bundled JARs in lib/
Checking for critical dependencies...
  hapi-fhir-base
  hapi-fhir-structures-r4
  gson
  okhttp
Checking for activator class: org.openmrs.module.ghanaemr.GhanaEMRActivator... Found

=== ALL VALIDATIONS PASSED ===
OMOD is ready for deployment
```

---

## Project Structure

```
openmrs-module-ghanaemr/
├── api/                           # Core module logic
│   └── src/main/java/
│       └── org/openmrs/module/ghanaemr/
│           ├── api/
│           │   ├── fhir/          # FHIR resource mappers
│           │   ├── nhie/          # NHIE integration services
│           │   └── queue/         # Queue management
│           ├── dto/               # Data transfer objects
│           ├── exception/         # Custom exceptions
│           ├── service/           # Business logic services
│           ├── util/              # Utilities (folder number, sequence)
│           └── validation/        # Ghana Card & NHIS validators
│
├── omod/                          # Web module (REST controllers)
│   └── src/main/
│       ├── java/org/openmrs/module/ghanaemr/web/
│       │   ├── GhanaPatientController.java
│       │   ├── TriageController.java
│       │   ├── ConsultationController.java
│       │   ├── NHIECoverageController.java
│       │   └── ... (8 controllers)
│       └── resources/
│           └── config.xml         # Module configuration
│
├── scripts/
│   └── validate-omod.sh           # Build validation script
│
└── pom.xml                        # Parent POM
```

---

## Module Configuration (config.xml)

**CRITICAL**: OpenMRS requires child elements, NOT attributes.

✅ **CORRECT**:
```xml
<module configVersion="1.2">
    <id>ghanaemr</id>
    <name>Ghana EMR</name>
    <version>${project.version}</version>
    <activator>org.openmrs.module.ghanaemr.GhanaEMRActivator</activator>
    <require_version>2.6.0</require_version>
    ...
</module>
```

❌ **WRONG** (causes "Name cannot be empty" error):
```xml
<module configVersion="1.2" moduleId="ghanaemr" name="Ghana EMR">
```

---

## Common Build Errors

### ERROR: "Name cannot be empty Module: openmrs-module-ghanaemr-*.omod"

**Cause**: config.xml uses attributes instead of child elements

**Fix**: Update `omod/src/main/resources/config.xml`:
```xml
<!-- Change from attributes -->
<module moduleId="ghanaemr" name="Ghana EMR">

<!-- To child elements -->
<module>
    <id>ghanaemr</id>
    <name>Ghana EMR</name>
</module>
```

### WARNING: "OMOD too small (0MB). Expected ~20MB"

**Cause**: Transitive dependencies not bundled

**Fix**: Check `omod/pom.xml` has maven-dependency-plugin configured:
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

### ERROR: "Package cannot be empty Module: Ghana EMR"

**Cause**: config.xml missing required `<package>` element

**Fix**: Update `omod/src/main/resources/config.xml` to include package element:
```xml
<module configVersion="1.2">
    <id>ghanaemr</id>
    <name>Ghana EMR</name>
    <version>${project.version}</version>
    <package>org.openmrs.module.ghanaemr</package>  <!-- ADD THIS LINE -->
</module>
```

### ERROR: "Only X JARs found. Expected ~27"

**Cause**: maven-dependency-plugin not copying runtime dependencies

**Fix**: Ensure `<includeScope>runtime</includeScope>` is set in omod/pom.xml

### Complete Working config.xml Example

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

---

## Testing

```bash
# Run all tests
mvn clean test

# Run specific test class
mvn test -Dtest=GhanaPatientServiceTest

# Skip tests during build
mvn clean package -DskipTests
```

---

## Deployment

### Docker Deployment

```bash
# From project root
cd backend/openmrs-module-ghanaemr
mvn clean package
./scripts/validate-omod.sh omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod

# Copy to OpenMRS modules directory (Docker will pick it up)
cp omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod \
   ../../openmrs-modules/

# Rebuild Docker image
cd ../..
docker-compose build --no-cache openmrs
docker-compose up -d
```

### Verify Module Loaded

```bash
# Check logs for module loading
docker logs openmrs 2>&1 | grep -i "ghana"

# Expected output:
# Installing Ghana EMR module to /usr/local/tomcat/.OpenMRS/modules/
# Ghana EMR module installed successfully
# INFO - ModuleFactory.loadModule - Loading module: Ghana EMR
# INFO - ModuleFactory.startModule - Starting module: Ghana EMR
# INFO - GhanaEMRActivator.started - Ghana EMR Module started successfully
```

### Check Module in OpenMRS Admin

1. Log in to OpenMRS: http://localhost:8080/openmrs
2. Navigate to: **Administration** → **Manage Modules**
3. Find **Ghana EMR** in module list
4. Status should be: **Started**

---

## REST API Endpoints

After module loads successfully, these endpoints are available:

### Patient Registration
- `POST /ws/rest/v1/ghanaemr/patients` - Register new patient with Ghana Card/NHIS
- `GET /ws/rest/v1/ghanaemr/patients/{uuid}` - Get patient details

### Triage
- `POST /ws/rest/v1/ghanaemr/triage` - Create triage encounter

### Consultation
- `POST /ws/rest/v1/ghanaemr/consultation` - Create consultation encounter

### NHIE Integration
- `GET /ws/rest/v1/ghanaemr/nhie/coverage/{membershipNumber}` - Check NHIS coverage
- `POST /ws/rest/v1/ghanaemr/nhie/sync` - Sync patient to NHIE

### Reports
- `GET /ws/rest/v1/ghanaemr/reports/opd` - OPD register report
- `GET /ws/rest/v1/ghanaemr/reports/nhis-vs-cash` - Payment type breakdown

---

## Dependencies

### Core Dependencies
- **OpenMRS Platform**: 2.6.0
- **HAPI FHIR R4**: 5.5.3 (FHIR resource mapping)
- **Gson**: 2.8.9 (JSON serialization)
- **OkHttp**: 4.9.3 (HTTP client for NHIE)
- **Guava**: 31.0.1-jre (Utilities)

### Bundled JARs (27 total)
All transitive dependencies are bundled in the OMOD `lib/` directory:
- hapi-fhir-base-5.5.3.jar
- hapi-fhir-structures-r4-5.5.3.jar
- gson-2.8.9.jar
- okhttp-4.9.3.jar
- guava-31.0.1-jre.jar
- ... (22 more dependencies)

---

## Troubleshooting

### Module Not Loading

1. **Check Docker logs**:
   ```bash
   docker logs openmrs 2>&1 | grep -iE "ghana|error"
   ```

2. **Verify OMOD in modules directory**:
   ```bash
   docker exec openmrs ls -lh /usr/local/tomcat/.OpenMRS/modules/
   ```

3. **Check module validation**:
   ```bash
   ./scripts/validate-omod.sh omod/target/openmrs-module-ghanaemr-*.omod
   ```

4. **Verify config.xml structure**:
   ```bash
   jar -xf omod/target/openmrs-module-ghanaemr-*.omod config.xml
   cat config.xml
   # Should show <id>, <name>, <version> as child elements
   ```

### Build Failures

1. **Java version check**:
   ```bash
   java -version
   # Must be: openjdk version "1.8.0_472"
   ```

2. **Maven version check**:
   ```bash
   mvn -version
   # Must use Java 1.8.0_472
   ```

3. **Clean build**:
   ```bash
   mvn clean install -U  # Force update dependencies
   ```

---

## Development

### Adding New Controller

1. Create controller in `omod/src/main/java/org/openmrs/module/ghanaemr/web/`
2. Annotate with `@RestController` and `@RequestMapping`
3. Inject services via constructor
4. Add audit logging via `AuditLogger`

Example:
```java
@RestController
@RequestMapping("/rest/v1/ghanaemr/myfeature")
public class MyFeatureController {

    private final MyFeatureService myFeatureService;
    private final AuditLogger auditLogger;

    public MyFeatureController(MyFeatureService myFeatureService,
                              AuditLogger auditLogger) {
        this.myFeatureService = myFeatureService;
        this.auditLogger = auditLogger;
    }

    @PostMapping
    public ResponseEntity<?> createFeature(@RequestBody MyDTO dto) {
        // Implementation
    }
}
```

### Adding New Service

1. Create interface in `api/src/main/java/org/openmrs/module/ghanaemr/service/`
2. Create implementation in `api/src/main/java/org/openmrs/module/ghanaemr/service/impl/`
3. Register as Spring bean in `api/src/main/resources/moduleApplicationContext.xml`

---

## Resources

- **Module Fix Implementation**: [OPENMRS_MODULE_FIX_IMPLEMENTATION.md](../../OPENMRS_MODULE_FIX_IMPLEMENTATION.md)
- **Project Documentation**: [AGENTS.md](../../AGENTS.md)
- **Implementation Tracker**: [IMPLEMENTATION_TRACKER.md](../../IMPLEMENTATION_TRACKER.md)
- **OpenMRS Module Development**: https://wiki.openmrs.org/display/docs/Creating+Modules
- **HAPI FHIR Documentation**: https://hapifhir.io/hapi-fhir/docs/

---

**Last Updated**: November 5, 2025
