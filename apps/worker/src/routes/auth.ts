import { Hono } from "hono";
import {
  clientIp,
  clearLoginFailures,
  loginRateLimited,
  pinMatches,
  recordLoginFailure,
  sessionCookie,
  signSession,
  verifySession,
  type Env,
} from "../lib/auth";

const auth = new Hono<{ Bindings: Env }>();

auth.post("/login", async (c) => {
  const ip = clientIp(c);
  const rate = await loginRateLimited(c.env, ip);
  if (rate.limited) {
    return c.json(
      { error: "Too many login attempts. Try again shortly." },
      429,
      { "Retry-After": String(rate.retryAfterSec) } as any
    );
  }

  let pin = "";
  try {
    const body = await c.req.json<{ pin?: string }>();
    pin = (body.pin || "").trim();
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400);
  }

  if (!pin) {
    return c.json({ error: "PIN is required." }, 400);
  }

  const ok = await pinMatches(c.env, pin);
  if (!ok) {
    await recordLoginFailure(c.env, ip);
    return c.json({ error: "Incorrect PIN." }, 401);
  }

  await clearLoginFailures(c.env, ip);
  const token = await signSession(c.env);
  c.header("Set-Cookie", sessionCookie(token), { append: true });
  return c.json({ ok: true, token });
});

auth.post("/logout", (c) => {
  c.header("Set-Cookie", sessionCookie(null), { append: true });
  return c.json({ ok: true });
});

auth.get("/me", async (c) => {
  const ok = await verifySession(c.env, c.req.raw);
  if (!ok) return c.json({ ok: false, error: "Not authenticated" }, 401);
  return c.json({ ok: true, role: "operator" });
});

export default auth;
