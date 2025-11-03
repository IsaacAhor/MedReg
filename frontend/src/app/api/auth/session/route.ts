import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = cookies();
    const isAuthenticated = cookieStore.get('omrsAuth')?.value === '1';

    if (!isAuthenticated) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;
    const sessionResponse = await fetch(`${OPENMRS_BASE_URL}/session`, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!sessionResponse.ok) {
      cookieStore.delete('omrsAuth');
      cookieStore.delete('omrsRole');
      cookieStore.delete('omrsLocation');
      cookieStore.delete('omrsProvider');
      return NextResponse.json({ authenticated: false, user: null });
    }

    const session = await sessionResponse.json();
    const primaryRole = cookieStore.get('omrsRole')?.value || 'user';
    const locationUuid = cookieStore.get('omrsLocation')?.value || null;

    return NextResponse.json({
      authenticated: true,
      user: {
        uuid: session.user?.uuid,
        username: session.user?.username,
        display: session.user?.display || session.user?.username,
        roles: (session.user?.roles || []).map((r: any) => r.display || r.name),
        primaryRole,
      },
      sessionLocation: locationUuid ? { uuid: locationUuid } : null,
    });
  } catch (error: any) {
    console.error('Session check error:', error?.message || String(error));
    return NextResponse.json({ authenticated: false, user: null });
  }
}

