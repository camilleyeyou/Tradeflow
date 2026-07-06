# Deploy + End-to-End Verification Checklist

**STATUS: Steps 3 and 5 are requires-human/deploy — they run on live infrastructure with the operator's credentials and are NOT auto-verifiable in-repo. Execution is tracked in plan 05-06.**

This checklist covers everything needed to take Tradeflow from "code complete" to "verified live" for the v1.1 pre-launch hardening milestone. Sections 1 and 2 can be prepared ahead of time. Sections 3 and 5 require the operator's live Supabase/Vercel/Railway/CallRail/GHL credentials and cannot be executed or verified from within this repo.

---

## 1. Environment Variables

### Supabase (project settings → API)

| Variable | Used by | Where to obtain |
|---|---|---|
| `SUPABASE_URL` | FastAPI (`api/.env`) | Supabase project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Next.js (`apps/web/.env.local`) | Same Project URL as above |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js (browser + server) | Supabase project → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | FastAPI and Next.js (admin routes/actions only) | Supabase project → Settings → API → `service_role` key. **Never** expose to the browser — see CLAUDE.md "What NOT to Use". |

### Vercel / Next.js app (`apps/web`)

| Variable | Purpose | Where to obtain |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | See above |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | See above |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin Server Actions / route handlers | See above |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Checkout/Elements (client-side) | Stripe Dashboard → Developers → API keys |
| `STRIPE_SECRET_KEY` | Stripe server-side calls | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhook signatures | Stripe Dashboard → Developers → Webhooks → signing secret (per endpoint) |
| `GHL_API_KEY` | Legacy/general GHL calls | GoHighLevel Agency settings |
| `GHL_LOCATION_ID` | GHL default location/sub-account | GoHighLevel sub-account settings |
| `CALLRAIL_ACCOUNT_ID` | CallRail account reference | CallRail Dashboard → Account |
| `CALLRAIL_API_KEY` | CallRail API calls from Next.js (if any) | CallRail Dashboard → Settings → API Keys |
| `RESEND_API_KEY` | Resend transactional email | Resend Dashboard → API Keys |
| `NEXT_PUBLIC_APP_URL` | Absolute URL used in email links | Production domain (e.g. `https://app.tradeflow.io`) |
| `ADMIN_EMAIL` | Legacy single-admin fallback | Set to the operator's email |
| `ADMIN_EMAILS` | **Phase 5 (SEC-01)** — comma-separated admin allowlist read by `isAdmin()` in `apps/web/src/lib/admin.ts` | Set to one or more operator emails, comma-separated. `ADMIN_EMAIL` is read only as a fallback if `ADMIN_EMAILS` is unset. |
| `GHL_PRIVATE_TOKEN` | GHL Private Integration Token (per sub-account, NOT `NEXT_PUBLIC_`) used for lead sync + text-back | GoHighLevel sub-account → Settings → Private Integrations |
| `GHL_SMS_WORKFLOW_ID` | Pre-configured GHL SMS workflow ID triggered for lead follow-up and missed-call text-back | GoHighLevel sub-account → Automation → Workflows → copy workflow ID |
| `RESEND_FROM_EMAIL` | From-address for lead notification emails | Verified sending domain in Resend |
| `GET_STARTED_FROM_EMAIL` | From-address for `/get-started` inquiry emails | Verified sending domain in Resend |
| `GHL_AGENCY_API_KEY` | Agency-level Private Integration Token used only for programmatic sub-account creation (admin onboarding) | GoHighLevel Agency → Settings → Private Integrations |

### Railway / FastAPI service (`api`)

