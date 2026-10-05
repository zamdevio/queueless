# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)  
**Phase:** [`production-ready.md`](./production-ready.md)  
**Architecture:** [`../../docs/architecture/overview.md`](../../docs/architecture/overview.md)

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | Production-ready | PIN auth, capacity, meta, sonner, call dialog, docs, drop demo labels |
| 2 | Docs + README | How to use / how it works / deploy from repo |
| 3 | Deploy + secret | `OPERATOR_PIN` + worker/pages deploy |

## Queued — do not start

| # | Item | Why parked |
|---|------|------------|
| 1 | D1 ticket history | DO holds live state |
| 2 | Rolling ETA | Needs serve timestamps |
| 3 | Full RBAC / accounts | PIN is enough for v1 |
| 4 | Multi-counter | Stretch |

## Deployed

- Worker: `https://queueless.zamdevio.workers.dev`
- Pages: `https://thequeueless.pages.dev`

## Do not

- Collect customer PII by default (meta is anonymous/hashed)
- Leave operator routes unauthenticated once PIN ships
