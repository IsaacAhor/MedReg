# MedReg Security Remediation - Implementation Roadmap

**Version:** 1.0
**Date:** November 8, 2025
**Total Effort:** 175 hours (8 weeks)
**Status:** Ready for execution

---

## Document Purpose

This roadmap provides **step-by-step implementation instructions** for remediating all security issues identified in the MedReg security review. Use this alongside:

- **SECURITY_ISSUES_CHECKLIST.md** - Track progress as you complete tasks
- **SECURITY_REVIEW_REPORT.md** - Reference detailed technical analysis
- **SECURITY_REVIEW_INDEX.md** - Navigate between documents

---

## Quick Start

### Week 1: Critical Security Fixes (60 hours)

**Goal:** Eliminate all CRITICAL vulnerabilities before any deployment

**Team:** 2 senior developers
**Deliverable:** All 8 CRITICAL issues resolved and tested

#### Day 1-2: SQL Injection Remediation (20 hours)

**Files to Fix:**
1. `AuditLogger.java:20-22`
2. `NHIEDlqController.java:26-28, 65-66`
3. `ReportsController.java:29, 33, 39, 113+`
4. `OPDMetricsController.java:27, 36`
5. `NHIECoverageServiceImpl.java:53`
6. `NHIERetryJob.java:92, 100-101`

**Step-by-step:**

**Step 1: Create PreparedStatement utility class (2 hours)**

```java
// File: backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/util/SafeQueryExecutor.java

package org.openmrs.module.ghanaemr.util;

import java.sql.*;
import java.util.*;

public class SafeQueryExecutor {

    /**
     * Execute a parameterized query safely
     * @param conn Database connection
     * @param sql SQL query with ? placeholders
     * @param params Parameter values in order
     * @return ResultSet
     */
    public static ResultSet executeQuery(Connection conn, String sql, Object... params)
            throws SQLException {
        PreparedStatement stmt = conn.prepareStatement(sql);
        setParameters(stmt, params);
        return stmt.executeQuery();
    }

    /**
     * Execute a parameterized update safely
     * @param conn Database connection
     * @param sql SQL update with ? placeholders
     * @param params Parameter values in order
     * @return Number of rows affected
     */
    public static int executeUpdate(Connection conn, String sql, Object... params)
            throws SQLException {
        PreparedStatement stmt = conn.prepareStatement(sql);
        setParameters(stmt, params);
        return stmt.executeUpdate();
    }

    private static void setParameters(PreparedStatement stmt, Object... params)
            throws SQLException {
        for (int i = 0; i < params.length; i++) {
            Object param = params[i];
            if (param instanceof String) {
                stmt.setString(i + 1, (String) param);
            } else if (param instanceof Integer) {
                stmt.setInt(i + 1, (Integer) param);
            } else if (param instanceof Long) {
                stmt.setLong(i + 1, (Long) param);
            } else if (param instanceof Timestamp) {
                stmt.setTimestamp(i + 1, (Timestamp) param);
            } else if (param == null) {
                stmt.setNull(i + 1, Types.NULL);
            } else {
                stmt.setObject(i + 1, param);
            }
        }
    }
}
```

**Step 2: Fix AuditLogger.java (1 hour)**

```java
// BEFORE (VULNERABLE):
String sql = "INSERT INTO audit_log (action, subject, patient_uuid, details, created_at) " +
    "VALUES ('" + safeAction + "','" + safeSubject + "','" + safeUuid + "','" + safeDetails + "', NOW())";

// AFTER (SECURE):
String sql = "INSERT INTO audit_log (action, subject, patient_uuid, details, created_at) " +
    "VALUES (?, ?, ?, ?, NOW())";
SafeQueryExecutor.executeUpdate(connection, sql, action, subject, patientUuid, details);
```

**Step 3: Fix NHIEDlqController.java (2 hours)**

