import { NextRequest, NextResponse } from 'next/server';

function getOpenmrsBaseUrl(): string | undefined {
  return process.env.OPENMRS_BASE_URL || process.env.NEXT_PUBLIC_OPENMRS_API_URL;
}

function getSessionCookie(req: NextRequest): string | undefined {
  const jsess = req.cookies.get('omrsSessionId')?.value;
  return jsess ? `JSESSIONID=${jsess}` : undefined;
}

export async function GET(req: NextRequest) {
  try {
    const baseUrl = getOpenmrsBaseUrl();
    if (!baseUrl) {
      return NextResponse.json({ message: 'OpenMRS API URL not configured' }, { status: 500 });
    }

    const cookie = getSessionCookie(req);
    if (!cookie) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    const upstream = await fetch(`${baseUrl}/patient?q=${encodeURIComponent(q)}&v=default`, {
      headers: {
        Cookie: cookie,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (e) {
    return NextResponse.json({ message: 'Failed to fetch patients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const baseUrl = getOpenmrsBaseUrl();
    if (!baseUrl) {
      return NextResponse.json({ message: 'OpenMRS API URL not configured' }, { status: 500 });
    }

    const cookie = getSessionCookie(req);
    if (!cookie) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    // Proxy to OpenMRS module endpoint (backend handles validation, folder number, NHIE routing)
    const upstream = await fetch(`${baseUrl}/ghana/patients`, {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json().catch(async () => ({ message: await upstream.text().catch(() => 'Unknown upstream error') }));
    return NextResponse.json(data, { status: upstream.status });
  } catch (e) {
    return NextResponse.json({ message: 'Failed to register patient' }, { status: 500 });
  }
}
