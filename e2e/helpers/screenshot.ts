import { Page } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

/**
 * Captures a full-page screenshot at a named step.
 * Files land in e2e/screenshots/ which is gitignored.
 * Use for auditing CRUD flows — review them after a run to confirm the UI looked right.
 */
export async function snap(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${name}-${timestamp}.png`),
    fullPage: true,
  });
}
