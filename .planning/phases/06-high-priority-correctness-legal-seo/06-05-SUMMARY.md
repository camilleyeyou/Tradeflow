---
phase: 06-high-priority-correctness-legal-seo
plan: 05
subsystem: api
tags: [rate-limiting, spam-protection, honeypot, nextjs, vitest]

# Dependency graph
requires:
  - phase: 06-high-priority-correctness-legal-seo (06-03)
    provides: SMS consent + legal pages groundwork on the same forms
provides:
  - In-memory sliding-window per-IP rate limiter (apps/web/src/lib/rate-limit.ts)
  - Honeypot field + guard on /api/leads/submit
  - Honeypot field + guard on /api/get-started
affects: [any future phase touching lead-submit or get-started forms/routes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bot-deterrence guard order: honeypot check -> rate-limit check -> Zod parse -> DB/email work, all before any external side effect"
    - "Honeypot fields are plain useState inputs outside react-hook-form, spread into the JSON body at submit time so Zod schemas never need to know about them"

key-files:
  created:
    - apps/web/src/lib/rate-limit.ts
    - apps/web/src/lib/rate-limit.test.ts
  modified:
    - apps/web/src/app/api/leads/submit/route.ts
    - apps/web/src/components/lead-form.tsx
    - apps/web/src/app/api/get-started/route.ts
    - "apps/web/src/app/(marketing)/get-started/page.tsx"

key-decisions:
  - "In-memory Map-based limiter chosen over a distributed store (Redis/Upstash) — explicitly documented as best-effort per serverless instance, sufficient for basic bot deterrence per Phase 6 CONTEXT; not a hard guarantee"
  - "Honeypot value read from the raw parsed JSON body (not the Zod-parsed result) since both schemas strip unknown keys"

patterns-established:
  - "Pattern: bot-deterrence guards (honeypot, rate limit) execute at the very top of POST handlers, before any validation or side-effecting work"

requirements-completed: [SPAM-01]

duration: 3min
completed: 2026-07-06
---

# Phase 6 Plan 5: Honeypot + Per-IP Rate Limiting Summary

**Added a reusable in-memory sliding-window rate limiter plus honeypot fields on both public POST endpoints (/api/leads/submit, /api/get-started), rejecting bot traffic with a silent 200 (honeypot) or 429 (rate limit) before any DB insert or email send.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-06T05:38:32-07:00
- **Completed:** 2026-07-06T05:41:14-07:00
- **Tasks:** 3
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments
- Built `rateLimit(key, limit, windowMs)` and `getClientIp(request)` in `apps/web/src/lib/rate-limit.ts`, TDD'd with vitest (RED then GREEN)
- Wired honeypot + 5 req/min/IP rate limiting into `/api/leads/submit`, ahead of `leadSchema.safeParse` and any Supabase call
- Wired the same guards into `/api/get-started`, ahead of `getStartedSchema.safeParse` and the Resend call
- Added matching hidden honeypot inputs to `lead-form.tsx` and `get-started/page.tsx`, both kept outside react-hook-form and merged into the JSON body at submit time

## Task Commits

Each task was committed atomically:

1. **Task 1: In-memory sliding-window rate limiter** - `32cb4a1` (test, RED) + `41ee320` (feat, GREEN)
2. **Task 2: Honeypot + rate limit on lead-submit** - `ea88cc5` (feat)
3. **Task 3: Honeypot + rate limit on get-started** - `0a8a8ef` (feat)

_TDD task (Task 1) produced two commits: failing test, then implementation. No refactor commit was needed — implementation passed cleanly on first attempt._

## Files Created/Modified
- `apps/web/src/lib/rate-limit.ts` - Sliding-window per-IP limiter (`rateLimit`) + `getClientIp` header parser
- `apps/web/src/lib/rate-limit.test.ts` - Vitest coverage: limit boundary, window eviction, IP header precedence
- `apps/web/src/app/api/leads/submit/route.ts` - Honeypot short-circuit + 429 guard before Zod/DB work
- `apps/web/src/components/lead-form.tsx` - Hidden honeypot input (`company_website`), merged into POST body
- `apps/web/src/app/api/get-started/route.ts` - Honeypot short-circuit + 429 guard before Zod/Resend work
- `apps/web/src/app/(marketing)/get-started/page.tsx` - Hidden honeypot input (`company_website`), merged into POST body

## Decisions Made
- In-memory Map-based limiter accepted as best-effort per serverless instance (documented in a top-of-file comment) rather than adding a new external dependency (e.g. Redis/Upstash) for launch — matches Phase 6 CONTEXT's scope (deter cheap bot majority, not a hard guarantee)
- Honeypot field name `company_website` chosen to look plausible to autofill/bot scripts while being irrelevant to a homeowner lead form or a contractor onboarding form
- Rate-limit key namespaced per route (`lead:${ip}` vs `getstarted:${ip}`) so the two endpoints don't share a budget

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The limiter is pure in-process TypeScript; no new env vars.

## Next Phase Readiness

- SPAM-01 fully satisfied: both public POST endpoints reject honeypot-filled submissions (silent 200) and rate-limited traffic (429) before any insert/email side effect.
- `apps/web/src/lib/rate-limit.ts` is generic and reusable — any future public POST endpoint can import `rateLimit`/`getClientIp` without new plumbing.
- No blockers for subsequent Phase 6 plans (06-06).

---
*Phase: 06-high-priority-correctness-legal-seo*
*Completed: 2026-07-06*

## Self-Check: PASSED

All created/modified files verified present on disk; all 4 task commits (32cb4a1, 41ee320, ea88cc5, 0a8a8ef) verified present in git history.
