# Queue (domain)

**Status:** live via `QueueDO` per `queueId`.

## Responsibility

Ticket identity, ordering, now-serving, join/leave, operator actions, capacity, client meta, SSE fan-out.

## Model

- **Ticket:** `id`, `number`, `state`, `createdAt`, `meta`
- **States:** waiting → called → served | skipped | left | removed
- **Settings:** `maxWaiting` (default 50) — operator-editable via `POST /api/queue/:id/settings`
- **Coordination:** Durable Object per `queueId`; HTTP mutations + SSE board
- **Default queue:** `main`

## Capacity

Join returns **409** `QUEUE_FULL` when `waiting >= maxWaiting`.

## Meta / privacy

On join, worker captures CF headers + hashed IP. Never store raw IP. Customer identity = ticket + number only.

## Concurrency

Mutations serialize inside the DO. SSE snapshot + event fan-out to subscribers.

## Out

Multi-counter, billing, customer accounts.
