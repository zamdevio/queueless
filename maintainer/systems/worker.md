# Worker

Surface: `apps/worker` (`@queueless/worker`).

- **Runtime:** Cloudflare Workers + **Hono**
- **Queue:** `QueueDO` per `queueId` (join/call/skip/remove/reset/settings + SSE)
- **Auth:** `POST /api/auth/login` PIN → cookie `ql_op_session`; operator mutations require session
- **CORS:** `localhost:5173` + `*.thequeueless.pages.dev`
- **D1:** binding `DB` (queue state in DO; D1 available for later history)

## Secrets

```bash
wrangler secret put OPERATOR_PIN   # prod
# apps/worker/.dev.vars → OPERATOR_PIN=...  # local
```

## Routes (summary)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/login` | — (rate limited 10 rpm/IP) |
| POST | `/api/auth/logout` | — |
| GET | `/api/auth/me` | session |
| POST | `/api/queue/:id/join` | — |
| POST | `/api/queue/:id/leave/:ticketId` | — |
| GET | `/api/queue/:id` | — |
| GET | `/api/queue/:id/stream` | — (SSE) |
| POST | `/api/queue/:id/call-next` | operator |
| POST | `/api/queue/:id/skip/:ticketId` | operator |
| POST | `/api/queue/:id/remove/:ticketId` | operator |
| POST | `/api/queue/:id/reset` | operator |
| POST | `/api/queue/:id/settings` | operator |

Default queue id in UI: `main`.
