# Roadmap: Tradeflow

## Overview

Tradeflow is built in four phases that mirror the dependency chain from infrastructure to revenue. Phase 1 locks the data model and multi-tenancy before any code touches production data. Phase 2 builds the full lead pipeline — landing pages, form capture, GHL contact sync, SMS follow-up, and owner email notification — the closed loop that justifies the monthly retainer. Phase 3 gives HVAC clients a dashboard to see their leads moving through a pipeline, which is the primary retention driver. Phase 4 adds the admin panel for client onboarding and Stripe billing webhooks so the service can collect money and scale without manual database operations.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Supabase schema, RLS policies, auth, and both app scaffolds
- [ ] **Phase 2: Lead Pipeline** - Landing pages, lead capture API, GHL contact sync, SMS follow-up, and email notification
- [ ] **Phase 3: Client Dashboard** - Auth-protected lead list, 5-stage status pipeline, call log, and settings
- [ ] **Phase 4: Operations** - Admin panel with GHL onboarding and Stripe billing webhooks

## Phase Details

### Phase 1: Foundation
**Goal**: The data layer and both apps are running, multi-tenancy is enforced at the database level, and every subsequent phase can write to Supabase safely
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04, FOUN-05, FOUN-06
**Success Criteria** (what must be TRUE):
  1. All 7 Supabase tables exist with indexes and RLS enabled; a cross-tenant query with a client JWT returns zero rows from another tenant
  2. An HVAC owner can sign in with email/password; the admin can sign in via magic link; both land on distinct route groups
  3. The Next.js app boots at localhost with the three route groups scaffolded (`(landing)`, `(dashboard)`, `(admin)`) and TypeScript strict mode passes
  4. The FastAPI app responds 200 on `/health` from Railway with the Supabase service role client initialized
  5. Running `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` shows `rowsecurity = true` for every table
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Supabase schema migration (6 tables, RLS, indexes) + seed data + cross-tenant RLS verification
- [x] 01-02-PLAN.md — Next.js 15 scaffold: route groups, Supabase clients, middleware auth guard, login page
- [x] 01-03-PLAN.md — FastAPI scaffold: /health endpoint, Supabase service role client, env vars

### Phase 2: Lead Pipeline
**Goal**: A homeowner can find a client's landing page, submit a lead form or call and miss, and within 60 seconds the HVAC owner receives an email notification and an SMS follow-up sequence has started — with no manual intervention
**Depends on**: Phase 1
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04, LAND-05, LAND-06, LAND-07, LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05, LEAD-06, GHL-01, GHL-03, GHL-04, GHL-05
**Success Criteria** (what must be TRUE):
  1. A static landing page is served at `/[clientSlug]/[service]`, passes Lighthouse mobile load under 2 seconds, has no navigation menu, and shows one CTA above the fold with click-to-call and trust signals
  2. Submitting the lead form inserts a record in the Supabase `leads` table, creates a GHL contact in the client's sub-account, and sends the HVAC owner a Resend email — all within 60 seconds; the form shows a success message after submission
  3. A GHL-triggered SMS sequence fires immediately after lead creation, with a 15-minute and 24-hour follow-up; the sequence stops when the homeowner replies
  4. GHL inbound SMS replies are logged to lead notes via the FastAPI webhook, verified with `X-GHL-Signature` (Ed25519)
  5. Submitting the same form twice does not create two GHL contacts or two email notifications (idempotency enforced)
**Plans**: 5 plans
**UI hint**: yes

Plans:
- [ ] 02-01-PLAN.md — DB migration (slug column), Zod validation schema, GHL API client, npm installs
- [ ] 02-02-PLAN.md — Static landing pages with generateStaticParams, lead capture form component
- [ ] 02-03-PLAN.md — Lead submit API route with Supabase insert, GHL contact creation, SMS workflow, Resend email
- [ ] 02-04-PLAN.md — FastAPI GHL webhook endpoint with Ed25519 signature verification
- [ ] 02-05-PLAN.md — Integration verification: TypeScript/Python builds, env docs, visual checkpoint

### Phase 3: Client Dashboard
**Goal**: An authenticated HVAC owner can log in and see all their leads in a pipeline, update statuses, read call recordings, and manage their notification settings — from a phone between jobs
**Depends on**: Phase 2
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08
**Success Criteria** (what must be TRUE):
  1. An HVAC owner who logs in sees only their own leads; a second client's JWT cannot retrieve the first client's leads
  2. The lead list shows count cards (new, contacted, booked, completed) and each row has a status dropdown that saves on change without a page reload
  3. An inline notes field is editable on each lead record and persists on refresh
  4. The call log page lists all inbound calls with recording links sourced from CallRail data
  5. The dashboard layout is fully usable on a 375px-wide mobile screen with no horizontal scroll
**Plans**: TBD
**UI hint**: yes

### Phase 4: Operations
**Goal**: The admin can onboard a new HVAC client (creating their Supabase record and GHL sub-account in one flow), and Stripe subscription lifecycle events automatically activate, deactivate, and track billing without any manual database changes
**Depends on**: Phase 3
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05, BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, GHL-02
**Success Criteria** (what must be TRUE):
  1. The admin (magic link only) can view all clients with their status and drill into any client's leads and calls without that data being accessible to HVAC owner accounts
  2. Completing the client onboarding form creates a Supabase client record and provisions a GHL sub-account; submitting the form twice does not create two GHL sub-accounts
  3. A Stripe `customer.subscription.created` webhook activates the client; `customer.subscription.deleted` deactivates them; the same Stripe event ID processed twice produces no duplicate records
  4. A failed invoice triggers a Resend alert email to the admin; a successful payment inserts a billing record
  5. All Stripe webhooks reject requests without a valid signature before processing any logic
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete |  |
| 2. Lead Pipeline | 0/5 | Planning complete | - |
| 3. Client Dashboard | 0/TBD | Not started | - |
| 4. Operations | 0/TBD | Not started | - |
