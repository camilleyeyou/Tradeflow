---
phase: quick-260723-lfp
plan: 01
subsystem: full-stack
tags: [nextjs, seo, jsonld, opengraph, next-og, schema-org, security-headers]

# Dependency graph
requires:
  - phase: quick-260723-ih0
    provides: clients.trade column, apps/web/src/lib/trades.ts trade config, trade-aware landing pages, repositioned marketing homepage with Tech Services section
provides:
  - Branded 1200x630 Open Graph / Twitter card via next/og at apps/web/src/app/opengraph-image.tsx
  - openGraph + twitter metadata on root layout (title/description unchanged)
  - Homepage JSON-LD @graph (Organization, WebSite, 2x Service) with absolute URLs, zero fabricated data
  - Per-client landing-page LocalBusiness JSON-LD (HVACBusiness / Plumber via trades.ts schemaType) with graceful null/empty degradation
  - Homepage 6-item FAQ section (native details/summary) + FAQ nav link
  - robots.ts disallows /login; public/llms.txt LLM-facing site summary
  - Site-wide security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) via next.config.ts, Sentry wrapper preserved
  - Stale HVAC-only-Chicagoland copy reframed to HVAC & plumbing nationwide across get-started placeholders, apps/web/README.md, root CLAUDE.md, .planning/PROJECT.md, api/models/schemas.py
