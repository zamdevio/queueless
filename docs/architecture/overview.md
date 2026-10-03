# Architecture overview — QueueLess

High-level direction. **Decided** items below are project choices for implementation planning. Exact APIs/class names stay open until code lands.

---

## Surfaces (scaffolded today)

| Surface | Package | Role |
|---------|---------|------|
| Web SPA | `@queueless/web` (`apps/web`) | React + Vite — customer + operator UI |
| API | `@queueless/worker` (`apps/worker`) | **Cloudflare Worker + Hono** |

Monorepo: pnpm workspace. No shared `packages/*` yet.

---

## Runtime shape (decided)

```text
Customer / Operator browsers
        │
        ▼
   apps/web (SPA)
        │  HTTPS (REST mutations) + SSE (live board)
        ▼
   apps/worker (Hono on Workers)
        ├── Durable Object — live queue coordination + SSE subscriber fan-out
        └── D1 — durable ticket / session / account store
```

- **Workers + Hono:** all HTTP — auth, join/leave/call-next, SSE stream endpoints, DO/D1 access.
- **HTTP mutations:** join, leave, call-next, skip, remove, reset, auth — request/response.
- **SSE:** server → client only for queue board updates (position, now-serving, ETA, etc.).
- **Durable Object:** single-threaded actor per `queueId` — ordering, concurrent join/serve, hold SSE subscribers for that queue.
- **D1:** full ticket store (and account/role data) for durability + ETA history.

---

## Decisions

| # | Topic | Choice | Notes |
|---|-------|--------|-------|
| 1 | Live queue coordination | **Durable Object** per `queueId` | Serialize mutations; fan out SSE to that queue’s subscribers |
| 2 | D1 role | **Full ticket store** | Persist tickets/session; DO is not the only durability layer |
| 3 | Realtime transport | **SSE** | Server→client push; all writes stay on HTTP |
| 4 | Operator access | **Real accounts + roles** | Staff/admin auth — expands MVP vs PIN-only |
| 5 | ETA | **Rolling average** from recent serves | Heuristic, not ML |
| 6 | Queue shape | **Multi-queue via `queueId` in URL** | One DO (and ticket set) per queue id from day one |
| — | Worker framework | **Hono** | Already scaffolded; keep it |

### How DO + D1 share work (intent)

| Concern | Owner |
|---------|--------|
| Call-next / join ordering under concurrency | Durable Object |
| Push updates to waiting clients | Durable Object → **SSE** |
| Durable tickets, served history, account/role rows | D1 |
| ETA inputs (recent service durations) | D1 (and/or DO cache of recent samples) |

Exact write path (DO-first then async D1 vs dual-write) is an implementation detail for the first queue slice.

### Auth intent (decision 4)

- **Staff / admin:** real accounts with roles (e.g. operator vs admin — exact role set TBD in impl).
- **Customers:** **anonymous tickets** (no customer accounts) unless we explicitly change that later.

### Why SSE (not WebSocket)

QueueLess is mostly **server → client** for the live board. Mutations are natural **HTTP** calls (validation, auth, status codes). SSE matches that split with less protocol overhead than WebSockets. WebSocket stays a non-goal unless a later need forces bidirectional sockets.

---

## Still open

1. Role list (operator / admin / …) and how accounts are created for demos.
2. Exact DO ↔ D1 sync strategy on each mutation.

---

## Non-goals for this document

- Final API routes / schema DDL
- Production Cloudflare account setup
- Claiming Assignment 1 requires a live deployment

Contributor maps: `maintainer/agents/architecture.md`, `maintainer/systems/`.
