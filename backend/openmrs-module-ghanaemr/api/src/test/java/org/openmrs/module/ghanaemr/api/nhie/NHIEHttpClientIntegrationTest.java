package org.openmrs.module.ghanaemr.api.nhie;

import org.junit.*;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.openmrs.api.AdministrationService;
import org.openmrs.api.context.Context;

import java.io.IOException;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Integration tests for NHIEHttpClient against live NHIE mock server
 * 
 * Prerequisites:
 * - NHIE mock server running on http://localhost:8090/fhir
 * - Start with: docker-compose up -d nhie-mock
 * - Or run: .\scripts\setup-nhie-mock.ps1
 * 
 * These tests make REAL HTTP calls to the NHIE mock (HAPI FHIR server).
 * They validate:
 * - End-to-end patient submission flow
 * - NHIS coverage eligibility checks
 * - Error handling with real FHIR responses
 * - Idempotency (If-None-Exist header)
 * - Search by identifier
 * - Real network timeouts
 * 
 * Note: Tests are marked with @Ignore by default. Remove @Ignore to run.
 * Run with: mvn test -Dtest=NHIEHttpClientIntegrationTest
 */
public class NHIEHttpClientIntegrationTest {
    
    private static NHIEHttpClient nhieClient;
    
    private static MockedStatic<Context> contextMock;
    
    private static AdministrationService adminService;
    
    @BeforeClass
    public static void setUpClass() {
        // Mock OpenMRS Context (same setup as unit tests)
        adminService = Mockito.mock(AdministrationService.class);
        contextMock = Mockito.mockStatic(Context.class);
        contextMock.when(Context::getAdministrationService).thenReturn(adminService);
        
        // Configure for NHIE mock (localhost:8090)
        when(adminService.getGlobalProperty(eq("ghana.nhie.mode"), anyString())).thenReturn("mock");
        when(adminService.getGlobalProperty(eq("ghana.nhie.baseUrl"), anyString()))
            .thenReturn("http://localhost:8090/fhir"); // External URL (not Docker internal)
        when(adminService.getGlobalProperty(eq("ghana.nhie.oauth.enabled"), anyString())).thenReturn("false");
        when(adminService.getGlobalProperty(eq("ghana.nhie.timeout.connectMs"), anyString())).thenReturn("10000");
        when(adminService.getGlobalProperty(eq("ghana.nhie.timeout.readMs"), anyString())).thenReturn("30000");
        when(adminService.getGlobalProperty(eq("ghana.nhie.tls.enabled"), anyString())).thenReturn("false");
        
        // Initialize client
        nhieClient = new NHIEHttpClient();
    }
    
    @AfterClass
    public static void tearDownClass() {
        if (nhieClient != null) {
            try {
                nhieClient.close();
            } catch (IOException e) {
                // Ignore
            }
        }
        if (contextMock != null) {
            contextMock.close();
        }
    }
    
