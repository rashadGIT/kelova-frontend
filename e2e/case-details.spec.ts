import { test, expect } from '@playwright/test';
import { injectDevUser, assertNoCrash, collectErrors, getFirstCaseId } from './helpers/auth';

/**
 * Tests for the full set of case sub-pages not covered by case-workflow.spec.ts.
 * Covers clinical/operational tabs: first-call, body-prep, cemetery, death-cert,
 * cremation-auth, arrangement, veteran-benefits, follow-ups, tracking.
 */
test.describe('Case detail sub-pages', () => {
  let firstCaseId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await injectDevUser(page);
    firstCaseId = await getFirstCaseId(page);
    await page.close();
  });

  const subPages = [
    { path: 'first-call', label: 'First call' },
    { path: 'body-preparation', label: 'Body preparation' },
    { path: 'cemetery', label: 'Cemetery' },
    { path: 'death-certificate', label: 'Death certificate' },
    { path: 'cremation-auth', label: 'Cremation auth' },
    { path: 'arrangement', label: 'Arrangement conference' },
    { path: 'veteran-benefits', label: 'Veteran benefits' },
    { path: 'follow-ups', label: 'Follow-ups' },
    { path: 'tracking', label: 'Body tracking' },
    { path: 'vendors', label: 'Vendors' },
    { path: 'packages', label: 'Packages' },
    { path: 'photos', label: 'Photos' },
  ];

  for (const { path, label } of subPages) {
    test(`${label} tab (/${path}) loads without crash`, async ({ page }) => {
      if (!firstCaseId) test.skip();
      const assertNoErrors = collectErrors(page);
      await injectDevUser(page);
      await page.goto(`/cases/${firstCaseId}/${path}`);
      await page.waitForLoadState('networkidle');

      await assertNoCrash(page);
      assertNoErrors();
    });
  }

  test('first-call tab shows removal-related vocabulary', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/first-call`);
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/first.call|removal|transfer|instruction|location/i.test(body ?? '')).toBe(true);
  });

  test('death certificate tab shows cert-related vocabulary', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/death-certificate`);
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/death.cert|certificate|filing|edrs|state/i.test(body ?? '')).toBe(true);
  });

  test('follow-ups tab shows grief follow-up vocabulary', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/follow-ups`);
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/follow.up|grief|week|month|year|schedule/i.test(body ?? '')).toBe(true);
  });

  test('tracking tab shows chain-of-custody vocabulary', async ({ page }) => {
    if (!firstCaseId) test.skip();
    await injectDevUser(page);
    await page.goto(`/cases/${firstCaseId}/tracking`);
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').textContent();
    expect(/track|scan|location|custody|status|qr/i.test(body ?? '')).toBe(true);
  });
});
