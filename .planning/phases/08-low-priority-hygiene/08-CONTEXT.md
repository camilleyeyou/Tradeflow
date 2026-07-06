# Phase 8: Low-Priority Hygiene - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss — autonomous run)

<domain>
## Phase Boundary

Repo cleanup, public-facing edge cases, and doc accuracy. Scope = HYG-01..04. Low risk, no product logic changes beyond copy/error pages.

</domain>

<decisions>
## Implementation Decisions

### HYG-01 — remove/ignore cruft
- Delete `CLAUDE (1).md` (stale duplicate at repo root).
- Delete unused create-next-app SVGs in apps/web/public: next.svg, vercel.svg, file.svg, globe.svg, window.svg (verify each is unreferenced via grep before deleting).
- Add `TRADEFLOW-DESIGN-A-ALL-FILES/` to .gitignore (untracked ~12MB brand binaries duplicating brand/); do not commit them.
- Remove the stray nested git repo at `apps/web/.git` (an executor flagged it; repo files are already tracked in the ROOT repo, confirmed by git ls-files). Run `rm -rf apps/web/.git` so future git commands in that dir don't hit the nested repo. Acceptance: no `apps/web/.git` dir; `CLAUDE (1).md` gone; SVGs gone; .gitignore lists the brand dir.

### HYG-02 — error/not-found pages
- Add `apps/web/src/app/not-found.tsx` (styled 404, on-brand black+gold, links home) and `apps/web/src/app/global-error.tsx` (global error boundary with a friendly message + retry). Acceptance: both files exist and export default components; `npm run build` passes.

### HYG-03 — copy fixes
- Fix the hardcoded "a local 312 number" success message in apps/web/src/components/lead-form.tsx (make it generic, e.g. "a local number", or use the client's area code if available). Fix the low-contrast admin link in apps/web/src/app/(admin)/admin/clients/[id]/page.tsx (the `hover:text-gray-700` on dark background — change to a readable light/gold hover). Acceptance: no "312 number" literal remains; admin link hover uses a light/on-brand color.

### HYG-04 — doc accuracy
- Reconcile planning docs: the old ROADMAP Progress table listed Phase 2 as "In Progress" / Phases 1-2 unchecked despite completion — fix so v1.0 phases 1-4 read complete and consistent with STATE.
- Update apps/web/README.md to accurately reflect shipped features: missed-call text-back and CallRail call log now EXIST (built in Phase 5); per-client GHL token; remove any "per-lead billing" claim that contradicts REQUIREMENTS (monthly retainer); ensure CALLRAIL/GHL env var docs match what code reads; commit the pending README rewrite. Acceptance: README mentions CallRail webhook + call log as implemented; no contradictory per-lead-billing claim; ROADMAP progress table internally consistent.

### Claude's Discretion
- Exact wording of 404/error pages and README edits at Claude's discretion, matching the black+gold brand.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Brand styling: black + gold (see (marketing)/page.tsx, globals.css). buttonVariants for links.
- Lead form success copy: apps/web/src/components/lead-form.tsx.
- Admin client detail: apps/web/src/app/(admin)/admin/clients/[id]/page.tsx.
- Only (admin) has an error boundary currently — add root not-found + global-error.

### Integration Points
- .gitignore at repo root already ignores node_modules/.next/brand zip.

</code_context>

<specifics>
## Specific Ideas

Authoritative: .planning/REQUIREMENTS.md (v1.1 Low-Priority) + audit findings. The stray apps/web/.git was discovered during Phase 6 execution.

</specifics>

<deferred>
## Deferred Ideas

- Features → Phase 9.

</deferred>
