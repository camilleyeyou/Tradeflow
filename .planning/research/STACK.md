# Stack Research

**Domain:** AI-powered lead generation platform for home service (HVAC) businesses
**Researched:** 2026-03-25
**Confidence:** HIGH (core decisions pre-validated by project team; versions verified against official sources)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.5.x | Frontend framework — landing pages, dashboard, admin | App Router + static generation for landing pages (sub-2s on mobile); ISR and SSG for HVAC client pages; single deployment covers all three site surfaces |
| React | 19.x | UI runtime (bundled with Next.js 15) | Required by Next.js 15; concurrent features improve dashboard responsiveness; fully supported by shadcn/ui |
| Tailwind CSS | 4.x | Utility-first styling | Zero-config with Next.js 15.3+; no `tailwind.config.js` needed; auto-scans project; first-party PostCSS plugin via `@tailwindcss/postcss` |
| shadcn/ui | latest (CLI-driven) | Component library | Not a package — CLI copies components into your repo; full React 19 + Tailwind v4 support as of May 2025; ideal for dashboard tables, forms, status badges |
| FastAPI | 0.135.x | Backend API service — webhooks, cron jobs, GHL orchestration | Async-first Python framework; handles CallRail + Stripe + GHL webhooks without blocking; Railway deployment is first-class supported |
| Python | 3.12 | Runtime for FastAPI | Production-stable; FastAPI supports up to 3.14; 3.12 has widest package compatibility on Railway |
| Pydantic | 2.x | Request/response validation in FastAPI | Ships with FastAPI; v2 is 5–50x faster than v1 (Rust core); Pydantic v1 support deprecated — never use it |
| Supabase | managed (no version pinned) | Postgres database + Auth + RLS | Managed Postgres with Auth and Row Level Security built in; eliminates auth boilerplate; `@supabase/supabase-js` v2.99.x + `@supabase/ssr` for Next.js |
| Vercel | managed | Hosting for Next.js app | Zero-config Next.js deployment; edge CDN for static landing pages; ISR for any content that needs background regeneration |
| Railway | managed | Hosting for FastAPI service | Native FastAPI template; auto-detects Python apps; handles environment variables, scaling, and health checks with minimal config |

### Third-Party Services

| Service | Version/API | Purpose | Why Recommended |
|---------|-------------|---------|-----------------|
| GoHighLevel (GHL) | API v2 | CRM, SMS automation, sub-account per HVAC client | Handles missed-call text-back and SMS sequences out of the box — no need to build from scratch; sub-accounts isolate client contacts |
| CallRail | API v3 | Call tracking, recording, missed-call detection | Industry standard for LSA call tracking; provides webhook events for pre-call, post-call, and missed-call; API base URL `https://api.callrail.com/v3` |
| Stripe | stripe-node 20.x | Subscription billing, invoices, payment failure alerts | Most mature billing SDK; strong webhook signature verification; subscription lifecycle events are well-documented |
| Resend | resend 6.9.x (Node.js SDK) | Transactional email (lead notifications to HVAC owners) | Developer-first API; React Email component support; trivial to integrate with Next.js and Node.js |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/supabase-js` | 2.99.x | Supabase client for browser and server | All Supabase queries: auth, database reads/writes from Next.js |
| `@supabase/ssr` | latest | SSR-safe Supabase client for Next.js | Required for cookie-based auth in App Router; replaces deprecated `auth-helpers-nextjs` |
| `react-hook-form` | 7.x | Lead capture form state management | Pairs with Zod for client + server validation; works with Server Actions and `useActionState` |
| `zod` | 3.x | Schema validation (shared between frontend and FastAPI) | Single schema validates form on client and server action; use `z.object()` for lead form fields |
| `@hookform/resolvers` | 3.x | Bridge between react-hook-form and Zod | Required to plug Zod schema into RHF `resolver` prop |
| `httpx` | 0.27.x | Async HTTP client for FastAPI → GHL/CallRail API calls | Async-native; use `AsyncClient` in FastAPI lifespan context; do not use `requests` (blocks event loop) |
| `uvicorn` | 0.30.x | ASGI server for FastAPI on Railway | Standard production ASGI server; use `uvicorn[standard]` for production extras |
| `python-dotenv` | 1.x | Load `.env` files in FastAPI dev environment | Dev only; Railway injects env vars directly in production |
| `stripe` (Python) | 10.x | Stripe webhook verification in FastAPI | Use Python SDK in FastAPI for webhook signature verification, not the Node SDK |
| `supabase` (Python) | 2.x | Supabase client for FastAPI service | FastAPI writes leads to Supabase using service role key (bypasses RLS for admin writes) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript | 5.x | Type safety across all Next.js code | Enable strict mode; use typed routes (Next.js 15 supports typed route params) |
| ESLint | 9.x | Linting — Next.js config deprecates `next lint` in 15.5 | Use `eslint-config-next`; note that `next lint` CLI command is deprecated in 15.5 — migrate to standalone `eslint` |
| Prettier | 3.x | Code formatting | Install `prettier-plugin-tailwindcss` to auto-sort Tailwind classes |
| `@types/node` | 22.x | Node type definitions | Match your Node.js runtime version on Vercel |

---

## Installation

```bash
# Next.js project (creates new app)
npx create-next-app@15 tradeflow-web --typescript --tailwind --app --src-dir

