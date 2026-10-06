# Phase: Course Management Pack (submission)

**Status:** Planned — next after cleanup + deploy guide  
**Deadline context:** Tracker end date **31/10/26**  
**Lecturer materials:** `Software Project Management/` (template + sample + tracker)

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

## Align with live product (already built)

| Pack section | Source of truth |
|--------------|-----------------|
| Charter / users / metrics | `docs/product/purpose.md`, `docs/course/assignment-1.md` |
| REQ backlog | `docs/product/scope.md` + shipped production features |
| Milestones | `maintainer/phases/focus.md` + `maintainer/shipped/README.md` |
| Risks | Auth rate limit, CORS origins, free-tier CF, DO concurrency |
| Change log | Architecture picks + auth/env changes in git history |
| Status | Tracker: core system built & deployed — product MVP **complete** (docs + management pack remaining) |

## Working style

- Fill **one document** (Google Doc or `docs/course/management-pack.md`) after user confirms format.
- Keep numbers honest — no fake metrics.
- Product code changes only if pack needs a missing evidence artifact (e.g. test summary).

## Out

- New product features for the pack alone
- Redesigning the lecturer template
