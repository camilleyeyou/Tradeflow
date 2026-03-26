# Phase 4: Operations - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the admin panel and Stripe billing integration: a magic-link-protected admin area with a client list page (active/trial/inactive status), a client onboarding form that creates a Supabase client record and provisions a GHL sub-account in one flow, a single client detail page showing their leads/calls/GHL link, and Stripe webhook handlers on FastAPI for subscription lifecycle events (created, deleted, invoice success, invoice failure). The end state is: the admin can onboard a new HVAC client without touching the database, and Stripe subscription events automatically activate/deactivate clients and track billing records.

</domain>

<decisions>
## Implementation Decisions

### Admin Panel Layout
- **D-48:** Admin panel uses a simple top-nav layout (not the sidebar-nav pattern from Phase 3). The admin is a single user — no need for mobile bottom tabs. Navigation items: Clients (list), and a link back to the marketing site. The `(admin)/layout.tsx` already has the ADMIN_EMAIL guard — extend it with a simple header nav.
- **D-49:** All admin routes use `export const dynamic = 'force-dynamic'` (consistent with D-34). Data is fetched in Server Components using `createAdminClient()` from `@/lib/supabase/admin` (service role key, bypasses RLS).
- **D-50:** Admin panel reuses shadcn/ui components from Phase 3 (Table, Badge, Button, Input, Card). No additional shadcn/ui components needed unless the planner identifies a gap.

### Client List Page
- **D-51:** The `/admin/clients` page shows a table of all clients with columns: Business Name, City, Status (active/trial/inactive badge), Plan, Stripe Status, Created. Clicking a row navigates to the client detail page.
- **D-52:** Client status is derived from `is_active` and `trial_ends_at` fields: if `is_active` is true and `trial_ends_at` is in the future → "trial"; if `is_active` is true and no active trial → "active"; if `is_active` is false → "inactive".

### Client Onboarding Form
- **D-53:** The `/admin/clients/new` page has a single form (not a multi-step wizard). Fields: business_name, owner_name, email, phone, city, state (default IL), service_area_zips (comma-separated text input), plan (dropdown: starter/growth/premium). Form uses react-hook-form + Zod for validation (consistent with Phase 2/3 patterns).
- **D-54:** On submit, a Server Action: (1) inserts the client record into Supabase via createAdminClient, (2) creates a GHL sub-account via the GHL Agency API, (3) stores the `ghl_sub_account_id` on the client record, (4) creates a `client_users` row linking the owner's email to the client. If GHL provisioning fails, the client record is still created but `ghl_sub_account_id` is null — the admin can retry later.
- **D-55:** Idempotency: before creating a GHL sub-account, check if `ghl_sub_account_id` is already set on the client record. If set, skip GHL creation. This prevents duplicate sub-accounts if the form is submitted twice or the admin retries after a partial failure.
- **D-56:** After successful onboarding, the admin creates an auth user for the HVAC owner manually via Supabase dashboard (or a future "invite" feature). Phase 4 does NOT automate user creation — the admin sets up the owner's email/password in Supabase Auth and tells them their credentials.

### Client Detail Page
- **D-57:** The `/admin/clients/[id]` page shows the client's full info (all fields from clients table), a link to their GHL sub-account dashboard (constructed from `ghl_sub_account_id`), and two tabs or sections: Recent Leads (last 20) and Recent Calls (last 20). Data fetched with createAdminClient (bypasses RLS).
- **D-58:** The client detail page is read-only for v1. Editing client info is deferred — the admin can update directly in Supabase dashboard if needed. The onboarding form handles creation; bulk editing is rare enough to not justify a UI.

### Stripe Webhook Handlers
- **D-59:** Stripe webhooks route to FastAPI on Railway at `/api/webhooks/stripe` (consistent with D-26 — all external webhooks go to FastAPI to avoid Vercel Deployment Protection). The handler verifies signatures using `stripe.Webhook.construct_event` before processing.
- **D-60:** Four event types handled: `customer.subscription.created` → set `is_active = true` + store `stripe_subscription_id`; `customer.subscription.deleted` → set `is_active = false`; `invoice.payment_succeeded` → insert billing record; `invoice.payment_failed` → send alert email via Resend to `ADMIN_EMAIL`.
- **D-61:** Idempotency: use `stripe_invoice_id` UNIQUE constraint on the billing table (already exists in migration 001) to prevent duplicate billing records. For subscription events, use `stripe_subscription_id` to look up the client — updating is_active is idempotent by nature.
- **D-62:** The Stripe webhook endpoint returns `200 OK` immediately after signature verification. Processing happens in FastAPI `BackgroundTasks` (consistent with GHL webhook pattern from Phase 2).
- **D-63:** Client lookup from Stripe events: use `stripe_customer_id` on the clients table to map Stripe events to the correct client. The `stripe_customer_id` is set during client onboarding or manually by the admin after creating the Stripe customer.

