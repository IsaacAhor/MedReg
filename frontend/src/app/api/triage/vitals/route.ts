import { NextRequest, NextResponse } from 'next/server';
import axios from '@/lib/axios';

// POST /api/triage/vitals
// Proxies vitals recording to OpenMRS backend BFF endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward to OpenMRS backend (module REST namespace)
    const response = await axios.post(
      '/ws/rest/v1/ghana/triage/vitals',
      body
    );

    return NextResponse.json(response.data, { status: 201 });
  } catch (error: any) {
    if (error.response?.status === 400) {
      return NextResponse.json(
        { error: error.response.data?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to record vitals' },
      { status: 500 }
    );
  }
}

