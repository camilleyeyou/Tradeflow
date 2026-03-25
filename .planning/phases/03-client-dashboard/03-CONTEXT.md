# Phase 3: Client Dashboard - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the auth-protected HVAC owner dashboard: a lead overview page with count cards, a lead list with 5-stage status pipeline and inline status dropdowns, inline notes editing on each lead, a call log page with recording links, and a settings page for business info and notification preferences. The dashboard must be mobile-responsive (usable at 375px) since HVAC owners check it between jobs on their phones. All data is scoped by RLS — each owner sees only their own leads and calls.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout
- **D-33:** Dashboard uses a sidebar navigation on desktop (≥768px) that collapses to a bottom tab bar on mobile (<768px). Navigation items: Overview (home icon), Leads, Calls, Settings. The sidebar shows the client's business name at the top.
- **D-34:** All dashboard routes use `export const dynamic = 'force-dynamic'` to prevent ISR session leaks. Data is fetched in Server Components using `createClient()` from `@/lib/supabase/server` (per-request, cookie-based).
- **D-35:** The dashboard layout (`(dashboard)/layout.tsx`) wraps all pages with the nav component. The existing auth guard (redirect to /login if no user) is already in place from Phase 1.

### Lead Overview Page
- **D-36:** The `/dashboard` overview page shows 4 count cards: New, Contacted, Booked, Completed. Each card shows the count of leads in that status. Cards use a simple grid layout (2x2 on mobile, 4-across on desktop).
- **D-37:** Below the count cards, show a "Recent Leads" section with the 5 most recent leads (name, service type, status, created_at). Each row links to the full lead list.

### Lead List & Pipeline
- **D-38:** The `/dashboard/leads` page shows a table of all leads for the client, ordered by `created_at DESC`. Columns: Name, Phone, Service Type, Status, Created, Notes (truncated). On mobile, hide Phone and Created columns.
- **D-39:** Each row has an inline status dropdown (select element) with the 5 pipeline stages: new → contacted → booked → completed → lost. Changing the dropdown fires a Server Action that updates the lead status in Supabase. The update is optimistic — UI reflects immediately, reverts on error.
- **D-40:** Each row has an inline notes field. Clicking "Edit" on the notes cell reveals a textarea. On blur or Enter, a Server Action saves the notes to Supabase. Notes are truncated to 100 chars in the table view.
- **D-41:** The lead list does NOT use pagination or infinite scroll for v1 — a simple full list is sufficient for the expected volume (10-50 leads per client per month). If performance becomes an issue, pagination can be added later.

### Call Log Page
- **D-42:** The `/dashboard/calls` page shows a table of all calls for the client from the `calls` table. Columns: Caller Number, Duration, Outcome (answered/missed/voicemail), Recording, Date. The Recording column shows a "Play" link that opens `recording_url` in a new tab.
- **D-43:** Call log is read-only — no editable fields. Calls are ordered by `called_at DESC`.

### Settings Page
- **D-44:** The `/dashboard/settings` page shows the client's business info (business_name, phone, email, city) and notification preferences. Business info fields are editable via a form that submits a Server Action to update the `clients` table.
- **D-45:** Notification preferences: a single toggle for "Email me when a new lead comes in" (boolean). This maps to a `notifications_enabled` column on the clients table (requires a migration). Default: true.

### UI Components
- **D-46:** Use shadcn/ui components for the dashboard: Table, Select, Input, Textarea, Card, Badge, Button. Initialize shadcn/ui in the project (`npx shadcn@latest init`) and add required components. This keeps the dashboard consistent and mobile-friendly with minimal custom CSS.
- **D-47:** All timestamps displayed in America/Chicago timezone (per UX pitfall from research). Use `toLocaleString('en-US', { timeZone: 'America/Chicago' })` for display formatting.

### Claude's Discretion
- Exact shadcn/ui theme configuration and color tokens
- Dashboard loading skeleton design
- Error state presentation
- Navigation icon selection (Lucide icons from shadcn/ui)
- Count card visual styling (colors, icons per status)
- Mobile breakpoint responsive behavior details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specification
- `CLAUDE (1).md` — Dashboard rules (auth flow, pages, data scoping), code rules (Server Components default, Server Actions for mutations, strict TypeScript)

### Research
- `.planning/research/STACK.md` — shadcn/ui compatibility with React 19 + Tailwind v4, @supabase/ssr patterns
- `.planning/research/PITFALLS.md` — UTC timezone pitfall (display in America/Chicago), force-dynamic on auth pages, RLS testing with cross-tenant JWT

### Prior Phase Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — D-06 (@supabase/ssr), D-07 (no module-level clients), D-09 (middleware auth guard)
- `.planning/phases/02-lead-pipeline/02-CONTEXT.md` — D-14 (lead dedup pattern), D-25 (ghl_contact_id on leads)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/lib/supabase/server.ts` — Server Supabase client (createClient with cookies)
- `apps/web/src/lib/supabase/client.ts` — Browser Supabase client (for client components if needed)
- `apps/web/src/lib/supabase/types.ts` — TypeScript types (placeholder — needs `supabase gen types`)
- `apps/web/src/app/(dashboard)/layout.tsx` — Auth guard layout (already redirects to /login)
- `apps/web/middleware.ts` — Auth middleware protecting /dashboard routes
- `apps/web/src/components/lead-form.tsx` — Example of react-hook-form + Zod pattern (reusable for settings form)
- `apps/web/src/lib/validations/lead.ts` — Zod schema pattern to follow for settings validation

### Established Patterns
- Per-request Supabase client initialization (never module-level)
- `await cookies()` for async cookie access in Next.js 15
- `supabase.auth.getUser()` for auth checks
- react-hook-form + Zod for client-side forms
- Server Actions for mutations (per CLAUDE.md: "Use Server Actions for form mutations")

### Integration Points
- Dashboard layout wraps `/dashboard`, `/dashboard/leads`, `/dashboard/calls`, `/dashboard/settings`
- Leads data from `public.leads` table (scoped by RLS via client_users join)
- Calls data from `public.calls` table (scoped by RLS)
- Client data from `public.clients` table (for settings, count cards)
- User → client mapping via `public.client_users` join table

</code_context>

<specifics>
## Specific Ideas

- The dashboard layout needs to fetch the client's business_name for the sidebar/header — query `client_users` → `clients` join in the layout Server Component
- Count cards should show live counts, not cached — each dashboard visit fetches fresh from Supabase
- The lead status dropdown should use the same 5 values as the `leads.status` column enum: new, contacted, booked, completed, lost
- Phone numbers should be truncated in display per security rules: show `+1312****1234` format
- The settings form should use Server Actions (not API routes) per CLAUDE.md code rules
- A `notifications_enabled` boolean column needs to be added to the `clients` table via migration 003

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-client-dashboard*
*Context gathered: 2026-03-25*
