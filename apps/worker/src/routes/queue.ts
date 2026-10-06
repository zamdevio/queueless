import { Hono } from "hono";
import { clientIp, verifySession, type Env } from "../lib/auth";

export type QueueEnv = Env;

const queue = new Hono<{ Bindings: QueueEnv }>();

function getQueueDO(c: any, queueId: string) {
  return c.env.QUEUE_DO.get(c.env.QUEUE_DO.idFromName(queueId));
}

function getRateDO(c: any) {
  return c.env.RATE_LIMIT_DO.get(c.env.RATE_LIMIT_DO.idFromName("login-rate"));
}

async function requireOperator(c: any, next: () => Promise<void>) {
  const ok = await verifySession(c.env, c.req.raw);
  if (!ok) {
    return c.json({ error: "Operator authentication required." }, 401);
  }
  await next();
}

async function hashIp(ip: string): Promise<string | undefined> {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`ql:${ip}`));
    return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return undefined;
  }
}

queue.post("/:queueId/join", async (c) => {
  const queueId = c.req.param("queueId")!;
  const ip = clientIp(c);
  const ipHash = await hashIp(ip);

  // Join abuse: max 5 joins / 60s per IP per queue
  try {
    const joinKey = `join:${queueId}`;
    const rate = await getRateDO(c).fetch(
      new Request(
        `https://rate/check?ip=${encodeURIComponent(ip)}&key=${encodeURIComponent(joinKey)}`
      )
    );
    const rateData = (await rate.json()) as { limited: boolean; retryAfterSec: number };
    if (rateData.limited) {
      return c.json(
        { error: "Too many join attempts from this network. Try again shortly." },
        429,
        { "Retry-After": String(rateData.retryAfterSec) } as any
      );
    }
  } catch {
    // rate limiter unavailable — allow join
  }

  const queueDO = getQueueDO(c, queueId);
  const meta = {
    userAgent: c.req.header("User-Agent")?.slice(0, 300),
    country: c.req.header("CF-IPCountry") || undefined,
    city: c.req.header("CF-IPCity") || undefined,
    language: c.req.header("Accept-Language")?.split(",")[0]?.slice(0, 24),
    ipHash,
  };

  const body = await c.req.json().catch(() => ({}));
  const deviceId =
    typeof body?.deviceId === "string" && body.deviceId
      ? body.deviceId.slice(0, 64)
      : undefined;

  const res = await queueDO.fetch(
    new Request("https://queue/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meta: { ...meta, deviceId },
        name: body?.name,
        deviceId,
      }),
    })
  );

  const data = await res.json().catch(() => null);
  if (res.ok && data) {
    try {
      await getRateDO(c).fetch(
        new Request(
          `https://rate/fail?ip=${encodeURIComponent(ip)}&key=${encodeURIComponent(`join:${queueId}`)}`,
          { method: "POST" }
        )
      );
    } catch {
      // ignore
    }
  }

  return c.json(data, res.status as any);
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

queue.get("/:queueId/export", requireOperator, async (c) => {
  const queueId = c.req.param("queueId")!;
  const format = c.req.query("format") || "json";
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(
    new Request(`https://queue/export?format=${encodeURIComponent(format)}`)
  );
});

queue.get("/:queueId", async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request("https://queue/board"));
});

export default queue;
