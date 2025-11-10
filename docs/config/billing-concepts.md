# OpenMRS Billing Concepts - Configuration Reference

**Status:** ⚠️ PENDING - Awaits OpenMRS fix (Spring bean error blocking REST API)  
**Created:** 2025-11-10  
**For:** Task 13 (OPM-008 & OPM-009)  
**Issue:** OpenMRS has persistent Spring proxy error preventing concept creation

## Overview

This document defines the OpenMRS concepts and person attributes required for Phase 2 billing and NHIS eligibility tracking. Once OpenMRS is running properly, these concepts will be created via REST API or the provided SQL scripts.

---

## Billing Type Concepts (OPM-008)

| Concept Name | Type | Datatype | Class | Purpose | UUID | Env Variable |
|--------------|------|----------|-------|---------|------|--------------|
| **Billing Type** | Question | Coded | Misc | Main question for payment type | `[TO BE GENERATED]` | `OPENMRS_CONCEPT_BILLING_TYPE_UUID` |
| **NHIS Payment** | Answer | N/A | Misc | Answer for NHIS patients | `[TO BE GENERATED]` | `OPENMRS_CONCEPT_BILLING_TYPE_NHIS_UUID` |
| **Cash Payment** | Answer | N/A | Misc | Answer for cash patients | `[TO BE GENERATED]` | `OPENMRS_CONCEPT_BILLING_TYPE_CASH_UUID` |
| **Payment Amount** | Observation | Numeric | Misc | Amount paid (GH₵) | `[TO BE GENERATED]` | `OPENMRS_CONCEPT_PAYMENT_AMOUNT_UUID` |
| **Receipt Number** | Observation | Text | Misc | Receipt/transaction ID | `[TO BE GENERATED]` | `OPENMRS_CONCEPT_RECEIPT_NUMBER_UUID` |

### Global Properties

```properties
ghanaemr.payment.billingTypeConceptUuid = <Billing Type UUID>
ghanaemr.payment.nhisPaymentConceptUuid = <NHIS Payment UUID>
ghanaemr.payment.cashPaymentConceptUuid = <Cash Payment UUID>
ghanaemr.payment.amountConceptUuid = <Payment Amount UUID>
ghanaemr.payment.receiptNumberConceptUuid = <Receipt Number UUID>
```

---

## NHIS Eligibility Attributes (OPM-009)

| Attribute Name | Format | Searchable | Purpose | UUID | Env Variable |
|----------------|--------|-----------|---------|------|--------------|
| **NHIS Status** | String | Yes | Status: ACTIVE/EXPIRED/NOT_FOUND | `[TO BE GENERATED]` | `OPENMRS_NHIS_STATUS_ATTRIBUTE_UUID` |
| **NHIS Expiry Date** | Date | Yes | Coverage expiration date | `[TO BE GENERATED]` | `OPENMRS_NHIS_EXPIRY_ATTRIBUTE_UUID` |
| **NHIS Last Checked** | DateTime | No | Cache timestamp | `[TO BE GENERATED]` | `OPENMRS_NHIS_LAST_CHECKED_ATTRIBUTE_UUID` |

### Global Properties

```properties
ghanaemr.nhis.statusAttributeUuid = <NHIS Status UUID>
ghanaemr.nhis.expiryDateAttributeUuid = <NHIS Expiry Date UUID>
ghanaemr.nhis.lastCheckedAttributeUuid = <NHIS Last Checked UUID>
```

---

## Usage Examples

### Frontend: Create Payment Obs

```typescript
// In dispense API route (frontend/src/app/api/opd/dispense/route.ts)
const obs = [
  {
    concept: process.env.OPENMRS_CONCEPT_BILLING_TYPE_UUID,
    value: paymentType === 'NHIS' 
      ? process.env.OPENMRS_CONCEPT_BILLING_TYPE_NHIS_UUID
      : process.env.OPENMRS_CONCEPT_BILLING_TYPE_CASH_UUID,
  },
  {
    concept: process.env.OPENMRS_CONCEPT_PAYMENT_AMOUNT_UUID,
    value: parseFloat(amountPaid),
  },
  {
    concept: process.env.OPENMRS_CONCEPT_RECEIPT_NUMBER_UUID,
    value: receiptNumber,
  },
];
```

### Frontend: Update NHIS Status

```typescript
// After eligibility check (frontend/src/app/api/coverage/route.ts)
await updatePersonAttribute(patientUuid, {
  attributeType: process.env.OPENMRS_NHIS_STATUS_ATTRIBUTE_UUID,
  value: coverageResponse.status, // "ACTIVE", "EXPIRED", "NOT_FOUND"
});

await updatePersonAttribute(patientUuid, {
  attributeType: process.env.OPENMRS_NHIS_EXPIRY_ATTRIBUTE_UUID,
  value: coverageResponse.expiryDate, // "2025-12-31"
});

await updatePersonAttribute(patientUuid, {
  attributeType: process.env.OPENMRS_NHIS_LAST_CHECKED_ATTRIBUTE_UUID,
  value: new Date().toISOString(),
});
```

### Backend: NHIS vs Cash Report Query

```sql
-- Count NHIS vs Cash payments for date range
SELECT 
  cn.name AS payment_type,
  COUNT(*) AS count,
  SUM(CAST(o_amount.value_numeric AS DECIMAL(10,2))) AS total_amount
FROM obs o_type
JOIN concept_name cn ON o_type.value_coded = cn.concept_id AND cn.locale = 'en'
LEFT JOIN obs o_amount ON o_amount.encounter_id = o_type.encounter_id 
  AND o_amount.concept_id = (SELECT concept_id FROM concept_name WHERE name = 'Payment Amount' LIMIT 1)
WHERE o_type.concept_id = (SELECT concept_id FROM concept_name WHERE name = 'Billing Type' LIMIT 1)
  AND o_type.obs_datetime BETWEEN '2025-01-01' AND '2025-12-31'
  AND o_type.voided = 0
GROUP BY cn.name;
```

