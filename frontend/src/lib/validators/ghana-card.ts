/**
 * Ghana Card Validator with Luhn Checksum
 * Format: GHA-XXXXXXXXX-X (15 characters)
 * Example: GHA-123456789-7
 */

export interface GhanaCardValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates Ghana Card format and Luhn checksum
 * @param ghanaCard - Ghana Card number (e.g., "GHA-123456789-7")
 * @returns Validation result with error message if invalid
 */
export function validateGhanaCard(ghanaCard: string): GhanaCardValidationResult {
  // Normalize: trim, uppercase
  const normalized = ghanaCard.trim().toUpperCase();

  // Format validation: GHA-XXXXXXXXX-X
  const regex = /^GHA-\d{9}-\d$/;
  if (!regex.test(normalized)) {
    return {
      isValid: false,
      error: 'Invalid Ghana Card format. Expected: GHA-XXXXXXXXX-X (e.g., GHA-123456789-7)',
    };
  }

  // Extract digits (9 digits + 1 check digit)
  const digits = normalized.replace(/[^0-9]/g, ''); // "1234567897"
  if (digits.length !== 10) {
    return {
      isValid: false,
      error: 'Ghana Card must contain exactly 10 digits',
    };
  }

  // Luhn checksum validation
  const checksum = calculateLuhnChecksum(digits.substring(0, 9));
  const providedCheckDigit = parseInt(digits.charAt(9), 10);

  if (checksum !== providedCheckDigit) {
    return {
      isValid: false,
      error: `Invalid Ghana Card checksum. Expected check digit: ${checksum}, got: ${providedCheckDigit}`,
    };
  }

  return { isValid: true };
}

/**
 * Calculate Luhn checksum for 9 digits
 * @param digits - 9-digit string
 * @returns Check digit (0-9)
 */
function calculateLuhnChecksum(digits: string): number {
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let digit = parseInt(digits.charAt(i), 10);

    // Double every other digit starting from index 0
    if (i % 2 === 0) {
      digit *= 2;
      // If doubled digit > 9, subtract 9
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
  }

  // Check digit = (10 - (sum % 10)) % 10
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit;
}

/**
 * Generate a valid Ghana Card number (for testing)
 * @param baseDigits - 9 random digits (optional)
 * @returns Valid Ghana Card with correct checksum
 */
export function generateGhanaCard(baseDigits?: string): string {
  // Generate 9 random digits if not provided
  const digits = baseDigits || Math.floor(100000000 + Math.random() * 900000000).toString();
  
  if (digits.length !== 9 || !/^\d{9}$/.test(digits)) {
    throw new Error('Base digits must be exactly 9 digits');
  }

  const checksum = calculateLuhnChecksum(digits);
  return `GHA-${digits}-${checksum}`;
}

/**
 * Examples of valid Ghana Cards (for testing)
 * Generated using generateGhanaCard() to ensure correct Luhn checksums
 */
export const VALID_GHANA_CARDS = [
  generateGhanaCard('123456789'),
  generateGhanaCard('987654321'),
  generateGhanaCard('111111111'),
  generateGhanaCard('222222222'),
  generateGhanaCard('333333333'),
];

/**
 * Examples of invalid Ghana Cards (for testing)
 */
export const INVALID_GHANA_CARDS = [
  'GHA-123456789-0', // Wrong checksum
  'INVALID', // Wrong format
  'GHA-12345678-9', // Too short
  'GHA-1234567890-1', // Too long
  '123456789', // Missing prefix
];
