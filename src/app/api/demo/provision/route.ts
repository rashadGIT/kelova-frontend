import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function POST(req: NextRequest) {
  const cookie = req.headers.get('cookie') ?? '';
  const auth = req.headers.get('authorization') ?? '';

  const res = await fetch(`${API_URL}/demo/provision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie && { cookie }),
      ...(auth && { authorization: auth }),
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
