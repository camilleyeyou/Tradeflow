# Phase 2: Lead Pipeline - Research

**Researched:** 2026-03-25
**Domain:** Next.js 15 static landing pages, lead capture API, GHL contact creation + workflow triggering, Resend email, FastAPI GHL webhook with Ed25519 signature verification
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Lead Submission Flow**
- D-13: Lead form submits to Next.js API Route at `/api/leads/submit` (same origin, no CORS). The handler validates with Zod, inserts into Supabase `leads` table, creates a GHL contact, triggers the GHL SMS workflow, and sends the owner email via Resend — all in one request.
- D-14: Lead form idempotency: disable submit button on first click (frontend), and on the backend check for an existing lead with the same `phone` + `client_id` created within the last 5 minutes. If a duplicate is detected, return success with the existing `lead_id`. Also check GHL for existing contact by phone before creating a new one.
- D-15: The lead submit handler returns `{ success: true, lead_id: string }` on success. Error shape: `{ error: string, code?: string }`. The form shows "We'll call you within 5 minutes" on success.

**Landing Pages**
- D-16: Landing pages use `generateStaticParams` to pre-render at build time. The route is `(landing)/[clientSlug]/[service]/page.tsx`. `clientSlug` is the slugified `business_name` from the `clients` table. Service types are a fixed list: `ac-repair`, `furnace-repair`, `installation`, `maintenance`.
- D-17: `generateStaticParams` fetches all active clients from Supabase at build time and returns the cartesian product of `[clientSlug] × [service]`. Each page receives the client's data via a server-side Supabase query using the anon key.
- D-18: Landing page structure: Hero section with headline matching the service + city, click-to-call button (`tel:` format), lead form above the fold. Below fold: trust signals (review stars, license badge, service area neighborhoods). No navigation menu. One CTA. Mobile-first.
- D-19: The lead form has exactly 4 fields: name (text), phone (tel), service type (dropdown pre-filled from URL), zip code (text). Form uses react-hook-form + Zod. No additional fields.
- D-20: URL structure: `/oak-park-hvac/ac-repair`. The `clientSlug` field will be added to the `clients` table (or derived at build time from `business_name`).

**GoHighLevel Integration**
- D-21: Phase 2 implements the GHL API client (`lib/ghl.ts` in Next.js, `services/ghl_service.py` in FastAPI). Sub-account provisioning UI is Phase 4. Phase 2 assumes the seed client's `ghl_sub_account_id` exists in the database.
- D-22: GHL contact creation uses the GHL API v2 at `https://services.leadconnectorhq.com`. Each contact is created in the client's sub-account using the sub-account's Private Integration Token. Rate limit: 100 requests / 10 seconds per resource.
- D-23: SMS sequences are managed by GHL workflows — not custom-built. The backend triggers a GHL workflow after lead creation (via workflow trigger API or by adding a contact tag). The workflow handles the timing: immediate SMS, +15 minutes, +24 hours. The workflow auto-stops when the lead replies.
- D-24: Each SMS touch is tracked in the Supabase `sms_sequences` table. When the workflow is triggered, write the initial record (touch_number=1, status=pending). GHL webhook events update the status to sent/delivered/failed.
- D-25: `ghl_contact_id` is stored on the lead record after successful contact creation. `ghl_sub_account_id` is stored on the client record.

**GHL Webhook (Inbound SMS)**
- D-26: GHL webhooks route to FastAPI on Railway at `/api/webhooks/ghl`. The FastAPI handler verifies signatures using both `X-GHL-Signature` (Ed25519, new) and `X-WH-Signature` (RSA, legacy) during the transition period (deadline: July 1, 2026).
- D-27: GHL `InboundMessage` events: look up the lead by `ghl_contact_id`, append the message to `leads.notes`, and mark the SMS sequence as stopped. `ContactTagAdded` events: sync GHL contact status back to Supabase lead status if the tag matches a pipeline stage.
- D-28: GHL allows only one webhook URL per app — the FastAPI endpoint routes by `event_type` field in the payload.

**Email Notification**
- D-29: When a new lead is created, send an email to the HVAC owner via Resend from the Next.js lead submit handler. Use the Resend Node.js SDK. Email includes: homeowner name, phone, service type, zip code, and a link to the dashboard. From address: `leads@tradeflow.io` (or `RESEND_FROM_EMAIL` env var).
- D-30: Email is best-effort — if Resend fails, log the error but still return success to the homeowner.

**Operational Prerequisites**
- D-31: A2P 10DLC SMS registration is required before GHL SMS workflows will deliver to US phone numbers. SMS features can be coded and tested with the GHL test sandbox, but won't work in production until registration is approved (1-3 weeks).
- D-32: The seed client (Oak Park HVAC) must have a `ghl_sub_account_id` value in the database for integration testing. Can be set manually or programmatically via the GHL API wrapper.

### Claude's Discretion