| Variable | Purpose | Where to obtain |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL | See Supabase section |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role writes (leads, calls, billing) | See Supabase section |
| `GHL_API_KEY` | Legacy/general GHL calls | GoHighLevel Agency settings |
| `GHL_LOCATION_ID` | GHL default location/sub-account | GoHighLevel sub-account settings |
| `CALLRAIL_API_KEY` | CallRail API calls (recordings, transcripts) | CallRail Dashboard → Settings → API Keys |
| `RESEND_API_KEY` | Resend transactional email | Resend Dashboard → API Keys |
| `RESEND_FROM_EMAIL` | From-address for owner notification emails | Verified sending domain in Resend |
| `STRIPE_SECRET_KEY` | Stripe server-side calls | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe webhook signatures | Stripe Dashboard → Developers → Webhooks |
| `ADMIN_EMAIL` | Legacy single-admin fallback | Operator email |
| `CALLRAIL_WEBHOOK_SECRET` | **Phase 5 (MISS-01)** — signing secret for `POST /api/webhooks/callrail`; HMAC-SHA256 over the raw body, compared against both hex and base64 digests (fails closed if unset — see `api/services/callrail_service.py`) | CallRail Dashboard → the specific webhook's signing secret. **Confirm the exact digest encoding CallRail sends at deploy time** — the handler accepts either hex or base64 as a safety net, but the true encoding should be confirmed and this note removed once verified. |
| `GHL_PRIVATE_TOKEN` | **Phase 5 (MISS-03)** — shared GHL sub-account token used by the CallRail text-back trigger until per-client tokens land in Phase 6 (FIX-01) | GoHighLevel sub-account → Settings → Private Integrations |
| `GHL_SMS_WORKFLOW_ID` | **Phase 5 (MISS-03)** — GHL workflow triggered for missed-call text-back | GoHighLevel sub-account → Automation → Workflows |

---

## 2. Migration Apply Order

Apply in strict numeric order via `supabase db push` (recommended) or by pasting each file into the Supabase SQL editor in sequence. Do not skip or reorder.

| Order | Migration | Purpose |
|---|---|---|
| 1 | `001_initial_schema.sql` | Creates all 6 tables (`clients`, `leads`, `calls`, `sms_sequences`, `billing`, `client_users`), enables RLS + policies on 5 of them, adds base indexes. |
| 2 | `002_add_slug_to_clients.sql` | Adds `clients.slug` (unique, backfilled from `business_name`, then set `NOT NULL`) for landing-page routing `/[clientSlug]/[service]`. |
| 3 | `003_add_notifications_enabled.sql` | Adds `clients.notifications_enabled` (default `true`) and the missing UPDATE policy so owners can update their own client record from the settings page. |
| 4 | `004_enable_rls_client_users.sql` | **New in Phase 5 (SEC-02).** Enables RLS on `client_users` with a self-read-only SELECT policy. Corrects the v1.0 decision that left this identity-mapping table fully open to any authenticated user via PostgREST. No write policies — admin writes use the service-role key. |
| 5 | `005_add_leads_callrail_call_id_unique.sql` | **New in Phase 5 (MISS-02).** Partial unique index on `leads.callrail_call_id` (NULLs allowed) for race-safe dedup of missed-call leads. |

```bash
# From repo root, with the Supabase CLI authenticated and linked to the project:
supabase db push
```

---

## 3. Live Supabase Type Generation (DPLY-01 — requires human)

**This step requires the operator's Supabase credentials and must be run against the deployed project. It is NOT auto-verifiable in-repo.**

Plan 05-05 replaced `apps/web/src/lib/supabase/types.ts` with a hand-authored, schema-accurate `Database` type derived from migrations 001–005, verified against `npx tsc --noEmit` in-repo. That hand-authored file is a stand-in until the live type generation below is run and reconciled:

```bash
supabase gen types typescript --project-id <PROJECT_ID> --schema public > apps/web/src/lib/supabase/types.ts
```

After running:
1. Diff the generated output against the hand-authored version committed in 05-05 (`git diff apps/web/src/lib/supabase/types.ts`).
2. Confirm all 6 tables are present with matching column names/nullability (especially `callrail_call_id`, `slug`, `notifications_enabled`).
3. Run `cd apps/web && npx tsc --noEmit` — must exit 0.
4. Commit the reconciled file with a note referencing this checklist.

---

## 4. CallRail + GHL Webhook Configuration

### CallRail (missed-call text-back — MISS-01..04)

- Register the webhook in CallRail Dashboard → Settings → Integrations → Webhooks (or the equivalent "Custom Webhook" integration) pointing to:
  ```
  POST https://<railway-host>/api/webhooks/callrail
  ```
