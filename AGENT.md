# AGENT.md — QueueLess

Coding agents: start here.

## Layout

| Path | Role |
|------|------|
| `apps/*` | Deployable apps (only if scaffolded) |
| `packages/*` | Shared libraries / CLI (only if scaffolded) |
| `docs/` | End-user / project docs |
| `maintainer/` | Control plane (phases, systems, agents, shipped, temp) |
| `maintainer/temp/` | Scratch — **gitignored** |

## Rules

1. Touch only scaffolded `apps/*` / `packages/*` that exist. Do not invent missing surfaces.
2. `maintainer/*` is the control plane — not product code.
3. `maintainer/temp` is scratch; never commit its contents.
4. Active focus: `maintainer/phases/focus.md` (max 3).
5. Read `maintainer/agents/architecture.md` and `maintainer/agents/git.md`.
6. After scaffold, use `maintainer/temp/CONTINUE.md` for the first agent round.
7. **Do not commit or push unless the user explicitly asks.**

## Commands

```bash
pnpm i
pnpm build
pnpm typecheck
pnpm test
pnpm knip
```
