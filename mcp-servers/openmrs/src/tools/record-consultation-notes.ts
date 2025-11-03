/**
 * Record Consultation Notes (Opinionated) MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const RecordConsultationNotesSchema = z.object({
  patientUuid: z.string().uuid(),
  notes: z.string().min(1),
  locationUuid: z.string().uuid().optional(),
  encounterTypeUuid: z.string().uuid().optional(),
  visitTypeUuid: z.string().uuid().optional(),
});

export type RecordConsultationNotesInput = z.infer<typeof RecordConsultationNotesSchema>;

export interface RecordConsultationNotesResult {
  success: boolean;
  visitUuid?: string;
  encounterUuid?: string;
  error?: string;
}

function env(key: string, fallback?: string): string | undefined {
  return process.env[key] || fallback;
}

export async function recordConsultationNotes(
  input: RecordConsultationNotesInput,
  client: OpenMRSClient
): Promise<RecordConsultationNotesResult> {
  try {
    const locationUuid = input.locationUuid || env('OPENMRS_LOCATION_UUID');
    const encounterTypeUuid = input.encounterTypeUuid || env('OPENMRS_OPD_ENCOUNTER_TYPE_UUID');
    const visitTypeUuid = input.visitTypeUuid || env('OPENMRS_OPD_VISIT_TYPE_UUID');
    const notesConceptUuid = env('OPENMRS_CONCEPT_CONSULTATION_NOTES_UUID');

    if (!locationUuid || !encounterTypeUuid || !visitTypeUuid || !notesConceptUuid) {
      throw new Error('Missing config: location, encounter type, visit type, or notes concept UUID');
    }

    // Ensure active visit
    let visit = await client.findActiveVisit(input.patientUuid);
    if (!visit) {
      visit = await client.createVisit(input.patientUuid, visitTypeUuid, locationUuid);
    }

    const obs = [
      { concept: { uuid: notesConceptUuid }, value: input.notes },
    ];

    const encounterPayload: any = {
      encounterDatetime: new Date().toISOString(),
      patient: { uuid: input.patientUuid },
      encounterType: { uuid: encounterTypeUuid },
      location: { uuid: locationUuid },
      visit: { uuid: visit.uuid },
      obs,
    };

    const encounter = await client.createEncounter(encounterPayload);
    return { success: true, visitUuid: visit.uuid, encounterUuid: encounter.uuid };
  } catch (error: any) {
    return { success: false, error: `Failed to record consultation notes: ${error.message}` };
  }
}

