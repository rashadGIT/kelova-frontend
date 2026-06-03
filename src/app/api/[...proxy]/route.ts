import { NextRequest, NextResponse } from 'next/server';

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001';

// Strips the /api prefix and forwards to the backend.
// Preserves cookies, Authorization header, request body, and response headers.
async function proxyRequest(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname.replace(/^\/api/, '');
  const search = req.nextUrl.search;
  const url = `${API_URL}${path}${search}`;

  const headers = new Headers();
  for (const [k, v] of req.headers.entries()) {
    if (['host', 'connection', 'transfer-encoding'].includes(k.toLowerCase()))
      continue;
    headers.set(k, v);
  }

  const body =
    req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.arrayBuffer()
      : undefined;

  const res = await fetch(url, {
    method: req.method,
    headers,
    body: body ? Buffer.from(body) : undefined,
  });

  const responseHeaders = new Headers();
  for (const [k, v] of res.headers.entries()) {
    if (k.toLowerCase() === 'transfer-encoding') continue;
    responseHeaders.append(k, v);
  }

  const resBody = await res.arrayBuffer();
  return new NextResponse(resBody, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
