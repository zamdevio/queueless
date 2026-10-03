# Agent rules — QueueLess

1. Touch only scaffolded `apps/web` and `apps/worker`. Do not invent `packages/*` or extra apps.
2. `maintainer/*` is the control plane; `docs/` is course/product narrative — keep the split clean.
3. `maintainer/temp` is scratch and gitignored — never commit it.
4. Keep `phases/focus.md` at max 3 active verticals.
5. Prefer anonymous queue identities; do not collect PII without an explicit requirement.
6. Do not implement product features while Focus says init/architecture-only.
7. Prefer small, verified steps (`pnpm typecheck` / `pnpm test` / `pnpm build` when present).
8. **Do not commit or push unless the user explicitly asks** — see [`git.md`](./git.md).
