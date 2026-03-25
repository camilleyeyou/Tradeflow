# Phase 2: Lead Pipeline - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the full lead pipeline: static landing pages per HVAC client with lead capture forms, a lead submission API that inserts into Supabase and syncs to GoHighLevel, SMS follow-up sequences triggered via GHL workflows, email notifications to HVAC owners via Resend, and a GHL webhook endpoint on FastAPI for inbound SMS reply logging. The end state is: a homeowner submits a form → lead is stored → GHL contact is created → owner gets an email → SMS nurture sequence fires automatically — all within 60 seconds, zero manual intervention.

</domain>

<decisions>
## Implementation Decisions

### Lead Submission Flow
- **D-13:** Lead form submits to Next.js API Route at `/api/leads/submit` (same origin, no CORS). This is a frontend form POST, not an external webhook — it belongs in Next.js. The handler validates with Zod, inserts into Supabase `leads` table, creates a GHL contact, triggers the GHL SMS workflow, and sends the owner email via Resend — all in one request.
- **D-14:** Lead form idempotency: disable submit button on first click (frontend), and on the backend check for an existing lead with the same `phone` + `client_id` created within the last 5 minutes. If a duplicate is detected, return success with the existing `lead_id` (no error to the user). Also check GHL for existing contact by phone before creating a new one.
- **D-15:** The lead submit handler returns `{ success: true, lead_id: string }` on success. Error shape: `{ error: string, code?: string }`. The form shows "We'll call you within 5 minutes" on success.

### Landing Pages
- **D-16:** Landing pages use `generateStaticParams` to pre-render at build time. The route is `(landing)/[clientSlug]/[service]/page.tsx`. `clientSlug` is the slugified `business_name` from the `clients` table. Service types are a fixed list: `ac-repair`, `furnace-repair`, `installation`, `maintenance`.
- **D-17:** `generateStaticParams` fetches all active clients from Supabase at build time and returns the cartesian product of `[clientSlug] × [service]`. Each page receives the client's data (business_name, phone, city, service_area_zips) via a server-side Supabase query using the anon key (no auth needed — public data).
- **D-18:** Landing page structure: Hero section with headline matching the service + city ("AC Repair in Oak Park"), click-to-call button (`tel:` format), and lead form above the fold. Below fold: trust signals (review stars, license badge, service area neighborhoods). No navigation menu. One CTA. Mobile-first design with Tailwind.
- **D-19:** The lead form has exactly 4 fields: name (text), phone (tel), service type (dropdown pre-filled from URL), zip code (text). Form uses react-hook-form + Zod for client-side validation. No additional fields.
- **D-20:** URL structure: `/oak-park-hvac/ac-repair`. The `clientSlug` field will be added to the `clients` table (or derived at build time from `business_name`). Slug derivation: lowercase, replace spaces with hyphens, remove special characters.

### GoHighLevel Integration
- **D-21:** Phase 2 implements the GHL API client (`lib/ghl.ts` in Next.js, `services/ghl_service.py` in FastAPI) with capabilities for: contact creation, workflow triggering, and sub-account lookup. Sub-account provisioning UI is Phase 4 — Phase 2 assumes the seed client's `ghl_sub_account_id` exists in the database (set manually or via seed data).
- **D-22:** GHL contact creation uses the GHL API v2 at `https://services.leadconnectorhq.com`. Each contact is created in the client's sub-account using the sub-account's Private Integration Token (stored securely, not in client-side code). Rate limit: 100 requests / 10 seconds per resource.
- **D-23:** SMS sequences are managed by GHL workflows — not custom-built. The backend triggers a GHL workflow after lead creation (via workflow trigger API or by adding a contact tag). The workflow handles the timing: immediate SMS, +15 minutes, +24 hours. The workflow auto-stops when the lead replies (GHL native behavior).
- **D-24:** Each SMS touch is tracked in the Supabase `sms_sequences` table. When the workflow is triggered, write the initial record (touch_number=1, status=pending). GHL webhook events update the status to sent/delivered/failed.
- **D-25:** `ghl_contact_id` is stored on the lead record after successful contact creation. `ghl_sub_account_id` is stored on the client record.

### GHL Webhook (Inbound SMS)
- **D-26:** GHL webhooks route to FastAPI on Railway at `/api/webhooks/ghl`. This avoids Vercel Deployment Protection blocking external POST requests. The FastAPI handler verifies signatures using both `X-GHL-Signature` (Ed25519, new) and `X-WH-Signature` (RSA, legacy) during the transition period (deadline: July 1, 2026).
- **D-27:** GHL `InboundMessage` events: look up the lead by `ghl_contact_id`, append the message to `leads.notes`, and mark the SMS sequence as stopped (update `sms_sequences` status). `ContactTagAdded` events: sync GHL contact status back to Supabase lead status if the tag matches a pipeline stage.
- **D-28:** GHL allows only one webhook URL per app — the FastAPI endpoint routes by `event_type` field in the payload.

