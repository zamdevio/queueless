export type QueueEvent = {
  event: "join" | "leave" | "call" | "skip" | "remove" | "reset" | "snapshot" | "settings";
  data: any;
};

export type TicketMeta = {
  userAgent?: string;
  country?: string;
  city?: string;
  language?: string;
  ipHash?: string;
};

export type Ticket = {
  id: string;
  number: number;
  state: "waiting" | "called" | "served" | "skipped" | "left" | "removed";
  createdAt: number;
  meta?: TicketMeta;
};

export type Board = {
  tickets: Ticket[];
  nowServing: number | null;
  nextNumber: number;
  settings?: { maxWaiting: number };
  waitingCount?: number;
};

const API_BASE = import.meta.env.VITE_API_URL || "https://queueless.zamdevio.workers.dev";

export class ApiError extends Error {
  status?: number;
  network?: boolean;
  retryable: boolean;

  constructor(message: string, opts?: { status?: number; network?: boolean }) {
    super(message);
    this.name = "ApiError";
    this.status = opts?.status;
    this.network = opts?.network;
    this.retryable = opts?.network || !opts?.status || opts.status >= 500;
  }
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...init,
    });
  } catch {
    throw new ApiError(
      "Network error — could not reach the QueueLess API. Check your connection.",
      { network: true }
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error || body?.message || "";
    } catch {
      // ignore
    }
    const message =
      detail ||
      (res.status === 401
        ? "Operator authentication required."
        : res.status === 409
          ? "The queue is full right now."
          : res.status === 404
            ? "Not found — that queue or ticket does not exist."
            : res.status >= 500
              ? "Server error — the queue service had a problem."
              : `Request failed (${res.status}).`);
    throw new ApiError(message, { status: res.status });
  }

  return res;
}

/* ===== Auth ===== */

export async function loginOperator(pin: string): Promise<void> {
  await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
}

export async function logoutOperator(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

export async function operatorMe(): Promise<boolean> {
  try {
    const res = await apiFetch("/api/auth/me");
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

/* ===== Queue (public) ===== */

export async function joinQueue(queueId: string, meta?: TicketMeta): Promise<Ticket> {
  const res = await apiFetch(`/api/queue/${queueId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meta }),
  });
  return res.json();
}

export async function leaveQueue(queueId: string, ticketId: string): Promise<void> {
  await apiFetch(`/api/queue/${queueId}/leave/${ticketId}`, { method: "POST" });
}

export async function getBoard(queueId: string): Promise<Board> {
  const res = await apiFetch(`/api/queue/${queueId}`);
  return res.json();
}

/* ===== Queue (operator) ===== */

export async function callNext(queueId: string): Promise<Ticket | null> {
  const res = await apiFetch(`/api/queue/${queueId}/call-next`, { method: "POST" });
  return res.json();
}

export async function skipTicket(queueId: string, ticketId: string): Promise<void> {
  await apiFetch(`/api/queue/${queueId}/skip/${ticketId}`, { method: "POST" });
}

export async function removeTicket(queueId: string, ticketId: string): Promise<void> {
  await apiFetch(`/api/queue/${queueId}/remove/${ticketId}`, { method: "POST" });
}

export async function resetQueue(queueId: string): Promise<void> {
  await apiFetch(`/api/queue/${queueId}/reset`, { method: "POST" });
}

export async function updateQueueSettings(
  queueId: string,
  maxWaiting: number
): Promise<void> {
  await apiFetch(`/api/queue/${queueId}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maxWaiting }),
  });
}

export function subscribeToQueue(
  queueId: string,
  onEvent: (event: QueueEvent) => void,
  onOpen?: () => void
): EventSource {
  const evtSource = new EventSource(`${API_BASE}/api/queue/${queueId}/stream`);
  evtSource.onopen = () => onOpen?.();
  evtSource.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch {
      console.error("Failed to parse SSE event", e.data);
    }
  };
  return evtSource;
}

/* ===== Helpers ===== */

export function applyEvent(prev: Board | null, event: QueueEvent): Board | null {
  if (!prev) return prev;
  switch (event.event) {
    case "join":
      return { ...prev, tickets: [...prev.tickets, event.data] };
    case "leave":
      return {
        ...prev,
        tickets: prev.tickets.map((t) =>
          t.id === event.data.ticketId ? { ...t, state: "left" as const } : t
        ),
      };
    case "call":
      return {
        ...prev,
        nowServing: event.data.nowServing ?? prev.nowServing,
        tickets: prev.tickets.map((t) =>
          t.id === event.data.ticketId ? { ...t, state: "called" as const } : t
        ),
      };
    case "skip":
      return {
        ...prev,
        tickets: prev.tickets.map((t) =>
          t.id === event.data.ticketId ? { ...t, state: "skipped" as const } : t
        ),
      };
    case "remove":
      return {
        ...prev,
        tickets: prev.tickets.map((t) =>
          t.id === event.data.ticketId ? { ...t, state: "removed" as const } : t
        ),
      };
    case "settings":
      return { ...prev, settings: event.data };
    case "reset":
      return { tickets: [], nowServing: null, nextNumber: 1 };
    default:
      return prev;
  }
}

export function errMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

export function errRetryable(err: unknown): boolean {
  if (err instanceof ApiError) return err.retryable;
  return true;
}
