# Feature Research

**Domain:** HVAC lead generation platform (managed service + client dashboard)
**Researched:** 2026-03-25
**Confidence:** HIGH

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features HVAC owners assume exist when paying a monthly retainer. Missing any of these causes immediate churn or failure to close the sale.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Lead capture (form + phone) | Every lead gen service captures inbound leads — this is the core promise | LOW | Form on landing page + CallRail phone number per client. Both must route to dashboard. |
| Dedicated landing page per client | HVAC owners expect "a page for my company" not a generic template | LOW | Statically generated, mobile-first, single CTA. Under 2s load is non-negotiable for LSA quality score. |
| Real-time lead notification | Owners expect to be alerted immediately — HVAC leads go cold in minutes | LOW | Email via Resend on form submit or CallRail webhook. SMS notification is a bonus. |
| Lead status pipeline | Owners need to know what happened to each lead (new → contacted → booked) | MEDIUM | 5-stage pipeline in dashboard. No pipeline = no accountability, clients don't trust the platform. |
| Call recording + log | Standard in CallRail-backed setups; contractors expect to replay missed calls | LOW | CallRail provides this. Dashboard surfaces call log + links to recordings. |
| Missed-call text-back | This is now table stakes for any HVAC lead gen agency selling automation | MEDIUM | GHL native feature. Fires within 15 seconds. Without it, 80% of missed calls never book. |
| Auth-protected client dashboard | Owners won't accept emailed CSV reports — they expect a login to see their data | MEDIUM | Supabase Auth + RLS. Multi-tenancy is load-bearing. |
| Mobile-responsive experience | HVAC owners check their phones between jobs, rarely at a desk | LOW | Tailwind responsive classes. Not a native app — web suffices. |
| Transparent lead attribution | Owners want to see which ad or channel produced each lead | MEDIUM | CallRail campaign tracking + UTM params on form submits. LSA attribution via Google LSA dashboard API or manual tagging. |
| Google LSA management | Contractors paying retainer expect their LSA to be actively managed, not set-and-forget | HIGH | Account setup, verification, review management, dispute credits, service toggles. Ongoing ops, not just a feature. |
| Billing visibility | Owners expect to see what they're paying for and when | LOW | Stripe customer portal link or invoice emails via Stripe webhook. |

### Differentiators (Competitive Advantage)

