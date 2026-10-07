# Phase: Course Management Pack (submission)

**Status:** Draft ready — `docs/course/management-pack.md` (lecturer template shape; paste into Google Doc)  
**Deadline context:** Tracker end date **31/10/26**  
**Lecturer materials:** `maintainer/temp/Software Project Management/` (template + sample + tracker; gitignored)

---

## Goal

Fill the lecturer **Management Pack** for QueueLess — not more product features unless required for evidence.

## Deliverable (from template)

1. Project Charter & Overview  
2. Requirements & Scope Backlog (REQ IDs + user stories + H/M/L)  
3. Milestones & Release Plan  
4. Resource & Team Management (roles)  
5. Risk & Issues Register  
6. Change Control Log  
7. Weekly Status Dashboard  

## Status (2026-10-07)

| Item | State |
|------|-------|
| Pack document | Written: [`../../docs/course/management-pack.md`](../../docs/course/management-pack.md) |
| Format | 7 lecturer sections + honest evidence; paste into Google Doc |
| Team model | **Solo** — tracker row: Farah Abdisamad · QueueLess |
| Lecturer tracker | Deployment + Operations In Progress (~83%) |
| Submit | User pastes/submits before 31/10/26 |

## Align with live product (already built)

| Pack section | Source of truth |
|--------------|-----------------|
| Charter / users / metrics | `docs/product/purpose.md`, `docs/course/assignment-1.md` |
| REQ backlog | Live product + `docs/product/scope.md` deltas |
| Milestones | `maintainer/phases/focus.md` + `maintainer/shipped/README.md` |
| Risks | Auth rate limit, CORS origins, free-tier CF, DO concurrency, SSE |
| Change log | Architecture picks + auth/env + slices A–C |
| Status | Core built & deployed — MVP complete; pack drafted |

## Working style

- Fill **one document** (`docs/course/management-pack.md`) → user pastes into Google Doc.
- Keep numbers honest — no fake metrics.
- Product code changes only if pack needs a missing evidence artifact (e.g. test summary).

## Out

- New product features for the pack alone
- Redesigning the lecturer template
