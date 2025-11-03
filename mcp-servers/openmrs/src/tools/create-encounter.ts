/**
 * Create Encounter MCP Tool (basic)
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const CreateEncounterSchema = z.object({
  patientUuid: z.string().uuid(),
  encounterTypeUuid: z.string().uuid(),
  locationUuid: z.string().uuid(),
  encounterDatetime: z.string().optional().describe('ISO datetime; defaults to now'),
  providerUuid: z.string().uuid().optional(),
  encounterRoleUuid: z.string().uuid().optional(),
  obs: z
    .array(
      z.object({
        conceptUuid: z.string().uuid(),
        value: z.union([z.string(), z.number(), z.boolean(), z.object({ uuid: z.string().uuid() })]),
      })
    )
    .optional(),
});

export type CreateEncounterInput = z.infer<typeof CreateEncounterSchema>;

export interface CreateEncounterResult {
  success: boolean;
  encounter?: any;
  error?: string;
}

export async function createEncounter(
  input: CreateEncounterInput,
  client: OpenMRSClient
): Promise<CreateEncounterResult> {
  try {
    const payload: any = {
      encounterDatetime: input.encounterDatetime || new Date().toISOString(),
      patient: { uuid: input.patientUuid },
      encounterType: { uuid: input.encounterTypeUuid },
      location: { uuid: input.locationUuid },
    };

    if (input.providerUuid) {
      // Provider array; role optional. If not provided, leave role undefined.
      const providerEntry: any = { provider: { uuid: input.providerUuid } };
      if (input.encounterRoleUuid) providerEntry.encounterRole = { uuid: input.encounterRoleUuid };
      payload.providers = [providerEntry];
    }

    if (input.obs && input.obs.length) {
      payload.obs = input.obs.map((o) => ({ concept: { uuid: o.conceptUuid }, value: o.value }));
    }

    const encounter = await client.createEncounter(payload);
    return { success: true, encounter };
  } catch (error: any) {
    return { success: false, error: `Failed to create encounter: ${error.message}` };
  }
}

