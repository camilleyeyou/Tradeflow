# Requirements: Tradeflow

**Defined:** 2026-03-25
**Core Value:** Every inbound lead is captured instantly, routed to the right HVAC contractor, and followed up automatically so no lead is ever lost.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUN-01**: Supabase schema deployed with all 7 tables (clients, leads, calls, sms_sequences, billing, client_users) and indexes
- [x] **FOUN-02**: Row Level Security enabled on all tables with policies enforcing per-client data isolation
- [x] **FOUN-03**: Supabase Auth configured with email/password for HVAC owners and magic link for admin
- [x] **FOUN-04**: Next.js 15 App Router project scaffolded with TypeScript strict mode and Tailwind v4
- [x] **FOUN-05**: FastAPI backend scaffolded with Pydantic v2, async handlers, and Supabase service role client
- [x] **FOUN-06**: Environment variables configured for Supabase, Stripe, GHL, Resend across both apps

### Landing Pages

- [x] **LAND-01**: Static landing page generated per client via `generateStaticParams` from clients table
- [x] **LAND-02**: Landing page loads under 2 seconds on mobile (Lighthouse verified)
- [x] **LAND-03**: Lead capture form with 4 fields: name, phone, service type (dropdown), zip code
- [x] **LAND-04**: Click-to-call link (`tel:` format) for one-tap mobile calling with client's phone number
- [x] **LAND-05**: Trust signals displayed: review stars, license badge, service area neighborhoods
- [x] **LAND-06**: No navigation menu — single page, single CTA above the fold
- [x] **LAND-07**: URL structure follows `/[clientSlug]/[service]` pattern (e.g., `/oak-park-hvac/ac-repair`)

### Lead Capture

- [x] **LEAD-01**: Form submission POSTs to `/api/leads/submit`, validates with Zod, inserts into Supabase `leads` table
- [x] **LEAD-02**: New lead creates a contact in the client's GoHighLevel sub-account via GHL API
- [x] **LEAD-03**: HVAC owner receives email notification via Resend within 60 seconds of new lead
- [x] **LEAD-04**: Form shows success state: "We'll call you within 5 minutes" after submission
- [x] **LEAD-05**: Multi-step SMS follow-up sequence triggered via GHL workflow (immediate + 15min + 24hr)
- [x] **LEAD-06**: SMS sequence stops when lead replies

### Dashboard

- [x] **DASH-01**: Dashboard accessible only to authenticated HVAC owners (Supabase Auth guard)
- [x] **DASH-02**: Lead overview page with count cards: new, contacted, booked, completed
- [x] **DASH-03**: Lead list with 5-stage status pipeline (new → contacted → booked → completed → lost)
- [x] **DASH-04**: Lead status updatable via dropdown on each lead row
- [x] **DASH-05**: Inline notes field editable on each lead record
- [x] **DASH-06**: Call log page showing all inbound calls with recording links from CallRail
- [x] **DASH-07**: Settings page for business info and notification preferences
- [x] **DASH-08**: Mobile-responsive layout (usable between jobs on phone)

### Admin Panel

- [x] **ADMN-01**: Admin panel accessible only to users matching `ADMIN_EMAIL` env var
- [x] **ADMN-02**: Client list page showing all clients with active/trial/inactive status
- [x] **ADMN-03**: Client onboarding form that creates client record + provisions GHL sub-account
- [x] **ADMN-04**: Single client detail page showing their leads, calls, and GHL sub-account link
- [x] **ADMN-05**: Admin Supabase client uses service role key (bypasses RLS) — never exposed to browser

### Billing

- [x] **BILL-01**: Stripe webhook handles `customer.subscription.created` → activates client
- [x] **BILL-02**: Stripe webhook handles `customer.subscription.deleted` → deactivates client
- [x] **BILL-03**: Stripe webhook handles `invoice.payment_succeeded` → inserts billing record
- [x] **BILL-04**: Stripe webhook handles `invoice.payment_failed` → sends alert email via Resend
- [x] **BILL-05**: All Stripe webhooks verify signature before processing
- [x] **BILL-06**: Idempotency enforced — duplicate webhook events do not create duplicate records

### GoHighLevel Integration

