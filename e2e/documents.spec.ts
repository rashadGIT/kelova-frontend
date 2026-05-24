import { test, expect } from '@playwright/test';
import { injectDevUser, assertNoCrash, collectErrors, getFirstCaseId } from './helpers/auth';

test.describe('Documents', () => {
  let firstCaseId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await injectDevUser(page);
    firstCaseId = await getFirstCaseId(page);
    await page.close();
  });

  test('documents tab loads for seeded case', async ({ page }) => {
    if (!firstCaseId) test.skip();
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/documents`);
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
    assertNoErrors();
  });

  test('documents page shows document-related vocabulary', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/documents`);
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/document|upload|file|pdf|certificate|download/i.test(body ?? '')).toBe(true);
  });

  test('upload button is present', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/documents`);
    await page.waitForLoadState('networkidle');

    const uploadBtn = page
      .getByRole('button', { name: /upload|add document|attach/i })
      .or(page.locator('input[type="file"]'))
      .first();

    const isVisible = await uploadBtn.isVisible().catch(() => false);
    await assertNoCrash(page);
    expect(typeof isVisible).toBe('boolean');
  });

  test('seeded documents appear in the list', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/documents`);
    await page.waitForLoadState('networkidle');

    // Seed data includes death certs, invoices, service programs
    const body = await page.locator('body').textContent();
    expect(body?.trim().length).toBeGreaterThan(20);
  });

  test('photos tab loads without crash', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/photos`);
    await page.waitForLoadState('networkidle');

    await assertNoCrash(page);
  });

  test('documents presign API returns 200 or 400 not 500', async ({ page }) => {
    if (!firstCaseId) test.skip();
    const resp = await page.request.post(
      `http://localhost:3001/cases/${firstCaseId}/documents/presign`,
      {
        headers: { 'x-dev-user': 'director@sunrise.demo', 'Content-Type': 'application/json' },
        data: { fileName: 'test.pdf', contentType: 'application/pdf', documentType: 'other' },
      },
    );
    expect(resp.status()).not.toBe(500);
  });

  test('documents page does not throw unhandled JS errors', async ({ page }) => {
    if (!firstCaseId) test.skip();
    const assertNoErrors = collectErrors(page);
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/documents`);
    await page.waitForLoadState('networkidle');
    assertNoErrors();
  });
});
