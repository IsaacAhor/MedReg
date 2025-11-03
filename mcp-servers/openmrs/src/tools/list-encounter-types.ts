/**
 * List Encounter Types MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const ListEncounterTypesSchema = z.object({});

export type ListEncounterTypesInput = z.infer<typeof ListEncounterTypesSchema>;

export interface ListEncounterTypesResult {
  success: boolean;
  items?: Array<{
    uuid: string;
    name: string;
    display?: string;
  }>;
  count?: number;
  error?: string;
}

export async function listEncounterTypes(
  _input: ListEncounterTypesInput,
  client: OpenMRSClient
): Promise<ListEncounterTypesResult> {
  try {
    const items = await client.listEncounterTypes();
    return { success: true, items, count: items.length };
  } catch (error: any) {
    return { success: false, error: `Failed to list encounter types: ${error.message}` };
  }
}

