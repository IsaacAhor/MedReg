import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out' }, { status: 200 });
  res.cookies.set('omrsAuth', '', { httpOnly: true, maxAge: 0, path: '/' });
  res.cookies.set('omrsRole', '', { httpOnly: false, maxAge: 0, path: '/' });
  res.cookies.set('omrsSessionId', '', { httpOnly: true, maxAge: 0, path: '/' });
  res.cookies.set('omrsUser', '', { httpOnly: false, maxAge: 0, path: '/' });
  res.cookies.set('omrsLocation', '', { httpOnly: false, maxAge: 0, path: '/' });
  res.cookies.set('omrsProvider', '', { httpOnly: false, maxAge: 0, path: '/' });
  return res;
}
