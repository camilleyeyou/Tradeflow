---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: milestone
status: Milestone complete
stopped_at: Completed 09-05-PLAN.md
last_updated: "2026-07-06T17:38:16.695Z"
progress:
  total_phases: 9
  completed_phases: 8
  total_plans: 38
  completed_plans: 37
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-06)

**Core value:** Every inbound lead is captured instantly, routed to the right HVAC contractor, and followed up automatically so no lead is ever lost.
**Current focus:** Phase 9 — Features

## Current Position

Phase: 9
Plan: Not started

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-foundation P01 | 2 | 2 tasks | 2 files |
| Phase 01-foundation P03 | 12 | 2 tasks | 12 files |
| Phase 01-foundation P02 | 15 | 2 tasks | 16 files |
| Phase 02-lead-pipeline P01 | 155 | 2 tasks | 3 files |
| Phase 02-lead-pipeline P03 | 4 | 1 tasks | 2 files |
| Phase 02-lead-pipeline P02 | 2 | 2 tasks | 3 files |
| Phase 02-lead-pipeline P04 | 4 | 2 tasks | 3 files |
| Phase 02-lead-pipeline P05 | 6 | 2 tasks | 2 files |
| Phase 03-client-dashboard P01 | 21 | 2 tasks | 22 files |
| Phase 03-client-dashboard P03 | 7 | 2 tasks | 4 files |
| Phase 03-client-dashboard P02 | 4 | 2 tasks | 7 files |
| Phase 03-client-dashboard P04 | 8 | 2 tasks | 6 files |
| Phase 04-operations P02 | 5 | 2 tasks | 5 files |
| Phase 04-operations P01 | 516 | 2 tasks | 3 files |
| Phase 04-operations P03 | 20 | 2 tasks | 6 files |
| Phase 04-operations P04 | 2 | 1 tasks | 0 files |
| Phase 05 P01 | 2min | 2 tasks | 2 files |
| Phase 05 P02 | 3min | 1 tasks | 1 files |
| Phase 05 P03 | 4min | 2 tasks | 2 files |
| Phase 05 P04 | 7min | 3 tasks | 6 files |
| Phase 05 P05 | 12min | 3 tasks | 6 files |
| Phase 06 P01 | 8min | 4 tasks | 7 files |
| Phase 06 P02 | 15min | 4 tasks | 10 files |
| Phase 06 P03 | 12min | 4 tasks | 8 files |
| Phase 06 P04 | 6min | 3 tasks | 4 files |
| Phase 06-high-priority-correctness-legal-seo P05 | 3min | 3 tasks | 6 files |
| Phase 06 P06 | 12min | 2 tasks | 2 files |
| Phase 07 P01 | 6min | 2 tasks | 2 files |
| Phase 07 P02 | 6min | 3 tasks | 6 files |
| Phase 07-medium-priority-hardening P03 | 8min | 3 tasks | 8 files |
| Phase 07 P04 | 8min | 2 tasks | 3 files |
| Phase 08-low-priority-hygiene P01 | 20min | 4 tasks | 11 files |
| Phase 09-features P01 | 12min | 3 tasks | 6 files |
| Phase 09-features P02 | 20min | 3 tasks | 8 files |
| Phase 09-features P03 | 5min | 3 tasks | 6 files |
| Phase 09-features P04 | 8min | 3 tasks | 5 files |
| Phase 09 P05 | 12min | 3 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- All stack choices locked: Next.js 15 + FastAPI + Supabase + GHL + CallRail + Stripe + Resend
- Webhooks route to FastAPI on Railway only — never to Next.js (Vercel Deployment Protection blocks them)
- GHL sub-account per client — never shared; created programmatically during admin onboarding
- GHL webhook: verify both `X-WH-Signature` (RSA) and `X-GHL-Signature` (Ed25519); X-WH-Signature deprecated July 1, 2026 — **v1.1 Phase 5 removes the legacy RSA path entirely (SEC-03)**
- [Phase 01-foundation]: Added sms_sequences RLS policy missing from CLAUDE (1).md — deny-all default would silently break dashboard; policy uses 2-hop join: lead_id → leads.client_id → client_users
- [Phase 01-foundation]: client_users table has no RLS enabled by design — it is the identity source used by all other RLS policies; enabling RLS on it would create circular dependency
- [Milestone v1.1 CORRECTION]: The above is WRONG and a critical vulnerability. A table in the public schema with RLS disabled is fully readable AND writable by anon/authenticated via PostgREST — any user can insert a (auth.uid(), victim_client_id) row and defeat every other policy. There is no circular dependency: a `USING (user_id = (select auth.uid()))` SELECT policy lets a user read only their own mapping, which is exactly what the other policies' subqueries need. Fix is to ENABLE RLS on client_users with that self-read policy (admin writes use the service role, which bypasses RLS). **This is Phase 5 SEC-02.**
- [Phase 01-foundation]: FastAPI Procfile uses api.main:app dotted module path — uvicorn runs from repo root where api/ package lives
- [Phase 01-foundation]: Supabase service role client uses global singleton initialized in lifespan hook — safe to reuse, not per-request
- [Phase 01-foundation]: create-next-app@15 creates src/ directory regardless of --src-dir no flag; all files live under apps/web/src/ with @/* alias pointing to ./src/*
- [Phase 01-foundation]: types.ts is a placeholder stub until supabase gen types typescript is run after Phase 1 Supabase deployment verification — **v1.1 Phase 5 (DPLY-01) closes this out**
- [Phase 01-foundation]: middleware.ts lives at apps/web/ root (not src/) — Next.js requires middleware at the app root directory
- [Phase 02-lead-pipeline]: GHL client uses per-request token (not module-level singleton) to support per-client sub-account tokens — **v1.1 Phase 6 (FIX-01) makes this the client's own stored token instead of the shared global token**
- [Phase 02-lead-pipeline]: Lead submit handler uses inline createClient (not createAdminClient) — admin.ts is restricted to (admin)/ route group per code comment
- [Phase 02-lead-pipeline]: GHL and Resend calls run in next/server after() — 200 returned to homeowner before any external API calls
- [Phase 02-lead-pipeline]: Used createClient from @supabase/supabase-js (not createServerClient) in generateStaticParams to avoid dynamic rendering — no cookies needed at build time
- [Phase 02-lead-pipeline]: service_area_zips handled as both string[] and string to be safe until Database types are generated post-Phase-1-deployment
- [Phase 02-lead-pipeline]: GHL legacy RSA signature (X-WH-Signature) accepted permissively during transition — hard removal deadline July 1, 2026 documented in code — **removed in v1.1 Phase 5 (SEC-03), ahead of the deadline since it is an always-true bypass today**
- [Phase 02-lead-pipeline]: GHL webhook: single POST /api/webhooks/ghl endpoint routes all events by event_type field
- [Phase 02-lead-pipeline]: GHL Ed25519 public key stays hardcoded in ghl_service.py — no env var needed for webhook verification
- [Phase 03-client-dashboard]: shadcn CLI 4.x defaulted to base-nova style (not new-york) — accepted as equivalent for this project
- [Phase 03-client-dashboard]: Server Actions use @ts-expect-error on .update() calls due to Database types stub — auto-resolves when supabase gen types runs post-deployment (v1.1 Phase 5, DPLY-01)
- [Phase 03-client-dashboard]: base-ui Switch onCheckedChange receives (checked, eventDetails) — Controller render extracts boolean before passing to react-hook-form field
- [Phase 03-client-dashboard]: settings page uses supabase as any cast for stub database types — auto-resolves when supabase gen types runs post-deployment (v1.1 Phase 5, DPLY-01)
- [Phase 03-client-dashboard]: LeadsTable is a Client Component because it renders StatusSelect and NotesEditor — cleaner boundary than Server Component with deeply nested client children
- [Phase 03-client-dashboard]: StatusSelect wraps setOptimisticStatus inside startTransition — required for correct optimistic update in React 19 concurrent mode; calling outside startTransition resets immediately
- [Phase 03-client-dashboard]: base-ui Select onValueChange signature is (value, eventDetails) — adapted StatusSelect handler to match base-ui API
- [Phase 03-client-dashboard]: Dashboard pages relocated under (dashboard)/dashboard/ to resolve route group URL collision between (dashboard) and (marketing)
- [Phase 03-client-dashboard]: generateStaticParams returns empty array when Supabase URL is a placeholder — prevents build crash in local/CI without real credentials
- [Phase 03-client-dashboard]: Login page createClient() moved into submit handler body to prevent SSR prerender from calling createBrowserClient with malformed URL
- [Phase 04-operations]: stripe.errors.SignatureVerificationError used (v14.x namespace) — not stripe.error which is v13.x and below — **audit found the reference still points at the wrong SDK class in one path; v1.1 Phase 6 (FIX-04) corrects it so invalid signatures return 400 not 500**
- [Phase 04-operations]: stripe-signature header alias is lowercase — FastAPI normalizes all HTTP headers to lowercase
- [Phase 04-operations]: resend[async] extra required for send_async() in FastAPI async background tasks — bare resend lacks anyio
- [Phase 04-operations]: base-ui Button has no asChild support — use buttonVariants() className on Link directly
- [Phase 04-operations]: @ts-expect-error not needed on admin createAdminClient query — types.ts stub types query as any, directive causes compile error
- [Phase 04-operations]: supabase as any cast required for insert/update in admin actions — types.ts stub maps Record<string,unknown> Insert to never in write paths; reads work without cast
- [Phase 04-operations]: state field in onboardingSchema uses z.string().min(1) without .default() — .default() makes input type optional, breaking react-hook-form Resolver type; IL default set in form defaultValues instead
- [Phase 04-operations]: Admin (admin) route group compiles correctly but does not appear in Next.js build summary output — routes confirmed in .next/server/app/(admin)/ after build
- [Milestone v1.1 roadmap]: Phases 5-9 derived directly from the pre-launch audit's priority tiers (Critical → High → Medium → Low → Features) per explicit user ordering; security and the advertised-but-missing missed-call feature land first (Phase 5) before any correctness/hardening/hygiene work, and the four new differentiating features land last (Phase 9) since they depend on a stable, secured foundation
- [Phase 05]: Reused the existing getUser()/isAdmin() guard pattern from settings-actions.ts for onboardClient and createClientLogin rather than introducing a new helper (SEC-01 fix)
- [Phase 05]: Confirmed v1.0 circular-dependency rationale for disabling RLS on client_users was incorrect; self-read SELECT policy (user_id = auth.uid()) closes SEC-02 without breaking other tables' subqueries. No write policies added — admin writes use service role key.
- [Phase 05]: Removed verify_ghl_legacy_signature entirely rather than implementing real RSA verification (SEC-03) — GHL Ed25519 path already correct; legacy path was a dead always-true bypass with no remaining use case
- [Phase 05]: CallRail signature verification computes and compares both hex and base64 HMAC-SHA256 digests against the header value since CallRail's exact digest encoding must be confirmed at deploy time (fails closed either way)
- [Phase 05]: is_missed_call checks event.answered is False (strict identity) so payloads lacking the answered field are not misclassified as missed
- [Phase 05]: Kept per-client GHL token as shared GHL_PRIVATE_TOKEN env var for this plan — Phase 6 FIX-01 seam left as a comment in ghl_api.py and callrail_webhooks.py
- [Phase 05]: DPLY-01: Hand-authored schema-accurate Database type from migrations 001-005 (mirrors real supabase gen types shape); live type-gen deferred to 05-06
- [Phase 05]: onboardClient was missing required clients.slug on insert (NOT NULL, no DB default) — real types surfaced this bug; fixed by deriving slug from business_name using migration 002's backfill normalization
- [Phase 06]: Middleware inlines emailIsAdmin() helper mirroring src/lib/admin.ts rather than importing it, to keep admin gating unified on ADMIN_EMAILS without adding server-only deps to the Edge runtime
- [Phase 06]: [Phase 06-02]: Installed vitest as apps/web's first test runner to satisfy tdd=true on the crypto helper task (RED/GREEN confirmed); no broader test-infra decision made
- [Phase 06]: [Phase 06-02]: Lead-submit's GHL block now guards on token presence — a client with neither a stored per-client token nor a configured global GHL_PRIVATE_TOKEN fallback skips GHL silently instead of throwing
- [Phase 06]: [Phase 06-03]: Landing-page reviews block gated on hasReviews (both review_rating and review_count non-null) — null is the intentional 'hide' signal, not a sentinel like 0
- [Phase 06]: [Phase 06-04]: generateMetadata mirrors the page component's own service-role client fetch pattern rather than a shared cache; sitemap.ts and robots.ts both reuse the exact placeholder-guard from generateStaticParams, with sitemap.ts additionally try/catching the query to degrade to static-only URLs on any Supabase error
- [Phase 06-high-priority-correctness-legal-seo]: [Phase 06-05]: In-memory Map-based rate limiter accepted as best-effort per serverless instance rather than adding Redis/Upstash — sufficient for basic bot deterrence at launch scope
- [Phase 06]: Bumped next to ^15.5.20 (caret, not exact pin) within the locked 15.5 minor to clear 8 high-severity Next.js CVEs; residual moderate postcss<8.5.10 advisory is bundled inside next's own dependency tree and left unresolved (not actionable without an upstream Next.js fix)
- [Phase 07]: [Phase 07-01]: Used Postgres native GRANT UPDATE (col1, col2, ...) on clients rather than a trigger-based column-write guard — RLS row policies cannot restrict column-level writes and GRANT is simpler/declarative
- [Phase 07]: [Phase 07-01]: No INSERT/DELETE policies added for leads/calls/sms_sequences — all writes to these tables are made by the service role, which bypasses RLS entirely; clients only need SELECT + scoped UPDATE
- [Phase 07]: [Phase 07-02]: Kept sync Supabase client as-is, only wrapped .execute() calls in run_in_threadpool per plan interface — no async-client migration
- [Phase 07]: [Phase 07-02]: requirements.txt trimmed to 9 top-level imported packages (verified via grep) plus uvicorn/python-dotenv — removed pyiceberg, fastar, pyroaring, fastapi-cloud-cli, fastapi-cli, sentry-sdk; resend[async] pinned exact to 2.32.2
- [Phase 07]: [Phase 07]: [07-03]: Reused inline escapeHtml() from api/get-started/route.ts verbatim as the new shared apps/web/src/lib/escape-html.ts util rather than writing new logic
- [Phase 07]: [Phase 07][07-04]: Removed Fontshare <head> block outright rather than migrating General Sans/Gambetta to next/font/local — no CSS depends on them, only inline styles with system/Georgia fallbacks already present
- [Phase 07]: [Phase 07][07-04]: validateEnv() parsing kept inside function body (not module top-level) so next build never crashes; only runs when instrumentation.ts register() executes on nodejs runtime at actual server boot
- [Phase 08-low-priority-hygiene]: [Phase 08-01]: Also removed the stale legacy RSA GHL signature mention from README's architecture diagram while fixing the CallRail webhook omission — that path was already removed in Phase 5 (SEC-03)
- [Phase 09-features]: [Phase 09][09-01]: GHL provider_event_id fallback chain (webhookId -> id -> messageId -> body hash) since GHL webhooks lack one canonical id field across event types
- [Phase 09-features]: [Phase 09][09-01]: webhook_events RLS enabled with zero policies — service-role only, no anon/authenticated access by design
- [Phase 09-features]: [Phase 09][09-02]: Placed instrumentation-client.ts under apps/web/src/ (not repo root as in plan frontmatter) to match this project's src-dir convention and Next.js's requirement that it live alongside instrumentation.ts
- [Phase 09-features]: [Phase 09][09-02]: All Sentry/Anthropic env vars are optional/feature-flag — DSN or key unset fully disables the feature with no crash, no addition to REQUIRED_ENV_VARS or serverEnvSchema
- [Phase 09-features]: [Phase 09][09-03]: ESTIMATED_LEAD_VALUE hardcoded at $400/lead as a placeholder constant, exported and clearly labeled 'estimated, not actual revenue' in the UI — no real per-job revenue data exists yet
- [Phase 09-features]: [Phase 09][09-03]: first_contact_at stamped via read-then-conditional-write inside updateLeadStatus (earliest-touch wins) rather than a DB trigger
- [Phase 09-features]: [Phase 09][09-04]: decryptToken() wrapped in try/catch inside resolveLeadContext so a missing/invalid GHL_TOKEN_ENC_KEY degrades to empty thread / 409 rather than a 500 crash
- [Phase 09]: [Phase 09][09-05]: Scoring block placed as a third independent try/catch inside after() (after GHL and Resend) so a scoring failure can never cascade into either of those paths or the already-sent 200 response

### Pending Todos

None yet.

### Blockers/Concerns

- Milestone v1.1 sourced from a full pre-launch audit (frontend, backend, database, launch-readiness). Full findings live in the git history of this session; the milestone requirements encode them.
- Nothing is confirmed deployed: all cloud env vars (RESEND/GHL/STRIPE/CALLRAIL) are empty locally, Supabase migrations may not be applied, and `apps/web/src/lib/supabase/types.ts` is still the placeholder stub. Deploy + `supabase gen types` + populating Vercel/Railway env vars are launch prerequisites the human must perform. **This is now tracked as Phase 5 (DPLY-01, DPLY-02).**
- CallRail integration does not exist yet (no webhook, no writer to `calls`) — v1.1 Phase 5 (MISS-01..04) builds it.
- Per-client GHL token model: a single global `GHL_PRIVATE_TOKEN` cannot serve multiple sub-accounts; v1.1 Phase 6 (FIX-01) moves to a per-client stored token.
- Phase 4 (prior): GHL Agency API for programmatic sub-account creation — endpoint and required OAuth scopes still need verification at implementation time.
- Launch is targeted the week of 2026-07-13 — Phase 5 (security + missed-call) is the critical path and should be planned/executed first, ahead of Phases 6-9.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260723-ih0 | Expand to HVAC + plumbing trades and add Tech Services section to marketing homepage | 2026-07-23 | ad7b0c7 | [260723-ih0-expand-to-hvac-plumbing-trades-and-add-t](./quick/260723-ih0-expand-to-hvac-plumbing-trades-and-add-t/) |
| 260723-lfp | SEO/structured-data/OG-image/FAQ/presentation audit pass for marketing + landing surfaces | 2026-07-23 | 7a995a0 | [260723-lfp-seo-structured-data-og-image-faq-and-pre](./quick/260723-lfp-seo-structured-data-og-image-faq-and-pre/) |
| 260723-fast | Update pricing to Starter $750 / Growth $1,250 / Premium $1,750 monthly tiers | 2026-07-23 | 8202c69 | (inline /gsd:fast) |
| 260723-oop | Automated Google review-request SMS on lead completion + monthly ROI report emails via Vercel cron | 2026-07-24 | da3369b | [260723-oop-monthly-roi-report-emails-automated-goog](./quick/260723-oop-monthly-roi-report-emails-automated-goog/) |
| 260723-ph8 | Migration 015 (job_value_cents + timezone) + demo client seed + real job-value tracking + per-client timezone support | 2026-07-23 | 253a309 | [260723-ph8-demo-client-seed-real-job-value-tracking](./quick/260723-ph8-demo-client-seed-real-job-value-tracking/) |
| 260723-fast2 | Demo login provisioned + auto re-link in seed + docs/DEMO-GUIDE.md for PR lead | 2026-07-24 | e4cda61 | (inline /gsd:fast) |
| 260723-fast3 | Fix prod 500 on dynamic routes: env boot check demoted RESEND/service-role to warn-only | 2026-07-24 | 62f5b4a | (inline /gsd:fast) |
| 260723-fast4 | Dashboard sign-out button + sidebar contrast fixes | 2026-07-24 | 9d794f3 | (inline /gsd:fast) |
| 260723-fast5 | Marketing image refresh: dual-trade mockups + new tech-services illustration | 2026-07-24 | df47b16 | (inline /gsd:fast) |

## Session Continuity

Last session: 2026-07-06T17:35:59.796Z
Stopped at: Completed 09-05-PLAN.md
Resume file: None
Last activity: 2026-07-24 - Refreshed marketing SVGs for HVAC+plumbing and added tech-services illustration
