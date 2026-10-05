import { useCallback, useEffect, useState } from "react";
import {
  callNext,
  skipTicket,
  removeTicket,
  resetQueue,
  getBoard,
  updateQueueSettings,
  subscribeToQueue,
  applyEvent,
  errMessage,
  errRetryable,
  isUnauthorized,
  type Board,
  type QueueEvent,
} from "../lib/api";
import { ErrorState } from "../components/ErrorState";
import { useAuth } from "../lib/auth";
import { OperatorLogin } from "./OperatorLogin";
import { toast } from "sonner";

export function OperatorView({ queueId }: { queueId: string }) {
  const { isOperator, loading: authLoading, logout, resetSession } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxInput, setMaxInput] = useState("");

  const handleAuthFailure = useCallback(
    (err: unknown) => {
      if (isUnauthorized(err)) {
        resetSession();
        toast.error("Session expired — please sign in again.");
        return true;
      }
      return false;
    },
    [resetSession]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const boardData = await getBoard(queueId);
      setBoard(boardData);
      setMaxInput(String(boardData.settings?.maxWaiting ?? 50));
    } catch (err) {
      if (handleAuthFailure(err)) {
        setLoading(false);
        return;
      }
      setError({
        message: errMessage(err, "Failed to load queue."),
        retryable: errRetryable(err),
      });
    } finally {
      setLoading(false);
    }
  }, [queueId, handleAuthFailure]);

  useEffect(() => {
    let disposed = false;
    let evtSource: EventSource | null = null;

    async function init() {
      await load();
      if (disposed) return;
      evtSource = subscribeToQueue(queueId, (event: QueueEvent) => {
        setBoard((prev) => applyEvent(prev, event));
        if (event.event === "settings") {
          setMaxInput(String(event.data?.maxWaiting ?? ""));
        }
      });
    }

    init();
    return () => {
      disposed = true;
      evtSource?.close();
    };
  }, [queueId, load]);

  function reportError(err: unknown) {
    if (handleAuthFailure(err)) return;
    setError({
      message: errMessage(err, "Action failed."),
      retryable: errRetryable(err),
    });
    toast.error(errMessage(err, "Action failed."));
  }

  async function handleCallNext() {
    try {
      const called = await callNext(queueId);
      if (called) {
        toast.success(`Called ticket #${called.number}`);
      } else {
        toast.info("No one waiting to call.");
      }
    } catch (err) {
      reportError(err);
    }
  }

  async function handleSkip(ticketId: string) {
    try {
      await skipTicket(queueId, ticketId);
      toast.success("Ticket skipped");
    } catch (err) {
      reportError(err);
    }
  }

  async function handleRemove(ticketId: string) {
    try {
      await removeTicket(queueId, ticketId);
      toast.success("Ticket removed");
    } catch (err) {
      reportError(err);
    }
  }

  async function handleReset() {
    if (!confirm("Reset the entire queue? This cannot be undone.")) return;
    try {
      await resetQueue(queueId);
      toast.success("Queue reset");
    } catch (err) {
      reportError(err);
    }
  }

  async function handleSettings(e: React.FormEvent) {
    e.preventDefault();
    const max = Number(maxInput);
    if (!Number.isFinite(max) || max < 0) {
      toast.error("Max waiting must be a number ≥ 0");
      return;
    }
    try {
      await updateQueueSettings(queueId, max);
      toast.success(`Queue limit set to ${max}`);
    } catch (err) {
      reportError(err);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      toast.success("Signed out");
    } catch {
      resetSession();
    }
  }

  if (authLoading) {
    return <div className="loading">Checking operator session…</div>;
  }

  if (!isOperator) {
    return <OperatorLogin />;
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
  const maxWaiting = board?.settings?.maxWaiting ?? 50;
  const waitingCount = board?.waitingCount ?? waitingTickets.length;

  return (
    <div className="operator-view">
      <div className="view-header">
        <h1>Operator · {queueId}</h1>
        <button type="button" className="btn-secondary" onClick={handleLogout}>
          Sign out
        </button>
      </div>

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
          Call next ({waitingCount} waiting)
        </button>
        <button onClick={handleReset}>Reset queue</button>
      </div>

      <form className="settings-row" onSubmit={handleSettings}>
        <label htmlFor="maxWaiting">Max waiting</label>
        <input
          id="maxWaiting"
          type="number"
          min={0}
          max={10000}
          value={maxInput}
          onChange={(e) => setMaxInput(e.target.value)}
        />
        <button type="submit" className="btn-secondary">
          Save limit
        </button>
        <span className="settings-hint">
          {waitingCount}/{maxWaiting} in line
        </span>
      </form>

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
              <div className="ticket-row">
                <span className="ticket-num">#{t.number}</span>
                <span className="ticket-meta">
                  {[
                    t.meta?.country,
                    t.meta?.city,
                    t.meta?.language,
                    t.meta?.userAgent?.slice(0, 40),
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </span>
              </div>
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
