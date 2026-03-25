# Project Research Summary

**Project:** Tradeflow
**Domain:** AI-powered lead generation platform for HVAC home service businesses (managed service + client dashboard)
**Researched:** 2026-03-25
**Confidence:** HIGH

## Executive Summary

Tradeflow is a managed lead generation service built on top of four orchestrated SaaS platforms: Google Local Services Ads (LSA) for traffic, CallRail for call tracking, GoHighLevel (GHL) for CRM and SMS automation, and Stripe for billing. The technical build is a Next.js 15 frontend on Vercel (landing pages, client dashboard, admin panel) backed by a FastAPI service on Railway for all webhook processing and third-party orchestration, with Supabase as the multi-tenant data store. The competitive moat is not technological complexity — it is the exclusive-lead model combined with fully managed onboarding and zero client self-service, which eliminates the chief failure mode of Angi and HomeAdvisor (shared leads, contractor self-serve, race-to-bottom pricing).

The recommended approach is to build in strict dependency order: Supabase schema with RLS policies first, auth second, then landing pages and lead capture in parallel with the webhook service. The critical path to revenue is the landing page + lead capture + missed-call text-back loop. Everything else — the client dashboard, admin panel, and billing — is operational scaffolding that enables the service to scale beyond manual management. Phase 1 is entirely about closing the loop from inbound call to contacted lead within 30 seconds, with no manual intervention from the HVAC owner.

The highest risks are multi-tenancy data isolation (RLS misconfiguration is silent — no error surfaces), webhook reliability (Stripe event ordering, CallRail double-fire, GHL signature deprecation), and GHL provisioning idempotency during client onboarding. All of these must be solved in Phase 1 before any paying client goes live. None are architecturally novel — they are integration discipline problems with established, documented prevention patterns.

---

## Key Findings

### Recommended Stack

The stack is locked and pre-validated. Next.js 15 with App Router handles all three frontend surfaces (static landing pages via `generateStaticParams`, auth-protected dashboard, admin panel) in a single Vercel deployment. FastAPI 0.135 on Railway handles all inbound webhooks and outbound third-party API calls — the Python runtime is preferred over Node for async webhook processing and provides a natural foundation for Phase 2 LLM integration (Claude API). Supabase provides Postgres, Auth, and RLS in a single managed service, eliminating auth boilerplate and enforcing multi-tenancy at the database layer.

**Core technologies:**
- **Next.js 15.5 + React 19:** Single deployment covers landing pages (static), dashboard (dynamic), and admin panel — App Router route groups keep auth guards clean without URL coupling
- **FastAPI 0.135 + Python 3.12:** Async webhook processing with BackgroundTasks; httpx.AsyncClient for all outbound calls; never use requests library (blocks event loop)
- **Supabase (Postgres + Auth + RLS):** Multi-tenancy enforced at DB layer; `@supabase/ssr` required for Next.js 15 App Router; `getUser()` not `getSession()` for auth checks
- **Tailwind CSS v4 + shadcn/ui:** Zero-config with Next.js 15.3+; shadcn components are copied into the repo (no version lock-in)
- **GoHighLevel API v2:** One sub-account per client; missed-call text-back and SMS workflows are native GHL features; rate limit 100 req/10s per resource
- **CallRail API v3:** Per-client tracking numbers; webhooks fire on call events; filter on `call_completed` + `answered=false` for missed-call detection
- **Stripe (stripe-node 20.x + Python SDK 10.x):** Node SDK in Next.js for portal links; Python SDK in FastAPI for webhook verification
- **Resend (Node SDK 6.9.x):** Transactional lead notification emails; called only from FastAPI, not Next.js

**Critical version notes:**
- Use `@supabase/ssr`, not deprecated `@supabase/auth-helpers-nextjs`
- Pydantic v2 only — v1 syntax deprecated in FastAPI 0.135
- GHL webhook: verify both `X-WH-Signature` and `X-GHL-Signature` now; `X-WH-Signature` deprecated July 1, 2026
- `await cookies()` and `await headers()` — Next.js 15 made these async APIs

### Expected Features

The MVP is defined by 8 features that must all ship together before the first client can go live. No feature can be cut independently because they form a closed loop: LSA drives traffic → landing page captures the lead → webhook creates the record → missed-call text-back responds within 30 seconds → dashboard gives the client proof → admin panel lets the operator onboard the next client → Stripe collects the retainer.

