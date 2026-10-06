/**
 * QueueLess worker policy/rule tests.
 *
 * Usage:
 *   BASE_URL=http://localhost:8787 node --experimental-strip-types scripts/test-worker-policies.ts
 *   BASE_URL=https://queueless.zamdevio.workers.dev node --experimental-strip-types scripts/test-worker-policies.ts
 *
 * BASE_URL defaults to http://localhost:8787 (local wrangler dev).
 * If nothing is listening on :8787, start the worker with `pnpm worker:dev`
 * or point BASE_URL at a deployed Worker.
 */

// ANSI helpers (TTY-aware)
const isTTY = process.stdout.isTTY;
const c = (code: string, s: string) => (isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = (s: string) => c("32", s);
const red = (s: string) => c("31", s);
const yellow = (s: string) => c("33", s);
const dim = (s: string) => c("2", s);
const bold = (s: string) => c("1", s);
const cyan = (s: string) => c("36", s);

const BASE = (process.env.BASE_URL || "http://localhost:8787").replace(/\/+$/, "");
const QUEUE = `policy-test-${Date.now()}`;
let passed = 0;
let failed = 0;

function ok(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  ${green("OK ")}  ${name}`);
  } else {
    failed++;
    console.log(`  ${red("FAIL")} ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title: string) {
  console.log(`\n${bold(cyan(title))}`);
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

function isConnRefused(e: unknown): boolean {
  const cause = (e as any)?.cause;
  return (
    cause?.code === "ECONNREFUSED" ||
    cause?.code === "ENOTFOUND" ||
    cause?.code === "ECONNRESET" ||
    String((e as any)?.message || "").includes("fetch failed")
  );
}

async function testLoginRateLimit() {
  section("[1] Login rate limit (10 fails / 60s)");
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
  section("[2] Join rate limit (5 / 60s per IP per queue)");
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
  section("[3] Same device cannot join twice");
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
  section("[4] Operator routes require auth");
  const r = await req(`/api/queue/${QUEUE}/call-next`, { method: "POST" });
  ok("call-next without auth → 401", r.status === 401, String(r.status));
}

async function main() {
  console.log(bold("QueueLess worker policy tests"));
  console.log(dim(`BASE=${BASE}  queue=${QUEUE}`));

  // Probe worker once — friendly message if local server is down
  try {
    await fetch(`${BASE}/health`);
  } catch (e) {
    if (isConnRefused(e)) {
      console.log("");
      console.log(yellow(`Worker not reachable at ${BASE}`));
      console.log(dim("  Local default is http://localhost:8787 — start it with:  pnpm worker:dev"));
      console.log(dim("  Or point BASE_URL at a deployed Worker:"));
      console.log(`  ${cyan("BASE_URL=https://queueless.zamdevio.workers.dev")} ${dim("pnpm test:policies")}`);
      process.exit(1);
    }
    console.log(dim(`Note: /health probe failed — continuing (${(e as Error)?.message})`));
  }

  try {
    await testLoginRateLimit();
    await testJoinRateLimit();
    await testDeviceInQueue();
    await testOperatorAuth();
  } catch (e) {
    if (isConnRefused(e)) {
      console.log("");
      console.log(yellow(`Connection lost mid-run at ${BASE}`));
      console.log(dim("  Start the worker:  pnpm worker:dev"));
      console.log(dim("  Or use BASE_URL=https://queueless.zamdevio.workers.dev"));
    } else {
      console.log(red(String((e as Error)?.message || e)));
    }
    process.exit(1);
  }

  console.log("");
  console.log(
    failed === 0
      ? `${green(bold("PASS"))}  ${passed} passed`
      : `${red(bold("FAIL"))}  ${passed} passed, ${failed} failed`
  );
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
