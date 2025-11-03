import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';
const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;

const LOCATION_UUID = process.env.OPENMRS_LOCATION_UUID || 'aff27d58-a15c-49a6-9beb-d30dcfc0c66e';
const OPD_ENCOUNTER_TYPE_UUID = process.env.OPENMRS_OPD_ENCOUNTER_TYPE_UUID || '';

const C = {
  TEMP: process.env.OPENMRS_CONCEPT_TEMP_UUID,
  WEIGHT: process.env.OPENMRS_CONCEPT_WEIGHT_UUID,
  HEIGHT: process.env.OPENMRS_CONCEPT_HEIGHT_UUID,
  PULSE: process.env.OPENMRS_CONCEPT_PULSE_UUID,
  SBP: process.env.OPENMRS_CONCEPT_SYSTOLIC_BP_UUID,
  DBP: process.env.OPENMRS_CONCEPT_DIASTOLIC_BP_UUID,
};

export async function POST(request: NextRequest) {
  try {
    // Role check: nurse/records officer/admins
    const rolesRaw = cookies().get('omrsRole')?.value || '';
    const roles = rolesRaw.split(',').map(r => r.trim().toLowerCase());
    const isAdmin = roles.includes('admin') || roles.includes('platform admin') || roles.includes('facility admin');
    const allowed = isAdmin || roles.includes('nurse') || roles.includes('records officer');
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { patientUuid, temperature, weight, height, pulse, systolic, diastolic } = body || {};
    if (!patientUuid) {
      return NextResponse.json({ error: 'patientUuid is required' }, { status: 400 });
    }
    if (!OPD_ENCOUNTER_TYPE_UUID) {
      return NextResponse.json({ error: 'OPENMRS_OPD_ENCOUNTER_TYPE_UUID not configured' }, { status: 500 });
    }

    const now = new Date().toISOString();
    // Ensure a visit exists (create a new one if configured)
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
    const pushObs = (concept: string | undefined, value: any) => {
      if (!concept) return; // skip if concept not configured
      if (value === undefined || value === null || value === '') return;
      obs.push({ concept, value });
    };
    pushObs(C.TEMP, temperature);
    pushObs(C.WEIGHT, weight);
    pushObs(C.HEIGHT, height);
    pushObs(C.PULSE, pulse);
    // Represent BP as two separate obs if concept UUIDs provided
    pushObs(C.SBP, systolic);
    pushObs(C.DBP, diastolic);

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
    return NextResponse.json({ ok: true, encounterUuid: data?.uuid });
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error', details: e?.message }, { status: 500 });
  }
}
