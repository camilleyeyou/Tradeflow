---
phase: 04-operations
plan: "01"
subsystem: admin-ui
tags: [admin, client-list, status-badges, supabase-admin]
dependency_graph:
  requires: []
  provides: [admin-layout, admin-client-list, client-status-utility]
  affects: [admin-panel]
tech_stack:
  added: []
  patterns: [service-role-admin-client, status-derivation, buttonVariants-as-link]
key_files:
  created:
    - apps/web/src/lib/types/admin.ts
  modified:
    - apps/web/src/app/(admin)/layout.tsx
    - apps/web/src/app/(admin)/clients/page.tsx
decisions:
  - base-ui Button has no asChild support — used buttonVariants() on Link directly instead of Button asChild pattern
  - @ts-expect-error on supabase query removed — types.ts stub accepts the query without error; comment preserved as inline note
metrics:
  duration_seconds: 516
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_modified: 3
---

# Phase 4 Plan 01: Admin Panel Foundation Summary

Admin layout with top-nav navigation shell and client list page using service role key, derived status badges (active/trial/inactive), and all D-51 table columns.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create admin types and client status utility | 3672f4f | apps/web/src/lib/types/admin.ts |
| 2 | Extend admin layout with top-nav and build client list page | 0a7fe96 | apps/web/src/app/(admin)/layout.tsx, apps/web/src/app/(admin)/clients/page.tsx |

## What Was Built

**`apps/web/src/lib/types/admin.ts`** — New shared utility file with:
- `ClientStatus` type: `'active' | 'trial' | 'inactive'`
- `deriveClientStatus()` — D-52 logic: inactive when `is_active=false`, trial when `is_active=true` and `trial_ends_at` is in the future, active otherwise
- `statusBadgeVariant()` — maps ClientStatus to shadcn Badge variants (default/secondary/destructive)

**`apps/web/src/app/(admin)/layout.tsx`** — Extended from bare `<>{children}</>` wrapper to a full layout shell:
- Top-nav header with "Tradeflow Admin" branding linking to `/admin/clients`
- Clients navigation link
- Back to site link
- ADMIN_EMAIL auth guard preserved (redirects non-admin to /login)

**`apps/web/src/app/(admin)/clients/page.tsx`** — Replaced stub with full client list:
- Fetches all clients using `createAdminClient()` (service role key, bypasses RLS)
- `export const dynamic = 'force-dynamic'` to prevent ISR session leaks
- Table columns: Business Name, City, Status badge, Plan, Stripe status, Created
- GHL provisioning indicator (green "GHL" badge) next to business name when `ghl_sub_account_id` is set
- Status derived via `deriveClientStatus` per D-52
- Business name links to `/admin/clients/[id]`
- "Add Client" button links to `/admin/clients/new`
- Empty state message when no clients exist

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused @ts-expect-error directive**
- **Found during:** Task 2 build verification
- **Issue:** The plan's code sample included `// @ts-expect-error` on the supabase query, but the types.ts stub already types the query as `any`, so TypeScript raised no error — making the directive itself a compile error (`Unused '@ts-expect-error' directive`)
- **Fix:** Removed the `@ts-expect-error` comment; the query works without it
- **Files modified:** apps/web/src/app/(admin)/clients/page.tsx
- **Commit:** 0a7fe96

**2. [Rule 1 - Bug] Replaced Button asChild with buttonVariants on Link**
- **Found during:** Task 2 — IDE diagnostic after write
- **Issue:** The plan used `<Button asChild><Link ...>` pattern, but the project's Button component wraps `@base-ui/react/button` which has no `asChild` prop (not Radix-based)
- **Fix:** Imported `buttonVariants` from the button component and applied it as a className on the Link directly
- **Files modified:** apps/web/src/app/(admin)/clients/page.tsx
- **Commit:** 0a7fe96

## Known Stubs

None. The client list page correctly handles the empty-state (no clients) with a message. Data fetching is wired to the real Supabase `clients` table via `createAdminClient()`. The `/admin/clients/[id]` and `/admin/clients/new` routes are linked but not yet created — they are the subject of Plans 02 and 03 respectively.

## Self-Check

- FOUND: apps/web/src/lib/types/admin.ts
- FOUND: apps/web/src/app/(admin)/layout.tsx
- FOUND: apps/web/src/app/(admin)/clients/page.tsx
- FOUND: commit 3672f4f
- FOUND: commit 0a7fe96

## Self-Check: PASSED
