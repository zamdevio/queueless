# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)

---

## Focus now

**Build order (user-confirmed 2026-10-07):** A → B → C → Management Pack → worker origin hide.

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | Add-ons slices | [`add-ons.md`](./add-ons.md) — **A + B + C shipped** |
| 2 | Course pack | Draft ready: [`../../docs/course/management-pack.md`](../../docs/course/management-pack.md) — user pastes into Google Doc |
| 3 | Deploy polish | **Done in repo** — worker `/` hides ALLOWED_ORIGINS; ENV=production; LICENSE MIT + README badges |

## Queued — do not start

| # | Item | Why parked |
|---|------|------------|
| 1 | Full RBAC / accounts | Skipped for course MVP |

## Shipped this round

- Confirm dialogs · max-waiting guard · operator Claude-style grid
- Serve + join-again · per-page dropdown 5/10/15/20
- Device ticket restore · history export · board page · policies script
- Operator demo mode (no PIN → preview; Sign in with PIN → real backend)
- **Slice A** — student waiting list + operator history richer (student names follow board `showNamesOnBoard` gate)
- **Slice B** — operator "Mark served" for current now-serving ticket · DO serve clears nowServing + records sample
- **Slice C** — board names privacy-default off + operator toggle · join toast ETA · Guide rate-limits section
- **Student waiting list** follows board names gate (same as `/board/:id`)
- **SSE fix** — student view single connection (`[queueId]` only); no resubscribe storm
- **Management Pack draft** — `docs/course/management-pack.md` (lecturer 7-section template)

## Deployed

- Worker: `https://queueless.zamdevio.workers.dev`
- Pages: `https://thequeueless.pages.dev`
