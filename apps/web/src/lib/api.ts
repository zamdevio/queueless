export type QueueEvent = {
  event: "join" | "leave" | "call" | "skip" | "remove" | "reset" | "snapshot";
  data: any;
};

export type Ticket = {
  id: string;
  number: number;
  state: "waiting" | "called" | "served" | "skipped" | "left" | "removed";
  createdAt: number;
};

export type Board = {
  tickets: Ticket[];
  nowServing: number | null;
  nextNumber: number;
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
    res = await fetch(`${API_BASE}${path}`, init);
  } catch (err) {
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
      (res.status === 404
        ? "Not found — that queue or ticket does not exist."
        : res.status >= 500
          ? "Server error — the queue service had a problem."
          : `Request failed (${res.status}).`);
    throw new ApiError(message, { status: res.status });
  }

  return res;
}

export async function joinQueue(queueId: string): Promise<Ticket> {
  const res = await apiFetch(`/api/queue/${queueId}/join`, { method: "POST" });
  return res.json();
}

export async function leaveQueue(queueId: string, ticketId: string): Promise<void> {
  await apiFetch(`/api/queue/${queueId}/leave/${ticketId}`, { method: "POST" });
}

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

export async function getBoard(queueId: string): Promise<Board> {
  const res = await apiFetch(`/api/queue/${queueId}`);
  return res.json();
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
  evtSource.onerror = () => {
    // EventSource auto-reconnects; surface nothing unless UI wants it
  };
  return evtSource;
}
