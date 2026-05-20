# src/lib

Shared utilities, API clients, auth configuration, and state store. Nothing in this directory renders UI.

## API Clients (`api/`)

### `api/client.ts` — authenticated Axios instance

Used by all dashboard and staff-facing API calls.

- Sets `baseURL` from `NEXT_PUBLIC_API_URL` (falls back to `http://localhost:3001`).
- Reads the Cognito access token from `localStorage` (`CognitoIdentityServiceProvider.<clientId>.<sub>.accessToken`) and attaches it as a `Bearer` token on every request.
- When `NEXT_PUBLIC_DEV_AUTH_BYPASS=true` (and `NODE_ENV !== production`), injects `x-dev-user` and a stub `Authorization` header instead of reading from localStorage.
- **401 interceptor**: clears the Zustand auth store and redirects to `/login?next=<current-path>`.

### `api/public-client.ts` — unauthenticated Axios instance

Used by intake, signature, and memorial routes. No `Authorization` header. No `withCredentials`.

### `api/server.ts` — server-side fetch helper

`serverFetch<T>(path, options?)` — wraps the native `fetch` API for use in Next.js Server Components. Reads `access_token` from the request cookie store via `next/headers`. Throws on non-OK responses. Always sets `cache: 'no-store'`.

### Domain modules

Each module exports typed async functions that call `apiClient` (or `publicApiClient` where appropriate).

| Module                 | Key exports                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- |
| `auth.ts`              | `getMe()`, `signOut()`                                                        |
| `cases.ts`             | `getCases(filters?)`, `getCase(id)`, `createCase(dto)`, `updateCase(id, dto)` |
| `contacts.ts`          | `getContacts(caseId)`, `createContact(dto)`                                   |
| `tasks.ts`             | `getTasks(caseId)`, `updateTask(id, dto)`                                     |
| `documents.ts`         | `getDocuments(caseId)`, `getUploadUrl(dto)`, `createDocument(dto)`            |
| `payments.ts`          | `getPayments(caseId)`, `createPayment(dto)`                                   |
| `signatures.ts`        | `getSignatures(caseId)`, `signDocument(token, dto)`                           |
| `vendors.ts`           | `getVendors()`, `createVendor(dto)`                                           |
| `price-list.ts`        | `getPriceList()`, `updatePriceListItem(id, dto)`                              |
| `calendar.ts`          | `getCalendarEvents(range)`                                                    |
| `cemetery.ts`          | `getCemeteryInfo(caseId)`, `updateCemeteryInfo(caseId, dto)`                  |
| `death-certificate.ts` | `getDeathCertificate(caseId)`, `updateDeathCertificate(caseId, dto)`          |
| `cremation-auth.ts`    | `getCremationAuth(caseId)`, `updateCremationAuth(caseId, dto)`                |
| `dashboard.ts`         | `getDashboardStats()` → `GET /cases/stats`, `getRecentCases()` → `GET /cases` |
| `revenue.ts`           | Revenue aggregation helpers                                                   |
| `merchandise.ts`       | `getMerchandise()`, `createMerchandise(dto)`                                  |
| `preneed.ts`           | `getPreneedCases()`, `createPreneedCase(dto)`                                 |
| `intake.ts`            | `submitIntake(slug, dto)` — uses `publicApiClient`                            |

> `analytics.ts`, `obituaries.ts`, and `follow-ups.ts` referenced in earlier specs are handled via `dashboard.ts`, `cases.ts`, and `tasks.ts` respectively in the current implementation. Check `lib/api/` for the authoritative file list.

## Auth (`auth/`)

### `auth/amplify-config.ts`

Exports `configureAmplify()`. Called once in `app/layout.tsx` via `AmplifyClientConfig`. Configures `aws-amplify` with the Cognito User Pool ID, Client ID, and OAuth settings (domain, scopes, redirect URIs) from environment variables. Is a no-op when `NEXT_PUBLIC_DEV_AUTH_BYPASS=true` — Cognito is never contacted in dev bypass mode.

## State Store (`store/`)

### `store/auth.store.ts`

Zustand store with `persist` middleware (key: `vigil-user`, `skipHydration: true`).

```ts
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string; // 'super_admin' | 'funeral_director' | 'staff'
  tenantId: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
}
```

The access token is **not stored here**. It lives in Cognito's localStorage keys and is read per-request by `apiClient`. This store holds display metadata only (name, email, role, tenantId).

`skipHydration: true` means the store does not auto-rehydrate on load — `AuthInitializer` calls `useAuthStore.persist.rehydrate()` manually before refreshing from the API.

## Utilities (`utils/`)

### `utils/cn.ts`

`cn(...inputs)` — merges class names using `clsx` + `tailwind-merge`. Resolves Tailwind conflicts (e.g., `p-2 p-4` → `p-4`).

### `utils/format-date.ts`

Date formatting helpers used across the UI.

| Export                 | Purpose                                                       |
| ---------------------- | ------------------------------------------------------------- |
| `formatRelative(date)` | Returns a human-readable relative string (e.g., "3 days ago") |
| Additional helpers     | Check the file for any project-specific formatters            |
