# src/components/cases

Components for case listing, detail, and creation. All components are client components (`'use client'`). Data is fetched via TanStack Query using hooks defined in `src/lib/api/cases.ts`.

## Components

### `CaseTable`

Full case list with server-filtered results and client-side sorting and pagination.

- Built on `@tanstack/react-table` (`useReactTable`, `getCoreRowModel`, `getSortedRowModel`, `getPaginationRowModel`).
- **Columns**: Deceased name (sortable), Status (`CaseStatusBadge`), Assigned staff, Last updated (sortable). An additional "Overdue Tasks" column is injected when `filter === 'overdue'`.
- **Filter prop**: accepts `'active' | 'overdue' | 'this-month' | 'pending-signatures'` — passed to `getCases(filters)` as a `dashboardFilter` query param.
- **Pagination**: configurable page size (10 / 25 / 50 per page) via a `<Select>`. Previous/Next buttons appear only when there are more rows than the current page size.
- Clicking a row navigates to `/cases/:id` via `useRouter`.
- Skeleton loading state and an empty state with intake link copy prompt are both handled.
- TanStack Query key: `['cases', filter]`.

### `CaseStatusBadge`

Color-coded badge for `CaseStatus` enum values. Renders a `<Badge>` with a variant mapped to each status.

### `CaseOverview`

Summary panel displayed at the top of `/cases/:id`. Shows decedent name, case status, service stage, primary family contact, and assigned staff member.

### `CreateCaseForm`

New case creation form.

- Form state managed with `react-hook-form`.
- Schema validated with Zod.
- On submit: calls `POST /cases` via `apiClient`.
- On success: redirects to `/cases/:id` for the newly created case.

### `CaseWorkspaceTabs`

Tab navigation bar rendered within the case detail layout. Derives the active tab from `usePathname()` and renders links to all 12 case sub-pages.

**Tab order**: First Call, Tasks, Follow-Ups, Documents, Signatures, Payments, Obituary, Death Certificate, Cremation Auth, Cemetery, Merchandise, Vendors.
