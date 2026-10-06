# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)  
**Course pack:** [`course-management-pack.md`](./course-management-pack.md)

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | ETA + operator stats | Rolling avg service time; student ETA; operator stats grid |
| 2 | Toast position | top-right; PWA Open removed (Installed only) |
| 3 | Course pack (next) | Management Pack after user confirms format |

## Queued — do not start

| # | Item | Why parked |
|---|------|------------|
| 1 | Course Management Pack fill | Wait for user go |
| 2 | Full RBAC / accounts | **Skip for course MVP** — PIN is enough |
| 3 | D1 ticket history | DO holds live state; D1 optional later |
| 4 | Join abuse rate-limit | Stretch |

## Deployed

- Worker: `https://queueless.zamdevio.workers.dev`
- Pages: `https://thequeueless.pages.dev`
- GH: `https://github.com/zamdevio/queueless`

## Config

| App | File | Keys |
|-----|------|------|
| Web | `apps/web/.env` / `.env.production` | `VITE_API_URL` |
| Worker | `apps/worker/wrangler.jsonc` | `ALLOWED_ORIGINS`, `ENVIRONMENT` |
| Secrets | `.dev.vars` / `wrangler secret put` | `OPERATOR_PIN` |

## D1 note

D1 is **bound** (`DB`) but the queue **does not use it yet** — live state is in `QueueDO`. Scaffold had drizzle scripts; they were removed until D1 history is a real need.
