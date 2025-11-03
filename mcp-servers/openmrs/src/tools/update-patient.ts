/**
 * Update Patient MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const UpdatePatientSchema = z.object({
  uuid: z.string().uuid(),
  payload: z.record(z.any()),
});

export type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>;

export interface UpdatePatientResult {
  success: boolean;
  patient?: any;
  error?: string;
}

export async function updatePatient(
  input: UpdatePatientInput,
  client: OpenMRSClient
): Promise<UpdatePatientResult> {
  try {
    const patient = await client.updatePatient(input.uuid, input.payload);
    return { success: true, patient };
  } catch (error: any) {
    return { success: false, error: `Failed to update patient: ${error.message}` };
  }
}

