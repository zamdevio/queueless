import { Hono } from "hono";

export type StreamEnv = {
  QUEUE_DO: DurableObjectNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
};

const stream = new Hono<{ Bindings: StreamEnv }>();

stream.get("/:queueId/stream", async (c) => {
  const queueId = c.req.param("queueId")!;
  const queueDO = c.env.QUEUE_DO.get(c.env.QUEUE_DO.idFromName(queueId));
  const res = await queueDO.fetch(new Request("https://queue/stream"));
  return res;
});

export default stream;
