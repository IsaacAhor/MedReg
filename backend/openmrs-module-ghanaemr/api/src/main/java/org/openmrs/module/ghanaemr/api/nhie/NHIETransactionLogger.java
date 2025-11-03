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

    /**
     * Update an existing transaction log entry with response details.
     *
     * @param transactionId The transaction ID to update
     * @param responseStatus HTTP response status code
     * @param maskedResponseBody Masked response body
     * @param retryCount Current retry count
     * @param status Transaction status (SUCCESS, FAILED, PENDING)
     * @param nhieResourceId NHIE resource ID (if created)
     * @param errorMessage Error message (if failed)
     */
    void update(String transactionId,
                int responseStatus,
                String maskedResponseBody,
                int retryCount,
                String status,
                String nhieResourceId,
                String errorMessage);
}

