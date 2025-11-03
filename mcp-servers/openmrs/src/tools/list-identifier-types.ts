/**
 * List Identifier Types MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const ListIdentifierTypesSchema = z.object({});

export type ListIdentifierTypesInput = z.infer<typeof ListIdentifierTypesSchema>;

export interface ListIdentifierTypesResult {
  success: boolean;
  items?: Array<{ uuid: string; name?: string; display?: string }>;
  count?: number;
  error?: string;
}

export async function listIdentifierTypes(
  _input: ListIdentifierTypesInput,
  client: OpenMRSClient
): Promise<ListIdentifierTypesResult> {
  try {
    const rows = await client.getIdentifierTypes();
    const items = rows.map((r: any) => ({ uuid: r.uuid, name: r.name, display: r.display }));
    return { success: true, items, count: items.length };
  } catch (error: any) {
    return { success: false, error: `Failed to list identifier types: ${error.message}` };
  }
}

