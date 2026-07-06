---
phase: 06-high-priority-correctness-legal-seo
plan: 02
subsystem: security
tags: [aes-256-gcm, node-crypto, gohighlevel, supabase, onboarding, vitest, server-actions]

# Dependency graph
requires:
  - phase: 06-01
    provides: earlier Phase 6 correctness fixes (FIX-04 Stripe signature error class, etc.)
provides:
  - Per-client encrypted GHL Private Integration Token (clients.ghl_private_token_encrypted)
  - Server-only AES-256-GCM crypto helper (encryptToken/decryptToken) keyed on GHL_TOKEN_ENC_KEY
  - Collision-safe slug derivation in onboardClient (appends -2, -3, ... on duplicate)
  - Lead-submit path resolves each client's own GHL token, falling back to the global env token
affects: [phase-06-03, phase-07-hardening, ghl-integration, onboarding-flow]

# Tech tracking
tech-stack:
  added: [vitest (apps/web devDependency, first test runner in this app)]
  patterns:
    - "Server-only crypto module (node:crypto, AES-256-GCM) never imported by client components"
    - "Collision-safe slug generation via prefix query + in-memory Set before insert"
    - "Per-client secret stored encrypted at rest; decrypted only inside a server-only API route/action"

key-files:
  created:
    - supabase/migrations/006_add_ghl_token_to_clients.sql
    - apps/web/src/lib/crypto.ts
    - apps/web/src/lib/crypto.test.ts
  modified:
    - apps/web/src/lib/supabase/types.ts
    - apps/web/src/lib/validations/onboarding.ts
    - apps/web/src/app/(admin)/admin/clients/new/page.tsx
    - apps/web/src/lib/actions/onboarding-actions.ts
    - apps/web/src/app/api/leads/submit/route.ts
    - apps/web/.env.example
    - apps/web/package.json

key-decisions:
  - "Installed vitest as apps/web's first test runner solely to satisfy the tdd=true requirement on the crypto helper task; no broader test-infra decision made yet"
  - "Token payload format is iv:authTag:ciphertext (hex segments) — simple, inspectable, no external encoding deps"
  - "Lead-submit wraps the entire GHL contact/workflow block in `if (token)` so a client with neither a stored token nor a global fallback simply skips GHL silently rather than throwing"
  - "Collision-safe slug uses ilike prefix match + Set membership check rather than a DB-level retry-on-conflict loop — simpler and sufficient for admin-driven onboarding volume"

patterns-established:
  - "Server-only secret helpers get a `// Server-only: imports node:crypto, never bundle to client` header comment when the `server-only` package isn't already a dependency"

requirements-completed: [FIX-01, FIX-02]

# Metrics
duration: 15min
completed: 2026-07-06
---

# Phase 6 Plan 2: Per-Client Encrypted GHL Token + Collision-Safe Slug Summary

**Per-client AES-256-GCM-encrypted GoHighLevel tokens replace the single shared `GHL_PRIVATE_TOKEN`, and onboarding now derives a collision-safe unique slug before insert.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-06T05:04:00-07:00 (approx.)
- **Completed:** 2026-07-06T05:19:05-07:00
- **Tasks:** 4 (Task 2 executed as TDD: RED → GREEN)
- **Files modified:** 10 (3 created, 7 modified)

## Accomplishments
- Added `ghl_private_token_encrypted` column (migration 006) and wired it into `Database` types
- Built a server-only `encryptToken`/`decryptToken` helper (AES-256-GCM, keyed on `GHL_TOKEN_ENC_KEY`), test-driven with vitest
- Onboarding form/action now captures an optional per-client GHL token, encrypts it before insert, and derives a collision-safe slug (`-2`, `-3`, ...) instead of relying on the bare normalized business name
- Lead-submit route decrypts and uses each client's own token, falling back to the global `GHL_PRIVATE_TOKEN` only when a client has none stored

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 006 + types for encrypted GHL token** - `14bfc64` (feat)
2. **Task 2: AES-256-GCM crypto helper (server-only)** - TDD:
   - RED: `0406394` (test) - failing crypto.test.ts + vitest devDependency
   - GREEN: `cdcb9c9` (feat) - crypto.ts implementation, all 3 tests pass
