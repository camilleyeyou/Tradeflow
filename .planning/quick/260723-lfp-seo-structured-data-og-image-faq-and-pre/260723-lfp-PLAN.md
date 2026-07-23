---
phase: quick-260723-lfp
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [SEO-AUDIT]
files_modified:
  - apps/web/src/app/layout.tsx
  - apps/web/src/app/opengraph-image.tsx
  - apps/web/src/app/robots.ts
  - apps/web/public/llms.txt
  - apps/web/next.config.ts
  - apps/web/src/lib/trades.ts
  - apps/web/src/app/(marketing)/page.tsx
  - apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx
  - apps/web/src/app/(marketing)/get-started/page.tsx
  - apps/web/README.md
  - CLAUDE.md
  - .planning/PROJECT.md
  - api/models/schemas.py

must_haves:
  truths:
    - "Social shares of the homepage render a branded 1200x630 OG card (dark bg, gold Trade/flow wordmark, tagline)"
    - "layout.tsx exposes openGraph + twitter metadata; existing title/description unchanged"
    - "Homepage emits one JSON-LD @graph (Organization, WebSite, 2x Service) with absolute URLs and zero fabricated data"
    - "Client landing pages emit per-trade LocalBusiness JSON-LD (HVACBusiness / Plumber) that omits any null field and only includes aggregateRating when both review fields are present and count > 0"
    - "Homepage shows a 6-item FAQ section between Tech Services and the final CTA, grounded only in on-page claims"
    - "robots.ts disallows /login; public/llms.txt exists; security headers applied site-wide; typecheck + build pass"
  artifacts:
    - path: "apps/web/src/app/opengraph-image.tsx"
      provides: "next/og ImageResponse OG card with size/alt/contentType exports"
    - path: "apps/web/public/llms.txt"
      provides: "LLM-facing site summary + key links"
    - path: "apps/web/src/lib/trades.ts"
      provides: "schemaType field per trade (HVACBusiness / Plumber)"
  key_links:
    - from: "apps/web/src/app/layout.tsx"
      to: "apps/web/src/app/opengraph-image.tsx"
      via: "file-based metadata auto-resolution (images omitted from openGraph so Next injects the generated image)"
    - from: "apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx"
      to: "apps/web/src/lib/trades.ts"
      via: "getTradeConfig(client.trade).schemaType drives JSON-LD @type"
---

<objective>
SEO / structured-data / presentation audit pass for the Tradeflow marketing + landing surfaces (quick task 260723-lfp). Follow-up to 260723-ih0 (HVAC + plumbing nationwide expansion + Tech Services section). The owner will demo the site to lenders/grant reviewers, so it must present impeccably and be machine-legible to search engines and LLMs.

Purpose: Add Open Graph / Twitter metadata, a branded OG share image, valid JSON-LD structured data (homepage + per-client landing pages), a visible FAQ, LLM/robots hints, security headers, and cleanup of stale HVAC-only copy across code and docs.

Output: Updated head/metadata + new OG image route, structured data on two page surfaces, a homepage FAQ, `llms.txt`, tightened `robots.ts`, security headers, and surgical copy/docs edits. Zero fabricated data in any JSON-LD.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

<interfaces>
<!-- Trade config is the source of truth. Extend it — do not duplicate. -->
From apps/web/src/lib/trades.ts:
```typescript
export type Trade = 'hvac' | 'plumbing'
export interface TradeConfig {
  trade: Trade
  label: string
  defaultService: string
  services: ServiceDef[]
  scoringDomain: string
  scoringEmergencyExamples: string
}
export function getTradeConfig(trade: string | null | undefined): TradeConfig // defaults to hvac
export function getServiceLabel(trade, slug): string
export function isValidServiceForTrade(trade, slug): boolean
```

Landing page already fetches (see (landing)/[clientSlug]/[service]/page.tsx):
`id, business_name, phone, city, service_area_zips, slug, review_rating, review_count, trade`
- `service_area_zips` may be `string[]` OR a single string (existing code branches on Array.isArray).
- `hasReviews = client.review_rating != null && client.review_count != null` already exists.
- NOTE: the query does NOT select a state/region column — do NOT emit addressRegion (omit it; never fabricate).

