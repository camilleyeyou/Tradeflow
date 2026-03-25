# Pitfalls Research

**Domain:** HVAC lead generation SaaS platform (multi-tenant, webhook-heavy)
**Researched:** 2026-03-25
**Confidence:** MEDIUM-HIGH (integration-specific details verified via official docs; some edge cases from community sources)

---

## Critical Pitfalls

### Pitfall 1: Supabase RLS Disabled by Default on New Tables

**What goes wrong:**
Every table created via the SQL Editor or a migration has RLS disabled by default. Any table missing an explicit `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statement is fully readable and writable by any authenticated (or even anon) user via the Supabase API. An HVAC client could read another client's leads, call logs, or notes without ever triggering an error.

**Why it happens:**
Developers focus on schema correctness and assume that because other tables have RLS, new tables inherit that state. Supabase silently returns all rows when RLS is off — no error surfaces to indicate the data is exposed.

**How to avoid:**
- In every migration, immediately follow `CREATE TABLE` with `ALTER TABLE [name] ENABLE ROW LEVEL SECURITY` and the policies, in the same file.
- Write an integration test that creates a second client JWT and asserts a 0-row response when querying any table that should be tenant-scoped.
- Use a CI step that queries `pg_tables` and flags any table where `rowsecurity = false`.

**Warning signs:**
- A new table added during a sprint shows full row counts in the Supabase dashboard for every user role.
- Queries from client A return rows owned by client B (no error, just wrong data).
- SQL Editor queries return more rows than the client SDK query for the same table.

**Phase to address:** Phase 1 — Foundation / Supabase schema setup. Every table must ship with RLS enabled before the auth layer is connected.

---

### Pitfall 2: Service Role Key Leaking Into Client-Side or Next.js Route Handlers

**What goes wrong:**
The `service_role` key bypasses all RLS policies. If it is instantiated in a Next.js Route Handler using the standard `createClient()` helper (which can be overridden by the user's `Authorization` header), or if it appears in a browser bundle, every tenant can read every other tenant's data.

**Why it happens:**
Developers copy the Supabase quickstart snippet, swap in the service key, and call it done. The subtle issue is that SSR/Edge clients can have their API key replaced by a JWT from the request, effectively stripping the service role privilege from the wrong direction — or exposing full access when the key leaks client-side.

**How to avoid:**
- Create a dedicated server-only Supabase client for admin/webhook operations: instantiate with `createClient(url, SERVICE_ROLE_KEY, { auth: { persistSession: false } })` and never export or re-use it in any file that touches the browser bundle.
- The client-side (and dashboard Next.js client) must use the `anon` key exclusively.
- In the FastAPI backend (webhook handlers, GHL orchestration), the service role key is acceptable because Railway runs server-side — but never log it, never include it in error responses.
- Next.js `env` variables prefixed `NEXT_PUBLIC_` are bundled into the browser. The service key must never have that prefix.

**Warning signs:**
- `process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY` exists anywhere in the codebase.
- The browser network tab shows the `apikey` header containing the service role key on any client request.
- Any RLS policy returns data for a user that should have no access.

**Phase to address:** Phase 1 — Auth and RLS setup. Must be enforced before any dashboard or admin panel is built.

---

### Pitfall 3: Stripe Webhook Events Arriving Out of Order or Duplicated

**What goes wrong:**
Stripe does not guarantee event delivery order. A `customer.subscription.updated` can arrive before `customer.subscription.created`. A `invoice.payment_failed` can fire twice due to Stripe's retry logic (up to 3 days of retries). Without idempotency guards, the billing state in Supabase drifts from Stripe's actual state — clients whose subscriptions are active get locked out, or failed payers retain access.

**Why it happens:**
Developers handle the "happy path" event sequence they see in local testing (using `stripe listen`), which delivers events in order. In production, network conditions, parallel event generation, and Stripe's retry system break that assumption.

**How to avoid:**
- Store processed Stripe event IDs in a `stripe_events` table with a `UNIQUE` constraint on `stripe_event_id`. At the top of every webhook handler: check if the ID exists, skip if so.
- Never update subscription status directly from the event payload. Instead, use the event as a trigger to re-fetch the subscription state from the Stripe API (a "pull not push" pattern).
- Wrap all database writes in a transaction so a mid-handler crash leaves no partial state that Stripe's retry would then skip over.
- Handle `invoice.payment_failed` and `customer.subscription.deleted` events as idempotent state transitions, not one-time actions.

**Warning signs:**
- A client reports being locked out despite paying; Stripe dashboard shows active subscription.
- Billing records in Supabase have `null` for fields that should be populated after subscription creation.
- The same Stripe `evt_` ID appears multiple times in application logs.

**Phase to address:** Phase 1 — Stripe billing integration. Must have idempotency table and pull-not-push pattern before go-live with paying clients.

---

### Pitfall 4: CallRail Webhook Fires Twice for One Call (Start + End Events)

**What goes wrong:**
CallRail sends two webhook events for every call: one at call start (with `answered` status unknown) and one at call end (with final `answered=true/false` and `call_type`). If the missed-call text-back is triggered on the first event, it fires before CallRail knows whether the call was answered — creating false positive text-backs for answered calls.

**Why it happens:**
Developers test with a single missed call and see the webhook fire once with `answered=false`. In real traffic, both events arrive and the handler processes the first one without checking `call_type=missed` on the completed event.

**How to avoid:**
- Only trigger missed-call text-back on the `call_completed` webhook event (not `call_started`).
- Filter specifically on `answered=false` AND `call_type=missed` before creating a lead or triggering a GHL workflow.
- Additionally: if a caller hangs up before 15 seconds, CallRail classifies the call as `abandoned` rather than `missed` — ensure the handler accepts both `call_type=missed` and `call_type=abandoned` if text-back is desired for both.
- Implement deduplication: store the CallRail `call_id` on lead creation and reject duplicate webhook deliveries for the same call.

**Warning signs:**
- HVAC clients receive text-backs from calls they answered.
- Lead records show duplicate entries with the same caller phone number and identical timestamps.
- GHL contact creation fails with "contact already exists" due to double processing.

**Phase to address:** Phase 1 — CallRail webhook handler. The event type filter must be implemented before any real client call traffic hits the system.

---

### Pitfall 5: GoHighLevel Sub-Account Provisioning Not Idempotent

**What goes wrong:**
When onboarding a new HVAC client, the admin flow creates a GHL sub-account via the API. If the network request times out or the admin clicks "submit" twice, a second sub-account gets created under the agency. The Tradeflow database record may point to the wrong location ID, causing all leads and SMS workflows for that client to go to a phantom sub-account.

**Why it happens:**
Sub-account creation in GHL is not inherently idempotent — the API does not deduplicate by name or email. A retry creates a new sub-account every time.

**How to avoid:**
- Before creating a GHL sub-account, query the GHL API to check if a sub-account with that client's name or phone already exists under the agency.
- Store the GHL `location_id` in Supabase immediately upon successful creation and check for its presence at the start of the onboarding flow to gate creation.
- The admin onboarding UI should disable the submit button on first click and show a loading state until GHL confirms.
- In the FastAPI backend, implement an optimistic lock: write a `ghl_provisioning_started_at` timestamp before the API call; if that column is set, skip creation and return the existing location ID.

**Warning signs:**
- Two sub-accounts in GHL with the same client's business name.
- Leads for a new client appear in GHL but not in the Tradeflow dashboard (wrong `location_id` stored).
- Admin onboarding page shows an error but the sub-account was created anyway.

**Phase to address:** Phase 1 — Admin onboarding flow. Must be idempotent before the first real client onboarding.

---

### Pitfall 6: Vercel Deployment Protection Blocking Webhook Ingress

**What goes wrong:**
Vercel's "Deployment Protection" feature (enabled by default on preview deployments, optionally on production) requires authentication for all inbound requests. CallRail, Stripe, and GHL webhooks are unauthenticated POST requests from external services — they receive a 401 and are silently dropped. The system appears to work in local testing but receives no webhooks in production.

**Why it happens:**
Deployment Protection is a Vercel security feature that developers enable without realizing it intercepts all routes, including API routes used as webhook endpoints. External services have no way to pass Vercel's auth challenge.

**How to avoid:**
- Disable Deployment Protection for all webhook route paths (`/api/webhooks/*`) on production. Vercel allows path-based exclusions.
- Better: route all webhook ingress through the FastAPI service on Railway, which has no deployment protection equivalent. Vercel's Next.js app handles the dashboard/UI; Railway handles all inbound webhooks from CallRail, Stripe, and GHL.
- Test every webhook endpoint with a real external request (use the service's "send test event" feature) before considering it complete.

**Warning signs:**
- Stripe webhook dashboard shows 401 errors for the production endpoint.
- CallRail shows webhook deliveries succeeding but no leads appear in Supabase.
- Local `stripe listen --forward-to` works perfectly but production receives nothing.

**Phase to address:** Phase 1 — Webhook infrastructure setup. Verify before connecting any live service.

---

### Pitfall 7: GHL Webhook Signature Header Deprecation Breaking Verification

**What goes wrong:**
GoHighLevel is deprecating the `X-WH-Signature` header on July 1, 2026, replacing it with `X-GHL-Signature`. Code that verifies only `X-WH-Signature` will break on that date and either reject all GHL webhooks (if verification is enforced) or silently stop verifying signatures (if code falls back to "no header = skip check").

**Why it happens:**
The header name is hardcoded at integration time and forgotten. Breaking changes to webhook authentication are easy to miss without changelog monitoring.

**How to avoid:**
- Implement signature verification that accepts both `X-WH-Signature` (legacy) and `X-GHL-Signature` (new) during the transition period, with a log warning when the legacy header is used.
- Add a calendar reminder or dependency alert for the July 1, 2026 cutover to remove the legacy fallback.
- Treat all unsigned GHL webhooks as rejected — never skip verification even in development.

**Warning signs:**
- GHL webhook handler begins receiving 0 events after July 2026.
- Logs show "signature header missing" on GHL webhook routes.

**Phase to address:** Phase 1 — GHL webhook handler. Build with both headers from day one.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `anon` key server-side for Supabase queries | Avoids setting up separate server client | RLS bypass impossible; all queries constrained to logged-in user even in background jobs | Never — always use server client with service role for background/webhook contexts |
| FastAPI `BackgroundTasks` instead of a queue | No Redis/Celery setup required | No retry on failure; a Railway restart loses all in-flight tasks | MVP only — acceptable until first lost lead complaint |
| Single Next.js app for dashboard + webhook routes | Simpler deployment | Vercel deployment protection ambiguity; serverless function cold starts affect webhook latency | Move webhooks to FastAPI before scaling |
| Storing GHL `location_id` only in Supabase (no validation) | Fast to implement | Stale IDs if sub-account is deleted/recreated in GHL; silent data routing failures | Never — validate location_id on client creation and periodically |
| Skipping idempotency on Stripe webhooks in MVP | Faster to ship | Duplicate subscription records; billing state drift under retry load | Never — idempotency table is a 30-minute investment that prevents client data disasters |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GoHighLevel API | Using deprecated v1 API keys; new key generation is being removed | Generate OAuth credentials or Private Integration keys via the GHL Developer Portal; do not use agency-level API keys for sub-account operations |
| GoHighLevel webhooks | Verifying only `X-WH-Signature`; this header is deprecated July 1, 2026 | Verify both `X-WH-Signature` and `X-GHL-Signature` now; cut over fully before July 2026 |
| GoHighLevel rate limits | Sending bulk contact syncs without rate control | Max 100 requests per 10 seconds per resource; implement exponential backoff with a per-client queue |
| CallRail webhooks | Triggering text-back on `call_started` event | Only act on `call_completed` with `answered=false` and `call_type=missed` OR `call_type=abandoned` |
| CallRail webhooks | Assuming all callers can receive SMS | Landlines and some VOIP numbers cannot receive texts; CallRail's automated response skips them silently — handle gracefully and log |
| Stripe webhooks | Trusting event payload data directly | Always re-fetch the subscription/invoice object from the Stripe API on any status-changing event; treat payload as a notification, not ground truth |
| Stripe webhooks | No idempotency guard | Store `stripe_event_id` in DB with unique constraint; skip reprocessing |
| Supabase RLS | Testing policies in the SQL Editor | The SQL Editor runs as superuser and bypasses RLS; always test from the client SDK with a real JWT |
| Supabase RLS | Using `auth.jwt() -> 'user_metadata'` in policies | `user_metadata` is user-modifiable; use `auth.jwt() -> 'app_metadata'` or a separate `client_users` join table for tenant ID claims |
| Vercel | Deployment Protection blocking external webhooks | Exclude webhook paths from protection, or route all webhooks to Railway FastAPI where no such protection exists |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No index on `tenant_id` / `client_id` columns in RLS policies | Dashboard load times grow linearly with total lead count across all tenants | Add `CREATE INDEX` on every column referenced in RLS `USING` clauses | ~500 total leads across all clients |
| Fetching full call recordings in the lead list query | Dashboard shows a spinner on every page load; Railway/Supabase egress costs spike | Store recording URLs only; fetch on-demand when user clicks "play" | ~50 recordings in the DB |
| GHL contact creation synchronous in webhook handler | Webhook response times exceed 3 seconds; CallRail/Stripe retry the webhook | Create the Supabase lead record synchronously (fast), then trigger GHL contact creation asynchronously via a background task | First production webhook under load |
| Landing page ISR stale on client data change | New HVAC client's page not updated after config change | Use on-demand ISR revalidation with a webhook-triggered `revalidatePath` call from the admin panel | First time a client's phone number or CTA changes after launch |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging full webhook payloads (containing caller phone, name, address) | PII stored in plain-text logs; Railway log exports could expose client data | Log only `call_id`, `client_id`, event type, and timestamp; truncate or hash phone numbers in logs |
| Admin panel accessible without separate auth guard | An HVAC client who knows the admin URL can access all other clients' data | Admin routes must check `is_admin` claim from `app_metadata`, not `user_metadata`; enforce at middleware layer, not just UI |
| GHL sub-account location IDs exposed in client-facing API responses | Competitor or malicious client could probe the GHL API using leaked location IDs | Never return GHL internal IDs to client dashboards; use internal Supabase UUIDs for all client-facing references |
| Stripe webhook endpoint without signature verification | Attacker can POST fake subscription events to grant free access | Always verify `stripe.webhooks.constructEvent(body, sig, secret)` — reject on failure |
| CallRail webhook endpoint accepting any POST without validation | Fake missed calls injected, triggering SMS spam to phone numbers | Verify CallRail webhook auth token on every request; CallRail sends an `Authorization` header or a shared secret query param depending on configuration |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Lead form with more than 4 fields on mobile | HVAC homeowners abandon mid-form; conversion rate drops 20–40% on mobile | Collect only name, phone, service type, zip — all critical for routing; everything else captured by follow-up |
| Form submit button not disabled during submission | Homeowner taps twice on slow mobile connection; duplicate lead created in Supabase and double text-back fires | Disable submit on first tap; show "Sending..." state; re-enable only on error |
| Generic landing page used for all ad campaigns | LSA ad for "AC Repair" sends to a page talking about "Heating & Cooling Services" — relevance mismatch kills Quality Score and conversion | One statically generated page per service per client (AC repair, furnace repair, etc.) |
| HVAC client dashboard shows raw timestamps in UTC | Contractor in Chicago sees "3:00 AM" for an afternoon call; creates confusion about lead recency | Display all timestamps in America/Chicago timezone |
| Dashboard lead status pipeline not showing "new" badge count | Contractor misses unread leads; calls back 6 hours later; lead goes cold | Show a red badge count of unread/new leads in dashboard header on every page |

---

## "Looks Done But Isn't" Checklist

- [ ] **Supabase RLS:** Every table has `ENABLE ROW LEVEL SECURITY` — verify with `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`
- [ ] **Stripe webhooks:** Idempotency table exists (`stripe_events` with unique constraint on `event_id`) and is checked before processing
- [ ] **CallRail handler:** Only processes `call_completed` events with `answered=false`, not `call_started`
- [ ] **GHL webhook verification:** Handler checks `X-GHL-Signature` (not just the deprecated `X-WH-Signature`)
- [ ] **Vercel webhook routes:** Deployment Protection is explicitly disabled for `/api/webhooks/*` paths in production
- [ ] **Landing pages:** Load in under 2 seconds on a throttled mobile connection (run Lighthouse with "Mobile" preset)
- [ ] **Admin panel:** Only accessible to users with `app_metadata.is_admin = true` — cannot be bypassed by editing a JWT claim from the client
- [ ] **GHL sub-account creation:** Idempotent — running onboarding twice does not create two sub-accounts
- [ ] **Lead form:** Submit button disabled on first tap; no duplicate leads possible from double-submit
- [ ] **FastAPI background tasks:** Any task that calls external APIs (GHL, Resend) has a timeout set and logs failures with enough context to replay manually

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| RLS disabled on a live table (data exposure) | HIGH | Immediately enable RLS, add deny-all policy temporarily, audit access logs, notify affected clients per GDPR/state law requirements |
| Duplicate Stripe events processed (double charge or wrong status) | MEDIUM | Query `stripe_events` for duplicates, reverse incorrect DB state changes, cross-reference Stripe dashboard, issue refund if customer was double-charged |
| GHL duplicate sub-accounts for one client | MEDIUM | Identify correct `location_id` by checking which sub-account has live contacts, update Supabase `clients` table, delete phantom sub-account via GHL UI (not API — to confirm manually) |
| Missed-call text-backs fired for answered calls | LOW | GHL workflow can be paused; filter out affected contacts by checking `call_type` retroactively via CallRail API; send apology text if volume is high |
| Vercel Deployment Protection blocking webhooks in production | LOW | Add path exclusion in Vercel project settings and redeploy; trigger test webhook from each service to confirm receipt |
| Service role key leaked in browser bundle | HIGH | Rotate key immediately in Supabase dashboard; audit recent requests for unauthorized data access; redeploy with key removed from client-side env |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| RLS disabled by default | Phase 1 — Supabase schema | Run `pg_tables` query; write integration test with cross-tenant JWT |
| Service role key in client bundle | Phase 1 — Supabase client setup | `grep -r NEXT_PUBLIC_SUPABASE_SERVICE` returns no results |
| Stripe webhook out-of-order / duplicate | Phase 1 — Stripe billing integration | `stripe_events` table exists with unique constraint; handler tested with duplicate event ID |
| CallRail double-fire / wrong event type | Phase 1 — CallRail webhook handler | Unit test that `call_started` event is ignored; `call_completed` with `answered=true` is ignored |
| GHL sub-account not idempotent | Phase 1 — Admin onboarding | Onboarding flow run twice; only one GHL sub-account created |
| Vercel Deployment Protection blocking webhooks | Phase 1 — Deployment setup | Send live test webhook from Stripe/CallRail/GHL dashboards; confirm 200 response in their delivery logs |
| GHL webhook signature deprecation | Phase 1 — GHL webhook handler | Handler verifies `X-GHL-Signature`; legacy header tested to still pass during transition |
| No RLS index on tenant columns | Phase 1 — Schema / Phase 2 if missed | EXPLAIN ANALYZE on a tenant-filtered query shows index scan, not seq scan |
| Form double-submit duplicate leads | Phase 1 — Landing page forms | Manual test: rapid double-tap on submit; only one lead row created in Supabase |
| UTC timestamps in dashboard | Phase 1 — Dashboard UI | All timestamps shown as CT (America/Chicago); verified with a lead created at known local time |

---

## Sources

- [Supabase RLS troubleshooting — official docs](https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z)
- [Supabase Row Level Security guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase RLS best practices — MakerKit](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)
- [Multi-tenant leakage: When RLS fails in SaaS — Medium/InstaTunnel, Jan 2026](https://medium.com/@instatunnel/multi-tenant-leakage-when-row-level-security-fails-in-saas-da25f40c788c)
- [GoHighLevel Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html)
- [GoHighLevel Webhooks 2026 guide — SupplyGem](https://supplygem.com/gohighlevel-webhooks/)
- [GHL Private Integrations documentation](https://help.gohighlevel.com/support/solutions/articles/155000003054-private-integrations-everything-you-need-to-know)
- [CallRail Webhooks — official help center](https://support.callrail.com/hc/en-us/articles/5711246459149-Webhooks)
- [CallRail Automated responses for missed calls](https://support.callrail.com/hc/en-us/articles/5712009329293-Automated-responses-for-missed-calls)
- [Stripe webhooks with subscriptions — official docs](https://docs.stripe.com/billing/subscriptions/webhooks)
- [Stripe idempotent requests — official API reference](https://docs.stripe.com/api/idempotent_requests)
- [Stripe webhook best practices — Stigg blog](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks)
- [Building reliable Stripe subscriptions with idempotency — DEV Community](https://dev.to/aniefon_umanah_ac5f21311c/building-reliable-stripe-subscriptions-in-nestjs-webhook-idempotency-and-optimistic-locking-3o91)
- [Vercel Deployment Protection and webhook timeout guidance](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out)
- [FastAPI background tasks reliability — BetterStack](https://betterstack.com/community/guides/scaling-python/background-tasks-in-fastapi/)
- [HVAC landing page best practices 2025 — HVAC Marketing Xperts](https://hvacmarketingxperts.com/hvac-landing-page/)
- [Why HVAC companies need service-specific landing pages — Forward First Media](https://forwardfirstmedia.com/why-hvac-companies-need-one-landing-page-per-service-not-generic-pages/)

---
*Pitfalls research for: HVAC lead generation SaaS platform (Tradeflow)*
*Researched: 2026-03-25*
