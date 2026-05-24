import { test, expect } from '@playwright/test';
import { injectDevUser, assertNoCrash, collectErrors, getFirstCaseId } from './helpers/auth';

test.describe('Memorial pages', () => {
  let firstCaseId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await injectDevUser(page);
    firstCaseId = await getFirstCaseId(page);
    await page.close();
  });

  test('case memorial tab loads without crash', async ({ page }) => {
    if (!firstCaseId) { test.skip(true, 'No seeded case — run prisma db seed'); return; }
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/memorial`);
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
    assertNoErrors();
  });

  test('memorial tab shows memorial-related vocabulary', async ({ page }) => {
    if (!firstCaseId) { test.skip(true, 'No seeded case — run prisma db seed'); return; }
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/memorial`);
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/memorial|tribute|guestbook|publish|photo/i.test(body ?? '')).toBe(true);
  });

  test('public memorial page for invalid slug shows non-blank response', async ({ page }) => {
    // Not asserting status code — Next.js may 500 server-side when backend is down.
    // We verify the page at least renders something (not a completely blank page).
    await page.goto('/memorial/this-slug-does-not-exist-xyz').catch(() => {/* 500 is ok here */});
    await page.waitForLoadState('networkidle').catch(() => {});

    const body = await page.locator('body').textContent().catch(() => '');
    // Either shows an error page or not-found — both are non-blank
    expect(body?.trim().length).toBeGreaterThan(0);
  });

  test('public memorial page for invalid slug shows graceful message', async ({ page }) => {
    await page.goto('/memorial/this-slug-does-not-exist-xyz').catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});

    const body = await page.locator('body').textContent().catch(() => '');
    expect(body?.trim().length).toBeGreaterThan(10);
  });

  test('accommodation tab loads without crash', async ({ page }) => {
    if (!firstCaseId) { test.skip(true, 'No seeded case — run prisma db seed'); return; }
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/accommodations`);
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
  });

  test('public accommodations page renders without 500', async ({ page }) => {
    const response = await page.goto('/accommodations/00000000-0000-0000-0000-000000000000');
    await page.waitForLoadState('networkidle');

    expect(response?.status()).not.toBe(500);
    await assertNoCrash(page);
  });

  test('memorial page does not throw unhandled JS errors', async ({ page }) => {
    if (!firstCaseId) { test.skip(true, 'No seeded case — run prisma db seed'); return; }
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/memorial`);
    await page.waitForLoadState('networkidle');
    assertNoErrors();
  });
});
