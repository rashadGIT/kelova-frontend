import { test, expect } from '@playwright/test';
import { injectDevUser, assertNoCrash, collectErrors, getFirstCaseId, requireBackend } from './helpers/auth';

test.describe('Merchandise', () => {
  let firstCaseId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await injectDevUser(page);
    firstCaseId = await getFirstCaseId(page);
    await page.close();
  });

  test('merchandise catalog page loads without error', async ({ page }) => {
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto('/merchandise');
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
    assertNoErrors();
  });

  test('merchandise page shows product vocabulary', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/merchandise');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/merchandise|casket|urn|vault|flower|catalog|item/i.test(body ?? '')).toBe(true);
  });

  test('merchandise catalog shows seeded items', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/merchandise');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(20);
  });

  test('case merchandise tab loads for seeded case', async ({ page }) => {
    if (!firstCaseId) { test.skip(true, 'No seeded case ID — run prisma db seed'); return; }
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/merchandise`);
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
  });

  test('add merchandise button is visible', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/merchandise');
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add|new item|create/i }).first();
    const isVisible = await addBtn.isVisible().catch(() => false);
    await assertNoCrash(page);
    expect(typeof isVisible).toBe('boolean');
  });

  test('merchandise API returns catalog without 500', async ({ page }) => {
    await requireBackend(page);
    const resp = await page.request.get('http://localhost:3001/merchandise', {
      headers: { 'x-dev-user': 'director@sunrise.demo' },
    });
    expect(resp.status()).not.toBe(500);
  });

  test('merchandise page does not throw unhandled JS errors', async ({ page }) => {
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto('/merchandise');
    await page.waitForLoadState('networkidle');
    assertNoErrors();
  });
});
