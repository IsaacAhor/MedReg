import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
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

