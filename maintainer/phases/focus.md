# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)  
**Next:** [`course-management-pack.md`](./course-management-pack.md) — **after** UI polish slice

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | Confirm dialogs | Shared `ConfirmDialog` for leave / skip / remove / reset |
| 2 | Max waiting guard | Deny save when new max &lt; waiting count; operator must serve/remove or reset |
| 3 | Operator layout | Restructured toolbar (call · reset · limit · export), compact now-serving |

## Queued — do not start

| # | Item | Why parked |
|---|------|------------|
| 1 | Course Management Pack fill | **After this UI slice** |
| 2 | Full RBAC / accounts | Skipped for course MVP |

## Notes

- **One primary system/layout only** — no legacy dual paths.
- Skip uses the same confirm dialog as remove (explicit action; not silent).
- Device ticket restore, pagination, export, board page — already shipped.

## Deployed

- Worker: `https://queueless.zamdevio.workers.dev`
- Pages: `https://thequeueless.pages.dev`
