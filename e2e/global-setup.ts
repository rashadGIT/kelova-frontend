import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BACKEND = 'http://localhost:3001';
const DIRECTOR_EMAIL = 'director@sunrise.demo';

interface CreatedUser { id: string; email: string }

async function globalSetup(_config: FullConfig) {
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  // Ensure screenshots directory exists
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

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

  // Create dedicated E2E test users so CRUD tests don't pollute demo data.
  // Skipped gracefully if the backend isn't running (smoke-only mode).
  await createE2EUsers(authDir);
}

async function createE2EUsers(authDir: string): Promise<void> {
  try {
    const health = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(3000) });
    if (!health.ok) return;
  } catch {
    return; // backend not running — skip
  }

  const usersToCreate = [
    { email: 'e2e-director@test.vigil', name: 'E2E Director', role: 'funeral_director' },
    { email: 'e2e-staff@test.vigil', name: 'E2E Staff', role: 'staff' },
  ];

  const created: CreatedUser[] = [];

  for (const u of usersToCreate) {
    try {
      const res = await fetch(`${BACKEND}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-user': DIRECTOR_EMAIL,
        },
        body: JSON.stringify({ ...u, temporaryPassword: 'TempPassE2E2026!' }),
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json() as { id: string };
        created.push({ id: data.id, email: u.email });
      } else if (res.status === 409) {
        // User already exists from a previous run — look up their ID
        const listRes = await fetch(`${BACKEND}/users`, {
          headers: { 'x-dev-user': DIRECTOR_EMAIL },
          signal: AbortSignal.timeout(5000),
        });
        if (listRes.ok) {
          const users = await listRes.json() as { id: string; email: string }[];
          const existing = users.find((usr) => usr.email === u.email);
          if (existing) created.push({ id: existing.id, email: u.email });
        }
      }
    } catch {
      // Non-fatal — individual user creation failure doesn't block the suite
    }
  }

  if (created.length > 0) {
    fs.writeFileSync(
      path.join(authDir, 'e2e-users.json'),
      JSON.stringify(created, null, 2),
    );
  }
}

export default globalSetup;
