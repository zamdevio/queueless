export type QueueEvent = {
  event: "join" | "leave" | "call" | "skip" | "remove" | "serve" | "reset" | "snapshot" | "settings";
  data: any;
};

export type TicketMeta = {
  userAgent?: string;
  country?: string;
  city?: string;
  language?: string;
  ipHash?: string;
  deviceId?: string;
};

export type Ticket = {
  id: string;
  number: number;
  state: "waiting" | "called" | "served" | "skipped" | "left" | "removed";
  createdAt: number;
  meta?: TicketMeta;
  calledAt?: number;
  name?: string;
};

export type QueueStats = {
  avgServiceMs: number | null;
  samples: number;
  lastServiceMs: number | null;
  issued: number;
  waiting: number;
};

export type JoinResult = Ticket & {
  duplicateFromSameIp?: boolean;
  existingTicketId?: string | null;
};

export type Board = {
  tickets: Ticket[];
  nowServing: number | null;
  nextNumber: number;
  settings?: { maxWaiting: number; showNamesOnBoard?: boolean };
  waitingCount?: number;
  stats?: QueueStats;
  byIp?: Record<string, { ticketId: string; number: number }[]>;
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

export async function joinQueue(
  queueId: string,
  meta?: TicketMeta,
  name?: string,
  deviceId?: string
): Promise<JoinResult> {
  const res = await apiFetch(`/api/queue/${queueId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meta, name, deviceId }),
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

/** Find this device's active ticket, if any. */
export async function findMyTicket(
  queueId: string,
  deviceId: string
): Promise<Ticket | null> {
  const board = await getBoard(queueId);
  return (
    board.tickets.find(
      (t) => t.meta?.deviceId === deviceId && (t.state === "waiting" || t.state === "called")
    ) || null
  );
}

/* ===== Queue (operator) ===== */

export async function callNext(queueId: string): Promise<Ticket | null> {
  const res = await apiFetch(`/api/queue/${queueId}/call-next`, { method: "POST" });
  return res.json();
}

export async function skipTicket(queueId: string, ticketId: string): Promise<void> {
  await apiFetch(`/api/queue/${queueId}/skip/${ticketId}`, { method: "POST" });
}

/** Customer marks their ticket as served. */
export async function markServed(queueId: string, ticketId: string): Promise<void> {
  await apiFetch(`/api/queue/${queueId}/serve/${ticketId}`, { method: "POST" });
}

export async function removeTicket(queueId: string, ticketId: string): Promise<void> {
  await apiFetch(`/api/queue/${queueId}/remove/${ticketId}`, { method: "POST" });
}

export async function resetQueue(queueId: string): Promise<void> {
  await apiFetch(`/api/queue/${queueId}/reset`, { method: "POST" });
}

export async function updateQueueSettings(
  queueId: string,
  maxWaiting: number,
  showNamesOnBoard?: boolean
): Promise<void> {
  await apiFetch(`/api/queue/${queueId}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maxWaiting, showNamesOnBoard }),
  });
}

/** Operator export — returns raw text (CSV/MD) or JSON object. */
export async function exportQueueHistory(
  queueId: string,
  format: "csv" | "json" | "markdown"
): Promise<string | object> {
  const res = await apiFetch(`/api/queue/${queueId}/export?format=${format}`);
  if (format === "json") return res.json();
  return res.text();
}

export function downloadExport(
  queueId: string,
  format: "csv" | "json" | "markdown",
  content: string | object
): void {
  const ext = format === "markdown" ? "md" : format;
  const mime =
    format === "csv"
      ? "text/csv;charset=utf-8"
      : format === "markdown"
        ? "text/markdown;charset=utf-8"
        : "application/json;charset=utf-8";
  const body = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `queueless-${queueId}-export.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
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
      return {
        ...prev,
        tickets: [...prev.tickets, event.data],
        waitingCount: (prev.waitingCount ?? 0) + 1,
        stats: prev.stats
          ? { ...prev.stats, waiting: (prev.stats.waiting ?? 0) + 1 }
          : prev.stats,
      };
    case "leave":
      return {
        ...prev,
        waitingCount: Math.max((prev.waitingCount ?? 1) - 1, 0),
        tickets: prev.tickets.map((t) =>
          t.id === event.data.ticketId ? { ...t, state: "left" as const } : t
        ),
      };
    case "call":
      return {
        ...prev,
        nowServing: event.data.nowServing ?? prev.nowServing,
        stats: event.data.stats ?? prev.stats,
        waitingCount: Math.max(
          (prev.waitingCount ?? 1) - 1,
          event.data.stats?.waiting ?? (prev.waitingCount ?? 1) - 1
        ),
        tickets: prev.tickets.map((t) =>
          t.id === event.data.ticketId
            ? { ...t, state: "called" as const, calledAt: event.data.calledAt ?? Date.now() }
            : t
        ),
      };
    case "skip":
      return {
        ...prev,
        waitingCount: Math.max((prev.waitingCount ?? 1) - 1, 0),
        tickets: prev.tickets.map((t) =>
          t.id === event.data.ticketId ? { ...t, state: "skipped" as const } : t
        ),
      };
    case "serve":
      return {
        ...prev,
        nowServing:
          event.data.nowServing !== undefined ? event.data.nowServing : prev.nowServing,
        waitingCount:
          typeof event.data.waitingCount === "number"
            ? event.data.waitingCount
            : Math.max((prev.waitingCount ?? 1) - 1, 0),
        stats: event.data.stats ?? prev.stats,
        tickets: prev.tickets.map((t) =>
          t.id === event.data.ticketId ? { ...t, state: "served" as const } : t
        ),
      };
    case "remove":
      return {
        ...prev,
        waitingCount: Math.max((prev.waitingCount ?? 1) - 1, 0),
        tickets: prev.tickets.map((t) =>
          t.id === event.data.ticketId ? { ...t, state: "removed" as const } : t
        ),
      };
    case "settings":
      return { ...prev, settings: event.data };
    case "reset":
      return {
        tickets: [],
        nowServing: null,
        nextNumber: 1,
        waitingCount: 0,
        settings: prev.settings,
        stats: prev.stats
          ? { ...prev.stats, waiting: 0, issued: 0, samples: 0, avgServiceMs: null, lastServiceMs: null }
          : prev.stats,
      };
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

/** Compact local clock time for operator lists (e.g. "09:41"; "10-06 09:41" when not today). */
export function formatClockTime(ts: number | null | undefined): string | null {
  if (ts == null || !Number.isFinite(ts)) return null;
  const d = new Date(ts);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (new Date().toDateString() === d.toDateString()) return time;
  const md = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${md} ${time}`;
}
