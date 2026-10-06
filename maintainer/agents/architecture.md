# Architecture — QueueLess

Contributor map of **what exists today**. Product intent lives in `docs/`.

---

## 1. Package topology

```text
QueueLess/
  apps/
    web/          # @queueless/web — Vite + React SPA
    worker/       # @queueless/worker — Cloudflare Worker + Hono + Durable Objects
  docs/           # Course, product, architecture
  maintainer/     # Control plane (phases, systems, agents, shipped)
  AGENT.md        # Agent entry
```

**Not scaffolded:** `packages/*`.

---

## 2. Boundaries

| Layer | Path | Owns |
|-------|------|------|
| SPA | `apps/web` | UI, client routing, calling the worker API |
| API | `apps/worker` | HTTP API, Hono, Durable Objects, auth, CORS |
| Docs | `docs/` | Course + product + architecture (end-user tone) |
| Control plane | `maintainer/` | Focus, systems maps, agent rules |

- Customer vs operator UX share one SPA; routes/components stay separated.
- Queue domain logic lives in `QueueDO` on the worker — not in the browser.
- `maintainer/temp/` is scratch and gitignored.

---

## 3. Runtime (decided)

```text
Browser (apps/web)
    │  HTTPS (mutations) + SSE (live board)
    ▼
Worker + Hono (apps/worker)
    ├── QueueDO per queueId     — live queue + SSE fan-out
    └── RateLimitDO             — per-IP operator login limiter
```

- **No D1 / no external DB.** All live state is in Durable Objects.
- **Auth:** operator PIN → signed session (Bearer + cookie).
- **CORS:** `ALLOWED_ORIGINS` from `wrangler.jsonc` vars.
- **Updates:** SSE; mutations stay on HTTP.
- **Queue shape:** multi-queue via `queueId` in URL (default UI queue `main`).

Details: [`../../docs/architecture/overview.md`](../../docs/architecture/overview.md).

---

## 4. Where new code goes

| Change | Land in |
|--------|---------|
| Customer / operator UI | `apps/web/src/…` |
| HTTP routes / queue API | `apps/worker/src/routes/…` |
| Queue domain | `apps/worker/src/do/QueueDO.ts` |
| Login rate limit | `apps/worker/src/do/RateLimitDO.ts` |
| Subsystem maps | `maintainer/systems/<name>.md` |
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