```java
// BEFORE (VULNERABLE):
String query = "SELECT ... " + baseSql + " ORDER BY updated_at DESC LIMIT " + limit + " OFFSET " + offset;

// AFTER (SECURE):
String query = "SELECT id, patient_uuid, operation, resource_type, payload, error_message, " +
    "retry_count, status, next_retry_at, created_at, updated_at " +
    "FROM ghanaemr_nhie_transaction_log " +
    "WHERE status = ? " +
    "ORDER BY updated_at DESC LIMIT ? OFFSET ?";
ResultSet rs = SafeQueryExecutor.executeQuery(connection, query, "FAILED", limit, offset);
```

**Step 4: Fix ReportsController.java (4 hours)**

```java
// BEFORE (VULNERABLE):
String encTypeIdSql = "SELECT encounter_type_id FROM encounter_type WHERE uuid='" + encounterTypeUuid + "'";

// AFTER (SECURE):
String encTypeIdSql = "SELECT encounter_type_id FROM encounter_type WHERE uuid = ?";
ResultSet rs = SafeQueryExecutor.executeQuery(connection, encTypeIdSql, encounterTypeUuid);
```

**Step 5: Fix OPDMetricsController.java (2 hours)**

Similar pattern to ReportsController.

**Step 6: Fix NHIECoverageServiceImpl.java (2 hours)**

```java
// BEFORE (VULNERABLE):
String sql = "SELECT status, coverage_json, expires_at FROM ghanaemr_nhie_coverage_cache WHERE nhis_number='" + nhis + "'";

// AFTER (SECURE):
String sql = "SELECT status, coverage_json, expires_at FROM ghanaemr_nhie_coverage_cache WHERE nhis_number = ?";
ResultSet rs = SafeQueryExecutor.executeQuery(connection, sql, nhis);
```

**Step 7: Fix NHIERetryJob.java (2 hours)**

```java
// BEFORE (VULNERABLE):
String sql = "UPDATE ghanaemr_nhie_transaction_log SET status='SUCCESS', " +
    "nhie_resource_id=" + (nhie == null ? "NULL" : "'" + nhie + "'") + ...;

// AFTER (SECURE):
String sql = "UPDATE ghanaemr_nhie_transaction_log SET status=?, nhie_resource_id=?, " +
    "updated_at=? WHERE id=?";
SafeQueryExecutor.executeUpdate(connection, sql, "SUCCESS", nhieResourceId, now, transactionId);
```

**Step 8: Test all SQL fixes (5 hours)**

Create test cases for each fixed query:

```java
@Test
public void testAuditLoggerNoSQLInjection() {
    // Attempt SQL injection in action parameter
    String maliciousAction = "test'; DROP TABLE audit_log; --";
    auditLogger.log(maliciousAction, "subject", "uuid", "details");

    // Verify the malicious string was inserted as-is, not executed
    List<AuditLog> logs = auditService.findByAction(maliciousAction);
    assertEquals(1, logs.size());
    assertEquals(maliciousAction, logs.get(0).getAction());
}
```

---

#### Day 3: Credential Externalization (10 hours)

**Step 1: Create environment template (1 hour)**

```bash
# File: .env.template

# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_NAME=openmrs
DB_USERNAME=openmrs_user
DB_PASSWORD=CHANGE_ME_IN_PRODUCTION

# Admin Credentials
ADMIN_PASSWORD=CHANGE_ME_IN_PRODUCTION

# NHIE OAuth Credentials
NHIE_OAUTH_CLIENT_ID=CHANGE_ME_IN_PRODUCTION
NHIE_OAUTH_CLIENT_SECRET=CHANGE_ME_IN_PRODUCTION
NHIE_BASE_URL=https://nhie.nhia.gov.gh/fhir

# Encryption Keys
DB_ENCRYPTION_KEY=GENERATE_32_BYTE_KEY
```

**Step 2: Update openmrs-runtime.properties (2 hours)**

```properties
# BEFORE (VULNERABLE):
connection.url=jdbc:mysql://mysql:3306/openmrs
connection.username=openmrs_user
connection.password=openmrs_password

# AFTER (SECURE):
connection.url=jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?useSSL=true&requireSSL=true
connection.username=${DB_USERNAME}
connection.password=${DB_PASSWORD}
```

