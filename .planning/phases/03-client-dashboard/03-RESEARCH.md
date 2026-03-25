# Phase 3: Client Dashboard - Research

**Researched:** 2026-03-25
**Domain:** Next.js 15 App Router dashboard — auth-protected pages, Server Actions, shadcn/ui, Supabase RLS
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dashboard Layout**
- D-33: Dashboard uses a sidebar navigation on desktop (>=768px) that collapses to a bottom tab bar on mobile (<768px). Navigation items: Overview, Leads, Calls, Settings. Sidebar shows the client's business name at the top.
- D-34: All dashboard routes use `export const dynamic = 'force-dynamic'` to prevent ISR session leaks. Data fetched in Server Components using `createClient()` from `@/lib/supabase/server` (per-request, cookie-based).
- D-35: The dashboard layout (`(dashboard)/layout.tsx`) wraps all pages with the nav component. The existing auth guard (redirect to /login if no user) is already in place from Phase 1.

**Lead Overview Page**
- D-36: `/dashboard` overview page shows 4 count cards: New, Contacted, Booked, Completed. Each card shows the count of leads in that status. Cards use a 2x2 grid on mobile, 4-across on desktop.
- D-37: Below count cards, show "Recent Leads" section with the 5 most recent leads (name, service type, status, created_at). Each row links to the full lead list.

**Lead List & Pipeline**
- D-38: `/dashboard/leads` shows a table of all leads ordered by `created_at DESC`. Columns: Name, Phone, Service Type, Status, Created, Notes (truncated). On mobile, hide Phone and Created columns.
- D-39: Each row has an inline status dropdown with 5 stages: new → contacted → booked → completed → lost. Changing fires a Server Action that updates Supabase. Update is optimistic — UI reflects immediately, reverts on error.
- D-40: Each row has an inline notes field. Clicking "Edit" reveals a textarea. On blur or Enter, a Server Action saves the notes to Supabase. Notes truncated to 100 chars in table view.
- D-41: Lead list does NOT use pagination or infinite scroll for v1.

**Call Log Page**
- D-42: `/dashboard/calls` shows a table of all calls from the `calls` table. Columns: Caller Number, Duration, Outcome, Recording, Date. Recording column shows a "Play" link that opens `recording_url` in a new tab.
- D-43: Call log is read-only. Calls ordered by `called_at DESC`.

**Settings Page**
- D-44: `/dashboard/settings` shows business info (business_name, phone, email, city) and notification preferences. Business info editable via Server Action updating the `clients` table.
- D-45: Notification preferences: a single toggle for "Email me when a new lead comes in" (`notifications_enabled` boolean on clients table). Requires migration 003. Default: true.

**UI Components**
- D-46: Use shadcn/ui components: Table, Select, Input, Textarea, Card, Badge, Button. Initialize with `npx shadcn@latest init` and add required components.
- D-47: All timestamps displayed in America/Chicago timezone. Use `toLocaleString('en-US', { timeZone: 'America/Chicago' })`.

### Claude's Discretion
- Exact shadcn/ui theme configuration and color tokens
- Dashboard loading skeleton design
- Error state presentation
- Navigation icon selection (Lucide icons from shadcn/ui)
- Count card visual styling (colors, icons per status)
- Mobile breakpoint responsive behavior details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | Dashboard accessible only to authenticated HVAC owners (Supabase Auth guard) | Middleware already guards /dashboard routes; layout.tsx auth guard pattern confirmed working from Phase 1 |
| DASH-02 | Lead overview page with count cards: new, contacted, booked, completed | Supabase `count` aggregation via `.eq('status', ...)` in Server Components; shadcn/ui Card components |
| DASH-03 | Lead list with 5-stage status pipeline (new → contacted → booked → completed → lost) | shadcn/ui Table + Select components; pipeline stages match `leads.status` column values |
| DASH-04 | Lead status updatable via dropdown on each lead row | Server Actions with `useOptimistic` (React 19); `'use server'` in separate actions file |
| DASH-05 | Inline notes field editable on each lead record | Client Component with controlled textarea; Server Action on blur/Enter; `useOptimistic` or `useTransition` |
| DASH-06 | Call log page showing all inbound calls with recording links from CallRail | Supabase query on `calls` table; recording_url renders as `<a target="_blank">` link |
| DASH-07 | Settings page for business info and notification preferences | Server Action form submit; migration 003 adds `notifications_enabled` column to clients table |
| DASH-08 | Mobile-responsive layout (usable between jobs on phone) | Tailwind responsive classes; sidebar on md+, bottom tab bar on <md; 375px minimum target |
</phase_requirements>

