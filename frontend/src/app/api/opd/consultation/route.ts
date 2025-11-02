import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';
const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;
const OPENMRS_ROOT_URL = OPENMRS_BASE_URL.replace(/\/ws\/rest\/v1\/?$/, '');

const LOCATION_UUID = process.env.OPENMRS_LOCATION_UUID || 'aff27d58-a15c-49a6-9beb-d30dcfc0c66e';
const OPD_ENCOUNTER_TYPE_UUID = process.env.OPENMRS_OPD_ENCOUNTER_TYPE_UUID || '';
const NOTES_CONCEPT = process.env.OPENMRS_CONCEPT_CONSULTATION_NOTES_UUID;

export async function POST(request: NextRequest) {
  try {
    // Role check: doctor/admins
    const rolesRaw = cookies().get('omrsRole')?.value || '';
    const roles = rolesRaw.split(',').map(r => r.trim().toLowerCase());
    const isAdmin = roles.includes('admin') || roles.includes('platform admin') || roles.includes('facility admin');
    const allowed = isAdmin || roles.includes('doctor');
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { patientUuid, diagnoses, notes } = body || {} as { patientUuid: string, diagnoses: { code: string, display: string }[], notes?: string };
    if (!patientUuid) return NextResponse.json({ error: 'patientUuid is required' }, { status: 400 });
    if (!Array.isArray(diagnoses) || diagnoses.length === 0) return NextResponse.json({ error: 'At least one diagnosis is required' }, { status: 400 });
    if (!OPD_ENCOUNTER_TYPE_UUID) return NextResponse.json({ error: 'OPENMRS_OPD_ENCOUNTER_TYPE_UUID not configured' }, { status: 500 });

    const now = new Date().toISOString();
    // Ensure a visit exists if configured
    let visitUuid: string | undefined;
    const visitType = process.env.OPENMRS_OPD_VISIT_TYPE_UUID || '';
    if (visitType) {
      const vRes = await fetch(`${OPENMRS_BASE_URL}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ patient: patientUuid, visitType, startDatetime: now, location: LOCATION_UUID }),
      });
      if (vRes.ok) {
        const v = await vRes.json();
        visitUuid = v?.uuid;
      }
    }
    const obs: any[] = [];
    if (NOTES_CONCEPT && notes) {
      obs.push({ concept: NOTES_CONCEPT, value: notes });
    }
    // Persist diagnosis summary as a text note if no structured diagnosis concept configured
    if (NOTES_CONCEPT && diagnoses?.length) {
      const summary = diagnoses.map((d: any) => `${d.code} ${d.display}`).join('; ');
      obs.push({ concept: NOTES_CONCEPT, value: `Diagnoses: ${summary}` });
    }

    const payload: any = {
      patient: patientUuid,
      encounterType: OPD_ENCOUNTER_TYPE_UUID,
      encounterDatetime: now,
      location: LOCATION_UUID,
    };
    if (visitUuid) payload.visit = visitUuid;
    if (obs.length) payload.obs = obs;

    const res = await fetch(`${OPENMRS_BASE_URL}/encounter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: 'Failed to create encounter', details: t }, { status: 502 });
    }
    const data = await res.json();

    // Optional: Structured diagnosis as Conditions if enabled
    if ((process.env.OPENMRS_ENABLE_STRUCTURED_DIAGNOSIS || '').toLowerCase() === 'true') {
      const source = process.env.OPENMRS_DIAGNOSIS_CONCEPT_SOURCE || 'ICD-10';
      for (const d of diagnoses) {
        try {
          const conceptUuid = await resolveConceptByMapping(source, d.code);
          if (conceptUuid) {
            await fetch(`${OPENMRS_BASE_URL}/condition`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: authHeader },
              body: JSON.stringify({
                patient: patientUuid,
                concept: conceptUuid,
                clinicalStatus: 'active',
                verificationStatus: 'confirmed',
                onsetDateTime: new Date().toISOString(),
              }),
            });
          }
        } catch {}
      }
    }

    return NextResponse.json({ ok: true, encounterUuid: data?.uuid });
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error', details: e?.message }, { status: 500 });
  }
}

async function resolveConceptByMapping(source: string, code: string): Promise<string | null> {
  // Try concept search by mapping: /concept?code=SOURCE:CODE
  try {
    const res = await fetch(`${OPENMRS_BASE_URL}/concept?code=${encodeURIComponent(`${source}:${code}`)}`, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      const uuid = data?.results?.[0]?.uuid;
      if (uuid) return uuid;
    }
  } catch {}
  return null;
}