# Core dependencies — Next.js app
npm install @supabase/supabase-js @supabase/ssr
npm install react-hook-form zod @hookform/resolvers
npm install stripe resend

# shadcn/ui (interactive CLI — run after project creation)
npx shadcn@latest init

# Dev dependencies
npm install -D prettier prettier-plugin-tailwindcss
```

```bash
# FastAPI project (Python — use a virtual environment)
pip install "fastapi[standard]"        # includes uvicorn, pydantic v2
pip install httpx supabase stripe
pip install python-dotenv
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 15 (App Router) | Remix | If you need full progressive enhancement and more granular loader/action model; not warranted for this project size |
| FastAPI | Express.js / Node.js backend | If you want a single language stack; FastAPI wins here because Python has better async webhook processing and future LLM integration (Phase 2 uses Claude API) |
| Supabase | Prisma + PlanetScale / Neon | If you need more complex migrations or prefer explicit ORM; Supabase's built-in Auth + RLS eliminates significant boilerplate for multi-tenant apps |
| Supabase Auth | NextAuth / Auth.js | If you need OAuth providers; Supabase Auth covers email/password and magic link, which is all v1 requires |
| Resend | SendGrid / Postmark | If you need bulk marketing emails; Resend is simpler and cheaper for transactional-only use cases |
| Tailwind CSS v4 | Tailwind CSS v3 | If you need to support browsers older than ~3 years; v4 has limited fallback for very old browsers |
| shadcn/ui | MUI / Chakra UI | If you need an opinionated design system with theming tokens; shadcn gives full ownership of components — no version lock-in |
| Railway (FastAPI) | Fly.io / AWS Lambda | Fly.io if you need global edge workers; Lambda if you want pure serverless; Railway is simpler for a persistent FastAPI process that holds a DB connection pool |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@supabase/auth-helpers-nextjs` | Officially deprecated — replaced by `@supabase/ssr`; causes session refresh bugs in App Router | `@supabase/ssr` + `createServerClient` / `createBrowserClient` |
| `supabase.auth.getSession()` in Server Components | Does not revalidate the auth token — can serve stale sessions | `supabase.auth.getUser()` — sends request to Auth server every time |
| Module-level Supabase client initialization in Next.js | Vercel Fluid compute can reuse warm instances across requests, causing session leaks between users | Initialize Supabase client inside the request handler (Server Component, Route Handler, or middleware) |
| Supabase `service_role` key in any browser-side code | Bypasses RLS entirely — any user could read all tenants' data | Keep `service_role` only in FastAPI or Next.js Route Handlers; use anon key on client |
| GHL API v1 | Reached end-of-support; no new features; existing integrations may break | GHL API v2 (migrate now — v1 connections still work but are not maintained) |
| `requests` library in FastAPI async routes | Synchronous — blocks the async event loop; kills throughput under concurrent webhook load | `httpx.AsyncClient` with `async with` |
| Pydantic v1 syntax in FastAPI | FastAPI has deprecated v1 support; will be removed in a future FastAPI release | Pydantic v2 — use `model_config = ConfigDict(...)` instead of `class Config` |
| `export const dynamic = 'force-static'` on auth-gated pages | ISR caches Set-Cookie headers; subsequent users receive someone else's session token | Use `export const dynamic = 'force-dynamic'` on all authenticated dashboard/admin routes |
| `cookies()` / `headers()` called synchronously in Next.js 15 | Next.js 15 made these async; synchronous access throws in Next.js 16 (currently deprecated warnings) | `await cookies()`, `await headers()` |

---

## Stack Patterns by Variant

**Landing pages (HVAC client sites):**
- Use `generateStaticParams` to pre-render one page per client at build time
- Fetch client data from Supabase at build time — pages require no auth, no dynamic data
- Revalidate with ISR on `next.revalidate` tag when client onboarding updates their info
- Do NOT put auth middleware on these routes

**Dashboard and admin pages:**
- Mark all routes `export const dynamic = 'force-dynamic'` to prevent ISR session leaks
- Initialize Supabase client with `createServerClient` inside each Server Component or Route Handler
- Use `supabase.auth.getUser()` (not `getSession()`) for every auth check
- RLS enforces data isolation at the database layer; trust it but also enforce at the API layer

**Webhook endpoints (FastAPI):**
- Verify signatures before processing: Stripe (`stripe.Webhook.construct_event`), GHL (`X-GHL-Signature` with Ed25519 — legacy `X-WH-Signature` deprecated July 2026), CallRail (API token header)
- Return `200 OK` immediately after signature check; process in background task (`BackgroundTasks`)
- GHL only allows one webhook URL per app — use a single endpoint and route by `event_type` field

**GoHighLevel sub-account pattern:**
- Create one GHL sub-account per HVAC client during onboarding
- Use Private Integration Token scoped to Sub-Account for all per-client operations
- Rate limit: 100 requests / 10 seconds per resource — batch contact lookups, don't fire individual requests per lead in a loop

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15.5.x | React 19.x | React 19 is bundled; shadcn/ui peer dep warnings during install — use `--legacy-peer-deps` flag |
| Tailwind CSS v4 | Next.js 15.3+ | Zero-config via `@tailwindcss/postcss`; no `tailwind.config.js` needed; confirm `postcss.config.mjs` uses `@tailwindcss/postcss` not `tailwindcss` |
| shadcn/ui | Tailwind v4 + React 19 | Fully compatible as of May 2025; run `npx shadcn@latest init` after upgrading |
| `@supabase/ssr` | Next.js 15 App Router | Requires middleware to refresh tokens — do not skip the `middleware.ts` step |
| FastAPI 0.135.x | Pydantic 2.x | Pydantic v1 syntax will raise deprecation warnings and be removed; use v2 from day one |
| Stripe Node SDK 20.x | Node.js 18+ | Node 16 deprecated in stripe-node; Vercel runs Node 20 by default — no issue |
| GHL API v2 webhook signatures | Transition period | Support both `X-GHL-Signature` (Ed25519) and `X-WH-Signature` (RSA) until July 1, 2026 deprecation |

---

## Sources

- [Next.js 15.5 Release Blog](https://nextjs.org/blog/next-15-5) — versions, Turbopack beta, Node.js middleware stable — HIGH confidence
- [Next.js Upgrading to v15 Guide](https://nextjs.org/docs/app/guides/upgrading/version-15) — async APIs, caching breaking changes — HIGH confidence
- [Supabase SSR Next.js Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — `getUser()` vs `getSession()`, cookie patterns — HIGH confidence
- [Supabase RLS Best Practices (makerkit.dev)](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) — production multi-tenant patterns — MEDIUM confidence
- [GHL Developer Portal](https://marketplace.gohighlevel.com/docs/) — API v2, sub-account creation, rate limits — HIGH confidence
- [GHL Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html) — signature migration (`X-GHL-Signature` Ed25519), deprecation July 2026 — HIGH confidence
- [CallRail API v3 Docs](https://apidocs.callrail.com/) — webhook events, API auth — HIGH confidence
- [Stripe Node SDK Releases](https://github.com/stripe/stripe-node/releases) — version 20.4.0 confirmed — HIGH confidence
- [Resend Node.js SDK npm](https://www.npmjs.com/package/resend) — version 6.9.4 confirmed — HIGH confidence
- [FastAPI Release Notes](https://fastapi.tiangolo.com/release-notes/) — 0.135.x, Pydantic v2 default — HIGH confidence
- [Railway FastAPI Deployment Guide](https://docs.railway.com/guides/fastapi) — deployment patterns, health checks — HIGH confidence
- [shadcn/ui React 19 Compatibility](https://ui.shadcn.com/docs/react-19) — peer dep resolution, Tailwind v4 support — HIGH confidence
- [Tailwind CSS v4 + Next.js Install Guide](https://tailwindcss.com/docs/guides/nextjs) — postcss config, zero-config approach — HIGH confidence

---

*Stack research for: Tradeflow — HVAC lead generation platform*
*Researched: 2026-03-25*
