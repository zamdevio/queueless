import { Hono } from "hono";
import { cors } from "hono/cors";
import queueRoutes from "./routes/queue";
import streamRoutes from "./routes/stream";
import authRoutes from "./routes/auth";
import { QueueDO } from "./do/QueueDO";
import type { Env } from "./lib/auth";

export type WorkerEnv = Env & {
  ALLOWED_ORIGINS?: string;
  ENVIRONMENT?: string;
};

/**
 * Origins come from wrangler.jsonc `vars.ALLOWED_ORIGINS` (comma-separated).
 * Default for local SPA: http://localhost:5173
 * Also accepts a pages.dev host and allows any subdomain of it (hashed deploys).
 */
function parseAllowedOrigins(env: WorkerEnv): Set<string> {
  const raw = env.ALLOWED_ORIGINS ?? "http://localhost:5173";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().replace(/\/+$/, ""))
      .filter(Boolean)
  );
}

function isAllowedOrigin(allowed: Set<string>, origin: string): boolean {
  if (!origin) return false;
  const clean = origin.replace(/\/+$/, "");
  if (allowed.has(clean)) return true;
  try {
    const url = new URL(clean);
    for (const a of allowed) {
      try {
        const au = new URL(a);
        if (
          url.protocol === au.protocol &&
          (url.hostname === au.hostname || url.hostname.endsWith(`.${au.hostname}`))
        ) {
          // subdomain only meaningful for pages.dev / similar hosts
          if (au.hostname.includes("pages.dev") || au.hostname.includes("workers.dev")) {
            return true;
          }
          if (url.hostname === au.hostname) return true;
        }
      } catch {
        // skip invalid entry
      }
    }
  } catch {
    // skip invalid origin
  }
  return false;
}

const app = new Hono<{ Bindings: WorkerEnv }>();

app.use("*", async (c, next) => {
  const allowed = parseAllowedOrigins(c.env);
  const origin = c.req.header("Origin");
  const corsMiddleware = cors({
    origin: (o) => (isAllowedOrigin(allowed, o || "") ? o : null),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Accept", "Authorization"],
    exposeHeaders: ["Content-Type"],
    credentials: true,
    maxAge: 86400,
  });
  return corsMiddleware(c, next);
});

app.get("/", (c) =>
  c.json({
    ok: true,
    service: "queueless",
    environment: c.env.ENVIRONMENT ?? "unknown",
    allowedOrigins: parseAllowedOrigins(c.env),
  })
);

app.get("/health", async (c) => {
  try {
    await c.env.DB.prepare("SELECT 1 AS ok").first();
    return c.json({ ok: true, db: "up" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ ok: false, db: "down", message }, 503);
  }
});

app.route("/api/auth", authRoutes);
app.route("/api/queue", queueRoutes);
app.route("/api/queue", streamRoutes);

export { QueueDO };
export { app };
export default {
  fetch: app.fetch.bind(app),
};