affects: [future SEO/marketing iterations, future landing-page schema additions, future security-header/CSP work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "trades.ts TradeConfig.schemaType field drives per-trade JSON-LD @type (HVACBusiness / Plumber) — same source-of-truth pattern established in 260723-ih0"
    - "JSON-LD rendered inline via <script type=\"application/ld+json\" dangerouslySetInnerHTML> in server components; conditional spreads used to omit null/absent fields rather than emitting null-valued keys"
    - "next/og ImageResponse for file-based OG image generation (apps/web/src/app/opengraph-image.tsx), auto-resolved into layout metadata without setting openGraph.images explicitly"

key-files:
  created:
    - apps/web/src/app/opengraph-image.tsx
    - apps/web/public/llms.txt
  modified:
    - apps/web/src/app/layout.tsx
    - apps/web/src/app/robots.ts
    - apps/web/next.config.ts
    - apps/web/src/lib/trades.ts
    - apps/web/src/app/(marketing)/page.tsx
    - apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx
    - apps/web/src/app/(marketing)/get-started/page.tsx
    - apps/web/README.md
    - CLAUDE.md
    - .planning/PROJECT.md
    - api/models/schemas.py

key-decisions:
  - "Landing-page JSON-LD normalizes client.service_area_zips (string[] or single string) into a PostalCode array the same way the existing serviceAreaText display logic already does, then omits areaServed entirely when the array is empty"
  - "aggregateRating is only added via a conditional spread when review_rating AND review_count are both non-null AND review_count > 0 — matches the plan's zero-fabricated-data requirement exactly"
  - "No addressRegion emitted on landing-page JSON-LD since the client query never selects a state/region column — omitted rather than fabricated"

patterns-established:
  - "Any future JSON-LD additions should follow the conditional-spread-to-omit-null-keys pattern rather than emitting explicit null values"

requirements-completed: [SEO-AUDIT]

# Metrics
duration: ~10min
completed: 2026-07-23
---

# Quick Task 260723-lfp: SEO / Structured Data / OG Image / FAQ / Presentation Audit Summary

**Added Open Graph + Twitter metadata with a branded next/og share image, homepage + per-client landing-page JSON-LD structured data (Organization/WebSite/Service graph and per-trade LocalBusiness), a 6-item homepage FAQ, llms.txt, tightened robots.ts, site-wide security headers, and reframed stale HVAC-only-Chicagoland copy to HVAC & plumbing nationwide across code and docs.**

## Performance

- **Duration:** ~10 min (excluding dependency install/build time)
- **Completed:** 2026-07-23
- **Tasks:** 3
- **Files modified:** 13 (2 created, 11 modified)

## Accomplishments
- New `apps/web/src/app/opengraph-image.tsx` generates a branded 1200x630 dark/gold OG card via `next/og`'s `ImageResponse`; root `layout.tsx` now exposes `openGraph` + `twitter` metadata (title/description unchanged) that auto-resolves the image
- Homepage renders one `application/ld+json` `@graph` block (Organization, WebSite, 2x Service) with absolute URLs off `NEXT_PUBLIC_APP_URL`, plus a new 6-item FAQ section (native `<details>`/`<summary>`) between Tech Services and the Final CTA, and a matching FAQ nav link
- `trades.ts` gained a `schemaType` field (`HVACBusiness` / `Plumber`); the per-client landing page now emits per-trade `LocalBusiness` JSON-LD that omits `addressRegion` (never fetched), omits `areaServed` when no zips exist, and only adds `aggregateRating` when both review fields are present and `review_count > 0`
- `robots.ts` now disallows `/login`; new `apps/web/public/llms.txt` gives LLM crawlers a site summary + key links; `next.config.ts` adds four security headers site-wide while preserving the `withSentryConfig` wrapper
- Stale HVAC-only / Chicagoland framing corrected in `get-started` placeholders, `apps/web/README.md`, root `CLAUDE.md`, `.planning/PROJECT.md`, and `api/models/schemas.py`'s service-type comment

## Task Commits

Each task was committed atomically:

1. **Task 1: Site metadata, OG image, robots, llms.txt, security headers** - `fb61605` (feat)
2. **Task 2: JSON-LD structured data (homepage + landing pages) + homepage FAQ** - `9871859` (feat)
3. **Task 3: Copy + docs cleanup, final build gate** - `7a995a0` (docs)

**Plan metadata:** (this SUMMARY commit, see below)

## Files Created/Modified
- `apps/web/src/app/opengraph-image.tsx` - New branded 1200x630 OG image (next/og ImageResponse, size/alt/contentType exports)
- `apps/web/public/llms.txt` - New LLM-facing site summary + key links
- `apps/web/src/app/layout.tsx` - Adds `openGraph` + `twitter` metadata (title/description unchanged)
- `apps/web/src/app/robots.ts` - Adds `/login` to disallow list
- `apps/web/next.config.ts` - Adds `headers()` with 4 security headers inside the Sentry-wrapped config
- `apps/web/src/lib/trades.ts` - Adds `schemaType: string` field (`HVACBusiness` / `Plumber`) to `TradeConfig`
- `apps/web/src/app/(marketing)/page.tsx` - Renders homepage JSON-LD `@graph`; adds 6-item FAQ section + FAQ nav link; fixes stale HVAC-only image alt text
- `apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx` - Emits per-trade `LocalBusiness` JSON-LD with graceful null/empty degradation
- `apps/web/src/app/(marketing)/get-started/page.tsx` - Company-name and email input placeholders now reference plumbing
- `apps/web/README.md` - Reframes intro, landing-route section, `clients` table row, and footnote from HVAC-only-Chicagoland to HVAC & plumbing nationwide
- `CLAUDE.md` - Project section reframed to HVAC & plumbing nationwide, notes tech-services offering
- `.planning/PROJECT.md` - Annotates the plumbing/roofing Out-of-Scope entry with the 260723-ih0 shipped date
- `api/models/schemas.py` - `service_type` comment lists both trades' real service slugs

## Decisions Made
- Landing-page JSON-LD normalizes `service_area_zips` (array or single string) the same way the existing `serviceAreaText` display logic already does, before mapping to `PostalCode` entries
- `aggregateRating` is added via a conditional spread only when both review fields are present and `review_count > 0`, matching the plan's zero-fabricated-data requirement exactly
- No `addressRegion` emitted — the landing-page client query never selects a state/region column, so it is omitted rather than fabricated, per plan interface notes

## Deviations from Plan

None - plan executed exactly as written. One environment-only side effect occurred and was reverted before committing (see below).

### Issues Encountered (non-deviation)
- The worktree branch was 5 commits behind `main` (missing the prerequisite `260723-ih0` HVAC+plumbing expansion commits this plan depends on — `trades.ts` did not yet exist). Fast-forward merged `main` into the worktree branch before starting any edits; this was a clean fast-forward with no conflicts.
- `apps/web/node_modules` was not installed in the worktree; ran `npm install` to enable `tsc`/`build` verification. This incidentally modified `apps/web/package-lock.json` as a side effect of dependency resolution drift unrelated to this plan's scope — reverted with `git checkout -- apps/web/package-lock.json` before each commit so no unrelated lockfile changes were committed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `npx tsc --noEmit` and `npm run build` both pass cleanly; the production build output lists the new `/opengraph-image` route alongside all existing marketing/landing/dashboard routes.
- No fabricated data present in any JSON-LD block (no invented address region, sameAs, founding date, or employee counts).
- Ready for a manual social-share preview / rich-results-test spot check by a human before the lender/grant-reviewer demo (optional per plan's verification section — not required for completion).

---
*Quick task: 260723-lfp*
*Completed: 2026-07-23*

## Self-Check: PASSED

All 13 plan files + this SUMMARY.md confirmed present on disk; all 3 task commits (`fb61605`, `9871859`, `7a995a0`) confirmed in git history.
