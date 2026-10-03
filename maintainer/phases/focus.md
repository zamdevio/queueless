# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)  
**Architecture:** [`../../docs/architecture/overview.md`](../../docs/architecture/overview.md)

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | Architecture lock | Decisions **1–6 closed** — SSE + HTTP, Hono, DO, D1, accounts, `queueId` |
| 2 | Course Assignment 1 | Keep proposal aligned with locked stack |
| 3 | Impl readiness | Green-light one first slice (auth *or* queue DO+SSE) — not both at once |

## Queued — do not start

| # | Item | Why parked |
|---|------|------------|
| 1 | Auth accounts + roles | In MVP scope; wait for green light |
| 2 | D1 ticket schema + migrations | Full store; needs `queueId` model |
| 3 | Durable Object queue actor + SSE | One DO per `queueId`; HTTP mutations via Hono |
| 4 | Customer MVP (join / status / ETA / leave) | Depends on queue actor + store |
| 5 | Operator MVP (call next / skip / remove / reset) | Needs auth + queue actor |
| 6 | Rolling-average ETA | Needs serve timestamps |
| 7 | Multi-counter / multi-location / billing | Stretch (multi-*queue* is in) |
| 8 | Production CF deploy + real D1 id | Not Assignment 1 |

## Next task

1. On green light: promote **one** impl vertical (auth skeleton *or* DO + `queueId` + SSE skeleton).
2. Keep worker on **Hono**; mutations HTTP; live board SSE.

## Do not

- Start both auth and queue actor in parallel without Focus room
- Reintroduce WebSocket unless a later need forces it
- Collect customer PII by default
- Deploy production CF for the course idea phase alone