### Email Notification
- **D-29:** When a new lead is created, send an email to the HVAC owner via Resend from the Next.js lead submit handler (inline, not async). Use the Resend Node.js SDK. Email includes: homeowner name, phone, service type, zip code, and a link to the dashboard. From address: `leads@tradeflow.io` (or `RESEND_FROM_EMAIL` env var).
- **D-30:** Email is best-effort — if Resend fails, log the error but still return success to the homeowner. The lead is already in Supabase and GHL; the owner will see it on their dashboard.

### Operational Prerequisites
- **D-31:** A2P 10DLC SMS registration is required before GHL SMS workflows will deliver to US phone numbers. This is a GHL/Twilio configuration step (not code) and takes 1-3 weeks for brand approval. SMS features can be coded and tested with the GHL test sandbox, but won't work in production until registration is approved.
- **D-32:** The seed client (Oak Park HVAC) must have a `ghl_sub_account_id` value in the database for integration testing. This can be set manually after creating the sub-account in GHL, or the GHL API wrapper can be used to create it programmatically as part of Phase 2 setup.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specification
- `CLAUDE (1).md` — Full project spec: database schema, API contracts (`POST /api/leads/submit`), landing page rules, GHL integration rules, code rules, env vars. Sections: "Landing Page Rules", "Key API Contracts", "GoHighLevel Integration Rules".

### Research
- `.planning/research/STACK.md` — @supabase/ssr patterns, react-hook-form + Zod, GHL API v2, Resend SDK, shadcn/ui compatibility
- `.planning/research/FEATURES.md` — Feature dependencies (Lead Capture API requires Landing Page + Supabase + GHL), SMS follow-up sequence details, landing page ISR pattern
- `.planning/research/PITFALLS.md` — Vercel Deployment Protection blocking webhooks (route to FastAPI), GHL sub-account idempotency, form double-submit, GHL webhook signature deprecation, A2P 10DLC requirement

### Phase 1 Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Carries forward: D-06 (@supabase/ssr), D-07 (no module-level clients), D-08 (ADMIN_EMAIL env check), D-09 (middleware auth guard)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/lib/supabase/client.ts` — Browser Supabase client (createBrowserClient)
- `apps/web/src/lib/supabase/server.ts` — Server Supabase client (createServerClient with cookies)
- `apps/web/src/lib/supabase/admin.ts` — Admin Supabase client (service role key)
- `apps/web/middleware.ts` — Auth middleware protecting /dashboard and /admin routes
- `apps/web/src/app/login/page.tsx` — Login page with email/password and magic link
- `api/services/supabase_client.py` — FastAPI Supabase service role client
- `api/models/schemas.py` — Pydantic v2 LeadSubmitRequest stub (needs expansion)
- `api/routers/health.py` — Health endpoint pattern to follow for new routers

### Established Patterns
- Per-request Supabase client initialization (never module-level)
- `await cookies()` for async cookie access in Next.js 15
- `supabase.auth.getUser()` for auth checks (not getSession)
- FastAPI async handlers with Pydantic v2 models

### Integration Points
- Landing page form → `/api/leads/submit` (Next.js Route Handler)
- Lead submit handler → Supabase (insert lead)
- Lead submit handler → GHL API (create contact, trigger workflow)
- Lead submit handler → Resend API (email notification)
- GHL webhook → FastAPI `/api/webhooks/ghl` (inbound SMS)
- GHL workflow → SMS delivery to homeowner (managed by GHL)

</code_context>

<specifics>
## Specific Ideas

- The lead submit endpoint does 4 things in sequence: (1) Zod validate, (2) Supabase insert, (3) GHL contact create + workflow trigger, (4) Resend email. Steps 3-4 should not block the success response — consider using `waitUntil` or returning success after step 2 and running 3-4 in the background if latency is a concern.
- Landing page `generateStaticParams` must handle the case where no clients exist yet (return empty array, no build error).
- The `slug` field should be computed and stored on the `clients` table to avoid inconsistent slug derivation. Add a migration: `ALTER TABLE clients ADD COLUMN slug text UNIQUE`.
- GHL Private Integration Tokens are scoped per sub-account. Store the token alongside `ghl_sub_account_id` on the client record, or use a single Agency-level OAuth token with sub-account context.
- The landing page needs the `client_id` passed to the form as a hidden field so the lead submit API knows which client the lead belongs to.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-lead-pipeline*
*Context gathered: 2026-03-25*
