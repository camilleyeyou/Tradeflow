---
phase: quick-260723-oop
plan: 01
type: execute
wave: 1
depends_on: []
requirements: [REVIEW-DB, REVIEW-SETTINGS, REVIEW-AUTOMATION, REPORT-EMAIL]
files_modified:
  - supabase/migrations/014_review_requests_and_reports.sql
  - apps/web/src/lib/supabase/types.ts
  - apps/web/src/lib/types/dashboard.ts
  - apps/web/src/lib/validations/settings.ts
  - apps/web/src/lib/actions/settings-actions.ts
  - apps/web/src/components/dashboard/settings-form.tsx
  - apps/web/src/lib/actions/lead-actions.ts
  - api/services/crypto.py
  - api/services/ghl_api.py
  - api/routers/webhooks.py
  - apps/web/vercel.json
  - apps/web/src/app/api/cron/monthly-reports/route.ts
  - apps/web/.env.example
autonomous: true

must_haves:
  truths:
    - "A client can set their Google review URL and toggle review requests on/off in dashboard settings"
    - "Moving a lead to 'completed' sends the homeowner exactly one review-request SMS"
    - "The two completion paths (Next.js updateLeadStatus and FastAPI ContactTagAdded) can never double-send — a conditional review_requested_at claim gates both"
    - "A branded monthly ROI report email is sent on the 1st to each active client with activity in the prior month, using only computed stats"
    - "Review-SMS and report-email failures never block status updates or webhook 200 responses"
    - "apps/web type-checks (tsc --noEmit) and builds; changed api/ files pass py_compile"
  artifacts:
    - path: "supabase/migrations/014_review_requests_and_reports.sql"
      provides: "clients.google_review_url, clients.review_requests_enabled, leads.review_requested_at + extended column-scoped UPDATE grant"
      contains: "add column if not exists"
    - path: "api/services/crypto.py"
      provides: "Python AES-256-GCM decrypt mirroring apps/web/src/lib/crypto.ts (iv:tag:ciphertext, GHL_TOKEN_ENC_KEY)"
      contains: "AESGCM"
    - path: "apps/web/src/app/api/cron/monthly-reports/route.ts"
      provides: "GET cron handler: CRON_SECRET bearer auth, prior-month per-client aggregation, Resend branded email"
      contains: "CRON_SECRET"
    - path: "apps/web/vercel.json"
      provides: "monthly cron schedule 0 14 1 * * -> /api/cron/monthly-reports"
      contains: "crons"
  key_links:
    - from: "apps/web/src/lib/actions/lead-actions.ts"
      to: "apps/web/src/lib/ghl.ts sendSMSReply"
      via: "after() review flow with conditional review_requested_at claim"
      pattern: "review_requested_at|sendSMSReply"
    - from: "api/routers/webhooks.py"
      to: "api/services/ghl_api.py send_sms"
      via: "handle_contact_tag_added completed branch with conditional claim"
      pattern: "review_requested_at|send_sms"
    - from: "apps/web/vercel.json"
      to: "apps/web/src/app/api/cron/monthly-reports/route.ts"
      via: "cron path"
      pattern: "monthly-reports"
---

<objective>
Add two client-facing retention features: (1) an automated one-time Google review-request SMS to the homeowner when a lead is marked completed, and (2) a monthly branded ROI report email summarizing the prior calendar month's lead activity. Both are strictly best-effort — they must never affect the core status-update or webhook flows.

