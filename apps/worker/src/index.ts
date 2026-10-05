import { Hono } from "hono";
import { cors } from "hono/cors";
import queueRoutes from "./routes/queue";
import streamRoutes from "./routes/stream";
import { QueueDO } from "./do/QueueDO";

export type Env = {
  DB: D1Database;
  QUEUE_DO: DurableObjectNamespace;
  ENVIRONMENT: string;
};

/** Exact origins we own / use for local dev. */
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://localhost:5173",
  "http://127.0.0.1:5173",
  "https://127.0.0.1:5173",
  "https://thequeueless.pages.dev",
]);

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Hashed Pages deployments: https://<hash>.thequeueless.pages.dev
  try {
    const url = new URL(origin);
    return (
      url.protocol === "https:" &&
      (url.hostname === "thequeueless.pages.dev" ||
        url.hostname.endsWith(".thequeueless.pages.dev"))
    );
  } catch {
    return false;
  }
}

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: (origin) => (isAllowedOrigin(origin) ? origin : null),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Accept"],
    exposeHeaders: ["Content-Type"],
    maxAge: 86400,
  })
);

app.get("/", (c) =>
  c.json({
    ok: true,
    service: "queueless",
    environment: c.env.ENVIRONMENT,
  }),
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

app.route("/api/queue", queueRoutes);
app.route("/api/queue", streamRoutes);

export { QueueDO };
export { app };
export default {
  fetch: app.fetch.bind(app),
};
