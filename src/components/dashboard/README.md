# src/components/dashboard

Components rendered on the dashboard home page (`/`). Both are client components (`'use client'`).

## Components

### `StatCard`

Metric tile for KPI display.

**Props**

| Prop          | Type                     | Required | Description                                                        |
| ------------- | ------------------------ | -------- | ------------------------------------------------------------------ |
| `title`       | `string`                 | yes      | Label shown above the value                                        |
| `value`       | `number \| undefined`    | yes      | Numeric value to display                                           |
| `icon`        | `LucideIcon`             | yes      | Icon shown in the top-right corner                                 |
| `format`      | `'number' \| 'currency'` | no       | `'currency'` formats as USD, no decimals. Defaults to `'number'`.  |
| `delta`       | `number`                 | no       | Shows a trend indicator (up/down arrow + count) below the value    |
| `description` | `string`                 | no       | Secondary caption below the value                                  |
| `href`        | `string`                 | no       | When provided, wraps the card in a `<Link>` and adds hover styling |
| `loading`     | `boolean`                | no       | Renders a `<Skeleton>` in place of the value                       |

Dashboard home currently renders four `StatCard` instances: Active Cases, MTD Revenue, Tasks Due, and Follow-Ups.

### `RecentCasesTable`

Displays the 5 most recently updated active cases.

- Fetches via `getRecentCases()` from `src/lib/api/dashboard.ts` (`GET /cases`).
- TanStack Query key: `['recent-cases']`.
- **Columns**: Deceased, Status (`CaseStatusBadge`), Assigned (hidden on mobile), Last Updated (hidden on mobile).
- Clicking a row navigates to `/cases/:id`.
- **Empty state**: shows a "Copy Intake Link" button that copies the tenant's public intake URL to the clipboard using the Sonner toast library.
- A "View all cases" link at the bottom navigates to `/cases`.

## Data Source

Both components depend on `src/lib/api/dashboard.ts`:

| Function              | Endpoint           | Used by                             |
| --------------------- | ------------------ | ----------------------------------- |
| `getDashboardStats()` | `GET /cases/stats` | `StatCard` (via the dashboard page) |
| `getRecentCases()`    | `GET /cases`       | `RecentCasesTable`                  |
