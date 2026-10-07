import { describe, expect, it } from "vitest";

import { QueueDO } from "./QueueDO";

function makeDO(): QueueDO {
  const ctx = {
    storage: {
      get: async () => undefined,
      put: async () => {},
    },
    blockConcurrencyWhile: (fn: () => Promise<unknown>) => fn(),
  } as unknown as DurableObjectState;
  return new QueueDO(ctx, {});
}

async function join(q: QueueDO, deviceId: string, name?: string): Promise<{ id: string; number: number }> {
  const res = await q.fetch(
    new Request("https://queue/join", {
      method: "POST",
      body: JSON.stringify({ meta: { deviceId }, name, deviceId }),
    })
  );
  expect(res.status).toBe(200);
  return (await res.json()) as { id: string; number: number };
}

interface TestBoard {
  nowServing: number | null;
  waitingCount: number;
  stats: { samples: number; avgServiceMs: number | null };
  tickets: { id: string; state: string; number: number }[];
  settings: { maxWaiting: number; showNamesOnBoard: boolean };
}

async function board(q: QueueDO): Promise<TestBoard> {
  const res = await q.fetch(new Request("https://queue/board"));
  return (await res.json()) as TestBoard;
}

describe("QueueDO serve (operator mark-served)", () => {
  it("clears nowServing and keeps waiting tickets when queue is not empty", async () => {
    const q = makeDO();
    const a = await join(q, "dev-a", "Amina");
    await join(q, "dev-b");

    const called = await q.fetch(new Request("https://queue/call-next", { method: "POST" }));
    expect(((await called.json()) as { number: number }).number).toBe(a.number);

    const serve = await q.fetch(new Request(`https://queue/serve/${a.id}`, { method: "POST" }));
    expect(serve.status).toBe(200);

    const b = await board(q);
    expect(b.nowServing).toBeNull();
    expect(b.tickets.find((t) => t.id === a.id)?.state).toBe("served");
    expect(b.tickets.find((t) => t.id !== a.id)?.state).toBe("waiting");
    expect(b.waitingCount).toBe(1);
  });

  it("records a service sample when the called ticket is marked served", async () => {
    const q = makeDO();
    const a = await join(q, "dev-a");
    await q.fetch(new Request("https://queue/call-next", { method: "POST" }));
    await q.fetch(new Request(`https://queue/serve/${a.id}`, { method: "POST" }));

    const b = await board(q);
    expect(b.stats.samples).toBe(1);
    expect(b.stats.avgServiceMs).toBeGreaterThanOrEqual(0);
  });

  it("works with an empty queue (nothing waiting after serve)", async () => {
    const q = makeDO();
    const a = await join(q, "dev-a");
    await q.fetch(new Request("https://queue/call-next", { method: "POST" }));
    await q.fetch(new Request(`https://queue/serve/${a.id}`, { method: "POST" }));

    const b = await board(q);
    expect(b.nowServing).toBeNull();
    expect(b.waitingCount).toBe(0);
    expect(b.tickets.find((t) => t.id === a.id)?.state).toBe("served");
  });

  it("does not clear nowServing when a non-current ticket is served", async () => {
    const q = makeDO();
    const a = await join(q, "dev-a");
    const bTicket = await join(q, "dev-b");
    await q.fetch(new Request("https://queue/call-next", { method: "POST" })); // calls a
    await q.fetch(new Request("https://queue/call-next", { method: "POST" })); // calls b

    // a is history now (called, not current) — serving it must not touch nowServing
    await q.fetch(new Request(`https://queue/serve/${a.id}`, { method: "POST" }));
    const b = await board(q);
    expect(b.nowServing).toBe(bTicket.number);
  });
});

describe("QueueDO settings showNamesOnBoard", () => {
  it("defaults to false (numbers-only public board)", async () => {
    const q = makeDO();
    const b = await board(q);
    expect(b.settings.showNamesOnBoard).toBe(false);
  });

  it("toggles showNamesOnBoard via settings route", async () => {
    const q = makeDO();
    const on = await q.fetch(
      new Request("https://queue/settings", {
        method: "POST",
        body: JSON.stringify({ maxWaiting: 50, showNamesOnBoard: true }),
      })
    );
    expect(on.status).toBe(200);
    expect(((await on.json()) as { settings: TestBoard["settings"] }).settings.showNamesOnBoard).toBe(true);

    const off = await q.fetch(
      new Request("https://queue/settings", {
        method: "POST",
        body: JSON.stringify({ maxWaiting: 50, showNamesOnBoard: false }),
      })
    );
    expect(off.status).toBe(200);
    const b = await board(q);
    expect(b.settings.showNamesOnBoard).toBe(false);
    expect(b.settings.maxWaiting).toBe(50);
  });

  it("keeps showNamesOnBoard when only maxWaiting is updated", async () => {
    const q = makeDO();
    await q.fetch(
      new Request("https://queue/settings", {
        method: "POST",
        body: JSON.stringify({ maxWaiting: 50, showNamesOnBoard: true }),
      })
    );
    await q.fetch(
      new Request("https://queue/settings", {
        method: "POST",
        body: JSON.stringify({ maxWaiting: 20 }),
      })
    );
    const b = await board(q);
    expect(b.settings.showNamesOnBoard).toBe(true);
    expect(b.settings.maxWaiting).toBe(20);
  });
});
