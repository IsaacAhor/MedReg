import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patients/[uuid]/nhie-status
 *
 * Fetches NHIE synchronization status for a patient from OpenMRS backend.
 * This is a BFF (Backend-For-Frontend) endpoint that proxies the request
 * to the OpenMRS REST API.
 *
 * Response format:
 * {
 *   patientUuid: string;
 *   syncStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'DLQ';
 *   nhiePatientId?: string;
 *   lastSyncAttempt?: string;
 *   retryCount: number;
 *   errorMessage?: string;
 *   responseStatus?: number;
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    // Get session cookie for authentication
    const sessionCookie = req.cookies.get('omrsSession')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Prepare OpenMRS base URL
    const base =
      process.env.OPENMRS_BASE_URL ||
      process.env.NEXT_PUBLIC_OPENMRS_API_URL ||
      'http://localhost:8080/openmrs/ws/rest/v1';

    // Call OpenMRS REST API endpoint using fetch
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(`${base}/ghana/patients/${params.uuid}/nhie-status`, {
      headers: {
        Accept: 'application/json',
        Cookie: `JSESSIONID=${sessionCookie}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(t));

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch NHIE status' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('NHIE status fetch error:', error);

    // Handle specific error cases
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch NHIE status' },
      { status: 500 }
    );
  }
}
