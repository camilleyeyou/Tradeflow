# Roadmap: Tradeflow

## Overview

Tradeflow is built in four phases that mirror the dependency chain from infrastructure to revenue. Phase 1 locks the data model and multi-tenancy before any code touches production data. Phase 2 builds the full lead pipeline — landing pages, form capture, GHL contact sync, SMS follow-up, and owner email notification — the closed loop that justifies the monthly retainer. Phase 3 gives HVAC clients a dashboard to see their leads moving through a pipeline, which is the primary retention driver. Phase 4 adds the admin panel for client onboarding and Stripe billing webhooks so the service can collect money and scale without manual database operations.

**Milestone v1.1 (Pre-launch hardening + core features)** continues the roadmap at Phase 5. A pre-launch audit found remotely exploitable security gaps and a missing feature that is already advertised on the live marketing site (missed-call text-back), so Phase 5 closes those launch blockers first. Phases 6–8 work down the audit's priority tiers (correctness/legal/SEO → hardening → hygiene) so the codebase is safe and clean before Phase 9 ships the four differentiating features (webhook durability + observability, ROI dashboard, two-way SMS inbox, and Claude-API lead scoring) that depend on a stable, secure foundation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Supabase schema, RLS policies, auth, and both app scaffolds
- [x] **Phase 2: Lead Pipeline** - Landing pages, lead capture API, GHL contact sync, SMS follow-up, and email notification
- [x] **Phase 3: Client Dashboard** - Auth-protected lead list, 5-stage status pipeline, call log, and settings (completed 2026-03-25)
- [x] **Phase 4: Operations** - Admin panel with GHL onboarding and Stripe billing webhooks (completed 2026-03-26)
- [ ] **Phase 5: Critical Security & Launch Blockers** - Close remotely exploitable security gaps and build the missing missed-call text-back pipeline
- [x] **Phase 6: High-Priority Correctness, Legal & SEO** - Fix per-client token/slug/validation bugs, add spam protection, legal pages, and landing-page SEO (completed 2026-07-06)
- [x] **Phase 7: Medium-Priority Hardening** - Async DB access, least-privilege RLS, schema integrity, and operational safety nets (completed 2026-07-06)
- [x] **Phase 8: Low-Priority Hygiene** - Repo cleanup, error pages, copy fixes, and doc accuracy (completed 2026-07-06)
- [x] **Phase 9: Features** - Webhook durability, error observability, ROI dashboard, SMS inbox, and AI lead scoring (completed 2026-07-06)

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
- [x] 02-01-PLAN.md — DB migration (slug column), Zod validation schema, GHL API client, npm installs
- [x] 02-02-PLAN.md — Static landing pages with generateStaticParams, lead capture form component
- [x] 02-03-PLAN.md — Lead submit API route with Supabase insert, GHL contact creation, SMS workflow, Resend email
- [x] 02-04-PLAN.md — FastAPI GHL webhook endpoint with Ed25519 signature verification
- [x] 02-05-PLAN.md — Integration verification: TypeScript/Python builds, env docs, visual checkpoint

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
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [x] 03-01-PLAN.md — shadcn/ui init, migration 003, shared types/utils/actions, responsive dashboard layout
- [x] 03-02-PLAN.md — Overview page (count cards + recent leads) and leads page (status dropdown + notes editor)
- [x] 03-03-PLAN.md — Call log page (recording links) and settings page (business info + notifications toggle)
- [x] 03-04-PLAN.md — Build verification and visual checkpoint for mobile responsiveness

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
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [x] 04-01-PLAN.md — Admin layout with top-nav header and client list page with status badges
- [x] 04-02-PLAN.md — Stripe webhook handler on FastAPI with signature verification and four event processors
- [x] 04-03-PLAN.md — Client onboarding form with GHL sub-account provisioning and client detail page
- [x] 04-04-PLAN.md — Build verification and visual checkpoint for admin panel

### Phase 5: Critical Security & Launch Blockers
**Goal**: Every remotely exploitable security gap found in the audit is closed, and missed calls are automatically captured as leads and text-backed within 15 seconds — so the platform can safely onboard paying clients
**Depends on**: Existing v1.0 app (Phases 1–4)
**Requirements**: SEC-01, SEC-02, SEC-03, MISS-01, MISS-02, MISS-03, MISS-04, DPLY-01, DPLY-02
**Success Criteria** (what must be TRUE):
  1. Calling `onboardClient` or `createClientLogin` as a non-admin or unauthenticated caller is rejected before the service-role client is touched, and no record is written
  2. RLS is enabled on `client_users` with a self-read-only policy; a client JWT cannot read or write another user's row via PostgREST
  3. The GHL webhook rejects any request without a valid Ed25519 `X-GHL-Signature`; the always-true legacy `X-WH-Signature` path no longer exists in the code
  4. A missed call arriving at the CallRail webhook (with valid token) creates a deduplicated `calls` record and a `leads` record (source `direct_call`), and triggers the GHL text-back workflow within 15 seconds; the dashboard call log shows the new call with its recording link
  5. Generated Supabase Database types replace the `types.ts` placeholder stub (no remaining `as any`/`@ts-expect-error` workarounds), and a documented checklist confirms one real lead traced form → DB → GHL SMS → Resend email, and one real missed call traced to text-back
