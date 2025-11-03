import { NextRequest, NextResponse } from 'next/server';
import axios from '@/lib/axios';

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

    // Call OpenMRS REST API endpoint
    const response = await axios.get(
      `/ws/rest/v1/ghana/patients/${params.uuid}/nhie-status`,
      {
        headers: {
          Cookie: `JSESSIONID=${sessionCookie}`
        }
      }
    );

    return NextResponse.json(response.data);
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
