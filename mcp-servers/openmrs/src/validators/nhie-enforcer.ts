/**
 * NHIE Integration Enforcer
 * 
 * CRITICAL SECURITY: Enforces that ALL external health system integrations
 * route through NHIE middleware (National Health Information Exchange).
 * 
 * ⚠️ VIOLATION = MoH CONTRACT DISQUALIFICATION ⚠️
 * 
 * From AGENTS.md CRITICAL ARCHITECTURE RULES:
 * - NEVER call nhia.gov.gh (NHIA backend) directly
 * - NEVER call national-mpi.gov.gh (Master Patient Index) directly
 * - ALWAYS route through nhie.moh.gov.gh or nhie-sandbox.moh.gov.gh
 * 
 * Architecture:
 * Facility EMR -> NHIE Middleware -> Backend Systems (NHIA/MPI/SHR)
 */

export interface NHIEEnforcementResult {
  allowed: boolean;
  endpoint?: string;
  violation?: string;
  suggestion?: string;
}

/**
 * Blocked domains (direct access not allowed)
 */
const BLOCKED_DOMAINS = [
  'nhia.gov.gh',           // NHIA backend
  'national-mpi.gov.gh',   // Master Patient Index
  'shr.moh.gov.gh',        // Shared Health Record (if direct access)
] as const;

/**
 * Allowed NHIE domains (all traffic must go here)
 */
const ALLOWED_NHIE_DOMAINS = [
  'nhie.moh.gov.gh',         // Production NHIE
  'nhie-sandbox.moh.gov.gh', // Development sandbox
  'localhost',               // Local dev (mock NHIE)
  '127.0.0.1',              // Local dev (mock NHIE)
] as const;

/**
 * Enforce NHIE routing for external health system calls
 * 
 * @param endpoint - URL or hostname to validate
 * @returns Enforcement result with allowed flag and violation details
 */
export function enforceNHIERouting(endpoint: string): NHIEEnforcementResult {
  if (!endpoint || typeof endpoint !== 'string') {
    return {
      allowed: false,
      violation: 'Endpoint is required for NHIE enforcement check'
    };
  }

  const normalizedEndpoint = endpoint.trim().toLowerCase();

  // Check for blocked domains (direct NHIA/MPI access)
  for (const blockedDomain of BLOCKED_DOMAINS) {
    if (normalizedEndpoint.includes(blockedDomain)) {
      return {
        allowed: false,
        endpoint: endpoint,
        violation: `CRITICAL VIOLATION: Direct access to ${blockedDomain} is prohibited. Must route through NHIE middleware.`,
        suggestion: `Replace endpoint with NHIE equivalent:
- NHIA eligibility check: POST https://nhie.moh.gov.gh/fhir/Coverage
- Patient lookup: GET https://nhie.moh.gov.gh/fhir/Patient
- See AGENTS.md "NHIE Integration Specification" for full endpoint list`
      };
    }
  }

  // Check if endpoint is NHIE or local dev
  const isNHIEEndpoint = ALLOWED_NHIE_DOMAINS.some(domain => 
    normalizedEndpoint.includes(domain)
  );

  if (!isNHIEEndpoint) {
    // Not a blocked domain, but also not NHIE - warn
    return {
      allowed: true,
      endpoint: endpoint,
      suggestion: 'Endpoint is not NHIE middleware. Ensure this is intentional (e.g., OpenMRS local API).'
    };
  }

  // Valid NHIE endpoint
  return {
    allowed: true,
    endpoint: endpoint
  };
}

/**
 * Validate NHIE OAuth token URL
 */
export function validateNHIETokenUrl(tokenUrl: string): NHIEEnforcementResult {
  const result = enforceNHIERouting(tokenUrl);
  
  if (!result.allowed) {
    return result;
  }

  // Additional validation: Must be OAuth endpoint
  if (!tokenUrl.includes('/oauth/token')) {
    return {
      allowed: false,
      endpoint: tokenUrl,
      violation: 'Invalid NHIE OAuth token URL. Expected format: https://nhie.moh.gov.gh/oauth/token'
    };
  }

  return { allowed: true, endpoint: tokenUrl };
}

/**
 * Validate NHIE FHIR base URL
 */
export function validateNHIEFhirBaseUrl(baseUrl: string): NHIEEnforcementResult {
  const result = enforceNHIERouting(baseUrl);
  
  if (!result.allowed) {
    return result;
  }

  // Additional validation: Must be FHIR endpoint
  if (!baseUrl.includes('/fhir')) {
    return {
      allowed: false,
      endpoint: baseUrl,
      violation: 'Invalid NHIE FHIR base URL. Expected format: https://nhie.moh.gov.gh/fhir'
    };
  }

  return { allowed: true, endpoint: baseUrl };
}

/**
 * Assert NHIE routing (throws on violation)
 * Use this in code that must enforce NHIE routing
 */
export function assertNHIERouting(endpoint: string): void {
  const result = enforceNHIERouting(endpoint);
  
  if (!result.allowed) {
    throw new Error(`NHIE_VIOLATION: ${result.violation}\n${result.suggestion || ''}`);
  }
}

/**
 * Check if endpoint is a known external health system
 */
export function isExternalHealthSystemEndpoint(endpoint: string): boolean {
  const normalized = endpoint.toLowerCase();
  
  return BLOCKED_DOMAINS.some(domain => normalized.includes(domain)) ||
         ALLOWED_NHIE_DOMAINS.slice(0, 2).some(domain => normalized.includes(domain));
}

/**
 * Get NHIE configuration from environment
 */
export function getNHIEConfig(): {
  baseUrl: string;
  tokenUrl: string;
  sandbox: boolean;
} {
  const sandbox = process.env.NHIE_SANDBOX === 'true';
  
  const baseUrl = sandbox 
    ? 'https://nhie-sandbox.moh.gov.gh/fhir'
    : 'https://nhie.moh.gov.gh/fhir';
  
  const tokenUrl = sandbox
    ? 'https://nhie-sandbox.moh.gov.gh/oauth/token'
    : 'https://nhie.moh.gov.gh/oauth/token';

  return { baseUrl, tokenUrl, sandbox };
}
