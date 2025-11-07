import { NextRequest, NextResponse } from 'next/server';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';
const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;
const OPENMRS_ROOT_URL = OPENMRS_BASE_URL.replace(/\/ws\/rest\/v1\/?$/, '');

export async function GET(
  request: NextRequest,
  { params }: { params: { location: string } }
) {
  try {
    const { location } = params;
    const status = request.nextUrl.searchParams.get('status') || 'PENDING';
    const url = `${OPENMRS_ROOT_URL}/ws/rest/v1/ghana/opd/queue?location=${encodeURIComponent(location)}&status=${encodeURIComponent(status)}`;
    const response = await fetch(url, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return NextResponse.json({ error: 'Failed to fetch queue', details: text }, { status: 500 });
    }
    const data = await response.json();

    const now = Date.now();
    const withWait = Array.isArray(data?.results)
      ? data.results.map((entry: any) => {
          const created = entry?.dateCreated ? new Date(entry.dateCreated).getTime() : now;
          const waitTime = Math.max(0, Math.floor((now - created) / 60000));
          return { ...entry, waitTime };
        })
      : [];

    return NextResponse.json({ results: withWait, total: withWait.length });
  } catch (error: any) {
    return NextResponse.json({ error: 'Unexpected error fetching queue' }, { status: 500 });
  }
}