**Step 3: Update docker-compose.yml (2 hours)**

```yaml
# BEFORE (VULNERABLE):
environment:
  MYSQL_ROOT_PASSWORD: root_password
  MYSQL_PASSWORD: openmrs_password

# AFTER (SECURE):
environment:
  MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
  MYSQL_PASSWORD: ${DB_PASSWORD}
env_file:
  - .env
```

**Step 4: Update frontend API routes (3 hours)**

```typescript
// BEFORE (VULNERABLE):
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';

// AFTER (SECURE):
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD;
if (!OPENMRS_PASSWORD) {
  throw new Error('OPENMRS_PASSWORD environment variable not set');
}
```

**Step 5: Create startup validation script (2 hours)**

```bash
#!/bin/bash
# File: scripts/validate-env.sh

required_vars=(
  "DB_HOST"
  "DB_PASSWORD"
  "ADMIN_PASSWORD"
  "NHIE_OAUTH_CLIENT_SECRET"
  "DB_ENCRYPTION_KEY"
)

missing=()
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "ERROR: Missing required environment variables:"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

echo "✓ All required environment variables are set"
```

---

#### Day 4: SSL/TLS Security (5 hours)

**Step 1: Fix NHIEHttpClient.java (3 hours)**

```java
// BEFORE (VULNERABLE):
SSLContext sslContext = SSLContextBuilder.create()
    .loadTrustMaterial(new TrustAllStrategy())
    .build();
SSLConnectionSocketFactory sslSocketFactory = new SSLConnectionSocketFactory(
    sslContext,
    NoopHostnameVerifier.INSTANCE  // ← VULNERABLE
);

// AFTER (SECURE):
// Option 1: Use default SSL validation
SSLConnectionSocketFactory sslSocketFactory =
    SSLConnectionSocketFactory.getSocketFactory();

// Option 2: Use custom truststore for Ghana NHIE certificate
KeyStore trustStore = loadNHIETrustStore();
SSLContext sslContext = SSLContextBuilder.create()
    .loadTrustMaterial(trustStore, null)
    .build();
SSLConnectionSocketFactory sslSocketFactory =
    new SSLConnectionSocketFactory(sslContext);

private static KeyStore loadNHIETrustStore() throws Exception {
    String truststorePath = System.getenv("NHIE_TRUSTSTORE_PATH");
    String truststorePassword = System.getenv("NHIE_TRUSTSTORE_PASSWORD");

    KeyStore ks = KeyStore.getInstance("JKS");
    try (FileInputStream fis = new FileInputStream(truststorePath)) {
        ks.load(fis, truststorePassword.toCharArray());
    }
    return ks;
}
```

**Step 2: Enable database SSL (2 hours)**

```properties
# openmrs-runtime.properties
connection.url=jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?useSSL=true&requireSSL=true&verifyServerCertificate=true
```

Update MySQL docker-compose.yml:
```yaml
mysql:
  command:
    - --require_secure_transport=ON
    - --ssl-ca=/etc/mysql/certs/ca.pem
    - --ssl-cert=/etc/mysql/certs/server-cert.pem
    - --ssl-key=/etc/mysql/certs/server-key.pem
  volumes:
    - ./certs/mysql:/etc/mysql/certs:ro
```

---

#### Day 5: Exception Logging (8 hours)

**Step 1: Add SLF4J dependency (1 hour)**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>1.7.36</version>
</dependency>
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <version>1.2.11</version>
</dependency>
```

**Step 2: Fix all empty catch blocks (6 hours)**

```java
// BEFORE (VULNERABLE):
try {
    // code
} catch (Exception ignored) { }

// AFTER (SECURE):
private static final Logger log = LoggerFactory.getLogger(ClassName.class);

