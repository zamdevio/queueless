import { DurableObject } from "cloudflare:workers";

export type TicketState = "waiting" | "called" | "served" | "skipped" | "left" | "removed";

export interface TicketMeta {
  userAgent?: string;
  country?: string;
  city?: string;
  language?: string;
  ipHash?: string;
}

export interface Ticket {
  id: string;
  number: number;
  state: TicketState;
  createdAt: number;
  meta?: TicketMeta;
  /** When this ticket was called (epoch ms); used for rolling ETA samples */
  calledAt?: number;
}

export interface QueueSettings {
  maxWaiting: number;
}

export interface QueueStats {
  /** Rolling average service time in ms (time between call-next events) */
  avgServiceMs: number | null;
  /** How many service samples in the rolling window */
  samples: number;
  /** Last observed service duration in ms */
  lastServiceMs: number | null;
  /** Total tickets ever issued this session */
  issued: number;
  /** Tickets currently waiting */
  waiting: number;
}

export interface QueueBoard {
  tickets: Ticket[];
  nowServing: number | null;
  nextNumber: number;
  settings: QueueSettings;
  waitingCount: number;
  stats: QueueStats;
}

export interface QueueEvent {
  event:
    | "join"
    | "leave"
    | "call"
    | "skip"
    | "remove"
    | "reset"
    | "snapshot"
    | "settings";
  data: any;
}

const DEFAULT_MAX_WAITING = 50;
const ETA_SAMPLE_WINDOW = 20;

export class QueueDO extends DurableObject {
  private tickets = new Map<string, Ticket>();
  private nowServing: number | null = null;
  private nextNumber = 1;
  private settings: QueueSettings = { maxWaiting: DEFAULT_MAX_WAITING };
  /** Rolling service-time samples (ms between consecutive call-next) */
  private serviceSamples: number[] = [];
  private lastServiceMs: number | null = null;
  private subscribers = new Set<WritableStreamDefaultWriter<Uint8Array>>();

  constructor(state: DurableObjectState, env: any) {
    super(state, env);
    state.blockConcurrencyWhile(async () => {
      try {
        const raw = await state.storage.get<string>("queue");
        if (raw) {
          const data = JSON.parse(raw);
          this.tickets = new Map(data.tickets || []);
          this.nowServing = data.nowServing ?? null;
          this.nextNumber = data.nextNumber ?? 1;
          this.settings = {
            maxWaiting: data.settings?.maxWaiting ?? DEFAULT_MAX_WAITING,
          };
          this.serviceSamples = Array.isArray(data.serviceSamples) ? data.serviceSamples : [];
          this.lastServiceMs = typeof data.lastServiceMs === "number" ? data.lastServiceMs : null;
        }
      } catch {
        // start fresh
      }
    });
  }

  private waitingCount(): number {
    let n = 0;
    for (const t of this.tickets.values()) if (t.state === "waiting") n++;
    return n;
  }

