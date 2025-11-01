/**
 * SQL Validator
 * 
 * Validates SQL queries for safety:
 * - Blocks dangerous operations (INSERT, UPDATE, DELETE, DROP, TRUNCATE)
 * - Allows read-only operations (SELECT, DESCRIBE, SHOW)
 * - Detects SQL injection patterns
 * - Enforces query complexity limits
 */

export interface SQLValidationResult {
  valid: boolean;
  safe: boolean;
  query: string;
  operation: string;
  warnings?: string[];
  errors?: string[];
}

/**
 * Dangerous SQL operations (blocked in read-only mode)
 */
const DANGEROUS_OPERATIONS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'GRANT',
  'REVOKE',
  'EXEC',
  'EXECUTE',
  'CALL',
] as const;

/**
 * Safe SQL operations (allowed in read-only mode)
 */
const SAFE_OPERATIONS = [
  'SELECT',
  'SHOW',
  'DESCRIBE',
  'DESC',
  'EXPLAIN',
] as const;

/**
 * SQL injection patterns to detect
 */
const INJECTION_PATTERNS = [
  /;\s*DROP/i,
  /;\s*DELETE/i,
  /;\s*UPDATE/i,
  /UNION\s+SELECT/i,
  /\/\*.*\*\//,  // Block comments (can hide malicious SQL)
  /--/,          // SQL comments
  /#/,           // MySQL comments
] as const;

/**
 * Validate SQL query for safety
 */
export function validateSQL(sql: string, readOnly: boolean = true): SQLValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!sql || typeof sql !== 'string') {
    return {
      valid: false,
      safe: false,
      query: '',
      operation: 'UNKNOWN',
      errors: ['SQL query is required']
    };
  }

  const trimmedSQL = sql.trim();
  const upperSQL = trimmedSQL.toUpperCase();

  // 1. Detect primary operation
  const operation = detectOperation(upperSQL);

  // 2. Check if operation is dangerous
  const isDangerous = DANGEROUS_OPERATIONS.some(op => operation === op);
  const isSafe = SAFE_OPERATIONS.some(op => operation === op);

  // 3. In read-only mode, block dangerous operations
  if (readOnly && isDangerous) {
    return {
      valid: false,
      safe: false,
      query: trimmedSQL,
      operation,
      errors: [
        `Dangerous operation blocked: ${operation}`,
        'Read-only mode only allows: SELECT, SHOW, DESCRIBE, EXPLAIN',
        'Use propose_migration tool for DDL/DML operations'
      ]
    };
  }

  // 4. Check for SQL injection patterns
  const injectionDetected = INJECTION_PATTERNS.some(pattern => pattern.test(trimmedSQL));
  if (injectionDetected) {
    return {
      valid: false,
      safe: false,
      query: trimmedSQL,
      operation,
      errors: ['Potential SQL injection detected. Query contains suspicious patterns.']
    };
  }

  // 5. Check query complexity (prevent resource exhaustion)
  if (trimmedSQL.length > 10000) {
    warnings.push('Query is very long (>10k chars). Consider breaking into smaller queries.');
  }

  // 6. Warn about missing LIMIT clause for SELECT
  if (operation === 'SELECT' && !upperSQL.includes('LIMIT')) {
    warnings.push('No LIMIT clause. Query may return large result set. Consider adding LIMIT.');
  }

  // 7. Warn about SELECT * (bad practice)
  if (operation === 'SELECT' && /SELECT\s+\*/i.test(trimmedSQL)) {
    warnings.push('SELECT * found. Prefer explicit column names for better performance.');
  }

  // Valid query
  return {
    valid: true,
    safe: isSafe || !isDangerous,
    query: trimmedSQL,
    operation,
    warnings: warnings.length > 0 ? warnings : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Detect primary SQL operation
 */
function detectOperation(upperSQL: string): string {
  // Remove leading whitespace and comments
  const cleaned = upperSQL.replace(/^\s+/, '');

  // Check for each operation type
  for (const op of DANGEROUS_OPERATIONS) {
    if (cleaned.startsWith(op)) {
      return op;
    }
  }

  for (const op of SAFE_OPERATIONS) {
    if (cleaned.startsWith(op)) {
      return op;
    }
  }

  return 'UNKNOWN';
}

/**
 * Validate migration SQL (allows DDL but still checks for safety)
 */
export function validateMigrationSQL(sql: string): SQLValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!sql || typeof sql !== 'string') {
    return {
      valid: false,
      safe: false,
      query: '',
      operation: 'UNKNOWN',
      errors: ['Migration SQL is required']
    };
  }

  const trimmedSQL = sql.trim();
  const upperSQL = trimmedSQL.toUpperCase();
  const operation = detectOperation(upperSQL);

  // 1. Check for SQL injection even in migrations
  const injectionDetected = INJECTION_PATTERNS.some(pattern => pattern.test(trimmedSQL));
  if (injectionDetected) {
    return {
      valid: false,
      safe: false,
      query: trimmedSQL,
      operation,
      errors: ['Potential SQL injection detected in migration.']
    };
  }

  // 2. Warn about dangerous operations in migrations
  if (operation === 'DROP') {
    warnings.push('⚠️ DROP operation detected. Ensure you have a backup before applying.');
  }

  if (operation === 'TRUNCATE') {
    warnings.push('⚠️ TRUNCATE operation detected. All data in table will be deleted.');
  }

  if (operation === 'DELETE' && !upperSQL.includes('WHERE')) {
    warnings.push('⚠️ DELETE without WHERE clause. All rows will be deleted.');
  }

  if (operation === 'UPDATE' && !upperSQL.includes('WHERE')) {
    warnings.push('⚠️ UPDATE without WHERE clause. All rows will be updated.');
  }

  // 3. Recommend best practices for migrations
  if (operation === 'CREATE' && upperSQL.includes('TABLE')) {
    if (!upperSQL.includes('IF NOT EXISTS')) {
      warnings.push('Consider using CREATE TABLE IF NOT EXISTS for idempotency.');
    }
  }

  if (operation === 'ALTER' && upperSQL.includes('TABLE')) {
    warnings.push('Ensure ALTER TABLE is backward compatible with running application.');
  }

  return {
    valid: true,
    safe: false, // Migrations are inherently unsafe (modifying schema)
    query: trimmedSQL,
    operation,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Generate test SQL queries (for unit tests)
 */
export const TEST_SQL_QUERIES = {
  safe: [
    'SELECT * FROM patient WHERE patient_id = 1',
    'SHOW TABLES',
    'DESCRIBE patient',
    'EXPLAIN SELECT * FROM patient',
    'SELECT patient_id, uuid FROM patient LIMIT 10'
  ],
  dangerous: [
    'DELETE FROM patient WHERE patient_id = 1',
    'UPDATE patient SET voided = 1',
    'DROP TABLE patient',
    'TRUNCATE TABLE patient',
    'INSERT INTO patient (uuid) VALUES (uuid())',
    'CREATE TABLE test (id INT)'
  ],
  injection: [
    "SELECT * FROM patient WHERE patient_id = 1; DROP TABLE patient;",
    "SELECT * FROM patient WHERE uuid = '1' OR '1'='1",
    "SELECT * FROM patient UNION SELECT * FROM users",
    "SELECT * FROM patient /* malicious comment */ WHERE id = 1"
  ]
};
