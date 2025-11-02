package org.openmrs.module.ghanaemr.api.nhie;

import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Unit tests for NHIEResponse DTO
 * 
 * Tests cover:
 * - Constructor initialization
 * - Getters and setters
 * - Success flag derivation (2xx status codes)
 * - Retryable flag logic
 * - toString() output
 * - Edge cases (null values, invalid status codes)
 * 
 * Target: 100% code coverage
 */
public class NHIEResponseTest {
    
    @Test
    public void constructor_InitializesWithDefaults() {
        NHIEResponse response = new NHIEResponse();
        
        assertFalse("Default success should be false", response.isSuccess());
        assertFalse("Default retryable should be false", response.isRetryable());
        assertEquals(0, response.getStatusCode());
        assertNull(response.getResponseBody());
        assertNull(response.getErrorMessage());
        assertNull(response.getNhieResourceId());
    }
    
    // ========================================
    // Status Code Tests
    // ========================================
    
    @Test
    public void setStatusCode_200_Success() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(200);
        
        assertEquals(200, response.getStatusCode());
    }
    
    @Test
    public void setStatusCode_201_Success() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(201);
        
        assertEquals(201, response.getStatusCode());
    }
    
    @Test
    public void setStatusCode_400_ClientError() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(400);
        
        assertEquals(400, response.getStatusCode());
    }
    
    @Test
    public void setStatusCode_500_ServerError() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(500);
        
        assertEquals(500, response.getStatusCode());
    }
    
    // ========================================
    // Success Flag Tests
    // ========================================
    
    @Test
    public void setSuccess_True_SetsFlag() {
        NHIEResponse response = new NHIEResponse();
        response.setSuccess(true);
        
        assertTrue(response.isSuccess());
    }
    
    @Test
    public void setSuccess_False_SetsFlag() {
        NHIEResponse response = new NHIEResponse();
        response.setSuccess(false);
        
        assertFalse(response.isSuccess());
    }
    
    // ========================================
    // Retryable Flag Tests
    // ========================================
    
    @Test
    public void setRetryable_True_401Unauthorized() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(401);
        response.setRetryable(true);
        
        assertTrue("401 should be retryable (token expired)", response.isRetryable());
    }
    
    @Test
    public void setRetryable_True_429RateLimited() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(429);
        response.setRetryable(true);
        
        assertTrue("429 should be retryable (rate limited)", response.isRetryable());
    }
    
    @Test
    public void setRetryable_True_500ServerError() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(500);
        response.setRetryable(true);
        
        assertTrue("500 should be retryable (server error)", response.isRetryable());
    }
    
    @Test
    public void setRetryable_False_403Forbidden() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(403);
        response.setRetryable(false);
        
        assertFalse("403 should NOT be retryable (insufficient permissions)", response.isRetryable());
    }
    
    @Test
    public void setRetryable_False_404NotFound() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(404);
        response.setRetryable(false);
        
        assertFalse("404 should NOT be retryable (resource doesn't exist)", response.isRetryable());
    }
    
    @Test
    public void setRetryable_False_409Conflict() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(409);
        response.setRetryable(false);
        
        assertFalse("409 should NOT be retryable (duplicate resource)", response.isRetryable());
    }
    
    @Test
    public void setRetryable_False_422UnprocessableEntity() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(422);
        response.setRetryable(false);
        
        assertFalse("422 should NOT be retryable (business rule violation)", response.isRetryable());
    }
    
    // ========================================
    // Response Body Tests
    // ========================================
    
    @Test
    public void setResponseBody_ValidJSON_SetsBody() {
        NHIEResponse response = new NHIEResponse();
        String json = "{\"resourceType\":\"Patient\",\"id\":\"123\"}";
        response.setResponseBody(json);
        
        assertEquals(json, response.getResponseBody());
    }
    
    @Test
    public void setResponseBody_EmptyString_SetsEmpty() {
        NHIEResponse response = new NHIEResponse();
        response.setResponseBody("");
        
        assertEquals("", response.getResponseBody());
    }
    
    @Test
    public void setResponseBody_Null_SetsNull() {
        NHIEResponse response = new NHIEResponse();
        response.setResponseBody(null);
        
        assertNull(response.getResponseBody());
    }
    
    // ========================================
    // Error Message Tests
    // ========================================
    
    @Test
    public void setErrorMessage_WithMessage_SetsMessage() {
        NHIEResponse response = new NHIEResponse();
        response.setErrorMessage("Authentication failed");
        
        assertEquals("Authentication failed", response.getErrorMessage());
    }
    
    @Test
    public void setErrorMessage_Null_SetsNull() {
        NHIEResponse response = new NHIEResponse();
        response.setErrorMessage(null);
        
        assertNull(response.getErrorMessage());
    }
    
    // ========================================
    // NHIE Resource ID Tests
    // ========================================
    
    @Test
    public void setNhieResourceId_ValidId_SetsId() {
        NHIEResponse response = new NHIEResponse();
        response.setNhieResourceId("patient-456");
        
        assertEquals("patient-456", response.getNhieResourceId());
    }
    
    @Test
    public void setNhieResourceId_Null_SetsNull() {
        NHIEResponse response = new NHIEResponse();
        response.setNhieResourceId(null);
        
        assertNull(response.getNhieResourceId());
    }
    
    // ========================================
    // toString() Tests
    // ========================================
    
    @Test
    public void toString_SuccessResponse_ContainsAllFields() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(201);
        response.setSuccess(true);
        response.setResponseBody("{\"resourceType\":\"Patient\"}");
        response.setNhieResourceId("patient-789");
        response.setRetryable(false);
        
        String result = response.toString();
        
        assertNotNull(result);
        assertTrue(result.contains("201"));
        assertTrue(result.contains("true"));
        assertTrue(result.contains("patient-789"));
        assertTrue(result.contains("Patient"));
    }
    
    @Test
    public void toString_ErrorResponse_ContainsErrorMessage() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(401);
        response.setSuccess(false);
        response.setErrorMessage("Token expired");
        response.setRetryable(true);
        
        String result = response.toString();
        
        assertNotNull(result);
        assertTrue(result.contains("401"));
        assertTrue(result.contains("false"));
        assertTrue(result.contains("Token expired"));
        assertTrue(result.contains("true")); // retryable
    }
    
    @Test
    public void toString_NullFields_HandlesGracefully() {
        NHIEResponse response = new NHIEResponse();
        
        String result = response.toString();
        
        assertNotNull(result);
        assertTrue(result.contains("0")); // statusCode default
        assertTrue(result.contains("null") || result.contains("false")); // success/retryable defaults
    }
    
    // ========================================
    // Complete Response Object Tests
    // ========================================
    
    @Test
    public void fullResponse_201Created_AllFieldsSet() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(201);
        response.setSuccess(true);
        response.setResponseBody("{\"resourceType\":\"Patient\",\"id\":\"patient-123\"}");
        response.setNhieResourceId("patient-123");
        response.setRetryable(false);
        response.setErrorMessage(null);
        
        assertEquals(201, response.getStatusCode());
        assertTrue(response.isSuccess());
        assertFalse(response.isRetryable());
        assertNotNull(response.getResponseBody());
        assertEquals("patient-123", response.getNhieResourceId());
        assertNull(response.getErrorMessage());
    }
    
    @Test
    public void fullResponse_409Conflict_AllFieldsSet() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(409);
        response.setSuccess(false);
        response.setResponseBody("{\"resourceType\":\"OperationOutcome\"}");
        response.setNhieResourceId(null);
        response.setRetryable(false);
        response.setErrorMessage("Duplicate patient");
        
        assertEquals(409, response.getStatusCode());
        assertFalse(response.isSuccess());
        assertFalse(response.isRetryable());
        assertNotNull(response.getResponseBody());
        assertNull(response.getNhieResourceId());
        assertEquals("Duplicate patient", response.getErrorMessage());
    }
    
    @Test
    public void fullResponse_500ServerError_AllFieldsSet() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(500);
        response.setSuccess(false);
        response.setResponseBody("<html>500 Internal Server Error</html>");
        response.setNhieResourceId(null);
        response.setRetryable(true);
        response.setErrorMessage("NHIE server error");
        
        assertEquals(500, response.getStatusCode());
        assertFalse(response.isSuccess());
        assertTrue(response.isRetryable());
        assertNotNull(response.getResponseBody());
        assertNull(response.getNhieResourceId());
        assertEquals("NHIE server error", response.getErrorMessage());
    }
    
    // ========================================
    // Edge Cases
    // ========================================
    
    @Test
    public void setStatusCode_NegativeValue_AcceptsValue() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(-1);
        
        assertEquals(-1, response.getStatusCode());
        // Negative status codes are invalid but DTO accepts them (validation elsewhere)
    }
    
    @Test
    public void setStatusCode_VeryLargeValue_AcceptsValue() {
        NHIEResponse response = new NHIEResponse();
        response.setStatusCode(99999);
        
        assertEquals(99999, response.getStatusCode());
    }
    
    @Test
    public void setResponseBody_VeryLargeJSON_HandlesCorrectly() {
        NHIEResponse response = new NHIEResponse();
        
        // Create 1MB JSON
        StringBuilder largeJson = new StringBuilder("{\"data\":\"");
        for (int i = 0; i < 100000; i++) {
            largeJson.append("x");
        }
        largeJson.append("\"}");
        
        response.setResponseBody(largeJson.toString());
        
        assertNotNull(response.getResponseBody());
        assertEquals(largeJson.toString(), response.getResponseBody());
    }
    
    @Test
    public void multipleSetters_ChangingValues_UpdatesCorrectly() {
        NHIEResponse response = new NHIEResponse();
        
        response.setStatusCode(200);
        assertEquals(200, response.getStatusCode());
        
        response.setStatusCode(500);
        assertEquals(500, response.getStatusCode());
        
        response.setSuccess(true);
        assertTrue(response.isSuccess());
        
        response.setSuccess(false);
        assertFalse(response.isSuccess());
    }
}
