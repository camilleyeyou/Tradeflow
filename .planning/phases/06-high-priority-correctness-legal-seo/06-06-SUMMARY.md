---
phase: 06-high-priority-correctness-legal-seo
plan: 06
subsystem: infra
tags: [npm-audit, dependency-management, nextjs, security-patching]

# Dependency graph
requires:
  - phase: 06-high-priority-correctness-legal-seo
    provides: "Plans 06-01 through 06-05 (FIX-01/04, SEO, honeypot/rate-limit) — this plan's build gate covers all of them"
provides:
  - "Clean npm audit (production deps): 0 high-severity findings"
  - "Next.js bumped to patched 15.5.20 within the locked 15.5 minor"
  - "Confirmed full-app typecheck + build passes with all Phase 6 changes in place"
affects: [deployment, phase-07, phase-08, phase-09]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - apps/web/package.json
    - apps/web/package-lock.json

key-decisions:
  - "Ran npm audit fix (non --force) first to clear the ws/svix/uuid chain (resend -> svix -> ws) plus unrelated high/moderate findings surfacing from shadcn's bundled @modelcontextprotocol/sdk (hono, express-rate-limit, ip-address) since shadcn is listed under dependencies not devDependencies — no package.json version ranges changed, lockfile-only fix"
  - "Bumped next from pinned 15.5.14 to ^15.5.20 (still within the locked 15.5 minor per CLAUDE.md) to clear the remaining Next.js high-severity advisories, all of which have first-patched versions between 15.5.15 and 15.5.18"
  - "Left the residual postcss <8.5.10 moderate advisory unresolved — it is bundled internally inside next's own dependency tree (node_modules/next/node_modules/postcss@8.4.31), and npm's own --force suggestion would downgrade next to 9.3.3 (a major breaking change), so it is not actionable from this repo; documented as an accepted residual since it is moderate (not high) severity and the plan's gate is audit-level=high"

requirements-completed: [DEP-01]

# Metrics
duration: 12min
completed: 2026-07-06
---

# Phase 6 Plan 6: Dependency Security Patching Summary

**Cleared all high-severity npm audit advisories in production dependencies (ws/svix/uuid chain, hono/express-rate-limit/ip-address, qs, path-to-regexp, and 8 Next.js CVEs) by running `npm audit fix` and bumping Next.js to patched 15.5.20, then confirmed the entire app still typechecks and builds cleanly.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-06T12:43:00Z (approx, per STATE.md prior session timestamp)
- **Completed:** 2026-07-06T12:55:04Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `npm audit --omit=dev --audit-level=high` now exits 0 (was failing with 5 high-severity + 10 moderate + 1 low findings)
- Next.js bumped from 15.5.14 to 15.5.20, clearing 8 distinct high-severity Next.js CVEs (Server Components DoS, middleware/proxy bypasses, cache poisoning, CSP-nonce XSS, image-optimization DoS, WebSocket SSRF) — all patched upstream between 15.5.15 and 15.5.18
- Full regression gate passed: `npx tsc --noEmit` clean, `npm run build` succeeded (21 routes generated, Turbopack), `npm test` passed (9/9) — confirms no regressions from Phase 6 plans 06-01 through 06-05

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit baseline + apply non-breaking fixes** - `33aac4a` (fix)
2. **Task 2: Ensure patched Next.js 15.5.x + regression build** - `8e2705b` (fix)

_Note: No plan-metadata commit hash yet — added below after this SUMMARY and STATE/ROADMAP updates are committed._

## Files Created/Modified
- `apps/web/package.json` - `next` version range bumped from pinned `15.5.14` to `^15.5.20`
- `apps/web/package-lock.json` - lockfile updated across two commits: (1) `npm audit fix` non-force resolution of ws/svix/uuid/hono/express-rate-limit/ip-address/qs/path-to-regexp/brace-expansion/fast-uri/@babel/core/js-yaml/@hono/node-server, (2) Next.js 15.5.14 → 15.5.20 bump

## Decisions Made
- Used `npm audit fix` (not `--force`) for Task 1 to avoid uncontrolled major-version jumps across the locked stack, per plan instruction and CLAUDE.md's "all decided and locked" constraint.
- Confirmed the high/moderate findings from `hono`, `express-rate-limit`, and `ip-address` were transitive of `shadcn` (which is a CLI dev-tool but sits under `dependencies` in package.json, not `devDependencies` — pre-existing placement, out of scope for this plan to relocate) via `@modelcontextprotocol/sdk`. `npm audit fix` resolved these without any package.json changes.
- Bumped `next` to `^15.5.20` (a caret range, not the previous exact-pin `15.5.14`) so the project picks up 15.5.x patch releases going forward without manual intervention, while still respecting the "stay within 15.5, do not jump to 15.6/16" constraint from CLAUDE.md.

## Deviations from Plan

None — plan executed as written. Both tasks completed within a single autonomous run with no architectural changes, no blocking issues, and no regressions requiring fixes in Phase 6 code.

## Issues Encountered

One transient false-positive: after installing `next@15.5.20`, an immediate `npm audit --omit=dev --audit-level=high` run still reported the pre-bump aggregate Next.js advisory list (exit 1). A second run moments later (after npm's internal audit cache/registry resolution settled) correctly reported 0 high-severity findings (exit 0), confirming the bump had taken effect. This was an npm audit caching artifact, not a real regression — resolved without any code or dependency changes, just a re-run.

## User Setup Required

None - no external service configuration required. This plan only touched `apps/web/package.json` and `apps/web/package-lock.json`.

## Next Phase Readiness

DEP-01 is fully satisfied. All 28 planned plans across Phase 6 (06-01 through 06-06) are now complete, and this plan's cumulative build/typecheck verification confirms the entire Phase 6 body of work (auth fixes, SEO, honeypot/rate-limiting, dependency patching) integrates cleanly with no regressions. Ready to proceed to Phase 7.

One accepted residual to carry forward (not a blocker): `postcss <8.5.10` (moderate, not high) remains vulnerable because it is bundled inside Next.js's own internal dependency tree (`node_modules/next/node_modules/postcss@8.4.31`). This will self-resolve on a future Next.js patch release; no action needed from this repo, and it does not violate the plan's high-severity gate.

---
*Phase: 06-high-priority-correctness-legal-seo*
*Completed: 2026-07-06*

## Self-Check: PASSED

- FOUND: apps/web/package.json
- FOUND: apps/web/package-lock.json
- FOUND: .planning/phases/06-high-priority-correctness-legal-seo/06-06-SUMMARY.md
- FOUND: 33aac4a (Task 1 commit)
- FOUND: 8e2705b (Task 2 commit)