try {
    // code
} catch (Exception e) {
    log.error("Failed to process transaction for patient {}: {}",
        patientUuid, e.getMessage(), e);
    // Decide: rethrow, return error, or continue with degraded functionality
    throw new NHIEIntegrationException("Transaction processing failed", e);
}
```

**Files to fix:**
- DefaultNHIETransactionLogger.java:70
- NHIECoverageServiceImpl.java
- TriageController.java
- NHIEMetricsController.java
- GhanaPatientController.java:54, 239
- NHIEDlqController.java:105

**Step 3: Create logback.xml configuration (1 hour)**

```xml
<!-- File: backend/openmrs-module-ghanaemr/omod/src/main/resources/logback.xml -->
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>/var/log/openmrs/ghanaemr.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>/var/log/openmrs/ghanaemr.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>90</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="FILE" />
    </root>

    <logger name="org.openmrs.module.ghanaemr" level="DEBUG" />
</configuration>
```

---

#### Day 6-7: Testing Phase 1 Fixes (17 hours)

**Test Plan:**

1. **SQL Injection Tests (5 hours)**
   - Test each fixed query with malicious inputs
   - Verify PreparedStatements prevent injection
   - Check error handling doesn't leak info

2. **Credential Tests (3 hours)**
   - Verify no hardcoded credentials in code
   - Test startup fails without required env vars
   - Check credentials not in logs

3. **SSL/TLS Tests (4 hours)**
   - Verify NHIE connection uses proper SSL
   - Test certificate validation works
   - Check database connection encrypted

4. **Exception Handling Tests (3 hours)**
   - Verify all exceptions logged
   - Check log files created correctly
   - Verify sensitive data not in logs

5. **Integration Tests (2 hours)**
   - End-to-end patient registration
   - NHIE sync with proper SSL
   - Audit logging works

---

### Week 2-3: High Priority Issues (40 hours)

#### Sprint 2.1: Dependency Updates (15 hours)

**Step 1: Update Apache HttpClient (5 hours)**

```xml
<!-- BEFORE -->
<dependency>
    <groupId>org.apache.httpcomponents</groupId>
    <artifactId>httpclient</artifactId>
    <version>4.5.13</version>
</dependency>

<!-- AFTER -->
<dependency>
    <groupId>org.apache.httpcomponents.client5</groupId>
    <artifactId>httpclient5</artifactId>
    <version>5.2.1</version>
</dependency>
```

**Migration required:** Update NHIEHttpClient to use HttpClient 5.x API

**Step 2: Update HAPI FHIR (7 hours)**

```xml
<!-- BEFORE -->
<dependency>
    <groupId>ca.uhn.hapi.fhir</groupId>
    <artifactId>hapi-fhir-structures-r4</artifactId>
    <version>5.5.3</version>
</dependency>

<!-- AFTER -->
<dependency>
    <groupId>ca.uhn.hapi.fhir</groupId>
    <artifactId>hapi-fhir-structures-r4</artifactId>
    <version>6.8.0</version>
</dependency>
```

**Step 3: Regression testing (3 hours)**

---

#### Sprint 2.2: Type Safety Fixes (12 hours)

**Step 1: Define proper TypeScript interfaces (6 hours)**

```typescript
// File: frontend/src/types/openmrs.ts

export interface OpenMRSPatient {
  uuid: string;
  display: string;
  identifiers: PatientIdentifier[];
  person: Person;
}

export interface PatientIdentifier {
  uuid: string;
  identifier: string;
  identifierType: {
    uuid: string;
    display: string;
  };
}

export interface Diagnosis {
  concept: {
    uuid: string;
    display: string;
  };
  certainty: 'CONFIRMED' | 'PROVISIONAL';
  rank: number;
}
```

**Step 2: Remove all `as any` casts (6 hours)**

```typescript
// BEFORE:
const summary = (diagnoses as any[]).map(...)

// AFTER:
const summary = (diagnoses as Diagnosis[]).map(...)
```

---

#### Sprint 2.3: Input Validation (8 hours)

**Step 1: Add validation annotations (4 hours)**

```java
@RestController
@RequestMapping("/ws/rest/v1/ghana/reports")
public class ReportsController {

