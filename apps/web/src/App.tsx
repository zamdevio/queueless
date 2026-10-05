import { useState, useEffect } from "react";
import { ThemeProvider } from "./lib/theme";
import { PwaProvider } from "./lib/pwa";
import { Sidebar } from "./components/Sidebar";
import { LandingView } from "./views/LandingView";
import { StudentView } from "./views/StudentView";
import { OperatorView } from "./views/OperatorView";

type View = "landing" | "student" | "operator";

function parseLocation(): { view: View; queueId: string } {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const student = path.match(/^\/student\/([^/]+)$/);
  const operator = path.match(/^\/operator\/([^/]+)$/);
  if (student) return { view: "student", queueId: student[1] };
  if (operator) return { view: "operator", queueId: operator[1] };
  return { view: "landing", queueId: "demo" };
}

function AppContent() {
  const [{ view, queueId }, setLocation] = useState(parseLocation);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const onPop = () => setLocation(parseLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function navigateTo(nextView: View, nextQueueId: string) {
    const path =
      nextView === "landing"
        ? "/"
        : nextView === "student"
          ? `/student/${nextQueueId}`
          : `/operator/${nextQueueId}`;
    window.history.pushState(null, "", path);
    setLocation({ view: nextView, queueId: nextQueueId });
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "shell-collapsed" : ""}`}>
      <Sidebar
        currentView={view}
        queueId={queueId}
        onNavigate={navigateTo}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main className="main-content">
        {view === "landing" && <LandingView onNavigate={navigateTo} />}
        {view === "student" && <StudentView queueId={queueId} />}
        {view === "operator" && <OperatorView queueId={queueId} />}
      </main>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <PwaProvider>
        <AppContent />
      </PwaProvider>
    </ThemeProvider>
  );
}
