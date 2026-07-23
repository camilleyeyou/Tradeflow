---
phase: quick-260723-ih0
plan: 01
subsystem: full-stack
tags: [nextjs, zod, trade-config, supabase, claude-scoring, marketing]

# Dependency graph
requires:
  - phase: 09-features
    provides: AI urgency scoring (scoring.ts), lead submit route, dashboard/lead pipeline
provides:
  - clients.trade column (migration 013) with hvac/plumbing CHECK constraint
  - apps/web/src/lib/trades.ts — single source of truth for per-trade service slugs, labels, default service, scoring copy
  - Trade-aware landing pages, lead form, AI scoring prompt, sitemap
  - Admin onboarding trade selector persisted to clients.trade
  - Marketing site repositioned for HVAC + plumbing nationwide with a Tech Services section
affects: [future plumbing-client onboarding, future trade-specific dashboard copy, future SEO/marketing iterations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Trade config module (apps/web/src/lib/trades.ts) as single source of truth for per-trade service slugs/labels/scoring copy, consumed by both Server and Client Components"
    - "getTradeConfig(trade) defaults to hvac for unknown/missing trade values so legacy/existing clients are unaffected by the new column"

key-files:
  created:
    - supabase/migrations/013_add_client_trade.sql
    - apps/web/src/lib/trades.ts
  modified:
    - apps/web/src/lib/supabase/types.ts
    - apps/web/src/lib/validations/lead.ts
    - apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx
    - apps/web/src/app/(landing)/[clientSlug]/page.tsx
    - apps/web/src/components/lead-form.tsx
    - apps/web/src/lib/scoring.ts
    - apps/web/src/app/api/leads/submit/route.ts
    - apps/web/src/app/sitemap.ts
    - apps/web/src/lib/validations/onboarding.ts
    - apps/web/src/app/(admin)/admin/clients/new/page.tsx
    - apps/web/src/lib/actions/onboarding-actions.ts
    - apps/web/src/app/(marketing)/page.tsx
    - apps/web/src/app/layout.tsx
    - apps/web/src/app/(marketing)/get-started/page.tsx
    - apps/web/src/app/(marketing)/privacy/page.tsx

key-decisions:
  - "getTradeConfig(trade) defaults to 'hvac' for any unknown/null/undefined trade value — every existing client (all currently hvac via migration default) keeps working with zero data migration risk"
  - "ALL_SERVICE_SLUGS is a flat, hand-written tuple (not derived at runtime from TRADES) so it stays a literal-typed z.enum-compatible tuple; a comment marks it as needing to stay in sync with TRADES"
  - "Landing redirect stub ([clientSlug]/page.tsx) fetches the client's trade in a try/catch that never wraps the redirect() call itself, since redirect() throws an internal control-flow signal that must not be swallowed"

patterns-established:
  - "Any future trade-specific copy/logic should read from @/lib/trades rather than hardcoding slugs/labels"

requirements-completed: [TRADE-DB, TRADE-CONFIG, TRADE-LANDING, TRADE-SCORING, TRADE-ADMIN, MKT-HOMEPAGE, MKT-SEO]

# Metrics
duration: 13min
completed: 2026-07-23
---

# Quick Task 260723-ih0: Expand to HVAC + Plumbing Trades, Reposition Marketing Summary

**Added a `clients.trade` column and a single `trades.ts` config module that makes landing pages, the lead form, AI urgency scoring, admin onboarding, and the sitemap trade-aware (HVAC or plumbing), then repositioned the marketing site nationwide with a new Tech Services section.**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-07-23T13:24:00-07:00 (approx, first commit 13:28)
- **Completed:** 2026-07-23T13:36:40-07:00
- **Tasks:** 3
- **Files modified:** 17 (2 created, 15 modified)

## Accomplishments
- `clients.trade` column added via migration 013 (CHECK hvac|plumbing, NOT NULL DEFAULT 'hvac') — zero-risk backfill for existing HVAC clients
- New `apps/web/src/lib/trades.ts` is the single source of truth for per-trade service slugs, labels, default service, and AI-scoring prompt language
- Landing pages (`[clientSlug]/[service]`, `[clientSlug]` redirect stub), the lead form, AI urgency scoring, the lead-submit route, and the sitemap all read from `trades.ts` instead of hardcoded HVAC-only maps
- Admin onboarding now has a working HVAC/Plumbing selector that persists to `clients.trade`
- Marketing homepage repositioned nationwide (no Chicagoland-only framing) with a new `#tech-services` section (mailto CTA, no public pricing) plus updated SEO copy across layout/get-started/privacy

## Task Commits

Each task was committed atomically:

1. **Task 1: Data layer + trade config source of truth** - `98658b1` (feat)
2. **Task 2: Trade-aware landing pages, lead form, AI scoring, sitemap** - `ab0e274` (feat)
3. **Task 3: Admin trade selector + marketing repositioning + Tech Services + SEO copy** - `0cbb28d` (feat)

**Plan metadata:** (this SUMMARY commit, see below)

## Files Created/Modified
- `supabase/migrations/013_add_client_trade.sql` - Adds `clients.trade` column with CHECK constraint
- `apps/web/src/lib/trades.ts` - Single source of truth: `TRADES`, `getTradeConfig`, `getServiceLabel`, `isValidServiceForTrade`, `ALL_SERVICE_SLUGS`
- `apps/web/src/lib/supabase/types.ts` - `clients` Row/Insert/Update gain `trade`
- `apps/web/src/lib/validations/lead.ts` - `SERVICE_TYPES`/`service_type` now sourced from `ALL_SERVICE_SLUGS`
- `apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx` - Static params, metadata, validation, and labels driven by the client's trade
- `apps/web/src/app/(landing)/[clientSlug]/page.tsx` - Redirects to the client's trade default service (falls back to hvac on any failure)
- `apps/web/src/components/lead-form.tsx` - Renders service options from the trade's config; new required `trade` prop
- `apps/web/src/lib/scoring.ts` - System prompt built dynamically from the trade's scoring copy
- `apps/web/src/app/api/leads/submit/route.ts` - Fetches the client's trade before calling `scoreLeadUrgency`
- `apps/web/src/app/sitemap.ts` - Crosses each client with its trade's service slugs
- `apps/web/src/lib/validations/onboarding.ts` - Adds `trade: z.enum(['hvac','plumbing'])` (no `.default()`, per prior Phase 04 RHF/Zod lesson)
- `apps/web/src/app/(admin)/admin/clients/new/page.tsx` - New Trade `<select>`; neutral business-name placeholder
- `apps/web/src/lib/actions/onboarding-actions.ts` - `onboardClient` inserts `trade` on the clients row
- `apps/web/src/app/(marketing)/page.tsx` - Removed all Chicagoland-only framing; added `#tech-services` section + nav link
- `apps/web/src/app/layout.tsx` - Global title/description cover HVAC + plumbing + tech services
- `apps/web/src/app/(marketing)/get-started/page.tsx` - Nationwide badge + footer tagline copy
- `apps/web/src/app/(marketing)/privacy/page.tsx` - Metadata description now trade-neutral

## Decisions Made
- `getTradeConfig()` defaults unknown/missing trade to `'hvac'` — every pre-existing client (migration-backfilled to `'hvac'`) and any legacy code path that hasn't been updated continues to work with zero risk.
- `ALL_SERVICE_SLUGS` kept as a hand-written literal tuple (not computed from `TRADES` at runtime) so `z.enum()` retains a literal string-union type; a comment flags it must stay in sync with `TRADES`.
- The landing redirect stub's Supabase fetch is wrapped in try/catch, but `redirect()` itself is called outside that catch block, since Next's `redirect()` throws an internal control-flow signal (`NEXT_REDIRECT`) that a catch-all try/catch would otherwise swallow.

## Deviations from Plan

None - plan executed exactly as written. All three tasks (data layer, landing/scoring/sitemap wiring, admin + marketing) were implemented per the plan's interfaces and file list with no architectural changes, no missing-critical-functionality additions, and no blocking issues requiring auto-fixes.

## Issues Encountered
- Intermittent sandbox network flakiness reaching `fonts.googleapis.com` caused a few `npm run build` attempts to fail with `next/font: Failed to fetch 'Poppins'/'Geist Mono'` errors. This is unrelated to this plan's changes (the `next/font/google` imports in `layout.tsx` predate this task; only the `title`/`description` strings were touched). Confirmed not a code defect: `npx tsc --noEmit` passed consistently across every attempt, and `npm run build` (via `npx next build --turbopack`) completed successfully with all 17 routes generated once network access to the font CDN was available again.

## Next Phase Readiness
- Frontend type-checks (`npx tsc --noEmit`) and builds (`npm run build`) both pass cleanly.
- No remaining `Chicagoland` references in the marketing homepage; no local `SERVICE_LABELS`/`SERVICE_OPTION_LABELS` maps remain in the landing page or lead form.
- Existing HVAC slugs (`ac-repair`, `furnace-repair`, `installation`, `maintenance`) unchanged in `trades.ts` — existing HVAC client URLs are unaffected.
- A human should apply migration 013 to the live Supabase project (per the existing DPLY-01/DPLY-02 launch-prerequisite pattern) before onboarding the first plumbing client.
- No blockers for future plumbing-client onboarding or further trade-specific dashboard/reporting work.

---
*Quick task: 260723-ih0*
*Completed: 2026-07-23*

## Self-Check: PASSED

All 17 files listed above confirmed present on disk; all 3 task commits (`98658b1`, `ab0e274`, `0cbb28d`) confirmed in git history.
