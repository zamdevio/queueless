import { describe, expect, it, vi } from "vitest";

import worker, { app } from "./index";

const mockQueueDO = {
  idFromName: vi.fn().mockReturnValue("mock-id"),
  get: vi.fn().mockReturnValue({
    fetch: vi.fn().mockResolvedValue(new Response('{"ok":true}')),
  }),
};

const mockRateDO = {
  idFromName: vi.fn().mockReturnValue("rate-id"),
  get: vi.fn().mockReturnValue({
    fetch: vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ limited: false, retryAfterSec: 0, remaining: 10 }))
    ),
  }),
};

const env = {
  ENVIRONMENT: "test",
  QUEUE_DO: mockQueueDO,
  RATE_LIMIT_DO: mockRateDO,
};

describe("worker scaffold", () => {
  it("GET / returns service info", async () => {
    const res = await app.fetch(new Request("http://localhost/"), env);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      service: "queueless",
      environment: "test",
    });
  });

  it("POST /api/queue/:queueId/join calls QueueDO", async () => {
    const joinRes = new Response(JSON.stringify({ id: "t1", number: 1 }));
    mockQueueDO.get.mockReturnValue({ fetch: vi.fn().mockResolvedValue(joinRes) });

    const res = await app.fetch(
      new Request("http://localhost/api/queue/demo/join", { method: "POST" }),
      env
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ id: "t1", number: 1 });
    expect(mockQueueDO.get).toHaveBeenCalledWith("mock-id");
  });

  it("default export exposes fetch for wrangler", () => {
    expect(typeof worker.fetch).toBe("function");
  });
});
