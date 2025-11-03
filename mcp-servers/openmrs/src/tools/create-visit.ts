/**
 * Create Visit MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const CreateVisitSchema = z.object({
  patientUuid: z.string().uuid(),
  visitTypeUuid: z.string().uuid(),
  locationUuid: z.string().uuid(),
  startDatetime: z.string().optional(),
});

export type CreateVisitInput = z.infer<typeof CreateVisitSchema>;

export interface CreateVisitResult {
  success: boolean;
  visit?: any;
  error?: string;
}

export async function createVisit(
  input: CreateVisitInput,
  client: OpenMRSClient
): Promise<CreateVisitResult> {
  try {
    const visit = await client.createVisit(input.patientUuid, input.visitTypeUuid, input.locationUuid, input.startDatetime);
    return { success: true, visit };
  } catch (error: any) {
    return { success: false, error: `Failed to create visit: ${error.message}` };
  }
}

