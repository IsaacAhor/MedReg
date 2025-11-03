/**
 * List Locations MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const ListLocationsSchema = z.object({});

export type ListLocationsInput = z.infer<typeof ListLocationsSchema>;

export interface ListLocationsResult {
  success: boolean;
  items?: Array<{ uuid: string; name: string; display?: string }>;
  count?: number;
  error?: string;
}

export async function listLocations(
  _input: ListLocationsInput,
  client: OpenMRSClient
): Promise<ListLocationsResult> {
  try {
    const items = await client.listLocations();
    return { success: true, items, count: items.length };
  } catch (error: any) {
    return { success: false, error: `Failed to list locations: ${error.message}` };
  }
}

