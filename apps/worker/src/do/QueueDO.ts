import { DurableObject } from "cloudflare:workers";

export type TicketState = "waiting" | "called" | "served" | "skipped" | "left" | "removed";

export interface Ticket {
  id: string;
  number: number;
  state: TicketState;
  createdAt: number;
}

export interface QueueBoard {
  tickets: Ticket[];
  nowServing: number | null;
  nextNumber: number;
}

export interface QueueEvent {
  event: "join" | "leave" | "call" | "skip" | "remove" | "reset" | "snapshot";
  data: any;
}

export class QueueDO extends DurableObject {
  private tickets = new Map<string, Ticket>();
  private nowServing: number | null = null;
  private nextNumber = 1;
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
        }
      } catch {
        // start fresh
      }
    });
  }

  private async persist(): Promise<void> {
    try {
      await this.ctx.storage.put(
        "queue",
        JSON.stringify({
          tickets: [...this.tickets.entries()],
          nowServing: this.nowServing,
          nextNumber: this.nextNumber,
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
          case "join":
            return this.handleJoin();
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

  private async handleJoin(): Promise<Response> {
    const ticketId = crypto.randomUUID();
    const ticket: Ticket = {
      id: ticketId,
      number: this.nextNumber++,
      state: "waiting",
      createdAt: Date.now(),
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
    const waiting = [...this.tickets.values()].find((t) => t.state === "waiting");
    if (!waiting) {
      return Response.json(null);
    }
    waiting.state = "called";
    this.nowServing = waiting.number;
    await this.persist();
    this.broadcast({
      event: "call",
      data: { ticketId: waiting.id, number: waiting.number, nowServing: this.nowServing },
    });
    return Response.json({
      ticketId: waiting.id,
      number: waiting.number,
      nowServing: this.nowServing,
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
    await this.persist();
    this.broadcast({ event: "reset", data: {} });
    return Response.json({ ok: true });
  }

  private async handleGetBoard(): Promise<Response> {
    const board: QueueBoard = {
      tickets: [...this.tickets.values()],
      nowServing: this.nowServing,
      nextNumber: this.nextNumber,
    };
    return Response.json(board);
  }

  private async handleSse(request: Request): Promise<Response> {
    const { readable, writable } = new TransformStream<Uint8Array>();
    const writer = writable.getWriter();
    this.subscribers.add(writer);

    const board: QueueBoard = {
      tickets: [...this.tickets.values()],
      nowServing: this.nowServing,
      nextNumber: this.nextNumber,
    };
    const init = `data: ${JSON.stringify({ event: "snapshot", data: board })}\n\n`;
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