None specified. All major decisions are locked in the context above.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LAND-01 | Static landing page generated per client via `generateStaticParams` from clients table | `generateStaticParams` + Supabase anon key fetch at build time; cartesian product of clientSlug × service |
| LAND-02 | Landing page loads under 2 seconds on mobile (Lighthouse verified) | Static export from Vercel CDN gives near-instant TTFB; no server-side computation; minimal JS bundle required |
| LAND-03 | Lead capture form with 4 fields: name, phone, service type (dropdown), zip code | react-hook-form 7.x + Zod 3.x + @hookform/resolvers; service type pre-filled from URL segment |
| LAND-04 | Click-to-call link (`tel:` format) for one-tap mobile calling | Standard HTML anchor `<a href="tel:+1XXXXXXXXXX">` — no library needed |
| LAND-05 | Trust signals displayed: review stars, license badge, service area neighborhoods | Static HTML/Tailwind components; data from Supabase build-time query (`service_area_zips`) |
| LAND-06 | No navigation menu — single page, single CTA above the fold | Layout structure decision — no middleware, no nav component in landing route group |
| LAND-07 | URL structure follows `/[clientSlug]/[service]` pattern | Nested dynamic route segments in `(landing)/[clientSlug]/[service]/page.tsx` |
| LEAD-01 | Form submission POSTs to `/api/leads/submit`, validates with Zod, inserts into Supabase `leads` table | Next.js Route Handler with Zod validation; Supabase insert using anon key (RLS allows inserts without auth for this table — requires specific insert policy) |
| LEAD-02 | New lead creates a contact in the client's GoHighLevel sub-account via GHL API | GHL API v2 `POST /contacts/` with `locationId`, auth via Private Integration Token |
| LEAD-03 | HVAC owner receives email notification via Resend within 60 seconds of new lead | Resend Node.js SDK v6.9.x; inline in Route Handler (best-effort, non-blocking via `after()`) |
| LEAD-04 | Form shows success state: "We'll call you within 5 minutes" after submission | Client-side state management in react-hook-form `onSubmit` handler |
| LEAD-05 | Multi-step SMS follow-up sequence triggered via GHL workflow (immediate + 15min + 24hr) | GHL `POST /contacts/:contactId/workflow/:workflowId` — workflow must be pre-configured in GHL UI; or add tag to trigger Contact Tag workflow |
| LEAD-06 | SMS sequence stops when lead replies | GHL native workflow behavior; FastAPI webhook handler marks `sms_sequences` status = stopped on `InboundMessage` event |
| GHL-01 | Each HVAC client gets their own GHL sub-account (never shared) | Architecture decision — `ghl_sub_account_id` on `clients` table; seed client set manually for Phase 2 |
| GHL-02 | Sub-account created programmatically via GHL Agency API during client onboarding | Phase 4 scope — Phase 2 requires `ghl_sub_account_id` to already exist in DB |
| GHL-03 | `ghl_sub_account_id` and `ghl_contact_id` stored on client and lead records | Schema already has these columns; Phase 2 writes `ghl_contact_id` to leads on creation |
| GHL-04 | Inbound GHL webhook logs SMS replies from homeowners and updates lead notes | FastAPI `/api/webhooks/ghl` handles `InboundMessage` event type; updates `leads.notes` and `sms_sequences.status` |
| GHL-05 | GHL webhook verifies `X-GHL-Signature` (Ed25519, not deprecated `X-WH-Signature`) | Python `cryptography` library (already in requirements.txt v46.0.5); Ed25519 public key from GHL docs |
</phase_requirements>

---

## Summary

Phase 2 builds the full inbound lead pipeline: static HVAC landing pages, a lead capture form that writes to Supabase and triggers GHL + Resend, and a FastAPI webhook endpoint for inbound GHL SMS reply handling. The codebase from Phase 1 provides the complete scaffolding — Supabase schema (including `leads` and `sms_sequences` tables), FastAPI lifespan pattern, Next.js App Router with route groups, and all environment variables. Phase 2 fills in the implementation stubs.

The most technically nuanced parts are (1) GHL workflow triggering — there are two viable mechanisms (direct workflow enrollment via `POST /contacts/:contactId/workflow/:workflowId`, or adding a tag that triggers a Contact Tag workflow), and (2) GHL webhook signature verification using Ed25519, which requires reading the raw request body before JSON parsing in FastAPI.

The landing pages are straightforward static generation. The lead submit handler does 4 sequential steps; steps 3-4 (GHL + Resend) should use Next.js `after()` to not block the user response. All duplicate-prevention and idempotency logic lives at the Route Handler layer.

**Primary recommendation:** Wire the lead submission flow sequentially (Zod → Supabase → GHL → Resend), use `after()` for GHL and Resend calls to prevent blocking the 200 response, and trigger the GHL SMS workflow by enrolling the contact directly in a pre-configured workflow via the `POST /contacts/:contactId/workflow/:workflowId` endpoint.

---

## Standard Stack

### Core (Phase 2 additions to existing scaffold)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-hook-form` | 7.x | Lead capture form state management | Pairs with Zod; handles disable-on-submit pattern; already in CLAUDE.md |
| `zod` | 3.x | Schema validation for lead form + API handler | Type-safe, runs on client and server; already in CLAUDE.md |
| `@hookform/resolvers` | 3.x | Bridge between react-hook-form and Zod | Required to plug Zod schema into RHF `resolver` prop |
| `resend` | 6.9.x | Transactional email via Resend API | Already in package.json; Node SDK for Next.js |
| `cryptography` (Python) | 46.0.5 | Ed25519 signature verification for GHL webhooks | Already in requirements.txt; use `hazmat.primitives.asymmetric.ed25519` |

### Existing (already installed — no new installs required)

| Library | Version | Confirmed In |
|---------|---------|-------------|
| `next` | 15.5.14 | apps/web/package.json |
| `@supabase/supabase-js` | 2.100.x | apps/web/package.json |
| `@supabase/ssr` | 0.9.x | apps/web/package.json |
| `fastapi` | 0.135.2 | api/requirements.txt |
| `httpx` | 0.28.1 | api/requirements.txt |
| `supabase` (Python) | 2.28.3 | api/requirements.txt |
| `cryptography` | 46.0.5 | api/requirements.txt |

