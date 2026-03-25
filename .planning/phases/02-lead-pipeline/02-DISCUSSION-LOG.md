# Phase 2: Lead Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 2-lead-pipeline
**Mode:** Auto (--auto flag)
**Areas discussed:** Lead submission endpoint, GHL integration scope, Landing page architecture, SMS sequence ownership, Webhook routing, Email notification, Idempotency, Service type generation

---

## Lead Submission Endpoint Location

| Option | Description | Selected |
|--------|-------------|----------|
| Next.js API Route | `/api/leads/submit` in Next.js app — co-located with frontend | ✓ |
| FastAPI endpoint | Route form submissions to Railway FastAPI | |

**User's choice:** Next.js API Route (auto-selected: form submission from same origin, avoids CORS, keeps lead flow in one codebase)
**Notes:** External service webhooks (GHL, Stripe, CallRail) go to FastAPI. Form submissions from the landing page are internal and belong in Next.js.

---

## GHL Sub-Account Provisioning Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Build API wrapper + manual seed | Implement GHL API client capable of creating sub-accounts; manually create seed client sub-account for testing | ✓ |
| Full admin UI for provisioning | Build the admin onboarding form that triggers sub-account creation | |

**User's choice:** API wrapper + manual seed (auto-selected: admin onboarding UI is Phase 4 per roadmap; Phase 2 needs the API wrapper and contact creation, not the admin form)

---

## GHL Webhook Routing

| Option | Description | Selected |
|--------|-------------|----------|
| FastAPI on Railway | GHL webhooks hit FastAPI — no Vercel Deployment Protection issues | ✓ |
| Next.js API Routes | GHL webhooks hit Next.js `/api/webhooks/ghl` | |

**User's choice:** FastAPI on Railway (auto-selected: pitfalls research identified Vercel Deployment Protection as a blocker for external webhooks)

---

## SMS Sequence Management

| Option | Description | Selected |
|--------|-------------|----------|
| GHL workflow + tracking records | GHL handles SMS delivery via workflows; our backend triggers the workflow and writes tracking records to sms_sequences table | ✓ |
| Custom SMS scheduling | Build our own scheduler to send SMS at intervals via GHL API | |

**User's choice:** GHL workflow + tracking records (auto-selected: GHL handles the complexity of scheduling, delivery, and reply detection; we track for dashboard visibility)

---

## Email Notification Source

| Option | Description | Selected |
|--------|-------------|----------|
| Next.js API Route (inline) | Send Resend email from the lead submit handler | ✓ |
| FastAPI background task | Forward to FastAPI for async email sending | |

**User's choice:** Next.js API Route inline (auto-selected: keeps the entire lead submit flow in one handler; Resend API call is fast enough for inline execution)

---

## Landing Page Service Types

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed service list from schema | Generate pages for: ac-repair, furnace-repair, installation, maintenance | ✓ |
| Dynamic from database column | Store service types per client in database | |

**User's choice:** Fixed service list (auto-selected: matches `service_type` enum in leads table; keeps static generation simple)

---

## Lead Form Idempotency

| Option | Description | Selected |
|--------|-------------|----------|
| Frontend disable + backend dedup | Disable button on click; backend checks for duplicate phone+client_id within 5 minutes | ✓ |
| Database unique constraint only | Rely on DB constraint for dedup | |

**User's choice:** Frontend disable + backend dedup (auto-selected: defense in depth — prevents both UI double-click and API replay)

---

## Claude's Discretion

- Landing page visual design and component structure
- Exact Resend email template content
- GHL workflow trigger mechanism (tag vs workflow trigger API)
- Error handling and retry strategy for GHL API calls
- shadcn/ui component selection for the lead form

## Deferred Ideas

None — discussion stayed within phase scope
