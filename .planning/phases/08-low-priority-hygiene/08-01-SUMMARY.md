---
phase: 08-low-priority-hygiene
plan: 01
subsystem: infra
tags: [nextjs, error-boundary, docs, repo-hygiene]

# Dependency graph
requires:
  - phase: 07-medium-priority-hardening
    provides: async DB access, least-privilege RLS, schema integrity, self-hosted fonts, env validation
provides:
  - Clean git tree (no nested .git, no duplicate CLAUDE file, no unused SVGs, brand-binaries dir gitignored)
  - On-brand root not-found.tsx and global-error.tsx (App Router convention, no wiring needed)
  - Corrected lead-form success copy and admin back-link hover contrast
  - Accurate apps/web/README.md (billing model, migrations list, CallRail webhook, env vars)
  - Self-consistent .planning/ROADMAP.md progress table
affects: [09-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "not-found.tsx / global-error.tsx mirror the (admin)/error.tsx black+gold error-boundary style"
    - "global-error.tsx imports ./globals.css directly and renders its own <html>/<body> since it replaces the root layout"

key-files:
  created:
    - apps/web/src/app/not-found.tsx
    - apps/web/src/app/global-error.tsx
  modified:
    - .gitignore
    - apps/web/src/components/lead-form.tsx
    - "apps/web/src/app/(admin)/admin/clients/[id]/page.tsx"
    - apps/web/README.md
    - .planning/ROADMAP.md

key-decisions:
  - "Also updated the README's architecture diagram to drop the removed legacy RSA GHL signature path (Ed25519-only per Phase 5 SEC-03) while adding the CallRail webhook mention, since both were stale in the same section"

patterns-established:
  - "global-error.tsx must import globals.css and render its own <html>/<body> — it replaces the root layout entirely on uncaught render errors"

requirements-completed: [HYG-01, HYG-02, HYG-03, HYG-04]

# Metrics
duration: 20min
completed: 2026-07-06
---

# Phase 08 Plan 01: Low-Priority Hygiene Summary

**Removed stale repo cruft (duplicate CLAUDE file, nested apps/web/.git, unused SVGs), added on-brand not-found/global-error pages, fixed hardcoded area-code copy and a low-contrast admin link, and corrected README + ROADMAP doc drift.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-06T13:50:00Z
- **Completed:** 2026-07-06T13:58:49Z
- **Tasks:** 4
- **Files modified:** 11 (6 deleted, 5 modified/created)

## Accomplishments
- Repo tree is clean: no `CLAUDE (1).md`, no nested `apps/web/.git`, no unused create-next-app SVGs; `TRADEFLOW-DESIGN-A-ALL-FILES/` is gitignored (not committed, per instructions)
- Ad-click visitors hitting a bad client slug or any unmatched route now see a styled on-brand 404; any uncaught render error anywhere in the app is caught by a global error boundary with a retry action
- Lead-form success copy no longer claims a specific (wrong) area code; the admin client-detail back-link is now readable on hover
- `apps/web/README.md` and `.planning/ROADMAP.md` accurately describe shipped features with no internal contradictions

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove stale repo cruft (HYG-01)** - `782bf17` (chore)
2. **Task 2: Add styled not-found and global-error pages (HYG-02)** - `3999c24` (feat)
3. **Task 3: Fix hardcoded copy and low-contrast link (HYG-03)** - `0459ed8` (fix)
4. **Task 4: Correct README and ROADMAP doc accuracy (HYG-04)** - `a596eff` (docs)

## Files Created/Modified
- `apps/web/src/app/not-found.tsx` - On-brand black+gold 404 page with "Back to home" CTA
- `apps/web/src/app/global-error.tsx` - Client Component global error boundary with own html/body and "Try again" retry button
- `.gitignore` - Added `TRADEFLOW-DESIGN-A-ALL-FILES/`
- `apps/web/src/components/lead-form.tsx` - Removed hardcoded "312 number" claim from success copy
- `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx` - Fixed unreadable `hover:text-gray-700` back-link to `hover:text-white`
- `apps/web/README.md` - Removed per-lead billing claim, listed all 9 migrations, added CallRail webhook references, documented `CALLRAIL_WEBHOOK_SECRET`/`GHL_TOKEN_ENC_KEY`, clarified `GHL_PRIVATE_TOKEN` is fallback-only
- `.planning/ROADMAP.md` - Checked off Phase 1/2, corrected Progress table rows for Phases 2, 5, 6, 7

Deleted (Task 1, no content to describe): `CLAUDE (1).md`, `apps/web/.git/`, `apps/web/public/{next,vercel,file,globe,window}.svg`

## Decisions Made
- While correcting the README's webhook description, also removed the stale mention of the legacy RSA GHL signature path (`X-WH-Signature`), since that path was already removed in Phase 5 (SEC-03) and the plan's `read_first` notes for this exact section were about to be edited anyway — leaving a reference to a bypass that no longer exists would reintroduce the same kind of doc drift this task exists to fix (Rule 1 — bug/doc-correctness, in scope of the file/section already being edited).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed stale "Ed25519/RSA" webhook signature description in README architecture diagram**
- **Found during:** Task 4 (README doc accuracy)
- **Issue:** The README's system-architecture diagram described `/api/webhooks/ghl` as verifying "Ed25519/RSA", but the RSA (`X-WH-Signature`) legacy path was fully removed in Phase 5 (SEC-03) — the doc was describing a code path that no longer exists, in the exact section this task was already correcting for the CallRail omission.
- **Fix:** Changed the diagram annotation to "Ed25519" only.
- **Files modified:** apps/web/README.md
- **Verification:** Visual diff review; no automated check needed (not part of plan's verify block).
- **Committed in:** a596eff (Task 4 commit)

---

**Total deviations:** 1 auto-fixed (1 bug/doc-correctness)
**Impact on plan:** Minor scope tightening within a file/section already being edited by the plan; no additional files touched, no scope creep.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 8 (Low-Priority Hygiene) is complete — this was its only plan.
- Repo is clean and docs are accurate ahead of Phase 9 (Features: webhook durability, error observability, ROI dashboard, SMS inbox, AI lead scoring).
- No blockers identified.

---
*Phase: 08-low-priority-hygiene*
*Completed: 2026-07-06*

## Self-Check: PASSED

All created/modified files confirmed present on disk; all 4 task commit hashes (782bf17, 3999c24, 0459ed8, a596eff) confirmed present in git history.
