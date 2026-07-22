/**
 * Extracts the case id from an individual case detail path (e.g. /cases/abc123/tasks),
 * excluding the /cases/new creation route. Returns undefined for all other paths.
 */
export function getCaseIdFromPathname(pathname: string): string | undefined {
  return pathname.match(/^\/cases\/(?!new(?:\/|$))([^/]+)/)?.[1];
}

export function getSuperAdminFromPathname(pathname: string): string | undefined {
  return pathname.match(/^\/super-admin\/(?!new(?:\/|$))([^/]+)/)?.[1];
}