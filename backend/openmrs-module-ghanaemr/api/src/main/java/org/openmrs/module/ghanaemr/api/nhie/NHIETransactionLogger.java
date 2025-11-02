package org.openmrs.module.ghanaemr.api.nhie;

/**
 * Transaction logger for NHIE API calls.
 * Implementations should persist to DB with appropriate indexes.
 * Note: PII should be masked before calling this logger.
 */
public interface NHIETransactionLogger {
    void log(String transactionId,
             Integer patientId,
             String resourceType,
             String httpMethod,
             String endpoint,
             String maskedRequestBody,
             String maskedResponseBody,
             Integer responseStatus,
             int retryCount,
             String status);
}

