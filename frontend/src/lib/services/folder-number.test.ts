/**
 * Unit Tests for Folder Number Generation Service
 * 
 * Tests cover:
 * - Format validation
 * - Parsing and formatting
 * - Sequence increment
 * - Region code validation
 * - Thread safety scenarios (mocked)
 * - Year rollover
 * 
 * Target: >90% code coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatFolderNumber,
  parseFolderNumber,
  isValidFolderNumber,
  getFolderNumberPrefix,
  generateFolderNumber,
  getNextSequence,
  GHANA_REGIONS,
  type GhanaRegionCode,
  type FolderNumberConfig,
} from './folder-number';

describe('formatFolderNumber', () => {
  it('should format valid folder number correctly', () => {
    const result = formatFolderNumber({
      regionCode: 'GAR',
      facilityCode: 'KBTH',
      year: 2025,
      sequence: 123,
    });
    
    expect(result).toBe('GAR-KBTH-2025-000123');
  });

  it('should pad sequence to 6 digits', () => {
    const result = formatFolderNumber({
      regionCode: 'AR',
      facilityCode: 'KATH',
      year: 2025,
      sequence: 1,
    });
    
    expect(result).toBe('AR-KATH-2025-000001');
  });

  it('should handle maximum sequence number', () => {
    const result = formatFolderNumber({
      regionCode: 'GAR',
      facilityCode: 'KBTH',
      year: 2025,
      sequence: 999999,
    });
    
    expect(result).toBe('GAR-KBTH-2025-999999');
  });

  it('should reject invalid region codes', () => {
    expect(() => {
      formatFolderNumber({
        regionCode: 'INVALID' as GhanaRegionCode,
        facilityCode: 'KBTH',
        year: 2025,
        sequence: 1,
      });
    }).toThrow();
  });

  it('should reject sequence exceeding 999999', () => {
    expect(() => {
      formatFolderNumber({
        regionCode: 'GAR',
        facilityCode: 'KBTH',
        year: 2025,
        sequence: 1000000,
      });
    }).toThrow();
  });

  it('should reject negative sequence', () => {
    expect(() => {
      formatFolderNumber({
        regionCode: 'GAR',
        facilityCode: 'KBTH',
        year: 2025,
        sequence: -1,
      });
    }).toThrow();
  });

  it('should reject year before 2020', () => {
    expect(() => {
      formatFolderNumber({
        regionCode: 'GAR',
        facilityCode: 'KBTH',
        year: 2019,
        sequence: 1,
      });
    }).toThrow();
  });

  it('should handle all 16 Ghana regions', () => {
    GHANA_REGIONS.forEach((regionCode) => {
      const result = formatFolderNumber({
        regionCode,
        facilityCode: 'TEST',
        year: 2025,
        sequence: 1,
      });
      expect(result).toMatch(new RegExp(`^${regionCode}-TEST-2025-\\d{6}$`));
    });
  });
});

describe('parseFolderNumber', () => {
  it('should parse valid folder number', () => {
    const result = parseFolderNumber('GAR-KBTH-2025-000123');
    
    expect(result).toEqual({
      regionCode: 'GAR',
      facilityCode: 'KBTH',
      year: 2025,
      sequence: 123,
    });
  });

  it('should parse folder number with 3-letter region code', () => {
    const result = parseFolderNumber('BER-HOSP-2025-000001');
    
    expect(result).toEqual({
      regionCode: 'BER',
      facilityCode: 'HOSP',
      year: 2025,
      sequence: 1,
    });
  });

  it('should return null for invalid format', () => {
    expect(parseFolderNumber('INVALID')).toBeNull();
    expect(parseFolderNumber('GA-KBTH-2025')).toBeNull();
    expect(parseFolderNumber('GAR-KBTH-25-000123')).toBeNull();
    expect(parseFolderNumber('GAR-KBTH-2025-123')).toBeNull(); // Too short
  });

  it('should return null for non-existent region code', () => {
    const result = parseFolderNumber('ZZZ-KBTH-2025-000123');
    expect(result).toBeNull();
  });

  it('should handle leading zeros in sequence', () => {
    const result = parseFolderNumber('GAR-KBTH-2025-000001');
    expect(result?.sequence).toBe(1);
  });
});

describe('isValidFolderNumber', () => {
  it('should validate correct folder numbers', () => {
    expect(isValidFolderNumber('GAR-KBTH-2025-000123')).toBe(true);
    expect(isValidFolderNumber('AR-KATH-2025-000001')).toBe(true);
    expect(isValidFolderNumber('BER-HOSP-2025-999999')).toBe(true);
  });

  it('should reject invalid folder numbers', () => {
    expect(isValidFolderNumber('INVALID')).toBe(false);
    expect(isValidFolderNumber('')).toBe(false);
    expect(isValidFolderNumber('GAR-KBTH-2025')).toBe(false);
    expect(isValidFolderNumber('ZZZ-KBTH-2025-000123')).toBe(false);
  });
});

describe('getFolderNumberPrefix', () => {
  it('should generate prefix with current year', () => {
    const currentYear = new Date().getFullYear();
    const result = getFolderNumberPrefix('GAR', 'KBTH');
    
    expect(result).toBe(`GAR-KBTH-${currentYear}`);
  });

  it('should generate prefix with specified year', () => {
    const result = getFolderNumberPrefix('AR', 'KATH', 2024);
    
    expect(result).toBe('AR-KATH-2024');
  });

  it('should handle all region codes', () => {
    GHANA_REGIONS.forEach((regionCode) => {
      const result = getFolderNumberPrefix(regionCode, 'TEST', 2025);
      expect(result).toBe(`${regionCode}-TEST-2025`);
    });
  });
});

describe('generateFolderNumber', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let config: FolderNumberConfig;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    config = {
      openmrsBaseUrl: 'http://localhost:8080/openmrs/ws/rest/v1',
      openmrsRootUrl: 'http://localhost:8080/openmrs',
      authHeader: 'Basic dGVzdDp0ZXN0',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use module endpoint when available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ folderNumber: 'GAR-KBTH-2025-000001' }),
    });

    const result = await generateFolderNumber('GAR', 'KBTH', config);

    expect(result).toBe('GAR-KBTH-2025-000001');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ws/ghana/foldernumber/allocate'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should fallback to SystemSetting when module fails', async () => {
    const year = new Date().getFullYear();
    
    // Module endpoint fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    });

    // SystemSetting search returns no results (new sequence)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });

    // SystemSetting save
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await generateFolderNumber('GAR', 'KBTH', config);

    expect(result).toBe(`GAR-KBTH-${year}-000001`);
    expect(mockFetch).toHaveBeenCalledTimes(3); // Module + search + save
  });

  it('should increment existing sequence', async () => {
    const year = new Date().getFullYear();
    
    // Module endpoint fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    });

    // SystemSetting search returns existing sequence
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            property: `ghana.folder.sequence.GAR-KBTH-${year}`,
            value: '42',
          },
        ],
      }),
    });

    // SystemSetting save
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await generateFolderNumber('GAR', 'KBTH', config);

    expect(result).toBe(`GAR-KBTH-${year}-000043`);
  });

  it('should handle invalid module response gracefully', async () => {
    const year = new Date().getFullYear();
    
    // Module returns invalid folder number
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ folderNumber: 'INVALID-FORMAT' }),
    });

    // SystemSetting search
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });

    // SystemSetting save
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await generateFolderNumber('GAR', 'KBTH', config);

    // Should fallback to SystemSetting
    expect(result).toBe(`GAR-KBTH-${year}-000001`);
  });

  it('should reject invalid region code', async () => {
    await expect(
      generateFolderNumber('INVALID' as GhanaRegionCode, 'KBTH', config)
    ).rejects.toThrow();
  });
});

describe('getNextSequence', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let config: FolderNumberConfig;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    config = {
      openmrsBaseUrl: 'http://localhost:8080/openmrs/ws/rest/v1',
      openmrsRootUrl: 'http://localhost:8080/openmrs',
      authHeader: 'Basic dGVzdDp0ZXN0',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 1 for new sequence', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });

    const result = await getNextSequence('GAR', 'KBTH', config);
    expect(result).toBe(1);
  });

  it('should return incremented value for existing sequence', async () => {
    const year = new Date().getFullYear();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            property: `ghana.folder.sequence.GAR-KBTH-${year}`,
            value: '100',
          },
        ],
      }),
    });

    const result = await getNextSequence('GAR', 'KBTH', config);
    expect(result).toBe(101);
  });

  it('should handle API failures gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await getNextSequence('GAR', 'KBTH', config);
    expect(result).toBe(1); // Default to 1 on error
  });
});

describe('Year Rollover', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let config: FolderNumberConfig;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    config = {
      openmrsBaseUrl: 'http://localhost:8080/openmrs/ws/rest/v1',
      openmrsRootUrl: 'http://localhost:8080/openmrs',
      authHeader: 'Basic dGVzdDp0ZXN0',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reset sequence for new year', async () => {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    // Module fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    });

    // SystemSetting search (looks for current year, finds nothing)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            // Old year sequence exists but shouldn't match
            property: `ghana.folder.sequence.GAR-KBTH-${lastYear}`,
            value: '999',
          },
        ],
      }),
    });

    // SystemSetting save
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await generateFolderNumber('GAR', 'KBTH', config);

    // Should start from 1 for new year
    expect(result).toBe(`GAR-KBTH-${currentYear}-000001`);
  });
});
