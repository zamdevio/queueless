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
| `pnpm worker:deploy` | Deploy Worker + Durable Objects |
| `pnpm web:deploy` | Build + deploy Pages |

## Configuration (one place per app)

| App | File | Keys |
|-----|------|------|
| Web | `apps/web/.env` or `.env.production` | `VITE_API_URL` (default `http://localhost:8787`) |
| Worker | `apps/worker/wrangler.jsonc` | `ALLOWED_ORIGINS`, `ENVIRONMENT` |
| Worker secrets | `.dev.vars` / `wrangler secret put` | `OPERATOR_PIN`, optional `SESSION_SECRET` |

Copy `apps/web/.env.example` and `apps/worker/.dev.vars.example` before first run.

**Operator PIN (prod):** `cd apps/worker && wrangler secret put OPERATOR_PIN`

## Product

| | |
|--|--|
| **Customer** | Anonymous ticket, live position, ETA, dialog when called |
| **Operator** | PIN sign-in, call next / skip / remove / reset, capacity, stats |
| **Docs** | In-app Guide · Development · About (sidebar) |

Default queue id: `main`. Any `/student/{id}` · `/operator/{id}` · `/docs/{page}`.

## Stack

- **Web:** React + Vite SPA, PWA (manifest + service worker)
- **API:** Cloudflare Workers + Hono
- **Live queue:** Durable Object per `queueId`
- **Login rate limit:** dedicated Durable Object (per-IP, 10 fails / 60s)
- **Updates:** SSE
- **Auth:** Operator PIN → signed session (Bearer + cookie)
- **Database:** **None** — state lives in Durable Objects (no D1/KV/R2)

## Deploy (free Cloudflare — simple resources)

Simple Cloudflare resources only — no D1, no R2, no external DB.

1. Fork/clone this repo, `pnpm install`
2. `cd apps/worker && wrangler secret put OPERATOR_PIN`
3. `pnpm worker:deploy` then set `VITE_API_URL` in `apps/web/.env.production` and `pnpm web:deploy`
4. Set `ALLOWED_ORIGINS` in `apps/worker/wrangler.jsonc` to your Pages domain, redeploy worker

## Layout

```text
apps/web/       React SPA + PWA
apps/worker/    Hono API + QueueDO + RateLimitDO + auth
docs/           Course, product, architecture
maintainer/     Focus, systems, agents, shipped
```

Agents: start at [`AGENT.md`](./AGENT.md) · Active focus: [`maintainer/phases/focus.md`](./maintainer/phases/focus.md)

**Rate limit & security notes:** [`maintainer/systems/auth.md`](./maintainer/systems/auth.md) · [`docs/architecture/overview.md`](./docs/architecture/overview.md)
