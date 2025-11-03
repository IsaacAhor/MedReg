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
  listEncounterTypes,
  ListEncounterTypesSchema,
  listVisitTypes,
  ListVisitTypesSchema,
  updateEnv,
  UpdateEnvSchema,
  listLocations,
  ListLocationsSchema,
  listProviders,
  ListProvidersSchema,
  listConcepts,
  ListConceptsSchema,
  listIdentifierTypes,
  ListIdentifierTypesSchema,
  listPersonAttributeTypes,
  ListPersonAttributeTypesSchema,
  listEncounterRoles,
  ListEncounterRolesSchema,
  createEncounter,
  CreateEncounterSchema,
  findActiveVisit,
  FindActiveVisitSchema,
  createVisit,
  CreateVisitSchema,
  closeVisit,
  CloseVisitSchema,
  getPatient,
  GetPatientSchema,
  updatePatient,
  UpdatePatientSchema,
  verifySession,
  VerifySessionSchema,
  recordTriageVitals,
  RecordTriageVitalsSchema,
  recordConsultationNotes,
  RecordConsultationNotesSchema,
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
  {
    name: 'list_encounter_types',
    description: 'List OpenMRS encounter types (uuid, name, display).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_visit_types',
    description: 'List OpenMRS visit types (uuid, name, display).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'update_env',
    description: 'Update frontend .env.local with provided keys (safe, line-based).',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Path to env file' },
        updates: { type: 'object', description: 'Key-value pairs to set' },
        create: { type: 'boolean', description: 'Create file if missing' },
      },
      required: ['updates'],
    },
  },
  { name: 'list_locations', description: 'List OpenMRS locations (uuid, name, display).', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_providers', description: 'List OpenMRS providers.', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_concepts', description: 'Search concepts by name/code.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'list_identifier_types', description: 'List patient identifier types.', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_person_attribute_types', description: 'List person attribute types.', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_encounter_roles', description: 'List encounter roles.', inputSchema: { type: 'object', properties: {} } },
  { name: 'create_encounter', description: 'Create encounter with optional providers and obs.', inputSchema: {
      type: 'object',
      properties: {
        patientUuid: { type: 'string' },
        encounterTypeUuid: { type: 'string' },
        locationUuid: { type: 'string' },
        encounterDatetime: { type: 'string' },
        providerUuid: { type: 'string' },
        encounterRoleUuid: { type: 'string' },
        obs: { type: 'array' },
      },
      required: ['patientUuid', 'encounterTypeUuid', 'locationUuid']
    }
  },
  { name: 'find_active_visit', description: 'Find active visit for a patient.', inputSchema: { type: 'object', properties: { patientUuid: { type: 'string' } }, required: ['patientUuid'] } },
  { name: 'create_visit', description: 'Create a visit for a patient.', inputSchema: { type: 'object', properties: { patientUuid: { type: 'string' }, visitTypeUuid: { type: 'string' }, locationUuid: { type: 'string' }, startDatetime: { type: 'string' } }, required: ['patientUuid','visitTypeUuid','locationUuid'] } },
  { name: 'close_visit', description: 'Close a visit by UUID.', inputSchema: { type: 'object', properties: { visitUuid: { type: 'string' }, stopDatetime: { type: 'string' } }, required: ['visitUuid'] } },
  { name: 'get_patient', description: 'Get patient by UUID (v=full).', inputSchema: { type: 'object', properties: { uuid: { type: 'string' } }, required: ['uuid'] } },
  { name: 'update_patient', description: 'Update patient by UUID.', inputSchema: { type: 'object', properties: { uuid: { type: 'string' }, payload: { type: 'object' } }, required: ['uuid','payload'] } },
  { name: 'verify_session', description: 'Verify OpenMRS session and auth user.', inputSchema: { type: 'object', properties: {} } },
  { name: 'record_triage_vitals', description: 'Opinionated: ensure visit and record vitals obs.', inputSchema: { type: 'object', properties: { patientUuid: { type: 'string' }, locationUuid: { type: 'string' }, encounterTypeUuid: { type: 'string' }, visitTypeUuid: { type: 'string' }, vitals: { type: 'object' } } } },
  { name: 'record_consultation_notes', description: 'Opinionated: ensure visit and record consultation note.', inputSchema: { type: 'object', properties: { patientUuid: { type: 'string' }, notes: { type: 'string' }, locationUuid: { type: 'string' }, encounterTypeUuid: { type: 'string' }, visitTypeUuid: { type: 'string' } }, required: ['patientUuid','notes'] } },
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

        case 'list_encounter_types': {
          const validated = ListEncounterTypesSchema.parse(args || {});
          const result = await listEncounterTypes(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'list_visit_types': {
          const validated = ListVisitTypesSchema.parse(args || {});
          const result = await listVisitTypes(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'update_env': {
          const validated = UpdateEnvSchema.parse(args);
          const result = await updateEnv(validated);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'list_locations': {
          const validated = ListLocationsSchema.parse(args || {});
          const result = await listLocations(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'list_providers': {
          const validated = ListProvidersSchema.parse(args || {});
          const result = await listProviders(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'list_concepts': {
          const validated = ListConceptsSchema.parse(args);
          const result = await listConcepts(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'list_identifier_types': {
          const validated = ListIdentifierTypesSchema.parse(args || {});
          const result = await listIdentifierTypes(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'list_person_attribute_types': {
          const validated = ListPersonAttributeTypesSchema.parse(args || {});
          const result = await listPersonAttributeTypes(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'list_encounter_roles': {
          const validated = ListEncounterRolesSchema.parse(args || {});
          const result = await listEncounterRoles(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'create_encounter': {
          const validated = CreateEncounterSchema.parse(args);
          const result = await createEncounter(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'find_active_visit': {
          const validated = FindActiveVisitSchema.parse(args);
          const result = await findActiveVisit(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'create_visit': {
          const validated = CreateVisitSchema.parse(args);
          const result = await createVisit(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'close_visit': {
          const validated = CloseVisitSchema.parse(args);
          const result = await closeVisit(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'get_patient': {
          const validated = GetPatientSchema.parse(args);
          const result = await getPatient(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'update_patient': {
          const validated = UpdatePatientSchema.parse(args);
          const result = await updatePatient(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'verify_session': {
          const validated = VerifySessionSchema.parse(args || {});
          const result = await verifySession(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'record_triage_vitals': {
          const validated = RecordTriageVitalsSchema.parse(args);
          const result = await recordTriageVitals(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'record_consultation_notes': {
          const validated = RecordConsultationNotesSchema.parse(args);
          const result = await recordConsultationNotes(validated, openmrsClient);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
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
