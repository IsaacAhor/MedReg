import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    const jsessionId = cookieStore.get('omrsSession')?.value;
    if (jsessionId) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5_000);
        await fetch((process.env.OPENMRS_BASE_URL || process.env.NEXT_PUBLIC_OPENMRS_API_URL || 'http://localhost:8080/openmrs/ws/rest/v1') + '/session', {
          method: 'DELETE',
          headers: { Cookie: `JSESSIONID=${jsessionId}` },
          cache: 'no-store',
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));
      } catch (_) {
        // best-effort logout
      }
    }
    cookieStore.delete('omrsSession');
    cookieStore.delete('omrsAuth');
    cookieStore.delete('omrsRole');
    cookieStore.delete('omrsLocation');
    cookieStore.delete('omrsProvider');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Logout error:', error?.message || String(error));
    return NextResponse.json({ message: 'Logout failed' }, { status: 500 });
  }
}