Features that distinguish Tradeflow from Angi, Thumbtack, and generic HVAC CRMs. These map directly to the stated competitive advantage: exclusive leads + AI automation.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Exclusive leads (never shared) | Angi/HomeAdvisor share each lead with 3–8 contractors simultaneously; Tradeflow leads are 1:1. Close rates rise from 5–15% to 20–40%. | LOW (policy, not tech) | This is a go-to-market decision enforced by architecture (sub-account isolation). Enforce in onboarding pitch and SLA. |
| SMS follow-up sequence (multi-step) | One missed-call text is table stakes; a 3-step nurture sequence (immediate + 15min + 24hr) is rare among small agencies | MEDIUM | GHL workflow. Sequence should stop when lead replies. Message copy matters — generic texts get ignored. |
| Inline notes + lead history | ServiceTitan has this; most small agency dashboards don't. Owners want to add context ("spoke to wife, calling back Thursday") | LOW | Notes column on lead record in Supabase. Simple textarea. High retention value. |
| Admin-managed onboarding (no DIY) | Angi/Thumbtack require contractor self-serve setup. Tradeflow is fully managed — owner does nothing technical. | MEDIUM | Admin panel creates GHL sub-account, provisions CallRail number, deploys landing page. Reduces churn from setup friction. |
| Seasonal campaign awareness | Chicago HVAC has hard seasonal peaks (Oct–Feb heating, May–Aug cooling). Platforms like Angi ignore this; proactive budget adjustments retain clients. | LOW (process) | Cron job or admin alert for budget review in shoulder months (Sep, Apr). Not complex tech — discipline and process. |
| Per-campaign call tracking attribution | Angi shows you "you got 10 leads." Tradeflow shows you "5 leads from LSA spring AC tune-up campaign, 3 from missed-call text-back." | MEDIUM | Requires CallRail campaign tagging + UTM discipline on landing pages. Dashboard surfaces source column on every lead. |
| AI lead scoring (Phase 2) | Automatic triage of leads by urgency and job type (emergency repair vs. seasonal tune-up) changes revenue potential | HIGH | Deferred. LLM call to Claude API on call transcript or form data. Manual triage is sufficient for Phase 1. |
| AI voice agent for after-hours (Phase 2) | Answers calls at 11pm when no technician is available; books jobs without human intervention | HIGH | Deferred. Vapi.ai integration. Complex reliability requirements. |
| Automated review request (Phase 2) | After job marked "completed," send SMS asking for Google review. Directly improves LSA ranking. | MEDIUM | Deferred. GHL workflow trigger on status change. Status webhook needed first. |
| Weekly performance email digest (Phase 2) | Clients want to see the week's numbers without logging in | LOW | Deferred. Cron + Resend templated email. High retention value at low cost — build early in Phase 2. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem useful but introduce complexity, undermine the core model, or create operational debt.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Shared lead marketplace (Angi model) | Seems like more volume for less cost per lead | Destroys the exclusive-lead competitive advantage. Commoditizes Tradeflow's core differentiation. Race-to-the-bottom price competition among clients. | Maintain strict 1-lead-per-client-per-geography exclusivity. Charge premium for it. |
| Real-time chat / live inbox in dashboard | "I want to see SMS conversations" | Building a real-time messaging inbox is a full product. GHL already provides this in the sub-account UI. Replicating it is wasted effort. | Link clients to their GHL sub-account for direct message management. Dashboard shows log, not live inbox. |
| DIY campaign builder for clients | Power users want control over their own ads | HVAC owners are not marketers. Giving them controls increases support burden and leads to broken campaigns. Churn increases when clients self-sabotage. | Managed service model: Tradeflow makes all campaign decisions. Clients get reporting, not controls. |
| Per-lead billing model | "Pay only for what you get" sounds fair | Incentivizes gaming (inflated lead counts), makes revenue unpredictable, creates disputes on lead quality. Angi/HomeAdvisor have persistent bad reputation from this model. | Monthly retainer ($500–$1,500/mo) with included LSA ad spend. Simpler, predictable, builds client relationships. |
| Mobile native app | Clients ask for an app icon on their phone | Native app is an entirely separate build/deployment/review cycle. Web app is installable as PWA on mobile. No client at $500–$1,500/mo retainer justifies native app cost. | Progressive Web App (PWA) manifest. Works from home screen. No App Store required. |
| OAuth / Google SSO | "Can I log in with Google?" | Low-value feature for v1 audience of 2–5 person HVAC shops. Adds auth complexity. | Email/password + magic link for admin. HVAC owners don't expect SSO. |
| Multi-location support (chain HVAC) | Larger companies have 3–5 service areas | Out of scope for Chicagoland solo/small contractor target. Architecture could break with location-level sub-tenant model. | Serve one service area per account. If multi-location client emerges, treat each location as a separate client account (multiple retainers). |
| Facebook/Instagram ads integration | Contractors see Facebook as a channel | LSA has 4x ROAS vs Meta for HVAC in most markets. Facebook is Phase 2+ only after LSA is proven. Building dual ad channel management in Phase 1 dilutes focus. | LSA first. When revenue is generating, add Meta as a Phase 2 upsell. |

---

## Feature Dependencies

```
Landing Page (per client)
    └──requires──> Static generation at build time (ISR or build-time params)
                       └──enables──> Sub-2s mobile load (LSA quality requirement)

Lead Capture API
    └──requires──> Landing Page (form endpoint)
    └──requires──> Supabase (lead storage)
    └──requires──> GHL sub-account (contact sync)
    └──enables──> SMS follow-up sequence
    └──enables──> Owner email notification

CallRail Webhook
    └──requires──> CallRail number provisioned per client
    └──requires──> Webhook endpoint in FastAPI
    └──enables──> Missed-call text-back (GHL trigger)
    └──enables──> Call log in dashboard
    └──enables──> Call recording links

Missed-Call Text-Back
    └──requires──> CallRail webhook (to detect missed call)
    └──requires──> GHL sub-account (to fire SMS workflow)

Client Dashboard
    └──requires──> Supabase Auth + RLS (multi-tenancy)
    └──requires──> Lead records in Supabase
    └──enables──> Lead status pipeline
    └──enables──> Inline notes
    └──enables──> Call log view

Admin Panel
    └──requires──> Supabase Auth (admin role)
    └──requires──> Service role key (bypass RLS)
    └──enables──> Client onboarding (GHL sub-account creation)
    └──enables──> Cross-client lead visibility

Stripe Billing
    └──requires──> Stripe customer per client
    └──enables──> Subscription lifecycle webhooks
    └──enables──> Payment failure alerts (pause lead delivery on failure)

Google LSA Management (ops, not tech)
    └──enhances──> Landing Page (linked in LSA profile)
    └──enhances──> CallRail (LSA-tracked call number)
    └──enables──> Seasonal campaign adjustments

AI Lead Scoring (Phase 2)
    └──requires──> Call transcripts (CallRail) or form data (Supabase)
    └──requires──> Claude API integration
    └──enhances──> Lead status pipeline (auto-triage)

Review Request Automation (Phase 2)
    └──requires──> Lead status pipeline (triggers on "completed" status)
    └──requires──> GHL workflow
```

