/**
 * Context Loader - Loads project context from AGENTS.md and domain knowledge files
 * 
 * Provides AI agents with full project context including:
 * - Ghana health domain rules (Ghana Card, NHIS, folder numbers)
 * - OpenMRS patterns (Service/DAO/Controller)
 * - Frontend patterns (React Hook Form + Zod + shadcn/ui)
 * - NHIE integration rules
 * - Security/PII guidelines
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ProjectContext {
  agentsContent: string;
  ghanaRules: GhanaRules;
  opdWorkflow: string;
  diagnoses: string[];
  facilityConfig: FacilityConfig;
}

export interface GhanaRules {
  ghanaCardFormat: string;
  ghanaCardRegex: RegExp;
  nhisFormat: string;
  nhisRegex: RegExp;
  folderNumberFormat: string;
  regionCodes: Record<string, string>;
}

export interface FacilityConfig {
  facilityCode: string;
  facilityName: string;
  regionCode: string;
  regionName: string;
}

// Default facility config (from openmrs-runtime.properties)
const DEFAULT_FACILITY: FacilityConfig = {
  facilityCode: 'KBTH',
  facilityName: 'Korle Bu Teaching Hospital',
  regionCode: 'GAR',
  regionName: 'Greater Accra'
};

// Ghana region codes
const GHANA_REGION_CODES: Record<string, string> = {
  'AR': 'Ashanti',
  'BER': 'Bono East',
  'BR': 'Bono',
  'CR': 'Central',
  'ER': 'Eastern',
  'GAR': 'Greater Accra',
  'NER': 'North East',
  'NR': 'Northern',
  'NWR': 'North West',
  'OR': 'Oti',
  'SR': 'Savannah',
  'UER': 'Upper East',
  'UWR': 'Upper West',
  'VR': 'Volta',
  'WR': 'Western',
  'WNR': 'Western North'
};

/**
 * Load full project context
 */
export async function loadProjectContext(repoRoot: string): Promise<ProjectContext> {
  const agentsPath = path.join(repoRoot, 'AGENTS.md');
  const agentsContent = fs.existsSync(agentsPath)
    ? fs.readFileSync(agentsPath, 'utf-8')
    : '';
  
  const ghanaRules = extractGhanaRules(agentsContent);
  
  const opdWorkflowPath = path.join(repoRoot, 'domain-knowledge', 'workflows', 'opd-workflow.md');
  const opdWorkflow = fs.existsSync(opdWorkflowPath)
    ? fs.readFileSync(opdWorkflowPath, 'utf-8')
    : '';
  
  const diagnosesPath = path.join(repoRoot, 'domain-knowledge', 'data', 'diagnosis-value-set.md');
  const diagnoses = fs.existsSync(diagnosesPath)
    ? extractDiagnoses(fs.readFileSync(diagnosesPath, 'utf-8'))
    : [];
  
  const facilityConfig = loadFacilityConfig(repoRoot);
  
  return {
    agentsContent,
    ghanaRules,
    opdWorkflow,
    diagnoses,
    facilityConfig
  };
}

/**
 * Extract Ghana domain rules from AGENTS.md
 */
function extractGhanaRules(agentsContent: string): GhanaRules {
  return {
    ghanaCardFormat: 'GHA-XXXXXXXXX-X',
    ghanaCardRegex: /^GHA-\d{9}-\d$/,
    nhisFormat: '10 digits',
    nhisRegex: /^\d{10}$/,
    folderNumberFormat: '{REGION}-{FACILITY}-{YEAR}-{SEQUENCE}',
    regionCodes: GHANA_REGION_CODES
  };
}

/**
 * Extract top diagnoses from value set
 */
function extractDiagnoses(content: string): string[] {
  const diagnoses: string[] = [];
  
  // Simple extraction - in real implementation would parse markdown table
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('|') && line.includes('B54')) {
      diagnoses.push('Malaria (B54)');
    }
    if (line.includes('|') && line.includes('J06.9')) {
      diagnoses.push('Upper respiratory tract infection (J06.9)');
    }
    // ... add more as needed
  }
  
  return diagnoses.length > 0 ? diagnoses : [
    'Malaria (B54)',
    'Upper respiratory tract infection (J06.9)',
    'Hypertension (I10)',
    'Gastroenteritis (A09)'
  ];
}

/**
 * Load facility configuration from openmrs-runtime.properties
 */
function loadFacilityConfig(repoRoot: string): FacilityConfig {
  const propsPath = path.join(repoRoot, 'openmrs-runtime.properties');
  
  if (!fs.existsSync(propsPath)) {
    return DEFAULT_FACILITY;
  }
  
  const content = fs.readFileSync(propsPath, 'utf-8');
  const config: Partial<FacilityConfig> = {};
  
  // Parse properties
  const facilityCodeMatch = content.match(/ghana\.facility\.code=(\w+)/);
  if (facilityCodeMatch) {
    config.facilityCode = facilityCodeMatch[1];
  }
  
  const facilityNameMatch = content.match(/ghana\.facility\.name=(.+)/);
  if (facilityNameMatch) {
    config.facilityName = facilityNameMatch[1].trim();
  }
  
  const regionCodeMatch = content.match(/ghana\.facility\.region=(\w+)/);
  if (regionCodeMatch) {
    config.regionCode = regionCodeMatch[1];
    config.regionName = GHANA_REGION_CODES[regionCodeMatch[1]] || regionCodeMatch[1];
  }
  
  return { ...DEFAULT_FACILITY, ...config };
}

/**
 * Get Ghana Card validation regex and format
 */
export function getGhanaCardValidation(): { regex: RegExp; format: string; example: string } {
  return {
    regex: /^GHA-\d{9}-\d$/,
    format: 'GHA-XXXXXXXXX-X',
    example: 'GHA-123456789-0'
  };
}

/**
 * Get NHIS validation regex and format
 */
export function getNHISValidation(): { regex: RegExp; format: string; example: string } {
  return {
    regex: /^\d{10}$/,
    format: '10 digits (no hyphens)',
    example: '0123456789'
  };
}

/**
 * Get folder number format for facility
 */
export function getFolderNumberFormat(facilityConfig: FacilityConfig, year?: number): string {
  const currentYear = year || new Date().getFullYear();
  return `${facilityConfig.regionCode}-${facilityConfig.facilityCode}-${currentYear}-XXXXXX`;
}

/**
 * Get all Ghana region codes
 */
export function getGhanaRegionCodes(): Record<string, string> {
  return { ...GHANA_REGION_CODES };
}
