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
  event: "join" | "leave" | "call" | "skip" | "remove" | "reset";
  data: any;
}

export class QueueDO {
  private tickets: Map<string, Ticket> = new Map();
  private nowServing: number | null = null;
  private nextNumber: number = 1;
  private subscribers: Set<WritableStreamDefaultWriter<Uint8Array>> = new Set();

  async handleFetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    switch (method) {
      case "POST": {
        const action = url.pathname.split("/").pop();
        switch (action) {
          case "join":
            return this.handleJoin();
          case "leave": {
            const ticketId = url.pathname.split("/").pop();
            return this.handleLeave(ticketId!);
          }
          case "call-next":
            return this.handleCallNext();
          case "skip": {
            const ticketId = url.pathname.split("/").pop();
            return this.handleSkip(ticketId!);
          }
          case "remove": {
            const ticketId = url.pathname.split("/").pop();
            return this.handleRemove(ticketId!);
          }
          case "reset":
            return this.handleReset();
          default:
            return new Response("Unknown action", { status: 404 });
        }
      }
      case "GET": {
        if (url.pathname.endsWith("/stream")) {
          return this.handleSse(request);
        }
        return this.handleGetBoard();
      }
      default:
        return new Response("Method not allowed", { status: 405 });
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
    this.broadcast({ event: "join", data: ticket });
    return Response.json(ticket);
  }

  private async handleLeave(ticketId: string): Promise<Response> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      return new Response("Ticket not found", { status: 404 });
    }
    ticket.state = "left";
    this.broadcast({ event: "leave", data: { ticketId, number: ticket.number } });
    return Response.json({ ok: true });
  }

  private async handleCallNext(): Promise<Response> {
    const waiting = Array.from(this.tickets.values()).find(
      (t) => t.state === "waiting"
    );
    if (!waiting) {
      return Response.json(null);
    }
    waiting.state = "called";
    this.nowServing = waiting.number;
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
      return new Response("Ticket not found", { status: 404 });
    }
    ticket.state = "skipped";
    this.broadcast({ event: "skip", data: { ticketId, number: ticket.number } });
    return Response.json({ ok: true });
  }

  private async handleRemove(ticketId: string): Promise<Response> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      return new Response("Ticket not found", { status: 404 });
    }
    ticket.state = "removed";
    this.broadcast({ event: "remove", data: { ticketId, number: ticket.number } });
    return Response.json({ ok: true });
  }

  private async handleReset(): Promise<Response> {
    this.tickets.clear();
    this.nowServing = null;
    this.nextNumber = 1;
    this.broadcast({ event: "reset", data: {} });
    return Response.json({ ok: true });
  }

  private async handleGetBoard(): Promise<Response> {
    const board: QueueBoard = {
      tickets: Array.from(this.tickets.values()),
      nowServing: this.nowServing,
      nextNumber: this.nextNumber,
    };
    return Response.json(board);
  }

  private async handleSse(request: Request): Promise<Response> {
    const { readable, writable } = new TransformStream<Uint8Array>();

    const writer = writable.getWriter();
    this.subscribers.add(writer);

    const signal = (request as any).signal;
    if (signal) {
      signal.addEventListener("abort", () => {
        this.subscribers.delete(writer);
        writer.close();
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
    const data = JSON.stringify(event);
    const message = `data: ${data}\n\n`;
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
