import { useCallback, useEffect, useState } from "react";
import {
  joinQueue,
  leaveQueue,
  getBoard,
  subscribeToQueue,
  type Ticket,
  type Board,
  type QueueEvent,
  ApiError,
} from "../lib/api";
import { ErrorState } from "../components/ErrorState";

export function StudentView({ queueId }: { queueId: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const loadBoard = useCallback(async () => {
    try {
      const boardData = await getBoard(queueId);
      setBoard(boardData);
      setError(null);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      setError({
        message: apiErr?.message || (err instanceof Error ? err.message : "Failed to load queue."),
        retryable: apiErr?.retryable ?? true,
      });
    } finally {
      setLoading(false);
    }
  }, [queueId]);

  const join = useCallback(async () => {
    setJoining(true);
    setError(null);
    try {
      const newTicket = await joinQueue(queueId);
      setTicket(newTicket);
      await loadBoard();
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      setError({
        message: apiErr?.message || (err instanceof Error ? err.message : "Failed to join."),
        retryable: apiErr?.retryable ?? true,
      });
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
  }, [queueId, loadBoard]);

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
        setTicket(null);
        return { tickets: [], nowServing: null, nextNumber: 1 };
      default:
        return prev;
    }
  }

  async function handleLeave() {
    if (!ticket) return;
    try {
      await leaveQueue(queueId, ticket.id);
      setTicket(null);
      await loadBoard();
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      setError({
        message: apiErr?.message || (err instanceof Error ? err.message : "Failed to leave."),
        retryable: apiErr?.retryable ?? true,
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

  const position = ticket
    ? waitingTickets.findIndex((t) => t.id === ticket.id) + 1
    : 0;

  return (
    <div className="student-view">
      <h1>Queue: {queueId}</h1>

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
            Join the queue anonymously to get a ticket number. No account needed.
          </p>
          <button className="btn-primary" onClick={join} disabled={joining}>
            {joining ? "Joining…" : "Join queue"}
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
              <p className="ticket-called">It's your turn — head to the counter.</p>
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
              <span>#{t.number}{ticket && t.id === ticket.id ? " (you)" : ""}</span>
            </li>
          ))}
          {waitingTickets.length === 0 && <li className="empty-row">Queue is empty</li>}
        </ul>
      </div>
    </div>
  );
}
