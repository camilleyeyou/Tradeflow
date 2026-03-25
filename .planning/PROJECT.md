# Tradeflow

## What This Is

Tradeflow is an AI-powered lead generation platform for home service businesses, starting with HVAC contractors in the Chicagoland area (Chicago city + suburbs). HVAC companies pay a monthly retainer ($500–$1,500/mo) and receive managed Google LSA ads, optimized landing pages, missed-call text-back automation, SMS follow-up sequences, and a private dashboard showing all their leads and performance.

## Core Value

Every inbound lead — whether from an ad click, landing page form, or missed call — is captured instantly, routed to the right HVAC contractor, and followed up automatically so no lead is ever lost.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] HVAC client landing pages: statically generated, mobile-first, sub-2s load, one CTA, lead form (name, phone, service, zip)
- [ ] Lead capture API: form submission → Supabase insert → GHL contact creation → owner email notification via Resend
- [ ] Missed-call text-back: CallRail webhook → lead creation → GHL text-back workflow trigger
- [ ] Client dashboard: auth-protected, lead list with status pipeline (new → contacted → booked → completed → lost), call log, inline notes
- [ ] Admin panel: list all clients, onboard new clients (+ GHL sub-account), view any client's leads and calls
- [ ] Supabase Auth: email/password for HVAC owners, magic link for admin, RLS enforcing multi-tenancy
- [ ] Stripe billing: subscription lifecycle webhooks, invoice tracking, payment failure alerts
- [ ] GoHighLevel integration: sub-account per client, contact sync, SMS workflow triggers, inbound message logging
- [ ] CallRail integration: call tracking per campaign, call recording/transcript storage, missed call detection

### Out of Scope

- AI voice agent (Vapi.ai) — Phase 2, not needed for MVP revenue
- LLM lead scoring (Claude API) — Phase 2, manual triage sufficient initially
- Analytics charts and revenue dashboards — Phase 2, clients can see lead counts for now
- Facebook/Meta ads integration — Phase 2, LSA is the primary channel first
- Review request automation — Phase 2, manual process acceptable initially
- Automated weekly report emails — Phase 2
- Web scraping pipeline (Apify) — Phase 3
- Outbound LLM prospect scoring — Phase 3
- Multi-client SaaS billing portal — Phase 3
- Plumbing/roofing vertical expansion — Phase 3
- Real-time chat — high complexity, not core
- Mobile native app — web-first, mobile responsive sufficient
- OAuth login — email/password sufficient for v1

## Context

- **Market:** HVAC in Chicagoland. Seasonal surges: winter (Oct–Feb) and summer (May–Aug). Chicago LSA cost per lead: $25–$55 suburbs, $45–$85 city.
- **Target client profile:** 2–5 technicians, 5–25 Google reviews, outdated website. First clients in inner suburbs: Oak Park, Berwyn, Evanston.
- **Go-to-market:** Business partner (sales) physically visits HVAC companies in Chicago. Pilot offer: 2-week free trial + $200 in ad spend covered by Tradeflow.
- **Partnership:** 50/50 revenue split. Technical partner = Camille. Business partner handles sales.
- **Competitive advantage:** Exclusive leads (not shared like Angi), AI automation pipeline.
- **Domain:** TBD (checking tradeflow.io, gettradeflow.com).
- **Existing artifacts:** Detailed database schema (6 tables with RLS), API contracts for 4 webhook endpoints, full project structure defined.

## Constraints

- **Tech stack:** Next.js 15 (App Router) + Tailwind on Vercel, FastAPI on Railway, Supabase (Postgres + Auth), GoHighLevel, CallRail, Stripe, Resend — all decided and locked
- **Multi-tenancy:** Row Level Security in Supabase — every client sees only their own data, admin uses service role key
- **Landing page performance:** Under 2 seconds on mobile, statically generated at build time
- **Security:** Webhook signature verification required, no secrets in browser, truncated PII in logs
- **Phase discipline:** Phase 1 MVP only — no Phase 2/3 features until generating revenue

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| GoHighLevel as CRM/automation hub | Handles SMS sequences, missed-call text-back, contact management — avoids building from scratch | — Pending |
| CallRail for call tracking | Industry standard for LSA call tracking, provides recording + transcripts | — Pending |
| Supabase over custom Postgres | Auth + RLS + real-time built in, fast to ship MVP | — Pending |
| FastAPI backend separate from Next.js | Webhook processing, cron jobs, and GHL orchestration need a dedicated service | — Pending |
| One Next.js app for all three sites | Marketing, landing pages, dashboard, and admin share one deployment — simpler infra | — Pending |
| Sub-account per client in GHL | Isolation between clients, no cross-contamination of contacts or workflows | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after initialization*
