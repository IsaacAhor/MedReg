# MedReg Security Issues - Quick Reference Checklist

**For step-by-step implementation instructions, see IMPLEMENTATION_ROADMAP.md**

This checklist provides a quick reference for tracking progress. Each item links to detailed implementation steps in the roadmap.

---

## CRITICAL ISSUES (Fix Immediately - Before Any Production Deployment)

- [ ] **SQL Injection in AuditLogger** (CRITICAL)
  - File: `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/AuditLogger.java:20-22`
  - Issue: String concatenation in SQL INSERT statement
  - Fix: Use PreparedStatement with parameterized queries
  - HIPAA Impact: Yes - Audit log integrity compromised

- [ ] **SQL Injection in NHIEDlqController** (CRITICAL)
  - File: `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/NHIEDlqController.java:26-28,65-66`
  - Issue: String concatenation with user parameters (date, ID)
  - Fix: Use PreparedStatement with parameterized queries
  - HIPAA Impact: Yes - DLQ manipulation could hide failed syncs

- [ ] **SQL Injection in ReportsController** (CRITICAL)
  - File: `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/ReportsController.java:29,33,39`
  - Issue: UUIDs and dates concatenated directly into SQL
  - Fix: Use PreparedStatement with parameterized queries
  - HIPAA Impact: Yes - Reports endpoint exposes PHI

- [ ] **SQL Injection in OPDMetricsController** (CRITICAL)
  - File: `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/OPDMetricsController.java:27,36`
  - Issue: UUIDs concatenated directly into SQL
  - Fix: Use PreparedStatement with parameterized queries
  - HIPAA Impact: Potential metrics data leakage

- [ ] **Hostname Verification Disabled in NHIE Client** (CRITICAL)
  - File: `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/NHIEHttpClient.java:109-115`
  - Issue: NoopHostnameVerifier + Trust All Certificates
  - Fix: Implement proper CA verification and hostname checking
  - HIPAA Impact: Yes - MITM attacks on patient data to NHIE

- [ ] **Unencrypted Database Connection** (CRITICAL)
  - File: `openmrs-runtime.properties:5`
  - Issue: `useSSL=false` in JDBC URL
  - Fix: Set `useSSL=true&verifyServerCertificate=true`
  - HIPAA Impact: Yes - Database credentials in plaintext

- [ ] **Hardcoded Database Credentials** (CRITICAL)
  - File: `openmrs-runtime.properties:6-7`
  - Issue: `connection.password=openmrs_password` in plaintext
  - Fix: Use environment variables and secrets management
  - HIPAA Impact: Yes - Full database compromise

- [ ] **OAuth Secret in Configuration File** (CRITICAL)
  - File: `openmrs-runtime.properties:21-22`
  - Issue: OAuth credentials in properties file
  - Fix: Use environment variables only, validate on startup
  - HIPAA Impact: Yes - NHIE API compromise

---

## HIGH SEVERITY ISSUES (Fix Within 2 Weeks)

- [ ] **Weak Authentication Implementation** (HIGH)
  - Files: Multiple controllers (GhanaPatientController, ConsultationController, etc.)
  - Issue: Basic auth, silent exception handling, no rate limiting, no audit logging
  - Fix: Implement proper authentication with audit logging and rate limiting
  - HIPAA Impact: Yes - Unauthorized access possible

- [ ] **Missing HTTPS Enforcement** (HIGH)
  - Files: All REST endpoints
  - Issue: No HTTPS enforcement or HSTS headers
  - Fix: Implement Spring Security with HTTPS requirement
  - HIPAA Impact: Yes - Data transmitted in cleartext possible

- [ ] **Insufficient PII Masking** (HIGH)
  - File: `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/GhanaPatientController.java:291-299`
  - Issue: Ghana Card shows last 2 digits in logs
  - Fix: Complete masking - return "GHA-***-***" only
  - HIPAA Impact: Yes - Partial PII in audit logs

- [ ] **PII in Error Messages** (HIGH)
  - Files: Multiple controllers
  - Issue: Exception messages returned to client (SQL errors, stack traces)
  - Fix: Log full errors internally, return generic messages
  - HIPAA Impact: Yes - Information disclosure

