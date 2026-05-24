import { test, expect } from '@playwright/test';
import { injectDevUser, assertNoCrash, collectErrors, getFirstCaseId } from './helpers/auth';

test.describe('Payment flow', () => {
  let firstCaseId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await injectDevUser(page);
    firstCaseId = await getFirstCaseId(page);
    await page.close();
  });

  test('payments page renders for seeded case', async ({ page }) => {
    if (!firstCaseId) test.skip();
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/payments`);
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
    assertNoErrors();
  });

  test('payments page contains financial vocabulary', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/payments`);
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/payment|balance|amount|invoice|total|\$/i.test(body ?? '')).toBe(true);
  });

  test('payment form or record button is accessible', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/payments`);
    await page.waitForLoadState('networkidle');

    const payBtn = page
      .getByRole('button', { name: /record|payment|add|pay/i })
      .or(page.getByRole('link', { name: /payment/i }))
      .first();

    const isVisible = await payBtn.isVisible().catch(() => false);
    if (isVisible) {
      await payBtn.focus();
      const focused = await payBtn.evaluate((el) => el === document.activeElement);
      expect(focused).toBe(true);
    }
    await assertNoCrash(page);
  });

  test('payment plans tab loads without crash', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/payment-plans`);
    await page.waitForLoadState('networkidle');
    await assertNoCrash(page);
  });

  test('dashboard shows revenue-related content', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    const hasContent = /revenue|case|task|\$/i.test(body ?? '');
    expect(hasContent).toBe(true);
  });

  test('payments page does not throw unhandled JS errors', async ({ page }) => {
    if (!firstCaseId) test.skip();
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/payments`);
    await page.waitForLoadState('networkidle');
    assertNoErrors();
  });
});
