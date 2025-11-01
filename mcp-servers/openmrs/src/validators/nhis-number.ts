/**
 * NHIS Number Validator
 * 
 * Validates Ghana NHIS (National Health Insurance Scheme) numbers
 * Format: 10 digits exactly (no hyphens, no letters)
 * 
 * From AGENTS.md Ghana domain rules
 */

export interface NHISValidationResult {
  valid: boolean;
  formatted?: string;
  error?: string;
}

/**
 * Validate NHIS number (10 digits, numeric only)
 */
export function validateNHIS(nhisNumber: string): NHISValidationResult {
  if (!nhisNumber || typeof nhisNumber !== 'string') {
    return { valid: false, error: 'NHIS number is required' };
  }

  // Normalize: trim, remove spaces/hyphens
  const normalized = nhisNumber.trim().replace(/[\s-]/g, '');

  // Check format: exactly 10 digits
  const formatRegex = /^\d{10}$/;
  if (!formatRegex.test(normalized)) {
    if (normalized.length < 10) {
      return {
        valid: false,
        error: `NHIS number must be 10 digits (provided: ${normalized.length})`
      };
    } else if (normalized.length > 10) {
      return {
        valid: false,
        error: `NHIS number must be 10 digits (provided: ${normalized.length})`
      };
    } else {
      return {
        valid: false,
        error: 'NHIS number must contain only digits (0-9)'
      };
    }
  }

  return {
    valid: true,
    formatted: normalized
  };
}

/**
 * Auto-format NHIS number (remove hyphens/spaces)
 * Handles cases where user inputs with formatting like "012-345-6789"
 */
export function formatNHIS(input: string): string {
  // Remove all non-digit characters
  const cleaned = input.replace(/\D/g, '');
  return cleaned;
}

/**
 * Generate random valid NHIS number (for testing)
 */
export function generateTestNHIS(): string {
  // Generate 10 random digits
  const digits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  return digits;
}

/**
 * Common test NHIS numbers (pre-validated)
 */
export const TEST_NHIS_NUMBERS = {
  valid: [
    '0123456789',
    '9876543210',
    '5555555555',
    '1111111111'
  ],
  invalid: [
    '012-345-6789', // Has hyphens (should auto-format)
    '12345',        // Too short
    'NHIS123456',   // Has letters
    '',             // Empty
    '12345678901'   // Too long (11 digits)
  ]
};

/**
 * Check if NHIS number is optional at registration
 * Per AGENTS.md: "Optional at registration (patient can register without NHIS number)"
 */
export function isNHISOptional(): boolean {
  return true;
}

/**
 * Validate NHIS with optional flag
 * Allows empty/null values if optional
 */
export function validateNHISOptional(nhisNumber: string | null | undefined): NHISValidationResult {
  // If empty and optional, it's valid
  if (!nhisNumber || nhisNumber.trim() === '') {
    return {
      valid: true,
      formatted: undefined
    };
  }

  // Otherwise, validate normally
  return validateNHIS(nhisNumber);
}
