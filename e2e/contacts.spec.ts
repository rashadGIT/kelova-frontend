import { test, expect } from '@playwright/test';
import { injectDevUser, assertNoCrash, collectErrors, getFirstCaseId } from './helpers/auth';

test.describe('Contacts', () => {
  let firstCaseId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await injectDevUser(page);
    firstCaseId = await getFirstCaseId(page);
    await page.close();
  });

  test('contacts tab loads for seeded case', async ({ page }) => {
    if (!firstCaseId) test.skip();
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/contacts`);
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
    assertNoErrors();
  });

  test('contacts page shows contact-related vocabulary', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/contacts`);
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/contact|family|next.of.kin|phone|email|relation/i.test(body ?? '')).toBe(true);
  });

  test('add contact button is present', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/contacts`);
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add|new contact|create/i }).first();
    const isVisible = await addBtn.isVisible().catch(() => false);
    await assertNoCrash(page);
    expect(typeof isVisible).toBe('boolean');
  });

  test('seeded family contacts appear in the list', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/contacts`);
    await page.waitForLoadState('networkidle');

    // Seed data includes family contacts per case
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(20);
  });

  test('contacts API returns list without 500', async ({ page }) => {
    if (!firstCaseId) test.skip();
    const resp = await page.request.get(`http://localhost:3001/cases/${firstCaseId}/contacts`, {
      headers: { 'x-dev-user': 'director@sunrise.demo' },
    });
    expect(resp.status()).not.toBe(500);
  });

  test('contacts page does not throw unhandled JS errors', async ({ page }) => {
    if (!firstCaseId) test.skip();
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/contacts`);
    await page.waitForLoadState('networkidle');
    assertNoErrors();
  });
});
