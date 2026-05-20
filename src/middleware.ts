import { NextRequest, NextResponse } from 'next/server';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'kelova.com';

const PUBLIC_PATHS = ['/login', '/auth', '/intake', '/forgot-password', '/reset-password'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';

  // Auth gate: redirect unauthenticated users before the page renders
  if (!isPublicPath(pathname)) {
    const token = request.cookies.get('access_token');
    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
  }

  // Subdomain tenant resolution
  // Production: sunrise.kelova.com → slug = 'sunrise'
  // Local dev:  localhost:3000?tenant=sunrise → slug = 'sunrise'
  const subdomain = host.replace(`.${APP_DOMAIN}`, '').replace(/:\d+$/, '');
  const isSubdomain =
    subdomain !== 'app' &&
    subdomain !== 'www' &&
    subdomain !== 'localhost' &&
    host.includes(APP_DOMAIN);
  const tenantSlug = isSubdomain
    ? subdomain
    : request.nextUrl.searchParams.get('tenant') ?? null;

  const requestHeaders = new Headers(request.headers);
  if (tenantSlug) requestHeaders.set('x-tenant-slug', tenantSlug);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
