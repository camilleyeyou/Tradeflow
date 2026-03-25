---
phase: 02-lead-pipeline
plan: "02"
subsystem: landing-pages
tags: [landing-page, lead-form, static-generation, react-hook-form, zod, tailwind]
dependency_graph:
  requires: ["02-01"]
  provides: ["landing-page-ui", "lead-form-component"]
  affects: ["02-03"]
tech_stack:
  added: []
  patterns:
    - generateStaticParams for static landing page generation (client x service cartesian product)
    - createClient from @supabase/supabase-js for build-time static data fetch (no cookies)
    - useForm + zodResolver for client-side form validation
    - fetch POST to /api/leads/submit for form submission
key_files:
  created:
    - apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx
    - apps/web/src/components/lead-form.tsx
  modified:
    - apps/web/src/app/(landing)/[clientSlug]/page.tsx
decisions:
  - "Used createClient from @supabase/supabase-js (not createServerClient) in generateStaticParams to avoid dynamic rendering — no cookies needed at build time"
  - "ShieldCheckIcon and StarIcon implemented as inline SVG components — no icon library import needed, keeps bundle small"
  - "service_area_zips handled as both string[] and string to be safe until Database types are generated"
metrics:
  duration_minutes: 2
  completed_date: "2026-03-25"
  tasks_completed: 2
  files_changed: 3
---

# Phase 02 Plan 02: Static Landing Pages and Lead Form UI Summary

Static landing pages at `/[clientSlug]/[service]` with hero, click-to-call, Zod-validated lead form, and trust signals; bare slug redirects to ac-repair.

## What Was Built

**Task 1: Static landing page with generateStaticParams**

Created `apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx` (173 lines) as a Server Component that:
- Exports `generateStaticParams` — queries active clients from Supabase at build time, returns cartesian product of `clientSlug x SERVICE_TYPES` (4 service slugs per client)
- Uses `createClient` from `@supabase/supabase-js` with anon key (no cookies, safe for static generation)
- Calls `notFound()` if client slug is invalid or service is not in SERVICE_TYPES
- Renders a hero section (bg-blue-900) with `{serviceLabel} in {client.city}` headline and click-to-call `<a href="tel:...">` button
- Renders `<LeadForm>` slot in a card section immediately below the hero
- Renders trust signals section: 5-star rating (inline SVG), license badge with business name, service area zip codes
- Contains no `<nav>` element per LAND-06

Updated `apps/web/src/app/(landing)/[clientSlug]/page.tsx` to call `redirect(`/${clientSlug}/ac-repair`)` — bare clientSlug URLs redirect to the ac-repair service page.

**Task 2: Lead capture form component**

Created `apps/web/src/components/lead-form.tsx` (154 lines) as a Client Component (`'use client'`) that:
- Uses `useForm<LeadFormValues>` with `zodResolver(leadSchema)` from `@/lib/validations/lead`
- Accepts `clientId` (hidden field) and `serviceType` (pre-fills the service_type select) as props
- Renders exactly 4 visible fields: homeowner_name (text), phone (tel), service_type (select with `SERVICE_TYPES` options), zip_code (text with inputMode="numeric")
- Tracks `isSubmitting`, `isSuccess`, `errorMessage` state
- Disables submit button while `isSubmitting` is true (frontend idempotency)
- On success: renders "We'll call you within 5 minutes" confirmation
- On error: displays error message in red text below the button
- POSTs JSON to `/api/leads/submit`

## Verification Results

- `generateStaticParams` present and imports `SERVICE_TYPES` from `@/lib/validations/lead` ✓
- `notFound()` called on invalid client/service ✓
- `href="tel:"` click-to-call button present ✓
- `LeadForm` rendered on landing page ✓
- No `<nav>` element ✓
- `'use client'` directive in lead-form.tsx ✓
- `zodResolver(leadSchema)` wired to form ✓
- `api/leads/submit` fetch target present ✓
- "We'll call you within 5 minutes" success text present ✓
- `npx tsc --noEmit` passes with 0 errors ✓

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — `LeadForm` POSTs to `/api/leads/submit` which is implemented in Plan 02-03. The form will return an error response until that route handler exists, but this is expected and by design per the wave-based execution order.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: Static landing page | 68f0c3a | apps/web/src/app/(landing)/[clientSlug]/[service]/page.tsx, apps/web/src/app/(landing)/[clientSlug]/page.tsx |
| Task 2: Lead form component | 8721d64 | apps/web/src/components/lead-form.tsx |

## Self-Check: PASSED