---

## Summary

Phase 3 builds the authenticated HVAC owner dashboard on top of the foundation laid in Phases 1 and 2. The codebase already has the route structure (stubs for leads, calls, settings pages), auth guard middleware, and Supabase client patterns established. The primary work is: (1) installing and configuring shadcn/ui — which is NOT yet installed, (2) building the nav layout with responsive sidebar/bottom-tab behavior, (3) implementing Server Components that fetch data from Supabase with RLS enforcing data isolation, (4) wiring optimistic status and notes updates via Server Actions, and (5) adding migration 003 for the `notifications_enabled` column.

The biggest technical risks are: shadcn/ui initialization in a Tailwind v4 project (CSS variable injection differs from v3), getting optimistic updates right for the status dropdown and notes field, and the `/dashboard` overview page not existing yet (the route group has no `page.tsx` at the group root — it needs to be created at `(dashboard)/page.tsx` which serves the `/dashboard` URL).

All data isolation is enforced by Supabase RLS policies already deployed (migration 001). The dashboard never needs a service role key — the anon key with the user's JWT is sufficient. The `client_users` join table provides the user→client mapping for all policies.

**Primary recommendation:** Initialize shadcn/ui first (Wave 0), then build the nav layout, then implement pages in dependency order: overview → leads → calls → settings. Each page is a Server Component that fetches and renders; only the status dropdown and notes textarea need Client Components for interactivity.

---

## Standard Stack

### Core (all already installed in package.json)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.14 | App Router, Server Components, Server Actions | Already installed; locked decision |
| React | 19.1.0 | UI runtime; `useOptimistic`, `useTransition` hooks needed | Already installed; React 19 required for useOptimistic |
| Tailwind CSS | v4 | Utility styling; responsive breakpoints | Already installed; no config file needed |
| @supabase/ssr | 0.9.0 | Cookie-based Supabase client for App Router | Already installed; `createClient()` pattern established |
| @supabase/supabase-js | 2.100.0 | Supabase query client | Already installed |
| zod | 4.3.6 | Settings form schema validation | Already installed |
| react-hook-form | 7.72.0 | Settings form state | Already installed |

### New Dependencies (must be installed in Wave 0)
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| shadcn/ui (CLI) | 4.1.0 | Component library via CLI | Locked decision D-46; copies components into repo — no npm package |
| lucide-react | ~1.7.0 | Icons for nav, cards, badges | Ships with shadcn/ui init; Lucide is the default icon set |
| tailwind-merge | 3.5.0 | Class merging utility for cn() | Required by shadcn/ui's utils.ts |
| clsx | 2.1.1 | Conditional class names for cn() | Required by shadcn/ui's utils.ts |
| class-variance-authority | 0.7.1 | Variant-based component styling | Required by shadcn/ui button, badge components |

**shadcn/ui is not a package — it is a CLI that copies component source files into `src/components/ui/`.**

### Installation
```bash
# From apps/web/ directory:
# 1. Initialize shadcn/ui (interactive — accept defaults, pick style)
npx shadcn@latest init

# 2. Add required components
npx shadcn@latest add table
npx shadcn@latest add select
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add button
npx shadcn@latest add separator

# shadcn@latest init installs lucide-react, tailwind-merge, clsx, class-variance-authority automatically
```

### Version verification (confirmed 2026-03-25 against npm registry)
| Package | Confirmed Version |
|---------|-------------------|
| shadcn (CLI) | 4.1.0 |
| lucide-react | 1.7.0 |
| tailwind-merge | 3.5.0 |
| clsx | 2.1.1 |
| class-variance-authority | 0.7.1 |

---

## Architecture Patterns

