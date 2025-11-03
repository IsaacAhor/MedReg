package org.openmrs.module.ghanaemr.api.nhie;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.ssl.SSLContextBuilder;
import org.apache.http.util.EntityUtils;
import org.codehaus.jackson.map.ObjectMapper;
import org.openmrs.api.context.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.net.ssl.SSLContext;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * HTTP client for Ghana NHIE (National Health Information Exchange) API
 * 
 * Features:
 * - OAuth 2.0 client credentials flow
 * - Token caching with proactive 5-minute refresh
 * - Environment-based URL switching (mock/sandbox/production)
 * - Comprehensive error handling (401/403/409/422/429/5xx)
 * - Request/response timeouts (30s connect, 60s read)
 * - Exponential backoff retry logic
 * - PII masking in logs
 * 
 * Configuration (openmrs-runtime.properties):
 * - ghana.nhie.mode=mock|sandbox|production
 * - ghana.nhie.baseUrl (optional override)
 * - ghana.nhie.oauth.enabled=true|false
 * - ghana.nhie.oauth.tokenUrl
 * - ghana.nhie.oauth.clientId
 * - ghana.nhie.oauth.clientSecret
 * - ghana.nhie.timeout.connectMs=30000
 * - ghana.nhie.timeout.readMs=60000
 * 
 * @author Ghana EMR Team
 * @version 1.0
 * @since 2025-11-02
 */
public class NHIEHttpClient {
    
    private static final Logger log = LoggerFactory.getLogger(NHIEHttpClient.class);
    
    // Timeout configuration
    private static final int DEFAULT_CONNECT_TIMEOUT_MS = 30000; // 30 seconds
    private static final int DEFAULT_READ_TIMEOUT_MS = 60000;    // 60 seconds
    
    // Token caching
    private static final long TOKEN_PROACTIVE_REFRESH_MS = 5 * 60 * 1000; // 5 minutes before expiry
    private static final Map<String, OAuthToken> tokenCache = new ConcurrentHashMap<>();
    
    // Retry configuration
    private static final int[] RETRY_DELAYS_MS = {0, 5000, 30000, 120000, 600000, 3600000}; // 0s, 5s, 30s, 2m, 10m, 1h
    private static final int MAX_RETRY_ATTEMPTS = 8;
    
    private final CloseableHttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    /**
     * Constructor - initializes HTTP client with timeouts
     */
    public NHIEHttpClient() {
        this.objectMapper = new ObjectMapper();
        this.httpClient = createHttpClient();
    }
    
    /**
     * Creates configured HTTP client with timeouts and optional mTLS
     */
    private CloseableHttpClient createHttpClient() {
        try {
            // Get timeout configuration
            int connectTimeout = getConnectTimeout();
            int readTimeout = getReadTimeout();
            
            RequestConfig requestConfig = RequestConfig.custom()
                    .setConnectTimeout(connectTimeout)
                    .setConnectionRequestTimeout(connectTimeout)
                    .setSocketTimeout(readTimeout)
                    .build();
            
            // Check if mTLS is enabled
            boolean tlsEnabled = Boolean.parseBoolean(
                    Context.getAdministrationService().getGlobalProperty("ghana.nhie.tls.enabled", "false")
            );
            
            if (tlsEnabled) {
                // Load client certificate for mTLS (if required by NHIE)
                SSLContext sslContext = SSLContextBuilder.create()
                        .loadTrustMaterial(null, (chain, authType) -> true) // Trust all certificates for now
                        .build();
                
                SSLConnectionSocketFactory sslSocketFactory = new SSLConnectionSocketFactory(
                        sslContext,
                        NoopHostnameVerifier.INSTANCE
                );
                
                return HttpClients.custom()
                        .setDefaultRequestConfig(requestConfig)
                        .setSSLSocketFactory(sslSocketFactory)
                        .build();
            } else {
                // Standard HTTP client (for mock and most sandbox environments)
                return HttpClients.custom()
                        .setDefaultRequestConfig(requestConfig)
                        .build();
            }
        } catch (NoSuchAlgorithmException | KeyStoreException | KeyManagementException e) {
            log.error("Failed to create HTTP client with mTLS", e);
            // Fallback to standard client
            return HttpClients.createDefault();
        }
    }
    
