# Phase: Web SPA UI

**Status:** Active

**Goal:** Student + operator UI wired to deployed worker API.

---

## Scope

### In this phase

- **Student view:** join queue, see position, watch live updates via SSE
- **Operator view:** call next, skip, remove (no auth gate yet — open access)
- **API client:** configurable base URL via env (`VITE_API_URL`)
- **Queue selection:** `queueId` from URL path (e.g. `/queue/library-desk`)

### Out of this phase

- Staff accounts / roles (gate operator side later)
- ETA (needs serve timestamps from call-next)
- D1 schema (DO holds live state)

---

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page (choose queue or direct link) |
| `/queue/:queueId` | Student view (join, watch position) |
| `/operator/:queueId` | Operator view (call next, skip, remove) |

---

## Components

### Student view (`apps/web/src/views/StudentView.tsx`)

- Join button → calls `POST /api/queue/:queueId/join`
- Ticket number display
- Position in line (from board snapshot)
- Now-serving number
- SSE connection for live updates (`GET /api/queue/:queueId/stream`)

### Operator view (`apps/web/src/views/OperatorView.tsx`)

- Queue list (from board snapshot)
- Call next button → `POST /api/queue/:queueId/call-next`
- Skip button per ticket → `POST /api/queue/:queueId/skip/:ticketId`
- Remove button per ticket → `POST /api/queue/:queueId/remove/:ticketId`
- Reset button → `POST /api/queue/:queueId/reset`

### API client (`apps/web/src/lib/api.ts`)

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'https://queueless.zamdevio.workers.dev';

export async function joinQueue(queueId: string) {
  return fetch(`${API_BASE}/api/queue/${queueId}/join`, { method: 'POST' });
}

export async function callNext(queueId: string) {
  return fetch(`${API_BASE}/api/queue/${queueId}/call-next`, { method: 'POST' });
}

export async function getBoard(queueId: string) {
  return fetch(`${API_BASE}/api/queue/${queueId}`);
}

export function subscribeToQueue(queueId: string, onEvent: (event: QueueEvent) => void) {
  const evtSource = new EventSource(`${API_BASE}/api/queue/${queueId}/stream`);
  evtSource.onmessage = (e) => onEvent(JSON.parse(e.data));
  return evtSource;
}
```

---

## Implementation order

1. `apps/web/src/lib/api.ts` — API client
2. `apps/web/src/views/StudentView.tsx` — student join + watch
3. `apps/web/src/views/OperatorView.tsx` — operator controls
4. `apps/web/src/App.tsx` — routing (React Router or simple hash routing)
5. `apps/web/src/main.tsx` — wire everything
6. Update `maintainer/phases/focus.md`

---

## Success criteria

- Student can join a queue and see their number
- Student sees live updates (position, now-serving) via SSE
- Operator can call next, skip, remove
- `pnpm web:dev` works locally
- `pnpm web:deploy` builds + deploys fresh