**Plans**: 6 plans

Plans:
- [x] 05-01-PLAN.md — SEC-01: admin authorization guard on onboardClient + createClientLogin (wave 1)
- [x] 05-02-PLAN.md — SEC-02: enable RLS on client_users with self-read-only policy (wave 1)
- [x] 05-03-PLAN.md — SEC-03: remove GHL legacy X-WH-Signature bypass, Ed25519-only (wave 1)
- [x] 05-04-PLAN.md — MISS-01..04: CallRail webhook → deduped call+lead → GHL text-back → dashboard (wave 1)
- [x] 05-05-PLAN.md — DPLY-01/02: schema-accurate types.ts, remove type workarounds, write DEPLOY-CHECKLIST.md (wave 2)
- [ ] 05-06-PLAN.md — DPLY-01/02: requires-human/deploy — apply migrations, live type-gen, run two E2E traces (wave 3)
**UI hint**: yes

### Phase 6: High-Priority Correctness, Legal & SEO
**Goal**: Lead submission is technically correct for every client, the site meets baseline SMS/legal compliance, and landing pages are discoverable and free of known-vulnerable dependencies
**Depends on**: Phase 5
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04, FIX-05, FIX-06, SPAM-01, LEGL-01, LEGL-02, LEGL-03, SEO-01, SEO-02, DEP-01
**Success Criteria** (what must be TRUE):
  1. Every client's lead submissions route through that client's own stored GHL token (not a shared global token), and onboarding always derives a unique, collision-safe slug
  2. The lead form accepts phone numbers typed with parentheses, dashes, or spaces; the Stripe webhook returns 400 (not 500) on an invalid signature; admin authorization is unified on `isAdmin()` with `ADMIN_EMAILS` documented in `.env.example`; the FastAPI service boots reliably on Railway with a verified Procfile and pinned Python version
  3. Submitting the lead-submit or get-started form as a bot (honeypot filled, or exceeding the per-IP rate limit) is rejected
  4. The lead form shows SMS/call consent language before submission; Privacy Policy and Terms of Service pages are live and linked from the marketing and landing-page footers; a landing page's review rating and count come from that client's own data and are hidden when absent, never hardcoded
  5. Each landing page emits page-specific title/description/OG metadata; the site serves a `robots.txt` disallowing `/dashboard`, `/admin`, `/api` and a `sitemap.xml` of public landing pages; `npm audit` shows no unresolved high-severity findings on a patched Next.js 15.5.x
**Plans**: 6 plans

Plans:
- [x] 06-01-PLAN.md — FIX-03/04/05/06: phone normalization, Stripe exception, unified admin gating, Railway boot pin
- [x] 06-02-PLAN.md — FIX-01/02: per-client encrypted GHL token (migration 006) + collision-safe slug verify
- [x] 06-03-PLAN.md — LEGL-01/02/03: SMS consent copy, privacy/terms pages + footers, per-client reviews (migration 007)
- [x] 06-04-PLAN.md — SEO-01/02: landing generateMetadata + robots.ts + sitemap.ts
- [x] 06-05-PLAN.md — SPAM-01: honeypot + per-IP rate limiting on lead-submit and get-started
- [x] 06-06-PLAN.md — DEP-01: npm audit fix + patched Next 15.5.x + build verification
**UI hint**: yes

### Phase 7: Medium-Priority Hardening
**Goal**: Data integrity, performance, and operational safety nets match production standards, so degraded conditions (slow DB calls, bad redirects, missing env vars) fail safely instead of silently
**Depends on**: Phase 6
**Requirements**: HARD-01, HARD-02, HARD-03, HARD-04, HARD-05, HARD-06, HARD-07, HARD-08, HARD-09, HARD-10
**Success Criteria** (what must be TRUE):
  1. FastAPI webhook handlers no longer block the event loop on DB calls (verified under concurrent webhook load with an async client or threadpool offload)
  2. RLS grants are least-privilege — column-scoped UPDATE on `clients`, and explicit SELECT with scoped UPDATE but no DELETE/INSERT on `leads`, `calls`, `sms_sequences` — verified with a client JWT
  3. The schema enforces integrity: CHECK constraints exist on status/plan/outcome fields, required indexes exist (`billing(client_id)`, `leads(ghl_contact_id)`, `calls(lead_id)`), a unique index prevents duplicate `leads(callrail_call_id)`, and `updated_at` triggers fire on update
  4. The auth callback rejects an open-redirect `next` param; lead notification emails escape user-supplied values and honor `notifications_enabled`; temporary client passwords are generated with a cryptographically secure RNG
  5. Landing pages self-host fonts with no render-blocking third-party font requests and revalidate when a client's info changes; both apps validate required environment variables at boot and fail fast with a clear message; `requirements.txt` is minimal, fully pinned, and specifies a pinned Python version
