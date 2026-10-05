export type QueueEvent = {
  event: "join" | "leave" | "call" | "skip" | "remove" | "reset";
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

export async function joinQueue(queueId: string): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/api/queue/${queueId}/join`, { method: "POST" });
  if (!res.ok) throw new Error(`Join failed: ${res.status}`);
  return res.json();
}

export async function leaveQueue(queueId: string, ticketId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/queue/${queueId}/leave/${ticketId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Leave failed: ${res.status}`);
}

export async function callNext(queueId: string): Promise<Ticket | null> {
  const res = await fetch(`${API_BASE}/api/queue/${queueId}/call-next`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Call next failed: ${res.status}`);
  return res.json();
}

export async function skipTicket(queueId: string, ticketId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/queue/${queueId}/skip/${ticketId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Skip failed: ${res.status}`);
}

export async function removeTicket(queueId: string, ticketId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/queue/${queueId}/remove/${ticketId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Remove failed: ${res.status}`);
}

export async function resetQueue(queueId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/queue/${queueId}/reset`, { method: "POST" });
  if (!res.ok) throw new Error(`Reset failed: ${res.status}`);
}

export async function getBoard(queueId: string): Promise<Board> {
  const res = await fetch(`${API_BASE}/api/queue/${queueId}`);
  if (!res.ok) throw new Error(`Get board failed: ${res.status}`);
  return res.json();
}

export function subscribeToQueue(
  queueId: string,
  onEvent: (event: QueueEvent) => void
): EventSource {
  const evtSource = new EventSource(`${API_BASE}/api/queue/${queueId}/stream`);
  evtSource.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch {
      console.error("Failed to parse SSE event", e.data);
    }
  };
  return evtSource;
}
