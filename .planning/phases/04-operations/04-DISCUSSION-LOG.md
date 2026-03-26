# Phase 4: Operations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 4-operations
**Mode:** Auto (--auto flag)
**Areas discussed:** Admin panel layout, Client onboarding flow, Stripe webhook routing, GHL sub-account provisioning, Admin data access pattern, Billing record handling

---

## Admin Panel Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse dashboard sidebar-nav | Same sidebar + bottom tabs pattern from Phase 3 | |
| Simple top-nav layout | Minimal header with nav links, no sidebar | ✓ |

**User's choice:** Simple top-nav layout (auto-selected: admin is a single user, doesn't need mobile bottom-tabs; simpler layout matches admin's desktop-primary usage)

---

## Client Onboarding Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Single form with all fields | One page, all fields visible, submit once | ✓ |
| Multi-step wizard | Step 1: business info, Step 2: service config, Step 3: GHL setup | |

**User's choice:** Single form (auto-selected: admin creates 2-5 clients during MVP; wizard is over-engineering for this volume)

---

## Stripe Webhook Routing

| Option | Description | Selected |
|--------|-------------|----------|
| FastAPI on Railway | Stripe webhooks hit FastAPI — consistent with GHL webhook pattern | ✓ |
| Next.js API Routes | Stripe webhooks hit Next.js `/api/webhooks/stripe` | |

**User's choice:** FastAPI on Railway (auto-selected: consistent with D-26; Vercel Deployment Protection blocks external webhooks)

---

## GHL Sub-Account Provisioning

| Option | Description | Selected |
|--------|-------------|----------|
| Inline during onboarding | GHL API call runs synchronously in Server Action | ✓ |
| Background job | Queue GHL creation, poll for completion | |

**User's choice:** Inline (auto-selected: admin creates 2-5 clients; GHL API is fast; no need for job queue complexity)

---

## Admin Data Access Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Service role key (createAdminClient) | Bypasses RLS, sees all data | ✓ |
| RLS with admin policy | Add admin-specific RLS policies | |

**User's choice:** Service role key (auto-selected: createAdminClient already exists; ADMN-05 explicitly requires service role key)

---

## Billing Record Display

| Option | Description | Selected |
|--------|-------------|----------|
| Admin only for v1 | Billing visible only in admin panel | ✓ |
| Admin + HVAC owner | Show billing to both admin and clients | |

**User's choice:** Admin only (auto-selected: billing table has client RLS but admin panel is the primary billing interface for v1)

---

## Claude's Discretion

- Admin nav styling and visual hierarchy
- Client detail page layout (tabs vs sections)
- Badge colors for client status
- Error state presentation
- Stripe webhook logging approach
- Payment failure email template

## Deferred Ideas

None — discussion stayed within phase scope
