import { Hono } from "hono";

export type QueueEnv = {
  QUEUE_DO: DurableObjectNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
};

const queue = new Hono<{ Bindings: QueueEnv }>();

function getQueueDO(c: any, queueId: string) {
  const doId = c.env.QUEUE_DO.idFromName(queueId);
  return c.env.QUEUE_DO.get(doId);
}

queue.post("/:queueId/join", async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);
  const res = await queueDO.fetch(new Request("https://queue/join", { method: "POST" }));
  return res;
});

queue.post("/:queueId/leave/:ticketId", async (c) => {
  const queueId = c.req.param("queueId")!;
  const ticketId = c.req.param("ticketId")!;
  const queueDO = getQueueDO(c, queueId);
  const res = await queueDO.fetch(new Request(`https://queue/leave/${ticketId}`, { method: "POST" }));
  return res;
});

queue.post("/:queueId/call-next", async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);
  const res = await queueDO.fetch(new Request("https://queue/call-next", { method: "POST" }));
  return res;
});

queue.post("/:queueId/skip/:ticketId", async (c) => {
  const queueId = c.req.param("queueId")!;
  const ticketId = c.req.param("ticketId")!;
  const queueDO = getQueueDO(c, queueId);
  const res = await queueDO.fetch(new Request(`https://queue/skip/${ticketId}`, { method: "POST" }));
  return res;
});

queue.post("/:queueId/remove/:ticketId", async (c) => {
  const queueId = c.req.param("queueId")!;
  const ticketId = c.req.param("ticketId")!;
  const queueDO = getQueueDO(c, queueId);
  const res = await queueDO.fetch(new Request(`https://queue/remove/${ticketId}`, { method: "POST" }));
  return res;
});

queue.post("/:queueId/reset", async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);
  const res = await queueDO.fetch(new Request("https://queue/reset", { method: "POST" }));
  return res;
});

queue.get("/:queueId", async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = getQueueDO(c, queueId);
  const res = await queueDO.fetch(new Request("https://queue"));
  return res;
});

export default queue;
