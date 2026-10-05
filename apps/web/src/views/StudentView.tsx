import { useEffect, useState } from "react";
import {
  joinQueue,
  leaveQueue,
  getBoard,
  subscribeToQueue,
  type Ticket,
  type Board,
  type QueueEvent,
} from "../lib/api";

export function StudentView({ queueId }: { queueId: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        if (!ticket) {
          const newTicket = await joinQueue(queueId);
          setTicket(newTicket);
        }

        const boardData = await getBoard(queueId);
        setBoard(boardData);

        const evtSource = subscribeToQueue(queueId, (event: QueueEvent) => {
          handleEvent(event);
        });

        return () => {
          evtSource.close();
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    init();
  }, [queueId]);

  function handleEvent(event: QueueEvent) {
    switch (event.event) {
      case "join":
        setBoard((prev) => {
          if (prev) return { ...prev, tickets: [...prev.tickets, event.data] };
          return prev;
        });
        break;
      case "leave":
        setBoard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tickets: prev.tickets.map((t) =>
              t.id === event.data.ticketId ? { ...t, state: "left" } : t
            ),
          };
        });
        break;
      case "call":
        setBoard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            nowServing: event.data.nowServing,
            tickets: prev.tickets.map((t) =>
              t.id === event.data.ticketId ? { ...t, state: "called" } : t
            ),
          };
        });
        break;
      case "skip":
        setBoard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tickets: prev.tickets.map((t) =>
              t.id === event.data.ticketId ? { ...t, state: "skipped" } : t
            ),
          };
        });
        break;
      case "remove":
        setBoard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tickets: prev.tickets.map((t) =>
              t.id === event.data.ticketId ? { ...t, state: "removed" } : t
            ),
          };
        });
        break;
      case "reset":
        setBoard(null);
        setTicket(null);
        break;
    }
  }

  async function handleLeave() {
    if (!ticket) return;
    try {
      await leaveQueue(queueId, ticket.id);
      setTicket(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!ticket) {
    return (
      <div className="loading">
        Joining queue {queueId}...
      </div>
    );
  }

  const position = board
    ? board.tickets.filter((t) => t.state === "waiting").indexOf(ticket) + 1
    : null;

  const tickets = board?.tickets || [];

  return (
    <div className="student-view">
      <h1>Queue: {queueId}</h1>

      <div className="ticket-info">
        <p>Your number: <strong>{ticket.number}</strong></p>
        {position !== null && (
          <p>Position in line: <strong>{position}</strong></p>
        )}
        {board?.nowServing !== null && (
          <p>Now serving: <strong>{board!.nowServing}</strong></p>
        )}
      </div>

      <div className="actions">
        <button onClick={handleLeave} disabled={position === null}>
          Leave queue
        </button>
      </div>

      <div className="queue-list">
        <h2>Waiting customers</h2>
        <ul>
          {tickets.filter((t) => t.state === "waiting").map((t) => (
            <li key={t.id}>#{t.number}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