### Existing Structure (do not change)
```
apps/web/
├── middleware.ts                          # Auth guard — already working
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                # Auth guard + nav wrapper — needs nav added
│   │   │   ├── page.tsx                  # MISSING — /dashboard overview (create in Phase 3)
│   │   │   ├── leads/page.tsx            # Stub — replace in Phase 3
│   │   │   ├── calls/page.tsx            # Stub — replace in Phase 3
│   │   │   └── settings/page.tsx         # Stub — replace in Phase 3
│   │   └── login/page.tsx                # Already working
│   ├── components/
│   │   ├── ui/                           # MISSING — created by shadcn/ui init
│   │   ├── dashboard/
│   │   │   ├── sidebar-nav.tsx           # New: desktop sidebar + mobile bottom tab bar
│   │   │   ├── count-cards.tsx           # New: 4 count cards for overview
│   │   │   ├── recent-leads.tsx          # New: recent leads table for overview
│   │   │   ├── leads-table.tsx           # New: full lead list with inline edits
│   │   │   ├── status-select.tsx         # New: Client Component for optimistic status update
│   │   │   ├── notes-editor.tsx          # New: Client Component for inline notes editing
│   │   │   └── settings-form.tsx         # New: Client Component for settings form
│   │   └── lead-form.tsx                 # Existing — do not modify
│   └── lib/
│       ├── supabase/server.ts             # Existing — use as-is
│       ├── actions/
│       │   ├── lead-actions.ts           # New: updateLeadStatus, updateLeadNotes
│       │   └── settings-actions.ts       # New: updateClientSettings
│       └── validations/
│           └── settings.ts               # New: Zod schema for settings form
```

### Pattern 1: Server Component Data Fetching with RLS
The standard pattern for all dashboard pages — Server Component queries Supabase, RLS enforces isolation:

```typescript
// Source: established in Phase 1, confirmed by @supabase/ssr docs
// apps/web/src/app/(dashboard)/leads/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'  // REQUIRED — no ISR on auth pages

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  // RLS automatically filters to this user's client — no .eq('client_id', ...) needed

  return <LeadsTable leads={leads ?? []} />
}
```

**Key:** RLS on `leads` uses `client_id in (select client_id from client_users where user_id = auth.uid())`. The user's JWT provides `auth.uid()` — the query automatically scopes to their data.

### Pattern 2: Getting client_id for the Layout
The dashboard layout needs the client's business_name for the sidebar. The lookup pattern:

```typescript
// Get client for the logged-in user via client_users join
const { data: clientUser } = await supabase
  .from('client_users')
  .select('client_id, clients(business_name)')
  .eq('user_id', user.id)
  .single()
// clientUser.clients.business_name is the display name
```

**Note:** `client_users` has NO RLS (by design from Phase 1 — it is the identity source). The query works without RLS filtering. Use `.single()` since each auth user maps to exactly one client in v1.

### Pattern 3: Count Cards via Supabase Aggregate Query
```typescript
// Efficient: one query with group-by, not 4 separate queries
const { data: statusCounts } = await supabase
  .from('leads')
  .select('status')
// Then count in JS: counts = leads.reduce((acc, l) => ({ ...acc, [l.status]: (acc[l.status] || 0) + 1 }), {})

// Alternative: 4 separate queries (simpler, fine for small datasets)
const { count: newCount } = await supabase
  .from('leads')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'new')
```

For v1 (10-50 leads per client), either approach is fine. Fetch-all-then-count in JS is simpler to implement.

### Pattern 4: Server Actions for Mutations
Server Actions live in dedicated files, called from Client Components:

```typescript
// apps/web/src/lib/actions/lead-actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateLeadStatus(leadId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)
  // RLS enforces ownership — no need to verify client_id manually

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard')
}
```

### Pattern 5: Optimistic Update for Status Dropdown
React 19's `useOptimistic` enables instant UI feedback before server confirmation:

```typescript
// apps/web/src/components/dashboard/status-select.tsx
'use client'
import { useOptimistic, useTransition } from 'react'
import { updateLeadStatus } from '@/lib/actions/lead-actions'

export function StatusSelect({ lead }: { lead: { id: string; status: string } }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(lead.status)
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string) {
    startTransition(async () => {
      setOptimisticStatus(value)
      try {
        await updateLeadStatus(lead.id, value)
      } catch {
        // React automatically reverts optimistic state on error
      }
    })
  }

  return (
    <Select value={optimisticStatus} onValueChange={handleChange} disabled={isPending}>
      ...
    </Select>
  )
}
```

