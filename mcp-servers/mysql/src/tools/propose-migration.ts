/**
 * Propose Migration Tool
 * 
 * Allows AI to propose database migrations (DDL/DML)
 * Creates GitHub issue for human approval
 * 
 * Workflow:
 * 1. AI analyzes requirements
 * 2. AI proposes migration with SQL
 * 3. Tool validates SQL and creates GitHub issue
 * 4. Human reviews and approves
 * 5. AI applies migration using apply_migration tool
 */

import { z } from 'zod';
import { validateMigrationSQL } from '../validators';

/**
 * Zod schema for propose_migration input
 */
export const ProposeMigrationSchema = z.object({
  name: z.string()
    .min(3, 'Migration name required (minimum 3 characters)')
    .regex(/^[a-z0-9_]+$/, 'Migration name must be snake_case (lowercase, numbers, underscores)')
    .describe('Migration name in snake_case (e.g., add_nhie_transaction_log)'),
  
  description: z.string()
    .min(10, 'Description required (minimum 10 characters)')
    .describe('Clear description of what this migration does and why it\'s needed'),
  
  sql: z.string()
    .min(10, 'SQL required (minimum 10 characters)')
    .describe('SQL statements to execute (CREATE, ALTER, INSERT, etc.)'),
  
  rollbackSQL: z.string()
    .optional()
    .describe('SQL to rollback this migration (optional but recommended)')
});

export type ProposeMigrationInput = z.infer<typeof ProposeMigrationSchema>;

export interface ProposeMigrationResult {
  success: boolean;
  migration?: {
    name: string;
    timestamp: string;
    githubIssueUrl?: string;
    validationWarnings?: string[];
  };
  error?: string;
}

/**
 * Propose database migration
 */
export async function proposeMigration(
  input: ProposeMigrationInput
): Promise<ProposeMigrationResult> {
  // 1. Validate migration SQL
  const validation = validateMigrationSQL(input.sql);
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors?.join('\n') || 'Migration SQL validation failed'
    };
  }

  // 2. Generate migration timestamp
  const timestamp = new Date().toISOString().replace(/[:-]/g, '').split('.')[0];
  const migrationName = `${timestamp}_${input.name}`;

  // 3. Analyze impact (basic heuristics)
  const impact = analyzeMigrationImpact(input.sql, validation.operation);

  // 4. Create GitHub issue (in real implementation)
  // For MVP, we'll just return the migration details
  const issueBody = formatGitHubIssue(migrationName, input, validation, impact);

  console.error('Migration proposal created. GitHub issue body:');
  console.error(issueBody);

  return {
    success: true,
    migration: {
      name: migrationName,
      timestamp,
      githubIssueUrl: 'https://github.com/IsaacAhor/MedReg/issues/new', // Would be actual issue URL
      validationWarnings: validation.warnings
    }
  };
}

/**
 * Analyze migration impact
 */
function analyzeMigrationImpact(sql: string, operation: string): {
  severity: 'low' | 'medium' | 'high';
  estimatedDowntime: string;
  backupRequired: boolean;
  notes: string[];
} {
  const upperSQL = sql.toUpperCase();
  const notes: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';
  let estimatedDowntime = '< 1 second';
  let backupRequired = false;

  // Analyze operation type
  if (operation === 'DROP') {
    severity = 'high';
    backupRequired = true;
    notes.push('⚠️ DROP operation - irreversible data loss');
  }

  if (operation === 'TRUNCATE') {
    severity = 'high';
    backupRequired = true;
    notes.push('⚠️ TRUNCATE operation - all table data will be deleted');
  }

  if (operation === 'ALTER') {
    severity = 'medium';
    backupRequired = true;
    estimatedDowntime = '1-5 seconds';
    notes.push('ALTER TABLE may lock table briefly');

    if (upperSQL.includes('ADD COLUMN')) {
      notes.push('Adding column - should be fast');
    }

    if (upperSQL.includes('DROP COLUMN')) {
      notes.push('⚠️ Dropping column - ensure no code references this column');
    }

    if (upperSQL.includes('CHANGE') || upperSQL.includes('MODIFY')) {
      notes.push('⚠️ Changing column type may require table rebuild');
      estimatedDowntime = '5-30 seconds';
    }
  }

  if (operation === 'CREATE' && upperSQL.includes('INDEX')) {
    severity = 'medium';
    estimatedDowntime = '5-60 seconds (depends on table size)';
    notes.push('Creating index on large table may take time and lock table');
  }

  if (operation === 'DELETE' || operation === 'UPDATE') {
    severity = 'medium';
    backupRequired = true;
    notes.push('DML operation - ensure WHERE clause is correct');
  }

  return {
    severity,
    estimatedDowntime,
    backupRequired,
    notes
  };
}

/**
 * Format GitHub issue body
 */
function formatGitHubIssue(
  migrationName: string,
  input: ProposeMigrationInput,
  validation: any,
  impact: any
): string {
  return `
# Database Migration Proposal: ${migrationName}

**Proposed by:** AI Agent  
**Date:** ${new Date().toISOString()}  
**Status:** 🟡 Awaiting Approval

---

## Description
${input.description}

---

## SQL

\`\`\`sql
${input.sql}
\`\`\`

${input.rollbackSQL ? `
## Rollback SQL

\`\`\`sql
${input.rollbackSQL}
\`\`\`
` : ''}

---

## Impact Analysis

- **Operation:** ${validation.operation}
- **Severity:** ${impact.severity.toUpperCase()}
- **Estimated Downtime:** ${impact.estimatedDowntime}
- **Backup Required:** ${impact.backupRequired ? '✅ Yes' : '❌ No'}

${validation.warnings && validation.warnings.length > 0 ? `
### Validation Warnings
${validation.warnings.map((w: string) => `- ${w}`).join('\n')}
` : ''}

${impact.notes.length > 0 ? `
### Notes
${impact.notes.map((n: string) => `- ${n}`).join('\n')}
` : ''}

---

## Approval Checklist

- [ ] SQL reviewed for correctness
- [ ] Impact analysis reviewed
- [ ] Backup plan confirmed
- [ ] Rollback procedure documented
- [ ] Application code compatible with migration
- [ ] Testing plan defined

---

## How to Apply

Once approved, run:

\`\`\`powershell
# Create backup
npm run backup

# Apply migration
# (Use apply_migration tool with approval ID from this issue)
\`\`\`

---

**⚠️ DO NOT apply this migration without approval and backup ⚠️**
`.trim();
}
