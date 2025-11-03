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
    const {
      patientUuid,
      chiefComplaint,
      diagnoses,
      prescriptions,
      labs,
      notes,
      locationUuid,
      providerUuid,
    } = (body || {}) as {
      patientUuid: string;
      chiefComplaint?: string;
      diagnoses?: Array<string | { code: string; display: string }>;
      prescriptions?: string[];
      labs?: string[];
      notes?: string;
      locationUuid?: string;
      providerUuid?: string;
    };

    if (!patientUuid) return NextResponse.json({ error: 'patientUuid is required' }, { status: 400 });

    // If full payload present, forward to module endpoint (preferred)
    const haveFullPayload = Array.isArray(diagnoses) && diagnoses.length > 0 && (chiefComplaint || notes);
    if (haveFullPayload) {
      const diagStrings = (diagnoses || []).map((d: any) => (typeof d === 'string' ? d : d.code || d.display));
      const payload = {
        patientUuid,
        chiefComplaint: chiefComplaint || notes || '',
        diagnoses: diagStrings,
        prescriptions: Array.isArray(prescriptions) ? prescriptions : [],
        labs: Array.isArray(labs) ? labs : [],
        locationUuid: locationUuid || LOCATION_UUID,
        providerUuid: providerUuid || undefined,
      };
      const res = await fetch(`${OPENMRS_ROOT_URL}/ws/rest/v1/ghana/opd/consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json({ error: data?.message || 'Consultation save failed' }, { status: 502 });
      }
      return NextResponse.json({ ok: true, ...data });
    }

    // Fallback: create simple encounter in core API (legacy path)
    if (!Array.isArray(diagnoses) || diagnoses.length === 0) {
      return NextResponse.json({ error: 'At least one diagnosis is required' }, { status: 400 });
    }
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
    if (NOTES_CONCEPT && (notes || chiefComplaint)) {
      obs.push({ concept: NOTES_CONCEPT, value: notes || chiefComplaint });
    }
    if (NOTES_CONCEPT && diagnoses?.length) {
      const summary = (diagnoses as any[]).map((d: any) => (typeof d === 'string' ? d : `${d.code} ${d.display}`)).join('; ');
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
    return NextResponse.json({ ok: true, encounterUuid: data?.uuid });
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error', details: e?.message }, { status: 500 });
  }
}
