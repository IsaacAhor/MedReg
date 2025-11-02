import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';
const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;
const OPENMRS_ROOT_URL = OPENMRS_BASE_URL.replace(/\/ws\/rest\/v1\/?$/, '');
const OPD_ENCOUNTER_TYPE_UUID = process.env.OPENMRS_OPD_ENCOUNTER_TYPE_UUID || '';

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0,10);
  const encounterTypeUuid = request.nextUrl.searchParams.get('encounterTypeUuid') || OPD_ENCOUNTER_TYPE_UUID;
  const format = request.nextUrl.searchParams.get('format') || '';
  if (!encounterTypeUuid) return NextResponse.json({ ok: false, error: 'encounterTypeUuid required' }, { status: 200 });
  try {
    const loc = cookies().get('omrsLocation')?.value || '';
    const url = `${OPENMRS_ROOT_URL}/ws/rest/v1/ghana/reports/opd-register?date=${encodeURIComponent(date)}&encounterTypeUuid=${encodeURIComponent(encounterTypeUuid)}${loc ? `&locationUuid=${encodeURIComponent(loc)}` : ''}${format ? `&format=${encodeURIComponent(format)}` : ''}`;
    const headers: any = { Authorization: authHeader, Accept: format === 'csv' ? 'text/csv' : 'application/json' };
    const res = await fetch(url, {
      headers,
      cache: 'no-store',
    });
    if (format === 'csv') {
      const text = await res.text();
      return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'text/csv; charset=UTF-8' } });
    } else {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ ok: res.ok, ...data }, { status: 200 });
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
