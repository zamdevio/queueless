# Architecture overview — QueueLess

**Decided (v1 production):**

| Topic | Choice |
|-------|--------|
| API | Cloudflare Workers + Hono |
| Live queue | Durable Object per `queueId` |
| Updates | SSE + HTTP mutations |
| Realtime transport | SSE (not WebSocket) |
| Operator access | PIN → signed session cookie (10 rpm login limit) |
| ETA | Deferred (needs serve timestamps) |
| Queue shape | Multi-queue via URL; default UI queue `main` |
| Capacity | `maxWaiting` per queue (operator) |
| Ticket meta | UA + CF country/city + hashed IP |
| DB | D1 binding present; live queue state in DO |

## Runtime

```text
Browser
  → Worker (Hono)
      ├─ /api/auth/*  (PIN login, session)
      ├─ /api/queue/* (join public; operator actions gated)
      └─ QueueDO per queueId (state + SSE)
  D1 binding (available)
```

## Still open

- Rolling ETA from serve timestamps
- Full accounts / multi-role RBAC
- DO → D1 history sync
