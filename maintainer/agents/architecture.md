# Architecture — QueueLess

Contributor map of **what exists today** and where new code should land. Product intent lives in `docs/`; open decisions stay marked open.

---

## 1. Package topology

Scaffolded with `@zamdevio/scaffolder` preset `cf-app` (fragments: `web`, `worker`).

```text
QueueLess/
  apps/
    web/          # @queueless/web — Vite + React SPA (customer + operator UI later)
    worker/       # @queueless/worker — Cloudflare Worker + Hono (+ D1 binding stub)
  docs/           # Public / course / product docs (no sprint language)
  maintainer/     # Control plane (phases, systems, agents, shipped, temp)
  AGENT.md        # Agent entry
```

**Not scaffolded:** `packages/*`. Do not invent shared packages until a real cross-app need appears.

---

## 2. Boundaries

| Layer | Path | Owns |
|-------|------|------|
| SPA | `apps/web` | UI, client routing, calling the worker API |
| API | `apps/worker` | HTTP API, bindings (D1 today; DO later if chosen), validation |
| Docs | `docs/` | Course + product + high-level architecture (end-user tone) |
| Control plane | `maintainer/` | Focus, systems maps, agent rules — not runtime |

- Customer vs operator UX share one SPA for MVP simplicity; keep routes/components clearly separated.
- Domain rules for queue ordering and concurrency belong on the worker (and DO if adopted), not in the browser as source of truth.
- `maintainer/temp/` is scratch and gitignored — never commit it.

---

## 3. Runtime (decided direction)

```text
Browser (apps/web)
    │  HTTPS (mutations) + SSE (live board)
    ▼
Worker + Hono (apps/worker)
    ├── Durable Object — live queue + SSE fan-out (not wired yet)
    └── D1 — full ticket / account store (binding stubbed)
```

Locked choices: **Hono** worker, DO + D1, **SSE** + HTTP mutations, staff accounts/roles, rolling ETA, **`queueId` in URL**.  
Details: [`../../docs/architecture/overview.md`](../../docs/architecture/overview.md).

---

## 4. Where new code goes

| Change | Land in |
|--------|---------|
| Customer or operator UI | `apps/web/src/…` |
| HTTP routes / queue API | `apps/worker/src/…` |
| SQL migrations (if D1 kept) | `apps/worker/drizzle/…` |
| Subsystem “how it wires” | `maintainer/systems/<name>.md` |
| Sprint focus | `maintainer/phases/focus.md` |
| Course / product narrative | `docs/course/…`, `docs/product/…` |

---

## 5. Health gates

```bash
pnpm i
pnpm typecheck
pnpm test
pnpm knip
pnpm build
```

Deploy scripts exist on the worker (`pnpm worker:deploy`) but production Cloudflare resources are **not** part of Assignment 1.
