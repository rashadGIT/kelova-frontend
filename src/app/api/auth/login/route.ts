import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Same-origin proxy for email/password login.
// Browser calls this route (same origin, no CORS), server calls the NestJS backend
// server-to-server, then forwards Set-Cookie headers scoped to the frontend domain
// so the Next.js middleware can read the access_token cookie.
export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  const response = NextResponse.json(data, { status: res.status });

  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookie) {
    const sanitized = cookie.replace(/;\s*domain=[^;]*/i, '');
    response.headers.append('Set-Cookie', sanitized);
  }

  return response;
}
