# `@queueless/worker`

Cloudflare Worker + Hono API for QueueLess.

## Routes

- `GET /` — service info
- `GET /health` — liveness
- `POST /api/auth/login` — PIN login (rate limited via `RateLimitDO`)
- Queue routes under `/api/queue/:queueId/*`

## Bindings

| Binding | Class | Role |
|---------|-------|------|
| `QUEUE_DO` | `QueueDO` | Live queue state + SSE |
| `RATE_LIMIT_DO` | `RateLimitDO` | Per-IP login rate limit (10 fails / 60s) |

**No D1** — no external database. State is in Durable Objects.

## Config

Secrets (not in wrangler.jsonc): copy `.dev.vars.example` → `.dev.vars` for local, or `wrangler secret put OPERATOR_PIN` for production.

```bash
pnpm --filter @queueless/worker dev
```
