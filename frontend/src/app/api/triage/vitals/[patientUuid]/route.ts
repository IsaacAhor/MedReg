import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/triage/vitals/[patientUuid]
// Fetch the latest recorded vitals for a patient
export async function GET(
  _request: NextRequest,
  { params }: { params: { patientUuid: string } }
) {
  try {
    const { patientUuid } = params;

    // Require OpenMRS session
    const jsessionId = _request.cookies.get('omrsSession')?.value;
    if (!jsessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base =
      process.env.OPENMRS_BASE_URL ||
      process.env.NEXT_PUBLIC_OPENMRS_API_URL ||
      'http://localhost:8080/openmrs/ws/rest/v1';

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(`${base}/ghana/triage/vitals/${patientUuid}`, {
      headers: {
        Accept: 'application/json',
        Cookie: `JSESSIONID=${jsessionId}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(t));

    if (res.status === 404) {
      return NextResponse.json({ vitals: null }, { status: 200 });
    }
    if (res.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch vitals' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    if (error.response?.status === 404) {
      return NextResponse.json({ vitals: null }, { status: 200 });
    }
    if (error.response?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch vitals' }, { status: 500 });
  }
}
