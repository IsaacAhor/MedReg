/**
 * OpenMRS MCP Server
 * 
 * Model Context Protocol server for OpenMRS REST API operations
 * with Ghana-specific validation and PII masking
 * 
 * Tools provided:
 * - create_patient: Create new patient with Ghana Card validation
 * - search_patient: Search patients by Ghana Card, NHIS, folder number, or name
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';
import { createOpenMRSClient } from './utils/openmrs-client.js';
import {
  createPatient,
  CreatePatientSchema,
  searchPatient,
  SearchPatientSchema,
} from './tools/index.js';

// Load project context from AGENTS.md
function loadProjectContext(): string {
  try {
    const fs = require('fs');
    const path = require('path');
    const agentsPath = path.join(__dirname, '../../../../AGENTS.md');
    if (fs.existsSync(agentsPath)) {
      return fs.readFileSync(agentsPath, 'utf-8');
    }
  } catch (error) {
    console.warn('Could not load AGENTS.md');
  }
  return '';
}

// Load environment variables
config();

/**
 * MCP Tools definition
 */
const TOOLS: Tool[] = [
  {
    name: 'create_patient',
    description: `Create new patient in OpenMRS with Ghana-specific validation.

Validates:
- Ghana Card format (GHA-XXXXXXXXX-X) with Luhn checksum
- NHIS number (10 digits, optional)
- Auto-generates folder number ({REGION}-{FACILITY}-{YEAR}-{SEQUENCE})
- Checks for duplicate Ghana Card

Returns PII-masked patient data.`,
    inputSchema: {
      type: 'object',
      properties: {
        ghanaCard: {
          type: 'string',
          description: 'Ghana Card number (format: GHA-XXXXXXXXX-X)',
        },
        nhisNumber: {
          type: 'string',
          description: 'NHIS number (10 digits, optional)',
        },
        givenName: {
          type: 'string',
          description: 'Patient given name (first name)',
        },
        middleName: {
          type: 'string',
          description: 'Patient middle name (optional)',
        },
        familyName: {
          type: 'string',
          description: 'Patient family name (last name)',
        },
        gender: {
          type: 'string',
          enum: ['M', 'F', 'O'],
          description: 'Gender: M (male), F (female), O (other)',
        },
        dateOfBirth: {
          type: 'string',
          description: 'Date of birth (format: YYYY-MM-DD)',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        phone: {
          type: 'string',
          description: 'Phone number (format: +233XXXXXXXXX)',
        },
        address: {
          type: 'string',
          description: 'Home address (street address)',
        },
        city: {
          type: 'string',
          description: 'City',
        },
        region: {
          type: 'string',
          description: 'Ghana region (e.g., Greater Accra, Ashanti)',
        },
        facilityCode: {
          type: 'string',
          description: 'Facility code (default: KBTH)',
          default: 'KBTH',
        },
        regionCode: {
          type: 'string',
          description: 'Region code (default: GA for Greater Accra)',
          default: 'GA',
        },
      },
      required: ['ghanaCard', 'givenName', 'familyName', 'gender', 'dateOfBirth'],
    },
  },
  {
    name: 'search_patient',
    description: `Search patients by Ghana Card, NHIS number, folder number, or name.

Supports:
- Ghana Card: GHA-XXXXXXXXX-X
- NHIS number: 0123456789
- Folder number: GA-KBTH-2025-000123
- Name: Kwame Mensah (partial match supported)

Returns PII-masked patient list (max 100 results).`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (Ghana Card, NHIS, folder number, or name)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (1-100, default: 50)',
          minimum: 1,
          maximum: 100,
          default: 50,
        },
      },
      required: ['query'],
    },
  },
];

/**
 * Initialize MCP server
 */
async function main() {
  console.error('Starting OpenMRS MCP Server...');

  // Load project context (AGENTS.md + domain knowledge)
  const context = loadProjectContext();
  console.error(`Loaded project context from AGENTS.md (${context.length} chars)`);

  // Create OpenMRS client
  const openmrsClient = createOpenMRSClient();
  console.error(`OpenMRS client configured: ${process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1'}`);

  // Create MCP server
  const server = new Server(
    {
      name: 'openmrs-mcp-server',
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
      switch (name) {
        case 'create_patient': {
          const validated = CreatePatientSchema.parse(args);
          const result = await createPatient(validated, openmrsClient);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'search_patient': {
          const validated = SearchPatientSchema.parse(args);
          const result = await searchPatient(validated, openmrsClient);
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
      // Return error with PII masking
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

  console.error('OpenMRS MCP Server started successfully');
  console.error('Available tools:', TOOLS.map(t => t.name).join(', '));
}

// Run server
main().catch((error) => {
  console.error('Fatal error starting OpenMRS MCP Server:', error);
  process.exit(1);
});
