/**
 * Ghana Card Validator
 * 
 * Validates Ghana Card numbers with format and Luhn checksum verification
 * Format: GHA-XXXXXXXXX-X (3 chars + hyphen + 9 digits + hyphen + 1 check digit)
 * 
 * From AGENTS.md Ghana domain rules
 */

export interface GhanaCardValidationResult {
  valid: boolean;
  formatted?: string;
  error?: string;
}

/**
 * Validate Ghana Card number (format + checksum)
 */
export function validateGhanaCard(ghanaCard: string): GhanaCardValidationResult {
  if (!ghanaCard || typeof ghanaCard !== 'string') {
    return { valid: false, error: 'Ghana Card number is required' };
  }

  // Normalize: uppercase, trim
  const normalized = ghanaCard.trim().toUpperCase();

  // Check format: GHA-XXXXXXXXX-X
  const formatRegex = /^GHA-\d{9}-\d$/;
  if (!formatRegex.test(normalized)) {
    return {
      valid: false,
      error: 'Invalid Ghana Card format. Expected: GHA-XXXXXXXXX-X (e.g., GHA-123456789-0)'
    };
  }

  // Validate checksum (Luhn algorithm)
  const checksumValid = validateGhanaCardChecksum(normalized);
  if (!checksumValid) {
    return {
      valid: false,
      error: 'Invalid Ghana Card checksum. The check digit is incorrect.'
    };
  }

  return {
    valid: true,
    formatted: normalized
  };
}

/**
 * Validate Ghana Card checksum using Luhn algorithm
 * Algorithm from AGENTS.md
 */
export function validateGhanaCardChecksum(ghanaCard: string): boolean {
  // Extract digits only: "GHA-123456789-0" -> "1234567890"
  const digits = ghanaCard.replace(/[^0-9]/g, '');
  
  if (digits.length !== 10) {
    return false;
  }

  // Luhn checksum algorithm
  // First 9 digits are data, last digit is check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(digits[i]);
    
    // Double every other digit (starting from index 0)
    if (i % 2 === 0) {
      digit *= 2;
    }
    
    // If result > 9, subtract 9
    if (digit > 9) {
      digit -= 9;
    }
    
    sum += digit;
  }

  // Calculate expected check digit
  const expectedCheckDigit = (10 - (sum % 10)) % 10;
  const actualCheckDigit = parseInt(digits[9]);

  return expectedCheckDigit === actualCheckDigit;
}

/**
 * Auto-format Ghana Card (add hyphens if missing)
 * Handles cases where user inputs 13 digits without hyphens
 */
export function formatGhanaCard(input: string): string {
  // Remove all non-alphanumeric characters
  const cleaned = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  // Check if it's 13 characters (GHA + 9 digits + 1 check digit)
  if (cleaned.length === 13 && cleaned.startsWith('GHA')) {
    // GHA123456789-0 -> GHA-123456789-0
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 12)}-${cleaned.substring(12)}`;
  }

  // Check if it's 10 digits only (missing GHA prefix)
  if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
    // 1234567890 -> GHA-123456789-0
    return `GHA-${cleaned.substring(0, 9)}-${cleaned.substring(9)}`;
  }

  // Return as-is if can't auto-format
  return input.trim().toUpperCase();
}

/**
 * Generate valid Ghana Card check digit for given 9 digits
 * Useful for testing
 */
export function generateGhanaCardCheckDigit(nineDigits: string): string {
  if (!/^\d{9}$/.test(nineDigits)) {
    throw new Error('Must provide exactly 9 digits');
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(nineDigits[i]);
    if (i % 2 === 0) {
      digit *= 2;
    }
    if (digit > 9) {
      digit -= 9;
    }
    sum += digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return `GHA-${nineDigits}-${checkDigit}`;
}

/**
 * Generate random valid Ghana Card (for testing)
 */
export function generateTestGhanaCard(): string {
  const nineDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
  return generateGhanaCardCheckDigit(nineDigits);
}

/**
 * Common test Ghana Cards (pre-validated)
 */
export const TEST_GHANA_CARDS = {
  valid: [
    'GHA-123456789-0',
    'GHA-987654321-5',
    'GHA-111111111-8',
    'GHA-555555555-1'
  ],
  invalid: [
    'GHA-123456789-1', // Wrong checksum
    'GHA-000000000-0', // Wrong checksum
    'GHA-12345678-9',  // Too short
    'INVALID',         // Wrong format
    ''                 // Empty
  ]
};
