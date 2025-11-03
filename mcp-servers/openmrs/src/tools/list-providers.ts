/**
 * List Providers MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const ListProvidersSchema = z.object({});

export type ListProvidersInput = z.infer<typeof ListProvidersSchema>;

export interface ListProvidersResult {
  success: boolean;
  items?: Array<{ uuid: string; identifier?: string; display?: string }>;
  count?: number;
  error?: string;
}

export async function listProviders(
  _input: ListProvidersInput,
  client: OpenMRSClient
): Promise<ListProvidersResult> {
  try {
    const items = await client.listProviders();
    return { success: true, items, count: items.length };
  } catch (error: any) {
    return { success: false, error: `Failed to list providers: ${error.message}` };
  }
}

