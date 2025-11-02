package org.openmrs.module.ghanaemr.api.nhie;

/**
 * Response wrapper for NHIE API calls
 * 
 * Contains HTTP status, response body, error details, and retry logic flags
 * 
 * @author Ghana EMR Team
 * @version 1.0
 * @since 2025-11-02
 */
public class NHIEResponse {
    
    private int statusCode;
    private String responseBody;
    private boolean success;
    private String errorMessage;
    private boolean retryable;
    private String nhieResourceId; // For 201 Created responses
    
    public NHIEResponse() {
        this.success = false;
        this.retryable = false;
    }
    
    // Getters and setters
    
    public int getStatusCode() {
        return statusCode;
    }
    
    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }
    
    public String getResponseBody() {
        return responseBody;
    }
    
    public void setResponseBody(String responseBody) {
        this.responseBody = responseBody;
    }
    
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    public boolean isRetryable() {
        return retryable;
    }
    
    public void setRetryable(boolean retryable) {
        this.retryable = retryable;
    }
    
    public String getNhieResourceId() {
        return nhieResourceId;
    }
    
    public void setNhieResourceId(String nhieResourceId) {
        this.nhieResourceId = nhieResourceId;
    }
    
    @Override
    public String toString() {
        return "NHIEResponse{" +
                "statusCode=" + statusCode +
                ", success=" + success +
                ", errorMessage='" + errorMessage + '\'' +
                ", retryable=" + retryable +
                ", nhieResourceId='" + nhieResourceId + '\'' +
                '}';
    }
}