Root layout.tsx current metadata (KEEP title/description verbatim):
```typescript
metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
title: "Tradeflow — AI-powered lead generation for HVAC & plumbing companies",
description: "Tradeflow captures every call, form, and missed contact — then follows up automatically so home service companies never lose a lead. We also build custom websites, AI automation, and software.",
```

next.config.ts current shape (preserve the Sentry wrapper — add headers() INSIDE the base object):
```typescript
const nextConfig: NextConfig = { /* config options here */ };
export default withSentryConfig(nextConfig, { silent: true });
```
</interfaces>

Absolute-URL base for all structured data / links:
`process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tradeflow-technologies.com'`
Contact email: `hello@tradeflow-technologies.com`. Logo: `${base}/logo-icon.svg`.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Site metadata, OG image, robots, llms.txt, security headers</name>
  <files>apps/web/src/app/layout.tsx, apps/web/src/app/opengraph-image.tsx, apps/web/src/app/robots.ts, apps/web/public/llms.txt, apps/web/next.config.ts</files>
  <action>
Site-wide SEO/head/security infra. No page-body or JSON-LD changes here.

1. **layout.tsx** — extend the exported `metadata` object. KEEP the existing `metadataBase`, `title`, and `description` exactly as-is. ADD:
   - `openGraph`: `{ type: 'website', siteName: 'Tradeflow', url: '/', title: <same string as metadata.title>, description: <same string as metadata.description> }`. Do NOT set `openGraph.images` — Next auto-resolves it from the sibling `opengraph-image.tsx` (Item spec: "images auto-resolved from opengraph-image").
   - `twitter`: `{ card: 'summary_large_image', title: <same title>, description: <same description> }`.

2. **opengraph-image.tsx** (NEW, at `apps/web/src/app/opengraph-image.tsx` — app root, so it applies to all routes) using `next/og`:
   - `import { ImageResponse } from 'next/og'`
   - `export const alt = 'Tradeflow — AI-powered lead generation for HVAC & plumbing companies'`
   - `export const size = { width: 1200, height: 630 }`
   - `export const contentType = 'image/png'`
   - `export default async function Image() { return new ImageResponse(<JSX>, { ...size }) }`
   - Do NOT set `export const runtime = 'edge'` — default nodejs is correct for Next 15.
   - Design (pure JSX + inline styles ONLY; ImageResponse supports flexbox only — every element with >1 child MUST have `display: 'flex'`; use a system font stack, no external fonts):
     - Root: 1200x630, `display: 'flex'`, `flexDirection: 'column'`, `alignItems: 'center'`, `justifyContent: 'center'`, `background: '#050505'`, with a subtle gold radial glow (e.g. `backgroundImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(212,175,55,0.10), transparent)'`).
     - Wordmark row (`display: 'flex'`): "Trade" in white + "flow" in gold `#D4AF37`, large (~110px), bold, serif-leaning system stack (`Georgia, serif`), `letterSpacing: '-0.03em'`.
     - Tagline below: "AI-powered lead generation for HVAC & plumbing companies" in `rgba(255,255,255,0.55)`, ~34px.
   - Keep it self-contained (no imports beyond `next/og`).

3. **robots.ts** — add `'/login'` to the `disallow` array → `['/dashboard', '/admin', '/api', '/login']`. Leave `allow`, `userAgent`, and `sitemap` untouched.

4. **public/llms.txt** (NEW) — short markdown:
   - `# Tradeflow`
   - One-paragraph summary: AI-powered lead generation for HVAC & plumbing companies across the US (managed Google LSA ads, missed-call text-back, SMS follow-up, call tracking, private lead dashboard), plus a tech-services offering (custom websites, AI automation, custom software, CRM setup).
   - A `## Key links` list (use absolute URLs off `https://www.tradeflow-technologies.com`): `/` (marketing homepage), `/get-started` (start a free trial), `/privacy` (privacy policy), `/terms` (terms) — each with a one-line description.
   - Contact line: `hello@tradeflow-technologies.com`.

