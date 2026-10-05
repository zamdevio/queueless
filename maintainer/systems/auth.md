# Operator auth

**Status:** live v1 — PIN + signed HttpOnly cookie

## Flow

1. `POST /api/auth/login` `{ pin }` — rate limited **10 rpm / IP**
2. Success → `Set-Cookie` `ql_op_session` (HMAC, ~12h expiry, SameSite=Strict)
3. Operator mutations require the cookie (`credentials: include` on the SPA)
4. `POST /api/auth/logout` clears cookie; `GET /api/auth/me` → `{ ok: true }` or 401

## Secrets

| Name | Where |
|------|--------|
| `OPERATOR_PIN` | `wrangler secret put OPERATOR_PIN` · local `apps/worker/.dev.vars` |
| `SESSION_SECRET` | optional; falls back to PIN-derived key |

## Rate limit

In-memory sliding window per IP (Worker isolate): **10 failures / 60s**. Successful login clears the window.

## Customer side

No accounts. Anonymous tickets only.

## Out

OAuth / multi-user RBAC (queued).