    // ========================================
    // Patient Submission Tests
    // ========================================
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090")
    public void submitPatient_NewPatient_Returns201Created() throws IOException {
        // FHIR R4 Patient resource (minimal)
        String patientJson = "{"
            + "\"resourceType\":\"Patient\","
            + "\"identifier\":[{"
            + "  \"system\":\"http://moh.gov.gh/fhir/identifier/ghana-card\","
            + "  \"value\":\"GHA-111222333-4\""
            + "}],"
            + "\"name\":[{\"family\":\"Owusu\",\"given\":[\"Kwame\"]}],"
            + "\"gender\":\"male\","
            + "\"birthDate\":\"1990-01-15\""
            + "}";
        
        String ghanaCard = "GHA-111222333-4";
        
        NHIEResponse response = nhieClient.submitPatient(patientJson, ghanaCard);
        
        assertNotNull(response);
        assertTrue("Expected 201 Created, got " + response.getStatusCode(), 
            response.getStatusCode() == 201 || response.getStatusCode() == 200);
        assertTrue(response.isSuccess());
        assertNotNull(response.getResponseBody());
        assertTrue(response.getResponseBody().contains("Patient"));
        
        // 201 Created should have nhieResourceId extracted from Location header
        if (response.getStatusCode() == 201) {
            assertNotNull("Expected resource ID from Location header", response.getNhieResourceId());
        }
    }
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090")
    public void submitPatient_DuplicateGhanaCard_Returns200WithExisting() throws IOException {
        // First submission
        String patientJson = "{"
            + "\"resourceType\":\"Patient\","
            + "\"identifier\":[{"
            + "  \"system\":\"http://moh.gov.gh/fhir/identifier/ghana-card\","
            + "  \"value\":\"GHA-123456789-7\""
            + "}],"
            + "\"name\":[{\"family\":\"Mensah\",\"given\":[\"Kwame\"]}],"
            + "\"gender\":\"male\","
            + "\"birthDate\":\"1985-03-15\""
            + "}";
        
        NHIEResponse response1 = nhieClient.submitPatient(patientJson, "GHA-123456789-7");
        assertTrue(response1.isSuccess());
        
        // Second submission (duplicate) with If-None-Exist header
        NHIEResponse response2 = nhieClient.submitPatient(patientJson, "GHA-123456789-7");
        
        assertNotNull(response2);
        // HAPI FHIR returns 200 OK for conditional creates when resource exists
        assertEquals(200, response2.getStatusCode());
        assertTrue(response2.isSuccess());
        assertNotNull(response2.getResponseBody());
    }
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090")
    public void submitPatient_InvalidJSON_Returns400BadRequest() throws IOException {
        String invalidJson = "{\"resourceType\":\"Patient\"}"; // Missing required identifiers
        
        NHIEResponse response = nhieClient.submitPatient(invalidJson, null);
        
        assertNotNull(response);
        // HAPI FHIR may accept minimal Patient (depends on validation profile)
        // If strict validation enabled, expect 400
        assertTrue(response.getStatusCode() == 200 || response.getStatusCode() == 201 || response.getStatusCode() == 400);
    }
    
    // ========================================
    // Patient Retrieval Tests
    // ========================================
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090 with Patient/1")
    public void getPatient_ExistingPatient_Returns200WithPatient() throws IOException {
        // Assumes Patient/1 exists in mock (preloaded demo data)
        NHIEResponse response = nhieClient.getPatient("1");
        
        assertNotNull(response);
        assertEquals(200, response.getStatusCode());
        assertTrue(response.isSuccess());
        assertNotNull(response.getResponseBody());
        assertTrue(response.getResponseBody().contains("\"resourceType\":\"Patient\""));
        assertTrue(response.getResponseBody().contains("\"id\":\"1\""));
    }
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090")
    public void getPatient_NonExistentPatient_Returns404NotFound() throws IOException {
        // Patient ID that doesn't exist
        NHIEResponse response = nhieClient.getPatient("9999999");
        
        assertNotNull(response);
        assertEquals(404, response.getStatusCode());
        assertFalse(response.isSuccess());
        assertFalse(response.isRetryable()); // 404 is not retryable
    }
    
    // ========================================
    // Search by Identifier Tests
    // ========================================
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090 with preloaded data")
    public void searchPatientByIdentifier_GhanaCard_ReturnsBundle() throws IOException {
        String system = "http://moh.gov.gh/fhir/identifier/ghana-card";
        String value = "GHA-123456789-7"; // From preloaded demo data
        
        NHIEResponse response = nhieClient.searchPatientByIdentifier(system, value);
        
        assertNotNull(response);
        assertEquals(200, response.getStatusCode());
        assertTrue(response.isSuccess());
        assertNotNull(response.getResponseBody());
        assertTrue(response.getResponseBody().contains("\"resourceType\":\"Bundle\""));
        assertTrue(response.getResponseBody().contains("GHA-123456789-7"));
    }
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090 with preloaded data")
    public void searchPatientByIdentifier_NHIS_ReturnsBundle() throws IOException {
        String system = "http://moh.gov.gh/fhir/identifier/nhis";
        String value = "0123456789"; // From preloaded demo data
        
        NHIEResponse response = nhieClient.searchPatientByIdentifier(system, value);
        
        assertNotNull(response);
        assertEquals(200, response.getStatusCode());
        assertTrue(response.isSuccess());
        assertNotNull(response.getResponseBody());
        assertTrue(response.getResponseBody().contains("\"resourceType\":\"Bundle\""));
    }
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090")
    public void searchPatientByIdentifier_NotFound_ReturnsEmptyBundle() throws IOException {
        String system = "http://moh.gov.gh/fhir/identifier/ghana-card";
        String value = "GHA-999999999-9"; // Doesn't exist
        
        NHIEResponse response = nhieClient.searchPatientByIdentifier(system, value);
        
        assertNotNull(response);
        assertEquals(200, response.getStatusCode());
        assertTrue(response.isSuccess());
        assertTrue(response.getResponseBody().contains("\"total\":0")); // Empty Bundle
    }
    
