import { NextRequest, NextResponse } from 'next/server';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';
const authHeader = `Basic ${Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64')}`;
const OPENMRS_ROOT_URL = OPENMRS_BASE_URL.replace(/\/ws\/rest\/v1\/?$/, '');

export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get('to') || new Date().toISOString().slice(0,10);
  const from = request.nextUrl.searchParams.get('from') || to;
  const limit = request.nextUrl.searchParams.get('limit') || '10';
  const format = request.nextUrl.searchParams.get('format') || '';
  try {
    const url = `${OPENMRS_ROOT_URL}/ws/rest/v1/ghana/reports/top-diagnoses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${encodeURIComponent(limit)}${format ? `&format=${encodeURIComponent(format)}` : ''}`;
    const headers: any = { Authorization: authHeader, Accept: format === 'csv' ? 'text/csv' : 'application/json' };
    const res = await fetch(url, {
      headers,
      cache: 'no-store',
    });
    if (format === 'csv') {
      const text = await res.text();
      return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'text/csv; charset=UTF-8' } });
    } else {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ ok: res.ok, ...data }, { status: 200 });
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
