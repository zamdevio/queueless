# Operator auth

**Status:** live v1 — PIN + signed session (Bearer + cookie)

## Flow

1. `POST /api/auth/login` `{ pin }` — rate limited **10 failed attempts / 60s per IP**
2. Success → token in response body + `Set-Cookie` `ql_op_session` (HMAC, ~12h, SameSite=None; Secure)
3. Operator mutations require Bearer token or cookie
4. `POST /api/auth/logout` clears cookie; `GET /api/auth/me` → `{ ok: true }` or 401

## Secrets

| Name | Where |
|------|--------|
| `OPERATOR_PIN` | `wrangler secret put OPERATOR_PIN` · local `apps/worker/.dev.vars` |
| `SESSION_SECRET` | optional; falls back to PIN-derived key |

## Rate limit (DO-backed)

Login rate limiting uses a **dedicated Durable Object** (`RATE_LIMIT_DO` / `RateLimitDO`):

- One DO instance for all logins; failures stored **per IP** in DO storage
- Window: **60 seconds**, max **10 failed attempts** per IP
- On limit: `429` + `Retry-After` header
- Successful PIN login **clears** that IP’s failure count
- Not in-memory Worker isolate state — survives isolate restarts (DO storage)

Client IP: `CF-Connecting-IP` (Cloudflare).

## Customer side

No accounts. Anonymous tickets only.

## Out

OAuth / multi-user RBAC — **skipped for course MVP**. PIN is enough.
