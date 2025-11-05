/**
 * OpenMRS Admin MCP Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';
import {
  RestartOpenMRSSchema,
  restartOpenMRS,
  WaitForStartupSchema,
  waitForStartup,
  TailLogsSchema,
  tailOpenMRSLogs,
  ClearModuleCacheSchema,
  clearModuleCache,
} from './tools/helpers.js';
import { DeployModuleAndRestartSchema, deployModuleAndRestart } from './tools/deploy_module_and_restart.js';
import { MySQLSelectSchema, mysqlSelect } from './tools/mysql_select.js';
import { verifyQueueSchema } from './tools/verify_queue_schema.js';
import { VerifyModuleLoadedSchema, verifyModuleLoaded } from './tools/verify_module_loaded.js';
import { EndToEndOpm001Schema, endToEndOpm001 } from './tools/end_to_end_opm001.js';

config();

const TOOLS: Tool[] = [
  {
    name: 'restart_openmrs',
    description: 'Restart OpenMRS container',
    inputSchema: {
      type: 'object',
      properties: { waitSeconds: { type: 'number', minimum: 0, maximum: 600, default: 150 } },
    } as any,
  },
  {
    name: 'wait_for_startup',
    description: 'Wait for OpenMRS to start by scanning logs',
    inputSchema: {
      type: 'object',
      properties: {
        timeoutSeconds: { type: 'number', minimum: 1, maximum: 600, default: 180 },
        match: { type: 'string', default: 'Started OpenMRS' },
      },
    } as any,
  },
  {
    name: 'tail_openmrs_logs',
    description: 'Tail OpenMRS logs with optional grep filter',
    inputSchema: {
      type: 'object',
      properties: {
        lines: { type: 'number', minimum: 1, maximum: 2000, default: 400 },
        grep: { type: 'string' },
        caseInsensitive: { type: 'boolean', default: true },
      },
    } as any,
  },
  {
    name: 'clear_module_cache',
    description: 'Clear .openmrs-lib-cache for a moduleId',
    inputSchema: {
      type: 'object',
      properties: { moduleId: { type: 'string' } },
      required: ['moduleId'],
    } as any,
  },
  {
    name: 'deploy_module_and_restart',
    description: 'Copy .omod, clear cache, restart container',
    inputSchema: {
      type: 'object',
      properties: {
        localPath: { type: 'string' },
        base64: { type: 'string' },
        filename: { type: 'string' },
        clearCache: { type: 'boolean', default: true },
        waitSeconds: { type: 'number', minimum: 0, maximum: 600, default: 150 },
      },
    } as any,
  },
  {
    name: 'mysql_select',
    description: 'Run read-only SQL against OpenMRS DB',
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', default: process.env.MYSQL_DB || 'openmrs' },
        sql: { type: 'string' },
      },
      required: ['sql'],
    } as any,
  },
  {
    name: 'verify_queue_schema',
    description: 'Verify ghanaemr_patient_queue schema, indexes, FKs, changelog',
    inputSchema: { type: 'object', properties: {} } as any,
  },
  {
    name: 'verify_module_loaded',
    description: 'Verify a module is loaded via REST',
    inputSchema: {
      type: 'object',
      properties: { moduleId: { type: 'string', default: 'ghanaemr' } },
    } as any,
  },
  {
    name: 'end_to_end_opm001',
    description: 'Deploy module, wait, verify module and queue schema',
    inputSchema: {
      type: 'object',
      properties: {
        localPath: { type: 'string' },
        base64: { type: 'string' },
        filename: { type: 'string' },
        clearCache: { type: 'boolean', default: true },
        waitSeconds: { type: 'number', minimum: 0, maximum: 600, default: 150 },
      },
    } as any,
  },
];

const server = new Server({ name: 'openmrs-admin', version: '0.1.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const name = req.params.name;
  const args = req.params.arguments || {};
  try {
    switch (name) {
      case 'restart_openmrs':
        return { content: [{ type: 'text', text: JSON.stringify(await restartOpenMRS(RestartOpenMRSSchema.parse(args))) }] };
      case 'wait_for_startup':
        return { content: [{ type: 'text', text: JSON.stringify(await waitForStartup(WaitForStartupSchema.parse(args))) }] };
      case 'tail_openmrs_logs':
        return { content: [{ type: 'text', text: await tailOpenMRSLogs(TailLogsSchema.parse(args)) }] };
      case 'clear_module_cache':
        return { content: [{ type: 'text', text: JSON.stringify(await clearModuleCache(ClearModuleCacheSchema.parse(args))) }] };
      case 'deploy_module_and_restart':
        return { content: [{ type: 'text', text: JSON.stringify(await deployModuleAndRestart(DeployModuleAndRestartSchema.parse(args))) }] };
      case 'mysql_select':
        return { content: [{ type: 'text', text: JSON.stringify(await mysqlSelect(MySQLSelectSchema.parse(args))) }] };
      case 'verify_queue_schema':
        return { content: [{ type: 'text', text: JSON.stringify(await verifyQueueSchema()) }] };
      case 'verify_module_loaded':
        return { content: [{ type: 'text', text: JSON.stringify(await verifyModuleLoaded(VerifyModuleLoadedSchema.parse(args))) }] };
      case 'end_to_end_opm001':
        return { content: [{ type: 'text', text: JSON.stringify(await endToEndOpm001(EndToEndOpm001Schema.parse(args))) }] };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err: any) {
    const text = typeof err?.message === 'string' ? err.message : 'Unknown error';
    return { isError: true, content: [{ type: 'text', text }] };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Fatal error starting openmrs-admin MCP:', err);
  process.exit(1);
});
