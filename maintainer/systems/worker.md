# Worker

Surface: `apps/worker` (`@queueless/worker`).

## Today

- Cloudflare Workers + **Hono** (keep Hono for all HTTP + SSE routes).
- Routes: `GET /` service info, `GET /health` D1 `SELECT 1` probe.
- `wrangler.toml`: Worker name `queue-less`, D1 binding `DB` / database `queue-less`, placeholder `database_id`.
- Drizzle folder has `0000_init.sql` from scaffold — not a QueueLess product schema.

## Intended (not built)

- Queue join / status / leave and operator actions as **HTTP** routes.
- **SSE** endpoint(s) for live board updates (per `queueId`).
- Staff accounts + roles.
- Durable Object binding for live queue + SSE subscriber fan-out.
- D1 schema for tickets / sessions / accounts (beyond health probe).
- Validation, basic rate limits.

## Ops

Replace `database_id` only when you actually create D1:

```bash
wrangler d1 create queue-less
```

Assignment 1 does not require production deploy or a real D1 id.