### Pattern 6: Inline Notes Editor
```typescript
// apps/web/src/components/dashboard/notes-editor.tsx
'use client'
import { useState, useTransition } from 'react'
import { updateLeadNotes } from '@/lib/actions/lead-actions'

export function NotesEditor({ leadId, initialNotes }: { leadId: string; initialNotes: string | null }) {
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setIsEditing(false)
    startTransition(() => updateLeadNotes(leadId, notes))
  }

  if (!isEditing) {
    return (
      <span>
        {notes.slice(0, 100)}{notes.length > 100 ? '...' : ''}
        <button onClick={() => setIsEditing(true)}>Edit</button>
      </span>
    )
  }

  return (
    <textarea
      value={notes}
      onChange={e => setNotes(e.target.value)}
      onBlur={handleSave}
      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSave()}
      autoFocus
      disabled={isPending}
    />
  )
}
```

### Pattern 7: Responsive Nav Layout (Sidebar + Bottom Tab Bar)
The layout uses Tailwind responsive classes — sidebar visible on `md:` and above, bottom tab bar visible below `md:`:

```typescript
// apps/web/src/app/(dashboard)/layout.tsx
export default async function DashboardLayout({ children }) {
  // ... auth + client fetch ...
  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex md:w-64 flex-col border-r ...">
        <SidebarNav businessName={clientUser.clients.business_name} />
      </aside>
      {/* Main content */}
      <main className="flex-1 pb-16 md:pb-0 ...">
        {children}
      </main>
      {/* Bottom tab bar — mobile only */}
      <nav className="fixed bottom-0 inset-x-0 md:hidden border-t ...">
        <BottomTabBar />
      </nav>
    </div>
  )
}
```

`pb-16` on main prevents content from being hidden behind the fixed bottom tab bar on mobile.

### Pattern 8: Supabase Update Policy Confirmation
The existing `leads: owner sees own leads` policy uses `for all` which includes UPDATE. No new policies needed for status/notes updates. The Server Action's Supabase client uses the user's JWT (cookie-based), so `.update()` is automatically scoped.

```sql
-- Existing policy (from migration 001) — covers SELECT, INSERT, UPDATE, DELETE
create policy "leads: owner sees own leads"
  on public.leads for all
  using (
    client_id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );
```

### Anti-Patterns to Avoid
- **Module-level Supabase client:** Never `const supabase = createClient()` at module scope in Server Components. Always `const supabase = await createClient()` inside the function body. (Established pattern from Phase 1.)
- **`getSession()` instead of `getUser()`:** `getSession()` reads from cookie without revalidating. Always use `getUser()` for auth checks.
- **`force-static` on dashboard routes:** ISR caches Set-Cookie headers — use `force-dynamic` on ALL dashboard routes.
- **Passing client_id from browser to Server Action:** Server Actions should derive client_id from the user's JWT via `auth.getUser()`, not from a hidden form field. A malicious user could pass another client's ID.
- **`export const dynamic = 'force-dynamic'` in Client Components:** This export only has effect in Server Components/Route Handlers. Don't put it in `'use client'` files.
- **Using `useOptimistic` outside of `useTransition`:** `setOptimisticStatus` must be called inside `startTransition` — otherwise React does not know to revert on error.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status select UI | Custom `<select>` styled from scratch | shadcn/ui `Select` component | Accessible, keyboard-navigable, mobile-friendly; Radix UI primitives handle ARIA |
| Data table | Custom `<table>` with manual responsive handling | shadcn/ui `Table` + Tailwind responsive visibility | Consistent styling; responsive hiding via `hidden md:table-cell` on columns |
| Toggle switch | Custom `<input type="checkbox">` | shadcn/ui `Switch` component | Accessible toggle with proper ARIA roles |
| Card layout | Raw `<div>` grids | shadcn/ui `Card`, `CardHeader`, `CardContent` | Consistent spacing and borders; dark mode handled |
| Status color badges | Manual `className` conditionals | shadcn/ui `Badge` with `variant` prop | Semantic color variants; no custom CSS needed |
| Timestamp formatting | Custom date library | `toLocaleString('en-US', { timeZone: 'America/Chicago' })` | Native API, zero bundle cost; decided in D-47 |
| Server-side form validation | Manual validation in action | Zod schema + `.safeParse()` | Consistent with Phase 2 pattern; type-safe |

