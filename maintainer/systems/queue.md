# Queue (domain)

**Status:** live via `QueueDO` per `queueId`.

## Model

- **Ticket:** `id`, `number`, `state`, `createdAt`, `meta` (UA, country, city, language, ipHash)
- **States:** waiting → called → served | skipped | left | removed
- **Settings:** `maxWaiting` (default 50) — operator-editable
- **Coordination:** Durable Object per `queueId`; HTTP mutations + SSE
- **Default queue:** `main`

## Meta / privacy

CF headers + **hashed** IP only. Customers stay anonymous tickets.

## Capacity

Join returns **409** when `waiting >= maxWaiting`.

## Env

No hardcoded queue hosts. SPA uses `VITE_API_URL`; worker CORS uses `ALLOWED_ORIGINS` from `wrangler.jsonc`.