    @GetMapping("/opd-register")
    public ResponseEntity<?> opdRegister(
        @RequestParam @Pattern(regexp = "^[a-f0-9-]{36}$") String encounterTypeUuid,
        @RequestParam @Pattern(regexp = "^[a-f0-9-]{36}$") String locationUuid,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        // Now parameters are validated
    }
}
```

**Step 2: Add Ghana Card validation (2 hours)**

```java
public class GhanaCardValidator {
    private static final Pattern GHANA_CARD_PATTERN =
        Pattern.compile("^GHA-\\d{9}-\\d$");

    public static boolean isValid(String ghanaCard) {
        if (!GHANA_CARD_PATTERN.matcher(ghanaCard).matches()) {
            return false;
        }

        // Extract digits for Luhn check
        String digits = ghanaCard.replaceAll("[^0-9]", "");
        return passesLuhnCheck(digits);
    }
}
```

**Step 3: Testing (2 hours)**

---

#### Sprint 2.4: Authentication & Authorization (5 hours)

**Step 1: Add rate limiting (3 hours)**

```java
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, RateLimiter> limiters = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) {
        String clientId = getClientIdentifier(request);
        RateLimiter limiter = limiters.computeIfAbsent(clientId,
            k -> RateLimiter.create(10.0)); // 10 requests per second

        if (!limiter.tryAcquire()) {
            response.setStatus(429); // Too Many Requests
            return;
        }

        filterChain.doFilter(request, response);
    }
}
```

**Step 2: Add audit logging for auth (2 hours)**

---

### Week 4: Medium Priority Issues (20 hours)

#### Sprint 3.1: CORS Configuration (2 hours)

```yaml
# docker-compose.yml
hapi.fhir.cors.allowed_origin: ${ALLOWED_ORIGINS:-http://localhost:3000}
```

```typescript
// frontend next.config.js
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGINS },
      ],
    },
  ];
}
```

---

#### Sprint 3.2: CSRF Protection (5 hours)

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf()
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .and()
            .authorizeRequests()
                .antMatchers("/ws/rest/v1/ghana/**").authenticated();
    }
}
```

---

#### Sprint 3.3: Content Security Policy (3 hours)

```java
@Bean
public FilterRegistrationBean<HeaderWriterFilter> cspFilter() {
    FilterRegistrationBean<HeaderWriterFilter> registrationBean = new FilterRegistrationBean<>();

    HeaderWriterFilter filter = new HeaderWriterFilter(Arrays.asList(
        new StaticHeadersWriter("Content-Security-Policy",
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"),
        new StaticHeadersWriter("X-Frame-Options", "DENY"),
        new StaticHeadersWriter("X-Content-Type-Options", "nosniff")
    ));

    registrationBean.setFilter(filter);
    registrationBean.addUrlPatterns("/*");

    return registrationBean;
}
```

---

#### Sprint 3.4: Comprehensive Audit Logging (10 hours)

**Step 1: Create audit event types (2 hours)**

```java
public enum AuditEventType {
    PATIENT_CREATED,
    PATIENT_UPDATED,
    PATIENT_VIEWED,
    PATIENT_SEARCHED,
    NHIE_SYNC_SUCCESS,
    NHIE_SYNC_FAILED,
    LOGIN_SUCCESS,
    LOGIN_FAILED,
    UNAUTHORIZED_ACCESS
}
```

**Step 2: Implement audit interceptor (5 hours)**

```java
@Component
public class AuditInterceptor extends HandlerInterceptorAdapter {

    @Autowired
    private AuditLogger auditLogger;

    @Override
    public boolean preHandle(HttpServletRequest request,
                           HttpServletResponse response,
                           Object handler) {
        User user = getCurrentUser();
        String action = request.getMethod() + " " + request.getRequestURI();

        auditLogger.log(AuditEventType.API_ACCESS, user.getUuid(), action);

        return true;
    }
}
```

**Step 3: Testing (3 hours)**

---

### Week 5-6: Compliance Requirements (30 hours)

