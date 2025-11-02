import { NextResponse } from 'next/server';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';
const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;
const OPENMRS_ROOT_URL = OPENMRS_BASE_URL.replace(/\/ws\/rest\/v1\/?$/, '');
const OPD_ENCOUNTER_TYPE_UUID = process.env.OPENMRS_OPD_ENCOUNTER_TYPE_UUID || '';

export async function GET() {
  if (!OPD_ENCOUNTER_TYPE_UUID) {
    return NextResponse.json({ ok: false, error: 'OPENMRS_OPD_ENCOUNTER_TYPE_UUID not configured' }, { status: 200 });
  }
  try {
    const res = await fetch(`${OPENMRS_ROOT_URL}/ws/rest/v1/ghana/opd/metrics?encounterTypeUuid=${encodeURIComponent(OPD_ENCOUNTER_TYPE_UUID)}`, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, ...data }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

