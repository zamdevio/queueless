# Queue (domain)

**Status:** live via `QueueDO` per `queueId`.

## Model

- **Ticket:** `id`, `number`, `state`, `createdAt`, `calledAt`, `meta`
- **States:** waiting → called → served | skipped | left | removed
- **Settings:** `maxWaiting` (default 50)
- **Stats:** rolling `avgServiceMs` (last 20 call-next intervals) + issued/waiting counts
- **ETA:** student `position × avgServiceMs` (UI only; no ML)

## Capacity

Join **409** when `waiting >= maxWaiting`.

## Meta / privacy

CF headers + **hashed** IP only. Customers stay anonymous.

## Storage

Live state lives in the **Durable Object** (not D1). D1 binding exists for future history — not required for MVP queue ops.

## Env

SPA: `VITE_API_URL`. Worker CORS: `ALLOWED_ORIGINS` from `wrangler.jsonc` vars.
