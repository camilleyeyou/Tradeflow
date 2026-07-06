---
status: human_needed
phase: 05-critical-security-launch-blockers
verified: 2026-07-06
verifier: orchestrator (direct checks)
---

# Phase 5 Verification — Critical Security & Launch Blockers

## Automated checks (PASSED)

- **SEC-01** ✓ `getUser()` + `isAdmin()` guard precedes `createAdminClient()` in both `onboarding-actions.ts` (lines 21–31) and `create-client-login.ts` (lines 21–26); throws `Not authorized` before any service-role use.
- **SEC-02** ✓ `supabase/migrations/004_enable_rls_client_users.sql` enables RLS on `public.client_users` with a single self-read SELECT policy `using (user_id = (select auth.uid()))` and no write policies.
- **SEC-03** ✓ `verify_ghl_legacy_signature` and all `X-WH-Signature` handling removed from `api/`; only a docstring note remains. GHL webhook is Ed25519-only, 401 on missing/invalid signature.
- **MISS-01..04** ✓ `POST /api/webhooks/callrail` registered in `api/main.py` (confirmed via live import — route present); HMAC signature verification (fail-closed 401), deduplicated `calls` + `direct_call` `leads` insert (partial unique index migration 005), async GHL text-back via `httpx.AsyncClient` (no `requests` import), truncated PII logs, 200-fast + BackgroundTasks.
- **DPLY-01 (in-repo)** ✓ `types.ts` replaced with schema-accurate `Database` types from migrations 001–005; all `as any`/`@ts-expect-error` removed; `npx tsc --noEmit` exits 0. (Bonus: the slug NOT-NULL onboarding bug — originally FIX-02 — was fixed here once the real types exposed it.)
- **DPLY-02 (doc)** ✓ `DEPLOY-CHECKLIST.md` written (env vars, migration order 001→005, live `supabase gen types`, CallRail/GHL config, two E2E traces).
- Build health: `apps/web` tsc clean; `api` py_compile OK; `api.main` imports with all 4 webhook routes registered.

## Human verification required (05-06 — requires human/deploy)

These need the operator's cloud credentials and cannot be done in-repo. See `DEPLOY-CHECKLIST.md`.

1. Apply migrations 001–005 to the live Supabase project.
2. Run `supabase gen types typescript` against the live project and reconcile with the hand-authored `types.ts`.
3. Populate real env vars in Supabase / Vercel / Railway (SUPABASE_*, RESEND_*, GHL_*, STRIPE_*, CALLRAIL_WEBHOOK_SECRET, ADMIN_EMAILS, NEXT_PUBLIC_APP_URL).
4. Confirm CallRail v3's exact signature header/digest encoding against a live account and adjust `callrail_service.py` if needed.
5. E2E trace 1: real lead form → Supabase → GHL SMS → Resend email.
6. E2E trace 2: real missed call → CallRail webhook → `calls`+`leads` row → GHL text-back within 15s → dashboard call log shows recording link.

## Verdict

All autonomous (in-repo) plans 05-01 through 05-05 are complete and verified. Plan 05-06 is intentionally deferred to the human operator (deploy + live verification). The remotely-exploitable vulnerabilities (admin action takeover, `client_users` RLS, GHL signature bypass) are closed in code and take effect once migrations are applied and deployed.
