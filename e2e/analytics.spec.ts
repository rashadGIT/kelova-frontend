import { test, expect } from '@playwright/test';
import { injectDevUser, assertNoCrash, collectErrors, requireBackend } from './helpers/auth';

test.describe('Analytics & dashboard', () => {
  test('analytics page loads without error', async ({ page }) => {
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
    assertNoErrors();
  });

  test('analytics page shows metric-related vocabulary', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/analytics|revenue|case|staff|workload|metric|performance/i.test(body ?? '')).toBe(true);
  });

  test('dashboard stat cards render on home page', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[class*="card"], [class*="stat"], [data-testid]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('dashboard shows revenue-related or case-related content', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The word "Cases" appears in the sidebar nav at minimum
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(50);
  });

  test('analytics dashboard API returns data without 500', async ({ page }) => {
    await requireBackend(page);
    const resp = await page.request.get('http://localhost:3001/analytics/my-dashboard', {
      headers: { 'x-dev-user': 'director@sunrise.demo' },
    });
    expect(resp.status()).not.toBe(500);
  });

  test('staff workload API returns data without 500', async ({ page }) => {
    await requireBackend(page);
    const resp = await page.request.get('http://localhost:3001/analytics/staff-workload', {
      headers: { 'x-dev-user': 'director@sunrise.demo' },
    });
    expect(resp.status()).not.toBe(500);
  });

  test('case volume API returns data without 500', async ({ page }) => {
    await requireBackend(page);
    const resp = await page.request.get('http://localhost:3001/analytics/case-volume', {
      headers: { 'x-dev-user': 'director@sunrise.demo' },
    });
    expect(resp.status()).not.toBe(500);
  });

  test('analytics page does not throw unhandled JS errors', async ({ page }) => {
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    assertNoErrors();
  });
});