  private avgServiceMs(): number | null {
    if (this.serviceSamples.length === 0) return null;
    const sum = this.serviceSamples.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.serviceSamples.length);
  }

  private stats(): QueueStats {
    return {
      avgServiceMs: this.avgServiceMs(),
      samples: this.serviceSamples.length,
      lastServiceMs: this.lastServiceMs,
      issued: this.nextNumber - 1,
      waiting: this.waitingCount(),
    };
  }

  private pushServiceSample(ms: number): void {
    if (!Number.isFinite(ms) || ms < 0 || ms > 24 * 60 * 60 * 1000) return;
    this.serviceSamples.push(Math.round(ms));
    if (this.serviceSamples.length > ETA_SAMPLE_WINDOW) {
      this.serviceSamples = this.serviceSamples.slice(-ETA_SAMPLE_WINDOW);
    }
    this.lastServiceMs = Math.round(ms);
  }

  private async persist(): Promise<void> {
    try {
      await this.ctx.storage.put(
        "queue",
        JSON.stringify({
          tickets: [...this.tickets.entries()],
          nowServing: this.nowServing,
          nextNumber: this.nextNumber,
          settings: this.settings,
          serviceSamples: this.serviceSamples,
          lastServiceMs: this.lastServiceMs,
        })
      );
    } catch {
      // non-fatal
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const action = parts[0] || "";
    const param = parts[1];

    switch (request.method) {
      case "POST": {
        switch (action) {
          case "join": {
            let meta: TicketMeta | undefined;
            try {
              const body = await request.json<{ meta?: TicketMeta }>();
              meta = body?.meta;
            } catch {
              meta = undefined;
            }
            return this.handleJoin(meta);
          }
          case "leave":
            return this.handleLeave(param || "");
          case "call-next":
            return this.handleCallNext();
          case "skip":
            return this.handleSkip(param || "");
          case "remove":
            return this.handleRemove(param || "");
          case "reset":
            return this.handleReset();
          case "settings": {
            let max = DEFAULT_MAX_WAITING;
            try {
              const body = await request.json<{ maxWaiting?: number }>();
              max = Number(body?.maxWaiting);
            } catch {
              return new Response(JSON.stringify({ error: "Invalid settings body" }), { status: 400 });
            }
            if (!Number.isFinite(max) || max < 0 || max > 10_000) {
              return new Response(JSON.stringify({ error: "maxWaiting must be 0–10000" }), { status: 400 });
            }
            return this.handleSettings(Math.floor(max));
          }
          default:
            return new Response(JSON.stringify({ error: "Unknown action" }), { status: 404 });
        }
      }
      case "GET": {
        if (action === "stream") {
          return this.handleSse(request);
        }
        return this.handleGetBoard();
      }
      default:
        return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
  }

  private board(): QueueBoard {
    return {
      tickets: [...this.tickets.values()],
      nowServing: this.nowServing,
      nextNumber: this.nextNumber,
      settings: { ...this.settings },
      waitingCount: this.waitingCount(),
      stats: this.stats(),
    };
  }

  private async handleJoin(meta?: TicketMeta): Promise<Response> {
    const waiting = this.waitingCount();
    if (waiting >= this.settings.maxWaiting) {
      return new Response(
        JSON.stringify({
          error: `Queue is full (${waiting}/${this.settings.maxWaiting}). Try again later.`,
          code: "QUEUE_FULL",
        }),
        { status: 409 }
      );
    }
    const ticketId = crypto.randomUUID();
    const ticket: Ticket = {
      id: ticketId,
      number: this.nextNumber++,
      state: "waiting",
      createdAt: Date.now(),
      meta,
    };
    this.tickets.set(ticketId, ticket);
    await this.persist();
    this.broadcast({ event: "join", data: ticket });
    return Response.json(ticket);
  }

  private async handleLeave(ticketId: string): Promise<Response> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), { status: 404 });
    }
    ticket.state = "left";
    await this.persist();
    this.broadcast({ event: "leave", data: { ticketId, number: ticket.number } });
    return Response.json({ ok: true });
  }

  private async handleCallNext(): Promise<Response> {
    const now = Date.now();
    const waiting = [...this.tickets.values()].find((t) => t.state === "waiting");
    if (!waiting) {
      return Response.json(null);
    }

    // Service sample = time since previous ticket was called
    if (this.nowServing !== null) {
      const prev = [...this.tickets.values()].find(
        (t) => t.number === this.nowServing && t.calledAt != null
      );
      if (prev?.calledAt) {
        this.pushServiceSample(now - prev.calledAt);
      }
    }

    waiting.state = "called";
    waiting.calledAt = now;
    this.nowServing = waiting.number;
    await this.persist();
    this.broadcast({
      event: "call",
      data: {
        ticketId: waiting.id,
        number: waiting.number,
        nowServing: this.nowServing,
        calledAt: waiting.calledAt,
        stats: this.stats(),
      },
    });
    return Response.json({
      ticketId: waiting.id,
      number: waiting.number,
      nowServing: this.nowServing,
      stats: this.stats(),
    });
  }

  private async handleSkip(ticketId: string): Promise<Response> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), { status: 404 });
    }
    ticket.state = "skipped";
    await this.persist();
    this.broadcast({ event: "skip", data: { ticketId, number: ticket.number } });
    return Response.json({ ok: true });
  }

  private async handleRemove(ticketId: string): Promise<Response> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), { status: 404 });
    }
    ticket.state = "removed";
    await this.persist();
    this.broadcast({ event: "remove", data: { ticketId, number: ticket.number } });
    return Response.json({ ok: true });
  }

  private async handleReset(): Promise<Response> {
    this.tickets.clear();
    this.nowServing = null;
    this.nextNumber = 1;
    this.serviceSamples = [];
    this.lastServiceMs = null;
    await this.persist();
    this.broadcast({ event: "reset", data: {} });
    return Response.json({ ok: true });
  }

  private async handleSettings(maxWaiting: number): Promise<Response> {
    this.settings.maxWaiting = maxWaiting;
    await this.persist();
    this.broadcast({ event: "settings", data: { ...this.settings } });
    return Response.json({ ok: true, settings: this.settings });
  }

  private async handleGetBoard(): Promise<Response> {
    return Response.json(this.board());
  }

  private async handleSse(request: Request): Promise<Response> {
    const { readable, writable } = new TransformStream<Uint8Array>();
    const writer = writable.getWriter();
    this.subscribers.add(writer);

    const init = `data: ${JSON.stringify({ event: "snapshot", data: this.board() })}\n\n`;
    writer.write(new TextEncoder().encode(init));

    const signal = (request as any).signal;
    if (signal) {
      signal.addEventListener("abort", () => {
        this.subscribers.delete(writer);
        try {
          writer.close();
        } catch {
          // ignore
        }
      });
    }

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  private broadcast(event: QueueEvent): void {
    const message = `data: ${JSON.stringify(event)}\n\n`;
    const encoded = new TextEncoder().encode(message);
    for (const writer of this.subscribers) {
      try {
        writer.write(encoded);
      } catch {
        this.subscribers.delete(writer);
      }
    }
  }
}
