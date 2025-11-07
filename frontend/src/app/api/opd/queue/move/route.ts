import { NextRequest, NextResponse } from 'next/server';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';
const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;
const OPENMRS_ROOT_URL = OPENMRS_BASE_URL.replace(/\/ws\/rest\/v1\/?$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queueUuid, patientUuid, visitUuid, nextLocationUuid, priority } = body || {};
    if (!queueUuid || !patientUuid || !nextLocationUuid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1) Complete current queue entry
    {
      const res1 = await fetch(
        `${OPENMRS_ROOT_URL}/ws/rest/v1/ghana/opd/queue/${encodeURIComponent(queueUuid)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: authHeader },
          body: JSON.stringify({ status: 'COMPLETED' }),
        }
      );
      if (!res1.ok) {
        const t = await res1.text().catch(() => '');
        return NextResponse.json({ error: 'Failed to complete current queue', details: t }, { status: 500 });
      }
    }

    // 2) Create next queue entry
    const res2 = await fetch(`${OPENMRS_ROOT_URL}/ws/rest/v1/ghana/opd/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify({
        patientUuid,
        visitUuid,
        locationToUuid: nextLocationUuid,
        priority: priority || 5,
        status: 'PENDING',
      }),
    });
    if (!res2.ok) {
      const t = await res2.text().catch(() => '');
      return NextResponse.json({ error: 'Failed to create next queue entry', details: t }, { status: 500 });
    }
    const data = await res2.json().catch(() => ({}));
    return NextResponse.json({ success: true, newQueueEntry: data });
  } catch (error: any) {
    return NextResponse.json({ error: 'Unexpected error moving queue' }, { status: 500 });
  }
}

