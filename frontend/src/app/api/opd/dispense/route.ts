import { NextRequest, NextResponse } from 'next/server';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';
const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;
const OPENMRS_ROOT_URL = OPENMRS_BASE_URL.replace(/\/ws\/rest\/v1\/?$/, '');

const LOCATION_UUID = process.env.OPENMRS_LOCATION_UUID || 'aff27d58-a15c-49a6-9beb-d30dcfc0c66e';
const DISPENSE_ENCOUNTER_TYPE_UUID = process.env.OPENMRS_OPD_DISPENSE_ENCOUNTER_TYPE_UUID || process.env.OPENMRS_OPD_ENCOUNTER_TYPE_UUID || '';
const VISIT_TYPE_UUID = process.env.OPENMRS_OPD_VISIT_TYPE_UUID || '';
const NOTES_CONCEPT = process.env.OPENMRS_CONCEPT_CONSULTATION_NOTES_UUID;

const BILLING_CONCEPT = process.env.OPENMRS_CONCEPT_BILLING_TYPE_UUID;
const BILLING_NHIS = process.env.OPENMRS_CONCEPT_BILLING_TYPE_NHIS_UUID;
const BILLING_CASH = process.env.OPENMRS_CONCEPT_BILLING_TYPE_CASH_UUID;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientUuid, billingType, items } = body || {} as {
      patientUuid: string,
      billingType?: 'NHIS' | 'Cash',
      items: { drug: string, strength?: string, form?: string, dosage?: string, frequency?: string, duration?: string, quantity?: number, instructions?: string }[]
    };

    if (!patientUuid) return NextResponse.json({ error: 'patientUuid is required' }, { status: 400 });
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    if (!DISPENSE_ENCOUNTER_TYPE_UUID) return NextResponse.json({ error: 'Dispense encounter type not configured' }, { status: 500 });

    const now = new Date().toISOString();

    // ensure visit
    let visitUuid: string | undefined;
    if (VISIT_TYPE_UUID) {
      const vRes = await fetch(`${OPENMRS_BASE_URL}/visit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({ patient: patientUuid, visitType: VISIT_TYPE_UUID, startDatetime: now, location: LOCATION_UUID })
      });
      if (vRes.ok) visitUuid = (await vRes.json())?.uuid;
    }

    const obs: any[] = [];

    // Billing type as coded obs if concepts configured; else add to notes
    let notesParts: string[] = [];
    if (billingType) {
      if (BILLING_CONCEPT && ((billingType === 'NHIS' && BILLING_NHIS) || (billingType === 'Cash' && BILLING_CASH))) {
        obs.push({ concept: BILLING_CONCEPT, value: billingType === 'NHIS' ? BILLING_NHIS : BILLING_CASH });
      } else {
        notesParts.push(`Billing: ${billingType}`);
      }
    }

    // Summarize items in notes
    const lines = items.map((it: any, idx: number) => {
      const parts = [it.drug, it.strength, it.form].filter(Boolean).join(' ');
      const plan = [it.dosage, it.frequency, it.duration].filter(Boolean).join(', ');
      const qty = (it.quantity != null) ? `Qty: ${it.quantity}` : '';
      const instr = it.instructions ? `Instr: ${it.instructions}` : '';
      return `${idx + 1}. ${parts}${plan ? ' — ' + plan : ''}${qty ? ' — ' + qty : ''}${instr ? ' — ' + instr : ''}`;
    });
    const summary = `Dispense:\n${lines.join('\n')}`;
    notesParts.push(summary);

    if (NOTES_CONCEPT) {
      obs.push({ concept: NOTES_CONCEPT, value: notesParts.join('\n') });
    }

    const payload: any = {
      patient: patientUuid,
      encounterType: DISPENSE_ENCOUNTER_TYPE_UUID,
      encounterDatetime: now,
      location: LOCATION_UUID,
    };
    if (visitUuid) payload.visit = visitUuid;
    if (obs.length) payload.obs = obs;

    const res = await fetch(`${OPENMRS_BASE_URL}/encounter`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: authHeader }, body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: 'Failed to create dispense encounter', details: t }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({ ok: true, encounterUuid: data?.uuid });
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error', details: e?.message }, { status: 500 });
  }
}

