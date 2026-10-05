import { Hono } from "hono";
import queueRoutes from "./routes/queue";
import streamRoutes from "./routes/stream";

export type Env = {
  DB: D1Database;
  QUEUE_DO: DurableObjectNamespace;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) =>
  c.json({
    ok: true,
    service: "queue-less",
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

app.route("/", queueRoutes);
app.route("/", streamRoutes);

export default app;
