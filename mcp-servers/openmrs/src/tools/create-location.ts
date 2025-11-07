/**
 * Create Location MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const CreateLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  description: z.string().optional(),
  parentUuid: z.string().uuid().optional(),
});

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>;

export interface CreateLocationResult {
  success: boolean;
  uuid?: string;
  created?: boolean;
  error?: string;
}

export async function createLocation(
  input: CreateLocationInput,
  client: OpenMRSClient
): Promise<CreateLocationResult> {
  try {
    // Idempotency: if location with same name exists, return it
    const locations = await client.listLocations();
    const existing = locations.find(
      (l) => l.name?.toLowerCase() === input.name.toLowerCase()
    );
    if (existing) {
      return { success: true, uuid: existing.uuid, created: false };
    }

    const payload: any = {
      name: input.name,
    };
    if (input.description) payload.description = input.description;
    if (input.parentUuid) payload.parentLocation = input.parentUuid;

    const created = await client.post('/location', payload);
    return { success: true, uuid: created?.uuid, created: true };
  } catch (error: any) {
    return { success: false, error: `Failed to create location: ${error.message}` };
  }
}

// Convenience: ensure Triage, Consultation, Pharmacy exist and return their UUIDs
export const EnsureStandardLocationsSchema = z.object({
  triageName: z.string().default('Triage'),
  consultationName: z.string().default('Consultation'),
  pharmacyName: z.string().default('Pharmacy'),
});

export type EnsureStandardLocationsInput = z.infer<typeof EnsureStandardLocationsSchema>;

export interface EnsureStandardLocationsResult {
  success: boolean;
  triageUuid?: string;
  consultationUuid?: string;
  pharmacyUuid?: string;
  created?: Array<{ name: string; uuid: string }>;
  error?: string;
}

export async function ensureStandardLocations(
  input: EnsureStandardLocationsInput,
  client: OpenMRSClient
): Promise<EnsureStandardLocationsResult> {
  try {
    const ensureOne = async (name: string) => {
      const res = await createLocation({ name }, client);
      if (!res.success || !res.uuid) throw new Error(res.error || `Unable to ensure location ${name}`);
      return res.uuid;
    };

    const triageUuid = await ensureOne(input.triageName);
    const consultationUuid = await ensureOne(input.consultationName);
    const pharmacyUuid = await ensureOne(input.pharmacyName);

    return {
      success: true,
      triageUuid,
      consultationUuid,
      pharmacyUuid,
    };
  } catch (error: any) {
    return { success: false, error: `Failed to ensure standard locations: ${error.message}` };
  }
}

