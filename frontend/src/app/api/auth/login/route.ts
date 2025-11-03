import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_ROOT_URL = OPENMRS_BASE_URL.replace(/\/ws\/rest\/v1\/?$/, '');

export async function POST(request: NextRequest) {
  try {
    const { username, password, locationUuid } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

    const sessionResponse = await fetch(`${OPENMRS_BASE_URL}/session`, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!sessionResponse.ok) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const session = await sessionResponse.json();
    if (!session?.authenticated) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    if (locationUuid) {
      try {
        await fetch(`${OPENMRS_ROOT_URL}/appui/session.action`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `locationId=${encodeURIComponent(locationUuid)}`,
        });
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

    cookieStore.set('omrsAuth', '1', baseCookie);
    cookieStore.set('omrsRole', primaryRole, baseCookie);
    if (locationUuid) cookieStore.set('omrsLocation', locationUuid, baseCookie);
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

