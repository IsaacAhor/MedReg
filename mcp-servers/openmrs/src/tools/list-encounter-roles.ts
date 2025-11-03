/**
 * List Encounter Roles MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const ListEncounterRolesSchema = z.object({});

export type ListEncounterRolesInput = z.infer<typeof ListEncounterRolesSchema>;

export interface ListEncounterRolesResult {
  success: boolean;
  items?: Array<{ uuid: string; name: string; display?: string }>;
  count?: number;
  error?: string;
}

export async function listEncounterRoles(
  _input: ListEncounterRolesInput,
  client: OpenMRSClient
): Promise<ListEncounterRolesResult> {
  try {
    const items = await client.listEncounterRoles();
    return { success: true, items, count: items.length };
  } catch (error: any) {
    return { success: false, error: `Failed to list encounter roles: ${error.message}` };
  }
}

