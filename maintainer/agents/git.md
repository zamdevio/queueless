# Git — QueueLess

---

## 1. Never surprise the user

- **Do not commit** unless the user explicitly asks to commit.
- **Do not push** unless the user explicitly asks to push.
- **Do not** create tags, open PRs, or publish unless asked.

If unsure — **ask**.

---

## 2. Gates before commit

When the user asks to commit:

1. Inspect `git status` / `git diff` (staged + unstaged)
2. Exclude secrets and `maintainer/temp/`
3. Run a sensible local gate (`pnpm typecheck` / `pnpm test` / `pnpm build`) when the change warrants it
4. One logical change set per commit

Before push (when asked): confirm branch/remote; never force-push `main`/`master` unless explicitly demanded; never skip hooks unless asked.

---

## 3. Conventional commits

```text
<type>(optional-scope): <short imperative summary>
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `build`.

Scopes for this repo: `web`, `worker`, `docs`, `maintainer`, `course`.

Examples:

```text
docs(course): draft Assignment 1 idea proposal
docs(product): define MVP vs out-of-scope
docs(maintainer): set focus after scaffold init
feat(worker): join-queue endpoint (later)
chore: refresh lockfile after scaffold
```

---

## 4. Group related files

Commit logically related files together. Split unrelated drive-bys. Combine renames with their call-site updates.

Prefer splitting **course docs** from **runtime code** when both change in the same session.

---

## 5. Branches & tags

- Short-lived branches for multi-commit / reviewable work
- Tags for releases only (`v0.1.0`), never casual
- Amend only when asked, or when a hook rewrote your just-created **unpushed** commit

No course-platform or GitHub submission requirement is assumed for Assignment 1.

---

## 6. Secrets & temp

Keep out of git: `.env*`, `.dev.vars`, `maintainer/temp/**`, tokens, keys, real `database_id` values if treated as sensitive in your workflow.