5. **next.config.ts** — add an `async headers()` method INSIDE the base `nextConfig` object (the one `withSentryConfig` wraps — do NOT unwrap or bypass Sentry). Return a single rule for `source: '/(.*)'` with headers:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   No CSP (out of scope — could break Sentry/Next inline scripts).
  </action>
  <verify>
    <automated>cd apps/web && npx tsc --noEmit</automated>
  </verify>
  <done>metadata has openGraph + twitter (title/description unchanged); opengraph-image.tsx compiles and exports size/alt/contentType + a default ImageResponse; robots disallows /login; public/llms.txt exists; next.config.ts adds the four security headers while preserving withSentryConfig; tsc clean.</done>
</task>

<task type="auto">
  <name>Task 2: JSON-LD structured data (homepage + landing pages) + homepage FAQ</name>
  <files>apps/web/src/lib/trades.ts, apps/web/src/app/(marketing)/page.tsx, apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx</files>
  <action>
Structured data on two surfaces + the visible FAQ. Both pages are server components — inline JSON-LD via `dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}` and native `<details>` are safe. ZERO fabricated data — omit any field whose source value is null/absent. NO FAQPage schema, NO HowTo schema.

**A. trades.ts** — add a `schemaType: string` field to the `TradeConfig` interface, and set it on both entries:
   - `hvac.schemaType = 'HVACBusiness'`
   - `plumbing.schemaType = 'Plumber'`
   (Both are valid schema.org LocalBusiness subtypes.) Do not change anything else.

**B. (marketing)/page.tsx** — three edits:
   1. **JSON-LD @graph.** Above the `return`, build `const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tradeflow-technologies.com'` and a `jsonLd` object:
      ```
      { '@context': 'https://schema.org', '@graph': [
        { '@type': 'Organization', '@id': `${base}#organization`, name: 'Tradeflow', url: base,
          logo: `${base}/logo-icon.svg`, email: 'hello@tradeflow-technologies.com',
          description: 'AI-powered lead generation for HVAC & plumbing companies across the US, plus custom websites, AI automation, and software.' },
        { '@type': 'WebSite', '@id': `${base}#website`, name: 'Tradeflow', url: base,
          publisher: { '@id': `${base}#organization` } },
        { '@type': 'Service', '@id': `${base}#service-leadgen`,
          serviceType: 'Lead generation for home service businesses',
          provider: { '@id': `${base}#organization` }, areaServed: 'US',
          description: 'Managed Google Local Services Ads, missed-call text-back, SMS follow-up sequences, and call tracking for HVAC & plumbing companies.' },
        { '@type': 'Service', '@id': `${base}#service-tech`,
          serviceType: 'Custom software & technology services',
          provider: { '@id': `${base}#organization` }, areaServed: 'US',
          description: 'Custom websites & landing pages, AI automation & chatbots, custom software & apps, and CRM & integrations setup.' },
      ] }
      ```
      Render `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />` as the first child inside the root `<div>`. Do NOT add FAQPage/HowTo.
   2. **FAQ section.** Insert a new `<section id="faq" ...>` BETWEEN the Tech Services `</section>` (`id="tech-services"`, ends ~line 510) and the Final CTA `<section ...>` (~line 512). Match the existing dark-theme pattern: outer `className="px-6 py-24"` (alternate the `style={{ background: '#050505' }}` vs plain-black rhythm — Tech Services is `#050505`, so make FAQ plain black), inner `max-w-3xl mx-auto`, a centered header using the existing `GoldBadge` ("FAQ") + a Gambetta serif `<h2>` ("Frequently asked questions") copied from sibling sections' class/style. Render the 6 Q&As as native `<details>` / `<summary>` elements styled to match (rounded cards `rgba(255,255,255,0.02)` bg, `1px solid rgba(255,255,255,0.06)` border; summary in white ~15px semibold with `cursor-pointer` and `list-none`; answer body in `text-white/40 text-[13px] leading-relaxed`). Grounded ONLY in claims already on the page — do NOT invent facts:
      - (a) "What trades do you work with?" → HVAC and plumbing companies across the United States.
      - (b) "How does the 2-week free trial work?" → 2-week free trial + $200 in ad spend on us, no contracts.
      - (c) "How is pricing structured?" → Starter $500/mo, Growth $1,500/mo, or Pay Per Lead at $75 per qualified lead.
      - (d) "What happens when I miss a call?" → automated text-back in under 60 seconds, branded with your company name.
      - (e) "Are leads shared with other companies?" → No — leads are 100% exclusive, never shared.
      - (f) "Can you build our website or custom software too?" → Yes — the tech-services team builds custom websites & landing pages, AI automation & chatbots, custom software & apps, and CRM & integrations setup.
      Also add a nav link: in the `<nav>` link cluster, after the existing `#tech-services` "Tech services" anchor, add an `<a href="#faq">FAQ</a>` using the IDENTICAL className string as its siblings (the `hidden sm:inline text-[13px] ...` pattern). This fits the existing nav without crowding.
   3. **Alt-text fix** (~line 213): change the Google LSA image alt from "...showing your HVAC company at the top..." to "...showing your company at the top...".

