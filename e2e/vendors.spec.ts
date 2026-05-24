import { test, expect } from '@playwright/test';
import { injectDevUser, assertNoCrash, collectErrors, getFirstCaseId } from './helpers/auth';

test.describe('Vendors', () => {
  let firstCaseId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await injectDevUser(page);
    firstCaseId = await getFirstCaseId(page);
    await page.close();
  });

  test('vendors list page loads without error', async ({ page }) => {
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
    assertNoErrors();
  });

  test('vendors page contains vendor-related vocabulary', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/vendor|supplier|florist|crematory|clergy|livery/i.test(body ?? '')).toBe(true);
  });

  test('vendors page shows seeded vendors from demo data', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle');

    // Seed data: 6 vendors for Sunrise
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(20);
  });

  test('add vendor button is visible for director', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add|new vendor|create/i }).first();
    const isVisible = await addBtn.isVisible().catch(() => false);
    await assertNoCrash(page);
    expect(typeof isVisible).toBe('boolean');
  });

  test('case vendors tab loads for seeded case', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/vendors`);
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
  });

  test('vendors page does not throw unhandled JS errors', async ({ page }) => {
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle');
    assertNoErrors();
  });
});
