/**
 * QueueLess worker policy/rule tests.
 *
 * Usage:
 *   BASE_URL=http://localhost:8787 node --experimental-strip-types scripts/test-worker-policies.ts
 *   BASE_URL=https://queueless.zamdevio.workers.dev node --experimental-strip-types scripts/test-worker-policies.ts
 *
 * Checks: login rate limit, join rate limit, device duplicate, operator auth.
 */

const BASE = (process.env.BASE_URL || "http://localhost:8787").replace(/\/+$/, "");
const QUEUE = `policy-test-${Date.now()}`;
let passed = 0;
let failed = 0;

function ok(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  OK  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function req(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, init);
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // ignore
  }
  return { status: res.status, body };
}

async function testLoginRateLimit() {
  console.log("[1] Login rate limit (10 fails / 60s)");
  for (let i = 1; i <= 12; i++) {
    const { status } = await req("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "wrong-pin-" + i }),
    });
    if (status === 429) {
      ok(`blocked at attempt ${i}`, true);
      return;
    }
  }
  ok("blocked within 12 attempts", false, "never saw 429");
}

async function testJoinRateLimit() {
  console.log("[2] Join rate limit (5 / 60s per IP per queue)");
  const q = `${QUEUE}-join`;
  for (let i = 0; i < 8; i++) {
    const { status } = await req(`/api/queue/${q}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: `dev-join-${i}-${Date.now()}` }),
    });
    if (status === 429) {
      ok("join limited with 429", true);
      return;
    }
  }
  ok("join limited with 429", false, "all joins succeeded");
}

async function testDeviceInQueue() {
  console.log("[3] Same device cannot join twice");
  const q = `${QUEUE}-device`;
  const deviceId = `dev-dup-${Date.now()}`;
  const first = await req(`/api/queue/${q}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
  ok("first join ok", first.status === 200, String(first.status));
  const second = await req(`/api/queue/${q}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
  ok("second join rejected 409", second.status === 409, String(second.status));
}

async function testOperatorAuth() {
  console.log("[4] Operator routes require auth");
  const r = await req(`/api/queue/${QUEUE}/call-next`, { method: "POST" });
  ok("call-next without auth → 401", r.status === 401, String(r.status));
}

async function main() {
  console.log("QueueLess worker policy tests");
  console.log(`BASE=${BASE} queue=${QUEUE}`);
  await testLoginRateLimit();
  await testJoinRateLimit();
  await testDeviceInQueue();
  await testOperatorAuth();
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
