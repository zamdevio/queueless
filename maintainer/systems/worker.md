# Worker

Surface: `apps/worker` (`@queueless/worker`).

- **Runtime:** Cloudflare Workers + **Hono**
- **Queue:** `QueueDO` per `queueId`
- **Auth:** PIN login (10 rpm) → Bearer token + `SameSite=None` cookie
- **CORS:** `ALLOWED_ORIGINS` from `wrangler.jsonc` `vars` (comma-separated)
- **Env secrets:** `.dev.vars` local / `wrangler secret put` prod

## Config

| Key | Where | Purpose |
|-----|--------|---------|
| `ALLOWED_ORIGINS` | `wrangler.jsonc` vars | CORS allow-list (SPA origin) |
| `ENVIRONMENT` | `wrangler.jsonc` vars | `development` / `production` |
| `OPERATOR_PIN` | secret / `.dev.vars` | Operator login |
| `SESSION_SECRET` | secret optional | HMAC key |

No hardcoded origin lists in source — worker reads env at runtime.
