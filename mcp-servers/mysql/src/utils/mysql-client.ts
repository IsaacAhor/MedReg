/**
 * MySQL Database Client
 * 
 * Safe connection to OpenMRS MySQL database
 * - Connection pooling
 * - Automatic reconnection
 * - Query timeout protection
 * - PII masking in results
 */

import mysql from 'mysql2/promise';
import { maskPII } from '@medreg/mcp-shared';

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  connectTimeout?: number;
  queryTimeout?: number;
}

export interface QueryResult {
  rows: any[];
  fields: any[];
  rowCount: number;
  executionTime: number;
}

/**
 * MySQL client with connection pooling and safety features
 */
export class MySQLClient {
  private pool: mysql.Pool;
  private config: MySQLConfig;

  constructor(config: MySQLConfig) {
    this.config = config;

    // Create connection pool
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: config.connectionLimit || 5,
      connectTimeout: config.connectTimeout || 10000,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  /**
   * Execute SQL query with timeout and PII masking
   */
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      // Execute query with timeout
      const connection = await this.pool.getConnection();
      
      try {
        // Set query timeout
        const timeout = this.config.queryTimeout || 30000;
        await connection.query(`SET SESSION max_execution_time = ${timeout}`);

        // Execute query
        const [rows, fields] = await connection.query(sql, params);

        const executionTime = Date.now() - startTime;

        // Mask PII in results
        const maskedRows = Array.isArray(rows) 
          ? rows.map(row => maskPII(row))
          : [];

        return {
          rows: maskedRows,
          fields: Array.isArray(fields) ? fields : [],
          rowCount: Array.isArray(rows) ? rows.length : 0,
          executionTime
        };
      } finally {
        connection.release();
      }
    } catch (error: any) {
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  /**
   * Execute multiple queries in transaction
   */
  async transaction(queries: string[]): Promise<QueryResult[]> {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const results: QueryResult[] = [];
      for (const sql of queries) {
        const startTime = Date.now();
        const [rows, fields] = await connection.query(sql);
        const executionTime = Date.now() - startTime;

        results.push({
          rows: Array.isArray(rows) ? rows.map(row => maskPII(row)) : [],
          fields: Array.isArray(fields) ? fields : [],
          rowCount: Array.isArray(rows) ? rows.length : 0,
          executionTime
        });
      }

      await connection.commit();
      return results;
    } catch (error: any) {
      await connection.rollback();
      throw new Error(`Transaction failed: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Get table schema (columns, types, keys)
   */
  async getTableSchema(tableName: string): Promise<{
    columns: any[];
    primaryKeys: string[];
    foreignKeys: any[];
    indexes: any[];
  }> {
    // Validate table name (prevent SQL injection)
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error('Invalid table name');
    }

    // Get column information
    const columnsResult = await this.query(`
      SELECT 
        COLUMN_NAME as name,
        DATA_TYPE as type,
        IS_NULLABLE as nullable,
        COLUMN_DEFAULT as defaultValue,
        CHARACTER_MAXIMUM_LENGTH as maxLength,
        COLUMN_KEY as key,
        EXTRA as extra
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [this.config.database, tableName]);

    // Get primary keys
    const pkResult = await this.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        AND CONSTRAINT_NAME = 'PRIMARY'
    `, [this.config.database, tableName]);

    const primaryKeys = pkResult.rows.map(row => row.COLUMN_NAME);

    // Get foreign keys
    const fkResult = await this.query(`
      SELECT 
        COLUMN_NAME as columnName,
        REFERENCED_TABLE_NAME as referencedTable,
        REFERENCED_COLUMN_NAME as referencedColumn
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [this.config.database, tableName]);

    // Get indexes
    const indexResult = await this.query(`
      SELECT 
        INDEX_NAME as name,
        COLUMN_NAME as columnName,
        NON_UNIQUE as nonUnique,
        SEQ_IN_INDEX as sequence
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, [this.config.database, tableName]);

    return {
      columns: columnsResult.rows,
      primaryKeys,
      foreignKeys: fkResult.rows,
      indexes: indexResult.rows
    };
  }

  /**
   * List all tables in database
   */
  async listTables(): Promise<string[]> {
    const result = await this.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [this.config.database]);

    return result.rows.map(row => row.TABLE_NAME);
  }

  /**
   * Get table row count
   */
  async getTableRowCount(tableName: string): Promise<number> {
    // Validate table name
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error('Invalid table name');
    }

    const result = await this.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return result.rows[0]?.count || 0;
  }

  /**
   * Check database connection
   */
  async ping(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Create database backup (mysqldump)
   */
  async createBackup(backupPath: string): Promise<string> {
    // This would use child_process to run mysqldump
    // For security, this is intentionally not implemented here
    // Backups should be handled by external scripts
    throw new Error('Use backup script: npm run backup');
  }
}

/**
 * Create MySQL client from environment variables
 */
export function createMySQLClient(): MySQLClient {
  const config: MySQLConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3307'),
    user: process.env.MYSQL_USER || 'openmrs_user',
    password: process.env.MYSQL_PASSWORD || 'openmrs_password',
    database: process.env.MYSQL_DATABASE || 'openmrs',
    connectionLimit: 5,
    connectTimeout: 10000,
    queryTimeout: 30000,
  };

  return new MySQLClient(config);
}
