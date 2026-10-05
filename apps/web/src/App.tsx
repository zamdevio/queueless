import { useState, useEffect } from "react";
import { ThemeProvider } from "./lib/theme";
import { Sidebar } from "./components/Sidebar";
import { LandingView } from "./views/LandingView";
import { StudentView } from "./views/StudentView";
import { OperatorView } from "./views/OperatorView";

type View = "landing" | "student" | "operator";

function AppContent() {
  const [queueId, setQueueId] = useState<string | null>(null);
  const [view, setView] = useState<View>("landing");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const studentMatch = hash.match(/^#\/student\/(.+)$/);
    const operatorMatch = hash.match(/^#\/operator\/(.+)$/);

    if (studentMatch) {
      setQueueId(studentMatch[1]);
      setView("student");
    } else if (operatorMatch) {
      setQueueId(operatorMatch[1]);
      setView("operator");
    } else {
      setQueueId("demo");
      setView("landing");
    }
  }, []);

  function navigateTo(view: View, queueId: string) {
    window.location.hash = `/#/${view}/${queueId}`;
    setView(view);
    setQueueId(queueId);
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "shell-collapsed" : ""}`}>
      <Sidebar
        currentView={view}
        queueId={queueId || "demo"}
        onNavigate={navigateTo}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main className="main-content">
        {view === "landing" && <LandingView onNavigate={navigateTo} />}
        {view === "student" && queueId && <StudentView queueId={queueId} />}
        {view === "operator" && queueId && <OperatorView queueId={queueId} />}
      </main>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