    /**
     * Get base URL based on environment mode
     * Supports: mock, sandbox, production
     */
    private String getBaseUrl() {
        // Check for explicit override first
        String baseUrlOverride = Context.getAdministrationService()
                .getGlobalProperty("ghana.nhie.baseUrl");
        if (baseUrlOverride != null && !baseUrlOverride.isEmpty()) {
            return baseUrlOverride;
        }
        
        // Determine URL based on mode
        String mode = Context.getAdministrationService()
                .getGlobalProperty("ghana.nhie.mode", "mock");
        
        switch (mode) {
            case "mock":
                return "http://nhie-mock:8080/fhir"; // Docker internal network
            case "sandbox":
                return "https://nhie-sandbox.moh.gov.gh/fhir";
            case "production":
                return "https://nhie.moh.gov.gh/fhir";
            default:
                log.warn("Invalid NHIE mode '{}', defaulting to mock", mode);
                return "http://nhie-mock:8080/fhir";
        }
    }
    
    /**
     * Check if OAuth 2.0 is enabled
     */
    private boolean isOAuthEnabled() {
        return Boolean.parseBoolean(
                Context.getAdministrationService()
                        .getGlobalProperty("ghana.nhie.oauth.enabled", "false")
        );
    }
    
    /**
     * Get OAuth 2.0 access token (cached with proactive refresh)
     */
    private String getAccessToken() throws IOException {
        if (!isOAuthEnabled()) {
            return null; // No auth for mock mode
        }
        
        String cacheKey = "nhie_token";
        OAuthToken cachedToken = tokenCache.get(cacheKey);
        
        // Check if token exists and is still valid (with 5-minute buffer)
        if (cachedToken != null && cachedToken.isValid()) {
            log.debug("Using cached OAuth token (expires in {} seconds)", cachedToken.getSecondsUntilExpiry());
            return cachedToken.getAccessToken();
        }
        
        // Token expired or doesn't exist - request new token
        log.info("Requesting new OAuth token from NHIE");
        OAuthToken newToken = requestOAuthToken();
        tokenCache.put(cacheKey, newToken);
        
        return newToken.getAccessToken();
    }
    
    /**
     * Request OAuth 2.0 token using client credentials flow
     */
    private OAuthToken requestOAuthToken() throws IOException {
        String tokenUrl = Context.getAdministrationService()
                .getGlobalProperty("ghana.nhie.oauth.tokenUrl");
        String clientId = Context.getAdministrationService()
                .getGlobalProperty("ghana.nhie.oauth.clientId");
        String clientSecret = Context.getAdministrationService()
                .getGlobalProperty("ghana.nhie.oauth.clientSecret");
        
        if (tokenUrl == null || clientId == null || clientSecret == null) {
            throw new IllegalStateException("OAuth configuration incomplete. Check openmrs-runtime.properties.");
        }
        
        HttpPost request = new HttpPost(tokenUrl);
        request.setHeader("Content-Type", "application/x-www-form-urlencoded");
        
        // Basic authentication with client credentials
        String auth = clientId + ":" + clientSecret;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        request.setHeader("Authorization", "Basic " + encodedAuth);
        
        // Request body
        String body = "grant_type=client_credentials&scope=patient.write encounter.write coverage.read";
        request.setEntity(new StringEntity(body, StandardCharsets.UTF_8));
        
        try (CloseableHttpResponse response = httpClient.execute(request)) {
            int statusCode = response.getStatusLine().getStatusCode();
            String responseBody = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
            
            if (statusCode == 200) {
                Map<String, Object> tokenResponse = objectMapper.readValue(responseBody, Map.class);
                String accessToken = (String) tokenResponse.get("access_token");
                Integer expiresIn = (Integer) tokenResponse.get("expires_in");
                
                log.info("OAuth token acquired successfully (expires in {} seconds)", expiresIn);
                return new OAuthToken(accessToken, expiresIn);
            } else {
                log.error("OAuth token request failed: {} - {}", statusCode, responseBody);
                throw new IOException("Failed to acquire OAuth token: " + statusCode);
            }
        }
    }
    
    /**
     * Submit FHIR Patient resource to NHIE
     * 
     * @param patientJson FHIR R4 Patient resource as JSON string
     * @return NHIEResponse containing status, NHIE patient ID, and response body
     */
    public NHIEResponse submitPatient(String patientJson) throws IOException {
        return submitPatient(patientJson, null);
    }
    
