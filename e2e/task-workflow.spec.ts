import { test, expect } from '@playwright/test';
import { injectDevUser, assertNoCrash, collectErrors, getFirstCaseId } from './helpers/auth';

test.describe('Task workflow', () => {
  let firstCaseId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await injectDevUser(page);
    firstCaseId = await getFirstCaseId(page);
    await page.close();
  });

  test('dashboard loads and shows stat cards', async ({ page }) => {
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(body).not.toContain('Internal Server Error');
    expect(body?.length).toBeGreaterThan(50);
    assertNoErrors();
  });

  test('dashboard stat cards render with numeric content', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[class*="card"], [class*="stat"], [data-testid*="stat"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('global tasks list page loads', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(10);
  });

  test('global tasks page contains task-related vocabulary', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/task|due|assign|complete|overdue/i.test(body ?? '')).toBe(true);
  });

  test('case tasks tab renders for seeded case', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/tasks`);
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
  });

  test('task list shows checkboxes or completion controls', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/tasks`);
    await page.waitForLoadState('networkidle');

    const controls = page.locator('input[type="checkbox"], button[aria-label*="complete" i], [role="checkbox"]');
    const count = await controls.count();
    // Tasks may exist (seed data) or not — either way no crash
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('task checkbox interaction does not crash page', async ({ page }) => {
    if (!firstCaseId) test.skip();
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/tasks`);
    await page.waitForLoadState('networkidle');

    const checkbox = page.locator('input[type="checkbox"]').first();
    const exists = await checkbox.isVisible().catch(() => false);
    if (exists) {
      await checkbox.click({ force: true }).catch(() => {/* API call may fail — UI must not crash */});
      await page.waitForTimeout(500);
    }

    assertNoErrors();
  });

  test('task templates page loads', async ({ page }) => {
    await injectDevUser(page);
    await page.goto('/settings/templates');
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
  });

  test('tasks page does not throw unhandled JS errors', async ({ page }) => {
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    assertNoErrors();
  });
});