**Must have (table stakes):**
- Static landing page per client — required URL for LSA; sub-2s mobile load is a hard LSA quality score requirement
- Lead capture API (form → Supabase → GHL → email notification) — core promise; no lead lost
- CallRail webhook + missed-call text-back — highest ROI automation; GHL fires within 15 seconds; 80% of missed calls never book without it
- Client dashboard with lead list and 5-stage status pipeline — clients need visual proof the service is working
- Supabase Auth + RLS — multi-tenancy is non-negotiable the moment there are two paying clients
- Admin panel for client onboarding (GHL sub-account creation, CallRail number, page revalidation)
- Stripe billing + subscription webhooks — required to collect the monthly retainer
- GHL sub-account per client — isolation for SMS workflows, contacts, and pipelines

**Should have (competitive differentiators, add v1.x after first 2-3 clients):**
- Multi-step SMS follow-up sequence (immediate + 15min + 24hr, stops on reply)
- Inline notes on lead records — high retention value at low effort
- Call recording links surfaced in dashboard (not just linked to CallRail)
- Weekly performance email digest — drives retention for clients who don't log in

**Defer (v2+):**
- AI lead scoring (Claude API on call transcripts) — data pipeline must mature first
- AI voice agent for after-hours (Vapi.ai) — high complexity, high churn risk if unreliable
- Automated review requests — requires status-change webhook and consistent pipeline usage
- Facebook/Meta ads integration — prove LSA ROI first before adding second ad channel
- Analytics charts and revenue dashboards — lead counts satisfy v1 clients

**Anti-features to explicitly reject:**
- Shared lead marketplace — destroys the exclusive-lead competitive moat
- DIY campaign builder for clients — increases support burden and leads to broken campaigns
- Per-lead billing model — creates disputes, incentivizes gaming, unpredictable revenue
- Live SMS inbox in dashboard — GHL already provides this; replicating it is wasted effort

### Architecture Approach

The architecture separates concerns into three planes: Vercel (browser-facing, all three UI surfaces), Railway (server-side, webhook ingestion and third-party orchestration), and Supabase (data + auth). Next.js never calls GHL or Resend directly — those integrations live exclusively in FastAPI. The dashboard reads from Supabase via RLS-constrained server components; the admin writes to Supabase via a service role client confined to the `(admin)/` route group. Multi-tenancy is enforced at the database layer: every table has a `client_id` FK and an RLS policy that filters to the authenticated user's tenant, never derived from a request body.

**Major components:**
1. **Next.js App Router (Vercel)** — Three route groups: `(landing)/[slug]` (static, no auth), `(dashboard)/` (RLS-constrained server components, `force-dynamic`), `(admin)/` (service role, magic link auth)
2. **FastAPI (Railway)** — Thin webhook routers (verify signature, persist raw payload, return 200 immediately) + business logic in service modules + background tasks for GHL/Resend/Stripe processing
3. **Supabase** — `clients` table is the tenant root; all other tables (`leads`, `calls`, `sms_messages`, `subscriptions`, `notes`) carry `client_id` FK with RLS; indexes on every `client_id` column used in RLS policies are mandatory from day one
4. **GoHighLevel (one sub-account per client)** — CRM, missed-call text-back, SMS workflows; `ghl_location_id` stored on `clients` row; called only from FastAPI
5. **CallRail** — One tracking number per client; webhooks to FastAPI; recordings stored by CallRail, URL surfaced in dashboard

**Build order (hard dependencies):**
1. Supabase schema + RLS policies
2. Supabase Auth (client_users mapping)
3a. FastAPI webhook endpoints + lead creation (parallel with 3b)
3b. Next.js routing scaffold + auth middleware (parallel with 3a)
4. Landing page + lead form connected to FastAPI `/leads`; CallRail and Stripe webhooks
5. Client dashboard (reads from Supabase via RLS)
6. Admin panel (service role, GHL onboarding flow)
7. Static page generation per client with on-demand revalidation

### Critical Pitfalls

