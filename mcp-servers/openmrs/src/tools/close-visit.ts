/**
 * Close Visit MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const CloseVisitSchema = z.object({
  visitUuid: z.string().uuid(),
  stopDatetime: z.string().optional(),
});

export type CloseVisitInput = z.infer<typeof CloseVisitSchema>;

export interface CloseVisitResult {
  success: boolean;
  visit?: any;
  error?: string;
}

export async function closeVisit(
  input: CloseVisitInput,
  client: OpenMRSClient
): Promise<CloseVisitResult> {
  try {
    const visit = await client.closeVisit(input.visitUuid, input.stopDatetime);
    return { success: true, visit };
  } catch (error: any) {
    return { success: false, error: `Failed to close visit: ${error.message}` };
  }
}