### Dependency Notes

- **Landing Page requires static generation:** ISR or `generateStaticParams` in Next.js 15 App Router. If rendered dynamically, load times will exceed 2s on mobile and hurt LSA quality score.
- **Missed-call text-back requires CallRail webhook:** The webhook detects the missed call event. Without it, GHL has no trigger. Both pieces must be in place simultaneously.
- **Client Dashboard requires RLS:** Multi-tenancy is not optional. If RLS is misconfigured, clients see each other's leads. Test this explicitly before any client goes live.
- **Stripe failure should gate lead delivery:** If a client's payment fails, pausing their LSA campaign and sending an alert before the dunning period ends prevents operating at a loss.
- **AI features require data accumulation:** Lead scoring and review automation both need reliable transcript and status data flowing first. Shipping AI features before Phase 1 data pipeline is stable creates noisy/wrong outputs.

---

## MVP Definition

### Launch With (v1)

Minimum required to close first paying clients and prove the model.

- [ ] Static landing page per HVAC client — required to run LSA; it's the destination URL
- [ ] Lead capture API (form → Supabase → GHL → email notification) — core promise: no lead lost
- [ ] CallRail webhook + missed-call text-back — highest ROI automation, proven in market
- [ ] Client dashboard with lead list + status pipeline — clients need proof the service works
- [ ] Supabase Auth + RLS — multi-tenancy is non-negotiable with paying clients
- [ ] Admin panel (onboard clients, view any client's leads) — operator control without manual DB queries
- [ ] Stripe billing + subscription webhooks — required to collect retainer fees
- [ ] GHL sub-account per client — isolation, SMS workflows, contact management

### Add After Validation (v1.x)

Features to add once first 2–3 paying clients are live and patterns emerge.

- [ ] SMS follow-up sequence (multi-step) — trigger: clients report leads not responding to single text-back
- [ ] Inline notes on lead records — trigger: clients ask "how do I add context to leads?"
- [ ] Call recording links in dashboard — trigger: clients want to replay calls, currently linking to CallRail directly
- [ ] Weekly performance email digest — trigger: clients not logging in regularly; digest drives retention
- [ ] Stripe customer portal link — trigger: clients ask about invoices or want to update card

### Future Consideration (v2+)

Defer until Phase 1 generates revenue and client patterns are understood.

- [ ] AI lead scoring (Claude API on transcripts) — defer: manual triage sufficient, data pipeline needs to mature first
- [ ] AI voice agent after-hours (Vapi.ai) — defer: high complexity, high churn risk if unreliable
- [ ] Automated review request on job completion — defer: requires status-change webhook; add when pipeline usage is consistent
- [ ] Facebook/Meta ads integration — defer: LSA must be proven before adding second ad channel
- [ ] Analytics charts / revenue dashboards — defer: lead counts satisfy v1 clients; charts are polish, not retention
- [ ] Multi-location / multi-vertical support — defer: focus on Chicagoland HVAC exclusivity first

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Static landing page per client | HIGH | LOW | P1 |
| Lead capture API | HIGH | LOW | P1 |
| Missed-call text-back | HIGH | MEDIUM | P1 |
| Client dashboard (lead list + pipeline) | HIGH | MEDIUM | P1 |
| Supabase Auth + RLS | HIGH | MEDIUM | P1 |
| Admin panel (onboard + view) | HIGH | MEDIUM | P1 |
| Stripe billing + webhooks | HIGH | MEDIUM | P1 |
| GHL sub-account per client | HIGH | MEDIUM | P1 |
| Real-time lead notification (email) | HIGH | LOW | P1 |
| CallRail call log in dashboard | MEDIUM | LOW | P2 |
| SMS follow-up sequence (multi-step) | HIGH | MEDIUM | P2 |
| Inline lead notes | MEDIUM | LOW | P2 |
| Weekly email digest | MEDIUM | LOW | P2 |
| Stripe customer portal link | LOW | LOW | P2 |
| AI lead scoring | HIGH | HIGH | P3 |
| AI voice agent (after-hours) | HIGH | HIGH | P3 |
| Automated review requests | MEDIUM | MEDIUM | P3 |
| Facebook ads integration | MEDIUM | HIGH | P3 |
| Analytics / revenue charts | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Angi / HomeAdvisor | ServiceTitan | Housecall Pro | Tradeflow Approach |
|---------|-------------------|--------------|---------------|-------------------|
| Lead exclusivity | Shared (3–8 contractors per lead) | N/A (field service mgmt, not lead gen) | N/A | Exclusive 1:1 — core differentiator |
| Lead cost model | Pay-per-lead ($45–$85 HVAC) + annual fee | Monthly subscription ($200–$600+/mo) | Monthly subscription ($49–$199/mo) | Monthly retainer includes LSA ad spend management |
| Missed-call text-back | None | Requires add-on/integration | Basic automated messages | GHL-native, fires within 15 seconds |
| Client dashboard | Basic leads list on contractor profile | Full FSM dashboard (complex) | Simplified FSM dashboard | Lead-focused, pipeline-centric, no bloat |
| Call tracking + recording | No per-campaign attribution | Integrates with call tracking tools | Limited | CallRail per campaign, recordings in dashboard |
| SMS follow-up sequences | None | Custom via integrations | Basic email/SMS | GHL multi-step workflow, stops on reply |
| LSA management | Self-serve only | Partners with LSA | Partners with LSA | Fully managed by Tradeflow operator |
| AI features | None | AI scheduling assistant (beta) | AI-powered review follow-up | Phase 2: lead scoring + voice agent |
| Setup effort for contractor | Self-serve (contractor does everything) | High (enterprise onboarding) | Medium | Zero — Tradeflow manages all setup |
| Geographic targeting | National, no exclusivity zones | N/A | N/A | Chicagoland exclusivity zones per client |

---

## Sources

- [Angi vs Thumbtack vs Exclusive Leads — Minyona](https://minyona.com/blog/angi-vs-thumbtack-vs-exclusive-leads) — MEDIUM confidence (single source, verified against LSA data)
- [LSA vs Thumbtack vs Angi Real CPL Data — Blue Grid Media](https://bluegridmedia.com/lsa-vs-thumbtack-vs-angi-contractors) — MEDIUM confidence (real cost data, single source)
- [GoHighLevel Missed Call Text Back Setup Guide 2026 — Automate the Journey](https://automatethejourney.com/blog/gohighlevel-missed-call-text-back) — HIGH confidence (platform documentation)
- [ServiceTitan vs Housecall Pro 2026 — FieldPulse](https://www.fieldpulse.com/resources/blog/servicetitan-vs-housecall-pro) — MEDIUM confidence (competitor-authored, directionally accurate)
- [GoHighLevel White Label Agency Setup 2026](https://ghl-services-playbooks-automation-crm-marketing.ghost.io/gohighlevel-white-label/) — MEDIUM confidence (GHL ecosystem blog, verified against pricing page)
- [Google LSA for Contractors Complete Guide 2026 — PushLeads](https://pushleads.com/google-local-services-ads-in-2026-the-complete-setup-and-optimization-guide-for-contractors/) — MEDIUM confidence (practitioner source)
- [Angi Leads Guide for Contractors 2026 — LeadTruffle](https://www.leadtruffle.co/blog/complete-guide-angi-leads-home-service-contractors-2026/) — MEDIUM confidence
- [CallRail Review 2026 — Research.com](https://research.com/software/reviews/callrail) — MEDIUM confidence
- [Are Angi Leads Worth It 2026 — Contracting Empire](https://contractingempire.com/is-angi-worth-it-for-contractors/) — LOW confidence (practitioner blog, directionally consistent with multiple sources)

---
*Feature research for: HVAC lead generation platform (Tradeflow)*
*Researched: 2026-03-25*
