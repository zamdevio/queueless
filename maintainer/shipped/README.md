# Shipped

| When | Receipt |
|------|---------|
| 2026-10-04 | Scaffold `cf-app` (`apps/web`, `apps/worker`) + init docs/control plane |
| 2026-10-04 | Architecture picks: DO, D1, SSE+HTTP (Hono), accounts, `queueId`, rolling ETA |
| 2026-10-05 | **Slice 1:** QueueDO + SSE + HTTP routes (demoable API) |
| 2026-10-05 | Deploy setup: global wrangler, JSONC configs, `queueless` worker + `thequeueless` pages |
| 2026-10-05 | **Deployed:** Worker → `queueless.zamdevio.workers.dev`, Pages → `thequeueless.pages.dev` |
| 2026-10-05 | **Slice 2:** Web SPA UI — student view (join, watch SSE), operator view (call-next, skip, remove, reset), hash routing, styled CSS |
