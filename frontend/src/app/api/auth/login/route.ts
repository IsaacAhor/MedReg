import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password required' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_OPENMRS_API_URL;
    if (!baseUrl) {
      return NextResponse.json({ message: 'OpenMRS API URL not configured' }, { status: 500 });
    }

    // Authenticate against OpenMRS session endpoint using Basic Auth
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

    const upstream = await fetch(`${baseUrl}/session`, {
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

    const res = NextResponse.json({ user: data?.user || { username } }, { status: 200 });

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

    return res;
  } catch (e) {
    return NextResponse.json({ message: 'Login failed' }, { status: 500 });
  }
}

