import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Same-origin proxy for the OAuth code exchange.
// The browser calls this route (port 3000 → 3000, no CORS),
// and this server-side handler calls the NestJS backend (server-to-server, no CORS).
export async function POST(req: NextRequest) {
  const body = await req.json();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: `Backend unreachable: ${msg}` }, { status: 502 });
  }

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json({ message: text || 'Backend error' }, { status: res.status });
  }

  const response = NextResponse.json(data, { status: res.status });

  // Forward the Set-Cookie headers from the backend (access_token, refresh_token).
  // Strip the Domain attribute so the cookie is scoped to the current origin rather
  // than .kelovaapp.com, which the browser would reject on non-kelova hosts (e.g. amplifyapp.com).
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookie) {
    const sanitized = cookie.replace(/;\s*domain=[^;]*/i, '');
    response.headers.append('Set-Cookie', sanitized);
  }

  return response;
}