- [x] **GHL-01**: Each HVAC client gets their own GHL sub-account (never shared)
- [x] **GHL-02**: Sub-account created programmatically via GHL Agency API during client onboarding
- [x] **GHL-03**: `ghl_sub_account_id` and `ghl_contact_id` stored on client and lead records
- [x] **GHL-04**: Inbound GHL webhook logs SMS replies from homeowners and updates lead notes
- [x] **GHL-05**: GHL webhook verifies `X-GHL-Signature` (Ed25519, not deprecated `X-WH-Signature`)

## v1.1 Requirements (Milestone v1.1 — Pre-launch hardening + core features)

Sourced from the pre-launch audit. Grouped by the priority tier that becomes a roadmap phase: Critical → High → Medium → Low → Features.

### Critical Security & Launch Blockers

- [x] **SEC-01**: `onboardClient` and `createClientLogin` Server Actions reject any caller who is not an authenticated admin (verified via `getUser()` + `isAdmin()`) before touching the service-role client
- [ ] **SEC-02**: RLS is enabled on `client_users` with a self-read-only policy; no authenticated or anon user can read or write another user's mapping via PostgREST
- [ ] **SEC-03**: The GHL webhook rejects any request without a valid Ed25519 `X-GHL-Signature`; the always-true legacy `X-WH-Signature` path is removed
- [ ] **MISS-01**: A CallRail webhook endpoint (`POST /api/webhooks/callrail`) receives call events and verifies their authenticity (token/signature) before processing
- [ ] **MISS-02**: A missed call creates a `calls` record and a `leads` record (source `direct_call`), deduplicated on the CallRail call id
- [ ] **MISS-03**: A missed call triggers the GHL text-back workflow within 15 seconds of the event
- [ ] **MISS-04**: The dashboard call log populates from ingested CallRail calls with recording links
- [ ] **DPLY-01**: Supabase migrations are applied and generated Database types replace the `types.ts` placeholder stub (removing the `as any`/`@ts-expect-error` workarounds)
- [ ] **DPLY-02**: A documented env-var + end-to-end verification checklist exists for Supabase, Vercel, and Railway (one real lead traced form → DB → GHL SMS → Resend email; one real missed call traced to text-back)

### High-Priority Correctness, Legal & SEO

- [ ] **FIX-01**: Lead submission uses the client's own GHL token (stored per client at onboarding), not a single global token
- [ ] **FIX-02**: Client onboarding derives and stores a unique `slug` (collision-handled) so inserts never violate the NOT NULL constraint
- [ ] **FIX-03**: The lead form accepts common phone formats (parentheses, dashes, spaces) by normalizing to digits before validation
- [ ] **FIX-04**: The Stripe webhook returns 400 (not 500) on an invalid signature — the exception reference is corrected to the installed SDK's class
- [ ] **FIX-05**: Admin authorization is unified on `isAdmin()` across middleware and layouts, supporting `ADMIN_EMAILS`; `ADMIN_EMAILS` is documented in `.env.example`
- [ ] **FIX-06**: The FastAPI service boots on Railway with a verified Procfile/module path and a pinned Python version
- [ ] **SPAM-01**: The lead-submit and get-started endpoints reject bot traffic via a honeypot field plus per-IP rate limiting
- [ ] **LEGL-01**: The lead form displays SMS/call consent language at the point of capture before enrolling a number in automated messaging
- [ ] **LEGL-02**: Privacy Policy and Terms of Service pages exist and are linked from the marketing and landing-page footers
- [ ] **LEGL-03**: Landing-page review rating and count are per-client data fields (hidden when absent), never a hardcoded claim
- [ ] **SEO-01**: Each landing page emits page-specific metadata (title/description/OG) derived from business, service, and city
- [ ] **SEO-02**: The site serves a `robots.txt` (disallowing `/dashboard`, `/admin`, `/api`) and a `sitemap.xml` of public landing pages
- [ ] **DEP-01**: Known-vulnerable production dependencies are patched (Next.js bumped to a patched 15.5.x; `npm audit` high-severity findings resolved)

### Medium-Priority Hardening