#### Sprint 4.1: Encryption at Rest (10 hours)

**Step 1: Create encryption utility (3 hours)**

```java
@Component
public class FieldEncryption {

    private final SecretKey key;

    public FieldEncryption() {
        String keyString = System.getenv("DB_ENCRYPTION_KEY");
        this.key = new SecretKeySpec(Base64.getDecoder().decode(keyString), "AES");
    }

    public String encrypt(String plaintext) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key);

        byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        byte[] iv = cipher.getIV();

        // Concatenate IV + encrypted data
        byte[] combined = new byte[iv.length + encrypted.length];
        System.arraycopy(iv, 0, combined, 0, iv.length);
        System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

        return Base64.getEncoder().encodeToString(combined);
    }

    public String decrypt(String ciphertext) throws Exception {
        byte[] combined = Base64.getDecoder().decode(ciphertext);

        // Extract IV
        byte[] iv = new byte[12]; // GCM standard IV size
        System.arraycopy(combined, 0, iv, 0, iv.length);

        // Extract encrypted data
        byte[] encrypted = new byte[combined.length - iv.length];
        System.arraycopy(combined, iv.length, encrypted, 0, encrypted.length);

        GCMParameterSpec spec = new GCMParameterSpec(128, iv);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key, spec);

        byte[] decrypted = cipher.doFinal(encrypted);
        return new String(decrypted, StandardCharsets.UTF_8);
    }
}
```

**Step 2: Apply encryption to sensitive fields (5 hours)**

```java
@Entity
@Table(name = "patient_identifier")
public class PatientIdentifier {

    @Column(name = "identifier")
    @Convert(converter = EncryptedStringConverter.class)
    private String identifier; // Ghana Card, NHIS encrypted
}

@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    @Autowired
    private FieldEncryption encryption;

    @Override
    public String convertToDatabaseColumn(String attribute) {
        try {
            return encryption.encrypt(attribute);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        try {
            return encryption.decrypt(dbData);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
```

**Step 3: Database migration (2 hours)**

---

#### Sprint 4.2: Consent Management (10 hours)

**Step 1: Create consent schema (2 hours)**

```sql
CREATE TABLE patient_consent (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_uuid VARCHAR(38) NOT NULL,
    consent_type VARCHAR(50) NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    granted_date DATETIME NOT NULL,
    expires_date DATETIME,
    withdrawn_date DATETIME,
    created_by VARCHAR(38),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_patient_type (patient_uuid, consent_type),
    FOREIGN KEY (patient_uuid) REFERENCES patient(uuid)
);
```

**Step 2: Implement consent service (5 hours)**

```java
@Service
public class PatientConsentService {

    public boolean hasValidConsent(String patientUuid, String consentType) {
        PatientConsent consent = consentDao.findByPatientAndType(patientUuid, consentType);

        if (consent == null || !consent.isGranted()) {
            return false;
        }

        if (consent.getWithdrawnDate() != null) {
            return false;
        }

        if (consent.getExpiresDate() != null &&
            consent.getExpiresDate().before(new Date())) {
            return false;
        }

        return true;
    }

    public void grantConsent(String patientUuid, String consentType, Date expiresAt) {
        PatientConsent consent = new PatientConsent();
        consent.setPatientUuid(patientUuid);
        consent.setConsentType(consentType);
        consent.setGranted(true);
        consent.setGrantedDate(new Date());
        consent.setExpiresDate(expiresAt);

        consentDao.save(consent);
    }
}
```

**Step 3: Integrate with NHIE sync (3 hours)**

```java
@Override
public String syncPatientToNHIE(Patient patient) throws NHIEIntegrationException {
    // Check consent first
    if (!consentService.hasValidConsent(patient.getUuid(), "NHIE_SHARE")) {
        throw new ConsentRequiredException(
            "Patient has not consented to NHIE data sharing");
    }

    // Proceed with sync...
}
```

---

#### Sprint 4.3: BAA & Documentation (10 hours)

