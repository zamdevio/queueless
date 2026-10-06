import { useCallback, useEffect, useState } from "react";
import {
  getBoard,
  subscribeToQueue,
  applyEvent,
  errMessage,
  type Board,
  type QueueEvent,
} from "../lib/api";

/** Read-only live board — good for a counter monitor. */
export function BoardView({ queueId }: { queueId: string }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getBoard(queueId);
      setBoard(data);
      setError(null);
    } catch (err) {
      setError(errMessage(err, "Could not load queue board."));
    }
  }, [queueId]);

  useEffect(() => {
    let disposed = false;
    let evtSource: EventSource | null = null;

    async function init() {
      await load();
      if (disposed) return;
      evtSource = subscribeToQueue(queueId, (event: QueueEvent) => {
        setBoard((prev) => applyEvent(prev, event));
      });
    }

    init();
    return () => {
      disposed = true;
      evtSource?.close();
    };
  }, [queueId, load]);

  if (error) {
    return (
      <div className="board-view">
        <div className="error-panel">{error}</div>
      </div>
    );
  }

  const waiting = (board?.tickets || []).filter((t) => t.state === "waiting");
  const nowServing = board?.nowServing ?? null;

  return (
    <div className="board-view">
      <div className="board-header">
        <h1>Queue · {queueId}</h1>
        <div className="board-now">
          <span className="board-label">Now serving</span>
          <span className="board-number">{nowServing ?? "—"}</span>
        </div>
      </div>

      <div className="board-waiting">
        <h2>Waiting</h2>
        <div className="board-tickets">
          {waiting.map((t) => (
            <div key={t.id} className="board-ticket">
              <span className="board-ticket-num">#{t.number}</span>
              {t.name && <span className="board-ticket-name">{t.name}</span>}
            </div>
          ))}
          {waiting.length === 0 && <p className="empty-row">No one waiting</p>}
        </div>
      </div>

      <div className="board-footer">{waiting.length} waiting · updated live</div>
    </div>
  );
}
