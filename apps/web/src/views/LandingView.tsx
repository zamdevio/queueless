import { useTheme } from "../lib/theme";

interface LandingViewProps {
  onNavigate: (view: "student" | "operator", queueId: string) => void;
}

export function LandingView({ onNavigate }: LandingViewProps) {
  useTheme();

  return (
    <div className="landing-view">
      <div className="landing-hero">
        <div className="hero-content">
          <h1 className="hero-title">QueueLess</h1>
          <p className="hero-subtitle">
            Digital queue management for campus services, clinics, and small businesses.
          </p>
          <p className="hero-description">
            Join queues from your phone, watch your position in real-time, and get notified
            when it's your turn. No more standing in lines.
          </p>

          <div className="hero-actions">
            <button className="btn-primary" onClick={() => onNavigate("student", "demo")}>
              Join as Student
            </button>
            <button className="btn-secondary" onClick={() => onNavigate("operator", "demo")}>
              Open Operator Dashboard
            </button>
          </div>

          <div className="hero-links">
            <p>Or use direct links:</p>
            <div className="hero-links-row">
              <a href="#/student/demo" className="link">Student view (demo)</a>
              <span className="separator">•</span>
              <a href="#/operator/demo" className="link">Operator view (demo)</a>
            </div>
          </div>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <h3>Mobile First</h3>
          <p>Join queues from any device. No app download required.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Real-time Updates</h3>
          <p>Live position tracking with instant status updates.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Privacy First</h3>
          <p>Anonymous tickets. No personal data required to join.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Simple Analytics</h3>
          <p>Basic queue statistics for operators.</p>
        </div>
      </div>

      <div className="tech-stack">
        <h3>Built with</h3>
        <div className="tech-logos">
          <span>Cloudflare Workers</span>
          <span>•</span>
          <span>Hono</span>
          <span>•</span>
          <span>Durable Objects</span>
          <span>•</span>
          <span>D1</span>
          <span>•</span>
          <span>SSE</span>
          <span>•</span>
          <span>React</span>
          <span>•</span>
          <span>Vite</span>
        </div>
      </div>
    </div>
  );
}
