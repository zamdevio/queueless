import { DurableObject } from "cloudflare:workers";

/**
 * Per-IP operator login rate limiter.
 * One DO instance; failures stored under `ip:<ip>` keys.
 *
 * API (called from lib/auth.ts):
 *   GET  /check?ip=…        → { limited, retryAfterSec, remaining }
 *   POST /fail?ip=…         → record a failed login
 *   POST /clear?ip=…        → clear failures (successful login)
 */

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

export class RateLimitDO extends DurableObject {
  constructor(state: DurableObjectState, env: any) {
    super(state, env);
  }

  private prune(hits: number[], now: number): number[] {
    return hits.filter((t) => t > now - WINDOW_MS);
  }

  private async readHits(ip: string): Promise<number[]> {
    const key = `ip:${ip}`;
    const raw = await this.ctx.storage.get<string>(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async writeHits(ip: string, hits: number[]): Promise<void> {
    const key = `ip:${ip}`;
    if (hits.length === 0) {
      await this.ctx.storage.delete(key);
    } else {
      await this.ctx.storage.put(key, JSON.stringify(hits));
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const ip = url.searchParams.get("ip") || "0.0.0.0";
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const now = Date.now();

    if (request.method === "GET" && (path === "/check" || path === "/" || path.endsWith("/check"))) {
      const hits = this.prune(await this.readHits(ip), now);
      const limited = hits.length >= MAX_ATTEMPTS;
      const retryAfterSec = limited
        ? Math.max(Math.ceil((hits[0] + WINDOW_MS - now) / 1000), 1)
        : 0;
      return Response.json({
        limited,
        retryAfterSec,
        remaining: Math.max(MAX_ATTEMPTS - hits.length, 0),
      });
    }

    if (request.method === "POST" && (path === "/fail" || path.endsWith("/fail"))) {
      const hits = this.prune(await this.readHits(ip), now);
      hits.push(now);
      await this.writeHits(ip, hits);
      return Response.json({ ok: true, count: hits.length });
    }

    if (request.method === "POST" && (path === "/clear" || path.endsWith("/clear"))) {
      await this.writeHits(ip, []);
      return Response.json({ ok: true });
    }

    return Response.json({ error: `Unknown action ${request.method} ${path}` }, { status: 400 });
  }
}