**Plans**: 4 plans

Plans:
- [x] 07-01-PLAN.md — HARD-02/03: least-privilege RLS (migration 008) + schema integrity CHECKs/indexes/updated_at triggers (migration 009) (wave 1)
- [x] 07-02-PLAN.md — HARD-01/09/10: FastAPI run_in_threadpool DB offload + fail-fast env validation + pinned minimal requirements.txt (wave 1)
- [x] 07-03-PLAN.md — HARD-04/05/06/08: open-redirect fix, email escaping + notifications_enabled, crypto passwords, landing revalidation (wave 1)
- [x] 07-04-PLAN.md — HARD-07/09: self-host fonts (remove Fontshare links) + Next.js boot env validation (wave 1)
**UI hint**: yes

### Phase 8: Low-Priority Hygiene
**Goal**: The repository and public-facing edge cases are clean, so ad-click visitors and future contributors don't hit stale files, broken pages, or inaccurate docs
**Depends on**: Phase 7
**Requirements**: HYG-01, HYG-02, HYG-03, HYG-04
**Success Criteria** (what must be TRUE):
  1. Stale committed cruft (`CLAUDE (1).md`, unused create-next-app SVGs, the untracked brand-binaries directory) is removed or gitignored
  2. Visiting an unknown/bad slug shows a styled not-found page instead of a default framework error, and an unhandled render error is caught by a global error boundary
  3. The lead-form success message no longer references a hardcoded "312 number," and the low-contrast admin link is corrected to a readable style
  4. Planning docs and the web app README are internally consistent and accurately describe only the features that have actually shipped
**Plans**: 1 plan
**UI hint**: yes

Plans:
- [x] 08-01-PLAN.md — HYG-01..04: remove stale cruft, add not-found/global-error pages, fix hardcoded copy, correct README/ROADMAP docs

### Phase 9: Features
**Goal**: The platform is durable and observable in production, and HVAC owners get ROI visibility, a two-way SMS inbox, and AI-driven urgency ranking that surfaces the hottest leads first
**Depends on**: Phase 8
**Requirements**: DUR-01, OBSV-01, OBSV-02, ROI-01, ROI-02, INBX-01, AI-01, AI-02
**Success Criteria** (what must be TRUE):
  1. Every webhook handler durably records the raw event (deduped on the provider's event id) before returning 200, and a stored event can be replayed on demand
  2. Unhandled errors on both the FastAPI service and the Next.js app are captured by Sentry (or equivalent); Supabase automated backups are enabled/documented and an uptime check pings `/health`
  3. Each lead records a time-to-first-contact timestamp (first status change off `new` or first outbound touch), and the client dashboard shows a monthly summary of lead count, estimated lead value, and speed-to-lead
  4. An HVAC owner can view the SMS conversation for a lead in the dashboard and send a reply that reaches the homeowner through GHL
  5. Inbound leads are scored 1–10 for urgency via the Claude API from available lead/call data, and hot leads are surfaced at the top of the dashboard lead list
**Plans**: 5 plans

Plans:
- [x] 09-01-PLAN.md — DUR-01: webhook_events migration (010) + record-before-ACK in all 3 FastAPI handlers + replay path (wave 1)
- [x] 09-02-PLAN.md — OBSV-01/02: Sentry on FastAPI + Next.js + backups/uptime/env docs in DEPLOY-CHECKLIST (wave 1)
- [x] 09-03-PLAN.md — ROI-01/02: migration 011 (leads.first_contact_at) + first-contact stamping + dashboard ROI summary (wave 1)
- [x] 09-04-PLAN.md — INBX-01: GHL conversations service + auth'd route handler + lead-detail SMS inbox UI (wave 1)
- [x] 09-05-PLAN.md — AI-01/02: migration 012 (urgency_score/reason) + claude-fable-5 scoring in lead-submit after() + hot-lead sort/badge (wave 2)
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete |  |
| 2. Lead Pipeline | 5/5 | Complete |  |
| 3. Client Dashboard | 4/4 | Complete   | 2026-03-25 |
| 4. Operations | 4/4 | Complete   | 2026-03-26 |
| 5. Critical Security & Launch Blockers | 5/6 | In Progress|  |
| 6. High-Priority Correctness, Legal & SEO | 6/6 | Complete    | 2026-07-06 |
| 7. Medium-Priority Hardening | 4/4 | Complete    | 2026-07-06 |
| 8. Low-Priority Hygiene | 1/1 | Complete    | 2026-07-06 |
| 9. Features | 1/5 | Complete    | 2026-07-06 |
