import { useEffect, useState } from "react";
import {
  callNext,
  skipTicket,
  removeTicket,
  resetQueue,
  getBoard,
  subscribeToQueue,
  type Board,
  type QueueEvent,
} from "../lib/api";

export function OperatorView({ queueId }: { queueId: string }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
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
        setBoard((prev) => (prev ? { ...prev, tickets: [...prev.tickets, event.data] } : prev));
        break;
      case "leave":
        setBoard((prev) =>
          prev
            ? {
                ...prev,
                tickets: prev.tickets.map((t) =>
                  t.id === event.data.ticketId ? { ...t, state: "left" } : t
                ),
              }
            : prev
        );
        break;
      case "call":
        setBoard((prev) =>
          prev
            ? {
                ...prev,
                nowServing: event.data.nowServing,
                tickets: prev.tickets.map((t) =>
                  t.id === event.data.ticketId ? { ...t, state: "called" } : t
                ),
              }
            : prev
        );
        break;
      case "skip":
        setBoard((prev) =>
          prev
            ? {
                ...prev,
                tickets: prev.tickets.map((t) =>
                  t.id === event.data.ticketId ? { ...t, state: "skipped" } : t
                ),
              }
            : prev
        );
        break;
      case "remove":
        setBoard((prev) =>
          prev
            ? {
                ...prev,
                tickets: prev.tickets.map((t) =>
                  t.id === event.data.ticketId ? { ...t, state: "removed" } : t
                ),
              }
            : prev
        );
        break;
      case "reset":
        setBoard(null);
        break;
    }
  }

  async function handleCallNext() {
    try {
      await callNext(queueId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleSkip(ticketId: string) {
    try {
      await skipTicket(queueId, ticketId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleRemove(ticketId: string) {
    try {
      await removeTicket(queueId, ticketId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleReset() {
    if (!confirm("Reset the entire queue? This cannot be undone.")) return;
    try {
      await resetQueue(queueId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  const tickets = board?.tickets || [];
  const waitingTickets = tickets.filter((t) => t.state === "waiting");

  return (
    <div className="operator-view">
      <h1>Operator: {queueId}</h1>

      <div className="controls">
        <button onClick={handleCallNext} disabled={waitingTickets.length === 0}>
          Call next ({waitingTickets.length} waiting)
        </button>
        <button onClick={handleReset}>Reset queue</button>
      </div>

      {board?.nowServing !== null && (
        <div className="now-serving">
          Now serving: <strong>{board!.nowServing}</strong>
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
        </ul>
      </div>

      <div className="history">
        <h2>History</h2>
        <ul>
          {tickets.filter((t) => t.state !== "waiting").map((t) => (
            <li key={t.id} className={t.state}>
              #{t.number} — {t.state}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
