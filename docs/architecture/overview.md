# Architecture overview — QueueLess

**Decided (v1 production):**

| Topic | Choice |
|-------|--------|
| API | Cloudflare Workers + Hono |
| Live queue | Durable Object per `queueId` (`QueueDO`) |
| Login rate limit | Dedicated Durable Object (`RateLimitDO`), per-IP, 10 fails / 60s |
| Updates | SSE + HTTP mutations |
| Operator access | PIN → signed session (Bearer + cookie) |
| ETA | Rolling avg service time × position |
| Queue shape | Multi-queue via URL; default UI queue `main` |
| Capacity | `maxWaiting` per queue (operator) |
| Ticket meta | UA + CF country/city + hashed IP |
| Database | **None** — all state in Durable Objects (D1 not used) |

## Runtime

```text
Browser
  → Worker (Hono)
      ├─ /api/auth/*  (PIN login, RateLimitDO per IP)
      ├─ /api/queue/* (join public; operator actions gated)
      └─ QueueDO per queueId (state + SSE + ETA stats)
```

## Rate limit (security)

Operator login is rate limited through `RateLimitDO` — not Worker isolate memory. See [`maintainer/systems/auth.md`](../../maintainer/systems/auth.md).

## Cloudflare resources for deploy

Simple free-tier stack only:

- Workers (API + Durable Objects)
- Pages (SPA)
- One secret (`OPERATOR_PIN`)

No D1, R2, KV, or external database setup.

## Still open

- Full accounts / multi-role RBAC (**skipped for course MVP**)
- Join abuse rate-limit (operator login is limited; public join is not)