3. **Task 3: Capture + encrypt token at onboarding; collision-safe slug** - `e811d38` (feat)
4. **Task 4: Lead-submit uses per-client token; document env key** - `7fafb0f` (feat)

_Plan metadata commit and STATE/ROADMAP updates follow this summary._

## Files Created/Modified
- `supabase/migrations/006_add_ghl_token_to_clients.sql` - adds nullable `ghl_private_token_encrypted text` column to `clients`
- `apps/web/src/lib/supabase/types.ts` - adds the new field to clients `Row`/`Insert`/`Update`
- `apps/web/src/lib/crypto.ts` - `encryptToken`/`decryptToken` (AES-256-GCM, `node:crypto`, server-only)
- `apps/web/src/lib/crypto.test.ts` - round-trip, format, and IV-randomness tests
- `apps/web/src/lib/validations/onboarding.ts` - optional `ghl_private_token` field on `onboardingSchema`
- `apps/web/src/app/(admin)/admin/clients/new/page.tsx` - password-type input for the token, encrypted-storage helper text
- `apps/web/src/lib/actions/onboarding-actions.ts` - collision-safe slug derivation + `encryptToken()` on insert
- `apps/web/src/app/api/leads/submit/route.ts` - selects `ghl_private_token_encrypted`, decrypts with fallback to env, guards the GHL block on `token` presence
- `apps/web/.env.example` - documents `GHL_TOKEN_ENC_KEY`, clarifies `GHL_PRIVATE_TOKEN` is now fallback-only
- `apps/web/package.json` - adds `vitest` devDependency and `test` script

## Decisions Made
- Installed vitest as the first test runner in `apps/web` purely to satisfy the plan's `tdd="true"` requirement for the crypto helper — no project-wide test strategy decision was made beyond this.
- Token ciphertext format kept simple (`iv:authTag:ciphertext`, hex) rather than base64 or a structured JSON blob, matching the plan's explicit spec.
- Lead-submit's GHL block is now wrapped in `if (token)` so a client with no stored token and no global fallback configured skips GHL gracefully instead of throwing on a `null` token, consistent with the plan's directive to "guard" the call.

## Deviations from Plan

None — plan executed exactly as written. Task 2 followed the RED→GREEN TDD flow (installed vitest, confirmed the test failed with `crypto.ts` absent, then restored the implementation and confirmed all 3 tests passed) as required by `tdd="true"`.

## Issues Encountered
None.

## User Setup Required

**External configuration needed before this reaches production:**
- Generate a 32-byte (64 hex char) value and set `GHL_TOKEN_ENC_KEY` in Vercel env vars (e.g., `openssl rand -hex 32`). Without it, `encryptToken`/`decryptToken` throw immediately.
- Apply `supabase/migrations/006_add_ghl_token_to_clients.sql` to the live Supabase project (via `supabase db push` or the SQL editor) before any client is onboarded with a token or before lead-submit queries the new column.
- Existing clients have `ghl_private_token_encrypted = null` and will continue using the shared `GHL_PRIVATE_TOKEN` fallback until an admin re-saves them with a per-client token (no bulk-migration UI was built — out of scope for this plan).

## Next Phase Readiness
- FIX-01 and FIX-02 are both closed for Phase 6.
- `apps/web` now has a working vitest setup (`npm test`), which future phases can extend for other server-only helpers.
- Plan 06-03 can proceed; migration 006 deliberately does not touch review-related columns, which remain migration 007 in that plan.

---
*Phase: 06-high-priority-correctness-legal-seo*
*Completed: 2026-07-06*

## Self-Check: PASSED

All 10 created/modified files confirmed present on disk; all 5 task commit hashes (`14bfc64`, `0406394`, `cdcb9c9`, `e811d38`, `7fafb0f`) confirmed in git history.