**Step 1: Create BAA template (3 hours)**

```markdown
# File: docs/compliance/business-associate-agreement-template.md

# BUSINESS ASSOCIATE AGREEMENT (BAA)

This agreement between [Facility Name] ("Covered Entity") and Ghana NHIE ("Business Associate")...

## 1. Definitions
## 2. Permitted Uses and Disclosures
## 3. Safeguards
## 4. Reporting Requirements
## 5. Termination
```

**Step 2: Document data flows (4 hours)**

Create comprehensive data flow diagrams showing:
- Patient registration → Database → NHIE
- Audit trail data flows
- Backup and recovery flows

**Step 3: Compliance checklist (3 hours)**

---

### Week 7-8: Testing & Finalization (25 hours)

#### Final Security Testing (15 hours)

1. **Penetration Testing (8 hours)**
   - SQL injection attempts
   - Authentication bypass attempts
   - Authorization tests
   - Session management tests
   - Input validation tests

2. **Compliance Audit (5 hours)**
   - HIPAA requirements checklist
   - Ghana Data Protection Act review
   - GDPR compliance check

3. **Integration Testing (2 hours)**
   - End-to-end workflows
   - NHIE sync with encryption
   - Audit logging verification

#### Documentation Updates (10 hours)

1. **Security documentation (4 hours)**
2. **Deployment guides (3 hours)**
3. **Incident response procedures (3 hours)**

---

## Progress Tracking

Use **SECURITY_ISSUES_CHECKLIST.md** to track completion. Check off items as you complete them:

```markdown
- [x] SQL Injection in AuditLogger (COMPLETED 2025-11-10)
- [x] SQL Injection in NHIEDlqController (COMPLETED 2025-11-10)
- [ ] SQL Injection in ReportsController (IN PROGRESS)
```

---

## Testing Checkpoints

After each phase, verify:

### Phase 1 Checkpoint
- [ ] All SQL queries use PreparedStatement
- [ ] No hardcoded credentials in code
- [ ] SSL/TLS properly configured
- [ ] All exceptions logged
- [ ] Security tests pass

### Phase 2 Checkpoint
- [ ] Dependencies updated and tested
- [ ] No `as any` type casts
- [ ] Input validation on all endpoints
- [ ] Rate limiting active
- [ ] Integration tests pass

### Phase 3 Checkpoint
- [ ] CORS restricted to allowed origins
- [ ] CSRF protection enabled
- [ ] CSP headers configured
- [ ] Audit logging comprehensive

### Phase 4 Checkpoint
- [ ] PHI encrypted at rest
- [ ] Consent management functional
- [ ] BAA templates created
- [ ] Compliance audit passed

---

## Deployment Gates

**DO NOT DEPLOY until all gates pass:**

1. ✅ All CRITICAL issues fixed
2. ✅ All HIGH priority issues fixed
3. ✅ Security code review completed
4. ✅ Penetration testing passed
5. ✅ HIPAA compliance audit passed
6. ✅ BAA signed with NHIE
7. ✅ Incident response plan in place
8. ✅ Backup and disaster recovery tested
9. ✅ Monitoring and alerting configured
10. ✅ Staff security training completed

---

## Resources & References

- **SECURITY_REVIEW_REPORT.md** - Detailed technical analysis
- **SECURITY_ISSUES_CHECKLIST.md** - Quick reference for tracking
- **SECURITY_EXECUTIVE_SUMMARY.txt** - Executive overview
- **SECURITY_REVIEW_INDEX.md** - Navigation guide

---

## Team Communication

**Weekly Status Updates:**
- Monday: Week planning, assign tasks
- Wednesday: Mid-week checkpoint
- Friday: Week review, update checklist

**Issue Escalation:**
- Blockers → Escalate to tech lead immediately
- Dependencies → Document in IMPLEMENTATION_TRACKER.md
- Questions → Reference SECURITY_REVIEW_REPORT.md first

---

**This roadmap is your step-by-step guide to making MedReg production-ready. Follow it sequentially for best results.**
