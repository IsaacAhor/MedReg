/**
 * List Concepts MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const ListConceptsSchema = z.object({
  query: z.string().min(1).describe('Name/code search term'),
});

export type ListConceptsInput = z.infer<typeof ListConceptsSchema>;

export interface ListConceptsResult {
  success: boolean;
  items?: Array<{ uuid: string; display: string; datatype?: string; conceptClass?: string }>;
  count?: number;
  error?: string;
}

export async function listConcepts(
  input: ListConceptsInput,
  client: OpenMRSClient
): Promise<ListConceptsResult> {
  try {
    const items = await client.listConcepts(input.query);
    return { success: true, items, count: items.length };
  } catch (error: any) {
    return { success: false, error: `Failed to list concepts: ${error.message}` };
  }
}