### New installs required

```bash
# Next.js app — in apps/web/
npm install react-hook-form zod @hookform/resolvers resend
```

No new Python dependencies needed — `cryptography` already installed.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `after()` for GHL+Resend | Await sequentially before response | Sequential adds ~500-1500ms to user response; `after()` is stable in Next.js 15.1+ |
| Direct workflow enrollment | Add contact tag to trigger GHL workflow | Tags are easier to configure in GHL UI but are less explicit about which workflow runs; direct enrollment via workflowId is more predictable |
| `react-hook-form` | Uncontrolled form + `FormData` | RHF provides disable-on-submit state and Zod integration out of the box |

---

## Architecture Patterns

### Recommended Project Structure (new files for Phase 2)

```
apps/web/src/
├── app/
│   ├── (landing)/
│   │   └── [clientSlug]/
│   │       └── [service]/
│   │           └── page.tsx          # Static landing page (NEW: add generateStaticParams + full UI)
│   └── api/
│       └── leads/
│           └── submit/
│               └── route.ts           # Lead capture Route Handler (NEW)
├── lib/
│   ├── ghl.ts                          # GHL API client (NEW: create contact, add to workflow, lookup by phone)
│   └── validations/
│       └── lead.ts                     # Zod schema for lead form (NEW)
api/
├── routers/
│   └── webhooks.py                    # GHL webhook router (NEW)
├── services/
│   └── ghl_service.py                 # GHL service: Ed25519 verification helper (NEW)
supabase/
└── migrations/
    └── 002_add_slug_to_clients.sql    # ADD COLUMN slug text UNIQUE (NEW)
```

### Pattern 1: Static Landing Page with generateStaticParams

**What:** Pre-render one page per `clientSlug × service` combination at build time.
**When to use:** All landing pages — they contain public data, no auth, no dynamic queries at request time.

```typescript
// apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-static-params

import { createClient } from '@supabase/supabase-js'

const SERVICE_TYPES = ['ac-repair', 'furnace-repair', 'installation', 'maintenance'] as const

export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: clients } = await supabase
    .from('clients')
    .select('slug')
    .eq('is_active', true)

  if (!clients || clients.length === 0) return []  // no build error when empty

  // Cartesian product: each client × each service type
  return clients.flatMap((client) =>
    SERVICE_TYPES.map((service) => ({
      clientSlug: client.slug,
      service,
    }))
  )
}

interface Props {
  params: Promise<{ clientSlug: string; service: string }>
}

export default async function LandingPage({ params }: Props) {
  const { clientSlug, service } = await params  // params is async in Next.js 15

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: client } = await supabase
    .from('clients')
    .select('id, business_name, phone, city, service_area_zips')
    .eq('slug', clientSlug)
    .eq('is_active', true)
    .single()

  if (!client) return notFound()
  // render page...
}
```

**Key detail:** Use a plain `createClient` (not `createServerClient`) here — no auth cookies needed for public pages. No `cookies()` call means no dynamic rendering forced.

### Pattern 2: Lead Submit Route Handler with `after()`

**What:** Validate → insert Supabase → return 200 → (background) GHL contact + workflow + Resend email.
**When to use:** Any Route Handler where the user response should not wait for external API calls.

```typescript
// apps/web/src/app/api/leads/submit/route.ts
// Source: https://nextjs.org/docs/app/api-reference/functions/after

import { after } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { leadSchema } from '@/lib/validations/lead'
import { createGHLContact, addContactToWorkflow, lookupContactByPhone } from '@/lib/ghl'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const body = await request.json()
  const result = leadSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: 'Validation failed' }, { status: 400 })
  }

  const { client_id, homeowner_name, phone, zip_code, service_type } = result.data

  // Use admin client for inserts (bypasses RLS — leads come from unauthenticated homeowners)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Idempotency: check for existing lead in last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('client_id', client_id)
    .eq('phone', phone)
    .gte('created_at', fiveMinutesAgo)
    .maybeSingle()

  if (existing) {
    return Response.json({ success: true, lead_id: existing.id })
  }

  // Insert lead
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({ client_id, homeowner_name, phone, zip_code, service_type, source: 'landing_page' })
    .select('id')
    .single()

  if (error || !lead) {
    return Response.json({ error: 'Failed to create lead' }, { status: 500 })
  }

  // Return immediately — GHL + email run after response is sent
  after(async () => {
    try {
      // Fetch client for GHL details
      const { data: clientRow } = await supabase
        .from('clients')
        .select('ghl_sub_account_id, email, business_name')
        .eq('id', client_id)
        .single()

      if (clientRow?.ghl_sub_account_id) {
        const token = process.env.GHL_PRIVATE_TOKEN!  // or per-client token lookup
        // Check GHL for existing contact first (idempotency)
        let contactId = await lookupContactByPhone(phone, clientRow.ghl_sub_account_id, token)
        if (!contactId) {
          contactId = await createGHLContact({
            locationId: clientRow.ghl_sub_account_id,
            firstName: homeowner_name.split(' ')[0],
            lastName: homeowner_name.split(' ').slice(1).join(' '),
            phone,
            token,
          })
        }
        if (contactId) {
          // Store ghl_contact_id on lead
          await supabase.from('leads').update({ ghl_contact_id: contactId }).eq('id', lead.id)
          // Trigger SMS workflow
          await addContactToWorkflow(contactId, process.env.GHL_SMS_WORKFLOW_ID!, token)
          // Write initial sms_sequences record
          await supabase.from('sms_sequences').insert({
            lead_id: lead.id,
            touch_number: 1,
            message_body: 'Initial workflow triggered',
            status: 'pending',
            scheduled_at: new Date().toISOString(),
          })
        }
      }
    } catch (err) {
      console.error('[lead-submit] GHL error:', err)
    }

    try {
      const { data: clientRow } = await supabase
        .from('clients')
        .select('email, business_name, city')
        .eq('id', client_id)
        .single()

      if (clientRow) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'leads@tradeflow.io',
          to: clientRow.email,
          subject: `New Lead: ${homeowner_name} — ${service_type}`,
          html: `<p>New lead for ${clientRow.business_name}:</p>
                 <ul>
                   <li>Name: ${homeowner_name}</li>
                   <li>Phone: ${phone}</li>
                   <li>Service: ${service_type}</li>
                   <li>Zip: ${zip_code}</li>
                 </ul>
                 <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View in dashboard</a></p>`,
        })
      }
    } catch (err) {
      console.error('[lead-submit] Resend error:', err)
    }
  })

  return Response.json({ success: true, lead_id: lead.id })
}
```

