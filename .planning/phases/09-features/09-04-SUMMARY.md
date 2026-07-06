---
phase: 09-features
plan: 04
subsystem: dashboard
tags: [ghl, sms, nextjs, route-handler, rls, supabase]

# Dependency graph
requires:
  - phase: 06-high-priority-correctness-legal-seo
    provides: per-client GHL token model (FIX-01) — clients.ghl_private_token_encrypted + decryptToken
  - phase: 03-client-dashboard
    provides: leads-table.tsx, dashboard auth pattern (getUser + redirect), Lead type
provides:
  - GHL conversations service (getConversationMessages, sendSMSReply) added to lib/ghl.ts
  - Auth'd + RLS-scoped route handler at /api/leads/[id]/messages (GET thread, POST reply)
  - Lead detail page at /dashboard/leads/[id] hosting the SMS inbox
  - sms-inbox.tsx client component (thread view + reply box)
  - leads-table.tsx row link to lead detail page
affects: [dashboard, ghl-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "resolveLeadContext helper: verify getUser() + RLS ownership on the ssr client BEFORE any service-role read of per-client secrets"
    - "GHL calls isolated in lib/ghl.ts, wrapped in try/catch, degrade to []/false on any error (unverified conversations scope)"

key-files:
  created:
    - apps/web/src/app/api/leads/[id]/messages/route.ts
    - apps/web/src/components/dashboard/sms-inbox.tsx
    - apps/web/src/app/(dashboard)/dashboard/leads/[id]/page.tsx
  modified:
    - apps/web/src/lib/ghl.ts
    - apps/web/src/components/dashboard/leads-table.tsx

key-decisions:
  - "decryptToken() call wrapped in try/catch inside resolveLeadContext — a missing/invalid GHL_TOKEN_ENC_KEY degrades to an empty thread (GET) or 409 Contact not synced (POST) rather than a 500 crash"
  - "GHL conversations API endpoints (/conversations/search, /conversations/{id}/messages, /conversations/messages) are unverified against a live conversations-scoped token — documented inline in ghl.ts for confirmation at deploy time"
  - "Homeowner name in leads-table.tsx becomes the link to the detail page (no separate 'View' column) to keep the existing column layout intact"

patterns-established:
  - "Per-lead route handlers that touch service-role client secrets must resolve RLS ownership on the ssr client first, then read secrets with a second inline service-role client scoped only to the already-verified client_id"

requirements-completed: [INBX-01]

# Metrics
duration: 8min
completed: 2026-07-06
---

# Phase 9 Plan 4: Two-Way SMS Inbox Summary

**GHL conversations service + auth'd RLS-scoped route handler + lead-detail SMS inbox UI, with per-client tokens read server-side only and graceful degradation on any GHL error**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-06T17:20:00Z
- **Completed:** 2026-07-06T17:25:17Z
- **Tasks:** 3
- **Files modified:** 5 (2 created new files, 1 new route, 2 modified)

## Accomplishments
- Added `getConversationMessages` and `sendSMSReply` to `lib/ghl.ts`, reusing the existing `ghlFetch` client, both degrading to `[]`/`false` on any error so an unverified conversations scope can never crash the dashboard
- Built an auth'd, RLS-scoped route handler (`/api/leads/[id]/messages`) that verifies `getUser()` and lead ownership on the ssr client before reading any client's encrypted GHL token via a service-role client — the token is never returned in a response body
- Shipped `sms-inbox.tsx` (thread view + reply box) and a new lead detail page at `/dashboard/leads/[id]`, linked from the leads table

## Task Commits

Each task was committed atomically:

1. **Task 1: GHL conversations service (fetch thread + send reply)** - `af75b5b` (feat)
2. **Task 2: Auth'd route handler — GET thread / POST reply** - `94840ce` (feat)
3. **Task 3: Inbox UI + lead detail page + leads-table link** - `c2a2f69` (feat)

_No TDD tasks in this plan — all `type="auto"`._

## Files Created/Modified
- `apps/web/src/lib/ghl.ts` - Added `GHLMessage` interface, `getConversationMessages`, `sendSMSReply`
- `apps/web/src/app/api/leads/[id]/messages/route.ts` - GET/POST handler with `resolveLeadContext` (auth + RLS ownership + service-role token read)
- `apps/web/src/components/dashboard/sms-inbox.tsx` - Client component: fetch thread on mount, render inbound/outbound bubbles, POST reply on send
- `apps/web/src/app/(dashboard)/dashboard/leads/[id]/page.tsx` - Server page: auth guard, RLS-scoped lead fetch, `notFound()` on miss, hosts `SmsInbox`
- `apps/web/src/components/dashboard/leads-table.tsx` - Homeowner name now links to `/dashboard/leads/${lead.id}`

## Decisions Made
- Wrapped `decryptToken()` in try/catch inside the route handler — the crypto helper throws on a missing/malformed key, and the plan requires graceful degradation rather than a 500
- Kept GHL conversations endpoints exactly as specified in the plan's interface notes, with inline comments flagging them as unverified against a live token/scope
- Used the existing admin-panel `notFound()` + `Link` + async-params pattern (from `admin/clients/[id]/page.tsx`) for consistency with the rest of the dashboard

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no new environment variables. The plan already depends on `GHL_TOKEN_ENC_KEY` (Phase 6, FIX-01) and per-client `ghl_private_token_encrypted` / `GHL_PRIVATE_TOKEN` fallback, both already documented in prior phases. The exact GHL conversations API paths (`/conversations/search`, `/conversations/{id}/messages`, `/conversations/messages`) should be confirmed against a real conversations-scoped token before relying on this feature in production — if they differ, only `lib/ghl.ts` needs updating since GHL calls are fully isolated there.

## Next Phase Readiness
- INBX-01 complete; Phase 9 has one plan remaining (09-05, AI-01/AI-02 Claude lead scoring)
- No blockers introduced

---
*Phase: 09-features*
*Completed: 2026-07-06*

## Self-Check: PASSED

All created/modified files confirmed present on disk; all three task commits (af75b5b, 94840ce, c2a2f69) confirmed in git log.
