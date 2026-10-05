# Shipped

Fold completed work here when a focus vertical closes.

| When | Receipt |
|------|---------|
| 2026-10-04 | Scaffold `cf-app` (`apps/web`, `apps/worker`) + init docs/control plane (Assignment 1 proposal, product scope, architecture open decisions). **No product features.** |
| 2026-10-04 | Architecture picks: DO live queue, D1 full ticket store, SSE + HTTP (Hono), staff accounts+roles, rolling ETA, **multi-queue via `queueId` in URL**. |
| 2026-10-05 | **Slice 1:** Queue DO (`QueueDO`) + SSE fan-out + HTTP mutation routes (`join`, `leave`, `call-next`, `skip`, `remove`, `reset`, board snapshot). Durable Object binding in `wrangler.toml`. Tests pass. |
