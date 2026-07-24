---
phase: quick-260723-oop
plan: 01
subsystem: api
tags: [supabase, ghl, sms, resend, vercel-cron, aes-256-gcm, next-server-after]

requires: []
provides:
  - "clients.google_review_url / clients.review_requests_enabled settings UI"
  - "One-time Google review-request SMS on lead completion (Next.js + FastAPI, idempotent)"
  - "api/services/crypto.py — Python AES-256-GCM decrypt mirroring apps/web/src/lib/crypto.ts"
  - "Monthly ROI report email via Vercel cron (/api/cron/monthly-reports)"
affects: [dashboard-settings, lead-completion-flow, ghl-webhooks, billing-reporting]

tech-stack:
  added: []
  patterns:
    - "Conditional UPDATE claim (`.is('col', null)` / `.is_('col', 'null')`) as a cross-runtime, at-most-once guard between a Next.js Server Action and a FastAPI webhook handler racing on the same row"
    - "Best-effort side effects always wrapped in try/catch inside next/server after() or a Python try/except that never re-raises, so core status-update / webhook-200 flows can never be affected"

key-files:
  created:
    - supabase/migrations/014_review_requests_and_reports.sql
    - api/services/crypto.py
    - apps/web/vercel.json
    - apps/web/src/app/api/cron/monthly-reports/route.ts
  modified:
    - apps/web/src/lib/supabase/types.ts
    - apps/web/src/lib/types/dashboard.ts
    - apps/web/src/lib/validations/settings.ts
    - apps/web/src/lib/actions/settings-actions.ts
    - apps/web/src/components/dashboard/settings-form.tsx
    - apps/web/src/lib/actions/lead-actions.ts
    - api/services/ghl_api.py
    - api/routers/webhooks.py
    - apps/web/.env.example

key-decisions:
  - "Reused the exact conditional-claim pattern (claim review_requested_at before sending) as the single source of truth for at-most-once delivery across the two independent completion paths, rather than adding a DB trigger or unique constraint"
  - "Python AESGCM expects ciphertext||tag concatenated (Node stores the tag separately via getAuthTag()) — api/services/crypto.py concatenates them before calling AESGCM.decrypt with no AAD"
  - "Monthly report route uses createClient from @supabase/supabase-js directly (no <Database> generic), mirroring the existing lead-submit route, rather than the typed server client"

requirements-completed: [REVIEW-DB, REVIEW-SETTINGS, REVIEW-AUTOMATION, REPORT-EMAIL]

duration: 25min
completed: 2026-07-24
---

# Quick Task 260723-oop: Automated Google review requests + monthly ROI report emails Summary

**One-time Google review-request SMS on lead completion (idempotent across Next.js + FastAPI paths) and a branded monthly ROI report email sent via Vercel cron, both fully best-effort and non-blocking.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-24
- **Tasks:** 3
- **Files modified:** 12 (3 created new: migration, crypto.py, vercel.json + cron route)

## Accomplishments

- Clients can now set a Google review URL and toggle automated review requests from dashboard settings
- Marking a lead `completed` — via either the dashboard's `updateLeadStatus` server action or GHL's `ContactTagAdded` webhook — sends exactly one review-request SMS, guarded by a conditional `review_requested_at` claim shared by both code paths
- A new Python `decrypt_token()` helper (`api/services/crypto.py`) lets FastAPI decrypt the same per-client GHL tokens the Next.js app encrypts, closing the loop for server-side sends
- A Vercel cron (`0 14 1 * *`) hits `/api/cron/monthly-reports`, which computes real prior-month stats per active/notifiable client and emails a branded ROI report via Resend, with estimated pipeline value clearly labeled as an estimate

## Task Commits