---

## Creation Process

### Option 1: REST API (Preferred - when OpenMRS is fixed)

```bash
# 1. Create Billing Type concept
curl -u admin:Admin123 -H "Content-Type: application/json" \
  -d '{"names":[{"name":"Billing Type","locale":"en"}],"datatype":"8d4a4c94-c2cc-11de-8d13-0010c6dffd0f","conceptClass":"Misc"}' \
  http://localhost:8080/openmrs/ws/rest/v1/concept

# 2. Create answer concepts (NHIS, Cash)
curl -u admin:Admin123 -H "Content-Type: application/json" \
  -d '{"names":[{"name":"NHIS Payment","locale":"en"}],"datatype":"N/A","conceptClass":"Misc"}' \
  http://localhost:8080/openmrs/ws/rest/v1/concept

# 3. Set allowable answers on Billing Type
# (Use concept UUID from step 1 and answer UUIDs from step 2)

# 4. Create Payment Amount concept (numeric)
curl -u admin:Admin123 -H "Content-Type: application/json" \
  -d '{"names":[{"name":"Payment Amount","locale":"en"}],"datatype":"8d4a4488-c2cc-11de-8d13-0010c6dffd0f","conceptClass":"Misc"}' \
  http://localhost:8080/openmrs/ws/rest/v1/concept

# 5. Create Receipt Number concept (text)
curl -u admin:Admin123 -H "Content-Type: application/json" \
  -d '{"names":[{"name":"Receipt Number","locale":"en"}],"datatype":"8d4a4ab4-c2cc-11de-8d13-0010c6dffd0f","conceptClass":"Misc"}' \
  http://localhost:8080/openmrs/ws/rest/v1/concept

# 6. Create NHIS Status attribute type
curl -u admin:Admin123 -H "Content-Type: application/json" \
  -d '{"name":"NHIS Status","description":"ACTIVE/EXPIRED/NOT_FOUND","format":"java.lang.String","searchable":true}' \
  http://localhost:8080/openmrs/ws/rest/v1/personattributetype

# 7. Create NHIS Expiry Date attribute type
curl -u admin:Admin123 -H "Content-Type: application/json" \
  -d '{"name":"NHIS Expiry Date","description":"Coverage expiration date","format":"org.openmrs.customdatatype.datatype.DateDatatype","searchable":true}' \
  http://localhost:8080/openmrs/ws/rest/v1/personattributetype

# 8. Create NHIS Last Checked attribute type
curl -u admin:Admin123 -H "Content-Type: application/json" \
  -d '{"name":"NHIS Last Checked","description":"Last eligibility check timestamp","format":"org.openmrs.customdatatype.datatype.DateDatatype","searchable":false}' \
  http://localhost:8080/openmrs/ws/rest/v1/personattributetype
```

### Option 2: SQL Scripts (Workaround)

See `scripts/create-billing-concepts.sql` for direct database creation.

---

## Verification Commands

```bash
# 1. List concepts
curl -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/concept?q=Billing%20Type"
curl -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/concept?q=Payment%20Amount"

# 2. List person attribute types
curl -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/personattributetype?q=NHIS"

# 3. Verify global properties
curl -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/systemsetting?q=ghanaemr.payment"
curl -u admin:Admin123 "http://localhost:8080/openmrs/ws/rest/v1/systemsetting?q=ghanaemr.nhis"
```

---

## Frontend Environment Variables

Add to `frontend/.env.example` after concepts are created:

```bash
# Billing Concepts (from OPM-008)
OPENMRS_CONCEPT_BILLING_TYPE_UUID=
OPENMRS_CONCEPT_BILLING_TYPE_NHIS_UUID=
OPENMRS_CONCEPT_BILLING_TYPE_CASH_UUID=
OPENMRS_CONCEPT_PAYMENT_AMOUNT_UUID=
OPENMRS_CONCEPT_RECEIPT_NUMBER_UUID=

# NHIS Eligibility Attributes (from OPM-009)
OPENMRS_NHIS_STATUS_ATTRIBUTE_UUID=
OPENMRS_NHIS_EXPIRY_ATTRIBUTE_UUID=
OPENMRS_NHIS_LAST_CHECKED_ATTRIBUTE_UUID=
```

---

## Next Steps

1. ⚠️ **Fix OpenMRS Spring bean error** - See `FIX_GUIDE.md` and `OPENMRS_SPRING_ERROR.md`
2. ✅ Run REST API commands or SQL scripts to create concepts
3. ✅ Update this document with generated UUIDs (replace `[TO BE GENERATED]`)
4. ✅ Update `frontend/.env.example` with new variables
5. ✅ Update `frontend/.env.local` with actual UUIDs
6. ✅ Wire concepts into dispense API (`frontend/src/app/api/opd/dispense/route.ts`)
7. ✅ Wire attributes into coverage API (`frontend/src/app/api/coverage/route.ts`)
8. ✅ Test end-to-end: dispense with NHIS/Cash + eligibility check
9. ✅ Proceed to Task 14 (Frontend & API Wiring)

---

## Related Documentation

- Task 13: `PROMPT_QUEUE.md`
- OPM-008/009: `OPENMRS_PROMPT_GUIDE.md`
- Phase 2 Plan: `docs/implementation/phase2-closure-plan.md`
- SQL Scripts: `scripts/create-billing-concepts.sql`
- OpenMRS Fix: `FIX_GUIDE.md`, `OPENMRS_SPRING_ERROR.md`