### Pattern 3: GHL API Client (`lib/ghl.ts`)

**What:** Thin wrapper for GHL API v2 calls.
**Endpoint details (verified from GHL docs):**

```
Base URL: https://services.leadconnectorhq.com
Required headers on every request:
  Authorization: Bearer <PRIVATE_INTEGRATION_TOKEN>
  Content-Type: application/json
  Version: 2021-07-28

Create contact:  POST /contacts/
  Body: { firstName, lastName, phone, locationId, [email] }
  Response: { contact: { id, ... } }

Lookup contact by phone:  GET /contacts/?locationId=<id>&phone=<phone>
  Returns: { contacts: [...] }

Add to workflow:  POST /contacts/:contactId/workflow/:workflowId
  Body: { eventStartTime: <ISO datetime string> }
  Response: 200 OK

Add tag:  POST /contacts/:contactId/tags
  Body: { tags: ["tag-name"] }
  Response: 200 OK
```

### Pattern 4: FastAPI GHL Webhook Handler with Ed25519 Verification

**What:** Receives GHL webhooks, verifies Ed25519 signature, routes by `event_type`.
**Critical:** Must read raw bytes before JSON parsing for signature verification.

```python
# api/routers/webhooks.py
from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks
from typing import Optional
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from cryptography.exceptions import InvalidSignature
import base64
import json

router = APIRouter()

# Source: https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html
GHL_ED25519_PUBLIC_KEY_PEM = b"""-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----"""

def verify_ghl_signature(body: bytes, signature_header: Optional[str]) -> bool:
    """Verify X-GHL-Signature (Ed25519). Returns True if valid."""
    if not signature_header:
        return False
    try:
        sig_bytes = base64.b64decode(signature_header)
        pub_key: Ed25519PublicKey = load_pem_public_key(GHL_ED25519_PUBLIC_KEY_PEM)
        pub_key.verify(sig_bytes, body)  # raises InvalidSignature on failure
        return True
    except (InvalidSignature, Exception):
        return False

@router.post("/webhooks/ghl")
async def ghl_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_ghl_signature: Optional[str] = Header(default=None, alias="X-GHL-Signature"),
    x_wh_signature: Optional[str] = Header(default=None, alias="X-WH-Signature"),
):
    body = await request.body()  # read raw bytes BEFORE json parsing

    # Prefer new Ed25519 signature; fall back to legacy RSA during transition
    if x_ghl_signature:
        if not verify_ghl_signature(body, x_ghl_signature):
            raise HTTPException(status_code=401, detail="Invalid GHL signature")
    elif x_wh_signature:
        # Legacy RSA verification — accept during transition, log deprecation warning
        # TODO: remove legacy fallback after July 1, 2026
        pass  # implement RSA verification if GHL sends legacy events
    else:
        raise HTTPException(status_code=401, detail="Missing GHL signature header")

    payload = json.loads(body)
    event_type = payload.get("type") or payload.get("event_type")

    background_tasks.add_task(process_ghl_event, event_type, payload)
    return {"status": "received"}


async def process_ghl_event(event_type: str, payload: dict):
    from api.services.supabase_client import get_supabase
    db = get_supabase()

    if event_type == "InboundMessage":
        contact_id = payload.get("contactId")
        message_body = payload.get("body", "")
        if contact_id:
            # Look up lead by ghl_contact_id
            result = db.table("leads").select("id").eq("ghl_contact_id", contact_id).execute()
            if result.data:
                lead_id = result.data[0]["id"]
                # Append to notes
                existing = db.table("leads").select("notes").eq("id", lead_id).single().execute()
                existing_notes = existing.data.get("notes") or ""
                updated = f"{existing_notes}\n[SMS Reply] {message_body}".strip()
                db.table("leads").update({"notes": updated}).eq("id", lead_id).execute()
                # Mark SMS sequence stopped
                db.table("sms_sequences").update({"status": "stopped"}).eq("lead_id", lead_id).eq("status", "pending").execute()

    elif event_type == "ContactTagAdded":
        # Sync tag → lead status if tag matches pipeline stage
        contact_id = payload.get("contactId")
        tags = payload.get("tags", [])
        TAG_TO_STATUS = {"contacted": "contacted", "booked": "booked", "completed": "completed"}
        for tag in tags:
            if tag in TAG_TO_STATUS:
                result = db.table("leads").select("id").eq("ghl_contact_id", contact_id).execute()
                if result.data:
                    db.table("leads").update({"status": TAG_TO_STATUS[tag]}).eq("id", result.data[0]["id"]).execute()
```

