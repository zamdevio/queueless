<div align="center">
  <img src="https://thequeueless.pages.dev/icons/icon.svg" width="72" height="72" alt="QueueLess logo" />

  <h1>QueueLess</h1>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
  [![Node.js >= 20](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![pnpm](https://img.shields.io/badge/pnpm-package%20manager-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
  [![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20Pages-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)

  <p><strong>Digital queues for campus services, clinics, and small businesses.</strong></p>
  <p>
    Customers join from a phone, watch their position, and get called when it is their turn.
    Staff run a PIN-protected operator dashboard with capacity limits, rolling ETA stats, and history export.
  </p>
  <p>
    <a href="https://thequeueless.pages.dev">Live app</a> ·
    <a href="https://github.com/zamdevio/queueless">GitHub</a> ·
    <a href="https://thequeueless.pages.dev/docs/guide">Guide</a> ·
    <a href="https://thequeueless.pages.dev/docs/development">Deploy</a>
  </p>
</div>

---

QueueLess is a lightweight queue system on **Cloudflare Workers + Durable Objects** — no D1, no external database. Deploy with a free Cloudflare account (Workers + Pages + one secret).

| Surface | URL | Role |
|---------|-----|------|
| **App** | [thequeueless.pages.dev](https://thequeueless.pages.dev) | SPA (customer, operator, board, docs) |
| **API** | [queueless.zamdevio.workers.dev](https://queueless.zamdevio.workers.dev) | Hono worker + Durable Objects |
| **Source** | [github.com/zamdevio/queueless](https://github.com/zamdevio/queueless) | Monorepo |

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
| `pnpm test:policies` | Run worker policy tests (see scripts/) |

## Configuration (one place per app)

| App | File | Keys |
|-----|------|------|
| Web | `apps/web/.env` / `.env.production` | `VITE_API_URL` (local default `http://localhost:8787`) |
| Worker | `apps/worker/wrangler.jsonc` | `ALLOWED_ORIGINS`, `ENVIRONMENT` |
| Secrets | `.dev.vars` / `wrangler secret put` | `OPERATOR_PIN`, optional `SESSION_SECRET` |

**Operator PIN (prod):** `cd apps/worker && wrangler secret put OPERATOR_PIN`

## Product

| | |
|--|--|
| **Customer** | Optional display name, live position, ETA, call dialog; ticket restored after reload (device UUID) |
| **Operator** | PIN sign-in, call next / skip / remove / reset, capacity, rolling stats, CSV/JSON/Markdown export, copy board link |
| **Board** | `/board/:queueId` live monitor |
| **Policies** | Login 10 fails/min/IP · join 5/min/IP/queue · one ticket per device · capacity — see docs/product/policies.md |

Default queue id: `main`. Routes: `/student/{id}` · `/operator/{id}` · `/board/{id}` · `/docs/{page}`.

## Stack

- **Web:** React + Vite SPA, PWA, SVG icons
- **API:** Cloudflare Workers + Hono
- **Live queue:** Durable Object per `queueId` (`QueueDO`)
- **Rate limit:** `RateLimitDO` (login + join, per-IP, DO storage)
- **Updates:** SSE
- **Auth:** Operator PIN → signed session (Bearer + cookie)
- **Database:** None — state in Durable Objects

## Deploy (free Cloudflare — simple resources)

1. Clone this repo, `pnpm install`
2. `cd apps/worker && wrangler secret put OPERATOR_PIN`
3. `pnpm worker:deploy`
4. Set `VITE_API_URL` in `apps/web/.env.production` → `pnpm web:deploy`
5. Add Pages domain to `ALLOWED_ORIGINS` in `apps/worker/wrangler.jsonc`, redeploy worker

## Policy tests

```bash
BASE_URL=https://queueless.zamdevio.workers.dev pnpm test:policies
```

## Layout

```text
apps/web/       React SPA + PWA (customer, operator, board, docs)
apps/worker/    Hono API + QueueDO + RateLimitDO
docs/           Course, product, architecture, policies
maintainer/     Focus, systems, agents, shipped
scripts/        Policy/rule test harness
```

Agents: AGENT.md · Focus: maintainer/phases/focus.md
