# Worker

Surface: `apps/worker` (`@queueless/worker`).

- **Runtime:** Cloudflare Workers + **Hono**
- **Queue:** `QueueDO` per `queueId` (join/call/skip/remove/reset/settings + SSE + rolling ETA stats)
- **Rate limit:** `RateLimitDO` — per-IP login failures (10 / 60s), DO storage
- **Auth:** PIN login → Bearer token + `SameSite=None` cookie
- **CORS:** `ALLOWED_ORIGINS` from `wrangler.jsonc` `vars` (comma-separated)
- **Env secrets:** `.dev.vars` local / `wrangler secret put` prod
- **Database:** **None** — Durable Objects only (D1 removed)

## Config

| Key | Where | Purpose |
|-----|--------|---------|
| `ALLOWED_ORIGINS` | `wrangler.jsonc` vars | CORS allow-list (SPA origin) |
| `ENVIRONMENT` | `wrangler.jsonc` vars | `development` / `production` |
| `OPERATOR_PIN` | secret / `.dev.vars` | Operator login |
| `SESSION_SECRET` | secret optional | HMAC key |

No hardcoded origin lists in source — worker reads env at runtime.
