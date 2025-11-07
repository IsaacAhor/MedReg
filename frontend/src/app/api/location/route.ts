import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const OPENMRS_BASE_URL =
  process.env.OPENMRS_BASE_URL ||
  process.env.NEXT_PUBLIC_OPENMRS_API_URL ||
  'http://localhost:8080/openmrs/ws/rest/v1';
// Prefer user session when available
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';

function defaultLocations() {
  const triage = process.env.NEXT_PUBLIC_TRIAGE_LOCATION_UUID || 'default-triage';
  const consult = process.env.NEXT_PUBLIC_CONSULTATION_LOCATION_UUID || 'default-opd';
  const pharmacy = process.env.NEXT_PUBLIC_PHARMACY_LOCATION_UUID || 'default-pharmacy';
  return [
    { uuid: 'default-reception', display: 'Reception', name: 'Reception', description: 'Default reception', tags: [] },
    { uuid: triage, display: 'Triage', name: 'Triage', description: 'Default triage area', tags: [] },
    { uuid: consult, display: 'OPD Room 1', name: 'OPD Room 1', description: 'Default consultation room', tags: [] },
    { uuid: pharmacy, display: 'Pharmacy', name: 'Pharmacy', description: 'Default pharmacy', tags: [] },
  ];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tag = searchParams.get('tag') || 'Login Location';

  // Helper to call OpenMRS with timeout and return results or null
  const callOpenmrs = async (t: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);
      const cookieStore = cookies();
      const jsessionId = cookieStore.get('omrsSession')?.value;
      const headers: Record<string,string> = { Accept: 'application/json' };
      if (jsessionId) {
        headers['Cookie'] = `JSESSIONID=${jsessionId}`;
      } else {
        const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;
        headers['Authorization'] = authHeader;
      }
      const res = await fetch(`${OPENMRS_BASE_URL}/location?tag=${encodeURIComponent(t)}&v=full`, {
        headers,
        cache: 'no-store',
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      return (data.results as any[]) || [];
    } catch (_) {
      return null;
    }
  };

  // 1) Try requested tag, 2) fall back to Queue Room, 3) default list
  const first = await callOpenmrs(tag);
  if (first && first.length) return NextResponse.json({ results: first });
  const second = await callOpenmrs('Queue Room');
  if (second && second.length) return NextResponse.json({ results: second });
  return NextResponse.json({ results: defaultLocations(), fallback: true });
}