- [ ] **Database Credentials in Code** (HIGH)
  - File: `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/nhie/DefaultNHIETransactionLogger.java:38-42,91-95`
  - Issue: JDBC connection with credentials from properties
  - Fix: Use DataSource from application context
  - HIPAA Impact: Yes - Credentials in memory/logs

- [ ] **No Rate Limiting** (HIGH)
  - Files: All REST API endpoints
  - Issue: No protection against brute force or DoS
  - Fix: Implement rate limiting using Spring Actuator or custom filter
  - HIPAA Impact: Yes - Patient enumeration possible

- [ ] **Weak Ghana Card Validation** (HIGH)
  - File: `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/validation/GhanaCardValidator.java:6-27`
  - Issue: Accepts cards without GHA prefix, weak checksum
  - Fix: Strict format validation, integrate with Ghana Card registry
  - HIPAA Impact: Data integrity - invalid identifiers accepted

- [ ] **Missing Input Validation** (HIGH)
  - Files: ReportsController, OPDMetricsController
  - Issue: No validation of date, UUID, format parameters
  - Fix: Use @DateTimeFormat, @Pattern annotations
  - HIPAA Impact: Yes - SQL injection vector

- [ ] **PHI Not Encrypted at Rest** (HIGH)
  - Files: Database schema
  - Issue: Ghana Card and NHIS numbers stored in plaintext
  - Fix: Implement field-level encryption with JPA @Convert
  - HIPAA Impact: Yes - HIPAA violation

- [ ] **Patient Search Reveals Too Much** (HIGH)
  - File: `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/GhanaPatientController.java:69-123`
  - Issue: Returns full names and UUIDs, weak PII masking
  - Fix: Return only folder numbers, hash UUIDs
  - HIPAA Impact: Yes - Patient re-identification possible

---

## MEDIUM SEVERITY ISSUES (Fix Within 4 Weeks)

- [ ] **Silent Exception Handling** (MEDIUM)
  - Files: Multiple (GhanaPatientController, ConsultationController, etc.)
  - Issue: `catch (Exception ignored)` swallows all errors
  - Fix: Log exceptions with proper error handling
  - HIPAA Impact: Yes - Undetected failures, NHIE sync failures

- [ ] **Incomplete Audit Logging** (MEDIUM)
  - File: `backend/openmrs-module-ghanaemr/omod/src/main/java/org/openmrs/module/ghanaemr/web/AuditLogger.java:23-25`
  - Issue: Audit log failures silently ignored
  - Fix: Implement fallback logging and alerting
  - HIPAA Impact: Yes - Audit trail incomplete

- [ ] **No CSRF Protection** (MEDIUM)
  - Files: All state-changing endpoints (POST, PUT, DELETE)
  - Issue: No CSRF tokens on forms/API calls
  - Fix: Implement Spring Security CSRF filter
  - HIPAA Impact: Medium - Admin functions vulnerable

- [ ] **Missing Content Security Policy** (MEDIUM)
  - Files: Security configuration
  - Issue: No CSP headers configured
  - Fix: Add CSP headers via Spring Security
  - HIPAA Impact: Low - XSS protection

---

## HEALTHCARE-SPECIFIC ISSUES (High Priority)

- [ ] **No Patient Consent Management** (HIGH)
  - Issue: No tracking of patient consent for NHIE sharing
  - Fix: Implement consent table and validation in sync logic
  - Regulation: GDPR/HIPAA compliance

- [ ] **No Business Associate Agreements** (HIGH)
  - Issue: No documentation of NHIE data sharing agreements
  - Fix: Establish formal BAA/DUA with NHIE
  - Regulation: HIPAA Title II

- [ ] **Missing Data Use Agreements** (HIGH)
  - Issue: No formal documentation of data protection
  - Fix: Create DUA with legal review
  - Regulation: Ghana Data Protection Act

---

## REMEDIATION TIMELINE

