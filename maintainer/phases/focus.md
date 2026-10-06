# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)  
**Next phase:** [`course-management-pack.md`](./course-management-pack.md)

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | Cleanup + env | Unused code removed; VITE_API_URL + ALLOWED_ORIGINS config |
| 2 | Docs (in-app) | Guide CORS · Development deploy (GH `zamdevio/queueless`) · Phases section |
| 3 | Course pack (next) | Management Pack after user confirms format |

## Queued — do not start

| # | Item | Why parked |
|---|------|------------|
| 1 | Course Management Pack fill | Wait for user go |
| 2 | D1 ticket history | DO holds live state |
| 3 | Rolling ETA | Needs serve timestamps |
| 4 | Full RBAC | PIN is enough for v1 |

## Deployed

- Worker: `https://queueless.zamdevio.workers.dev`
- Pages: `https://thequeueless.pages.dev`
- GH (planned public): `https://github.com/zamdevio/queueless`

## Config (no hardcoded hosts)

| App | File | Vars |
|-----|------|------|
| Web | `apps/web/.env` / `.env.production` | `VITE_API_URL` (local default `http://localhost:8787`) |
| Worker | `apps/worker/wrangler.jsonc` | `ALLOWED_ORIGINS`, `ENVIRONMENT` |
| Worker secrets | `apps/worker/.dev.vars` or `wrangler secret put` | `OPERATOR_PIN`, optional `SESSION_SECRET` |
