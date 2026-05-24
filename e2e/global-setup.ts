import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Runs once before the entire test suite.
 * Sets a fake access_token cookie so the Next.js middleware auth check passes.
 * The backend must be running with DEV_AUTH_BYPASS=true for API calls to work.
 */
async function globalSetup(_config: FullConfig) {
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Set a fake access_token cookie so Next.js middleware lets pages render.
  // Value is arbitrary — DEV_AUTH_BYPASS=true on the backend skips JWT validation.
  await context.addCookies([
    {
      name: 'access_token',
      value: 'dev-bypass-token',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Save to disk so all test workers can reuse the auth state
  await context.storageState({ path: path.join(authDir, 'user.json') });

  await browser.close();
}

export default globalSetup;
