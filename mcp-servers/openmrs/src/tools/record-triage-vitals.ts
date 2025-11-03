/**
 * Record Triage Vitals (Opinionated) MCP Tool
 * - Ensures active visit (creates if missing)
 * - Creates an encounter with standard vitals obs
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const RecordTriageVitalsSchema = z.object({
  patientUuid: z.string().uuid(),
  locationUuid: z.string().uuid().optional(),
  encounterTypeUuid: z.string().uuid().optional(),
  visitTypeUuid: z.string().uuid().optional(),
  vitals: z.object({
    temp: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    pulse: z.number().optional(),
    systolic: z.number().optional(),
    diastolic: z.number().optional(),
  }),
});

export type RecordTriageVitalsInput = z.infer<typeof RecordTriageVitalsSchema>;

export interface RecordTriageVitalsResult {
  success: boolean;
  visitUuid?: string;
  encounterUuid?: string;
  error?: string;
}

function env(key: string, fallback?: string): string | undefined {
  return process.env[key] || fallback;
}

export async function recordTriageVitals(
  input: RecordTriageVitalsInput,
  client: OpenMRSClient
): Promise<RecordTriageVitalsResult> {
  try {
    const locationUuid = input.locationUuid || env('OPENMRS_LOCATION_UUID');
    const encounterTypeUuid = input.encounterTypeUuid || env('OPENMRS_OPD_ENCOUNTER_TYPE_UUID');
    const visitTypeUuid = input.visitTypeUuid || env('OPENMRS_OPD_VISIT_TYPE_UUID');

    if (!locationUuid || !encounterTypeUuid || !visitTypeUuid) {
      throw new Error('Missing config: location, encounter type, or visit type UUID');
    }

    // Ensure active visit
    let visit = await client.findActiveVisit(input.patientUuid);
    if (!visit) {
      visit = await client.createVisit(input.patientUuid, visitTypeUuid, locationUuid);
    }

    const obs: any[] = [];
    const addObs = (conceptEnvKey: string, value: any) => {
      if (value === undefined || value === null) return;
      const conceptUuid = env(conceptEnvKey);
      if (!conceptUuid) return; // skip if concept not configured
      obs.push({ concept: { uuid: conceptUuid }, value });
    };

    addObs('OPENMRS_CONCEPT_TEMP_UUID', input.vitals.temp);
    addObs('OPENMRS_CONCEPT_WEIGHT_UUID', input.vitals.weight);
    addObs('OPENMRS_CONCEPT_HEIGHT_UUID', input.vitals.height);
    addObs('OPENMRS_CONCEPT_PULSE_UUID', input.vitals.pulse);
    addObs('OPENMRS_CONCEPT_SYSTOLIC_BP_UUID', input.vitals.systolic);
    addObs('OPENMRS_CONCEPT_DIASTOLIC_BP_UUID', input.vitals.diastolic);

    const encounterPayload: any = {
      encounterDatetime: new Date().toISOString(),
      patient: { uuid: input.patientUuid },
      encounterType: { uuid: encounterTypeUuid },
      location: { uuid: locationUuid },
      visit: { uuid: visit.uuid },
      ...(obs.length ? { obs } : {}),
    };

    const encounter = await client.createEncounter(encounterPayload);
    return { success: true, visitUuid: visit.uuid, encounterUuid: encounter.uuid };
  } catch (error: any) {
    return { success: false, error: `Failed to record triage vitals: ${error.message}` };
  }
}

