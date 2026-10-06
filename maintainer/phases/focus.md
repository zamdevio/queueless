# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | Add-ons phase | [`add-ons.md`](./add-ons.md) — privacy lists, history richness, board toggle |
| 2 | Course pack | Management Pack still the course deliverable |
| 3 | Deploy polish | Worker `/` hides ALLOWED_ORIGINS; ENV=production; LICENSE + GH metadata |

## Queued — do not start

| # | Item | Why parked |
|---|------|------------|
| 1 | Add-ons slice A/B | Wait for user go |
| 2 | Course Management Pack fill | After add-ons or in parallel if user wants |
| 3 | Full RBAC / accounts | Skipped for course MVP |

## Shipped this round

- Confirm dialogs · max-waiting guard · operator Claude-style grid
- Serve + join-again · per-page dropdown 5/10/15/20
- Device ticket restore · history export · board page · policies script
- Operator demo mode (no PIN → preview; Sign in with PIN → real backend)

## Deployed

- Worker: `https://queueless.zamdevio.workers.dev`
- Pages: `https://thequeueless.pages.dev`