### Phase 1 - CRITICAL (< 1 week)
1. All 8 CRITICAL issues above
2. Risk: Production deployment would violate HIPAA
3. Estimated effort: 60 hours

### Phase 2 - HIGH (< 2 weeks)
1. All 10 HIGH severity issues
2. Risk: Security breaches, unauthorized access
3. Estimated effort: 40 hours

### Phase 3 - MEDIUM (< 1 month)
1. All MEDIUM severity issues
2. Risk: Operational failures, audit gaps
3. Estimated effort: 20 hours

### Phase 4 - COMPLIANCE (ongoing)
1. Healthcare-specific requirements
2. Risk: Regulatory violations
3. Estimated effort: 30 hours

---

## TESTING CHECKLIST

Before deployment, verify:

### Security Testing
- [ ] SQL injection testing on all SQL parameters
- [ ] SSL/TLS certificate validation
- [ ] Authentication bypass attempts
- [ ] Authorization testing (role-based access)
- [ ] Input validation fuzzing
- [ ] PII exposure scanning (logs, errors, responses)
- [ ] Rate limiting effectiveness
- [ ] CSRF token validation
- [ ] Encryption key management

### HIPAA Compliance
- [ ] Audit logging comprehensive
- [ ] PHI encryption at rest and in transit
- [ ] Access control per user/facility
- [ ] Consent tracking active
- [ ] BAA with NHIE signed
- [ ] Incident response plan documented

### Functional Testing
- [ ] Patient registration with all identifier types
- [ ] NHIE sync with proper error handling
- [ ] Report generation with access control
- [ ] Audit logging accurate and complete
- [ ] Error messages do not expose PII

---

## DEPLOYMENT CHECKLIST

DO NOT DEPLOY TO PRODUCTION WITHOUT:

1. [ ] All CRITICAL issues fixed and tested
2. [ ] Security code review completed
3. [ ] Penetration testing passed
4. [ ] HIPAA compliance audit passed
5. [ ] BAA signed with NHIE
6. [ ] Incident response plan in place
7. [ ] Backup and disaster recovery tested
8. [ ] Monitoring and alerting configured
9. [ ] Staff security training completed
10. [ ] Data protection impact assessment completed

---

## CONFIGURATION HARDENING

### openmrs-runtime.properties

Required changes:
```properties
# BEFORE (INSECURE)
connection.url=jdbc:mysql://mysql:3306/openmrs?autoReconnect=true&useUnicode=true&characterEncoding=UTF-8&useSSL=false&allowPublicKeyRetrieval=true
connection.username=openmrs_user
connection.password=openmrs_password
ghana.nhie.oauth.clientSecret=EXPOSED_SECRET

# AFTER (SECURE)
connection.url=jdbc:mysql://mysql:3306/openmrs?autoReconnect=true&useUnicode=true&characterEncoding=UTF-8&useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=false&verifyServerCertificate=true
connection.username=${DB_USERNAME}
connection.password=${DB_PASSWORD}
ghana.nhie.oauth.clientSecret=${NHIE_CLIENT_SECRET}

# Add new security properties
security.https.enforced=true
security.hsts.enabled=true
security.hsts.maxAge=31536000
security.csrf.enabled=true
security.audit.enabled=true
security.encryption.enabled=true
```

### Environment Variables (Required on Deployment)

```bash
export DB_USERNAME="secure_db_user"
export DB_PASSWORD="$(openssl rand -base64 32)"
export NHIE_CLIENT_ID="your_client_id"
export NHIE_CLIENT_SECRET="$(openssl rand -base64 32)"
export NHIE_KEYSTORE_PASSWORD="$(openssl rand -base64 32)"
export ENCRYPTION_KEY="$(openssl rand -hex 32)"  # 32 bytes = 256-bit key
```

---

## References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- HIPAA Security Rule: 45 CFR Part 164
- Ghana Data Protection Act 2012
- FHIR Security: https://www.hl7.org/fhir/security.html
- Spring Security: https://spring.io/projects/spring-security

---

## Document History

- Created: 2025-11-08
- Author: Security Review Team
- Status: Ready for Review
- Next Review: After remediation phase 1