### Pattern 5: Zod Lead Form Schema

```typescript
// apps/web/src/lib/validations/lead.ts
import { z } from 'zod'

export const SERVICE_TYPES = ['ac-repair', 'furnace-repair', 'installation', 'maintenance'] as const

export const leadSchema = z.object({
  client_id: z.string().uuid(),
  homeowner_name: z.string().min(2, 'Please enter your name'),
  phone: z.string().regex(/^\+?1?\d{10}$/, 'Enter a valid 10-digit US phone number'),
  service_type: z.enum(SERVICE_TYPES),
  zip_code: z.string().regex(/^\d{5}$/, 'Enter a valid 5-digit zip code'),
})

export type LeadFormValues = z.infer<typeof leadSchema>
```

### Pattern 6: Database Migration for `slug` Column

```sql
-- supabase/migrations/002_add_slug_to_clients.sql
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Backfill: derive slug from business_name (lowercase, hyphens, strip special chars)
UPDATE public.clients
SET slug = regexp_replace(lower(business_name), '[^a-z0-9]+', '-', 'g')
WHERE slug IS NULL;

-- Make slug required for new rows
ALTER TABLE public.clients ALTER COLUMN slug SET NOT NULL;
```

### Pattern 7: Supabase RLS Policy for Unauthenticated Lead Inserts

The `leads` table currently has an RLS policy that uses `auth.uid()`. Lead form submissions come from unauthenticated homeowners — we need an explicit insert policy using the service role key in the Route Handler (which bypasses RLS), OR a dedicated insert policy that allows inserts from the `anon` role.

**Recommended approach:** Use the Supabase service role key in the Route Handler admin client (already established in `createAdminClient()` pattern) — this bypasses RLS and avoids opening up the `anon` role for inserts.

```
apps/web/src/app/api/leads/submit/route.ts uses:
  createClient(url, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

This is the established pattern from apps/web/src/lib/supabase/admin.ts.
NEVER call this client from any client-side code.
```

### Anti-Patterns to Avoid

- **Awaiting GHL + Resend before returning 200:** These external calls take 200–800ms each. Homeowners on slow mobile connections will time out. Use `after()` for steps 3-4.
- **Using `createServerClient` on the landing page:** Landing pages are public and static — `createServerClient` forces a cookie read, making the route dynamic and preventing static generation. Use plain `createClient` at build time.
- **Calling `cookies()` inside `after()` callback in Route Handlers:** This is safe in Route Handlers (verified from Next.js docs), but do not do it from Server Components.
- **Reading request body twice in FastAPI:** `await request.body()` must be called once before JSON parsing. Calling `request.json()` consumes the body; signature verification needs the raw bytes first.
- **Storing GHL Private Integration Token in NEXT_PUBLIC_ env vars:** Any `NEXT_PUBLIC_` variable is bundled into the browser. GHL tokens must never be `NEXT_PUBLIC_`.
- **Using the wrong `params` type in Next.js 15:** Route params (`params`, `searchParams`) are `Promise<...>` in Next.js 15. Must `await params` before destructuring.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SMS follow-up sequences with timing + stop-on-reply | Custom cron + Supabase jobs | GHL workflows | Handles retries, delivery, unsubscribe, stop-on-reply natively; A2P compliance built in |
| Email delivery with retries | Custom SMTP handler | Resend SDK | Handles deliverability, SPF/DKIM, retry logic, bounce handling |
| Form validation with type inference | Custom validation functions | Zod + @hookform/resolvers | Type-safe, runtime-checked, same schema on client and server |
| Ed25519 signature verification | Custom base64 decode + byte comparison | `cryptography` library (already installed) | Constant-time comparison, correct PEM loading, well-audited |
| Phone number formatting/validation | Custom regex | Zod `.regex()` with US phone pattern | Sufficient for US-only HVAC market; no extra library needed |
| GHL contact deduplication | Build a custom lookup system | GHL `GET /contacts/?phone=...` | GHL stores contacts — query before creating; don't maintain a separate mirror |

**Key insight:** GHL is the SMS execution engine. Never replicate its workflow scheduling, delivery management, or reply detection in custom code — the only custom code needed is the API calls to tell GHL what to do.

---

## Common Pitfalls

### Pitfall 1: `generateStaticParams` Uses Wrong Supabase Client

**What goes wrong:** Using `createServerClient` (from `@supabase/ssr`) in `generateStaticParams` calls `cookies()` which is not available at build time, causing the build to fail or fall back to dynamic rendering.

**Why it happens:** Developers copy the server client pattern from dashboard pages without realizing landing pages are public and static.

**How to avoid:** Use plain `createClient` from `@supabase/supabase-js` with the anon key in `generateStaticParams`. No cookies, no auth.

**Warning signs:** Build completes but pages show `dynamic` in the Next.js build output instead of `○ (Static)`.

### Pitfall 2: Lead Insert Fails Due to RLS with Anon Key

**What goes wrong:** The `leads` table has RLS enabled. The Route Handler uses the anon key, which has no `auth.uid()` context for an unauthenticated homeowner. The insert returns a 0-row response with no error (Supabase silently blocks it).

