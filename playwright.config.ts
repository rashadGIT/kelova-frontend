import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // run sequentially so watched tests are readable
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // single browser window so tests are watchable
  reporter: process.env.CI ? 'github' : 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    // Reuse auth state saved by global-setup (cookie + localStorage)
    storageState: 'e2e/.auth/user.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
      // Disables the Next.js middleware auth redirect for E2E tests.
      // The backend still validates requests; use DEV_AUTH_BYPASS=true there too.
      NEXT_PUBLIC_DEV_AUTH_BYPASS: 'true',
    },
  },
});
