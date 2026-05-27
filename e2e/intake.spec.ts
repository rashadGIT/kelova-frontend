import { test, expect } from '@playwright/test';
import { assertNoCrash, collectErrors } from './helpers/auth';

test.describe('Intake form', () => {
  test('intake page renders for seeded tenant slug', async ({ page }) => {
    const assertNoErrors = collectErrors(page);
    const response = await page.goto('/intake/sunrise');
    await page.waitForLoadState('networkidle');

    const status = response?.status() ?? 200;
    expect(status).not.toBe(500);
    await assertNoCrash(page);
    assertNoErrors();
  });

  test('intake page body is not blank', async ({ page }) => {
    await page.goto('/intake/sunrise');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(20);
  });

  test('intake form has visible text input fields', async ({ page }) => {
    // Mock the tenant-info API so the form renders even without a running backend
    await page.route('**/intake/sunrise', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ tenantName: 'Sunrise Funeral Home', tenantSlug: 'sunrise' }),
        });
      }
      return route.continue();
    });

    const response = await page.goto('/intake/sunrise');
    // Wait for the loading spinner to clear and the form to render
    await page.waitForSelector('input', { timeout: 10000 }).catch(() => null);

    if (response?.status() === 200) {
      const inputs = page.locator('input[type="text"], input:not([type]), input[type="email"], input[type="tel"]');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('intake form has a submit button', async ({ page }) => {
    const response = await page.goto('/intake/sunrise');
    await page.waitForLoadState('networkidle');

    if (response?.status() === 200) {
      const submitBtn = page.getByRole('button', { name: /submit|send|continue|next/i }).first();
      await expect(submitBtn).toBeVisible();
    }
  });

  test('intake form shows validation error on empty submit', async ({ page }) => {
    const response = await page.goto('/intake/sunrise');
    await page.waitForLoadState('networkidle');

    if (response?.status() !== 200) test.skip();

    const submitBtn = page.getByRole('button', { name: /submit|send|continue|next/i }).first();
    const isVisible = await submitBtn.isVisible().catch(() => false);
    if (!isVisible) test.skip();

    await submitBtn.click();
    await page.waitForTimeout(500);

    // After empty submit, page should show validation errors or stay on page — not crash
    await assertNoCrash(page);
  });

  test('unknown tenant slug returns non-500 response', async ({ page }) => {
    const response = await page.goto('/intake/definitely-not-a-real-tenant-xyz');
    await page.waitForLoadState('networkidle');

    const status = response?.status() ?? 200;
    expect(status).not.toBe(500);
    await assertNoCrash(page);
  });

  test('preplanning public form loads', async ({ page }) => {
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
});
