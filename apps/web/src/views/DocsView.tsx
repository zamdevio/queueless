export function DocsView({
  page,
}: {
  page: "guide" | "development" | "about";
}) {
  if (page === "guide") {
    return (
      <div className="docs-view">
        <h1>Guide</h1>
        <section>
          <h2>For customers</h2>
          <ol>
            <li>Open the queue link or QR for the service point.</li>
            <li>Tap <strong>Join queue</strong> — you get an anonymous ticket number.</li>
            <li>Watch your position and the number being served.</li>
            <li>When your number is called, a dialog will appear — head to the counter.</li>
            <li>If plans change, tap <strong>Leave queue</strong> before you&apos;re called.</li>
          </ol>
        </section>
        <section>
          <h2>For operators</h2>
          <ol>
            <li>Open <code>/operator/{"{queue}"}</code> and sign in with the operator PIN.</li>
            <li>Set <strong>Max waiting</strong> if you need a capacity cap.</li>
            <li>Use <strong>Call next</strong> to serve the next customer.</li>
            <li>Skip or remove no-shows; <strong>Reset</strong> clears the whole queue.</li>
            <li>Waiting rows show country, city, and browser hints when available.</li>
          </ol>
        </section>
        <section>
          <h2>Queue links</h2>
          <p>
            Each service point uses its own queue id in the URL — for example{" "}
            <code>/student/library</code> or <code>/operator/reception</code>. Create links
            with any short id your staff will remember.
          </p>
        </section>
      </div>
    );
  }

  if (page === "development") {
    return (
      <div className="docs-view">
        <h1>Development</h1>
        <section>
          <h2>Stack</h2>
          <ul>
            <li><strong>Web:</strong> React + Vite SPA</li>
            <li><strong>API:</strong> Cloudflare Workers + Hono</li>
            <li><strong>Live queue:</strong> Durable Object per <code>queueId</code></li>
            <li><strong>Updates:</strong> Server-Sent Events (SSE)</li>
            <li><strong>Auth:</strong> Operator PIN → signed HttpOnly cookie</li>
            <li><strong>DB:</strong> D1 binding (available; queue state lives in the DO)</li>
          </ul>
        </section>
        <section>
          <h2>How the system works</h2>
          <ol>
            <li>Browser calls the Worker over HTTPS.</li>
            <li>Queue mutations (join, call-next, …) are serialized in one Durable Object per queue id.</li>
            <li>The DO broadcasts SSE events to waiting browsers and operator dashboards.</li>
            <li>Join metadata (UA, CF country/city, hashed IP) is stored on the ticket for the operator view.</li>
          </ol>
        </section>
        <section>
          <h2>Deploy from GitHub</h2>
          <ol>
            <li>Fork or clone this repository.</li>
            <li><code>pnpm install</code> at the repo root.</li>
            <li>Create resources: <code>wrangler d1 create queueless</code>, then set <code>database_id</code> in <code>apps/worker/wrangler.jsonc</code>.</li>
            <li><code>wrangler secret put OPERATOR_PIN</code> from <code>apps/worker</code>.</li>
            <li>Deploy: <code>pnpm worker:deploy</code> then <code>pnpm web:deploy</code>.</li>
            <li>Point Pages project name in <code>apps/web/package.json</code> at your own project.</li>
          </ol>
        </section>
        <section>
          <h2>Local development</h2>
          <pre>{`pnpm install
pnpm worker:dev    # API on :8787
pnpm web:dev       # SPA on :5173
# apps/worker/.dev.vars → OPERATOR_PIN=...`}</pre>
        </section>
      </div>
    );
  }

  return (
    <div className="docs-view">
      <h1>About QueueLess</h1>
      <p>
        QueueLess is a lightweight digital queue for campus services, clinics, and small
        businesses. Customers join from a phone, watch their place in line, and get called
        when it&apos;s their turn — staff run a simple operator dashboard.
      </p>
      <section>
        <h2>Design goals</h2>
        <ul>
          <li>Anonymous customer tickets by default</li>
          <li>Real-time queue state that survives concurrent joins</li>
          <li>Low operational complexity — free-tier Cloudflare path</li>
          <li>Small, understandable codebase for course + portfolio use</li>
        </ul>
      </section>
      <section>
        <h2>Project</h2>
        <p>
          Built for a Software Management course idea, then developed as a real usable
          system on Cloudflare Workers, Durable Objects, and a React SPA.
        </p>
      </section>
    </div>
  );
}
