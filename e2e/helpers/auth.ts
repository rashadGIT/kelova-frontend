import { Page, test } from '@playwright/test';

export const DEV_USER_EMAIL = 'director@sunrise.demo';
export const DEV_STAFF_EMAIL = 'staff@sunrise.demo';
export const TENANT_SLUG = 'sunrise';
const BACKEND = 'http://localhost:3001';

/**
 * Intercepts all backend API requests and injects the x-dev-user header.
 * Call this before page.goto() in any test that makes authenticated API calls.
 */
export async function injectDevUser(page: Page, email = DEV_USER_EMAIL): Promise<void> {
  await page.route(`${BACKEND}/**`, async (route) => {
    await route.continue({
      headers: { ...route.request().headers(), 'x-dev-user': email },
    });
  });
}

/**
 * Asserts a page loaded without a fatal crash.
 */
export async function assertNoCrash(page: Page): Promise<void> {
  const body = await page.locator('body').textContent();
  if (!body) return;
  const lower = body.toLowerCase();
  if (lower.includes('internal server error') || lower.includes('application error')) {
    throw new Error(`Page crashed: ${body.slice(0, 200)}`);
  }
}

/**
 * Collects unhandled JS errors on the page. Returns an asserter function.
 *
 * Filters out:
 * - React hydration warnings (expected in Next.js dev)
 * - React Query QueryClient SSR warning (Next.js falls back to CSR gracefully)
 * - Network/fetch errors (occur when backend is not running)
 */
export function collectErrors(page: Page): () => void {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return () => {
    const critical = errors.filter(
      (e) =>
        !e.includes('hydration') &&
        !e.includes('Warning') &&
        !e.includes('ResizeObserver') &&
        // React Query SSR fallback — not a real error
        !e.includes('QueryClient') &&
        !e.includes('QueryClientProvider') &&
        !e.includes('Switched to client rendering') &&
        !e.includes('server rendering errored') &&
        // Network errors when backend is down
        !e.includes('ECONNREFUSED') &&
        !e.includes('fetch failed') &&
        !e.includes('Failed to fetch') &&
        !e.includes('Network request failed') &&
        !e.includes('ERR_CONNECTION_REFUSED') &&
        !e.includes('Load failed'),
    );
    if (critical.length > 0) {
      throw new Error(`Unhandled JS errors:\n${critical.join('\n')}`);
    }
  };
}

/**
 * Returns true if the backend is reachable on localhost:3001.
 */
export async function isBackendRunning(page: Page): Promise<boolean> {
  try {
    const resp = await page.request.get(`${BACKEND}/health`, { timeout: 3000 });
    return resp.ok();
  } catch {
    return false;
  }
}

/**
 * Skips the current test if the backend is not reachable.
 * Call at the top of any test that makes direct API requests.
 */
export async function requireBackend(page: Page): Promise<void> {
  const up = await isBackendRunning(page);
  if (!up) {
    test.skip(true, 'Backend not running on localhost:3001 — start with DEV_AUTH_BYPASS=true');
  }
}

/**
 * Uses the Playwright request API to fetch the first case ID from the backend.
 * Returns null if the backend is unavailable or no cases exist.
 */
export async function getFirstCaseId(page: Page): Promise<string | null> {
  try {
    const resp = await page.request.get(`${BACKEND}/cases`, {
      headers: { 'x-dev-user': DEV_USER_EMAIL },
      timeout: 5000,
    });
    if (!resp.ok()) return null;
    const data = await resp.json() as unknown;
    const items = Array.isArray(data)
      ? (data as { id: string }[])
      : ((data as { data: { id: string }[] }).data ?? []);
    return items?.[0]?.id ?? null;
  } catch {
    return null;
  }
}