1. **RLS disabled by default on new tables** — Every `CREATE TABLE` migration must immediately follow with `ALTER TABLE [name] ENABLE ROW LEVEL SECURITY` and the policies in the same file. Run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` as a CI check. Test with a cross-tenant JWT — the SQL Editor runs as superuser and bypasses RLS, so it cannot be used to verify policies.

2. **Service role key in client bundle or Next.js client components** — The service role key must never appear with a `NEXT_PUBLIC_` prefix. In Next.js, confine the service role client to `lib/supabase/admin.ts` and import it only inside `(admin)/` route group files. In FastAPI, use it for all writes but never log or return it. Rotate immediately if leaked.

3. **Stripe webhooks arriving out of order or duplicated** — Store processed Stripe event IDs in a `stripe_events` table with a UNIQUE constraint. Treat every event as a trigger to re-fetch state from the Stripe API (pull-not-push), not as ground truth. Never update billing state directly from the event payload.

4. **CallRail double-fire and wrong event type** — Only trigger missed-call text-back on `call_completed` events with `answered=false` AND `call_type=missed` OR `call_type=abandoned`. The `call_started` event must be silently ignored. Store `call_id` on lead creation and deduplicate.

5. **GHL sub-account provisioning not idempotent** — Write `ghl_provisioning_started_at` timestamp before calling the GHL API. Check for existing `ghl_location_id` on the client record at the start of the onboarding flow. Disable the submit button on first click and show a loading state. Query the GHL API for existing sub-accounts by name before creating.

6. **GHL webhook signature deprecation (July 1, 2026)** — The `X-WH-Signature` header is deprecated July 1, 2026. Implement verification that accepts both `X-WH-Signature` (RSA) and `X-GHL-Signature` (Ed25519) from day one, with a warning log on legacy header use.

7. **Vercel Deployment Protection blocking webhooks** — Route all inbound webhooks to FastAPI on Railway, not to Next.js API routes on Vercel. Vercel Deployment Protection intercepts unauthenticated requests — external webhook providers have no way to pass this challenge.

---

## Implications for Roadmap

Based on the architecture's hard dependency chain and the feature dependency graph, 5 phases are recommended.

### Phase 1: Foundation — Schema, Auth, and Infrastructure

**Rationale:** Nothing else can be built safely without a locked schema and proven multi-tenancy. RLS misconfiguration is silent — it must be verified with automated tests before any data flows. Auth determines how every subsequent component handles identity. Both must be complete and tested before any service writes to the database.

**Delivers:** Supabase schema with all tables and RLS policies; Supabase Auth with client_users mapping; Next.js project with route groups and auth middleware; FastAPI project skeleton on Railway with health check; verified Supabase client separation (anon vs. service role)

**Addresses:** Lead storage, call records, subscription state, notes (all tables defined)

**Avoids:** RLS-disabled-by-default pitfall; service role key exposure; cross-tenant data leakage before any client goes live

**Research flag:** Standard patterns — well-documented in official Supabase + Next.js docs. Skip `/gsd:research-phase`.

---

### Phase 2: Lead Capture — Landing Pages and Inbound Webhook Pipeline

**Rationale:** This is the critical path to revenue. The landing page is the required destination URL for LSA without which no ads can run. The CallRail missed-call text-back is the highest-ROI automation in the product. These two features together close the loop from inbound interest to contacted lead within 30 seconds. They must be built together because missed-call text-back requires the CallRail webhook handler, which requires the lead creation API, which requires the landing page form endpoint.

**Delivers:** Static HVAC landing page per client (`generateStaticParams`); lead capture API (`POST /leads` in FastAPI); CallRail webhook handler with correct event type filtering; missed-call text-back trigger to GHL; Resend owner email notification; Stripe webhook handler with idempotency table

**Addresses:** Static landing page, lead capture, missed-call text-back, real-time lead notification, call recording log (CallRail data), Stripe billing webhooks

**Avoids:** CallRail double-fire pitfall; Stripe out-of-order/duplicate pitfall; GHL webhook signature deprecation pitfall; Vercel Deployment Protection pitfall; form double-submit duplicate leads

**Research flag:** CallRail `call_completed` event schema and `call_type` field values — verify against CallRail API v3 docs during implementation. GHL workflow trigger API for missed-call text-back — verify sub-account scoping. Consider `/gsd:research-phase` for the CallRail-to-GHL trigger integration.

---

### Phase 3: Client Dashboard — Lead Visibility and Status Pipeline

**Rationale:** Once leads flow into Supabase, the client dashboard is what makes them visible and turns the product from a black box into a service clients will pay to keep. The 5-stage pipeline is the primary retention driver — clients who can see leads moving through stages stay subscribed. The dashboard can be built independently of Phase 2 webhooks (it reads from Supabase, it does not write webhook logic) but requires leads to exist to be meaningful, hence phase 3.

**Delivers:** Auth-protected client dashboard; lead list with real-time status; 5-stage pipeline (new → contacted → booked → completed → lost); call recording links; America/Chicago timezone display; unread lead badge count in header

**Addresses:** Lead status pipeline, call log, mobile-responsive experience, transparent lead attribution, billing visibility (Stripe portal link)

**Avoids:** UTC timestamps in dashboard (display in America/Chicago); auth session leaks on dashboard routes (force-dynamic); client_id derived from session not request body

**Research flag:** Standard patterns — Next.js server components + Supabase RLS queries are well-documented. Skip `/gsd:research-phase`.

---

### Phase 4: Admin Panel — Client Onboarding and Operations

**Rationale:** The admin panel is the internal operator tool that enables the managed service model. It must come after the dashboard because onboarding a client requires all downstream systems to be ready to receive data. The GHL sub-account creation flow is the most complex idempotency challenge in the product and must be built with retries and duplicate prevention.

**Delivers:** Admin-only route group with magic link auth and `app_metadata.is_admin` guard; client onboarding wizard (creates Supabase client record, GHL sub-account, stores `ghl_location_id`, triggers static page revalidation); cross-client lead visibility; client status management (active, payment_failed, churned)

**Addresses:** Admin-managed onboarding (zero client self-service), Google LSA management ops support, seasonal campaign awareness tooling

**Avoids:** GHL sub-account provisioning not idempotent pitfall; admin panel accessible without role guard; GHL location IDs exposed in client-facing API responses; full rebuild on client update (use `revalidatePath`)

**Research flag:** GHL Agency API for programmatic sub-account creation — verify current endpoint and required scopes. Use `/gsd:research-phase` for GHL onboarding integration.

---

### Phase 5: Retention Features — v1.x Enhancements

**Rationale:** After the first 2-3 paying clients are live and patterns emerge, these features address the friction points that cause client churn or disengagement. They are not required to close the first client but are required to retain them beyond the first 90 days.

**Delivers:** Multi-step SMS follow-up sequence in GHL (immediate + 15min + 24hr, stops on reply); inline notes on lead records; weekly performance email digest via Resend cron; Stripe customer portal link in settings; call recording links in dashboard (replacing direct CallRail links)

**Addresses:** SMS follow-up sequence, inline notes, weekly digest, Stripe customer portal

**Avoids:** Building these features before Phase 1-4 are stable and data is flowing; AI features before data pipeline matures

**Research flag:** GHL multi-step workflow API for programmatic sequence creation — may need research. Resend cron pattern for weekly digest — standard, skip research.

---

### Phase Ordering Rationale

- Schema and auth must be complete before any service writes data — fixes the security model before any code touches it.
- Landing pages and webhook infrastructure come before the dashboard because there must be leads to display.
- Admin onboarding comes after the dashboard because all downstream systems must be ready before the first client is provisioned.
- Retention features come last because they require observed client behavior patterns to prioritize correctly.
- AI features (lead scoring, voice agent) are explicitly not in this roadmap — they require a mature data pipeline and are Phase 2+ business decisions, not Phase 1 technical prerequisites.

### Research Flags

Phases needing deeper research during planning:
- **Phase 2:** CallRail-to-GHL trigger integration — the specific API call sequence for creating a GHL contact in a sub-account and triggering the missed-call workflow needs verification against GHL API v2 docs
- **Phase 4:** GHL Agency API for programmatic sub-account creation — endpoint, required OAuth scopes, and idempotency options need verification; this is the highest-complexity external API call in the product

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1:** Supabase RLS + Next.js App Router auth — fully documented in official sources
- **Phase 3:** Next.js server components reading from Supabase with RLS — well-documented pattern
- **Phase 5:** Resend cron digest, Stripe customer portal link — standard integrations

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core decisions pre-validated by project team; all library versions verified against official npm and PyPI releases; compatibility matrix confirmed in official docs |
| Features | HIGH | Table stakes features verified against competitive analysis of Angi, ServiceTitan, Housecall Pro; GHL missed-call text-back capability verified against GHL docs |
| Architecture | HIGH | Patterns verified against official Supabase, FastAPI, and GHL API docs; RLS patterns confirmed against MakerKit production source; Next.js ISR patterns from official Next.js docs |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls verified against official docs (Supabase RLS, Stripe webhook idempotency, GHL signature deprecation); some edge cases from community sources that are directionally consistent |

**Overall confidence:** HIGH

### Gaps to Address

- **GHL missed-call text-back trigger API:** The exact API call sequence (create contact in sub-account → trigger workflow) needs implementation-time verification. The capability is confirmed; the specific endpoint parameters are not fully documented in public GHL docs.
- **CallRail `call_type` field values:** The exact enumeration of `call_type` values (especially `abandoned` vs. `missed`) should be verified against a live CallRail test account during Phase 2 implementation.
- **GHL sub-account creation idempotency options:** The GHL Agency API may or may not support a "create or get existing" pattern. If not, the optimistic lock (`ghl_provisioning_started_at`) approach described in PITFALLS.md is the fallback.
- **LSA quality score thresholds:** The sub-2s mobile load requirement is cited consistently but the exact LSA scoring methodology is not publicly documented by Google. Treat the 2s threshold as a hard requirement regardless.

---

## Sources

### Primary (HIGH confidence)
- [Next.js 15.5 Release Blog](https://nextjs.org/blog/next-15-5) — versions, Turbopack, Node.js middleware stable
- [Next.js Upgrading to v15 Guide](https://nextjs.org/docs/app/guides/upgrading/version-15) — async APIs, caching changes
- [Supabase SSR Next.js Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — `getUser()` vs `getSession()`, cookie patterns
- [Supabase RLS official documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policies, `pg_tables` verification
- [GHL Developer Portal](https://marketplace.gohighlevel.com/docs/) — API v2, sub-account creation, rate limits
- [GHL Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html) — signature migration, July 2026 deprecation
- [CallRail API v3 Docs](https://apidocs.callrail.com/) — webhook events, auth
- [Stripe webhook docs](https://docs.stripe.com/billing/subscriptions/webhooks) — event ordering, idempotency
- [FastAPI Background Tasks docs](https://fastapi.tiangolo.com/tutorial/background-tasks/) — BackgroundTasks pattern
- [Railway FastAPI Deployment Guide](https://docs.railway.com/guides/fastapi) — deployment, health checks
- [shadcn/ui React 19 Compatibility](https://ui.shadcn.com/docs/react-19) — Tailwind v4 support
- [Tailwind CSS v4 + Next.js Guide](https://tailwindcss.com/docs/guides/nextjs) — postcss config

### Secondary (MEDIUM confidence)
- [Supabase RLS best practices (MakerKit)](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) — production multi-tenant patterns
- [GoHighLevel White Label Agency Setup 2026](https://ghl-services-playbooks-automation-crm-marketing.ghost.io/gohighlevel-white-label/) — GHL ecosystem
- [Google LSA for Contractors 2026 (PushLeads)](https://pushleads.com/google-local-services-ads-in-2026-the-complete-setup-and-optimization-guide-for-contractors/) — LSA quality requirements
- [FastAPI webhook handling patterns (Neon)](https://neon.com/guides/fastapi-webhooks) — verified against FastAPI docs
- [FastAPI background tasks reliability (BetterStack)](https://betterstack.com/community/guides/scaling-python/background-tasks-in-fastapi/) — BackgroundTasks limits
- [Stripe idempotency best practices (Stigg)](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks) — production patterns
- [Multi-tenant leakage when RLS fails (Medium)](https://medium.com/@instatunnel/multi-tenant-leakage-when-row-level-security-fails-in-saas-da25f40c788c) — RLS edge cases

### Tertiary (LOW confidence)
- [Angi vs Thumbtack vs Exclusive Leads (Minyona)](https://minyona.com/blog/angi-vs-thumbtack-vs-exclusive-leads) — competitive close rates (directionally consistent, single source)
- [Are Angi Leads Worth It 2026 (Contracting Empire)](https://contractingempire.com/is-angi-worth-it-for-contractors/) — practitioner perspective on shared lead model

---
*Research completed: 2026-03-25*
*Ready for roadmap: yes*
