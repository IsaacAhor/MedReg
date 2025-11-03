/**
 * Find Active Visit MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const FindActiveVisitSchema = z.object({
  patientUuid: z.string().uuid(),
});

export type FindActiveVisitInput = z.infer<typeof FindActiveVisitSchema>;

export interface FindActiveVisitResult {
  success: boolean;
  visit?: any | null;
  error?: string;
}

export async function findActiveVisit(
  input: FindActiveVisitInput,
  client: OpenMRSClient
): Promise<FindActiveVisitResult> {
  try {
    const visit = await client.findActiveVisit(input.patientUuid);
    return { success: true, visit };
  } catch (error: any) {
    return { success: false, error: `Failed to find active visit: ${error.message}` };
  }
}

