# Focus

**Rule:** Focus now = **max 3**. Everything else stays queued until a Focus slot frees.

**Shipped receipts:** [`../shipped/README.md`](../shipped/README.md)  
**Architecture:** [`../../docs/architecture/overview.md`](../../docs/architecture/overview.md)

---

## Focus now

| Priority | Vertical | Notes |
|----------|----------|-------|
| 1 | Web SPA UI | **Shipped** — student + operator views wired to deployed worker |
| 2 | Deploy web | `pnpm web:deploy` → thequeueless.pages.dev |
| 3 | Demo + polish | Test the full flow, fix UX issues |

## Queued — do not start

| # | Item | Why parked |
|---|------|------------|
| 1 | D1 ticket schema | DO holds live state; add D1 after UI demo |
| 2 | ETA | Needs serve timestamps |
| 3 | Staff accounts / roles | Gate operator side |
| 4 | Production hardening | After UI demo |

## Deployed

- Worker: `https://queueless.zamdevio.workers.dev`
- Pages: `https://thequeueless.pages.dev`

## Next task

1. Deploy web: `pnpm web:deploy`
2. Demo: student joins → sees position → staff calls next

## Do not

- Collect student PII by default
- Deploy production CF for the course idea phase alone
