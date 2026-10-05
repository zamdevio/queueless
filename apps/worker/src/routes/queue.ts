import { Hono } from "hono";

export type QueueEnv = {
  QUEUE_DO: DurableObjectNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
};

const queue = new Hono<{ Bindings: QueueEnv }>();

function getQueueDO(c: any, queueId: string) {
  return c.env.QUEUE_DO.get(c.env.QUEUE_DO.idFromName(queueId));
}

// Paths are relative to /api/queue mount → /api/queue/:queueId/join
queue.post("/:queueId/join", async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request("https://queue/join", { method: "POST" }));
});

queue.post("/:queueId/leave/:ticketId", async (c) => {
  const queueId = c.req.param("queueId")!;
  const ticketId = c.req.param("ticketId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request(`https://queue/leave/${ticketId}`, { method: "POST" }));
});

queue.post("/:queueId/call-next", async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request("https://queue/call-next", { method: "POST" }));
});

queue.post("/:queueId/skip/:ticketId", async (c) => {
  const queueId = c.req.param("queueId")!;
  const ticketId = c.req.param("ticketId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request(`https://queue/skip/${ticketId}`, { method: "POST" }));
});

queue.post("/:queueId/remove/:ticketId", async (c) => {
  const queueId = c.req.param("queueId")!;
  const ticketId = c.req.param("ticketId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request(`https://queue/remove/${ticketId}`, { method: "POST" }));
});

queue.post("/:queueId/reset", async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request("https://queue/reset", { method: "POST" }));
});

queue.get("/:queueId", async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);
  return queueDO.fetch(new Request("https://queue/board"));
});

export default queue;
