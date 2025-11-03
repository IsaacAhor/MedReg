/**
 * Get Patient MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const GetPatientSchema = z.object({
  uuid: z.string().uuid(),
});

export type GetPatientInput = z.infer<typeof GetPatientSchema>;

export interface GetPatientResult {
  success: boolean;
  patient?: any;
  error?: string;
}

export async function getPatient(
  input: GetPatientInput,
  client: OpenMRSClient
): Promise<GetPatientResult> {
  try {
    const patient = await client.getPatient(input.uuid);
    return { success: true, patient };
  } catch (error: any) {
    return { success: false, error: `Failed to get patient: ${error.message}` };
  }
}

