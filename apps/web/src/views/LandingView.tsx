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
            Join from your phone, watch your position in real time, and get called when it&apos;s
            your turn. Staff run a simple operator dashboard.
          </p>

          <div className="hero-actions">
            <button className="btn-primary" onClick={() => onNavigate("student", "main")}>
              Join a queue
            </button>
            <button className="btn-secondary" onClick={() => onNavigate("operator", "main")}>
              Operator dashboard
            </button>
          </div>

          <div className="hero-links">
            <div className="hero-links-row">
              <a href="/docs/guide" className="link">Guide</a>
              <span className="separator">•</span>
              <a href="/docs/development" className="link">Development</a>
              <span className="separator">•</span>
              <a href="/docs/about" className="link">About</a>
            </div>
          </div>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <h3>Mobile first</h3>
          <p>Join queues from any device. No app install required for customers.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Live updates</h3>
          <p>Real-time position and serving number via server push.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Private by default</h3>
          <p>Anonymous customer tickets — no account to join a line.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">️</div>
          <h3>Staff controls</h3>
          <p>PIN-protected operator dashboard with capacity limits.</p>
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