Purpose: Give HVAC/plumbing clients visible recurring value (reviews grow their LSA ranking; the monthly report reinforces the retainer's ROI).
Output: Migration 014, settings UI for the review URL/toggle, review-request automation across both completion paths (Next.js server action + FastAPI webhook), a Python token-decrypt helper + GHL send_sms, and a Vercel cron report-email route.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md

<interfaces>
<!-- Key contracts extracted from the codebase. Use these directly. -->

apps/web/src/lib/crypto.ts (Node, per-client GHL token):
  encryptToken(plaintext): string  // format "iv:authTag:ciphertext" (hex segments), AES-256-GCM, key = GHL_TOKEN_ENC_KEY (64 hex chars)
  decryptToken(payload): string    // throws if key missing / payload malformed

apps/web/src/lib/ghl.ts (Node GHL client):
  sendSMSReply(contactId, message, token): Promise<boolean>  // POST /conversations/messages {type:'SMS', contactId, message}; returns false on error (no throw)

api/services/ghl_api.py (FastAPI GHL client, httpx.AsyncClient):
  _ghl_post(path, token, json_body) -> httpx.Response   // Authorization Bearer, Version 2021-07-28
  _truncate_phone(phone) -> str                          // last-4 masking for logs
  create_contact / add_to_workflow / trigger_textback    // existing

api/services/webhook_events.py:
  process_ghl_event routes ContactTagAdded -> handle_contact_tag_added (webhooks.py), runs in BackgroundTask, never re-raises

Existing completion mapping (api/routers/webhooks.py handle_contact_tag_added):
  TAG_TO_STATUS = {contacted, booked, completed, lost}; selects lead by ghl_contact_id, updates status.

updateLeadStatus (apps/web/src/lib/actions/lead-actions.ts):
  RLS-scoped createClient(); stamps first_contact_at on first move off 'new'; revalidatePath('/dashboard*').

Service-role read-after-ownership pattern (apps/web/src/app/api/leads/[id]/messages/route.ts):
  createServiceClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}})
  reads clients.ghl_sub_account_id, ghl_private_token_encrypted; token = decryptToken(enc) ?? process.env.GHL_PRIVATE_TOKEN

ESTIMATED_LEAD_VALUE = 400  (exported from apps/web/src/components/dashboard/roi-summary.tsx) — import, do NOT duplicate.

clients relevant columns: business_name, email, is_active, notifications_enabled, ghl_sub_account_id, ghl_private_token_encrypted
leads relevant columns: id, client_id, phone, ghl_contact_id, status, source, created_at, first_contact_at, urgency_score
calls relevant columns: client_id, outcome ('missed' | ...), duration_seconds, called_at

Resend usage (apps/web/src/app/api/leads/submit/route.ts): new Resend(process.env.RESEND_API_KEY); resend.emails.send({from: process.env.RESEND_FROM_EMAIL ?? 'leads@tradeflow.io', to, subject, html}); escapeHtml from '@/lib/escape-html'.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Migration 014 + settings UI for review URL/toggle</name>
  <files>supabase/migrations/014_review_requests_and_reports.sql, apps/web/src/lib/supabase/types.ts, apps/web/src/lib/types/dashboard.ts, apps/web/src/lib/validations/settings.ts, apps/web/src/lib/actions/settings-actions.ts, apps/web/src/components/dashboard/settings-form.tsx</files>
  <action>
Create `supabase/migrations/014_review_requests_and_reports.sql` following the style of 013/008 (leading comment, idempotent):
```sql
-- 014_review_requests_and_reports.sql -- Google review requests + monthly ROI report support
alter table public.clients add column if not exists google_review_url text;
alter table public.clients add column if not exists review_requests_enabled boolean not null default true;
alter table public.leads add column if not exists review_requested_at timestamptz;

-- Extend the migration-008 column-scoped UPDATE grant so clients can set their
-- Google review URL and toggle review requests from the dashboard settings form.
grant update (google_review_url, review_requests_enabled) on public.clients to authenticated;
```

Update the hand-written stub `apps/web/src/lib/supabase/types.ts`: add `google_review_url: string | null` and `review_requests_enabled: boolean` to the `clients` Row, and the optional variants (`google_review_url?: string | null`, `review_requests_enabled?: boolean`) to clients Insert and Update. Add `review_requested_at: string | null` to the `leads` Row, and `review_requested_at?: string | null` to leads Insert and Update.

Update `apps/web/src/lib/types/dashboard.ts` `Client` interface: add `google_review_url: string | null` and `review_requests_enabled: boolean`.

Update `apps/web/src/lib/validations/settings.ts`: add to `settingsSchema`:
```ts
google_review_url: z.string().trim().url('Enter a valid review URL').or(z.literal('')),
review_requests_enabled: z.boolean(),
```
(Allows empty string OR a valid URL.)

Update `apps/web/src/lib/actions/settings-actions.ts`: add `google_review_url: string` and `review_requests_enabled: boolean` to the `formData` param type. The action already writes `parsed.data` — no other change needed (both new columns are now in the 014 grant).

