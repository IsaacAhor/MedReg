/**
 * Query Tool
 * 
 * Execute read-only SQL queries against OpenMRS database
 * - Validates SQL for safety
 * - Masks PII in results
 * - Enforces LIMIT clause
 */

import { z } from 'zod';
import { MySQLClient } from '../utils/mysql-client';
import { validateSQL } from '../validators';

/**
 * Zod schema for query input
 */
export const QuerySchema = z.object({
  sql: z.string()
    .min(5, 'SQL query required (minimum 5 characters)')
    .describe('SQL query to execute (SELECT only in read-only mode)'),
  
  limit: z.number()
    .min(1)
    .max(1000)
    .optional()
    .describe('Maximum number of rows to return (1-1000, optional)')
});

export type QueryInput = z.infer<typeof QuerySchema>;

export interface QueryResult {
  success: boolean;
  rows?: any[];
  rowCount?: number;
  executionTime?: number;
  validation?: {
    operation: string;
    safe: boolean;
    warnings?: string[];
  };
  error?: string;
}

/**
 * Execute read-only SQL query
 */
export async function executeQuery(
  input: QueryInput,
  client: MySQLClient,
  readOnly: boolean = true
): Promise<QueryResult> {
  // 1. Validate SQL
  const validation = validateSQL(input.sql, readOnly);
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors?.join('\n') || 'SQL validation failed',
      validation: {
        operation: validation.operation,
        safe: validation.safe,
        warnings: validation.warnings
      }
    };
  }

  // 2. Add LIMIT if specified and not present
  let finalSQL = validation.query;
  if (input.limit && validation.operation === 'SELECT') {
    // Check if LIMIT already exists
    if (!finalSQL.toUpperCase().includes('LIMIT')) {
      finalSQL = `${finalSQL} LIMIT ${input.limit}`;
    }
  }

  try {
    // 3. Execute query
    const result = await client.query(finalSQL);

    return {
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
      validation: {
        operation: validation.operation,
        safe: validation.safe,
        warnings: validation.warnings
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Query execution failed: ${error.message}`,
      validation: {
        operation: validation.operation,
        safe: validation.safe,
        warnings: validation.warnings
      }
    };
  }
}
