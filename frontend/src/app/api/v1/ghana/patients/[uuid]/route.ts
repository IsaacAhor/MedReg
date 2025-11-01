import { NextRequest, NextResponse } from 'next/server';

function getOpenmrsBaseUrl(): string | undefined {
  return process.env.OPENMRS_BASE_URL || process.env.NEXT_PUBLIC_OPENMRS_API_URL;
}

function getSessionCookie(req: NextRequest): string | undefined {
  const jsess = req.cookies.get('omrsSessionId')?.value;
  return jsess ? `JSESSIONID=${jsess}` : undefined;
}

export async function GET(req: NextRequest, context: { params: { uuid: string } }) {
  try {
    const baseUrl = getOpenmrsBaseUrl();
    if (!baseUrl) {
      return NextResponse.json({ message: 'OpenMRS API URL not configured' }, { status: 500 });
    }

    const cookie = getSessionCookie(req);
    if (!cookie) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { uuid } = context.params;
    const upstream = await fetch(`${baseUrl}/patient/${encodeURIComponent(uuid)}`, {
      headers: {
        Cookie: cookie,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (e) {
    return NextResponse.json({ message: 'Failed to fetch patient' }, { status: 500 });
  }
}

