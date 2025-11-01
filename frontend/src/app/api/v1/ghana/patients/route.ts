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

    // For Week 1/2 we do not create Patients directly here.
    // Registration will be handled by the backend OpenMRS module per AGENTS.md.
    return NextResponse.json({ message: 'Patient registration via backend service is not yet enabled' }, { status: 501 });
  } catch (e) {
    return NextResponse.json({ message: 'Failed to register patient' }, { status: 500 });
  }
}

