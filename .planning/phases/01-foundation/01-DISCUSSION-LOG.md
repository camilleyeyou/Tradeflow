# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 1-foundation
**Mode:** Auto (--auto flag)
**Areas discussed:** Supabase setup, Project structure, Auth flow, Dev environment

---

## Supabase Setup

| Option | Description | Selected |
|--------|-------------|----------|
| Cloud-only | Connect directly to Supabase cloud project | ✓ |
| Local CLI + Docker | Full local dev environment with Supabase CLI | |

**User's choice:** Cloud-only (auto-selected: recommended default)
**Notes:** Faster setup, avoids Docker dependency, sufficient for 1-2 developer team at MVP stage.

| Option | Description | Selected |
|--------|-------------|----------|
| SQL files + dashboard apply | Migrations in /supabase/migrations/, applied via dashboard | ✓ |
| Supabase CLI push | Automated migration push via CLI | |

**User's choice:** SQL files + dashboard apply (auto-selected: matches PROJECT.md spec)

---

## Project Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Simple directories | apps/web/ and api/ in one repo, no tooling | ✓ |
| Turborepo | Monorepo tooling with build caching | |
| pnpm workspaces | Lightweight monorepo with pnpm | |

**User's choice:** Simple directories (auto-selected: no overhead justified for 2 apps)

---

## Auth Flow

| Option | Description | Selected |
|--------|-------------|----------|
| @supabase/ssr + cookies | Cookie-based sessions, per-request client | ✓ |
| @supabase/auth-helpers | Deprecated package, simpler API | |

**User's choice:** @supabase/ssr + cookies (auto-selected: research confirmed this is the correct 2025+ approach)

| Option | Description | Selected |
|--------|-------------|----------|
| ADMIN_EMAIL env check | Middleware checks email against env var | ✓ |
| Role-based in database | Admin role stored in user metadata or separate table | |

**User's choice:** ADMIN_EMAIL env check (auto-selected: matches PROJECT.md spec)

---

## Dev Environment

| Option | Description | Selected |
|--------|-------------|----------|
| seed.sql with test data | One test client + one test lead | ✓ |
| No seed data | Start empty | |

**User's choice:** seed.sql with test data (auto-selected: matches PROJECT.md Step 1)

| Option | Description | Selected |
|--------|-------------|----------|
| RLS integration test only | Cross-tenant JWT test as exit gate | ✓ |
| Full test framework | Jest/Vitest setup with unit tests | |

**User's choice:** RLS integration test only (auto-selected: validates critical security boundary, no framework overhead)

---

## Claude's Discretion

- Internal folder structure within components/ and lib/
- FastAPI project layout
- Python virtual environment tool choice
- Tailwind v4 configuration details

## Deferred Ideas

None — discussion stayed within phase scope
