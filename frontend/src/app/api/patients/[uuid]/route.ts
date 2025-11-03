import { NextRequest, NextResponse } from 'next/server';

// OpenMRS connection config
const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';
const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;

export async function GET(_request: NextRequest, context: { params: { uuid: string } }) {
  try {
    const { uuid } = context.params;
    if (!uuid) {
      return NextResponse.json({ error: 'Patient UUID required' }, { status: 400 });
    }

    const res = await fetch(`${OPENMRS_BASE_URL}/patient/${encodeURIComponent(uuid)}`, {
      method: 'GET',
      headers: { Authorization: authHeader, Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ ok: false, error: text || `OpenMRS error ${res.status}` }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

