import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  joinQueue,
  leaveQueue,
  getBoard,
  subscribeToQueue,
  applyEvent,
  errMessage,
  errRetryable,
  formatEtaMs,
  findMyTicket,
  type Ticket,
  type Board,
  type QueueEvent,
} from "../lib/api";
import { getDeviceId } from "../lib/device";
import { ErrorState } from "../components/ErrorState";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { IconAlert } from "../components/Icons";
import { Pagination } from "../components/Pagination";

export function StudentView({ queueId }: { queueId: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [calledOpen, setCalledOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const calledRef = useRef(false);

  const loadBoard = useCallback(async () => {
    try {
      const boardData = await getBoard(queueId);
      setBoard(boardData);
      setError(null);
    } catch (err) {
      setError({
        message: errMessage(err, "Failed to load queue."),
        retryable: errRetryable(err),
      });
    } finally {
      setLoading(false);
    }
  }, [queueId]);

  // Restore ticket for this device
  useEffect(() => {
    let disposed = false;
    async function restore() {
      await loadBoard();
      if (disposed) return;
      try {
        const mine = await findMyTicket(queueId, getDeviceId());
        if (mine && !disposed) setTicket(mine);
      } catch {
        // ignore
      }
    }
    restore();
    return () => {
      disposed = true;
    };
  }, [queueId, loadBoard]);

  // SSE — board updates automatically (capacity counts included)
  useEffect(() => {
    let disposed = false;
    let evtSource: EventSource | null = null;

    evtSource = subscribeToQueue(queueId, (event: QueueEvent) => {
      setBoard((prev) => applyEvent(prev, event));
      if (
        event.event === "call" &&
        ticket &&
        event.data?.ticketId === ticket.id &&
        !calledRef.current
      ) {
        calledRef.current = true;
        setCalledOpen(true);
      }
    });

    return () => {
      disposed = true;
      evtSource?.close();
    };
  }, [queueId, ticket]);

  const join = useCallback(async () => {
    setJoining(true);
    setError(null);
    try {
      const deviceId = getDeviceId();
      const meta = {
        userAgent: navigator.userAgent.slice(0, 300),
        language: navigator.language,
        deviceId,
      };
      const newTicket = await joinQueue(queueId, meta, displayName || undefined, deviceId);
      setTicket(newTicket);
      if (newTicket.duplicateFromSameIp) {
        toast.warning("This network already has a waiting ticket — staff may see two.");
      } else {
        toast.success(`Joined — ticket #${newTicket.number}`);
      }
      await loadBoard();
    } catch (err) {
      const msg = errMessage(err, "Failed to join.");
      // device already in queue — restore existing
      if (msg.toLowerCase().includes("already has an active ticket")) {
        try {
          const mine = await findMyTicket(queueId, getDeviceId());
          if (mine) setTicket(mine);
        } catch {
          // ignore
        }
      }
      setError({ message: msg, retryable: errRetryable(err) });
      toast.error(msg);
    } finally {
      setJoining(false);
    }
  }, [queueId, loadBoard, displayName]);

  async function handleLeave() {
    if (!ticket) return;
    setLeaveOpen(true);
  }

  async function confirmLeave() {
    if (!ticket) return;
    setLeaveOpen(false);
    try {
      await leaveQueue(queueId, ticket.id);
      setTicket(null);
      toast.success("Left the queue");
      await loadBoard();
    } catch (err) {
      setError({
        message: errMessage(err, "Failed to leave."),
        retryable: errRetryable(err),
      });
    }
  }

  if (loading && !ticket && !board) {
    return <div className="loading">Loading queue {queueId}…</div>;
  }

  if (error && !ticket && !board) {
    return (
      <ErrorState
        title="Could not load queue"
        message={error.message}
        retryable={error.retryable}
        onRetry={loadBoard}
      />
    );
  }

  const tickets = board?.tickets ?? [];
  const waitingTickets = tickets.filter((t) => t.state === "waiting");
  const nowServing = board?.nowServing ?? null;
  const maxWaiting = board?.settings?.maxWaiting ?? 50;
  const waitingCount = board?.waitingCount ?? waitingTickets.length;
  const stats = board?.stats;

  const position = ticket
    ? waitingTickets.findIndex((t) => t.id === ticket.id) + 1
    : 0;

  const etaForMe =
    ticket && ticket.state === "waiting" && position > 0 && stats?.avgServiceMs
      ? formatEtaMs(position * stats.avgServiceMs)
      : null;

  return (
    <div className="student-view">
      <div className="view-header">
        <h1>Queue · {queueId}</h1>
        <div className="capacity-pill" aria-live="polite">
          {waitingCount}/{maxWaiting} waiting
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

      {!ticket ? (
        <div className="join-panel">
          <p className="join-hint">
            Get a ticket number and watch your position. Display name is optional (staff only).
          </p>
          <form
            className="join-form"
            onSubmit={(e) => {
              e.preventDefault();
              join();
            }}
          >
            <input
              type="text"
              placeholder="Display name (optional)"
              value={displayName}
              maxLength={40}
              onChange={(e) => setDisplayName(e.target.value)}
              aria-label="Display name"
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={joining || waitingCount >= maxWaiting}
            >
              {joining
                ? "Joining…"
                : waitingCount >= maxWaiting
                  ? "Queue full"
                  : "Join queue"}
            </button>
          </form>
        </div>
      ) : (
        <div className="ticket-card">
          <div className="ticket-card-main">
            <div className="ticket-number-block">
              <span className="ticket-label">Your number</span>
              <span className="ticket-big">{ticket.number}</span>
            </div>
            <div className="ticket-facts">
              {ticket.state === "waiting" && position > 0 && (
                <div className="ticket-fact">
                  <span className="ticket-fact-label">Position</span>
                  <span className="ticket-fact-value">{position}</span>
                </div>
              )}
              {etaForMe && (
                <div className="ticket-fact">
                  <span className="ticket-fact-label">Est. wait</span>
                  <span className="ticket-fact-value">{etaForMe}</span>
                </div>
              )}
              {nowServing !== null && (
                <div className="ticket-fact">
                  <span className="ticket-fact-label">Serving</span>
                  <span className="ticket-fact-value">{nowServing}</span>
                </div>
              )}
            </div>
          </div>
          {ticket.state === "called" && (
            <p className="ticket-called">It&apos;s your turn — head to the counter.</p>
          )}
          {ticket.state === "waiting" && (
            <div className="ticket-card-actions">
              <button className="btn-secondary" onClick={handleLeave}>
                Leave queue
              </button>
            </div>
          )}
        </div>
      )}

      <div className="queue-list">
        <div className="queue-list-header">
          <h2>Waiting</h2>
          <span className="queue-list-count">
            {waitingCount}/{maxWaiting}
          </span>
        </div>
        <Pagination
          items={waitingTickets}
          searchKeys={["name"]}
          sortKey="number"
          label="tickets"
        >
          {(pageItems) => (
            <ul>
              {pageItems.map((t) => (
                <li key={t.id} className={ticket && t.id === ticket.id ? "self" : ""}>
                  <span>
                    #{t.number}
                    {t.name ? ` · ${t.name}` : ""}
                    {ticket && t.id === ticket.id ? " (you)" : ""}
                  </span>
                </li>
              ))}
              {waitingTickets.length === 0 && <li className="empty-row">Queue is empty</li>}
            </ul>
          )}
        </Pagination>
      </div>

      {calledOpen && ticket && (
        <div className="dialog-backdrop" role="dialog" aria-modal="true">
          <div className="dialog-panel">
            <div className="dialog-icon">
              <IconAlert size={40} />
            </div>
            <h2>It&apos;s your turn</h2>
            <p>
              Ticket <strong>#{ticket.number}</strong> is now being served. Please head to
              the counter.
            </p>
            <button className="btn-primary" onClick={() => setCalledOpen(false)}>
              Got it
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={leaveOpen}
        title="Leave queue?"
        message={`Ticket #${ticket?.number} will be removed from the waiting list. You cannot undo this.`}
        confirmLabel="Leave queue"
        onConfirm={confirmLeave}
        onCancel={() => setLeaveOpen(false)}
      />
    </div>
  );
}