### GHL Sub-Account Provisioning
- **D-64:** GHL sub-account creation uses the GHL Agency API v2. The API call runs inline during the onboarding Server Action (not a background job). The admin creates maybe 2-5 clients during MVP — no need for async processing.
- **D-65:** The GHL API client in `apps/web/src/lib/ghl.ts` is extended with a `createSubAccount` function. The Agency-level API token is stored as `GHL_AGENCY_API_KEY` env var (separate from the per-sub-account Private Integration Tokens used in Phase 2).
- **D-66:** Migration 004 is NOT needed for Phase 4 — all required columns already exist on the clients table (`ghl_sub_account_id`, `stripe_customer_id`, `stripe_subscription_id`, `is_active`, `trial_ends_at`). The billing table also already exists.

### Claude's Discretion
- Admin nav styling and visual hierarchy
- Client detail page layout (tabs vs sections for leads/calls)
- Badge color scheme for client status (active/trial/inactive)
- Error state presentation for GHL provisioning failures
- Stripe webhook retry/error logging approach
- Email template content for payment failure alerts

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specification
- `CLAUDE (1).md` — Admin panel rules (ADMIN_EMAIL guard, service role key usage), Stripe webhook contracts, GHL sub-account provisioning rules, billing table schema, code rules

### Research
- `.planning/research/STACK.md` — Stripe Node/Python SDK versions, GHL API v2 patterns, FastAPI BackgroundTasks
- `.planning/research/PITFALLS.md` — Vercel Deployment Protection blocking webhooks (route to FastAPI), GHL sub-account idempotency, Stripe webhook signature verification

### Prior Phase Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — D-06 (@supabase/ssr), D-07 (no module-level clients), D-08 (ADMIN_EMAIL env check), D-09 (middleware auth guard)
- `.planning/phases/02-lead-pipeline/02-CONTEXT.md` — D-21 (GHL API client), D-22 (GHL API v2 base URL), D-26 (webhooks route to FastAPI)
- `.planning/phases/03-client-dashboard/03-CONTEXT.md` — D-34 (force-dynamic), D-46 (shadcn/ui components)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/lib/supabase/admin.ts` — createAdminClient with service role key (bypasses RLS)
- `apps/web/src/app/(admin)/layout.tsx` — Admin auth guard (ADMIN_EMAIL check, redirect to /login)
- `apps/web/src/lib/ghl.ts` — GHL API v2 client (createGHLContact, lookupContactByPhone, addContactToWorkflow) — extend with createSubAccount
- `apps/web/src/components/ui/` — shadcn/ui Table, Badge, Button, Input, Card, Select
- `apps/web/src/lib/validations/` — Zod schema patterns (lead.ts, settings.ts)
- `apps/web/src/lib/actions/` — Server Action patterns (lead-actions.ts, settings-actions.ts)
- `apps/web/src/lib/utils/format.ts` — formatChicagoTime, truncatePhone utilities
- `apps/web/src/lib/types/dashboard.ts` — TypeScript interfaces for Lead, Call, Client
- `api/routers/webhooks.py` — GHL webhook handler pattern (signature verify → background task)
- `api/services/ghl_service.py` — GHL signature verification pattern
- `api/services/supabase_client.py` — FastAPI Supabase service role client

### Established Patterns
- Per-request Supabase client initialization (never module-level)
- `await cookies()` for async cookie access in Next.js 15
- react-hook-form + Zod for client-side forms
- Server Actions for form mutations
- FastAPI BackgroundTasks for webhook processing
- Ed25519 signature verification pattern (adaptable for Stripe)

### Integration Points
- Admin layout wraps `/admin/clients`, `/admin/clients/new`, `/admin/clients/[id]`
- Admin uses createAdminClient (service role key) — not createClient (RLS-scoped)
- Stripe webhooks → FastAPI `/api/webhooks/stripe` → Supabase (update clients, insert billing)
- GHL Agency API → create sub-account during onboarding Server Action
- Resend email for payment failure alerts (same pattern as Phase 2 lead notification)

</code_context>

<specifics>
## Specific Ideas

- The admin layout should show a simple header with "Tradeflow Admin" and navigation links, not the full sidebar-nav from the dashboard
- The client list should clearly show which clients have GHL sub-accounts provisioned (green check) vs pending (yellow warning) via a badge or icon
- The onboarding form should pre-fill state with "IL" since all initial clients are Chicagoland
- The Stripe webhook handler on FastAPI needs the `stripe` Python package added to requirements.txt
- For payment failure emails, reuse the Resend pattern from Phase 2 but send from FastAPI (Python SDK) since the webhook is on FastAPI
- The `stripe_customer_id` needs to be set on the client record before Stripe webhooks can map events to clients — this happens either during onboarding or manually by the admin

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-operations*
*Context gathered: 2026-03-26*
