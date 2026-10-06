import { useCallback, useEffect, useState } from "react";
import {
  getBoard,
  subscribeToQueue,
  applyEvent,
  type Board,
  type Ticket,
  type QueueEvent,
} from "../lib/api";
import { Pagination } from "../components/Pagination";
import { toast } from "sonner";
import { ConfirmDialog } from "../components/ConfirmDialog";

const DEMO_TICKETS: Ticket[] = [
  { id: "d1", number: 1, state: "served", createdAt: Date.now() - 3600000, name: "Amina", meta: { country: "MY", city: "KL" } },
  { id: "d2", number: 2, state: "served", createdAt: Date.now() - 3000000, name: "Wei", meta: { country: "MY", city: "PJ" } },
  { id: "d3", number: 3, state: "served", createdAt: Date.now() - 2400000, name: "Sarah", meta: { country: "MY", city: "KL" } },
  { id: "d4", number: 4, state: "called", createdAt: Date.now() - 1800000, name: "Raj", meta: { country: "MY", city: "SJ" } },
  { id: "d5", number: 5, state: "waiting", createdAt: Date.now() - 900000, name: "Fatima", meta: { country: "MY", city: "KL" } },
  { id: "d6", number: 6, state: "waiting", createdAt: Date.now() - 600000, meta: { country: "MY", city: "PJ" } },
  { id: "d7", number: 7, state: "waiting", createdAt: Date.now() - 300000, name: "Chen", meta: { country: "MY", city: "KL" } },
];

const DEMO_BOARD: Board = {
  tickets: DEMO_TICKETS,
  nowServing: 4,
  nextNumber: 8,
  settings: { maxWaiting: 50 },
  waitingCount: 3,
  stats: { avgServiceMs: 251000, samples: 3, lastServiceMs: 240000, issued: 7, waiting: 3 },
  byIp: {},
};

const DEMO_MSG = "Demo mode — backend actions are disabled.";

export function OperatorDemoView({
  queueId,
  onSignIn,
}: {
  queueId: string;
  onSignIn?: () => void;
}) {
  const [board, setBoard] = useState<Board | null>(null);
  const [confirm, setConfirm] = useState<{ kind: string; number?: number } | null>(null);
  const [maxInput, setMaxInput] = useState("50");

  const load = useCallback(async () => {
    try {
      const data = await getBoard(queueId);
      setBoard(data);
    } catch {
      setBoard(DEMO_BOARD);
    }
  }, [queueId]);

  useEffect(() => {
    let disposed = false;
    let evtSource: EventSource | null = null;

    async function init() {
      await load();
      if (disposed) return;
      try {
        evtSource = subscribeToQueue(queueId, (event: QueueEvent) => {
          setBoard((prev) => applyEvent(prev, event));
        });
      } catch {
        // keep demo board
      }
    }

    init();
    return () => {
      disposed = true;
      evtSource?.close();
    };
  }, [queueId, load]);

  function demoAction() {
    toast.info(DEMO_MSG);
  }

  const tickets = board?.tickets ?? DEMO_TICKETS;
  const waitingTickets = tickets.filter((t) => t.state === "waiting");
  const historyTickets = tickets.filter((t) => t.state !== "waiting");
  const nowServing = board?.nowServing ?? DEMO_BOARD.nowServing;
  const maxWaiting = board?.settings?.maxWaiting ?? 50;
  const waitingCount = board?.waitingCount ?? waitingTickets.length;
  const stats = board?.stats ?? DEMO_BOARD.stats;

  return (
    <div className="operator-view demo-mode">
      <div className="view-header">
        <div>
          <h1>Operator · {queueId}</h1>
          <p className="view-subtitle">Live queue control (demo)</p>
        </div>
      </div>

      <div className="ops-grid">
        <div className="ops-primary">
          <div className="ops-hero">
            <div className="ops-hero-main">
              <span className="ops-hero-label">Now serving</span>
              <span className="ops-hero-number">{nowServing ?? "—"}</span>
            </div>
            <div className="ops-hero-actions">
              <button className="btn-primary ops-hero-btn" onClick={demoAction}>
                Call next ({waitingCount})
              </button>
              <button
                className="btn-secondary ops-hero-btn"
                onClick={() => setConfirm({ kind: "reset" })}
              >
                Reset queue
              </button>
            </div>
          </div>

          <div className="queue-list ops-panel">
            <div className="queue-list-header">
              <h2>Waiting customers</h2>
              <span className="queue-list-count">
                {waitingCount}/{maxWaiting}
              </span>
            </div>
            <Pagination items={waitingTickets} searchKeys={["name"]} sortKey="number" label="waiting">
              {(pageItems) => (
                <ul>
                  {pageItems.map((t) => (
                    <li key={t.id}>
                      <div className="ticket-row">
                        <span className="ticket-num">
                          #{t.number}
                          {t.name ? ` · ${t.name}` : ""}
                        </span>
                        <span className="ticket-meta">
                          {[t.meta?.country, t.meta?.city].filter(Boolean).join(" · ") || "—"}
                        </span>
                      </div>
                      <div className="actions">
                        <button onClick={() => setConfirm({ kind: "skip", number: t.number })}>
                          Skip
                        </button>
                        <button onClick={() => setConfirm({ kind: "remove", number: t.number })}>
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

          <div className="history ops-panel">
            <div className="queue-list-header">
              <h2>History</h2>
              <span className="queue-list-count">{historyTickets.length}</span>
            </div>
            <Pagination items={historyTickets} searchKeys={["name"]} sortKey="number" sortDir="desc" label="history">
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
        </div>

        <aside className="ops-side">
          <div className="demo-banner" role="status">
            <strong>Demo mode</strong> — layout preview, no backend actions.
            {onSignIn ? (
              <button type="button" className="demo-signin" onClick={onSignIn}>
                Sign in with PIN
              </button>
            ) : null}
          </div>

          <div className="ops-side-actions">
            <button type="button" className="btn-secondary" onClick={demoAction}>
              Copy board link
            </button>
            <button type="button" className="btn-secondary" onClick={demoAction}>
              Sign out
            </button>
          </div>

          <div className="ops-stats">
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

          <div className="ops-settings ops-panel">
            <h2>Queue settings</h2>
            <label className="ops-setting-row" htmlFor="demoMax">
              Max waiting
              <input
                id="demoMax"
                type="number"
                min={0}
                max={10000}
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
              />
            </label>
            <button type="button" className="btn-primary ops-save" onClick={demoAction}>
              Save limit
            </button>

            <div className="ops-export-block">
              <span className="export-label">Export</span>
              <div className="ops-export-btns">
                <button type="button" className="btn-secondary" onClick={demoAction}>
                  CSV
                </button>
                <button type="button" className="btn-secondary" onClick={demoAction}>
                  JSON
                </button>
                <button type="button" className="btn-secondary" onClick={demoAction}>
                  MD
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.kind === "reset"
            ? "Reset queue?"
            : confirm?.kind === "skip"
              ? "Skip ticket?"
              : "Remove ticket?"
        }
        message={
          confirm?.kind === "reset"
            ? `All tickets in "${queueId}" will be cleared. This cannot be undone.`
            : `Ticket #${confirm?.number} will be ${
                confirm?.kind === "skip" ? "skipped" : "removed"
              } from the waiting list.`
        }
        confirmLabel={
          confirm?.kind === "reset"
            ? "Reset queue"
            : confirm?.kind === "skip"
              ? "Skip ticket"
              : "Remove ticket"
        }
        onConfirm={() => {
          setConfirm(null);
          demoAction();
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
