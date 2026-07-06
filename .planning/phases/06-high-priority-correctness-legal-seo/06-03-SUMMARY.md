---
phase: 06-high-priority-correctness-legal-seo
plan: 03
subsystem: legal-compliance
tags: [sms-consent, privacy-policy, terms-of-service, reviews, landing-page, supabase-migration]

# Dependency graph
requires:
  - phase: 06-02
    provides: per-client GHL token + collision-safe slug (migration 006 already claimed)
provides:
  - SMS/call consent copy rendered under the lead-form submit button (LEGL-01)
  - Live /privacy and /terms static pages linked from marketing home, get-started, and landing footers (LEGL-02)
  - Per-client review_rating/review_count columns (migration 007) driving a hide-when-absent landing trust block (LEGL-03)
affects: [phase-07-hardening, landing-pages, marketing-site, onboarding-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static Server Component legal pages (no 'use client', metadata export) reused the marketing dark aesthetic without client JS"
    - "Landing-page trust content gated by a single hasReviews boolean derived from two nullable client columns, keeping the block absent (not zero-valued) when data is missing"

key-files:
  created:
    - apps/web/src/app/(marketing)/privacy/page.tsx
    - apps/web/src/app/(marketing)/terms/page.tsx
    - supabase/migrations/007_add_reviews_to_clients.sql
  modified:
    - apps/web/src/components/lead-form.tsx
    - apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx
    - apps/web/src/app/(marketing)/page.tsx
    - apps/web/src/app/(marketing)/get-started/page.tsx
    - apps/web/src/lib/supabase/types.ts

key-decisions:
  - "Consent copy is static text with a businessName fallback ('this business') rather than new client state, so landing pages keep their static-generation/<2s budget"
  - "Landing-page footer uses plain <a> tags (not next/link) since the (landing) route group is fully static with no client-side routing needs, matching the existing pattern in that file"
  - "review_rating stored as numeric(2,1) and review_count as integer, both nullable with no default — absence (null) is the intentional 'hide the block' signal rather than a sentinel value like 0"
  - "Both the hero star strip and the trust-details reviews card are gated by the same hasReviews boolean computed once, avoiding duplicated null-checks"

requirements-completed: [LEGL-01, LEGL-02, LEGL-03]

# Metrics
duration: 12min
completed: 2026-07-06
---

# Phase 6 Plan 3: SMS Consent, Legal Pages & Truthful Per-Client Reviews Summary

**Added SMS/call consent disclosure at lead capture, published live Privacy Policy and Terms of Service pages linked from every public footer, and replaced the hardcoded "4.9 / 100+ reviews" claim with per-client data that hides entirely when absent.**

## Performance

- Duration: 12 minutes
- Tasks: 4/4 completed
- Files changed: 8 (3 created, 5 modified)

## Accomplishments

- **LEGL-01:** `LeadForm` now accepts an optional `businessName` prop and renders a static consent paragraph ("By submitting, you agree to receive calls and texts (including automated) from {business} ... Reply STOP to opt out.") directly below the submit button. The landing page passes `client.business_name` into the form.
- **LEGL-02:** Created `/privacy` and `/terms` as static Server Components under `(marketing)` with SMS consent, data collection/use, processor list (GoHighLevel, CallRail, Stripe, Resend, Supabase), Illinois governing law, and a `hello@tradeflow-technologies.com` contact — each with a `Last updated: 2026-07-06` line and `metadata` export. Linked both pages from the marketing home footer, the get-started footer, and a new lightweight footer added to the previously footer-less landing page.
- **LEGL-03:** Migration `007_add_reviews_to_clients.sql` adds nullable `review_rating numeric(2,1)` and `review_count integer` to `clients`; `types.ts` carries both across `Row`/`Insert`/`Update`. The landing page's client select now fetches these columns, computes `hasReviews`, and gates both the hero star+review-count strip and the trust-details "reviews" card on it — every hardcoded `4.9` / `100+ reviews` literal was removed from the file.

## Task Commits

| Task | Commit | Files |
|------|--------|-------|
| 1: LEGL-01 consent copy | 90e18df | lead-form.tsx, landing page.tsx |
| 2: LEGL-02 privacy/terms + footers | 8f6c209 | privacy/page.tsx, terms/page.tsx, marketing page.tsx, get-started/page.tsx, landing page.tsx |
| 3: migration 007 + types | e8becaa | 007_add_reviews_to_clients.sql, types.ts |
| 4: LEGL-03 data-driven trust block | ffbd92c | landing page.tsx |

All commits made from the repository root (not `apps/web`, which has a stray nested `.git`); verified in root `git log`.

## Deviations from Plan

None — plan executed exactly as written. All four verification commands (including `cd apps/web && npx tsc --noEmit`) passed after each task.

## Verification

- `cd apps/web && npx tsc --noEmit` — passes after every task and at final check.
- No hardcoded `4.9` or `100+ reviews` literals remain in the landing page file.
- `/privacy` and `/terms` exist and are linked from marketing home, get-started, and landing footers.
- Consent copy with "Reply STOP to opt out" renders under the lead-form submit button.
- Migration 007 is the only new migration in this plan (006 was claimed by 06-02, confirmed before creating 007).

## Known Stubs

None. All landing-page review data is now sourced from `clients.review_rating`/`clients.review_count` (currently `null` for existing rows until an admin populates them post-migration) — the block correctly renders nothing until that data exists, which is the intended LEGL-03 behavior, not a stub.

## Self-Check: PASSED

Verified all created files exist and all commit hashes are present in `git log --oneline --all`:
- apps/web/src/app/(marketing)/privacy/page.tsx — FOUND
- apps/web/src/app/(marketing)/terms/page.tsx — FOUND
- supabase/migrations/007_add_reviews_to_clients.sql — FOUND
- 90e18df, 8f6c209, e8becaa, ffbd92c — all FOUND in root repo history
