# QueueLess

Lightweight **digital queue** for small businesses and campus-style service points: customers join from a link/QR, watch their number, and staff call the next person from a simple operator view.

> **Status:** Scaffolded foundation + planning docs. Product features are **not** implemented yet.

## Quick start

```bash
pnpm i
pnpm build
pnpm typecheck
```

| Command | What |
|---------|------|
| `pnpm web:dev` | Vite SPA |
| `pnpm worker:dev` | Worker (needs local D1 / wrangler setup when you use `/health`) |
| `pnpm knip` | Unused export / dependency check |

Agents and contributors: start at [`AGENT.md`](./AGENT.md). Active focus: [`maintainer/phases/focus.md`](./maintainer/phases/focus.md).

## Docs

| Doc | Purpose |
|-----|---------|
| [`docs/course/assignment-1.md`](./docs/course/assignment-1.md) | Course idea proposal (Assignment 1) |
| [`docs/product/purpose.md`](./docs/product/purpose.md) | Product purpose |
| [`docs/product/scope.md`](./docs/product/scope.md) | MVP vs out of scope vs stretch |
| [`docs/architecture/overview.md`](./docs/architecture/overview.md) | Intended architecture + open decisions |

Course docs ≠ product docs. Assignment 1 does **not** require a deployed app.

## Layout

```text
apps/web/       React + Vite SPA
apps/worker/    Cloudflare Worker + Hono (+ D1 stub)
docs/           Course, product, architecture
maintainer/     Focus, systems, agents, shipped (control plane)
```

Scaffolded with `@zamdevio/scaffolder` (`cf-app`). Deploy-to-free-Cloudflare is a later goal, not a current gate.
