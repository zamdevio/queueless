# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)  
**Course pack:** [`course-management-pack.md`](./course-management-pack.md)

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | RateLimitDO | Per-IP login limiter in DO (done this slice) |
| 2 | Drop D1 | No DB; simple CF resources only; docs updated |
| 3 | Course pack (next) | Management Pack after user confirms format |

## Queued — do not start

| # | Item | Why parked |
|---|------|------------|
| 1 | Course Management Pack fill | Wait for user go |
| 2 | Full RBAC / accounts | **Skipped for course MVP** — PIN is enough |
| 3 | Join abuse rate-limit | Stretch |

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

## Theme

First visit follows **browser** (`prefers-color-scheme`). Preference is stored in `localStorage` only after the user toggles theme.

## D1 / DB

**Removed.** Live state is in Durable Objects (`QueueDO`, `RateLimitDO`). Deploy needs only Workers + Pages + `OPERATOR_PIN`.
