import { DurableObject } from "cloudflare:workers";

/** Per-IP login attempt limiter. One DO instance for all IPs; keys by IP in storage. */

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

interface RateState {
  /** Failed login timestamps (epoch ms) */
  hits: number[];
}

export class RateLimitDO extends DurableObject {
  constructor(state: DurableObjectState, env: any) {
    super(state, env);
  }

  private async read(): Promise<RateState> {
    try {
      const raw = await this.ctx.storage.get<string>("rate");
      if (raw) {
        const data = JSON.parse(raw) as RateState;
        return { hits: Array.isArray(data.hits) ? data.hits : [] };
      }
    } catch {
      // fall through
    }
    return { hits: [] };
  }

  private async write(state: RateState): Promise<void> {
    await this.ctx.storage.put("rate", JSON.stringify(state));
  }

  private prune(hits: number[], now: number): number[] {
    return hits.filter((t) => t > now - WINDOW_MS);
  }

  /** GET — check current limit for an IP */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const ip = url.searchParams.get("ip") || "0.0.0.0";

    if (request.method === "GET") {
      const state = await this.read();
      // store hits under ip-prefixed keys for multi-IP isolation
      const key = `ip:${ip}`;
      const raw = await this.ctx.storage.get<string>(key);
      const hits = raw ? (JSON.parse(raw) as number[]) : [];
      const now = Date.now();
      const pruned = this.prune(hits, now);
      const limited = pruned.length >= MAX_ATTEMPTS;
      const retryAfterSec = limited
        ? Math.max(Math.ceil((pruned[0] + WINDOW_MS - now) / 1000), 1)
        : 0;
      if (!limited && pruned.length !== hits.length) {
        await this.ctx.storage.put(key, JSON.stringify(pruned));
      }
      return Response.json({
        limited,
        retryAfterSec,
        remaining: Math.max(MAX_ATTEMPTS - pruned.length, 0),
      });
    }

    if (request.method === "POST") {
      const action = url.searchParams.get("action");
      const key = `ip:${ip}`;
      const raw = await this.ctx.storage.get<string>(key);
      const hits = raw ? (JSON.parse(raw) as number[]) : [];
      const now = Date.now();

      if (action === "fail") {
        const pruned = this.prune(hits, now);
        pruned.push(now);
        await this.ctx.storage.put(key, JSON.stringify(pruned));
        return Response.json({ ok: true, count: pruned.length });
      }

      if (action === "clear") {
        await this.ctx.storage.delete(key);
        return Response.json({ ok: true });
      }

      return Response.json({ error: "Unknown action" }, { status: 400 });
    }

    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
}
