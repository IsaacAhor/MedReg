import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password, locationUuid } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password required' }, { status: 400 });
    }

    if (!locationUuid) {
      return NextResponse.json({ message: 'Work location is required' }, { status: 400 });
    }

    const baseUrl = process.env.OPENMRS_BASE_URL || process.env.NEXT_PUBLIC_OPENMRS_API_URL;
    if (!baseUrl) {
      return NextResponse.json({ message: 'OpenMRS API URL not configured' }, { status: 500 });
    }

    // Authenticate against OpenMRS session endpoint using Basic Auth
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

    const upstream = await fetch(`${baseUrl.replace(/\/$/, '')}/session`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
      redirect: 'manual',
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok || data?.authenticated !== true) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Capture JSESSIONID from upstream if present
    const setCookie = upstream.headers.get('set-cookie') || '';
    const jsessMatch = setCookie.match(/JSESSIONID=([^;]+);/);
    const jsessionId = jsessMatch ? jsessMatch[1] : undefined;

    // Fetch location details
    let locationData = null;
    try {
      const locationResponse = await fetch(`${baseUrl.replace(/\/$/, '')}/location/${locationUuid}?v=full`, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });
      if (locationResponse.ok) {
        locationData = await locationResponse.json();
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }

    // Fetch user roles
    let rolesCsv = '';
    try {
      if (data?.user?.uuid) {
        const userRes = await fetch(`${baseUrl.replace(/\/$/, '')}/user/${data.user.uuid}?v=full`, {
          headers: { Authorization: authHeader, Accept: 'application/json' },
        });
        if (userRes.ok) {
          const userFull = await userRes.json();
          const roles: string[] = (userFull?.roles || []).map((r: any) => r?.display || r?.name).filter(Boolean);
          if (roles?.length) rolesCsv = roles.join(',');
        }
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }

    // Fetch provider for user
    let providerData = null;
    try {
      const providerResponse = await fetch(`${baseUrl.replace(/\/$/, '')}/provider?user=${data.user.uuid}&v=full`, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });
      if (providerResponse.ok) {
        const providerResult = await providerResponse.json();
        providerData = providerResult?.results?.[0] || null;
      }
    } catch (error) {
      console.error('Error fetching provider:', error);
    }

    const res = NextResponse.json({ 
      user: data?.user || { username },
      sessionLocation: locationData,
      currentProvider: providerData,
    }, { status: 200 });

    // Auth flag for UI protection
    res.cookies.set('omrsAuth', '1', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    if (jsessionId) {
      res.cookies.set('omrsSessionId', jsessionId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
    }

    // Minimal user context (non-PII)
    if (data?.user?.username) {
      res.cookies.set('omrsUser', data.user.username, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      });
    }

    // Store roles (for role-aware nav)
    if (rolesCsv) {
      res.cookies.set('omrsRole', rolesCsv, { httpOnly: false, sameSite: 'lax', path: '/' });
    }

    // Store location UUID
    if (locationUuid) {
      res.cookies.set('omrsLocation', locationUuid, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      });
    }

    // Store provider UUID
    if (providerData?.uuid) {
      res.cookies.set('omrsProvider', providerData.uuid, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      });
    }

    return res;
  } catch (e) {
    return NextResponse.json({ message: 'Login failed' }, { status: 500 });
  }
}