**Key insight:** shadcn/ui components are copied into the repo, so there's no version lock-in and they can be customized if needed. Install them via CLI, not npm.

---

## Database Changes Required

### Migration 003: Add notifications_enabled to clients
Per decision D-45, a new boolean column is needed on the `clients` table:

```sql
-- supabase/migrations/003_add_notifications_enabled.sql
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;
```

This is the only schema change required for Phase 3. The existing RLS policy on `clients` (`clients: owner can read own record`) covers SELECT only. An UPDATE policy needs to be added so owners can update their own settings:

```sql
create policy "clients: owner can update own record"
  on public.clients for update
  using (
    id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  )
  with check (
    id in (
      select client_id from public.client_users
      where user_id = auth.uid()
    )
  );
```

**This policy is missing from migration 001** — without it, the settings Server Action's `.update()` call will silently fail (RLS blocks it, Supabase returns no error by default, the row just isn't updated). Add it in migration 003.

---

## Common Pitfalls

### Pitfall 1: Missing /dashboard Overview Route
**What goes wrong:** The `(dashboard)` route group has `layout.tsx` and subdirectories for leads/calls/settings, but NO `page.tsx` at the group root. Visiting `/dashboard` returns 404.
**Why it happens:** Next.js App Router route groups (`(name)`) do not auto-create routes — a `page.tsx` file is required.
**How to avoid:** Create `apps/web/src/app/(dashboard)/page.tsx` as the overview page. This file is completely absent and must be created in Phase 3.

### Pitfall 2: RLS Blocks Client Settings UPDATE
**What goes wrong:** The settings form submits, the Server Action runs without error, but the `clients` row is never updated. `supabase.from('clients').update(...)` returns `{ count: 0, error: null }`.
**Why it happens:** Migration 001 only created a SELECT policy on `clients` (`clients: owner can read own record`). No UPDATE policy exists.
**How to avoid:** Migration 003 must add the UPDATE policy (see Database Changes Required above). Test by checking the return value of `.update()` — a `count: 0` result with no error indicates RLS blocked the write.

### Pitfall 3: Phone Number Display in Logs
**What goes wrong:** Full phone numbers appear in the lead table, violating the CLAUDE.md security rule: "truncated PII in logs."
**Why it happens:** The `leads.phone` column stores the full number. Displaying it directly exposes PII.
**How to avoid:** Apply the truncation format in the component: `+1312****1234`. Per CONTEXT.md specifics: show `+1${phone.slice(2,5)}****${phone.slice(-4)}` format. Apply in the leads table component, not in the database query.

### Pitfall 4: Timestamps Display in UTC
**What goes wrong:** Call times show as "3:00 AM" instead of "10:00 PM" because `called_at` is stored as UTC in Supabase, and JavaScript `new Date().toLocaleString()` uses the browser's local timezone — not Chicago's.
**Why it happens:** Server Components run on Vercel (likely US-East or UTC) — the server timezone may not be America/Chicago. Client-side rendering defaults to browser locale.
**How to avoid:** Always pass `{ timeZone: 'America/Chicago' }` explicitly (decision D-47):
```typescript
const display = new Date(called_at).toLocaleString('en-US', {
  timeZone: 'America/Chicago',
  dateStyle: 'short',
  timeStyle: 'short',
})
```

### Pitfall 5: shadcn/ui Init in Tailwind v4 Project
**What goes wrong:** Running `npx shadcn@latest init` may attempt to write a `tailwind.config.js` file or add `@tailwindcss/postcss` configuration that conflicts with the existing v4 setup.
**Why it happens:** shadcn CLI 4.x has full Tailwind v4 support but prompts differ from v3 projects.
**How to avoid:** When prompted during `shadcn init`, select "New York" or "Default" style, choose CSS variables (yes), and verify the CLI does NOT overwrite `postcss.config.mjs`. The existing `@import "tailwindcss"` in `globals.css` is correct for v4. shadcn will inject CSS variables into `globals.css` — review the diff before accepting.
**Warning signs:** If `tailwind.config.js` appears after init, the CLI defaulted to v3 mode. Delete it — Tailwind v4 does not use this file.

