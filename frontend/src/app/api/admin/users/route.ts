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
    const limit = Number(searchParams.get('limit') || '50');
    const startIndex = Number(searchParams.get('startIndex') || '0');

    const upstream = await fetch(
      `${baseUrl.replace(/\/$/, '')}/user?v=full&limit=${limit}&startIndex=${startIndex}`,
      {
        headers: {
          Cookie: cookie,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return NextResponse.json({ message: 'Failed to load users', details: text }, { status: upstream.status });
    }

    const data = await upstream.json();
    const items = (data?.results || []).map((u: any) => ({
      uuid: u.uuid,
      username: u.username,
      systemId: u.systemId,
      display: u.display,
      roles: Array.isArray(u.roles) ? u.roles.map((r: any) => r?.display || r?.name).filter(Boolean) : [],
    }));
    const total = typeof data?.length === 'number' ? data.length : items.length;

    return NextResponse.json({ items, total });
  } catch (e) {
    return NextResponse.json({ message: 'Unexpected error loading users' }, { status: 500 });
  }
}

