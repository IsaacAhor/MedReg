import { describe, it, expect } from 'vitest';
import { validateGhanaCard, generateGhanaCard, VALID_GHANA_CARDS, INVALID_GHANA_CARDS } from './ghana-card';

describe('Ghana Card Validator', () => {
  describe('validateGhanaCard', () => {
    it('should validate correct Ghana Cards', () => {
      VALID_GHANA_CARDS.forEach((card) => {
        const result = validateGhanaCard(card);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid Ghana Cards', () => {
      INVALID_GHANA_CARDS.forEach((card) => {
        const result = validateGhanaCard(card);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should normalize Ghana Card (trim + uppercase)', () => {
      const result = validateGhanaCard('  gha-123456789-7  ');
      expect(result.isValid).toBe(true);
    });

    it('should detect wrong checksum', () => {
      const result = validateGhanaCard('GHA-123456789-0'); // Wrong checksum (should be 7)
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Ghana Card checksum');
    });

    it('should reject missing hyphens', () => {
      const result = validateGhanaCard('GHA1234567897');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Ghana Card format');
    });

    it('should reject wrong prefix', () => {
      const result = validateGhanaCard('GHB-123456789-7');
      expect(result.isValid).toBe(false);
    });

    it('should reject too short', () => {
      const result = validateGhanaCard('GHA-12345678-9');
      expect(result.isValid).toBe(false);
    });

    it('should reject too long', () => {
      const result = validateGhanaCard('GHA-1234567890-1');
      expect(result.isValid).toBe(false);
    });
  });

  describe('generateGhanaCard', () => {
    it('should generate valid Ghana Card', () => {
      const card = generateGhanaCard();
      const result = validateGhanaCard(card);
      expect(result.isValid).toBe(true);
    });

    it('should generate consistent Ghana Card for same base digits', () => {
      const card1 = generateGhanaCard('123456789');
      const card2 = generateGhanaCard('123456789');
      expect(card1).toBe(card2);
      expect(card1).toBe('GHA-123456789-7');
    });

    it('should throw error for invalid base digits', () => {
      expect(() => generateGhanaCard('12345')).toThrow('Base digits must be exactly 9 digits');
      expect(() => generateGhanaCard('ABCDEFGHI')).toThrow('Base digits must be exactly 9 digits');
    });
  });
});
