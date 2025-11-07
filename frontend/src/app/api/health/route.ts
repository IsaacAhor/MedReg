import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.OPENMRS_BASE_URL || process.env.NEXT_PUBLIC_OPENMRS_API_URL || 'http://localhost:8080/openmrs/ws/rest/v1';
  const username = process.env.OPENMRS_USERNAME || 'admin';
  const password = process.env.OPENMRS_PASSWORD || 'Admin123';
  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

  let openmrs: any = { ok: false };
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${base}/session`, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(t));
    const js = await res.json().catch(() => ({}));
    openmrs = { ok: res.ok, status: res.status, authenticated: js?.authenticated ?? null };
  } catch (e: any) {
    openmrs = { ok: false, error: e?.message || String(e) };
  }

  return NextResponse.json({
    env: {
      base,
      nodeEnv: process.env.NODE_ENV,
    },
    openmrs,
  });
}

