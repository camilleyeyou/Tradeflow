# Phase 7: Medium-Priority Hardening - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss — autonomous run)

<domain>
## Phase Boundary

Bring data integrity, performance, and operational safety nets to production standard. Scope = HARD-01..10. Not features (Phase 9), not repo hygiene (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### HARD-01 — non-blocking FastAPI DB access
- The sync Supabase client in `api/services/supabase_client.py` blocks the event loop. Fix: wrap all Supabase `.execute()` calls in webhook/background paths with `fastapi.concurrency.run_in_threadpool`, OR switch to `acreate_client`/AsyncClient and `await`. Prefer run_in_threadpool for minimal churn (keeps existing sync client). Apply in webhooks.py, callrail_webhooks.py, stripe processing, and any service doing DB I/O. Acceptance: grep shows DB calls in async handlers are awaited via run_in_threadpool or an async client; no bare sync `.execute()` inside `async def` background work.

### HARD-02 — least-privilege RLS
- New migration (continue numbering 008): revoke broad UPDATE on `clients` and grant column-scoped UPDATE (business_name, phone, email, city, notifications_enabled, review_rating, review_count) to authenticated. Replace `FOR ALL` policies on `leads`, `calls`, `sms_sequences` with explicit `FOR SELECT` + `FOR UPDATE ... WITH CHECK` (scoped to the client), and NO client INSERT/DELETE (writes go through service role). Preserve the existing 2-hop join predicates. Acceptance: migration contains column-scoped grant on clients and no `FOR ALL` remaining for those tables.

### HARD-03 — schema integrity
- New migration (009): CHECK constraints — leads.status IN (...), sms_sequences.status IN (...), billing.status IN (...), calls.outcome IN (...), clients.plan IN (...). Indexes: billing(client_id), leads(ghl_contact_id), calls(lead_id). NOTE: unique index on leads(callrail_call_id) was ALREADY added in migration 005 (Phase 5) — do NOT duplicate; verify it exists. Add updated_at columns + a shared trigger function `set_updated_at()` (pin `set search_path = ''`) on the mutable tables (clients, leads, sms_sequences). Use enum value sets consistent with the app (LEAD_STATUSES in apps/web/src/lib/types/dashboard.ts; service types use hyphenated form e.g. 'ac-repair'). Acceptance: migration has the CHECKs, the 3 indexes, and updated_at triggers; unique callrail index NOT re-created.

### HARD-04 — open-redirect fix
- In `apps/web/src/app/auth/callback/route.ts`, validate `next`: if it does not start with '/' or starts with '//', reset to a safe default ('/dashboard' or '/admin'). Acceptance: grep shows the startsWith('/') + !startsWith('//') guard.

### HARD-05 — email escaping + notifications_enabled
- Extract a shared `escapeHtml` util (get-started route already has one) to e.g. apps/web/src/lib/escape-html.ts; apply it to all user-supplied values interpolated into the lead notification email in apps/web/src/app/api/leads/submit/route.ts. Also select `notifications_enabled` on the client and skip sending the email when false. Acceptance: escapeHtml imported+used in lead email; notifications_enabled checked before send.

### HARD-06 — crypto-strong temp passwords
- Replace Math.random() password generation in apps/web/src/lib/actions/create-client-login.ts with crypto.randomBytes / crypto.getRandomValues. Acceptance: grep shows no Math.random in that file; uses node crypto.

### HARD-07 — self-hosted fonts (no render-blocking third-party requests)
- Remove the render-blocking Fontshare <link> stylesheets in apps/web/src/app/layout.tsx. Consolidate typography onto next/font (next/font/google self-hosts at build time — no third-party runtime requests) using the already-imported Poppins/Geist, OR next/font/local if font files are added. Since arbitrary Fontshare binaries can't be fetched here, prefer replacing General Sans/Gambetta usage with the existing next/font families (acceptable typography tradeoff). Acceptance: no `api.fontshare.com` or external font <link> remains in layout; build passes.

### HARD-08 — landing revalidation
- Add revalidation so landing pages reflect client edits: call `revalidatePath`/`revalidateTag` from `updateClientSettings` (settings-actions.ts) and `onboardClient` (onboarding-actions.ts), and/or add `export const revalidate = 3600` to the landing route. Acceptance: revalidatePath/revalidateTag invoked in the settings + onboarding actions, or revalidate exported on landing page.

### HARD-09 — env validation at boot
- Next.js: add a zod-validated env module (apps/web/src/lib/env.ts) that validates required vars (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, etc.) and is imported early; fail fast with a clear message. FastAPI: validate required os.environ at lifespan startup and raise a clear error if missing (api/main.py or a config module). Acceptance: both apps have an env-validation module referenced at startup.

### HARD-10 — requirements.txt cleanup
- Rewrite api/requirements.txt to a minimal, fully pinned list (fastapi, uvicorn[standard], stripe, supabase, resend (pinned exact), cryptography, pydantic, httpx, python-dotenv, sentry-sdk if used later — but only include what's imported). Remove pyiceberg, fastar, pyroaring, fastapi-cloud-cli, and other unused. Pin resend exactly. Python version pin (runtime.txt) was added in Phase 6 FIX-06 — verify it exists (3.12). Acceptance: requirements.txt has no unused pkgs, resend pinned exactly, all deps pinned; runtime.txt present.

### Claude's Discretion
- Migration filenames (008, 009 or combine), threadpool vs async client choice, exact env var list, and font consolidation specifics are at Claude's discretion. Keep landing pages <2s.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- escapeHtml already in apps/web/src/app/api/get-started/route.ts.
- next/font already used in apps/web/src/app/layout.tsx (Poppins, Geist).
- LEAD_STATUSES / status enums in apps/web/src/lib/types/dashboard.ts.
- Migrations supabase/migrations/NNN — latest is 007. New: 008+.
- create-client-login.ts (Math.random passwords), settings-actions.ts (revalidate hook point), onboarding-actions.ts.
- api/services/supabase_client.py (sync client), api/routers/webhooks.py + callrail_webhooks.py (async handlers doing DB I/O).

### Established Patterns
- FastAPI: verify → 200 → BackgroundTasks. Next.js 15 async APIs; force-dynamic on authed routes.

### Integration Points
- run_in_threadpool wraps around existing service calls.
- env modules imported at app entry / lifespan.

</code_context>

<specifics>
## Specific Ideas

Authoritative spec: .planning/REQUIREMENTS.md (v1.1 Medium-Priority section) + audit findings. Note migration 005 already added the unique index on leads(callrail_call_id) — verify, do not duplicate.

</specifics>

<deferred>
## Deferred Ideas

- Repo hygiene, error pages, doc fixes, stray nested .git in apps/web → Phase 8.
- Features → Phase 9.

</deferred>
