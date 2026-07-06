---
phase: 05-critical-security-launch-blockers
plan: 03
subsystem: api
tags: [fastapi, webhooks, ghl, ed25519, security]

# Dependency graph
requires:
  - phase: 02-lead-pipeline
    provides: GHL webhook endpoint with dual Ed25519/RSA signature verification
provides:
  - Ed25519-only GHL webhook signature verification (legacy always-true RSA bypass removed)
affects: [05-critical-security-launch-blockers, 06-correctness-legal-fixes]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Webhook signature check: reject 401 immediately if header missing or invalid, single verification path only"]

key-files:
  created: []
  modified:
    - api/services/ghl_service.py
    - api/routers/webhooks.py

key-decisions:
  - "Removed verify_ghl_legacy_signature entirely rather than implementing real RSA verification — GHL's Ed25519 path was already correct and the legacy path was a dead-weight bypass with a July 2026 deprecation deadline that had no security value in the interim"

patterns-established:
  - "GHL webhook signature check: single Ed25519-only branch, missing header and invalid signature both raise HTTPException(401) before payload parsing"

requirements-completed: [SEC-03]

# Metrics
duration: 4min
completed: 2026-07-06
---

# Phase 5 Plan 3: Remove GHL Legacy Webhook Signature Bypass Summary

**Deleted the always-true `verify_ghl_legacy_signature` RSA stub and the `X-WH-Signature` fallback branch, making the GHL webhook accept only a valid Ed25519 `X-GHL-Signature`, else 401.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-06T11:12:00Z
- **Completed:** 2026-07-06T11:16:00Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- Closed SEC-03: any request forged with a bare `X-WH-Signature` header (previously always accepted, unverified) is now rejected with 401
- `ghl_service.py` module docstring now accurately states Ed25519-only verification
- `webhooks.py` `ghl_webhook` handler reduced to a single strict signature-check path: missing header → 401, invalid Ed25519 signature → 401, otherwise proceed to payload parsing/routing unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete verify_ghl_legacy_signature from ghl_service.py** - `ff0988b` (fix)
2. **Task 2: Remove legacy branch from the GHL webhook handler** - `becb531` (fix)

**Plan metadata:** (pending) `docs(05-03): complete plan`

## Files Created/Modified
- `api/services/ghl_service.py` - Removed the always-true `verify_ghl_legacy_signature` function and its docstring; updated module docstring to state Ed25519-only verification. `verify_ghl_ed25519_signature` and `GHL_ED25519_PUBLIC_KEY_PEM` unchanged.
- `api/routers/webhooks.py` - Removed `verify_ghl_legacy_signature` import and the `x_wh_signature` Header parameter; replaced the three-branch signature check with a strict two-step Ed25519-only check (missing header → 401, invalid signature → 401).

## Decisions Made
- Removed the legacy bypass entirely rather than implementing real RSA verification for it — the plan's objective (SEC-03) was specifically to close the always-true bypass ahead of GHL's July 1, 2026 deprecation, and GHL's Ed25519 path is already the modern/preferred mechanism, so there is no remaining use case for the legacy path.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. This is a pure code-removal fix; no env vars, GHL dashboard settings, or webhook URLs changed.

## Next Phase Readiness

- SEC-03 closed. The GHL webhook now enforces Ed25519 signature verification exclusively; no code path in `api/` accepts an unverified/forged request via the legacy header.
- No blockers introduced for subsequent Phase 5 plans (04-06) or Phase 6.

---
*Phase: 05-critical-security-launch-blockers*
*Completed: 2026-07-06*

## Self-Check: PASSED

- FOUND: api/services/ghl_service.py
- FOUND: api/routers/webhooks.py
- FOUND: ff0988b (Task 1 commit)
- FOUND: becb531 (Task 2 commit)