### Pitfall 6: `useOptimistic` Reverts Correctly Only Inside `startTransition`
**What goes wrong:** Status dropdown appears to update, then snaps back even on success, or does NOT snap back on error.
**Why it happens:** `setOptimisticStatus` must be called inside the `startTransition` callback. Calling it outside means React doesn't link the optimistic state to the transition lifecycle.
**How to avoid:** The pattern in Architecture Pattern 5 above is correct. Never call `setOptimisticStatus` outside `startTransition`.

### Pitfall 7: Content Hidden Behind Mobile Bottom Tab Bar
**What goes wrong:** On mobile, the bottom of the leads table or settings form is hidden behind the fixed bottom nav bar.
**Why it happens:** The fixed-position bottom tab bar overlaps the main content area.
**How to avoid:** Add `pb-16` (or `pb-20`) to the main content wrapper on mobile. The layout pattern in Architecture Pattern 7 above includes this.

### Pitfall 8: Dashboard Layout Fetches Client on Every Request
**What goes wrong:** The layout queries `client_users` + `clients` on every page navigation, adding ~50ms latency.
**Why it happens:** `force-dynamic` prevents caching; layout re-runs on every request.
**How to avoid:** For v1 with 2-5 HVAC owners, this latency is acceptable. Do not optimize prematurely. If it becomes an issue in Phase 4+, use Next.js `unstable_cache` with a short TTL. For Phase 3: keep it simple.

---

## Code Examples

### Timestamp Formatting (America/Chicago)
```typescript
// Source: CONTEXT.md D-47, native browser API
function formatChicagoTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
```

### Phone Number Truncation
```typescript
// Source: CLAUDE.md security rules + CONTEXT.md specifics
function truncatePhone(phone: string): string {
  // Input: '+13125551234' or '3125551234'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `+1${digits.slice(1, 4)}****${digits.slice(-4)}`
  }
  if (digits.length === 10) {
    return `+1${digits.slice(0, 3)}****${digits.slice(-4)}`
  }
  return '****'
}
```

### Server Action with Auth Verification
```typescript
// Source: established Next.js 15 Server Actions pattern
// apps/web/src/lib/actions/lead-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const LEAD_STATUSES = ['new', 'contacted', 'booked', 'completed', 'lost'] as const
type LeadStatus = typeof LEAD_STATUSES[number]

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  if (!LEAD_STATUSES.includes(status)) throw new Error('Invalid status')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard')
}
```

### Zod Schema for Settings Form
```typescript
// apps/web/src/lib/validations/settings.ts
import { z } from 'zod'

export const settingsSchema = z.object({
  business_name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?1?\d{10}$/),
  email: z.string().email(),
  city: z.string().min(2).max(100),
  notifications_enabled: z.boolean(),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>
```

