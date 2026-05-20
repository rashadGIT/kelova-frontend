import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Same-origin proxy for logout. Forwards to the backend and clears the
// access_token cookie on the frontend domain so the middleware stops seeing it.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';

  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
  }).catch(() => null);

  const response = NextResponse.json({ ok: true });
  response.cookies.set('access_token', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  });
  response.cookies.set('refresh_token', '', {
    path: '/auth',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  });
  return response;
}
