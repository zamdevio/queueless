import { useCallback, useEffect, useState } from "react";
import {
  callNext,
  skipTicket,
  removeTicket,
  resetQueue,
  getBoard,
  subscribeToQueue,
  type Board,
  type QueueEvent,
  ApiError,
} from "../lib/api";
import { ErrorState } from "../components/ErrorState";

function errMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

function errRetryable(err: unknown): boolean {
  if (err instanceof ApiError) return err.retryable;
  return true;
}

export function OperatorView({ queueId }: { queueId: string }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const boardData = await getBoard(queueId);
      setBoard(boardData);
    } catch (err) {
      setError({
        message: errMessage(err, "Failed to load queue."),
        retryable: errRetryable(err),
      });
    } finally {
      setLoading(false);
    }
  }, [queueId]);

  useEffect(() => {
    let disposed = false;
    let evtSource: EventSource | null = null;

    async function init() {
      await load();
      if (disposed) return;
      evtSource = subscribeToQueue(queueId, (event: QueueEvent) => {
        if (event.event === "snapshot") {
          setBoard(event.data);
          return;
        }
        setBoard((prev) => applyEvent(prev, event));
      });
    }

    init();
    return () => {
      disposed = true;
      evtSource?.close();
    };
  }, [queueId, load]);

  function applyEvent(prev: Board | null, event: QueueEvent): Board | null {
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
      case "reset":
        return { tickets: [], nowServing: null, nextNumber: 1 };
      default:
        return prev;
    }
  }

  function reportError(err: unknown) {
    setError({
      message: errMessage(err, "Action failed."),
      retryable: errRetryable(err),
    });
  }

  async function handleCallNext() {
    try {
      await callNext(queueId);
    } catch (err) {
      reportError(err);
    }
  }

  async function handleSkip(ticketId: string) {
    try {
      await skipTicket(queueId, ticketId);
    } catch (err) {
      reportError(err);
    }
  }

  async function handleRemove(ticketId: string) {
    try {
      await removeTicket(queueId, ticketId);
    } catch (err) {
      reportError(err);
    }
  }

  async function handleReset() {
    if (!confirm("Reset the entire queue? This cannot be undone.")) return;
    try {
      await resetQueue(queueId);
    } catch (err) {
      reportError(err);
    }
  }

  if (loading && !board) {
    return <div className="loading">Loading queue {queueId}…</div>;
  }

  if (error && !board) {
    return (
      <ErrorState
        title="Could not load queue"
        message={error.message}
        retryable={error.retryable}
        onRetry={load}
      />
    );
  }

  const tickets = board?.tickets ?? [];
  const waitingTickets = tickets.filter((t) => t.state === "waiting");
  const nowServing = board?.nowServing ?? null;

  return (
    <div className="operator-view">
      <h1>Operator: {queueId}</h1>

      {error && (
        <ErrorState
          title="Action failed"
          message={error.message}
          retryable={error.retryable}
          onRetry={() => setError(null)}
        />
      )}

      <div className="controls">
        <button onClick={handleCallNext} disabled={waitingTickets.length === 0}>
          Call next ({waitingTickets.length} waiting)
        </button>
        <button onClick={handleReset}>Reset queue</button>
      </div>

      {nowServing !== null && (
        <div className="now-serving">
          Now serving: <strong>{nowServing}</strong>
        </div>
      )}

      <div className="queue-list">
        <h2>Waiting customers</h2>
        <ul>
          {waitingTickets.map((t) => (
            <li key={t.id}>
              <span>#{t.number}</span>
              <div className="actions">
                <button onClick={() => handleSkip(t.id)}>Skip</button>
                <button onClick={() => handleRemove(t.id)}>Remove</button>
              </div>
            </li>
          ))}
          {waitingTickets.length === 0 && <li className="empty-row">No one waiting</li>}
        </ul>
      </div>

      <div className="history">
        <h2>History</h2>
        <ul>
          {tickets
            .filter((t) => t.state !== "waiting")
            .map((t) => (
              <li key={t.id} className={t.state}>
                #{t.number} — {t.state}
              </li>
            ))}
          {tickets.filter((t) => t.state !== "waiting").length === 0 && (
            <li className="empty-row">No history yet</li>
          )}
        </ul>
      </div>
    </div>
  );
}