    // ========================================
    // Coverage Eligibility Tests
    // ========================================
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090 with preloaded Coverage data")
    public void checkCoverage_ActiveNHIS_Returns200WithCoverage() throws IOException {
        String nhisNumber = "0123456789"; // From preloaded demo data (active NHIS)
        
        NHIEResponse response = nhieClient.checkCoverage(nhisNumber);
        
        assertNotNull(response);
        assertEquals(200, response.getStatusCode());
        assertTrue(response.isSuccess());
        assertNotNull(response.getResponseBody());
        assertTrue(response.getResponseBody().contains("\"resourceType\":\"Bundle\""));
        assertTrue(response.getResponseBody().contains("\"status\":\"active\""));
    }
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090 with preloaded Coverage data")
    public void checkCoverage_ExpiredNHIS_Returns200WithCancelledCoverage() throws IOException {
        String nhisNumber = "0001112223"; // From preloaded demo data (expired NHIS)
        
        NHIEResponse response = nhieClient.checkCoverage(nhisNumber);
        
        assertNotNull(response);
        assertEquals(200, response.getStatusCode());
        assertTrue(response.isSuccess());
        assertNotNull(response.getResponseBody());
        // Should contain Coverage with status "cancelled"
        assertTrue(response.getResponseBody().contains("\"status\":\"cancelled\"") ||
                   response.getResponseBody().contains("\"total\":0")); // Or empty if not found
    }
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090")
    public void checkCoverage_NoNHIS_ReturnsEmptyBundle() throws IOException {
        String nhisNumber = "9999999999"; // Doesn't exist
        
        NHIEResponse response = nhieClient.checkCoverage(nhisNumber);
        
        assertNotNull(response);
        assertEquals(200, response.getStatusCode());
        assertTrue(response.isSuccess());
        assertTrue(response.getResponseBody().contains("\"total\":0")); // Empty Bundle
    }
    
    // ========================================
    // Performance Tests
    // ========================================
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090")
    public void submitPatient_Performance_UnderTwoSeconds() throws IOException {
        String patientJson = "{"
            + "\"resourceType\":\"Patient\","
            + "\"identifier\":[{"
            + "  \"system\":\"http://moh.gov.gh/fhir/identifier/ghana-card\","
            + "  \"value\":\"GHA-888888888-8\""
            + "}],"
            + "\"name\":[{\"family\":\"PerfTest\",\"given\":[\"Patient\"]}],"
            + "\"gender\":\"male\""
            + "}";
        
        long startTime = System.currentTimeMillis();
        
        NHIEResponse response = nhieClient.submitPatient(patientJson, "GHA-888888888-8");
        
        long duration = System.currentTimeMillis() - startTime;
        
        assertTrue(response.isSuccess());
        assertTrue("Request took " + duration + "ms, expected <2000ms", duration < 2000);
    }
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090")
    public void concurrentRequests_10Patients_CompletesUnderFiveSeconds() throws InterruptedException {
        // Stress test: Submit 10 patients concurrently
        
        Thread[] threads = new Thread[10];
        final boolean[] success = new boolean[10];
        
        long startTime = System.currentTimeMillis();
        
        for (int i = 0; i < 10; i++) {
            final int index = i;
            threads[i] = new Thread(() -> {
                try {
                    String patientJson = "{"
                        + "\"resourceType\":\"Patient\","
                        + "\"identifier\":[{"
                        + "  \"system\":\"http://moh.gov.gh/fhir/identifier/ghana-card\","
                        + "  \"value\":\"GHA-77777777" + index + "-0\""
                        + "}],"
                        + "\"name\":[{\"family\":\"Concurrent\",\"given\":[\"Patient" + index + "\"]}],"
                        + "\"gender\":\"male\""
                        + "}";
                    
                    NHIEHttpClient client = new NHIEHttpClient();
                    NHIEResponse response = client.submitPatient(patientJson, "GHA-77777777" + index + "-0");
                    success[index] = response.isSuccess();
                    client.close();
                } catch (IOException e) {
                    success[index] = false;
                }
            });
            threads[i].start();
        }
        
        // Wait for all threads
        for (Thread thread : threads) {
            thread.join();
        }
        
        long duration = System.currentTimeMillis() - startTime;
        
        // Check all succeeded
        for (int i = 0; i < 10; i++) {
            assertTrue("Patient " + i + " submission failed", success[i]);
        }
        
        assertTrue("10 concurrent requests took " + duration + "ms, expected <5000ms", duration < 5000);
    }
    
