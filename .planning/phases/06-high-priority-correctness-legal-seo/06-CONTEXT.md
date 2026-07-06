# Phase 6: High-Priority Correctness, Legal & SEO - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss — autonomous run)

<domain>
## Phase Boundary

Fix high-priority correctness bugs, meet baseline SMS/legal compliance, add landing-page SEO, and patch vulnerable dependencies. Scope = FIX-01/03/04/05/06, SPAM-01, LEGL-01/02/03, SEO-01/02, DEP-01. Not general refactors; not the medium hardening (Phase 7).

</domain>

<decisions>
## Implementation Decisions

### IMPORTANT — FIX-02 already done
- FIX-02 (slug NOT NULL onboarding bug) was ALREADY FIXED in Phase 5 (plan 05-05) when schema-accurate types exposed it — `onboardClient` now derives the slug the same way migration 002's backfill did. This phase must VERIFY that fix (grep + a collision-handling check) and mark FIX-02 satisfied, NOT re-implement it. If collision handling is missing (duplicate slug), add it (append -2, -3, … or a short suffix).

### FIX-01 — per-client GHL token
- Add an encrypted per-client GHL token: a new column on `clients` (e.g. `ghl_private_token_encrypted`), a new Supabase migration (continue numbering 006). Capture it during onboarding (`onboarding-actions.ts` + onboarding form field). Encrypt at rest using a server-side key (env `GHL_TOKEN_ENC_KEY`) via Node crypto (AES-256-GCM); decrypt server-side only in the lead-submit path. Update `apps/web/src/app/api/leads/submit/route.ts` to read the client's token instead of the global `process.env.GHL_PRIVATE_TOKEN`. Keep a safe fallback comment but prefer per-client. Never expose the token to the browser. Also update the generated types.ts for the new column.

### FIX-03 — phone normalization
- In `apps/web/src/lib/validations/lead.ts`, add `.transform(v => v.replace(/\D/g, ''))` before the regex, mirroring `get-started.ts`. Acceptance: a value like "(555) 123-4567" passes validation and stores as digits.

### FIX-04 — Stripe exception
- In `api/routers/stripe_webhooks.py`, change `stripe.errors.SignatureVerificationError` to `stripe.SignatureVerificationError` (verified correct for the installed stripe 14.x). Invalid signature → 400, not 500. Also handle malformed JSON body → 400 (the GHL webhook JSON parse hardening can be mirrored). Acceptance: bad signature returns 400.

### FIX-05 — unified admin gating
- `apps/web/middleware.ts` must use the same `isAdmin()` logic as `src/lib/admin.ts` (support comma-separated `ADMIN_EMAILS`, case-insensitive, with `ADMIN_EMAIL` fallback). Since middleware is edge, inline the isAdmin logic or import if edge-safe. Add `ADMIN_EMAILS` to both `.env.example` files. Acceptance: middleware references ADMIN_EMAILS; .env.example documents it.

### FIX-06 — Railway boot
- Verify api/Procfile module path against the directory layout. Add a Python version pin (`.python-version` or `runtime.txt`) matching 3.12 per CLAUDE.md. Document the Railway service root requirement (repo root vs api/) in the deploy checklist. Prefer making api/ robust: if service root is api/, imports must resolve; else document root=repo-root. Acceptance: a pin file exists; Procfile verified/commented.

### SPAM-01 — bot protection
- Add a honeypot hidden field to both the lead form and get-started form (e.g. `company_website`) — if filled, silently 200 without processing. Add per-IP rate limiting to `/api/leads/submit` and `/api/get-started`. Prefer a lightweight in-memory/edge limiter or Upstash if available; if no external dep desired, implement a simple in-memory sliding-window keyed on IP (documented as best-effort on serverless). Acceptance: honeypot-filled submit returns 200 without insert; exceeding N req/min per IP returns 429.

### LEGL-01 — SMS consent
- Under the lead form submit button, add explicit consent copy: e.g. "By submitting, you agree to receive calls and texts (including automated) from {business} about your request. Msg/data rates may apply. Reply STOP to opt out." Use the client business name where available. Acceptance: consent text present in lead-form component.

### LEGL-02 — privacy + terms
- Create `/privacy` and `/terms` pages (static, in the marketing route group) with reasonable baseline content for an HVAC lead-gen SaaS. Link them from the marketing footer AND the landing-page footer. Acceptance: both routes exist; footers link to them.

### LEGL-03 — per-client reviews
- Replace the hardcoded "4.9 from 100+ reviews" on landing pages with per-client data: add columns to `clients` (e.g. `review_rating numeric`, `review_count int`), migration + types; render the trust block only when both are present, otherwise hide. Acceptance: no hardcoded "4.9"/"100+"; landing page reads client.review_rating/review_count and hides block when null.

### SEO-01 — landing metadata
- Add `generateMetadata` to `apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx` producing title/description/OG from business, service, city (e.g. "AC Repair in Oak Park | Oak Park HVAC"). Set `metadataBase`. Acceptance: generateMetadata exported; title includes service + city.

### SEO-02 — robots + sitemap
- Add `apps/web/src/app/robots.ts` (disallow /dashboard, /admin, /api) and `apps/web/src/app/sitemap.ts` enumerating public landing pages from the clients table (same query as generateStaticParams; return [] safely when Supabase URL is placeholder). Acceptance: both files exist; robots disallows the three paths.

### DEP-01 — dependency patch
- Run `npm audit` in apps/web, bump Next.js to a patched 15.5.x and resolve high-severity advisories (`npm audit fix`, or targeted bumps). Re-run `npx tsc --noEmit` and `npm run build` to confirm no regressions. Acceptance: `npm audit --omit=dev` shows 0 high-severity; build passes.

### Claude's Discretion
- Exact column names, migration filenames (continue 006, 007…), rate-limiter implementation choice, and privacy/terms wording are at Claude's discretion following codebase conventions. Keep landing pages <2s (no heavy client JS added).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phone transform pattern already in apps/web/src/lib/validations/get-started.ts.
- isAdmin(): apps/web/src/lib/admin.ts. Admin middleware: apps/web/middleware.ts.
- Lead form: apps/web/src/components/lead-form.tsx. Lead submit: apps/web/src/app/api/leads/submit/route.ts.
- Landing page: apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx (generateStaticParams pattern to reuse for sitemap).
- get-started honeypot/escape patterns: apps/web/src/app/api/get-started/route.ts.
- Generated types: apps/web/src/lib/supabase/types.ts (update for new columns).
- Stripe webhook: api/routers/stripe_webhooks.py.

### Established Patterns
- Migrations supabase/migrations/NNN_*.sql (latest is 005). New ones: 006+.
- Next.js 15 async cookies/headers; force-dynamic on authed routes; server-only secrets.

### Integration Points
- New clients columns flow into onboarding form, types.ts, landing render.
- robots.ts/sitemap.ts at app root.

</code_context>

<specifics>
## Specific Ideas

Authoritative spec: .planning/REQUIREMENTS.md (v1.1 High-Priority section) and the pre-launch audit findings. FIX-02 is already satisfied by Phase 5 — verify, don't redo.

</specifics>

<deferred>
## Deferred Ideas

- Broad schema constraints/indexes, updated_at triggers, async python Supabase, least-privilege RLS → Phase 7.
- Repo hygiene, error pages, doc fixes → Phase 8.
- Features (webhook durability, Sentry, ROI, inbox, AI scoring) → Phase 9.

</deferred>
