import { DurableObject } from "cloudflare:workers";

/**
 * Per-IP rate limiter (login + join).
 * Keys: login:<ip> by default; pass ?key=join:<ip>:<queueId> via path prefix.
 *
 * API:
 *   GET  /check?ip=…&key=optional
 *   POST /fail?ip=…&key=optional
 *   POST /clear?ip=…&key=optional
 */

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

export class RateLimitDO extends DurableObject {
  constructor(state: DurableObjectState, env: any) {
    super(state, env);
  }

  private storageKey(ip: string, key?: string | null): string {
    return `k:${key || `login:${ip}`}:ip:${ip}`;
  }

  private prune(hits: number[], now: number): number[] {
    return hits.filter((t) => t > now - WINDOW_MS);
  }

  private async readHits(storageKey: string): Promise<number[]> {
    const raw = await this.ctx.storage.get<string>(storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async writeHits(storageKey: string, hits: number[]): Promise<void> {
    if (hits.length === 0) {
      await this.ctx.storage.delete(storageKey);
    } else {
      await this.ctx.storage.put(storageKey, JSON.stringify(hits));
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const ip = url.searchParams.get("ip") || "0.0.0.0";
    const key = url.searchParams.get("key");
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const now = Date.now();
    const storageKey = this.storageKey(ip, key);

    if (request.method === "GET" && (path === "/check" || path.endsWith("/check"))) {
      const hits = this.prune(await this.readHits(storageKey), now);
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
      const hits = this.prune(await this.readHits(storageKey), now);
      hits.push(now);
      await this.writeHits(storageKey, hits);
      return Response.json({ ok: true, count: hits.length });
    }

    if (request.method === "POST" && (path === "/clear" || path.endsWith("/clear"))) {
      await this.writeHits(storageKey, []);
      return Response.json({ ok: true });
    }

    return Response.json({ error: `Unknown action ${request.method} ${path}` }, { status: 400 });
  }
}
