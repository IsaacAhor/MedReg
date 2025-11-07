import { NextRequest, NextResponse } from 'next/server';
import openmrs from '@/lib/openmrs';

// GET /api/triage/vitals/[patientUuid]
// Fetch the latest recorded vitals for a patient
export async function GET(
  _request: NextRequest,
  { params }: { params: { patientUuid: string } }
) {
  try {
    const { patientUuid } = params;
    const response = await axios.get(
      `/ws/rest/v1/ghana/triage/vitals/${patientUuid}`
    );
    return NextResponse.json(response.data, { status: 200 });
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
