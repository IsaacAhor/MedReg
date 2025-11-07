import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Prefer configured public API URL when server var is absent
const OPENMRS_BASE_URL =
  process.env.OPENMRS_BASE_URL ||
  process.env.NEXT_PUBLIC_OPENMRS_API_URL ||
  'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_ROOT_URL = OPENMRS_BASE_URL.replace(/\/ws\/rest\/v1\/?$/, '');

export async function POST(request: NextRequest) {
  try {
    const { username, password, locationUuid, location } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    // Establish OpenMRS session via POST /session (captures JSESSIONID)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const sessionResponse = await fetch(`${OPENMRS_BASE_URL}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!sessionResponse.ok) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const setCookie = sessionResponse.headers.get('set-cookie') || '';
    const jsessMatch = setCookie.match(/JSESSIONID=([^;]+)/i);
    if (!jsessMatch) {
      return NextResponse.json({ message: 'Login failed: no session cookie' }, { status: 500 });
    }
    const jsessionId = jsessMatch[1];
    const session = await sessionResponse.json();
    if (!session?.authenticated) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const selectedLocation = locationUuid || location; // support either field name
    if (selectedLocation) {
      try {
        const controller2 = new AbortController();
        const t2 = setTimeout(() => controller2.abort(), 5_000);
        await fetch(`${OPENMRS_ROOT_URL}/appui/session.action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: `JSESSIONID=${jsessionId}`,
          },
          body: `locationId=${encodeURIComponent(selectedLocation)}`,
          signal: controller2.signal,
        }).finally(() => clearTimeout(t2));
      } catch (e) {
        // Non-fatal: continue login even if location set fails
        console.warn('OpenMRS set session location failed');
      }
    }

    const roles: string[] = (session.user?.roles || []).map((r: any) => r.display || r.name);
    const primaryRole = roles.includes('Platform Admin') ? 'admin'
      : roles.includes('Facility Admin') ? 'admin'
      : roles.includes('Doctor') ? 'doctor'
      : roles.includes('Nurse') ? 'nurse'
      : roles.includes('Pharmacist') ? 'pharmacist'
      : roles.includes('Records Officer') ? 'records'
      : roles.includes('Cashier') ? 'cashier'
      : roles.includes('NHIS Officer') ? 'nhis'
      : 'user';

    const cookieStore = cookies();
    const secure = process.env.NODE_ENV === 'production';
    const baseCookie = { httpOnly: true, secure, sameSite: 'lax' as const, maxAge: 60 * 60 * 8, path: '/' };

    // Persist OpenMRS session ID for server-side calls
    cookieStore.set('omrsSession', jsessionId, baseCookie);
    // Auth flags + role/location/provider context
    cookieStore.set('omrsAuth', '1', baseCookie);
    cookieStore.set('omrsRole', primaryRole, baseCookie);
    if (selectedLocation) cookieStore.set('omrsLocation', selectedLocation, baseCookie);
    if (session.currentProvider?.uuid) cookieStore.set('omrsProvider', session.currentProvider.uuid, baseCookie);

    return NextResponse.json({
      success: true,
      user: {
        uuid: session.user?.uuid,
        username: session.user?.username,
        display: session.user?.display || session.user?.username,
        roles,
        primaryRole,
      },
      sessionLocation: session.sessionLocation || null,
    });
  } catch (error: any) {
    console.error('Login error:', error?.message || String(error));
    return NextResponse.json({ message: 'Login failed' }, { status: 500 });
  }
}
