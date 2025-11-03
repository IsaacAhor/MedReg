import { NextRequest, NextResponse } from 'next/server';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';

const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tag = searchParams.get('tag') || 'Login Location';

    const response = await fetch(`${OPENMRS_BASE_URL}/location?tag=${encodeURIComponent(tag)}&v=full`, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`OpenMRS API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ results: data.results || [] });
  } catch (error: any) {
    console.error('Location fetch error:', error?.message || String(error));
    return NextResponse.json({ message: 'Failed to fetch locations' }, { status: 500 });
  }
}

