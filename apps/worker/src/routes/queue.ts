import { Hono } from "hono";
import { clientIp, verifySession, type Env } from "../lib/auth";

export type QueueEnv = Env;

const queue = new Hono<{ Bindings: QueueEnv }>();

function getQueueDO(c: any, queueId: string) {
  return c.env.QUEUE_DO.get(c.env.QUEUE_DO.idFromName(queueId));
}

async function requireOperator(c: any, next: () => Promise<void>) {
  const ok = await verifySession(c.env, c.req.raw);
  if (!ok) {
    return c.json({ error: "Operator authentication required." }, 401);
  }
  await next();
}

queue.post("/:queueId/join", async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);

  const meta = {
    userAgent: c.req.header("User-Agent")?.slice(0, 300),
    country: c.req.header("CF-IPCountry") || undefined,
    city: c.req.header("CF-IPCity") || undefined,
    language: c.req.header("Accept-Language")?.split(",")[0]?.slice(0, 24),
    ipHash: await hashIp(clientIp(c)),
  };

  const body = await c.req.json().catch(() => ({}));
  const res = await queueDO.fetch(
    new Request("https://queue/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meta: { ...meta, ...(body?.meta || {}) } }),
    })
  );
  return res;
});

queue.post("/:queueId/leave/:ticketId", async (c) => {
  const queueId = c.req.param("queueId")!;
  const ticketId = c.req.param("ticketId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request(`https://queue/leave/${ticketId}`, { method: "POST" }));
});

queue.post("/:queueId/call-next", requireOperator, async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request("https://queue/call-next", { method: "POST" }));
});

queue.post("/:queueId/skip/:ticketId", requireOperator, async (c) => {
  const queueId = c.req.param("queueId")!;
  const ticketId = c.req.param("ticketId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request(`https://queue/skip/${ticketId}`, { method: "POST" }));
});

queue.post("/:queueId/remove/:ticketId", requireOperator, async (c) => {
  const queueId = c.req.param("queueId")!;
  const ticketId = c.req.param("ticketId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request(`https://queue/remove/${ticketId}`, { method: "POST" }));
});

queue.post("/:queueId/reset", requireOperator, async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request("https://queue/reset", { method: "POST" }));
});

queue.post("/:queueId/settings", requireOperator, async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);
  const body = await c.req.json().catch(() => ({}));
  return queueDO.fetch(
    new Request("https://queue/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
});

queue.get("/:queueId", async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request("https://queue/board"));
});

export default queue;

async function hashIp(ip: string): Promise<string | undefined> {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`ql:${ip}`));
    return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return undefined;
  }
}
