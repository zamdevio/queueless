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
  type Ticket,
  type Board,
  type QueueEvent,
} from "../lib/api";
import { ErrorState } from "../components/ErrorState";

export function StudentView({ queueId }: { queueId: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [calledOpen, setCalledOpen] = useState(false);
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

  const join = useCallback(async () => {
    setJoining(true);
    setError(null);
    try {
      const meta = {
        userAgent: navigator.userAgent.slice(0, 300),
        language: navigator.language,
      };
      const newTicket = await joinQueue(queueId, meta);
      setTicket(newTicket);
      toast.success(`Joined queue — ticket #${newTicket.number}`);
      await loadBoard();
    } catch (err) {
      setError({
        message: errMessage(err, "Failed to join."),
        retryable: errRetryable(err),
      });
      toast.error(errMessage(err, "Failed to join."));
    } finally {
      setJoining(false);
    }
  }, [queueId, loadBoard]);

  useEffect(() => {
    let disposed = false;
    let evtSource: EventSource | null = null;

    async function init() {
      await loadBoard();
      if (disposed) return;
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
    }

    init();
    return () => {
      disposed = true;
      evtSource?.close();
    };
  }, [queueId, loadBoard, ticket]);

  async function handleLeave() {
    if (!ticket) return;
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

  if (loading) {
    return <div className="loading">Loading queue {queueId}…</div>;
  }

  if (error && !ticket) {
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

  const position = ticket
    ? waitingTickets.findIndex((t) => t.id === ticket.id) + 1
    : 0;

  return (
    <div className="student-view">
      <h1>Queue · {queueId}</h1>

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
            Join anonymously to get a ticket number. You&apos;ll see your position and when
            it&apos;s your turn.
          </p>
          <div className="queue-capacity">
            {waitingCount}/{maxWaiting} waiting
          </div>
          <button
            className="btn-primary"
            onClick={join}
            disabled={joining || waitingCount >= maxWaiting}
          >
            {joining ? "Joining…" : waitingCount >= maxWaiting ? "Queue full" : "Join queue"}
          </button>
        </div>
      ) : (
        <>
          <div className="ticket-info">
            <p>Your number</p>
            <strong>{ticket.number}</strong>
            {ticket.state === "waiting" && position > 0 && (
              <p>
                Position in line: <strong>{position}</strong>
              </p>
            )}
            {nowServing !== null && (
              <p>
                Now serving: <strong>{nowServing}</strong>
              </p>
            )}
            {ticket.state === "called" && (
              <p className="ticket-called">It&apos;s your turn — head to the counter.</p>
            )}
            {ticket.state !== "waiting" && ticket.state !== "called" && (
              <p className="ticket-closed">Ticket {ticket.state}</p>
            )}
          </div>

          {ticket.state === "waiting" && (
            <div className="actions">
              <button onClick={handleLeave}>Leave queue</button>
            </div>
          )}
        </>
      )}

      <div className="queue-list">
        <h2>Waiting customers</h2>
        <ul>
          {waitingTickets.map((t) => (
            <li key={t.id} className={ticket && t.id === ticket.id ? "self" : ""}>
              <span>
                #{t.number}
                {ticket && t.id === ticket.id ? " (you)" : ""}
              </span>
            </li>
          ))}
          {waitingTickets.length === 0 && <li className="empty-row">Queue is empty</li>}
        </ul>
      </div>

      {calledOpen && ticket && (
        <div className="dialog-backdrop" role="dialog" aria-modal="true">
          <div className="dialog-panel">
            <div className="dialog-icon">🔔</div>
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
    </div>
  );
}
