# `@queueless/worker`

Cloudflare Worker + Hono API for QueueLess.

Scaffold today: `GET /`, `GET /health` (D1 probe). Queue APIs not implemented.

D1 `database_id` in `wrangler.toml` is a placeholder. Create only when needed:

```bash
wrangler d1 create queue-less
```

```bash
pnpm --filter @queueless/worker dev
```