**Why it happens:** Forgetting that unauthenticated requests need the service role key OR an explicit `anon` insert policy.

**How to avoid:** Use the service role key in the lead submit Route Handler. The `createAdminClient()` pattern is already established in the codebase — use it.

**Warning signs:** `insert().select()` returns `data: []` with no error; lead never appears in Supabase dashboard.

### Pitfall 3: GHL Workflow Not Triggering Because Workflow ID Is Wrong or Not Published

**What goes wrong:** The `POST /contacts/:contactId/workflow/:workflowId` call returns 200 but the contact never enters the workflow. GHL silently ignores workflow enrollment for workflows that are in draft state.

**Why it happens:** The GHL workflow was created but not published, or the workflow ID in the env var is a draft ID.

**How to avoid:** Publish the GHL workflow in the GHL UI before testing. Verify the `GHL_SMS_WORKFLOW_ID` env var matches the published workflow's ID (found in the workflow URL). Test by checking GHL contact history after enrollment.

**Warning signs:** Workflow trigger API returns 200 but no SMS is sent and contact history in GHL shows no workflow activity.

### Pitfall 4: FastAPI Request Body Consumed Before Signature Verification

**What goes wrong:** Calling `await request.json()` in FastAPI consumes the request body stream. When the signature verification code then tries to read `await request.body()`, it gets empty bytes — the signature check always fails.

**Why it happens:** Developers add body parsing before signature checking as a natural reading order.

**How to avoid:** Always call `body = await request.body()` first. Then parse `json.loads(body)` afterwards. Never use FastAPI's automatic body injection (`async def webhook(payload: MyModel)`) when you need raw bytes for signature verification — use `Request` directly.

**Warning signs:** All GHL webhooks fail signature verification even when tested with the correct headers.

### Pitfall 5: `slug` Column Missing From `clients` Table Breaks Build

**What goes wrong:** `generateStaticParams` queries `clients.slug` but the column doesn't exist in Phase 1's schema. The build fails at the Supabase query.

**Why it happens:** The slug column was discussed in context but is not in the initial schema migration.

**How to avoid:** Create migration `002_add_slug_to_clients.sql` as Wave 0 of Phase 2 before any landing page code runs. Include backfill SQL that derives slug from `business_name`.

**Warning signs:** `supabase.from('clients').select('slug')` returns an error about unknown column.

### Pitfall 6: Double-Submit Creates Two GHL Contacts

**What goes wrong:** Homeowner taps submit twice on slow mobile. Frontend button was not disabled. Two leads are created, two GHL contacts are created, two SMS sequences fire. HVAC owner gets two emails.

**Why it happens:** Missing both frontend (button disabled) and backend (phone+client_id dedup check) guards.

**How to avoid:** (1) Disable submit button on first click via react-hook-form `isSubmitting` state. (2) Backend 5-minute phone+client_id dedup check. (3) `lookupContactByPhone` before `createGHLContact`. All three layers needed.

**Warning signs:** Same homeowner phone appears twice in GHL for the same sub-account.

### Pitfall 7: `after()` Callback Silently Fails in Development

**What goes wrong:** `after()` runs after the response is sent. In Next.js dev mode, errors in `after()` callbacks appear in the server terminal but not in the browser — developers think the flow worked when it silently failed.

**Why it happens:** The disconnect between response success (user sees "We'll call you within 5 minutes") and background task failure (GHL call throws but nobody sees it).

**How to avoid:** Wrap `after()` callbacks in try/catch with explicit `console.error`. In testing, verify GHL contact creation by checking the GHL sub-account directly.

**Warning signs:** Lead appears in Supabase but not in GHL; owner receives no email. These are the observable outcomes of silent `after()` failures.

---

## Code Examples

### GHL Create Contact Request

```typescript
// Source: https://marketplace.gohighlevel.com/docs/ghl/contacts/create-contact/index.html
// POST https://services.leadconnectorhq.com/contacts/
// Headers: Authorization: Bearer <token>, Content-Type: application/json, Version: 2021-07-28

async function createGHLContact(params: {
  locationId: string
  firstName: string
  lastName: string
  phone: string
  token: string
}): Promise<string | null> {
  const res = await fetch('https://services.leadconnectorhq.com/contacts/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.token}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    },
    body: JSON.stringify({
      locationId: params.locationId,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
    }),
  })
  if (!res.ok) {
    console.error('[ghl] createContact failed', res.status, await res.text())
    return null
  }
  const data = await res.json()
  return data.contact?.id ?? null
}
```

### GHL Add Contact to Workflow

```typescript
// Source: https://marketplace.gohighlevel.com/docs/ghl/contacts/add-contact-to-workflow/index.html
// POST https://services.leadconnectorhq.com/contacts/:contactId/workflow/:workflowId

async function addContactToWorkflow(
  contactId: string,
  workflowId: string,
  token: string
): Promise<void> {
  const res = await fetch(
    `https://services.leadconnectorhq.com/contacts/${contactId}/workflow/${workflowId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({ eventStartTime: new Date().toISOString() }),
    }
  )
  if (!res.ok) {
    console.error('[ghl] addToWorkflow failed', res.status, await res.text())
  }
}
```

### GHL Lookup Contact by Phone

```typescript
// GET https://services.leadconnectorhq.com/contacts/?locationId=<id>&query=<phone>

