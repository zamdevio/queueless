# Phase: Product add-ons (post-MVP)

**Status:** Planned — next product slice after current polish  
**Goal:** Richer tickets + privacy-aware lists + small demo wins. No new backend surface unless noted.

---

## In scope

### 1. Ticket data & privacy (high value)

| Change | Detail |
|--------|--------|
| Student waiting list | Show **ticket number only** (no display name) |
| Operator waiting rows | Rich: number, name, join time, country/city, UA hint |
| Operator history | Richer: `# · name · joined · called · state · country` |
| Export CSV/JSON/MD | Already includes name + meta; keep as-is |

Fields already on ticket: `name`, `createdAt`, `calledAt`, `meta.{country,city,userAgent,language,ipHash}`.

### 2. Operator UX polish

| Item | Idea |
|------|------|
| **Mark called ticket as served** | Operator button: "Mark served" for the **current now-serving ticket** — works when queue is empty (no next to call) **and** when more tickets are waiting but nobody has been marked done. Clears `nowServing` / moves ticket to `served` via existing `serve` route. |
| Now-serving flash | Highlight banner when call-next lands (SSE already fires) |
| Empty states | Operator: "No one waiting — Call next disabled"; student: "Queue is empty" |
| History density | Times + country in one row |

### 3. Board / privacy

| Item | Idea |
|------|------|
| Board name toggle | `/board/:id` show/hide display names |
| Privacy default | Public board: numbers only unless operator enables names |

### 4. Student UX

| Item | Idea |
|------|------|
| Join toast + ETA | Success toast can include estimated wait |

### 5. Docs / course evidence

| Item | Idea |
|------|------|
| Limits in Guide | Short "Rate limits" section (login 10/min, join 5/min) |
| Pack evidence | Point Management Pack at `scripts/test-worker-policies.ts`, live URLs, knip |

---

## Out (this phase)

- Multi-counter / multi-location
- Full RBAC / OAuth
- D1 history store
- Notifications

---

## Next task

1. Slice A: student list number-only + operator history richer
2. **Slice B: operator "Mark served" for current now-serving ticket** (empty queue **and** when next tickets exist but current not marked done)
3. Slice C: board name toggle + join toast ETA + Guide limits section
4. Then Management Pack (course deliverable)

Promote one add-on at a time via `maintainer/phases/focus.md`.
