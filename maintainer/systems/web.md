# Web

Surface: `apps/web` (`@queueless/web`).

## Today

- Vite + React stub page (“scaffolded web surface”).
- No customer/operator routes yet.
- No API client wired.

## Intended (not built)

- Customer flow: join, ticket status, leave.
- Operator flow: dashboard, call next, skip/remove, reset.
- Same SPA, clearly separated routes/components.
- Talk to `apps/worker` via configurable base URL (env) — never hardcode production hosts in source.

## Notes

UI work waits on Focus + architecture decisions (`docs/architecture/overview.md`).
