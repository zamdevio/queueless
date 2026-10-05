# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)  
**Architecture:** [`../../docs/architecture/overview.md`](../../docs/architecture/overview.md)

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | Queue DO + SSE + HTTP | **Slice 1 shipped** — demoable queue API |
| 2 | Web SPA UI | Wire up to the API — student join + operator dashboard |
| 3 | Auth (later) | Staff accounts/roles — gate operator side |

## Queued — do not start

| # | Item | Why parked |
|---|------|------------|
| 1 | D1 ticket schema | DO holds live state; add D1 for history after UI demo |
| 2 | ETA | Needs serve timestamps from call-next |
| 3 | Staff accounts / roles | Gate operator side (skip/remove/reset) |
| 4 | Production CF deploy | Not Assignment 1 |

## Next task

1. Build Web SPA that consumes the API (student join + operator dashboard).
2. Demo: student joins → sees position → staff calls next.
3. Then promote auth or ETA based on what the demo reveals.

## Do not

- Start both auth and queue actor in parallel without Focus room
- Reintroduce WebSocket unless a later need forces it
- Collect student PII by default
- Deploy production CF for the course idea phase alone
