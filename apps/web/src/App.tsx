import { useState, useEffect } from "react";
import { StudentView } from "./views/StudentView";
import { OperatorView } from "./views/OperatorView";

export function App() {
  const [queueId, setQueueId] = useState<string | null>(null);
  const [view, setView] = useState<"student" | "operator" | "landing">("landing");

  useEffect(() => {
    // Parse URL hash for routing: #/student/queueId or #/operator/queueId
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
      setQueueId(null);
      setView("landing");
    }
  }, []);

  function navigateTo(view: "student" | "operator", queueId: string) {
    window.location.hash = `/#/${view}/${queueId}`;
    setView(view);
    setQueueId(queueId);
  }

  if (view === "landing") {
    return (
      <div className="landing">
        <h1>QueueLess</h1>
        <p>Digital queue management for campus services</p>

        <div className="actions">
          <div>
            <label htmlFor="queueId">Queue ID:</label>
            <input
              id="queueId"
              type="text"
              placeholder="e.g. library-desk"
              defaultValue="demo"
            />
          </div>
          <button onClick={() => navigateTo("student", "demo")}>
            Join as student
          </button>
          <button onClick={() => navigateTo("operator", "demo")}>
            Open operator dashboard
          </button>
        </div>

        <div className="links">
          <p>Or use direct links:</p>
          <a href="#/student/demo">Student view (demo)</a>
          <a href="#/operator/demo">Operator view (demo)</a>
        </div>
      </div>
    );
  }

  if (!queueId) {
    return <div className="error">Queue ID not found</div>;
  }

  if (view === "student") {
    return <StudentView queueId={queueId} />;
  }

  if (view === "operator") {
    return <OperatorView queueId={queueId} />;
  }

  return null;
}
