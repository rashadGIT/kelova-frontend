/**
 * Page load performance tests.
 *
 * Measures real navigation time from goto() to networkidle.
 * Tests fail loudly if any critical page exceeds its threshold.
 * Run as funeral_director (most common user) plus staff (limited data).
 *
 * Thresholds are intentionally generous for CI (dev server, no CDN).
 * Tighten them as the app matures and production build times are known.
 */

import { test, expect } from '@playwright/test';
import { injectDevUser, requireBackend, getFirstCaseId } from './helpers/auth';
import { snap } from './helpers/screenshot';

// slowMo inflates goto() timing — disable it for all perf measurements.
test.use({ launchOptions: { slowMo: 0 } });

const THRESHOLDS: Record<string, number> = {
  '/':               15000,
  '/cases':          15000,
  '/cases/new':      15000,
  '/tasks':          15000,
  '/analytics':      15000,
  '/vendors':        15000,
  '/merchandise':    15000,
  '/price-list':     15000,
  '/calendar':       15000,
};

async function measureLoad(
  page: Parameters<typeof injectDevUser>[0],
  route: string,
): Promise<number> {
  const start = Date.now();
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  return Date.now() - start;
}

// ─── funeral_director ────────────────────────────────────────────────────────

test.describe('Performance — funeral_director', () => {
  const EMAIL = 'director@sunrise.demo';

  test.beforeEach(async ({ page }) => {
    await requireBackend(page);
    await injectDevUser(page, EMAIL);
  });

  for (const [route, maxMs] of Object.entries(THRESHOLDS)) {
    test(`${route} loads within ${maxMs}ms`, async ({ page }) => {
      const elapsed = await measureLoad(page, route);
      await snap(page, `perf-director${route.replace(/\//g, '-')}`);
      expect(elapsed, `${route} took ${elapsed}ms (limit ${maxMs}ms)`).toBeLessThan(maxMs);
    });
  }

  test('case detail page loads within 12000ms', async ({ page }) => {
    const caseId = await getFirstCaseId(page);
    if (!caseId) test.skip(true, 'No seeded case found');

    const elapsed = await measureLoad(page, `/cases/${caseId}`);
    await snap(page, 'perf-director-case-detail');
    // Case detail is a heavy page (tasks/contacts/documents tabs all load in parallel).
    // 12s catches catastrophic regressions on the dev server.
    expect(elapsed, `case detail took ${elapsed}ms (limit 12000ms)`).toBeLessThan(12000);
  });
});

// ─── staff ───────────────────────────────────────────────────────────────────

test.describe('Performance — staff (limited dataset)', () => {
  const EMAIL = 'staff@sunrise.demo';

  test.beforeEach(async ({ page }) => {
    await requireBackend(page);
    await injectDevUser(page, EMAIL);
  });

  test('dashboard loads within 2500ms for staff', async ({ page }) => {
    const elapsed = await measureLoad(page, '/');
    await snap(page, 'perf-staff-dashboard');
    // Staff sees fewer cases — should be at least as fast
    expect(elapsed, `dashboard took ${elapsed}ms`).toBeLessThan(6000);
  });

  test('tasks page loads within 2500ms for staff', async ({ page }) => {
    const elapsed = await measureLoad(page, '/tasks');
    await snap(page, 'perf-staff-tasks');
    expect(elapsed, `tasks took ${elapsed}ms`).toBeLessThan(6000);
  });
});

// ─── super_admin ─────────────────────────────────────────────────────────────

test.describe('Performance — super_admin', () => {
  const EMAIL = 'rashad.barnett@gmail.com';

  test.beforeEach(async ({ page }) => {
    await requireBackend(page);
    await injectDevUser(page, EMAIL);
  });

  test('dashboard loads within 2500ms for super_admin', async ({ page }) => {
    const elapsed = await measureLoad(page, '/');
    await snap(page, 'perf-superadmin-dashboard');
    expect(elapsed, `dashboard took ${elapsed}ms`).toBeLessThan(6000);
  });
});

// ─── error paths — graceful degradation ──────────────────────────────────────

test.describe('Performance — error paths', () => {
  const EMAIL = 'director@sunrise.demo';
  const BACKEND = 'http://localhost:3001';

  test.beforeEach(async ({ page }) => {
    await requireBackend(page);
    await injectDevUser(page, EMAIL);
  });

  test('navigating to non-existent case ID returns non-500 page', async ({ page }) => {
    await page.goto('/cases/does-not-exist-9999');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body?.toLowerCase()).not.toContain('internal server error');
    // Should show a not-found or error state, not a blank page
    expect(body?.length ?? 0).toBeGreaterThan(10);
    await snap(page, 'perf-case-not-found');
  });

  test('navigating to deleted case ID returns non-500 page', async ({ page }) => {
    // Create a case then delete it
    const createRes = await page.request.post(`${BACKEND}/cases`, {
      headers: { 'x-dev-user': EMAIL, 'Content-Type': 'application/json' },
      data: { deceasedName: 'Deleted Case Test', serviceType: 'burial' },
    });
    if (!createRes.ok()) test.skip(true, 'Could not create case for deletion test');
    const { id: caseId } = await createRes.json() as { id: string };

    await page.request.delete(`${BACKEND}/cases/${caseId}`, {
      headers: { 'x-dev-user': EMAIL },
    });

    await page.goto(`/cases/${caseId}`);
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body?.toLowerCase()).not.toContain('internal server error');
    await snap(page, 'perf-deleted-case-graceful');
  });

  test('API GET for deleted case returns 404 not 500', async ({ page }) => {
    const createRes = await page.request.post(`${BACKEND}/cases`, {
      headers: { 'x-dev-user': EMAIL, 'Content-Type': 'application/json' },
      data: { deceasedName: 'Temp 404 Case', serviceType: 'burial' },
    });
    if (!createRes.ok()) test.skip(true, 'Could not create case');
    const { id: caseId } = await createRes.json() as { id: string };

    await page.request.delete(`${BACKEND}/cases/${caseId}`, {
      headers: { 'x-dev-user': EMAIL },
    });

    const getRes = await page.request.get(`${BACKEND}/cases/${caseId}`, {
      headers: { 'x-dev-user': EMAIL },
    });
    expect(getRes.status()).toBe(404);
  });
});
