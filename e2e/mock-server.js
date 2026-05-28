/**
 * Lightweight mock backend for E2E tests.
 *
 * Serves on port 3001 so the Next.js app (NEXT_PUBLIC_API_URL=http://localhost:3001)
 * has a real HTTP server to call during Playwright runs — no live backend required.
 *
 * Design choices:
 * - GET /health → 404  so requireBackend() / isBackendUp() returns false and all
 *   CRUD/smoke tests skip gracefully. Only intake/preplanning routes are mocked.
 * - GET /         → 200  so Playwright's webServer.url readiness check passes.
 * - All other routes → 404 (tests that need a real backend will skip via requireBackend).
 */

const http = require('http');

const KNOWN_TENANTS = {
  sunrise: {
    tenantName: 'Sunrise Funeral Home',
    tenantSlug: 'sunrise',
    slug: 'sunrise',
  },
};

function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(status);
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const { method } = req;
  const pathname = (req.url ?? '/').split('?')[0];

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-dev-user, x-tenant-id, x-internal-secret');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Readiness probe for Playwright webServer.url check
  if (pathname === '/') {
    json(res, 200, { service: 'mock-backend', ready: true });
    return;
  }

  // /health → 404 so requireBackend() returns false and CRUD/smoke tests skip
  if (pathname === '/health') {
    json(res, 404, { message: 'mock-server: backend-dependent tests will skip' });
    return;
  }

  // GET /intake/:slug — fetch tenant info (called by IntakeForm on mount)
  const intakeSlug = pathname.match(/^\/intake\/([^/]+)$/);
  if (intakeSlug) {
    const slug = intakeSlug[1];
    if (method === 'GET') {
      const tenant = KNOWN_TENANTS[slug];
      if (tenant) {
        json(res, 200, tenant);
      } else {
        json(res, 404, { message: 'Tenant not found' });
      }
      return;
    }

    if (method === 'POST') {
      json(res, 201, {
        caseId: `mock-case-${Date.now()}`,
        familyAccessToken: 'mock-family-access-token',
        signatureTokens: [],
      });
      return;
    }
  }

  // GET /preplanning/:slug — fetch tenant info for preplanning form
  const preplanningSlug = pathname.match(/^\/preplanning\/([^/]+)$/);
  if (preplanningSlug && method === 'GET') {
    const slug = preplanningSlug[1];
    const tenant = KNOWN_TENANTS[slug];
    if (tenant) {
      json(res, 200, tenant);
    } else {
      json(res, 404, { message: 'Tenant not found' });
    }
    return;
  }

  // POST /sign/:token/intent and POST /sign/:token
  if (pathname.match(/^\/sign\//) && method === 'POST') {
    json(res, 200, { ok: true });
    return;
  }

  // Everything else → 404 (triggers graceful skip in requireBackend tests)
  json(res, 404, { message: 'Not found' });
});

const PORT = 3001;
server.listen(PORT, () => {
  process.stdout.write(`Mock backend listening on http://localhost:${PORT}\n`);
});