- [ ] **HARD-01**: FastAPI webhook DB access no longer blocks the event loop (async Supabase client or threadpool offload)
- [ ] **HARD-02**: RLS grants are least-privilege — column-scoped UPDATE on `clients`; explicit SELECT + scoped UPDATE (no client DELETE/INSERT) on `leads`, `calls`, `sms_sequences`
- [ ] **HARD-03**: The schema enforces integrity — CHECK constraints on status/plan/outcome fields, indexes on `billing(client_id)`/`leads(ghl_contact_id)`/`calls(lead_id)`, a unique index on `leads(callrail_call_id)`, and `updated_at` columns with triggers
- [ ] **HARD-04**: The auth callback validates the `next` redirect param to prevent open redirects
- [ ] **HARD-05**: Lead notification emails escape user-supplied values, and the `notifications_enabled` preference actually suppresses the email
- [ ] **HARD-06**: Temporary client passwords are generated with a cryptographically secure RNG
- [ ] **HARD-07**: Fonts are self-hosted (via `next/font/local`) so landing pages carry no render-blocking third-party font requests
- [ ] **HARD-08**: Landing pages revalidate when a client's info or onboarding changes (no indefinitely stale phone numbers)
- [ ] **HARD-09**: Both apps validate required environment variables at boot and fail fast with a clear message
- [ ] **HARD-10**: `requirements.txt` is minimal and fully pinned (unused packages removed, `resend` pinned); a Python version is pinned for deployment

### Low-Priority Hygiene

- [ ] **HYG-01**: Stale/committed cruft is removed or ignored (`CLAUDE (1).md`, unused create-next-app SVGs, the untracked brand-binaries directory)
- [ ] **HYG-02**: The app serves a styled `not-found` page and a global error boundary for ad-click visitors hitting bad slugs
- [ ] **HYG-03**: Hardcoded placeholder copy is fixed (the "312 number" success message) and the low-contrast admin link is corrected
- [ ] **HYG-04**: Planning docs are internally consistent and the web README accurately reflects shipped features

### Features

- [ ] **DUR-01**: Every webhook handler durably records the raw event (deduped on the provider event id) before returning 200, and supports replay of a stored event
- [ ] **OBSV-01**: Sentry (or equivalent) captures unhandled errors on both the FastAPI service and the Next.js app
- [ ] **OBSV-02**: Supabase automated backups are enabled/documented and an uptime check pings `/health`
- [ ] **ROI-01**: Each lead records its time-to-first-contact (first status change off `new` or first outbound touch)
- [ ] **ROI-02**: The client dashboard shows a monthly summary of lead count, estimated lead value, and speed-to-lead
- [ ] **INBX-01**: The client dashboard shows the SMS conversation per lead and lets the owner send a reply through GHL
- [ ] **AI-01**: Inbound leads are scored for urgency (e.g. 1–10) via the Claude API from the available lead/call data
- [ ] **AI-02**: The dashboard surfaces high-urgency ("hot") leads at the top of the list

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

> **Promoted to v1.1:** MISS-01..03 (missed-call automation), AI-01 (lead scoring). The v1.1 IDs above supersede the v2 stubs below.

### Missed-Call Automation

- **MISS-01**: CallRail webhook receives call events at FastAPI endpoint
- **MISS-02**: Missed calls (filtered on `call_completed` with `answered=false`) create lead with source = `direct_call`
- **MISS-03**: Missed call triggers GHL text-back workflow within 15 seconds

### AI Features

- **AI-01**: LLM lead scoring (1-10) based on call transcript or form data via Claude API
- **AI-02**: AI voice agent for after-hours call answering via Vapi.ai

### Retention

- **RETN-01**: Automated review request SMS after lead marked "completed"
- **RETN-02**: Weekly performance email digest via Resend cron job
- **RETN-03**: Stripe customer portal link for invoice/card management

### Analytics

