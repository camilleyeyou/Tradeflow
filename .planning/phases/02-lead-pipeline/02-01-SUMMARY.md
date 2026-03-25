---
phase: 02-lead-pipeline
plan: "01"
subsystem: foundation-artifacts
tags: [database, zod, ghl, npm, migration]
dependency_graph:
  requires: []
  provides:
    - slug column on clients table (for landing page routing)
    - Zod lead form schema (for lead submit API)
    - GHL API v2 client (for contact creation + workflow enrollment)
    - npm dependencies (react-hook-form, zod, @hookform/resolvers, resend)
  affects:
    - 02-02 (landing page uses slug)
    - 02-03 (lead submit API uses leadSchema + GHL client)
    - 02-04 (form UI uses react-hook-form + Zod)
tech_stack:
  added:
    - zod 3.x (validation schema shared between client and server)
    - react-hook-form 7.x (lead form state management)
    - "@hookform/resolvers 3.x (Zod + RHF bridge)"
    - resend 6.9.x (transactional email)
  patterns:
    - GHL API v2 at services.leadconnectorhq.com with Version header 2021-07-28
    - Zod schema with z.string().uuid for hidden client_id, z.enum for service_type
    - SQL migration: ADD COLUMN IF NOT EXISTS + backfill UPDATE + SET NOT NULL
key_files:
  created:
    - supabase/migrations/002_add_slug_to_clients.sql
    - apps/web/src/lib/validations/lead.ts
    - apps/web/src/lib/ghl.ts
  modified:
    - apps/web/package.json (added 4 new dependencies)
    - apps/web/package-lock.json
decisions:
  - GHL client uses Bearer token auth with per-request token passed as parameter (not module-level singleton) to support per-client sub-account tokens
  - lookupContactByPhone returns first match for idempotency (D-14 compliance)
  - addContactToWorkflow sends eventStartTime as ISO string per GHL API v2 requirement
  - ghlFetch throws on non-2xx; callers catch and return null/false (fail-safe for non-blocking lead submission)
metrics:
  duration: "155 seconds"
  completed_date: "2026-03-25"
  tasks_completed: 2
  files_created: 3
  files_modified: 2
---

# Phase 02 Plan 01: Foundation Artifacts Summary

**One-liner:** Slug migration with backfill, Zod lead form schema (5 fields), GHL API v2 client (3 functions), and 4 npm package installs — everything subsequent plans depend on.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create slug migration, Zod schema, install npm deps | 867d9b2 | supabase/migrations/002_add_slug_to_clients.sql, apps/web/src/lib/validations/lead.ts, apps/web/package.json |
| 2 | Create GHL API v2 client library | 50835da | apps/web/src/lib/ghl.ts |

## What Was Built

### 1. Slug Migration (`supabase/migrations/002_add_slug_to_clients.sql`)

Adds `slug text UNIQUE` to the `public.clients` table. Migration includes:
- `ADD COLUMN IF NOT EXISTS slug text UNIQUE` (idempotent — safe to re-run)
- `UPDATE ... SET slug = trim(both '-' from regexp_replace(...))` backfills existing rows from `business_name`
- `ALTER COLUMN slug SET NOT NULL` enforces required for all future inserts

### 2. Zod Lead Schema (`apps/web/src/lib/validations/lead.ts`)

Exports `leadSchema`, `LeadFormValues`, and `SERVICE_TYPES`:
- `client_id`: `z.string().uuid()` — hidden field set by the landing page
- `homeowner_name`: min 2, max 100 characters
- `phone`: regex `/^\+?1?\d{10}$/` — accepts 10-digit US numbers with optional +1 prefix
- `service_type`: `z.enum(['ac-repair', 'furnace-repair', 'installation', 'maintenance'])`
- `zip_code`: regex `/^\d{5}$/` — strict 5-digit zip

### 3. GHL API v2 Client (`apps/web/src/lib/ghl.ts`)

Three exported functions for use in the lead submit Route Handler:
- `createGHLContact(input)` — `POST /contacts/` with `locationId`, `firstName`, `lastName`, `phone`; returns `contact.id` or `null`
- `lookupContactByPhone(phone, locationId, token)` — `GET /contacts/?locationId=...&phone=...`; returns first contact ID or `null` (D-14 idempotency)
- `addContactToWorkflow(contactId, workflowId, token)` — `POST /contacts/{contactId}/workflow/{workflowId}` with `eventStartTime`; returns `true` or `false`

All functions catch errors and return `null`/`false` to allow the lead submit handler to continue even if GHL is unavailable.

### 4. npm Dependencies (apps/web)

Installed via `npm install --legacy-peer-deps`:
- `react-hook-form` — lead form state management
- `zod` — schema validation (client + server)
- `@hookform/resolvers` — Zod resolver bridge for RHF
- `resend` — transactional email SDK

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| GHL token passed per-function, not module-level | Supports per-client sub-account tokens (D-22); no singleton state in server-side module |
| `ghlFetch` throws on non-2xx | Clean error propagation; callers use try/catch to return safe null/false defaults |
| `--legacy-peer-deps` for npm install | shadcn/ui + React 19 peer dep warnings; same pattern used in Phase 1 |
| phone regex allows optional `+?1?` prefix | Accepts both `3125551234` and `+13125551234` to handle landing page form inputs |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — these are pure library/schema files. No UI rendering, no stub data.

## Self-Check: PASSED

- [x] `supabase/migrations/002_add_slug_to_clients.sql` exists with correct SQL
- [x] `apps/web/src/lib/validations/lead.ts` exports `leadSchema`, `LeadFormValues`, `SERVICE_TYPES`
- [x] `apps/web/src/lib/ghl.ts` exports `createGHLContact`, `lookupContactByPhone`, `addContactToWorkflow`
- [x] Commit 867d9b2 exists
- [x] Commit 50835da exists
- [x] All 4 npm packages in `apps/web/package.json`
