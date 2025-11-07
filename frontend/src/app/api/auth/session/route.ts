import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const OPENMRS_BASE_URL =
  process.env.OPENMRS_BASE_URL ||
  process.env.NEXT_PUBLIC_OPENMRS_API_URL ||
  'http://localhost:8080/openmrs/ws/rest/v1';
// No admin Basic here; prefer JSESSIONID from login

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = cookies();
    const jsessionId = cookieStore.get('omrsSession')?.value;
    if (!jsessionId) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const sessionResponse = await fetch(`${OPENMRS_BASE_URL}/session`, {
      headers: { Accept: 'application/json', Cookie: `JSESSIONID=${jsessionId}` },
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!sessionResponse.ok) {
      cookieStore.delete('omrsSession');
      cookieStore.delete('omrsAuth');
      cookieStore.delete('omrsRole');
      cookieStore.delete('omrsLocation');
      cookieStore.delete('omrsProvider');
      return NextResponse.json({ authenticated: false, user: null });
    }

    const session = await sessionResponse.json();
    if (!session?.authenticated) {
      cookieStore.delete('omrsSession');
      cookieStore.delete('omrsAuth');
      cookieStore.delete('omrsRole');
      cookieStore.delete('omrsLocation');
      cookieStore.delete('omrsProvider');
      return NextResponse.json({ authenticated: false, user: null });
    }

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
