# Phase: Production-ready QueueLess

**Status:** Active  
**Goal:** Real usable system — no demo labels, operator PIN, queue capacity, richer tickets, toasts/dialogs, in-app docs.

---

## Scope (this phase)

### Product
- [ ] Remove all “demo” labels / default queue `main`
- [ ] Operator PIN login + rate limit (10 rpm) + signed session cookie
- [ ] Queue max waiting size (operator can set; join blocked when full)
- [ ] Richer ticket meta on join (UA, CF country/city, language, hashed IP)
- [ ] Operator UI: login gate, capacity control, richer rows (UA/country)
- [ ] Sonner toasts (theme-aware): join, PWA install, errors
- [ ] **Call dialog** when student’s number is called (no toast for served)
- [ ] PWA sidebar: show “Installed” when already installed (section stays)
- [ ] Docs section in sidebar: Guide · Development · About
- [ ] Repo README + docs + maintainer systems/shipped updated

### Out
- Full JWT provider / OAuth
- D1 ticket history schema (still DO-live)
- Multi-role RBAC beyond operator PIN

---

## Architecture notes

| Concern | Choice |
|---------|--------|
| Operator auth | `OPERATOR_PIN` secret + HMAC session cookie `ql_op_session` |
| Rate limit | In-memory per-IP sliding window on login (10/min) |
| Queue capacity | DO `settings.maxWaiting` (default 50); operator POST settings |
| Client meta | CF headers on join → DO ticket `meta` (IP hashed) |
| Toasts | `sonner` + theme from `useTheme` |
| Called UX | Modal dialog on student when their ticket is called |
| Default queue | `main` (not `demo`) |

## Next task

1. Implement worker auth + settings + meta
2. Wire web: login, toasts, dialog, docs, PWA state
3. Update README/docs/maintainer
4. Deploy worker + pages; set `OPERATOR_PIN` secret
