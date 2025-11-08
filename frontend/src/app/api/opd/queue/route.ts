import { NextRequest, NextResponse } from 'next/server';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';
const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;
const OPENMRS_ROOT_URL = OPENMRS_BASE_URL.replace(/\/ws\/rest\/v1\/?$/, '');

// Create a new OPD queue entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientUuid, visitUuid, locationUuid, priority, status } = body || {};
    if (!patientUuid || !locationUuid) {
      return NextResponse.json({ error: 'patientUuid and locationUuid are required' }, { status: 400 });
    }

    const res = await fetch(`${OPENMRS_ROOT_URL}/ws/rest/v1/ghana/opd/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({
        patientUuid,
        visitUuid,
        locationToUuid: locationUuid,
        priority: priority || 5,
        status: status || 'PENDING',
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return NextResponse.json({ error: 'Failed to create queue entry', details: t }, { status: 502 });
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ success: true, queue: data });
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error creating queue entry' }, { status: 500 });
  }
}

