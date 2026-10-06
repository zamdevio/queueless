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
  exportQueueHistory,
  downloadExport,
  errMessage,
  errRetryable,
  isUnauthorized,
  type Board,
  type Ticket,
  type QueueEvent,
} from "../lib/api";
import { ErrorState } from "../components/ErrorState";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Pagination } from "../components/Pagination";
import { useAuth } from "../lib/auth";
import { OperatorLogin } from "./OperatorLogin";
import { toast } from "sonner";

type ConfirmKind = "reset" | "skip" | "remove";

interface ConfirmState {
  kind: ConfirmKind;
  ticketId?: string;
  number?: number;
}

export function OperatorView({ queueId }: { queueId: string }) {
  const { isOperator, loading: authLoading, logout, resetSession } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxInput, setMaxInput] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

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
      if (called) toast.success(`Called ticket #${called.number}`);
      else toast.info("No one waiting to call.");
    } catch (err) {
      reportError(err);
    }
  }

  async function handleSettings(e?: React.FormEvent) {
    e?.preventDefault();
    const max = Number(maxInput);
    if (!Number.isFinite(max) || max < 0) {
      toast.error("Max waiting must be a number ≥ 0");
      return;
    }
    const waitingCount = board?.waitingCount ?? 0;
    if (max < waitingCount) {
      toast.error(
        `Cannot set max to ${max} — ${waitingCount} customers are already in line. Serve or remove some first, or Reset queue to start fresh.`
      );
      return;
    }
    try {
      await updateQueueSettings(queueId, max);
      toast.success(`Queue limit set to ${max}`);
    } catch (err) {
      reportError(err);
    }
  }

  const handleSettingsBtn = () => handleSettings();

  async function handleExport(format: "csv" | "json" | "markdown") {
    try {
      const data = await exportQueueHistory(queueId, format);
      downloadExport(queueId, format, data);
      toast.success(`Exported ${format.toUpperCase()}`);
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

  async function runConfirmed() {
    if (!confirm) return;
    setConfirm(null);
    try {
      if (confirm.kind === "reset") {
        await resetQueue(queueId);
        toast.success("Queue reset");
      } else if (confirm.kind === "skip" && confirm.ticketId) {
        await skipTicket(queueId, confirm.ticketId);
        toast.success("Ticket skipped");
      } else if (confirm.kind === "remove" && confirm.ticketId) {
        await removeTicket(queueId, confirm.ticketId);
        toast.success("Ticket removed");
      }
    } catch (err) {
      reportError(err);
    }
  }

  if (authLoading) return <div className="loading">Checking operator session…</div>;
  if (!isOperator) return <OperatorLogin />;
  if (loading && !board) return <div className="loading">Loading queue {queueId}…</div>;
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
  const historyTickets = tickets.filter((t) => t.state !== "waiting");
  const nowServing = board?.nowServing ?? null;
  const maxWaiting = board?.settings?.maxWaiting ?? 50;
  const waitingCount = board?.waitingCount ?? waitingTickets.length;
  const stats = board?.stats;

  const confirmTitle =
    confirm?.kind === "reset"
      ? "Reset queue?"
      : confirm?.kind === "skip"
        ? "Skip ticket?"
        : "Remove ticket?";
  const confirmMsg =
    confirm?.kind === "reset"
      ? `All tickets in "${queueId}" will be cleared. Waiting customers will lose their place. This cannot be undone.`
      : confirm?.kind === "skip"
        ? `Ticket #${confirm?.number} will be marked skipped and removed from the waiting list.`
        : `Ticket #${confirm?.number} will be removed from the queue and marked removed.`;

  return (
    <div className="operator-view">
      <div className="view-header">
        <h1>Operator · {queueId}</h1>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const url = `${window.location.origin}/board/${queueId}`;
              navigator.clipboard.writeText(url).then(
                () => toast.success("Board link copied"),
                () => toast.error("Could not copy link")
              );
            }}
          >
            Copy board link
          </button>
          <button type="button" className="btn-secondary" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>

      {error && (
        <ErrorState
          title="Action failed"
          message={error.message}
          retryable={error.retryable}
          onRetry={() => setError(null)}
        />
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">
              {stats?.avgServiceMs != null ? `${Math.round(stats.avgServiceMs / 1000)}s` : "—"}
            </div>
            <div className="stat-label">Avg service</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{stats?.samples ?? 0}</div>
            <div className="stat-label">Samples</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{stats?.issued ?? waitingCount}</div>
            <div className="stat-label">Issued</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">
              {waitingCount}/{maxWaiting}
            </div>
            <div className="stat-label">In line</div>
          </div>
        </div>
      </div>

      <div className="ops-toolbar">
        <div className="ops-toolbar-main">
          <button
            className="btn-primary ops-call"
            onClick={handleCallNext}
            disabled={waitingTickets.length === 0}
          >
            Call next ({waitingCount})
          </button>
          <button className="btn-secondary" onClick={() => setConfirm({ kind: "reset" })}>
            Reset
          </button>
        </div>
        <div className="ops-toolbar-side">
          <label className="ops-limit" htmlFor="maxWaiting">
            Max waiting
            <input
              id="maxWaiting"
              type="number"
              min={0}
              max={10000}
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
            />
          </label>
          <button type="button" className="btn-secondary" onClick={handleSettingsBtn}>
            Save limit
          </button>
          <div className="ops-export">
            <span className="export-label">Export</span>
            <button type="button" className="btn-secondary" onClick={() => handleExport("csv")}>
              CSV
            </button>
            <button type="button" className="btn-secondary" onClick={() => handleExport("json")}>
              JSON
            </button>
            <button type="button" className="btn-secondary" onClick={() => handleExport("markdown")}>
              MD
            </button>
          </div>
        </div>
      </div>

      {nowServing !== null && (
        <div className="now-serving compact">
          <span className="now-serving-label">Now serving</span>
          <strong>{nowServing}</strong>
        </div>
      )}

      <div className="queue-list">
        <div className="queue-list-header">
          <h2>Waiting customers</h2>
          <span className="queue-list-count">
            {waitingCount}/{maxWaiting}
          </span>
        </div>
        <Pagination
          items={waitingTickets}
          searchKeys={["name"]}
          sortKey="number"
          label="waiting tickets"
        >
          {(pageItems) => (
            <ul>
              {pageItems.map((t: Ticket) => (
                <li key={t.id}>
                  <div className="ticket-row">
                    <span className="ticket-num">
                      #{t.number}
                      {t.name ? ` · ${t.name}` : ""}
                    </span>
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
                    <button
                      onClick={() => setConfirm({ kind: "skip", ticketId: t.id, number: t.number })}
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => setConfirm({ kind: "remove", ticketId: t.id, number: t.number })}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
              {waitingTickets.length === 0 && <li className="empty-row">No one waiting</li>}
            </ul>
          )}
        </Pagination>
      </div>

      <div className="history">
        <div className="queue-list-header">
          <h2>History</h2>
          <span className="queue-list-count">{historyTickets.length}</span>
        </div>
        <Pagination
          items={historyTickets}
          searchKeys={["name"]}
          sortKey="number"
          sortDir="desc"
          label="history tickets"
        >
          {(pageItems) => (
            <ul>
              {pageItems.map((t) => (
                <li key={t.id} className={t.state}>
                  #{t.number}
                  {t.name ? ` · ${t.name}` : ""} — {t.state}
                </li>
              ))}
              {historyTickets.length === 0 && <li className="empty-row">No history yet</li>}
            </ul>
          )}
        </Pagination>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirmTitle}
        message={confirmMsg}
        confirmLabel={
          confirm?.kind === "reset" ? "Reset queue" : confirm?.kind === "skip" ? "Skip ticket" : "Remove ticket"
        }
        onConfirm={runConfirmed}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