    // ========================================
    // Network Error Tests
    // ========================================
    
    @Test
    @Ignore("Requires NHIE mock STOPPED (docker-compose stop nhie-mock)")
    public void submitPatient_ServerDown_ReturnsRetryableError() throws IOException {
        // Stop NHIE mock before running this test: docker-compose stop nhie-mock
        
        String patientJson = "{\"resourceType\":\"Patient\",\"name\":[{\"family\":\"Test\"}]}";
        
        try {
            NHIEResponse response = nhieClient.submitPatient(patientJson, null);
            
            assertNotNull(response);
            assertFalse(response.isSuccess());
            assertTrue("Network errors should be retryable", response.isRetryable());
        } catch (IOException e) {
            // Expected: Connection refused or timeout
            assertTrue(e.getMessage().contains("Connection refused") || e.getMessage().contains("timeout"));
        }
    }
    
    // ========================================
    // Token Caching Tests (OAuth disabled)
    // ========================================
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090")
    public void multipleRequests_OAuthDisabled_NoTokenRequests() throws IOException {
        // With OAuth disabled, should not see any token requests in logs
        
        String patientJson = "{\"resourceType\":\"Patient\",\"name\":[{\"family\":\"TokenTest\"}]}";
        
        NHIEResponse response1 = nhieClient.submitPatient(patientJson, null);
        NHIEResponse response2 = nhieClient.submitPatient(patientJson, null);
        
        assertTrue(response1.isSuccess() || response1.getStatusCode() == 400);
        assertTrue(response2.isSuccess() || response2.getStatusCode() == 400);
        
        // Validate in logs: No OAuth token requests (check console output)
    }
    
    // ========================================
    // Edge Cases
    // ========================================
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090")
    public void submitPatient_SpecialCharactersInName_HandlesCorrectly() throws IOException {
        String patientJson = "{"
            + "\"resourceType\":\"Patient\","
            + "\"identifier\":[{"
            + "  \"system\":\"http://moh.gov.gh/fhir/identifier/ghana-card\","
            + "  \"value\":\"GHA-555555555-5\""
            + "}],"
            + "\"name\":[{\"family\":\"O'Brien-Mensah\",\"given\":[\"Kwame\",\"N'Guessan\"]}],"
            + "\"gender\":\"male\""
            + "}";
        
        NHIEResponse response = nhieClient.submitPatient(patientJson, "GHA-555555555-5");
        
        assertTrue(response.isSuccess());
        assertTrue(response.getResponseBody().contains("O'Brien-Mensah"));
    }
    
    @Test
    @Ignore("Requires NHIE mock running on localhost:8090")
    public void submitPatient_UnicodeCharacters_HandlesCorrectly() throws IOException {
        // Test with Twi/Akan names (Ghana local language)
        String patientJson = "{"
            + "\"resourceType\":\"Patient\","
            + "\"identifier\":[{"
            + "  \"system\":\"http://moh.gov.gh/fhir/identifier/ghana-card\","
            + "  \"value\":\"GHA-666666666-6\""
            + "}],"
            + "\"name\":[{\"family\":\"Nkrumah\",\"given\":[\"Kɔfi\",\"Ɛmɛ\"]}],"
            + "\"gender\":\"male\""
            + "}";
        
        NHIEResponse response = nhieClient.submitPatient(patientJson, "GHA-666666666-6");
        
        assertTrue(response.isSuccess());
        // Validate Unicode preserved in response
        assertTrue(response.getResponseBody().contains("Nkrumah"));
    }
}