async function lookupContactByPhone(
  phone: string,
  locationId: string,
  token: string
): Promise<string | null> {
  const url = new URL('https://services.leadconnectorhq.com/contacts/')
  url.searchParams.set('locationId', locationId)
  url.searchParams.set('query', phone)

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Version': '2021-07-28',
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.contacts?.[0]?.id ?? null
}
```

### Ed25519 Signature Verification in Python

```python
# Source: https://cryptography.io/en/latest/hazmat/primitives/asymmetric/ed25519/
# Using cryptography==46.0.5 (already in requirements.txt)

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from cryptography.exceptions import InvalidSignature
import base64

GHL_PUBLIC_KEY_PEM = b"""-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----"""

def verify_ghl_ed25519(raw_body: bytes, signature_b64: str) -> bool:
    try:
        sig_bytes = base64.b64decode(signature_b64)
        pub_key: Ed25519PublicKey = load_pem_public_key(GHL_PUBLIC_KEY_PEM)
        pub_key.verify(sig_bytes, raw_body)  # raises InvalidSignature on failure
        return True
    except (InvalidSignature, Exception):
        return False
```

### Next.js 15 `after()` in Route Handler

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/after (stable since v15.1.0)
import { after } from 'next/server'

// In a Route Handler (POST handler):
after(async () => {
  // runs after response is sent; errors here don't affect response
  await doExternalApiCall()
})
return Response.json({ success: true })
```

### react-hook-form with Zod + disable on submit

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leadSchema, LeadFormValues } from '@/lib/validations/lead'

