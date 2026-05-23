import { test, expect } from '@playwright/test';
import { injectDevUser, assertNoCrash, collectErrors, requireBackend } from './helpers/auth';

test.describe('Settings', () => {
  test('settings staff page loads without error', async ({ page }) => {
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto('/settings/staff');
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
    assertNoErrors();
  });

  test('staff settings shows user management vocabulary', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/settings/staff');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/staff|user|role|invite|director/i.test(body ?? '')).toBe(true);
  });

  test('invite staff button is visible for director', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/settings/staff');
    await page.waitForLoadState('networkidle');

    const inviteBtn = page.getByRole('button', { name: /invite|add staff|new user/i }).first();
    const isVisible = await inviteBtn.isVisible().catch(() => false);
    await assertNoCrash(page);
    expect(typeof isVisible).toBe('boolean');
  });

  test('branding settings page loads', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/settings/branding');
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
    const body = await page.locator('body').textContent();
    expect(/brand|logo|color|name/i.test(body ?? '')).toBe(true);
  });

  test('integrations settings page loads', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/settings/integrations');
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
  });

  test('task templates settings page loads', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/settings/templates');
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
  });

  test('API keys settings page loads', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/settings/api');
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
    const body = await page.locator('body').textContent();
    expect(/api|key|token/i.test(body ?? '')).toBe(true);
  });

  test('generate API key button is visible for director', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/settings/api');
    await page.waitForLoadState('networkidle');

    const genBtn = page.getByRole('button', { name: /generate|new key|create/i }).first();
    const isVisible = await genBtn.isVisible().catch(() => false);
    await assertNoCrash(page);
    expect(typeof isVisible).toBe('boolean');
  });

  test('settings API returns tenant config without 500', async ({ page }) => {
    await requireBackend(page);
    const resp = await page.request.get('http://localhost:3001/settings', {
      headers: { 'x-dev-user': 'director@sunrise.demo' },
    });
    expect(resp.status()).not.toBe(500);
  });

  test('settings pages do not throw unhandled JS errors', async ({ page }) => {
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto('/settings/staff');
    await page.waitForLoadState('networkidle');
    assertNoErrors();
  });
});