Update `apps/web/src/components/dashboard/settings-form.tsx`: extend `defaultValues` with `google_review_url: client.google_review_url ?? ''` and `review_requests_enabled: client.review_requests_enabled ?? true`. Add a "Google Reviews" Card (mirror the existing Notification Preferences Card structure) containing: an Input `id="google_review_url"` registered via `{...register('google_review_url')}` (label "Google review link", helper text, error display like the other fields) and a `Controller`-wrapped `Switch` for `review_requests_enabled` (label "Automatically text customers for a review when a job is completed"), matching the existing notifications_enabled Controller/Switch pattern exactly.
  </action>
  <verify>
    <automated>cd apps/web && npx tsc --noEmit</automated>
  </verify>
  <done>Migration 014 exists and is idempotent; types.ts + dashboard Client type carry the new columns; settings form renders and validates the Google review URL (empty allowed) and the review-requests toggle; tsc passes.</done>
</task>

<task type="auto">
  <name>Task 2: Review-request automation (Next.js action + FastAPI webhook)</name>
  <files>apps/web/src/lib/actions/lead-actions.ts, api/services/crypto.py, api/services/ghl_api.py, api/routers/webhooks.py</files>
  <action>
Idempotency contract shared by BOTH paths: claim `leads.review_requested_at` FIRST with a conditional update `set review_requested_at = now() where id = X and review_requested_at is null`, and only proceed if a row was actually affected. This is the single guard that prevents the Next.js and FastAPI paths from ever double-sending.

--- Next.js: `apps/web/src/lib/actions/lead-actions.ts` ---
In `updateLeadStatus`, after the successful `.update(update).eq('id', leadId)` (and its error check), when `status === 'completed'`, schedule the review send inside `after(async () => {...})` (import `after` from `next/server`). Wrap the whole body in try/catch that only `console.error`s (never throws) so it can never affect the status change. Inside:
  1. Build a service-role client exactly like the messages route: `createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })` (import `createClient as createServiceClient` from `@supabase/supabase-js`).
  2. Fetch lead: `.from('leads').select('phone, ghl_contact_id, review_requested_at, client_id').eq('id', leadId).single()`. Guard: return if no row, no `ghl_contact_id`, or `review_requested_at` already set.
  3. Fetch client: `.from('clients').select('business_name, google_review_url, review_requests_enabled, ghl_private_token_encrypted').eq('id', leadRow.client_id).single()`. Guard: return unless `review_requests_enabled` truthy AND `google_review_url` truthy.
  4. Claim: `.from('leads').update({ review_requested_at: new Date().toISOString() }).eq('id', leadId).is('review_requested_at', null).select('id')`. If the returned array is empty/nullish, return (another path already claimed).
  5. Resolve token: `clientRow.ghl_private_token_encrypted ? decryptToken(clientRow.ghl_private_token_encrypted) : (process.env.GHL_PRIVATE_TOKEN ?? null)` (import `decryptToken` from `@/lib/crypto`). Return if no token.
  6. Send: `await sendSMSReply(leadRow.ghl_contact_id, message, token)` (import `sendSMSReply` from `@/lib/ghl`). Message: `` `Thanks for choosing ${clientRow.business_name || 'us'}! If we did a great job, would you mind leaving us a quick review? ${clientRow.google_review_url}` `` (keep the fixed copy under ~160 chars).

