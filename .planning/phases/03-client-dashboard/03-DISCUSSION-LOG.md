# Phase 3: Client Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 3-client-dashboard
**Mode:** Auto (--auto flag)
**Areas discussed:** Dashboard layout, Lead pipeline visualization, Status update mechanism, Call recording display, Settings scope, Data fetching pattern

---

## Dashboard Layout Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar nav + mobile bottom tabs | Desktop sidebar collapses to bottom tab bar on mobile | ✓ |
| Top navigation bar | Horizontal nav across the top | |
| Bottom tabs only | Mobile-first tabs on all breakpoints | |

**User's choice:** Sidebar nav + mobile bottom tabs (auto-selected: HVAC owners check dashboards between jobs on phones — bottom tabs are thumb-reachable; sidebar works on desktop)

---

## Lead Pipeline Visualization

| Option | Description | Selected |
|--------|-------------|----------|
| Table with status dropdown | Tabular lead list with inline status dropdown per row | ✓ |
| Kanban board | Drag-and-drop columns per status stage | |
| Card list | Stacked cards with status badges | |

**User's choice:** Table with status dropdown (auto-selected: matches DASH-03 requirement for 5-stage pipeline with dropdown; simpler on mobile than kanban)

---

## Status Update Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Inline dropdown with optimistic update | Select changes status immediately, no page reload | ✓ |
| Modal confirmation | Click row to open detail modal with status selector | |
| Drag-and-drop between columns | Kanban-style drag (requires kanban layout) | |

**User's choice:** Inline dropdown with optimistic update (auto-selected: DASH-04 explicitly requires "no page reload")

---

## Call Recording Display

| Option | Description | Selected |
|--------|-------------|----------|
| Link to recording URL | External link opens CallRail recording in new tab | ✓ |
| Embedded audio player | HTML5 audio player inline in the call log | |
| Both link and player | Inline player with fallback link | |

**User's choice:** Link to recording URL (auto-selected: CallRail provides recording_url; external link is simplest and avoids CORS/auth issues with embedded playback)

---

## Settings Page Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Business info + notification preferences | Edit business_name, phone, email, notification toggle | ✓ |
| Full profile editor | Include service areas, plan info, billing | |
| Minimal (notifications only) | Only notification email preferences | |

**User's choice:** Business info + notification preferences (auto-selected: matches DASH-07 scope)

---

## Data Fetching Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Server Components with force-dynamic | Fetch data server-side on each request, no client state library | ✓ |
| Client-side with React Query/SWR | Client fetches from API routes, caches client-side | |
| Hybrid (Server Components + client mutations) | Server renders initial data, client handles updates | |

**User's choice:** Server Components with force-dynamic (auto-selected: matches Phase 1 patterns D-06/D-07; dashboard pages are auth-gated and must be force-dynamic per CLAUDE.md)
**Notes:** Status updates and notes edits use Server Actions for mutations, not client-side API calls.

---

## Claude's Discretion

- shadcn/ui component selection (Table, Select, Input, Card, etc.)
- Dashboard color scheme and visual hierarchy
- Count card layout and styling
- Navigation icon choices
- Loading skeleton design
- Error state presentation

## Deferred Ideas

None — discussion stayed within phase scope
