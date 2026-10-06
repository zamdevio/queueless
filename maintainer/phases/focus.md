# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | Operator demo mode | Full layout preview without PIN; backend actions toast “disabled” |
| 2 | Docs refresh | README / product / maintainer — drop stale D1/83% claims |
| 3 | Course pack | Next after this slice — see [`course-management-pack.md`](./course-management-pack.md) |

## Queued — do not start

| # | Item | Why parked |
|---|------|------------|
| 1 | Course Management Pack fill | After demo mode + docs refresh |
| 2 | Full RBAC / accounts | Skipped for course MVP |

## Shipped this round

- Confirm dialogs · max-waiting guard · operator Claude-style grid
- Serve + join-again · per-page dropdown 5/10/15/20
- Device ticket restore · history export · board page · policies script
- Operator demo mode (no PIN → preview; Sign in with PIN → real backend)

## Deployed

- Worker: `https://queueless.zamdevio.workers.dev`
- Pages: `https://thequeueless.pages.dev`