- Set the webhook's signing secret to match `CALLRAIL_WEBHOOK_SECRET` on the Railway service.
- **Confirm the exact CallRail v3 signature header name and digest encoding at deploy time.** The handler (`api/routers/callrail_webhooks.py`) currently reads a header aliased as `Signature` and verifies it in `api/services/callrail_service.py` via HMAC-SHA256 over the raw request body, checking against both a hex-encoded and base64-encoded digest (fails closed — rejects with 401 if neither matches or the secret is unset). Once CallRail's actual header name/encoding is confirmed against a real test event, narrow this to the single correct encoding.
- Send a CallRail test event (or place a real test call) and confirm a `200 {"status": "received"}` response and a matching log line (`[callrail-webhook] Received call id=...`).

### GHL (SEC-03 — Ed25519 only)

- Confirm the GHL webhook in the GoHighLevel sub-account/agency settings points to:
  ```
  POST https://<railway-host>/api/webhooks/ghl
  ```
- As of Phase 5 (SEC-03), only the Ed25519 `X-GHL-Signature` path is accepted — the legacy RSA `X-WH-Signature` bypass has been removed. Ensure GHL is configured to send the Ed25519 signature (this should already be the default for accounts not relying on the deprecated legacy path).
- GHL allows only one webhook URL per app — all event types route through this single endpoint via the `event_type` field in the payload.

---

## 5. End-to-End Verification Traces (DPLY-02 — requires human)

**Both traces below must be executed against the live deployed system (production or a fully-configured staging environment with real CallRail/GHL/Resend/Supabase credentials). They are NOT auto-verifiable in-repo — execution and sign-off happen in plan 05-06.**

### Trace A — Real lead (landing-page form → DB → GHL → email)

1. Open a live HVAC client landing page (`https://<app-domain>/<clientSlug>/<service>`) in a real browser.
2. Submit the lead capture form with a real (or clearly-test-labeled) name/phone/email.
3. **Expected — Supabase:** A new row appears in `leads` with `client_id` matching the landing page's client, `source` reflecting the form, and `created_at` set. Verify via Supabase Table Editor or SQL: `select * from leads order by created_at desc limit 1;`.
4. **Expected — GHL:** A new contact is created in the client's GHL sub-account with matching name/phone/email, and the client's SMS follow-up workflow (`GHL_SMS_WORKFLOW_ID`) is enrolled. Verify in GoHighLevel → Contacts.
5. **Expected — Resend:** The HVAC owner receives an email notification of the new lead at their registered email. Verify via the Resend Dashboard → Emails (delivery log) and the owner's actual inbox.
6. **Expected — Dashboard:** The lead appears in the client's dashboard lead list (`/dashboard/leads`) with status `new`.

### Trace B — Real missed call (CallRail → webhook → lead + text-back → dashboard)

1. Call the HVAC client's CallRail tracking number from a real phone and let it ring through to voicemail/unanswered (do not answer).
2. **Expected — CallRail webhook:** CallRail's webhook fires to `POST /api/webhooks/callrail`. Confirm a `200` response in the CallRail webhook delivery log (or Railway logs: `[callrail-webhook] Received call id=... answered=False`).
3. **Expected — Supabase `calls`:** A new row appears in `calls` with `outcome` indicating a missed call, `recording_url` present (once CallRail processes the recording), and `callrail_call_id` set. Verify: `select * from calls order by called_at desc limit 1;`.
4. **Expected — Supabase `leads`:** A corresponding `leads` row is created with `source = 'direct_call'` and the same `callrail_call_id`, deduplicated by the partial unique index from migration 005 (confirm no duplicate row appears if CallRail retries the webhook).
5. **Expected — GHL text-back:** The caller receives a text-back SMS within 15 seconds of the missed call, triggered via `GHL_PRIVATE_TOKEN` + `GHL_SMS_WORKFLOW_ID`. Verify via the test phone's inbox and the GoHighLevel conversation log.
6. **Expected — Dashboard:** The call appears in the client's dashboard call log (`/dashboard/calls`) with a working recording link, and the linked lead appears in the leads list.

---

*Generated for Phase 5 (Critical Security & Launch Blockers), plan 05-05 (DPLY-01 in-repo + DPLY-02 doc). Live execution of Sections 3 and 5 is tracked in plan 05-06.*
