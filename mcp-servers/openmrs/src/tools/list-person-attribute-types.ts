/**
 * List Person Attribute Types MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const ListPersonAttributeTypesSchema = z.object({});

export type ListPersonAttributeTypesInput = z.infer<typeof ListPersonAttributeTypesSchema>;

export interface ListPersonAttributeTypesResult {
  success: boolean;
  items?: Array<{ uuid: string; name?: string; display?: string }>;
  count?: number;
  error?: string;
}

export async function listPersonAttributeTypes(
  _input: ListPersonAttributeTypesInput,
  client: OpenMRSClient
): Promise<ListPersonAttributeTypesResult> {
  try {
    const rows = await client.getPersonAttributeTypes();
    const items = rows.map((r: any) => ({ uuid: r.uuid, name: r.name, display: r.display }));
    return { success: true, items, count: items.length };
  } catch (error: any) {
    return { success: false, error: `Failed to list person attribute types: ${error.message}` };
  }
}