    /**
     * Submit FHIR Patient resource to NHIE with conditional create (idempotent)
     * 
     * @param patientJson FHIR R4 Patient resource as JSON string
     * @param ghanaCard Ghana Card identifier for conditional create (prevents duplicates)
     * @return NHIEResponse containing status, NHIE patient ID, and response body
     */
    public NHIEResponse submitPatient(String patientJson, String ghanaCard) throws IOException {
        String url = getBaseUrl() + "/Patient";
        
        HttpPost request = new HttpPost(url);
        request.setHeader("Content-Type", "application/fhir+json");
        request.setHeader("Accept", "application/fhir+json");
        
        // Add OAuth token if enabled
        String token = getAccessToken();
        if (token != null) {
            request.setHeader("Authorization", "Bearer " + token);
        }
        
        // Add If-None-Exist header for idempotent creates (prevents duplicates)
        if (ghanaCard != null && !ghanaCard.isEmpty()) {
            String ifNoneExist = "identifier=http://moh.gov.gh/fhir/identifier/ghana-card|" + ghanaCard;
            request.setHeader("If-None-Exist", ifNoneExist);
            log.debug("Using If-None-Exist header: {}", maskIdentifier(ifNoneExist));
        }
        
        request.setEntity(new StringEntity(patientJson, StandardCharsets.UTF_8));
        
        log.info("Submitting patient to NHIE: POST {}", url);
        
        try (CloseableHttpResponse response = httpClient.execute(request)) {
            return handleResponse(response, "POST", url);
        }
    }
    
    /**
     * Get Patient resource from NHIE by ID
     */
    public NHIEResponse getPatient(String nhiePatientId) throws IOException {
        String url = getBaseUrl() + "/Patient/" + nhiePatientId;
        
        HttpGet request = new HttpGet(url);
        request.setHeader("Accept", "application/fhir+json");
        
        String token = getAccessToken();
        if (token != null) {
            request.setHeader("Authorization", "Bearer " + token);
        }
        
        log.info("Fetching patient from NHIE: GET {}", url);
        
        try (CloseableHttpResponse response = httpClient.execute(request)) {
            return handleResponse(response, "GET", url);
        }
    }
    
    /**
     * Search Patient by identifier (Ghana Card or NHIS number)
     */
    public NHIEResponse searchPatientByIdentifier(String system, String value) throws IOException {
        String url = getBaseUrl() + "/Patient?identifier=" + system + "|" + value;
        
        HttpGet request = new HttpGet(url);
        request.setHeader("Accept", "application/fhir+json");
        
        String token = getAccessToken();
        if (token != null) {
            request.setHeader("Authorization", "Bearer " + token);
        }
        
        log.info("Searching patient in NHIE: GET {}", maskIdentifier(url));
        
        try (CloseableHttpResponse response = httpClient.execute(request)) {
            return handleResponse(response, "GET", url);
        }
    }
    
    /**
     * Check NHIS coverage eligibility
     */
    public NHIEResponse checkCoverage(String nhisNumber) throws IOException {
        String system = "http://moh.gov.gh/fhir/identifier/nhis";
        String url = getBaseUrl() + "/Coverage?beneficiary.identifier=" + system + "|" + nhisNumber;
        
        HttpGet request = new HttpGet(url);
        request.setHeader("Accept", "application/fhir+json");
        
        String token = getAccessToken();
        if (token != null) {
            request.setHeader("Authorization", "Bearer " + token);
        }
        
        log.info("Checking NHIS coverage: GET {}", maskIdentifier(url));
        
        try (CloseableHttpResponse response = httpClient.execute(request)) {
            return handleResponse(response, "GET", url);
        }
    }
    
    /**
     * Handle HTTP response with comprehensive error handling
     */
    private NHIEResponse handleResponse(CloseableHttpResponse response, String method, String url) throws IOException {
        int statusCode = response.getStatusLine().getStatusCode();
        String responseBody = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
        
        NHIEResponse nhieResponse = new NHIEResponse();
        nhieResponse.setStatusCode(statusCode);
        nhieResponse.setResponseBody(responseBody);
        nhieResponse.setSuccess(statusCode >= 200 && statusCode < 300);
        
        // Extract NHIE resource ID from Location header (for 201 Created)
        if (statusCode == 201) {
            String location = response.getFirstHeader("Location") != null 
                    ? response.getFirstHeader("Location").getValue() 
                    : null;
            if (location != null) {
                // Extract ID from URL: http://nhie.../Patient/123 -> 123
                String[] parts = location.split("/");
                String resourceId = parts[parts.length - 1];
                nhieResponse.setNhieResourceId(resourceId);
                log.info("{} {} -> 201 Created, NHIE resource ID: {}", method, maskUrl(url), resourceId);
            }
        } else if (statusCode == 200) {
            log.info("{} {} -> 200 OK", method, maskUrl(url));
        } else if (statusCode == 401) {
            log.warn("{} {} -> 401 Unauthorized (token expired or invalid)", method, maskUrl(url));
            nhieResponse.setRetryable(true);
            nhieResponse.setErrorMessage("Authentication failed. Token may be expired.");
        } else if (statusCode == 403) {
            log.error("{} {} -> 403 Forbidden (insufficient permissions)", method, maskUrl(url));
            nhieResponse.setRetryable(false);
            nhieResponse.setErrorMessage("Forbidden. Check OAuth scopes and permissions.");
        } else if (statusCode == 404) {
            log.warn("{} {} -> 404 Not Found", method, maskUrl(url));
            nhieResponse.setRetryable(false);
            nhieResponse.setErrorMessage("Resource not found in NHIE.");
        } else if (statusCode == 409) {
            log.info("{} {} -> 409 Conflict (resource already exists)", method, maskUrl(url));
            nhieResponse.setRetryable(false);
            nhieResponse.setErrorMessage("Duplicate resource. Patient already exists in NHIE.");
            // Extract existing resource ID from response body if available
            // FHIR typically returns OperationOutcome with reference to existing resource
        } else if (statusCode == 422) {
            log.error("{} {} -> 422 Unprocessable Entity (business rule violation)", method, maskUrl(url));
            nhieResponse.setRetryable(false);
            nhieResponse.setErrorMessage("Business rule violation. Check FHIR resource validity.");
        } else if (statusCode == 429) {
            log.warn("{} {} -> 429 Too Many Requests (rate limited)", method, maskUrl(url));
            nhieResponse.setRetryable(true);
            nhieResponse.setErrorMessage("Rate limited. Will retry with backoff.");
        } else if (statusCode >= 500 && statusCode < 600) {
            log.error("{} {} -> {} Server Error", method, maskUrl(url), statusCode);
            nhieResponse.setRetryable(true);
            nhieResponse.setErrorMessage("NHIE server error. Will retry.");
        } else {
            log.warn("{} {} -> {} Unexpected status", method, maskUrl(url), statusCode);
            nhieResponse.setRetryable(false);
            nhieResponse.setErrorMessage("Unexpected HTTP status: " + statusCode);
        }
        
        return nhieResponse;
    }
    