--- FastAPI crypto helper: `api/services/crypto.py` (NEW) ---
Mirror `apps/web/src/lib/crypto.ts` using `cryptography` (already in requirements). Read `GHL_TOKEN_ENC_KEY` (64 hex chars -> 32 bytes; raise if missing/wrong length). `decrypt_token(payload)` splits `iv:tag:ciphertext` (hex), then `AESGCM(key).decrypt(iv, ciphertext + tag, None).decode('utf-8')` (note: Node stores the GCM auth tag separately, but Python's AESGCM expects ciphertext||tag concatenated; no AAD). Import `from cryptography.hazmat.primitives.ciphers.aead import AESGCM`.

--- FastAPI GHL send: `api/services/ghl_api.py` ---
Add `async def send_sms(contact_id: str, message: str, token: str) -> bool:` using the existing `_ghl_post("/conversations/messages", token, {"type": "SMS", "contactId": contact_id, "message": message})`, `response.raise_for_status()`, return True; on Exception log with `logger.error("[ghl_api] send_sms failed for contact_id=%s: %s", contact_id, e)` and return False. Mirror the existing method style.

--- FastAPI webhook: `api/routers/webhooks.py` ---
Add imports: `import os`, `from datetime import datetime, timezone`, `from api.services.ghl_api import send_sms`, `from api.services.crypto import decrypt_token`.
Add a token resolver helper:
```python
def _resolve_client_token(client_row: dict) -> Optional[str]:
    enc = client_row.get("ghl_private_token_encrypted")
    if enc:
        try:
            return decrypt_token(enc)
        except Exception as e:
            logger.error("[ghl-webhook] token decrypt failed: %s", e)
    return os.environ.get("GHL_PRIVATE_TOKEN")
```
In `handle_contact_tag_added`, widen the lead select to `select("id, client_id, phone, review_requested_at")`. After the status update, when `new_status == "completed"`, call `await _maybe_send_review_request(db, lead, contact_id)` where `lead = result.data[0]` (dict with the widened columns) and `contact_id` is the payload contactId (the ghl_contact_id).
Add `async def _maybe_send_review_request(db, lead: dict, contact_id: str) -> None:` wrapped entirely in try/except (logger.exception; never re-raise so webhook processing/200 is unaffected):
  1. Return if `lead.get("review_requested_at")` is not None.
  2. Fetch client via `run_in_threadpool(lambda: db.table("clients").select("business_name, google_review_url, review_requests_enabled, ghl_private_token_encrypted").eq("id", lead["client_id"]).execute())`. Return if no data, or not `review_requests_enabled`, or not `google_review_url`.
  3. Claim FIRST: `run_in_threadpool(lambda: db.table("leads").update({"review_requested_at": datetime.now(timezone.utc).isoformat()}).eq("id", lead["id"]).is_("review_requested_at", "null").execute())`. If `claim.data` is empty, return (another path claimed).
  4. `token = _resolve_client_token(client)`; return (warn) if falsy.
  5. `message = f"Thanks for choosing {client.get('business_name') or 'us'}! If we did a great job, would you mind leaving us a quick review? {client['google_review_url']}"`; `await send_sms(contact_id, message, token)`; log success. Do NOT log the phone or URL raw beyond what is needed; if logging phone anywhere use last-4 masking (project rule).
  </action>
  <verify>
    <automated>cd apps/web && npx tsc --noEmit && python3 -m py_compile ../../api/services/crypto.py ../../api/services/ghl_api.py ../../api/routers/webhooks.py</automated>
  </verify>
  <done>Completing a lead via either the dashboard action or a GHL 'completed' tag sends one review SMS; the conditional review_requested_at claim guarantees at-most-once across both paths; every send is wrapped so failure cannot block the status change or the webhook 200; tsc and py_compile pass.</done>
</task>

<task type="auto">
  <name>Task 3: Monthly ROI report email via Vercel cron</name>
  <files>apps/web/vercel.json, apps/web/src/app/api/cron/monthly-reports/route.ts, apps/web/.env.example</files>
  <action>
Create `apps/web/vercel.json` (Vercel Root Directory is `apps/web` — no repo-root package.json/workspace exists, so the cron path is app-relative):
```json
{ "crons": [{ "path": "/api/cron/monthly-reports", "schedule": "0 14 1 * *" }] }
```

Create `apps/web/src/app/api/cron/monthly-reports/route.ts` — `export const dynamic = 'force-dynamic'`, `export async function GET(request: Request)`:
  1. Auth: read `Authorization` header. If `process.env.CRON_SECRET` is unset, `console.warn` and return `NextResponse.json({ clients_processed: 0, emails_sent: 0, skipped: 'CRON_SECRET unset' })` with 200 (no-op). Otherwise require header to equal `Bearer ${process.env.CRON_SECRET}`; return 401 `{ error: 'Unauthorized' }` if not.
  2. Service-role Supabase: inline `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })` from `@supabase/supabase-js` (mirror lead-submit route; no `<Database>` generic).
  3. Prior calendar month (UTC): `const now = new Date(); const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)); const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));` and `const monthName = monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })`.
  4. Fetch active, notifiable clients: `.from('clients').select('id, business_name, email').eq('is_active', true).eq('notifications_enabled', true)`.
  5. Resend guard: if `!process.env.RESEND_API_KEY`, still compute but skip sending — `console.warn` and count emails_sent = 0. Otherwise `const resend = new Resend(process.env.RESEND_API_KEY)`.
  6. For each client (wrap each iteration in try/catch so one failure never aborts the loop):
     - leads: `.from('leads').select('status, source, created_at, first_contact_at, urgency_score').eq('client_id', id).gte('created_at', monthStart.toISOString()).lt('created_at', monthEnd.toISOString())`.
     - calls: `.from('calls').select('outcome').eq('client_id', id).gte('called_at', monthStart.toISOString()).lt('called_at', monthEnd.toISOString())`.
     - Skip client if `leads.length === 0 && calls.length === 0`.
     - Compute (only from fetched rows — no fabricated values): totalLeads; counts by status (new/contacted/booked/completed/lost); counts by source; totalCalls; missedCalls (outcome === 'missed'); avgSpeedMin = round(avg of `(first_contact_at - created_at)/60000` over leads with first_contact_at) or null; hotLeads (urgency_score != null && >= 8); `estimatedValue = totalLeads * ESTIMATED_LEAD_VALUE` (import `{ ESTIMATED_LEAD_VALUE }` from `@/components/dashboard/roi-summary` — do NOT redefine).
     - Build simple inline-styled HTML: dark header (`background:#0b0b0c`) with a gold Tradeflow wordmark (`color:#d4af37;font-weight:700`), a set of stat rows (leads captured, status breakdown, sources, calls + missed calls, avg speed-to-lead, hot leads, and Estimated pipeline value labeled `(estimated — not actual revenue)`), and a footer link to `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard`. Escape `business_name` with `escapeHtml` from `@/lib/escape-html`.
     - If Resend enabled and `client.email`: `await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL ?? 'leads@tradeflow.io', to: client.email, subject: \`Your ${monthName} Tradeflow report — ${totalLeads} leads captured\`, html })`; increment emailsSent.
     - Increment clientsProcessed (for clients not skipped).
  7. Return `NextResponse.json({ clients_processed: clientsProcessed, emails_sent: emailsSent })`.

Update `apps/web/.env.example`: add under a `# --- Monthly ROI report cron ---` comment: `CRON_SECRET=   # Bearer secret Vercel Cron sends to /api/cron/monthly-reports; unset = cron no-ops`.
  </action>
  <verify>
    <automated>cd apps/web && npx tsc --noEmit && npm run build</automated>
  </verify>
  <done>vercel.json schedules the 1st-of-month cron; the route rejects unauthorized calls (401), no-ops when CRON_SECRET unset, aggregates only real prior-month stats per active/notifiable client, skips zero-activity clients, sends a branded Resend email (graceful no-op without RESEND_API_KEY) with estimated value clearly labeled, and returns a JSON summary; build passes.</done>
</task>

</tasks>

<verification>
- `cd apps/web && npx tsc --noEmit` — clean.
- `cd apps/web && npm run build` — succeeds.
- `python3 -m py_compile api/services/crypto.py api/services/ghl_api.py api/routers/webhooks.py` — clean.
- Grep confirms the conditional claim exists in both paths: `review_requested_at` guarded by `.is('review_requested_at', null)` (Next.js) and `.is_("review_requested_at", "null")` (FastAPI).
- No phone or review URL logged raw; phone logging (if any) uses last-4 masking.
</verification>

<success_criteria>
- Migration 014 adds the three columns idempotently and extends the 008 column grant.
- A client can configure their Google review URL + toggle in settings.
- Marking a lead completed (either path) sends at most one review SMS, never blocking core flows.
- A branded monthly ROI email is sent on the 1st to active/notifiable clients with prior-month activity, using only computed stats with estimated value labeled as estimated.
- All three verification commands pass.
</success_criteria>

<output>
After completion, create `.planning/quick/260723-oop-monthly-roi-report-emails-automated-goog/260723-oop-SUMMARY.md`
</output>
