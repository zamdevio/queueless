import { PwaProvider } from "./lib/pwa";
import { AuthProvider } from "./lib/auth";
import { Sidebar } from "./components/Sidebar";
import { LandingView } from "./views/LandingView";
import { StudentView } from "./views/StudentView";
import { OperatorView } from "./views/OperatorView";
import { DocsView } from "./views/DocsView";
import { useState, useEffect } from "react";

type View = "landing" | "student" | "operator" | "docs";
type DocsPage = "guide" | "development" | "about";

function parseLocation(): { view: View; queueId: string; docsPage: DocsPage } {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const student = path.match(/^\/student\/([^/]+)$/);
  const operator = path.match(/^\/operator\/([^/]+)$/);
  const docs = path.match(/^\/docs\/(guide|development|about)$/);
  if (student) return { view: "student", queueId: student[1], docsPage: "guide" };
  if (operator) return { view: "operator", queueId: operator[1], docsPage: "guide" };
  if (docs) return { view: "docs", queueId: "main", docsPage: docs[1] as DocsPage };
  return { view: "landing", queueId: "main", docsPage: "guide" };
}

function AppContent() {
  const [{ view, queueId, docsPage }, setLocation] = useState(parseLocation);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const onPop = () => setLocation(parseLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function navigateTo(nextView: View, nextQueueId: string, docsPage: DocsPage = "guide") {
    let path = "/";
    if (nextView === "student") path = `/student/${nextQueueId}`;
    else if (nextView === "operator") path = `/operator/${nextQueueId}`;
    else if (nextView === "docs") path = `/docs/${docsPage}`;
    window.history.pushState(null, "", path);
    setLocation({ view: nextView, queueId: nextQueueId, docsPage });
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "shell-collapsed" : ""}`}>
      <Sidebar
        currentView={view}
        docsPage={view === "docs" ? docsPage : undefined}
        queueId={queueId}
        onNavigate={navigateTo}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main className="main-content">
        {view === "landing" && <LandingView onNavigate={navigateTo} />}
        {view === "student" && <StudentView queueId={queueId} />}
        {view === "operator" && <OperatorView queueId={queueId} />}
        {view === "docs" && <DocsView page={docsPage} />}
      </main>
    </div>
  );
}

export function App() {
  return (
    <PwaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PwaProvider>
  );
}
