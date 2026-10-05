# Phase: Queue DO + SSE + HTTP mutations

**Status:** Active — first implementation slice

**Goal:** Working queue you can demo — student joins, sees position, staff calls next.

---

## Scope

### In this slice

- **Durable Object** `QueueDO` per `queueId` (join, leave, call-next, skip, remove, reset)
- **SSE endpoint** `GET /api/queue/:queueId/stream` for live board updates
- **HTTP routes** for queue mutations (POST)
- **Board state** `GET /api/queue/:queueId` (HTTP snapshot)
- **Anonymous student tickets** (no student accounts)

### Out of this slice

- Staff accounts / roles (gate operator side later)
- D1 schema (DO holds live state; add D1 for history after)
- ETA (needs serve timestamps)
- Web SPA UI (we'll wire it up after the API is demoable)

---

## Architecture

```text
Student browser
    │  POST /api/queue/:queueId/join
    ▼
Worker + Hono
    │
    ├─ POST routes → QueueDO (join, leave, call-next, skip, remove, reset)
    │
    └─ GET /api/queue/:queueId/stream → SSE → pushes events to student browser
```

**QueueDO state:**
- `tickets`: Map<ticketId, {id, number, state}>
- `nowServing`: number
- `subscribers`: Set<WritableStream> (SSE connections)

**Events pushed via SSE:**
- `join` — new ticket entered
- `leave` — ticket left
- `call` — ticket called (nowServing changed)
- `skip` — ticket skipped
- `remove` — ticket removed
- `reset` — queue reset

---

## Implementation order

1. `apps/worker/src/do/QueueDO.ts` — Durable Object class
2. `apps/worker/wrangler.toml` — add DO binding
3. `apps/worker/src/routes/queue.ts` — HTTP routes
4. `apps/worker/src/routes/stream.ts` — SSE endpoint
5. `apps/worker/src/index.ts` — wire routes + DO
6. Update `maintainer/phases/focus.md`

---

## Success criteria

- `pnpm worker:dev` starts without errors
- `POST /api/queue/demo/join` returns a ticket
- `GET /api/queue/demo/stream` returns SSE events
- `POST /api/queue/demo/call-next` advances the queue
- `pnpm typecheck` / `pnpm test` pass
