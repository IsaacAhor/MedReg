package org.openmrs.module.ghanaemr.exception;

/**
 * Exception thrown when NHIE (National Health Information Exchange) integration fails.
 * 
 * Scenarios:
 * - Network errors (connection timeout, NHIE server down)
 * - Authentication errors (OAuth token invalid)
 * - Validation errors (FHIR resource invalid)
 * - Business rule violations (patient already registered with different details)
 * - Rate limiting (429 Too Many Requests)
 * - Server errors (5xx responses from NHIE)
 * 
 * This exception is thrown by NHIEIntegrationService when sync fails.
 * Caller should log error and decide whether to retry (check retryable flag in NHIEResponse).
 */
public class NHIEIntegrationException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    private Integer httpStatusCode;
    private boolean retryable;
    
    public NHIEIntegrationException(String message) {
        super(message);
    }
    
    public NHIEIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public NHIEIntegrationException(String message, Integer httpStatusCode, boolean retryable) {
        super(message);
        this.httpStatusCode = httpStatusCode;
        this.retryable = retryable;
    }
    
    public NHIEIntegrationException(String message, Throwable cause, Integer httpStatusCode, boolean retryable) {
        super(message, cause);
        this.httpStatusCode = httpStatusCode;
        this.retryable = retryable;
    }
    
    public Integer getHttpStatusCode() {
        return httpStatusCode;
    }
    
    public boolean isRetryable() {
        return retryable;
    }
}