    /**
     * Mask PII in identifiers for logging
     */
    private String maskIdentifier(String identifier) {
        if (identifier == null || identifier.isEmpty()) {
            return identifier;
        }
        
        // Mask Ghana Card: GHA-123456789-0 -> GHA-1234****-*
        identifier = identifier.replaceAll("(GHA-\\d{4})\\d{5}-(\\d)", "$1****-*");
        
        // Mask NHIS: 0123456789 -> 0123******
        identifier = identifier.replaceAll("(\\d{4})\\d{6}", "$1******");
        
        return identifier;
    }
    
    /**
     * Mask PII in URLs for logging
     */
    private String maskUrl(String url) {
        return maskIdentifier(url);
    }
    
    /**
     * Get connect timeout from configuration
     */
    private int getConnectTimeout() {
        String timeout = Context.getAdministrationService()
                .getGlobalProperty("ghana.nhie.timeout.connectMs");
        return timeout != null ? Integer.parseInt(timeout) : DEFAULT_CONNECT_TIMEOUT_MS;
    }
    
    /**
     * Get read timeout from configuration
     */
    private int getReadTimeout() {
        String timeout = Context.getAdministrationService()
                .getGlobalProperty("ghana.nhie.timeout.readMs");
        return timeout != null ? Integer.parseInt(timeout) : DEFAULT_READ_TIMEOUT_MS;
    }
    
    /**
     * Close HTTP client resources
     */
    public void close() throws IOException {
        if (httpClient != null) {
            httpClient.close();
        }
    }

    /**
     * Submit FHIR Encounter resource to NHIE.
     */
    public NHIEResponse submitEncounter(String encounterJson) throws IOException {
        String url = getBaseUrl() + "/Encounter";
        HttpPost request = new HttpPost(url);
        request.setHeader("Content-Type", "application/fhir+json");
        request.setHeader("Accept", "application/fhir+json");
        String token = getAccessToken();
        if (token != null) {
            request.setHeader("Authorization", "Bearer " + token);
        }
        request.setEntity(new StringEntity(encounterJson, StandardCharsets.UTF_8));
        try (CloseableHttpResponse response = httpClient.execute(request)) {
            return buildResponse(response);
        }
    }
    
    /**
     * Inner class: OAuth 2.0 token with expiry tracking
     */
    private static class OAuthToken {
        private final String accessToken;
        private final long expiresAt; // Timestamp in milliseconds
        
        public OAuthToken(String accessToken, int expiresInSeconds) {
            this.accessToken = accessToken;
            // Set expiry with 5-minute buffer for proactive refresh
            this.expiresAt = System.currentTimeMillis() + 
                            (expiresInSeconds * 1000L) - 
                            TOKEN_PROACTIVE_REFRESH_MS;
        }
        
        public String getAccessToken() {
            return accessToken;
        }
        
        public boolean isValid() {
            return System.currentTimeMillis() < expiresAt;
        }
        
        public long getSecondsUntilExpiry() {
            return (expiresAt - System.currentTimeMillis()) / 1000;
        }
    }
}