### Count Card Data Fetching
```typescript
// apps/web/src/app/(dashboard)/page.tsx
const { data: allLeads } = await supabase
  .from('leads')
  .select('status, homeowner_name, service_type, created_at')
  .order('created_at', { ascending: false })

const leads = allLeads ?? []
const counts = {
  new: leads.filter(l => l.status === 'new').length,
  contacted: leads.filter(l => l.status === 'contacted').length,
  booked: leads.filter(l => l.status === 'booked').length,
  completed: leads.filter(l => l.status === 'completed').length,
}
const recentLeads = leads.slice(0, 5)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `auth-helpers-nextjs` for SSR Supabase | `@supabase/ssr` with `createServerClient` | ~2023 | auth-helpers deprecated; SSR patterns already correct from Phase 1 |
| `getSession()` for auth checks | `getUser()` | 2023 | getSession() doesn't revalidate; already fixed in Phase 1 |
| `pages/` Router with `getServerSideProps` | App Router with Server Components | Next.js 13+ | Server Components replace getServerSideProps; already using |
| `useState` + fetch for mutations | Server Actions with `useOptimistic` | React 19 / Next.js 14+ | Cleaner, no API route needed for simple mutations |
| Tailwind v3 `tailwind.config.js` | Tailwind v4 `@import "tailwindcss"` in CSS | Tailwind v4 (2024) | No config file needed; already set up correctly |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. Not installed in this project — correct.
- `supabase.auth.getSession()` in Server Components: Replaced by `getUser()`. Already using correct pattern.
- shadcn/ui Tailwind v3 config pattern (`tailwind.config.js` CSS variable injection): Use v4 `globals.css` CSS variable approach. shadcn CLI 4.x handles this automatically.
- `next/server cookies()` called synchronously: Must be `await cookies()` in Next.js 15. Already established from Phase 1.

---

## Environment Availability

Step 2.6: The dashboard is a Next.js code change only. No new external services are introduced. All dependencies (Supabase, shadcn CLI) are accessed via npm or already-configured cloud services. No external tool probing needed beyond confirming `npx` is available.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | shadcn init, npm scripts | ✓ | v24.13.0 | — |
| npx | shadcn@latest init | ✓ | bundled with Node 24 | — |
| Supabase project | All data queries | assumed ✓ (deployed in Phase 1) | managed | — |
| Vercel deployment | Hosting | assumed ✓ (configured in Phase 1) | managed | — |

**Missing dependencies with no fallback:** None.

---

## Open Questions

1. **`(dashboard)/page.tsx` does not exist — is `/dashboard` currently 404?**
   - What we know: The route group has `layout.tsx`, `leads/`, `calls/`, `settings/` but no root `page.tsx`. In Next.js App Router, a route group without a `page.tsx` at its root means the URL `/dashboard` has no handler.
   - What's unclear: Whether Phase 1 created this file and it was not discovered, or it was intentionally omitted.
   - Recommendation: Create `(dashboard)/page.tsx` in Wave 1 as the first task.

2. **TypeScript types stub — will `leads.status` type-check properly?**
   - What we know: `apps/web/src/lib/supabase/types.ts` is a stub returning `Record<string, unknown>` for all tables. This means `leads.status` has type `unknown`.
   - What's unclear: Whether `supabase gen types` has been run against the deployed schema.
   - Recommendation: Define local type overrides in the dashboard components (e.g., `type Lead = { id: string; status: string; ... }`) and cast query results. Do not block Phase 3 on the types stub — it was flagged as a post-Phase-1 task in STATE.md.

3. **shadcn/ui `components.json` — which style and base color?**
   - What we know: The CLI will prompt for style (Default vs New York) and base color. This is in Claude's Discretion (D-46 deferred theme config).
   - Recommendation: Use "New York" style (more polished, better for dashboards) with "Zinc" base color (neutral, professional). Can be changed later by re-running `shadcn init`.

---

## Validation Architecture

> `nyquist_validation` is explicitly `false` in `.planning/config.json` — this section is skipped.

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection — `/Users/user/Desktop/Tradeflow/apps/web/` — confirmed file structure, installed packages, existing patterns
- `supabase/migrations/001_initial_schema.sql` — confirmed table schemas, RLS policies, column names
- `apps/web/package.json` — confirmed installed package versions
- `.planning/phases/03-client-dashboard/03-CONTEXT.md` — confirmed all locked decisions
- Next.js 15 Server Actions documentation pattern — `'use server'` files, `revalidatePath`

### Secondary (MEDIUM confidence)
- shadcn/ui CLI 4.x behavior with Tailwind v4 — confirmed via npm version check (4.1.0 current); Tailwind v4 support documented in shadcn changelog
- React 19 `useOptimistic` hook — confirmed available in React 19.1.0 (installed); documented in React 19 release notes

### Tertiary (LOW confidence — needs validation at implementation time)
- shadcn/ui `npx shadcn@latest init` exact prompts and behavior for Tailwind v4 projects — behavior confirmed compatible but exact CLI prompts may differ; verify at implementation time

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages inspected from package.json; versions confirmed against npm registry
- Architecture: HIGH — patterns established in Phase 1/2 and verified in codebase; route structure confirmed
- Database schema: HIGH — migration files read directly; column names and types confirmed
- Pitfalls: HIGH — most pitfalls derive from established codebase patterns and confirmed constraints
- shadcn/ui init behavior: MEDIUM — version confirmed but interactive CLI behavior not tested; low risk

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (30 days — stable stack, no fast-moving components)
