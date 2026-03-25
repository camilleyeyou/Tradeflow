# Requirements: Tradeflow

**Defined:** 2026-03-25
**Core Value:** Every inbound lead is captured instantly, routed to the right HVAC contractor, and followed up automatically so no lead is ever lost.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FOUN-01**: Supabase schema deployed with all 7 tables (clients, leads, calls, sms_sequences, billing, client_users) and indexes
- [ ] **FOUN-02**: Row Level Security enabled on all tables with policies enforcing per-client data isolation
- [ ] **FOUN-03**: Supabase Auth configured with email/password for HVAC owners and magic link for admin
- [ ] **FOUN-04**: Next.js 15 App Router project scaffolded with TypeScript strict mode and Tailwind v4
- [ ] **FOUN-05**: FastAPI backend scaffolded with Pydantic v2, async handlers, and Supabase service role client
- [ ] **FOUN-06**: Environment variables configured for Supabase, Stripe, GHL, Resend across both apps

### Landing Pages

- [ ] **LAND-01**: Static landing page generated per client via `generateStaticParams` from clients table
- [ ] **LAND-02**: Landing page loads under 2 seconds on mobile (Lighthouse verified)
- [ ] **LAND-03**: Lead capture form with 4 fields: name, phone, service type (dropdown), zip code
- [ ] **LAND-04**: Click-to-call link (`tel:` format) for one-tap mobile calling with client's phone number
- [ ] **LAND-05**: Trust signals displayed: review stars, license badge, service area neighborhoods
- [ ] **LAND-06**: No navigation menu — single page, single CTA above the fold
- [ ] **LAND-07**: URL structure follows `/[clientSlug]/[service]` pattern (e.g., `/oak-park-hvac/ac-repair`)

### Lead Capture

- [ ] **LEAD-01**: Form submission POSTs to `/api/leads/submit`, validates with Zod, inserts into Supabase `leads` table
- [ ] **LEAD-02**: New lead creates a contact in the client's GoHighLevel sub-account via GHL API
- [ ] **LEAD-03**: HVAC owner receives email notification via Resend within 60 seconds of new lead
- [ ] **LEAD-04**: Form shows success state: "We'll call you within 5 minutes" after submission
- [ ] **LEAD-05**: Multi-step SMS follow-up sequence triggered via GHL workflow (immediate + 15min + 24hr)
- [ ] **LEAD-06**: SMS sequence stops when lead replies

### Dashboard

- [ ] **DASH-01**: Dashboard accessible only to authenticated HVAC owners (Supabase Auth guard)
- [ ] **DASH-02**: Lead overview page with count cards: new, contacted, booked, completed
- [ ] **DASH-03**: Lead list with 5-stage status pipeline (new → contacted → booked → completed → lost)
- [ ] **DASH-04**: Lead status updatable via dropdown on each lead row
- [ ] **DASH-05**: Inline notes field editable on each lead record
- [ ] **DASH-06**: Call log page showing all inbound calls with recording links from CallRail
- [ ] **DASH-07**: Settings page for business info and notification preferences
- [ ] **DASH-08**: Mobile-responsive layout (usable between jobs on phone)

### Admin Panel

- [ ] **ADMN-01**: Admin panel accessible only to users matching `ADMIN_EMAIL` env var
- [ ] **ADMN-02**: Client list page showing all clients with active/trial/inactive status
- [ ] **ADMN-03**: Client onboarding form that creates client record + provisions GHL sub-account
- [ ] **ADMN-04**: Single client detail page showing their leads, calls, and GHL sub-account link
- [ ] **ADMN-05**: Admin Supabase client uses service role key (bypasses RLS) — never exposed to browser

### Billing

- [ ] **BILL-01**: Stripe webhook handles `customer.subscription.created` → activates client
- [ ] **BILL-02**: Stripe webhook handles `customer.subscription.deleted` → deactivates client
- [ ] **BILL-03**: Stripe webhook handles `invoice.payment_succeeded` → inserts billing record
- [ ] **BILL-04**: Stripe webhook handles `invoice.payment_failed` → sends alert email via Resend
- [ ] **BILL-05**: All Stripe webhooks verify signature before processing
- [ ] **BILL-06**: Idempotency enforced — duplicate webhook events do not create duplicate records

### GoHighLevel Integration

- [ ] **GHL-01**: Each HVAC client gets their own GHL sub-account (never shared)
- [ ] **GHL-02**: Sub-account created programmatically via GHL Agency API during client onboarding
- [ ] **GHL-03**: `ghl_sub_account_id` and `ghl_contact_id` stored on client and lead records
- [ ] **GHL-04**: Inbound GHL webhook logs SMS replies from homeowners and updates lead notes
- [ ] **GHL-05**: GHL webhook verifies `X-GHL-Signature` (Ed25519, not deprecated `X-WH-Signature`)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

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
| Missed-call text-back | Deferred to v2 — budget constraint ($2K), handle manually initially |
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
| FOUN-01 | TBD | Pending |
| FOUN-02 | TBD | Pending |
| FOUN-03 | TBD | Pending |
| FOUN-04 | TBD | Pending |
| FOUN-05 | TBD | Pending |
| FOUN-06 | TBD | Pending |
| LAND-01 | TBD | Pending |
| LAND-02 | TBD | Pending |
| LAND-03 | TBD | Pending |
| LAND-04 | TBD | Pending |
| LAND-05 | TBD | Pending |
| LAND-06 | TBD | Pending |
| LAND-07 | TBD | Pending |
| LEAD-01 | TBD | Pending |
| LEAD-02 | TBD | Pending |
| LEAD-03 | TBD | Pending |
| LEAD-04 | TBD | Pending |
| LEAD-05 | TBD | Pending |
| LEAD-06 | TBD | Pending |
| DASH-01 | TBD | Pending |
| DASH-02 | TBD | Pending |
| DASH-03 | TBD | Pending |
| DASH-04 | TBD | Pending |
| DASH-05 | TBD | Pending |
| DASH-06 | TBD | Pending |
| DASH-07 | TBD | Pending |
| DASH-08 | TBD | Pending |
| ADMN-01 | TBD | Pending |
| ADMN-02 | TBD | Pending |
| ADMN-03 | TBD | Pending |
| ADMN-04 | TBD | Pending |
| ADMN-05 | TBD | Pending |
| BILL-01 | TBD | Pending |
| BILL-02 | TBD | Pending |
| BILL-03 | TBD | Pending |
| BILL-04 | TBD | Pending |
| BILL-05 | TBD | Pending |
| BILL-06 | TBD | Pending |
| GHL-01 | TBD | Pending |
| GHL-02 | TBD | Pending |
| GHL-03 | TBD | Pending |
| GHL-04 | TBD | Pending |
| GHL-05 | TBD | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 0
- Unmapped: 39 ⚠️

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after initial definition*
