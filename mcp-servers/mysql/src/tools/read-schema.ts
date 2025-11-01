/**
 * Read Schema Tool
 * 
 * Get table structure (columns, types, keys, indexes)
 * Helps AI understand database schema before writing queries
 */

import { z } from 'zod';
import { MySQLClient } from '../utils/mysql-client';

/**
 * Zod schema for read_schema input
 */
export const ReadSchemaSchema = z.object({
  table: z.string()
    .min(1, 'Table name required')
    .regex(/^[a-zA-Z0-9_]+$/, 'Table name must contain only letters, numbers, underscores')
    .describe('Name of the table to inspect'),
  
  includeRowCount: z.boolean()
    .optional()
    .default(false)
    .describe('Include row count (may be slow for large tables)')
});

export type ReadSchemaInput = z.infer<typeof ReadSchemaSchema>;

export interface SchemaResult {
  success: boolean;
  table?: string;
  schema?: {
    columns: Array<{
      name: string;
      type: string;
      nullable: string;
      defaultValue?: string;
      key?: string;
      extra?: string;
    }>;
    primaryKeys: string[];
    foreignKeys: Array<{
      columnName: string;
      referencedTable: string;
      referencedColumn: string;
    }>;
    indexes: Array<{
      name: string;
      columnName: string;
      nonUnique: number;
    }>;
    rowCount?: number;
  };
  error?: string;
}

/**
 * Read table schema
 */
export async function readSchema(
  input: ReadSchemaInput,
  client: MySQLClient
): Promise<SchemaResult> {
  try {
    // Get table schema
    const schema = await client.getTableSchema(input.table);

    // Get row count if requested
    let rowCount: number | undefined;
    if (input.includeRowCount) {
      rowCount = await client.getTableRowCount(input.table);
    }

    return {
      success: true,
      table: input.table,
      schema: {
        columns: schema.columns,
        primaryKeys: schema.primaryKeys,
        foreignKeys: schema.foreignKeys,
        indexes: schema.indexes,
        rowCount
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to read schema: ${error.message}`
    };
  }
}

/**
 * List all tables in database
 */
export async function listTables(client: MySQLClient): Promise<{
  success: boolean;
  tables?: string[];
  count?: number;
  error?: string;
}> {
  try {
    const tables = await client.listTables();
    return {
      success: true,
      tables,
      count: tables.length
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to list tables: ${error.message}`
    };
  }
}
