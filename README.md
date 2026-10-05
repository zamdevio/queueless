# QueueLess

Lightweight **digital queue** for campus services, clinics, and small businesses — customers join from a phone, watch their place in line, and staff call the next person from an operator dashboard.

> **Live:** [thequeueless.pages.dev](https://thequeueless.pages.dev) · API: [queueless.zamdevio.workers.dev](https://queueless.zamdevio.workers.dev)

## Quick start

```bash
pnpm install
pnpm typecheck && pnpm build && pnpm test
```

| Command | What |
|---------|------|
| `pnpm web:dev` | SPA on http://localhost:5173 |
| `pnpm worker:dev` | API on http://localhost:8787 |
| `pnpm worker:deploy` | Deploy Worker + Durable Object |
| `pnpm web:deploy` | Build + deploy Pages |
| `pnpm db:migrate:local` / `db:migrate:remote` | D1 migrations |

**Operator PIN:** set with `wrangler secret put OPERATOR_PIN` (prod) or `apps/worker/.dev.vars` (local).

## Product

| | |
|--|--|
| **Customer** | Anonymous ticket, live position, dialog when called |
| **Operator** | PIN sign-in, call next / skip / remove / reset, queue capacity |
| **Docs** | In-app Guide · Development · About (sidebar) |

Default queue id: `main`. Any `/student/{id}` · `/operator/{id}` · `/docs/{page}`.

## Stack

- **Web:** React + Vite SPA, PWA (manifest + service worker)
- **API:** Cloudflare Workers + Hono
- **Live queue:** Durable Object per `queueId`
- **Updates:** SSE
- **Auth:** Operator PIN → signed HttpOnly cookie
- **DB:** D1 binding (queue state lives in the DO)

## Deploy (free Cloudflare)

1. Fork/clone this repo, `pnpm install`
2. `wrangler d1 create queueless` → paste `database_id` into `apps/worker/wrangler.jsonc`
3. `wrangler secret put OPERATOR_PIN` from `apps/worker`
4. `pnpm worker:deploy` then `pnpm web:deploy`
5. Point Pages project name in `apps/web/package.json` at your project

## Layout

```text
apps/web/       React SPA + PWA
apps/worker/    Hono API + QueueDO + auth
docs/           Course, product, architecture
maintainer/     Focus, systems, agents, shipped
```

Agents: start at [`AGENT.md`](./AGENT.md) · Active focus: [`maintainer/phases/focus.md`](./maintainer/phases/focus.md)