**C. (landing)/[clientSlug]/[service]/page.tsx** — emit per-trade LocalBusiness JSON-LD. After the existing data fetch + guards (where `serviceLabel`, `formattedPhone`, `serviceAreaText`, `hasReviews` are computed), build the object with graceful degradation (conditional spreads — never emit null/undefined keys):
   - `const cfg = getTradeConfig(client.trade as string)` (already imported).
   - `const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tradeflow-technologies.com'`.
   - Normalize zips to an array: reuse the same `Array.isArray(client.service_area_zips)` branch already used for `serviceAreaText` (when it's a single string, wrap/split into a one-element array or split on non-digits — keep it simple: if array use as-is, else `[client.service_area_zips]`). Map each to `{ '@type': 'PostalCode', postalCode: zip }`, filtering falsy entries.
   - Base object:
     ```
     { '@context': 'https://schema.org', '@type': cfg.schemaType,
       name: client.business_name, telephone: client.phone,
       url: `${base}/${clientSlug}/${service}`,
       address: { '@type': 'PostalAddress', addressLocality: client.city }, // NO addressRegion — not fetched
       areaServed: <postalCodes array, only if non-empty> }
     ```
   - Add `aggregateRating` ONLY when `client.review_rating != null && client.review_count != null && (client.review_count as number) > 0`:
     `{ '@type': 'AggregateRating', ratingValue: client.review_rating, reviewCount: client.review_count, bestRating: 5 }`.
   - Omit `areaServed` if the postalCodes array is empty. Omit any optional key whose value is null.
   - Render `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />` inside the returned `<main>` (first child is fine).
   - No sameAs, no founding date, no employee counts, no fabricated address/phone/rating.
  </action>
  <verify>
    <automated>cd apps/web && npx tsc --noEmit</automated>
  </verify>
  <done>trades.ts has schemaType (HVACBusiness/Plumber); homepage renders one @graph JSON-LD block + a 6-item native-details FAQ between Tech Services and Final CTA + FAQ nav link + corrected alt text; landing page emits per-trade LocalBusiness JSON-LD that omits addressRegion, omits empty areaServed, and includes aggregateRating only when both review fields are present and count > 0; tsc clean.</done>
</task>

<task type="auto">
  <name>Task 3: Copy + docs cleanup, final build gate</name>
  <files>apps/web/src/app/(marketing)/get-started/page.tsx, apps/web/README.md, CLAUDE.md, .planning/PROJECT.md, api/models/schemas.py</files>
  <action>
Surgical text/docs edits only — no logic changes. Keep all edits minimal and in-place.

1. **get-started/page.tsx** — two input placeholders:
   - Company-name placeholder `"Smith HVAC"` → `"Smith Plumbing & Heating"`.
   - Email placeholder `"jane@smithhvac.com"` → `"jane@smithplumbing.com"`.

2. **apps/web/README.md** — surgical HVAC-only → HVAC & plumbing / nationwide reframing (do NOT rewrite the whole README):
   - Line ~3 intro: "starting with **HVAC contractors in the Chicagoland area**" → HVAC & plumbing framing, nationwide (e.g. "for home-service businesses — HVAC and plumbing companies across the United States").
   - Line ~5: "HVAC companies pay a monthly retainer" → "HVAC and plumbing companies pay a monthly retainer"; and "routed to the right contractor" is fine to keep.
   - `(landing)` section heading (~line 101): "public, one per HVAC client" → "public, one per client (HVAC or plumbing)".
   - Landing route description (~line 106): note the trade config drives services — mention `src/lib/trades.ts` and the `clients.trade` column (services are now per-trade, not HVAC-only).
   - `clients` table row (~line 248): "One row per HVAC company" → "One row per client company (HVAC or plumbing)"; mention the `trade` column (e.g. `hvac` / `plumbing`) drives which service slugs apply.
   - Footnote (~line 347): "HVAC client landing pages" → "client landing pages".
   Leave everything else (env vars, migrations list, architecture ASCII beyond the wording above) intact.

3. **CLAUDE.md (root)** — in the `## Project` section, update the two product-description sentences: "starting with HVAC contractors in the Chicagoland area (Chicago city + suburbs)" → HVAC and plumbing companies across the United States; and note the added tech-services offering on the marketing site (custom websites, AI automation, custom software, CRM setup). Update the stale "Phase 1 MVP" / "Phase discipline" framing ONLY if trivially safe in one line — otherwise leave it untouched.

4. **.planning/PROJECT.md** — the "Out of Scope" entry (~line 60) `"Plumbing/roofing vertical expansion — Phase 3"`: annotate that plumbing shipped 2026-07-23 via quick task 260723-ih0 (roofing remains out of scope). Keep it a single in-line annotation, e.g. append "(plumbing shipped 2026-07-23 via quick task 260723-ih0; roofing still out of scope)".

5. **api/models/schemas.py** — update the HVAC-only `service_type` comment (currently `# ac_repair | furnace_repair | installation | maintenance | other`) to list BOTH trades' real service slugs from trades.ts: `ac-repair | furnace-repair | installation | maintenance | drain-cleaning | water-heater-repair | leak-repair | emergency-plumbing`. Comment only — do not change the field or add validation.

Final gate: run the full production build to confirm all routes (including the new `opengraph-image` route) compile and generate.
  </action>
  <verify>
    <automated>cd apps/web && npx tsc --noEmit && npm run build</automated>
  </verify>
  <done>get-started placeholders reference plumbing; README/CLAUDE/PROJECT/schemas.py reframed to HVAC & plumbing nationwide with no stale HVAC-only-Chicagoland claims in the edited lines; `npm run build` succeeds and generates the opengraph-image route.</done>
</task>

</tasks>

<verification>
- `cd apps/web && npx tsc --noEmit` clean after each task.
- `cd apps/web && npm run build` succeeds as the final gate; build output lists an `opengraph-image` route and the marketing/landing routes still generate.
- Manual sanity (optional): view-source of `/` shows one `application/ld+json` @graph block and a visible FAQ; a landing page's source shows a single LocalBusiness block whose `@type` matches the client's trade, with no null-valued keys and aggregateRating present only when reviews exist.
- No fabricated data anywhere in JSON-LD (no invented address/phone/rating/sameAs/founding date/employee count).
</verification>

<success_criteria>
- Homepage social shares render the branded OG card; layout metadata carries openGraph + twitter with title/description unchanged.
- Homepage emits a valid @graph (Organization, WebSite, 2× Service) and shows a 6-item FAQ grounded in on-page claims; no FAQPage/HowTo schema.
- Landing pages emit per-trade LocalBusiness JSON-LD that degrades gracefully (omits null fields, omits empty areaServed, conditional aggregateRating).
- robots disallows /login; llms.txt present; four security headers applied site-wide (Sentry wrapper preserved).
- All stale HVAC-only / Chicagoland copy in the specified code + docs lines reframed to HVAC & plumbing nationwide (+ tech services).
- `npx tsc --noEmit` and `npm run build` both pass.
</success_criteria>

<output>
After completion, create `.planning/quick/260723-lfp-seo-structured-data-og-image-faq-and-pre/260723-lfp-SUMMARY.md`.
</output>
