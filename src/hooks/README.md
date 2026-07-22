# src/hooks

Custom React hooks for the Kelova dashboard.

## `use-current-user.ts`

Reads authenticated user metadata from the Zustand auth store. Returns a shaped object with the raw user plus derived role flags.

```ts
const { user, role, isSuperAdmin, isFuneralDirector, isStaff, canManageUsers, canAccessSettings } =
  useCurrentUser();
```

**Return shape**

| Field               | Type                                             | Description                                                       |
| ------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| `user`              | `AuthUser \| null`                               | Full user object from the store (id, email, name, role, tenantId) |
| `role`              | `'super_admin' \| 'funeral_director' \| 'staff'` | Defaults to `'staff'` when user is null                           |
| `isSuperAdmin`      | `boolean`                                        |                                                                   |
| `isFuneralDirector` | `boolean`                                        |                                                                   |
| `isStaff`           | `boolean`                                        |                                                                   |
| `canManageUsers`    | `boolean`                                        | `true` for `funeral_director` and `super_admin`                   |
| `canAccessSettings` | `boolean`                                        | `true` for `funeral_director` and `super_admin`                   |

**Important notes**

- This hook reads directly from Zustand — there is no API call, no loading state, and no async behavior.
- It must be called inside the dashboard layout (i.e., after `AuthInitializer` has run). Calling it on a public route will return `user: null` and `role: 'staff'`.
- It is a client component hook (`'use client'`) — do not call it in Server Components.
