/**
 * PII Masker - Masks Personally Identifiable Information in logs and outputs
 * 
 * Ensures GDPR/data protection compliance by masking:
 * - Ghana Card numbers
 * - NHIS numbers  
 * - Phone numbers
 * - Patient names (in some contexts)
 */

export interface MaskingConfig {
  maskGhanaCard?: boolean;
  maskNHIS?: boolean;
  maskPhone?: boolean;
  maskNames?: boolean;
}

const DEFAULT_CONFIG: MaskingConfig = {
  maskGhanaCard: true,
  maskNHIS: true,
  maskPhone: true,
  maskNames: false
};

/**
 * Mask Ghana Card number
 * Format: GHA-XXXXXXXXX-X
 * Masked: GHA-1234*****-*
 */
export function maskGhanaCard(ghanaCard: string): string {
  if (!ghanaCard || ghanaCard.length < 15) {
    return '***';
  }
  
  // GHA-1234*****-*
  return ghanaCard.substring(0, 8) + '*****-*';
}

/**
 * Mask NHIS number
 * Format: 0123456789 (10 digits)
 * Masked: 0123******
 */
export function maskNHIS(nhis: string): string {
  if (!nhis || nhis.length !== 10) {
    return '***';
  }
  
  return nhis.substring(0, 4) + '******';
}

/**
 * Mask phone number
 * Format: +233244123456
 * Masked: +233244*******
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 10) {
    return '***';
  }
  
  // Keep country code + first 3 digits, mask rest
  const match = phone.match(/^(\+?\d{2,3}\d{2,3})/);
  if (match) {
    return match[1] + '*'.repeat(phone.length - match[1].length);
  }
  
  return '***';
}

/**
 * Mask person name
 * Format: Kwame Mensah
 * Masked: K***e M****h
 */
export function maskName(name: string): string {
  if (!name || name.length < 2) {
    return '***';
  }
  
  if (name.length <= 3) {
    return name[0] + '*'.repeat(name.length - 1);
  }
  
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

/**
 * Mask PII in any string/object
 * Automatically detects and masks Ghana Cards, NHIS numbers, phone numbers
 */
export function maskPII(data: any, config: MaskingConfig = DEFAULT_CONFIG): any {
  if (typeof data === 'string') {
    return maskPIIString(data, config);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => maskPII(item, config));
  }
  
  if (typeof data === 'object' && data !== null) {
    const masked: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Check if key suggests PII
      const keyLower = key.toLowerCase();
      
      if (keyLower.includes('ghanacard') || keyLower.includes('ghana_card')) {
        masked[key] = config.maskGhanaCard && typeof value === 'string' 
          ? maskGhanaCard(value) 
          : value;
      } else if (keyLower.includes('nhis')) {
        masked[key] = config.maskNHIS && typeof value === 'string'
          ? maskNHIS(value)
          : value;
      } else if (keyLower.includes('phone') || keyLower.includes('mobile')) {
        masked[key] = config.maskPhone && typeof value === 'string'
          ? maskPhone(value)
          : value;
      } else if (config.maskNames && (keyLower.includes('name') && !keyLower.includes('username'))) {
        masked[key] = typeof value === 'string'
          ? maskName(value)
          : value;
      } else {
        masked[key] = maskPII(value, config);
      }
    }
    return masked;
  }
  
  return data;
}

/**
 * Mask PII in a string (finds patterns)
 */
function maskPIIString(text: string, config: MaskingConfig): string {
  let masked = text;
  
  if (config.maskGhanaCard) {
    // Match Ghana Card pattern: GHA-XXXXXXXXX-X
    masked = masked.replace(
      /GHA-\d{9}-\d/gi,
      (match) => maskGhanaCard(match)
    );
  }
  
  if (config.maskNHIS) {
    // Match NHIS pattern in context (e.g., "NHIS: 0123456789" or "nhis_number: 0123456789")
    masked = masked.replace(
      /(nhis[_\s:-]*)\d{10}/gi,
      (match, prefix) => {
        const nhis = match.substring(prefix.length);
        return prefix + maskNHIS(nhis);
      }
    );
  }
  
  if (config.maskPhone) {
    // Match Ghana phone numbers: +233XXXXXXXXX or 0XXXXXXXXX
    masked = masked.replace(
      /(\+233|0)\d{9}/g,
      (match) => maskPhone(match)
    );
  }
  
  return masked;
}

/**
 * Test if string contains unmasked PII (for validation)
 */
export function containsUnmaskedPII(text: string): boolean {
  // Check for Ghana Card pattern
  if (/GHA-\d{9}-\d/.test(text)) {
    return true;
  }
  
  // Check for 10-digit NHIS number
  if (/\b\d{10}\b/.test(text)) {
    return true;
  }
  
  // Check for Ghana phone numbers
  if (/(\+233|0)\d{9}/.test(text)) {
    return true;
  }
  
  return false;
}

/**
 * Assert that text does not contain unmasked PII
 * Throws error if PII found (use in tests/validators)
 */
export function assertNoPII(text: string, context?: string): void {
  if (containsUnmaskedPII(text)) {
    throw new Error(
      `PII detected in ${context || 'output'}. All Ghana Cards, NHIS numbers, and phone numbers must be masked.`
    );
  }
}
