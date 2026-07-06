---
phase: 07-medium-priority-hardening
plan: 03
subsystem: web
tags: [nextjs, security, xss, open-redirect, crypto, isr, resend, supabase]

# Dependency graph
requires:
  - phase: 06-high-priority-correctness-legal-seo
    provides: lead-submit route, auth callback, onboarding/settings Server Actions, landing routes established in earlier phases
provides:
  - Shared escapeHtml() util used to sanitize user-supplied values before HTML email interpolation
  - notifications_enabled gate on lead-notification emails
  - Open-redirect-safe auth callback (same-origin-only next param)
  - Crypto-strong (node crypto randomInt) temporary client passwords
  - Landing-page cache freshness via bounded ISR window + explicit revalidatePath on client edits
affects: [08-low-priority-hygiene, 09-differentiating-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared escapeHtml() util (apps/web/src/lib/escape-html.ts) for any future HTML email interpolation of user-supplied data"
    - "Sanitize redirect targets with a same-origin allowlist (startsWith('/') && !startsWith('//')) before using in NextResponse.redirect"
    - "Use node crypto randomInt() (not Math.random()) for any generated secret/temp-password"
    - "Landing pages carry export const revalidate = 3600 as a floor; Server Actions that mutate client-facing data additionally call revalidatePath on the specific slug for immediate freshness"

key-files:
  created:
    - apps/web/src/lib/escape-html.ts
  modified:
    - apps/web/src/app/api/leads/submit/route.ts
    - apps/web/src/app/auth/callback/route.ts
    - apps/web/src/lib/actions/create-client-login.ts
    - apps/web/src/lib/actions/settings-actions.ts
    - apps/web/src/lib/actions/onboarding-actions.ts
    - apps/web/src/app/(landing)/[clientSlug]/page.tsx
    - apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx

key-decisions:
  - "Reused the exact escapeHtml() body already inline in api/get-started/route.ts rather than inventing a new implementation, then left that route's local copy untouched (not required to migrate it, no behavior change)"
  - "Left the subject-line interpolation of homeowner_name/service_type unescaped since email subjects are not HTML and escaping would show literal &#39; etc. to the recipient"
  - "settings-actions revalidates only the top-level landing slug (/{slug}), not every /{slug}/{service} sub-path — the 3600s ISR floor on the [service] route covers eventual consistency for those"

patterns-established:
  - "Pattern: escapeHtml() from @/lib/escape-html for all user-supplied values interpolated into HTML email bodies"
  - "Pattern: same-origin redirect allowlist for any query-param-driven redirect target"

requirements-completed: [HARD-04, HARD-05, HARD-06, HARD-08]

# Metrics
duration: 8min
completed: 2026-07-06
---

# Phase 7 Plan 3: Next.js Correctness Hardening Summary

**Escaped/notification-gated lead emails, same-origin-only auth redirects, crypto-strong temp passwords, and ISR + explicit revalidation for landing pages**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-06T13:21:00Z
- **Completed:** 2026-07-06T13:29:45Z
- **Tasks:** 3
- **Files modified:** 8 (1 created, 7 modified)

## Accomplishments
- User-supplied lead data (name, phone, service, zip) and the client's business name are now HTML-escaped before being interpolated into the lead-notification email, closing an HTML-injection vector into HVAC owner inboxes; the email is also skipped entirely when the client has turned notifications off
- The auth callback now rejects absolute (`https://evil.com`) and protocol-relative (`//evil.com`) `next` redirect targets, falling back to `/admin`, closing an open-redirect vector reachable via a crafted magic-link/PKCE callback URL
- Temporary client login passwords are generated with node `crypto.randomInt()` instead of `Math.random()`, removing a predictable-secret weakness
- Both landing routes (`[clientSlug]/page.tsx`, `[clientSlug]/[service]/page.tsx`) carry a 3600s ISR revalidate window, and the settings/onboarding Server Actions now call `revalidatePath` on the affected client's slug immediately after a successful write, so landing pages don't show a stale phone number or business name for up to an hour

## Task Commits

Each task was committed atomically:

1. **Task 1: Escape lead-email HTML + honor notifications_enabled (HARD-05)** - `2e4a70e` (feat)
2. **Task 2: Reject open redirects (HARD-04) + crypto-strong temp passwords (HARD-06)** - `df67544` (fix)
3. **Task 3: Revalidate landing pages on client edits (HARD-08)** - `0479191` (fix)

**Plan metadata:** (this commit, pending)

## Files Created/Modified
- `apps/web/src/lib/escape-html.ts` - New shared escapeHtml() util
- `apps/web/src/app/api/leads/submit/route.ts` - Escapes interpolated values, checks notifications_enabled before sending
- `apps/web/src/app/auth/callback/route.ts` - Sanitizes `next` param to same-origin paths only
- `apps/web/src/lib/actions/create-client-login.ts` - generateTempPassword() uses crypto.randomInt()
- `apps/web/src/lib/actions/settings-actions.ts` - Additional revalidatePath on the client's landing slug
- `apps/web/src/lib/actions/onboarding-actions.ts` - revalidatePath on the new client's slug before redirect
- `apps/web/src/app/(landing)/[clientSlug]/page.tsx` - `export const revalidate = 3600`
- `apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx` - `export const revalidate = 3600`

## Decisions Made
- Reused the existing inline escapeHtml() implementation from api/get-started/route.ts verbatim as the shared util, rather than writing new logic — behavior-identical, now centralized
- Kept subject-line string interpolation (email subject, not HTML) unescaped by design
- settings-actions revalidates the top-level `/{slug}` path only; the 3600s ISR floor on the `[service]` sub-route handles eventual consistency there

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `npx tsc --noEmit` passed cleanly after all three tasks with no type regressions (notifications_enabled and slug columns already exist in the hand-authored Database type stub from Phase 5's DPLY-01 work).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- HARD-04, HARD-05, HARD-06, HARD-08 all satisfied; no known stubs or deferred work from this plan
- Remaining Phase 7 items (if any) and Phase 8 (low-priority hygiene) are unaffected by these changes — no shared files with this plan's scope

---
*Phase: 07-medium-priority-hardening*
*Completed: 2026-07-06*

## Self-Check: PASSED

All 8 created/modified files confirmed present on disk; all 3 task commits (2e4a70e, df67544, 0479191) confirmed in git log.
