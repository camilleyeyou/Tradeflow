---
phase: 06-high-priority-correctness-legal-seo
plan: 01
subsystem: correctness
tags: [zod, stripe, nextjs-middleware, railway, python, fastapi]

# Dependency graph
requires:
  - phase: 04-operations
    provides: Stripe webhook router and get-started phone validation pattern to mirror
  - phase: 05-security-launch-blockers
    provides: src/lib/admin.ts ADMIN_EMAILS/ADMIN_EMAIL isAdmin() helper
provides:
  - Lead form phone input accepts formatted US numbers (parens/dashes/spaces)
  - Stripe webhook invalid-signature path returns 400 instead of an unhandled 500
  - Single ADMIN_EMAILS-based admin authorization path (middleware + server actions)
  - Pinned Python 3.12 runtime and documented Procfile deploy invariant for Railway
affects: [06-02, 06-03, 06-04, 06-05, 06-06, deploy-readiness]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod phone fields use .transform(strip non-digits).pipe(regex) so raw formatted input still validates; exported type uses z.input<> to keep RHF defaultValues typed as raw string"
    - "Admin authorization check inlined per-callsite (no shared import) in Edge middleware to avoid pulling server-only deps into the edge runtime"

key-files:
  created:
    - api/runtime.txt
    - .planning/phases/06-high-priority-correctness-legal-seo/deferred-items.md
  modified:
    - apps/web/src/lib/validations/lead.ts
    - api/routers/stripe_webhooks.py
    - apps/web/middleware.ts
    - apps/web/.env.example
    - api/.env.example
    - api/Procfile

key-decisions:
  - "LeadFormValues changed from z.infer to z.input<typeof leadSchema> so the transform on phone doesn't break react-hook-form's raw-string defaultValues typing"
  - "Middleware inlines its own emailIsAdmin() helper rather than importing src/lib/admin.ts, since middleware runs on the Edge runtime and importing shared server modules is riskier"
  - "Procfile uvicorn command left unchanged; only a comment was added documenting that Railway's service root must be the repo root, since main.py uses dotted api.* imports"

patterns-established:
  - "Pattern: any new phone Zod field must use the .transform(strip-non-digits).pipe(regex) form used in get-started.ts and lead.ts — do not regex raw user input directly"

requirements-completed: [FIX-03, FIX-04, FIX-05, FIX-06]

# Metrics
duration: 8min
completed: 2026-07-06
---

# Phase 6 Plan 1: High-Priority Correctness Fixes Summary

**Fixed four independent correctness bugs: lead-form phone regex now normalizes input, Stripe webhook signature failures return 400 (not 500), admin gating is unified on ADMIN_EMAILS across middleware and server actions, and the FastAPI service now pins Python 3.12 with a documented Railway boot invariant.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-06T11:53:09Z
- **Completed:** 2026-07-06T12:01:00Z
- **Tasks:** 4
- **Files modified:** 6 (+1 new file)

## Accomplishments
- Lead capture form (`/[clientSlug]` landing pages) now accepts phone numbers typed with parentheses, dashes, or spaces — previously any non-digit character caused a false validation failure
- Stripe webhook handler references the correct `stripe.SignatureVerificationError` class (stripe SDK 14.4.1 moved it out of `stripe.errors`), so an invalid/replayed signature now correctly short-circuits to HTTP 400 instead of an unhandled exception surfacing as 500
- `/admin` routes and the shared `isAdmin()` helper now use the exact same ADMIN_EMAILS (comma-separated, case-insensitive) logic with ADMIN_EMAIL fallback — previously middleware only checked a single ADMIN_EMAIL, so a comma-separated list configured for server actions would silently fail to grant middleware access
- Railway/Nixpacks now has a pinned `python-3.12.7` runtime via `api/runtime.txt`, and the Procfile documents that the Railway service root must be the repo root for the `api.main:app` dotted import to resolve

## Task Commits

Each task was committed atomically:

1. **Task 1: FIX-03 phone normalization in lead schema** - `2693782` (fix)
2. **Task 2: FIX-04 correct Stripe exception + malformed-body handling** - `1b57330` (fix)
3. **Task 3: FIX-05 unified admin gating in middleware + ADMIN_EMAILS docs** - `25b9bf3` (fix)
4. **Task 4: FIX-06 pin Python + verify Procfile module path** - `b754760` (fix)

**Plan metadata:** (pending — final commit below)

## Files Created/Modified
- `apps/web/src/lib/validations/lead.ts` - phone field strips non-digits before regex; `LeadFormValues` now `z.input<typeof leadSchema>`
- `api/routers/stripe_webhooks.py` - `except stripe.SignatureVerificationError:` (was `stripe.errors.SignatureVerificationError`)
- `apps/web/middleware.ts` - added `emailIsAdmin()` helper; renamed `isAdmin` local var to `isAdminPath` to avoid shadowing; admin gate now uses `emailIsAdmin(user?.email)`
- `apps/web/.env.example` - documented `ADMIN_EMAILS` above `ADMIN_EMAIL`
- `api/.env.example` - documented `ADMIN_EMAILS` above `ADMIN_EMAIL`
- `api/Procfile` - added comment documenting Railway service-root requirement
- `api/runtime.txt` - new file, pins `python-3.12.7`

## Decisions Made
- Kept `LeadFormValues` derivation as `z.input<>` (matching the existing `get-started.ts` pattern) rather than introducing a separate raw-input type, for consistency across the two lead-capture forms.
- Did not touch the `ValueError` → 400 branch in `stripe_webhooks.py` (already correct); only the misnamed exception class needed correction.

## Deviations from Plan

None — plan executed exactly as written. All four tasks matched their `<action>` blocks precisely; no Rule 1-3 auto-fixes were needed beyond what the plan already specified.

## Issues Encountered

- Discovered (not fixed, out of scope): `apps/web/` contains its own nested `.git` directory with unrelated history, separate from the root repository. Running git commands with cwd inside `apps/web` operates against that nested repo and shows a very different working-tree status than the root repo. All commits in this plan were made from the repo root and verified present in the root repo's `git log`, so this did not affect this plan's correctness. Logged in `deferred-items.md` for visibility since it could confuse a future `git status`/`git add` run from inside `apps/web`.

## User Setup Required

None - no external service configuration required for this plan. (Railway/Vercel env var population remains a pre-existing Phase 5 deploy prerequisite, unaffected by this plan.)

## Next Phase Readiness
- FIX-03/04/05/06 all closed; ready for 06-02 through 06-06.
- No blockers introduced.

---
*Phase: 06-high-priority-correctness-legal-seo*
*Completed: 2026-07-06*

## Self-Check: PASSED

All 7 modified/created files confirmed present on disk; all 4 task commit hashes confirmed in `git log --all`.
