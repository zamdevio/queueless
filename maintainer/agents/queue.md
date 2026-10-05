# Queue DO — implementation guide

## Durable Object: `QueueDO`

Per `queueId` instance. Holds:
- `tickets`: Map<ticketId, {id, number, state}>
- `nowServing`: number
- `subscribers`: Set<WritableStream<Uint8Array>> (SSE connections)

### Methods

| Method | Input | Output | Side effect |
|--------|-------|--------|-------------|
| `join()` | `queueId` | `{id, number}` | Adds ticket, broadcasts `join` |
| `leave(ticketId)` | `ticketId` | void | Marks left, broadcasts `leave` |
| `callNext()` | `queueId` | `{id, number} \| null` | Marks called, sets nowServing, broadcasts `call` |
| `skip(ticketId)` | `ticketId` | void | Marks skipped, broadcasts `skip` |
| `remove(ticketId)` | `ticketId` | void | Marks removed, broadcasts `remove` |
| `reset()` | `queueId` | void | Clears tickets, resets nowServing, broadcasts `reset` |
| `getBoard()` | `queueId` | `{tickets, nowServing, nextNumber}` | Snapshot (no broadcast) |

### SSE fan-out

When state changes:
1. Iterate `subscribers`
2. Write `data: {event, data}\n\n` to each stream
3. Handle write errors (remove dead subscribers)

### Connection tracking

SSE endpoint (`GET /api/queue/:queueId/stream`) adds the stream to `subscribers` on connect, removes on close/error.

---

## Routes

### HTTP mutations (POST)

| Route | Input | Output |
|-------|-------|--------|
| `POST /api/queue/:queueId/join` | — | `{ticketId, number}` |
| `POST /api/queue/:queueId/leave/:ticketId` | — | `{ok: true}` |
| `POST /api/queue/:queueId/call-next` | — | `{ticketId, number, nowServing}` or `null` |
| `POST /api/queue/:queueId/skip/:ticketId` | — | `{ok: true}` |
| `POST /api/queue/:queueId/remove/:ticketId` | — | `{ok: true}` |
| `POST /api/queue/:queueId/reset` | — | `{ok: true}` |

### HTTP snapshot (GET)

| Route | Output |
|-------|--------|
| `GET /api/queue/:queueId` | `{tickets, nowServing, nextNumber}` |

### SSE stream (GET)

| Route | Headers | Body |
|-------|---------|------|
| `GET /api/queue/:queueId/stream` | `Content-Type: text/event-stream`, `Cache-Control: no-cache` | `data: {event, data}\n\n` |

---

## Wrangler config

```toml
[[durable_objects.bindings]]
name = "QUEUE_DO"
class_name = "QueueDO"
```

Access in Hono: `c.env.QUEUE_DO.get(c.env.QUEUE_DO.idFromName(queueId))`

---

## Ticket states

- `waiting` — in line, can be called/skipped/removed
- `called` — now serving (or was, until reset)
- `served` — done (optional, for history)
- `skipped` — skipped by staff
- `left` — left the queue
- `removed` — removed by staff

MVP only needs: `waiting`, `called`, `left`, `skipped`, `removed`.
