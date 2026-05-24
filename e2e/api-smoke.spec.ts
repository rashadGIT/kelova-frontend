/**
 * API smoke tests — hit backend endpoints directly via Playwright's request API.
 * These run without a browser window and verify the backend responds correctly
 * with DEV_AUTH_BYPASS=true. Requires backend running on localhost:3001.
 */
import { test, expect } from '@playwright/test';

const DEV_HEADERS = { 'x-dev-user': 'director@sunrise.demo' };
const BASE = 'http://localhost:3001';

async function isBackendUp(request: import('@playwright/test').APIRequestContext): Promise<boolean> {
  try {
    const resp = await request.get(`${BASE}/health`, { timeout: 3000 });
    return resp.ok();
  } catch {
    return false;
  }
}

test.describe('Backend API smoke tests', () => {
  test('health check returns 200', async ({ request }) => {
    const up = await isBackendUp(request);
    if (!up) { test.skip(true, 'Backend not running on localhost:3001'); return; }

    const resp = await request.get(`${BASE}/health`);
    expect(resp.status()).toBe(200);
  });

  test('GET /cases returns 200 with dev bypass', async ({ request }) => {
    const up = await isBackendUp(request);
    if (!up) { test.skip(true, 'Backend not running on localhost:3001'); return; }

    const resp = await request.get(`${BASE}/cases`, { headers: DEV_HEADERS });
    expect(resp.status()).toBe(200);
  });

  test('GET /tasks returns 200 with dev bypass', async ({ request }) => {
    const up = await isBackendUp(request);
    if (!up) { test.skip(true, 'Backend not running on localhost:3001'); return; }

    const resp = await request.get(`${BASE}/tasks`, { headers: DEV_HEADERS });
    expect(resp.status()).toBe(200);
  });

  test('GET /vendors returns 200 with dev bypass', async ({ request }) => {
    const up = await isBackendUp(request);
    if (!up) { test.skip(true, 'Backend not running on localhost:3001'); return; }

    const resp = await request.get(`${BASE}/vendors`, { headers: DEV_HEADERS });
    expect(resp.status()).toBe(200);
  });

  test('GET /merchandise returns 200 with dev bypass', async ({ request }) => {
    const up = await isBackendUp(request);
    if (!up) { test.skip(true, 'Backend not running on localhost:3001'); return; }

    const resp = await request.get(`${BASE}/merchandise`, { headers: DEV_HEADERS });
    expect(resp.status()).toBe(200);
  });

  test('GET /price-list returns 200 with dev bypass', async ({ request }) => {
    const up = await isBackendUp(request);
    if (!up) { test.skip(true, 'Backend not running on localhost:3001'); return; }

    const resp = await request.get(`${BASE}/price-list`, { headers: DEV_HEADERS });
    expect(resp.status()).toBe(200);
  });

  test('GET /calendar/events returns 200 with dev bypass', async ({ request }) => {
    const up = await isBackendUp(request);
    if (!up) { test.skip(true, 'Backend not running on localhost:3001'); return; }

    const resp = await request.get(`${BASE}/calendar/events?from=2024-01-01&to=2026-12-31`, {
      headers: DEV_HEADERS,
    });
    expect(resp.status()).toBe(200);
  });

  test('GET /preneed returns 200 with dev bypass', async ({ request }) => {
    const up = await isBackendUp(request);
    if (!up) { test.skip(true, 'Backend not running on localhost:3001'); return; }

    const resp = await request.get(`${BASE}/preneed`, { headers: DEV_HEADERS });
    expect(resp.status()).toBe(200);
  });

  test('GET /settings returns 200 with dev bypass', async ({ request }) => {
    const up = await isBackendUp(request);
    if (!up) { test.skip(true, 'Backend not running on localhost:3001'); return; }

    const resp = await request.get(`${BASE}/settings`, { headers: DEV_HEADERS });
    expect(resp.status()).toBe(200);
  });

  test('GET /analytics/my-dashboard returns 200 with dev bypass', async ({ request }) => {
    const up = await isBackendUp(request);
    if (!up) { test.skip(true, 'Backend not running on localhost:3001'); return; }

    const resp = await request.get(`${BASE}/analytics/my-dashboard`, { headers: DEV_HEADERS });
    expect(resp.status()).toBe(200);
  });

  test('GET /users returns 200 with dev bypass', async ({ request }) => {
    const up = await isBackendUp(request);
    if (!up) { test.skip(true, 'Backend not running on localhost:3001'); return; }

    const resp = await request.get(`${BASE}/users`, { headers: DEV_HEADERS });
    expect(resp.status()).toBe(200);
  });

  test('GET /task-templates returns 200 with dev bypass', async ({ request }) => {
    const up = await isBackendUp(request);
    if (!up) { test.skip(true, 'Backend not running on localhost:3001'); return; }

    const resp = await request.get(`${BASE}/task-templates`, { headers: DEV_HEADERS });
    expect(resp.status()).toBe(200);
  });

  test('unauthenticated request to /cases returns non-500', async ({ request }) => {
    const up = await isBackendUp(request);
    if (!up) { test.skip(true, 'Backend not running on localhost:3001'); return; }

    // DEV_AUTH_BYPASS falls back to a default seeded user, so we can't assert 401 in dev.
    // Just verify the endpoint doesn't crash (no 500).
    const resp = await request.get(`${BASE}/cases`);
    expect(resp.status()).not.toBe(500);
  });
});
