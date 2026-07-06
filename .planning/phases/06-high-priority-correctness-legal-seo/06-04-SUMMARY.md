---
phase: 06-high-priority-correctness-legal-seo
plan: 04
subsystem: seo
tags: [nextjs-metadata, robots-txt, sitemap-xml, generateMetadata, app-router]

# Dependency graph
requires:
  - phase: 06-03
    provides: landing page client select pattern (business_name, city columns) and SERVICE_TYPES import convention
provides:
  - Per-landing-page generateMetadata producing service+city+business title/description/OG tags (SEO-01)
  - metadataBase on root layout for absolute OG/relative URL resolution
  - robots.ts disallowing /dashboard, /admin, /api and pointing to sitemap.xml (SEO-02)
  - sitemap.ts enumerating static marketing/legal routes plus active-client x SERVICE_TYPES landing pages (SEO-02)
affects: [phase-07-hardening, landing-pages, marketing-site]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "generateMetadata mirrors the page component's own data-fetch pattern (same createServerClient() service-role helper) rather than sharing a cached fetch — Next.js dedupes identical fetches within a request automatically for fetch(), but this is a Supabase client call so both run once per request without cache concern at this data volume"
    - "sitemap.ts and robots.ts both apply the exact same placeholder-guard (url.includes('<')) as generateStaticParams, and sitemap.ts additionally wraps its query in try/catch to degrade to static-only URLs on any Supabase error"

key-files:
  created:
    - apps/web/src/app/robots.ts
    - apps/web/src/app/sitemap.ts
  modified:
    - apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx
    - apps/web/src/app/layout.tsx

key-decisions:
  - "generateMetadata returns {} (inherits root metadata) for invalid service slugs, and { title: 'HVAC Services' } for missing/inactive clients, rather than throwing — notFound() in the page component still handles the actual 404 response for the same cases"
  - "sitemap.ts includes static marketing/legal routes (/, /get-started, /privacy, /terms) alongside dynamic per-client landing pages, matching the plan's explicit inclusion of those base routes"
  - "sitemap.ts wraps the Supabase query in try/catch (not just the placeholder-guard) so any transient DB error still yields a valid sitemap of static routes instead of a 500"

requirements-completed: [SEO-01, SEO-02]

# Metrics
duration: 6min
completed: 2026-07-06
---

# Phase 6 Plan 4: Landing Page SEO Metadata, robots.txt & sitemap.xml Summary

**Landing pages now emit per-page `<title>`/description/OG tags built from service+city+business_name via `generateMetadata`, and the site serves a `robots.ts` disallowing `/dashboard`, `/admin`, `/api` plus a `sitemap.ts` enumerating all public marketing and per-client landing page URLs.**

## Performance

- **Duration:** 6 min
- **Tasks:** 3/3 completed
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- **SEO-01:** Landing route `(landing)/[clientSlug]/[service]/page.tsx` exports `generateMetadata` — queries the client's `business_name`/`city` via the existing service-role `createServerClient()`, builds `"{Service Label} in {City} | {Business Name}"` titles with a matching description and `openGraph` block. Root `layout.tsx` gained `metadataBase` so relative/OG URLs resolve correctly.
- **SEO-02 (robots):** New `apps/web/src/app/robots.ts` returns `MetadataRoute.Robots` disallowing `/dashboard`, `/admin`, `/api`, allowing everything else, and pointing `sitemap` at `${NEXT_PUBLIC_APP_URL}/sitemap.xml`.
- **SEO-02 (sitemap):** New `apps/web/src/app/sitemap.ts` returns `MetadataRoute.Sitemap` combining static routes (`/`, `/get-started`, `/privacy`, `/terms`) with one entry per active client × `SERVICE_TYPES`, reusing the exact placeholder-guard from `generateStaticParams` and degrading gracefully (static URLs only) on missing config or query failure.

## Task Commits

| Task | Commit | Files |
|------|--------|-------|
| 1: SEO-01 generateMetadata + metadataBase | e19cf9b | `(landing)/[clientSlug]/[service]/page.tsx`, `layout.tsx` |
| 2: SEO-02 robots.ts | 0695d45 | `robots.ts` |
| 3: SEO-02 sitemap.ts | e46dbfa | `sitemap.ts` |

All commits made from the repository root (not `apps/web`, which has a stray nested `.git`); verified in root `git log`.

## Deviations from Plan

None — plan executed exactly as written. All three verification commands (including `cd apps/web && npx tsc --noEmit`) passed after each task.

## Verification

- `cd apps/web && npx tsc --noEmit` — passes after every task and at final check.
- `robots.ts` and `sitemap.ts` live at `apps/web/src/app/` (app root), not inside a route group.
- `generateMetadata` adds no client JS to the landing page — no `'use client'` directive in either new file; landing page stays statically generated.
- `robots.ts` disallow list contains `/dashboard`, `/admin`, `/api`.
- `sitemap.ts` contains `MetadataRoute.Sitemap`, queries `from('clients')`, and imports `SERVICE_TYPES`.

## Known Stubs

None. Both `robots.ts` and `sitemap.ts` degrade safely (return static-only content) when Supabase env vars are placeholders or the query fails — this is the intended fallback behavior documented in the plan, not a stub.

## Self-Check: PASSED

Verified all created/modified files exist and all commit hashes are present in `git log --oneline --all`:
- apps/web/src/app/robots.ts — FOUND
- apps/web/src/app/sitemap.ts — FOUND
- apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx — FOUND
- apps/web/src/app/layout.tsx — FOUND
- e19cf9b, 0695d45, e46dbfa — all FOUND in root repo history

---
*Phase: 06-high-priority-correctness-legal-seo*
*Completed: 2026-07-06*