export function LeadForm({ clientId, service }: { clientId: string, service: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { client_id: clientId, service_type: service as any },
  })

  const [submitted, setSubmitted] = useState(false)

  const onSubmit = async (data: LeadFormValues) => {
    const res = await fetch('/api/leads/submit', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      setSubmitted(true)
    }
  }

  if (submitted) return <p>We'll call you within 5 minutes.</p>

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('homeowner_name')} placeholder="Your name" />
      {errors.homeowner_name && <span>{errors.homeowner_name.message}</span>}
      {/* ... other fields ... */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Get a Free Quote'}
      </button>
    </form>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `unstable_after()` | `after()` (stable) | Next.js 15.1.0 | Use stable import; no more `unstable_` prefix |
| `waitUntil` from `@vercel/functions` | `after()` from `next/server` | Next.js 15.1 | `after()` is the idiomatic way in Next.js 15; `waitUntil` still works but is lower-level |
| `X-WH-Signature` (RSA) | `X-GHL-Signature` (Ed25519) | GHL 2025, deprecated July 2026 | Support both during transition; prefer new header |
| `getStaticProps` + `getStaticPaths` | `generateStaticParams` | Next.js 13 App Router | App Router API; completely replaces Pages Router pattern |
| Synchronous `cookies()` / `headers()` | `await cookies()`, `await headers()` | Next.js 15 | Async-only in Next.js 15; synchronous access removed in Next.js 16 |
| `auth-helpers-nextjs` | `@supabase/ssr` | Supabase 2024 | Deprecated; use `createServerClient` from `@supabase/ssr` |

**Deprecated/outdated:**
- `getStaticProps` / `getStaticPaths`: Pages Router only — never use in App Router
- `X-WH-Signature` RSA verification: Will stop working July 1, 2026 — implement `X-GHL-Signature` now
- `unstable_after`: Renamed to `after` in Next.js 15.1 — use stable import

---

## Open Questions

1. **GHL workflow ID storage — per-client or global?**
   - What we know: D-23 says SMS sequences are managed by GHL workflows. The workflow is triggered via `POST /contacts/:contactId/workflow/:workflowId`.
   - What's unclear: Should `GHL_SMS_WORKFLOW_ID` be a single env var (same workflow for all clients) or stored per-client in the `clients` table? If each sub-account has its own copy of the workflow (GHL duplicates workflow per sub-account), then it must be per-client.
   - Recommendation: GHL workflows exist per sub-account (not globally). Store `ghl_sms_workflow_id` on the `clients` table alongside `ghl_sub_account_id`. This requires adding the column to the schema migration and setting it manually for the seed client. If a single agency-wide workflow ID works across sub-accounts, fall back to `GHL_SMS_WORKFLOW_ID` env var — verify at implementation time.

2. **GHL Private Integration Token — per-client or single agency token?**
   - What we know: D-22 says tokens are "scoped per sub-account." CLAUDE.md confirms Private Integration Token scoped to Sub-Account for per-client operations.
   - What's unclear: Whether the seed client's token can be a single env var in Phase 2 (since only one client exists), or whether the `clients` table needs a `ghl_token` column.
   - Recommendation: For Phase 2 with one seed client, use `GHL_PRIVATE_TOKEN` env var. Add `ghl_private_token` encrypted column to `clients` table as part of the Phase 2 schema migration — even if only one client is seeded, having the column prevents a breaking migration in Phase 4.

3. **Supabase insert policy needed for leads table?**
   - What we know: The `leads` table has RLS enabled with an owner-based select/all policy. Homeowners submitting forms are unauthenticated.
   - What's unclear: Confirmed approach is service role key in Route Handler. However, if a future edge case requires inserting from a different context, an explicit insert policy for `anon` might be preferable.
   - Recommendation: Continue with service role key in the Route Handler admin client (already established pattern). Document clearly in code comments. No additional RLS policy needed for Phase 2.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js app | ✓ | v24.13.0 | — |
| Python 3.x | FastAPI | ✓ | 3.13.11 | — |
| npm `resend` | Lead email notifications | ✗ | Not installed | Must install: `npm install resend` |
| npm `react-hook-form` | Lead form | ✗ | Not installed | Must install: `npm install react-hook-form zod @hookform/resolvers` |
| Python `cryptography` | GHL Ed25519 verification | ✓ | 46.0.5 (in requirements.txt) | — |
| GHL sub-account + workflow | Integration testing | ✗ (config) | — | GHL test sandbox; SMS won't deliver until A2P 10DLC approved |
| A2P 10DLC registration | SMS delivery in production | ✗ (1-3 weeks) | — | Test with GHL sandbox; code is complete but SMS won't deliver until approved |

**Missing dependencies with no fallback:**
- `resend`, `react-hook-form`, `zod`, `@hookform/resolvers` npm packages — must be installed before Wave 1 starts

**Missing dependencies with fallback:**
- A2P 10DLC: SMS sequences can be coded and tested in GHL sandbox; production SMS delivery blocked until registration approved (D-31)
- GHL `ghl_sub_account_id` and `ghl_sms_workflow_id` for seed client: Must be set manually in DB before integration testing (D-32)

---

## Project Constraints (from CLAUDE.md)

All directives below are binding. Planner must verify compliance before finalizing tasks.

| Constraint | Directive |
|------------|-----------|
| Tech stack | Next.js 15 App Router, FastAPI, Supabase, GHL API v2, Resend — no substitutions |
| Multi-tenancy | RLS on all tables; service role key only in FastAPI or Next.js Route Handlers, never browser |
| Landing page performance | Under 2 seconds on mobile; statically generated at build time via `generateStaticParams` |
| Security | Webhook signature verification required (GHL Ed25519 + RSA fallback); no secrets in browser; truncated PII in logs |
| Phase discipline | Phase 1 MVP features only — no Phase 2/3 features |
| Supabase client | Never module-level initialization; per-request only (except FastAPI Supabase singleton initialized in lifespan) |
| `await cookies()` | Must be awaited (async) in Next.js 15 |
| `supabase.auth.getUser()` | Use instead of `getSession()` for auth checks |
| `NEXT_PUBLIC_` prefix | Never for service role key, GHL tokens, Resend key, or any server secret |
| GHL API | v2 only (`services.leadconnectorhq.com`); Private Integration Token per sub-account |
| `requests` library | Forbidden in FastAPI async routes — use `httpx.AsyncClient` |
| Pydantic | v2 syntax only — `model_config = ConfigDict(...)` not `class Config` |
| GHL webhook headers | Verify both `X-GHL-Signature` (Ed25519) and `X-WH-Signature` (RSA legacy) until July 1, 2026 |
| Webhooks routing | All external webhooks (GHL, Stripe, CallRail) route to FastAPI on Railway — NOT to Next.js |
| `force-static` | Do NOT use on auth-gated pages; use `force-dynamic` for dashboard/admin routes |
| Landing pages | No auth middleware; no navigation menu; one CTA; single service per URL |

---

## Sources

### Primary (HIGH confidence)
- [Next.js `after()` API Reference](https://nextjs.org/docs/app/api-reference/functions/after) — confirmed stable in 15.1.0, Route Handler usage pattern verified
- [Next.js `generateStaticParams` API Reference](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) — cartesian product pattern, empty array fallback confirmed
- [GHL Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html) — Ed25519 public key, deprecation timeline, dual-header verification strategy
- [GHL Create Contact API](https://marketplace.gohighlevel.com/docs/ghl/contacts/create-contact/index.html) — endpoint, headers, base URL confirmed
- [GHL Add Contact to Workflow API](https://marketplace.gohighlevel.com/docs/ghl/contacts/add-contact-to-workflow/index.html) — `POST /contacts/:contactId/workflow/:workflowId` confirmed
- [Python cryptography Ed25519 docs](https://cryptography.io/en/latest/hazmat/primitives/asymmetric/ed25519/) — `load_pem_public_key` + `.verify()` pattern confirmed
- `apps/web/package.json` — confirmed Next.js 15.5.14, @supabase/ssr 0.9.x, no react-hook-form/resend installed yet
- `api/requirements.txt` — confirmed cryptography 46.0.5, fastapi 0.135.2, httpx 0.28.1 installed
- `supabase/migrations/001_initial_schema.sql` — confirmed schema columns, RLS policies, existing indexes

### Secondary (MEDIUM confidence)
- [GHL API Developer Portal](https://marketplace.gohighlevel.com/docs/) — base URL `https://services.leadconnectorhq.com`, auth via Bearer token + `Version: 2021-07-28` header
- [CLAUDE.md (project instructions)](./CLAUDE.md) — all technology decisions, security requirements, stack patterns

### Tertiary (LOW confidence — verify at implementation time)
- GHL workflow ID scope (per-sub-account vs. global): Inferred from GHL architecture; verify when testing with real sub-account
- GHL lookup contact by phone using `?query=` parameter: Common pattern observed in GHL ecosystem; verify response shape at implementation time

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against package.json and requirements.txt; library APIs verified from official docs
- Architecture: HIGH — patterns follow established Phase 1 codebase conventions; Next.js `after()` and `generateStaticParams` verified from official docs
- GHL API calls: MEDIUM — endpoints and headers confirmed from GHL docs; response shapes partially inferred; workflow ID scoping needs runtime verification
- Pitfalls: HIGH — drawn from existing PITFALLS.md research plus phase-specific analysis of code patterns

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (GHL API v2 is stable; Next.js 15.x is stable; review if Next.js 16 is released)
