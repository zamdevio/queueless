# Policies & limits

| Rule | Limit | Breach |
|------|-------|--------|
| Login failures | 10 / 60s / IP | 429 |
| Join attempts | 5 / 60s / IP / queue | 429 |
| Active ticket per device | 1 per deviceId | 409 |
| Queue capacity | maxWaiting (default 50) | 409 |
| Operator mutations | PIN session | 401 |

## Device id

SPA stores UUID in localStorage (`queueless_device_id`). Sent as `deviceId` on join. On reload the SPA restores the matching active ticket. Same device cannot join twice.

## Test

```bash
BASE_URL=http://localhost:8787 node --experimental-strip-types scripts/test-worker-policies.ts
BASE_URL=https://queueless.zamdevio.workers.dev node --experimental-strip-types scripts/test-worker-policies.ts
```

Extend `scripts/test-worker-policies.ts` when adding rules.

## Management pack

Lecturer template: charter, backlog, milestones, roles, risks, change log, weekly status. Filled from product docs + shipped receipts — see `maintainer/phases/course-management-pack.md`.
