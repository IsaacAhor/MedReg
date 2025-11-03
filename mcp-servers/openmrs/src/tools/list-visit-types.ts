/**
 * List Visit Types MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const ListVisitTypesSchema = z.object({});

export type ListVisitTypesInput = z.infer<typeof ListVisitTypesSchema>;

export interface ListVisitTypesResult {
  success: boolean;
  items?: Array<{
    uuid: string;
    name: string;
    display?: string;
  }>;
  count?: number;
  error?: string;
}

export async function listVisitTypes(
  _input: ListVisitTypesInput,
  client: OpenMRSClient
): Promise<ListVisitTypesResult> {
  try {
    const items = await client.listVisitTypes();
    return { success: true, items, count: items.length };
  } catch (error: any) {
    return { success: false, error: `Failed to list visit types: ${error.message}` };
  }
}

