import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieHeader = (request.headers as any).get('cookie') || '';
  const isAuthed = /(?:^|;\s*)omrsAuth=1(?:;|$)/.test(cookieHeader);
  const userMatch = cookieHeader.match(/(?:^|;\s*)omrsUser=([^;]+)/);
  const username = userMatch ? decodeURIComponent(userMatch[1]) : undefined;
  
  const locationMatch = cookieHeader.match(/(?:^|;\s*)omrsLocation=([^;]+)/);
  const locationUuid = locationMatch ? decodeURIComponent(locationMatch[1]) : undefined;
  
  const providerMatch = cookieHeader.match(/(?:^|;\s*)omrsProvider=([^;]+)/);
  const providerUuid = providerMatch ? decodeURIComponent(providerMatch[1]) : undefined;

  return NextResponse.json({ 
    authenticated: isAuthed, 
    user: username ? { username } : undefined,
    sessionLocation: locationUuid ? { uuid: locationUuid } : undefined,
    currentProvider: providerUuid ? { uuid: providerUuid } : undefined,
  });
}

