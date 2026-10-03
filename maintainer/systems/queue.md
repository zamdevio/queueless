# Queue (domain)

**Status:** design map — decisions locked in `docs/architecture/overview.md`; no runtime module yet.

## Responsibility

Own rules for an active queue session: ticket identity, ordering, now-serving, join/leave, operator actions, and how waiting clients learn about changes.

## Decided model

- **Ticket:** opaque id + public number; customers stay **anonymous** (no customer accounts) unless changed later.
- **States (sketch):** waiting → called → served | skipped | left | removed.
- **Live coordination:** Durable Object per `queueId` (serialize mutations, SSE fan-out).
- **Durability:** D1 full ticket store (+ serve history for ETA).
- **Realtime:** **SSE** server→client; mutations stay on **HTTP** (Hono).
- **ETA:** rolling average of recent service durations × position.
- **Staff:** real accounts + roles (operator/admin TBD).
- **Shape:** multi-queue — `queueId` in the URL; one DO (+ ticket set) per queue.

## Concurrency

Joins and call-next serialize inside that queue’s Durable Object. D1 writes must not become a second unordered source of truth for “who’s next.”

## Still open

- Exact DO → D1 write path.
- Role set / demo account bootstrap.


## Out until Focus promotes

Multi-counter, org hierarchy, notifications, billing.
