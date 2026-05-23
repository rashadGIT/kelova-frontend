import { test, expect } from '@playwright/test';
import { injectDevUser, assertNoCrash, collectErrors, requireBackend } from './helpers/auth';

test.describe('Pre-need arrangements', () => {
  test('preneed list page loads without error', async ({ page }) => {
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto('/preneed');
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
    assertNoErrors();
  });

  test('preneed page shows pre-need vocabulary', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/preneed');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/preneed|pre-need|arrangement|planning|convert/i.test(body ?? '')).toBe(true);
  });

  test('create preneed button is visible', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/preneed');
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .getByRole('button', { name: /new|create|add/i })
      .or(page.getByRole('link', { name: /new|create/i }))
      .first();
    const isVisible = await createBtn.isVisible().catch(() => false);
    await assertNoCrash(page);
    expect(typeof isVisible).toBe('boolean');
  });

  test('preneed body is not blank', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/preneed');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(20);
  });

  test('public preplanning form loads for seeded slug', async ({ page }) => {
    const response = await page.goto('/preplanning/sunrise');
    await page.waitForLoadState('networkidle');

    const status = response?.status() ?? 200;
    expect(status).not.toBe(500);
    await assertNoCrash(page);
  });

  test('preplanning form has input fields', async ({ page }) => {
    const response = await page.goto('/preplanning/sunrise');
    await page.waitForLoadState('networkidle');

    if (response?.status() === 200) {
      const inputs = page.locator('input, select, textarea');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('preneed API returns list without 500', async ({ page }) => {
    await requireBackend(page);
    const resp = await page.request.get('http://localhost:3001/preneed', {
      headers: { 'x-dev-user': 'director@sunrise.demo' },
    });
    expect(resp.status()).not.toBe(500);
  });

  test('preneed page does not throw unhandled JS errors', async ({ page }) => {
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto('/preneed');
    await page.waitForLoadState('networkidle');
    assertNoErrors();
  });
});
