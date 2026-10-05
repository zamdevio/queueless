import { useTheme } from "../lib/theme";

interface SidebarProps {
  currentView: "landing" | "student" | "operator";
  queueId: string;
  onNavigate: (view: "landing" | "student" | "operator", queueId: string) => void;
}

export function Sidebar({ currentView, queueId, onNavigate }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">Q</span>
          <span className="logo-text">QueueLess</span>
        </div>
        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
          {theme === "dark" ? "☀️" : ""}
        </button>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${currentView === "landing" ? "active" : ""}`}
          onClick={() => onNavigate("landing", queueId)}
        >
          <span className="nav-icon"></span>
          <span className="nav-label">Home</span>
        </button>

        {currentView !== "landing" && (
          <>
            <div className="nav-divider">Queue: {queueId}</div>

            <button
              className={`nav-item ${currentView === "student" ? "active" : ""}`}
              onClick={() => onNavigate("student", queueId)}
            >
              <span className="nav-icon"></span>
              <span className="nav-label">Student View</span>
            </button>

            <button
              className={`nav-item ${currentView === "operator" ? "active" : ""}`}
              onClick={() => onNavigate("operator", queueId)}
            >
              <span className="nav-icon">‍💼</span>
              <span className="nav-label">Operator Dashboard</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="version">v0.1.0</div>
        <div className="status">
          <span className="status-dot" />
          <span>QueueLess</span>
        </div>
      </div>
    </aside>
  );
}