1. **Task 1: Migration 014 + settings UI for review URL/toggle** - `40d1a14` (feat)
2. **Task 2: Review-request automation (Next.js action + FastAPI webhook)** - `67c3221` (feat)
3. **Task 3: Monthly ROI report email via Vercel cron** - `da3369b` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `supabase/migrations/014_review_requests_and_reports.sql` - Adds `clients.google_review_url`, `clients.review_requests_enabled`, `leads.review_requested_at`; extends the 008 column-scoped UPDATE grant
- `apps/web/src/lib/supabase/types.ts` - Database type additions for the three new columns
- `apps/web/src/lib/types/dashboard.ts` - `Client` interface gains the two new client columns
- `apps/web/src/lib/validations/settings.ts` - `settingsSchema` validates `google_review_url` (empty or valid URL) and `review_requests_enabled`
- `apps/web/src/lib/actions/settings-actions.ts` - `updateClientSettings` formData type widened
- `apps/web/src/components/dashboard/settings-form.tsx` - New "Google Reviews" card (URL input + toggle), mirrors the Notification Preferences card pattern
- `apps/web/src/lib/actions/lead-actions.ts` - `updateLeadStatus` schedules a best-effort review SMS via `after()` when status becomes `completed`; new `maybeSendReviewRequest()` implements the claim-then-send contract
- `api/services/crypto.py` - New: `decrypt_token()` mirrors `apps/web/src/lib/crypto.ts` (AES-256-GCM, `iv:tag:ciphertext` hex format)
- `api/services/ghl_api.py` - New `send_sms()` function (mirrors existing `_ghl_post` usage style)
- `api/routers/webhooks.py` - `handle_contact_tag_added` widens its lead select and calls new `_maybe_send_review_request()` on the `completed` transition; new `_resolve_client_token()` helper
- `apps/web/vercel.json` - New: schedules `/api/cron/monthly-reports` for the 1st of each month at 14:00 UTC
- `apps/web/src/app/api/cron/monthly-reports/route.ts` - New: CRON_SECRET-gated GET handler; aggregates prior-month leads/calls per client and sends a branded Resend email
- `apps/web/.env.example` - Documents `CRON_SECRET`

## Decisions Made

- The idempotency guard (conditional `UPDATE ... WHERE review_requested_at IS NULL`, only proceeding if a row was returned) is implemented identically in both TypeScript (`.is('review_requested_at', null)`) and Python (`.is_("review_requested_at", "null")`) — this is the only mechanism preventing a double-send when both the dashboard action and the GHL webhook could theoretically fire for the same lead around the same time.
- `api/services/crypto.py` concatenates ciphertext and auth tag before calling `AESGCM.decrypt()`, since Node's `crypto` module keeps the GCM tag separate (`cipher.getAuthTag()`) while Python's `cryptography` `AESGCM` primitive expects them concatenated.
- The monthly report cron computes stats only from rows actually returned by Supabase (no fabricated values); the estimated pipeline value reuses the existing exported `ESTIMATED_LEAD_VALUE` constant from `roi-summary.tsx` rather than redefining it, per the interfaces contract.

## Deviations from Plan

None — plan executed exactly as written. One out-of-scope, pre-existing issue was discovered and deliberately not fixed (see below).

### Out-of-Scope Discovery (not fixed, logged)

`apps/web/package-lock.json` was already out of sync with `package.json` before this task began (`npm ci` failed with multiple "Missing X from lock file" errors). `node_modules` did not exist in this worktree, so `npm install` (not `npm ci`) was used to unblock local `tsc`/`build` verification; the resulting lockfile diff was reverted via `git checkout --` since regenerating/committing a fresh lockfile is unrelated to this task's file list. Logged in `.planning/quick/260723-oop-monthly-roi-report-emails-automated-goog/deferred-items.md`.

## Issues Encountered

None beyond the lockfile discovery above (resolved by working around it, not fixing it — out of scope).

## User Setup Required

**External services require manual configuration before these features are live:**
- Apply migration `014_review_requests_and_reports.sql` to the Supabase project
- Set `CRON_SECRET` in Vercel project env vars (cron no-ops silently if unset — safe default, but the report will never actually send until this is set)
- Ensure `GHL_TOKEN_ENC_KEY` is set in the Railway (FastAPI) environment identically to the Vercel one, so `api/services/crypto.py` can decrypt the same per-client tokens Next.js encrypts
- Confirm `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set (monthly report route degrades gracefully to a no-op send if `RESEND_API_KEY` is unset)
- Existing clients default to `review_requests_enabled = true` with `google_review_url = null` — review SMS silently stays off per-client until each client fills in their Google review link in Settings

## Next Phase Readiness

Both features are additive and fully best-effort — no existing flow (lead status updates, GHL webhook 200 responses, lead-submit) was modified in a way that could regress. No blockers for future work.

---
*Quick task: 260723-oop*
*Completed: 2026-07-24*

## Self-Check: PASSED

All 14 created/modified files listed above verified present on disk; all 3 task commit hashes (`40d1a14`, `67c3221`, `da3369b`) verified present in git log.
