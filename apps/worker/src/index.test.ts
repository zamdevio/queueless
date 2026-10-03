import { describe, expect, it } from "vitest";

import app, { type Env } from "./index";

const env = {
  ENVIRONMENT: "test",
  DB: {} as Env["DB"],
} satisfies Env;

describe("scaffold worker", () => {
  it("GET / returns service info", async () => {
    const res = await app.request("/", undefined, env);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      service: "queue-less",
      environment: "test",
    });
  });
});