- **ANLX-01**: Analytics charts showing lead volume, conversion rates, cost per lead
- **ANLX-02**: Revenue dashboard for admin

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| ~~Missed-call text-back~~ | **Promoted to v1.1** — it is advertised on the live marketing site, so it must exist before onboarding paying clients |
| Facebook/Meta ads integration | LSA is primary channel first, prove before adding second |
| Real-time chat inbox | GHL already provides this in sub-account UI — don't replicate |
| DIY campaign builder for clients | Managed service model — clients get reporting, not controls |
| Per-lead billing model | Monthly retainer is simpler, more predictable, avoids disputes |
| Mobile native app | PWA sufficient, no App Store overhead justified at this scale |
| OAuth / Google SSO | Email/password sufficient for 2-5 person HVAC shops |
| Multi-location support | Treat each location as separate client account |
| Web scraping pipeline (Apify) | Phase 3 — outbound prospecting |
| Multi-vertical expansion | Focus on Chicagoland HVAC exclusivity first |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 | Phase 1 | Complete |
| FOUN-02 | Phase 1 | Complete |
| FOUN-03 | Phase 1 | Complete |
| FOUN-04 | Phase 1 | Complete |
| FOUN-05 | Phase 1 | Complete |
| FOUN-06 | Phase 1 | Complete |
| LAND-01 | Phase 2 | Complete |
| LAND-02 | Phase 2 | Complete |
| LAND-03 | Phase 2 | Complete |
| LAND-04 | Phase 2 | Complete |
| LAND-05 | Phase 2 | Complete |
| LAND-06 | Phase 2 | Complete |
| LAND-07 | Phase 2 | Complete |
| LEAD-01 | Phase 2 | Complete |
| LEAD-02 | Phase 2 | Complete |
| LEAD-03 | Phase 2 | Complete |
| LEAD-04 | Phase 2 | Complete |
| LEAD-05 | Phase 2 | Complete |
| LEAD-06 | Phase 2 | Complete |
| GHL-01 | Phase 2 | Complete |
| GHL-02 | Phase 4 | Complete |
| GHL-03 | Phase 2 | Complete |
| GHL-04 | Phase 2 | Complete |
| GHL-05 | Phase 2 | Complete |
| DASH-01 | Phase 3 | Complete |
| DASH-02 | Phase 3 | Complete |
| DASH-03 | Phase 3 | Complete |
| DASH-04 | Phase 3 | Complete |
| DASH-05 | Phase 3 | Complete |
| DASH-06 | Phase 3 | Complete |
| DASH-07 | Phase 3 | Complete |
| DASH-08 | Phase 3 | Complete |
| ADMN-01 | Phase 4 | Complete |
| ADMN-02 | Phase 4 | Complete |
| ADMN-03 | Phase 4 | Complete |
| ADMN-04 | Phase 4 | Complete |
| ADMN-05 | Phase 4 | Complete |
| BILL-01 | Phase 4 | Complete |
| BILL-02 | Phase 4 | Complete |
| BILL-03 | Phase 4 | Complete |
| BILL-04 | Phase 4 | Complete |
| BILL-05 | Phase 4 | Complete |
| BILL-06 | Phase 4 | Complete |
| SEC-01 | Phase 5 | Complete |
| SEC-02 | Phase 5 | Pending |
| SEC-03 | Phase 5 | Pending |
| MISS-01 | Phase 5 | Pending |
| MISS-02 | Phase 5 | Pending |
| MISS-03 | Phase 5 | Pending |
| MISS-04 | Phase 5 | Pending |
| DPLY-01 | Phase 5 | Pending |
| DPLY-02 | Phase 5 | Pending |
| FIX-01 | Phase 6 | Pending |
| FIX-02 | Phase 6 | Pending |
| FIX-03 | Phase 6 | Pending |
| FIX-04 | Phase 6 | Pending |
| FIX-05 | Phase 6 | Pending |
| FIX-06 | Phase 6 | Pending |
| SPAM-01 | Phase 6 | Pending |
| LEGL-01 | Phase 6 | Pending |
| LEGL-02 | Phase 6 | Pending |
| LEGL-03 | Phase 6 | Pending |
| SEO-01 | Phase 6 | Pending |
| SEO-02 | Phase 6 | Pending |
| DEP-01 | Phase 6 | Pending |
| HARD-01 | Phase 7 | Pending |
| HARD-02 | Phase 7 | Pending |
| HARD-03 | Phase 7 | Pending |
| HARD-04 | Phase 7 | Pending |
| HARD-05 | Phase 7 | Pending |
| HARD-06 | Phase 7 | Pending |
| HARD-07 | Phase 7 | Pending |
| HARD-08 | Phase 7 | Pending |
| HARD-09 | Phase 7 | Pending |
| HARD-10 | Phase 7 | Pending |
| HYG-01 | Phase 8 | Pending |
| HYG-02 | Phase 8 | Pending |
| HYG-03 | Phase 8 | Pending |
| HYG-04 | Phase 8 | Pending |
| DUR-01 | Phase 9 | Pending |
| OBSV-01 | Phase 9 | Pending |
| OBSV-02 | Phase 9 | Pending |
| ROI-01 | Phase 9 | Pending |
| ROI-02 | Phase 9 | Pending |
| INBX-01 | Phase 9 | Pending |
| AI-01 | Phase 9 | Pending |
| AI-02 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0 ✓
- v1.1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-07-06 after v1.1 roadmap creation (Phases 5-9)*
