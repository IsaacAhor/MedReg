/**
 * MySQL MCP Server
 * 
 * Model Context Protocol server for safe MySQL database operations
 * 
 * Tools provided:
 * - query: Execute read-only SQL queries (SELECT, SHOW, DESCRIBE)
 * - read_schema: Get table structure (columns, types, keys, indexes)
 * - list_tables: List all tables in database
 * - propose_migration: Propose database migration (DDL/DML with approval workflow)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';
import { createMySQLClient } from './utils/mysql-client.js';
import {
  executeQuery,
  QuerySchema,
  readSchema,
  ReadSchemaSchema,
  listTables,
  proposeMigration,
  ProposeMigrationSchema,
} from './tools/index.js';

// Load environment variables
config();

// Track DB readiness so the server can start even if DB is down.
let dbReady = true;

/**
 * MCP Tools definition
 */
const TOOLS: Tool[] = [
  {
    name: 'query',
    description: `Execute read-only SQL query against OpenMRS database.

Allowed operations: SELECT, SHOW, DESCRIBE, EXPLAIN
Blocked operations: INSERT, UPDATE, DELETE, DROP, TRUNCATE, ALTER

Returns PII-masked results. Use for:
- Inspecting patient data
- Analyzing database content
- Debugging OpenMRS configuration

Example:
SELECT * FROM patient WHERE patient_id = 1 LIMIT 10;`,
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'SQL query to execute (SELECT only in read-only mode)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of rows to return (1-1000, optional)',
          minimum: 1,
          maximum: 1000,
        },
      },
      required: ['sql'],
    },
  },
  {
    name: 'read_schema',
    description: `Get table structure (columns, types, keys, indexes).

Returns:
- Column names, types, nullable status
- Primary keys
- Foreign keys
- Indexes

Use before writing queries to understand table structure.

Example:
read_schema({ table: 'patient' })`,
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Name of the table to inspect',
          pattern: '^[a-zA-Z0-9_]+$',
        },
        includeRowCount: {
          type: 'boolean',
          description: 'Include row count (may be slow for large tables)',
          default: false,
        },
      },
      required: ['table'],
    },
  },
  {
    name: 'list_tables',
    description: `List all tables in the OpenMRS database.

Returns array of table names sorted alphabetically.

Use to explore database structure before querying.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'propose_migration',
    description: `Propose database migration (DDL/DML operations).

Creates GitHub issue for human approval before applying.

Workflow:
1. AI proposes migration with SQL
2. Tool validates and analyzes impact
3. Creates GitHub issue
4. Human reviews and approves
5. AI applies using apply_migration tool (not yet implemented)

Use for:
- Creating tables (CREATE TABLE)
- Altering schema (ALTER TABLE)
- Adding indexes (CREATE INDEX)
- Data migrations (INSERT, UPDATE)

Example:
propose_migration({
  name: 'add_nhie_transaction_log',
  description: 'Create table to track NHIE API calls for retry logic',
  sql: 'CREATE TABLE nhie_transaction_log (...)',
  rollbackSQL: 'DROP TABLE nhie_transaction_log'
})`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Migration name in snake_case (e.g., add_nhie_transaction_log)',
          pattern: '^[a-z0-9_]+$',
        },
        description: {
          type: 'string',
          description: 'Clear description of what this migration does and why',
        },
        sql: {
          type: 'string',
          description: 'SQL statements to execute (CREATE, ALTER, INSERT, etc.)',
        },
        rollbackSQL: {
          type: 'string',
          description: 'SQL to rollback this migration (optional but recommended)',
        },
      },
      required: ['name', 'description', 'sql'],
    },
  },
];

/**
 * Initialize MCP server
 */
async function main() {
  console.error('Starting MySQL MCP Server...');

  // Check if read-only mode
  const readOnly = process.env.MYSQL_READ_ONLY !== 'false';
  console.error(`Mode: ${readOnly ? 'READ-ONLY' : 'READ-WRITE'}`);

  // Create MySQL client
  const mysqlClient = createMySQLClient();
  console.error(`MySQL client configured: ${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || '3307'}`);

  // Test connection (do not exit if unavailable; allow MCP handshake)
  try {
    const connected = await mysqlClient.ping();
    if (!connected) {
      dbReady = false;
      console.error('MySQL connection test returned false. Starting MCP server without DB.');
    } else {
      console.error('MySQL connection successful');
    }
  } catch (error: any) {
    dbReady = false;
    console.error(`MySQL connection failed: ${error.message}`);
    console.error('Starting MCP server without DB; tools will report a clear error until MySQL is reachable.');
  }

  // Create MCP server
  const server = new Server(
    {
      name: 'mysql-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // For DB-dependent tools, verify connectivity lazily
      const requiresDb = name === 'query' || name === 'read_schema' || name === 'list_tables';
      if (requiresDb) {
        // If previously not ready, retry ping to see if DB came up
        if (!dbReady) {
          dbReady = await mysqlClient.ping();
        }
        if (!dbReady) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'MySQL is not reachable. Ensure the OpenMRS MySQL (5.7) container is running and accessible.',
                  hint: 'Start DB: docker-compose up -d mysql; Verify: mysql -h 127.0.0.1 -P 3307 -u openmrs_user -popenmrs_password -e "SELECT 1" openmrs',
                  target: `${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || '3307'}`,
                  code: 'DB_UNAVAILABLE'
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }
      switch (name) {
        case 'query': {
          const validated = QuerySchema.parse(args);
          const result = await executeQuery(validated, mysqlClient, readOnly);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'read_schema': {
          const validated = ReadSchemaSchema.parse(args);
          const result = await readSchema(validated, mysqlClient);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'list_tables': {
          const result = await listTables(mysqlClient);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'propose_migration': {
          const validated = ProposeMigrationSchema.parse(args);
          const result = await proposeMigration(validated);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      // Return error (no PII in database errors typically)
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              code: error.code || 'TOOL_ERROR',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MySQL MCP Server started successfully');
  console.error('Available tools:', TOOLS.map(t => t.name).join(', '));
  console.error(`Read-only mode: ${readOnly}`);
}

// Run server
main().catch((error) => {
  console.error('Fatal error starting MySQL MCP Server:', error);
  process.exit(1);
});
