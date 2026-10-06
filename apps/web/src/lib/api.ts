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
  calledAt?: number;
};

export type QueueStats = {
  avgServiceMs: number | null;
  samples: number;
  lastServiceMs: number | null;
  issued: number;
  waiting: number;
};

export type Board = {
  tickets: Ticket[];
  nowServing: number | null;
  nextNumber: number;
  settings?: { maxWaiting: number };
  waitingCount?: number;
  stats?: QueueStats;
};

/**
 * Single source of truth for the API base URL.
 * Local dev default: wrangler dev on :8787.
 * Set VITE_API_URL in apps/web/.env or .env.production (see .env.example).
 */
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8787").replace(/\/+$/, "");
const TOKEN_KEY = "queueless_operator_token";

export function getApiBase(): string {
  return API_BASE;
}

export class ApiError extends Error {
  status?: number;
  network?: boolean;
  cors?: boolean;
  retryable: boolean;
  unauthorized?: boolean;

  constructor(
    message: string,
    opts?: { status?: number; network?: boolean; cors?: boolean; unauthorized?: boolean }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = opts?.status;
    this.network = opts?.network;
    this.cors = opts?.cors;
    this.unauthorized = opts?.unauthorized;
    this.retryable = opts?.network || !opts?.status || opts.status >= 500;
  }
}

export function getOperatorToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setOperatorToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearOperatorToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

function networkMessage(): string {
  const base = API_BASE;
  const isRemote = /^https?:\/\//.test(base) && !base.includes("localhost") && !base.includes("127.0.0.1");
  if (isRemote) {
    return `Cannot reach the QueueLess API at ${base}. If this site runs on another origin, the Worker CORS allow-list may not include this domain yet — see Docs → Guide → CORS.`;
  }
  return `Cannot reach the QueueLess API at ${base}. Start the worker locally with \`pnpm worker:dev\`, or set VITE_API_URL to your deployed Worker (see Docs → Development).`;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getOperatorToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...init,
      headers,
    });
  } catch {
    throw new ApiError(networkMessage(), { network: true, cors: true });
  }

  if (res.status === 401) {
    clearOperatorToken();
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error || "";
    } catch {
      // ignore
    }
    throw new ApiError(detail || "Session expired. Please sign in again.", {
      status: 401,
      unauthorized: true,
    });
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
      (res.status === 409
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
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  const data = await res.json();
  if (data?.token) {
    setOperatorToken(data.token);
  }
}

export async function logoutOperator(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    clearOperatorToken();
  }
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

export async function updateQueueSettings(queueId: string, maxWaiting: number): Promise<void> {
  await apiFetch(`/api/queue/${queueId}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maxWaiting }),
  });
}

export function subscribeToQueue(
  queueId: string,
  onEvent: (event: QueueEvent) => void,
  onOpen?: () => void,
  onError?: () => void
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
  evtSource.onerror = () => onError?.();
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
        stats: event.data.stats ?? prev.stats,
        tickets: prev.tickets.map((t) =>
          t.id === event.data.ticketId
            ? { ...t, state: "called" as const, calledAt: event.data.calledAt ?? Date.now() }
            : t
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

export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.unauthorized === true;
}

export function isCorsOrNetwork(err: unknown): boolean {
  return err instanceof ApiError && err.cors === true;
}

/** Format ms as compact human wait (e.g. "~3 min", "just under a minute"). */
export function formatEtaMs(ms: number | null | undefined): string | null {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return null;
  const minutes = ms / 60_000;
  if (minutes < 1) return "under a minute";
  if (minutes < 60) return `~${Math.ceil(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rem = Math.round(minutes % 60);
  return `~${hours}h${rem ? ` ${rem}m` : ""}`;
}
