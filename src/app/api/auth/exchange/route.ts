import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Same-origin proxy for the OAuth code exchange.
// The browser calls this route (port 3000 → 3000, no CORS),
// and this server-side handler calls the NestJS backend (server-to-server, no CORS).
export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${API_URL}/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  const response = NextResponse.json(data, { status: res.status });

  // Forward the Set-Cookie headers from the backend (access_token, refresh_token)
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookie) {
    response.headers.append('Set-Cookie', cookie);
  }

  return response;
}
