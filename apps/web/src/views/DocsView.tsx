import { IconBook, IconGear, IconInfo } from "../components/Icons";
import { CommandBlock, CopyButton } from "../components/SelectMenu";
import { getApiBase } from "../lib/api";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="docs-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function GuidePage() {
  return (
    <div className="docs-view">
      <div className="docs-hero">
        <IconBook size={28} />
        <h1>Guide</h1>
      </div>

      <Section title="For customers">
        <ol>
          <li>Open the queue link or QR for the service point.</li>
          <li>
            Tap <strong>Join queue</strong> — you get an anonymous ticket number.
          </li>
          <li>Watch your position and the number being served.</li>
          <li>
            When your number is called, a dialog will appear — head to the counter.
          </li>
          <li>
            If plans change, tap <strong>Leave queue</strong> before you&apos;re called.
          </li>
        </ol>
      </Section>

      <Section title="For operators">
        <ol>
          <li>
            Open <code>/operator/{"{queue}"}</code> and sign in with the operator PIN.
          </li>
          <li>
            Set <strong>Max waiting</strong> if you need a capacity cap.
          </li>
          <li>Use <strong>Call next</strong> to serve the next customer.</li>
          <li>Skip or remove no-shows; <strong>Reset</strong> clears the whole queue.</li>
          <li>Waiting rows show country, city, and browser hints when available.</li>
        </ol>
      </Section>

      <Section title="Queue links">
        <p>
          Each service point uses its own queue id in the URL — for example{" "}
          <code>/student/library</code> or <code>/operator/reception</code>. Create links
          with any short id your staff will remember.
        </p>
      </Section>

      <Section title="Tickets &amp; reload">
        <p>
          Each browser stores a private device id. If you join a queue and reload, your
          ticket is restored. The same device cannot join the same queue twice while a
          ticket is active.
        </p>
      </Section>

      <Section title="CORS — why the backend might not work from this site">
        <p>
          Browsers enforce a <strong>Cross-Origin Resource Sharing (CORS)</strong>{" "}
          policy. When a website (origin) makes a request to a backend on a{" "}
          <em>different</em> domain, the browser checks whether that backend explicitly
          allows this website&apos;s domain.
        </p>
        <p>
          <strong>What this means in practice:</strong>
        </p>
        <ul>
          <li>
            The Worker must list this site&apos;s origin in{" "}
            <code>ALLOWED_ORIGINS</code> (in <code>apps/worker/wrangler.jsonc</code>{" "}
            <code>vars</code>, or via a Worker secret).
          </li>
          <li>
            If the backend is not allowed, the browser blocks the response entirely.
            The request may fail with a generic <em>Failed to fetch</em> / network
            error — you won&apos;t see a normal HTTP status.
          </li>
          <li>
            Local dev defaults to <code>http://localhost:5173</code> →{" "}
            <code>http://localhost:8787</code>. When you deploy the SPA elsewhere, add
            that Pages URL to the Worker&apos;s allow-list.
          </li>
        </ul>
        <p>
          <strong>API base URL used by this app:</strong>{" "}
          <code className="docs-api-base">{getApiBase()}</code>
        </p>
        <p>
          If calls fail, compare that URL with your Worker deployment, and confirm the
          Worker&apos;s <code>ALLOWED_ORIGINS</code> includes this site&apos;s origin.
          See <a href="/docs/development">Development</a> for how to set these values.
        </p>
      </Section>
    </div>
  );
}

function DevelopmentPage() {
  return (
    <div className="docs-view">
      <div className="docs-hero">
        <IconGear size={28} />
        <h1>Development</h1>
      </div>

      <Section title="Stack">
        <ul>
          <li>
            <strong>Web:</strong> React + Vite SPA, PWA
          </li>
          <li>
            <strong>API:</strong> Cloudflare Workers + Hono
          </li>
          <li>
            <strong>Live queue:</strong> Durable Object per <code>queueId</code>
          </li>
          <li>
            <strong>Updates:</strong> Server-Sent Events (SSE)
          </li>
          <li>
            <strong>Auth:</strong> Operator PIN → signed session (Bearer + cookie)
          </li>
          <li>
            <strong>State:</strong> Durable Objects only — no D1 / no external database
          </li>
        </ul>
      </Section>

      <Section title="How the system works">
        <ol>
          <li>Browser calls the Worker over HTTPS.</li>
          <li>
            Queue mutations are serialized in one Durable Object per queue id.
          </li>
          <li>The DO broadcasts SSE events to waiting browsers and operators.</li>
          <li>
            Join metadata (UA, CF country/city, hashed IP) is stored on the ticket.
          </li>
        </ol>
      </Section>

      <Section title="Environment configuration">
        <p>
          Each app reads its config from env — no hardcoded hosts in source.
        </p>
        <p>
          <strong>Web SPA</strong> (<code>apps/web</code>):
        </p>
        <ul>
          <li>
            <code>VITE_API_URL</code> — Worker base URL (default{" "}
            <code>http://localhost:8787</code> for local wrangler dev).
          </li>
          <li>
            Copy <code>apps/web/.env.example</code> → <code>.env</code> or{" "}
            <code>.env.production</code> and set the real Worker URL before deploy.
          </li>
        </ul>
        <p>
          <strong>Worker</strong> (<code>apps/worker</code>):
        </p>
        <ul>
          <li>
            <code>ALLOWED_ORIGINS</code> — comma-separated origins allowed by CORS
            (in <code>wrangler.jsonc</code> <code>vars</code>).
          </li>
          <li>
            <code>ENVIRONMENT</code> — e.g. <code>development</code> /{" "}
            <code>production</code>.
          </li>
          <li>
            Secrets (not in wrangler.jsonc): copy{" "}
            <code>.dev.vars.example</code> → <code>.dev.vars</code> for local, or{" "}
            <code>wrangler secret put OPERATOR_PIN</code> for production.
          </li>
        </ul>
      </Section>

      <Section title="Deploy from GitHub">
        <p>
          Repo:{" "}
          <a href="https://github.com/zamdevio/queueless" target="_blank" rel="noreferrer">
            github.com/zamdevio/queueless
          </a>
        </p>
        <p>
          <strong>Free Cloudflare tier only.</strong> No D1, R2, KV, or external database.
          Resources: <strong>Workers</strong> (API + Durable Objects) +{" "}
          <strong>Pages</strong> (SPA) + one secret <code>OPERATOR_PIN</code>.
        </p>

        <h3>1. Setup (from git to ready repo)</h3>
        <CommandBlock
          title="Clone & install"
          code={`git clone https://github.com/zamdevio/queueless.git
cd queueless
pnpm install

# Web API base (local default is localhost:8787)
cp apps/web/.env.example apps/web/.env
# edit apps/web/.env → VITE_API_URL=http://localhost:8787

# Operator PIN for local wrangler dev
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# nano apps/worker/.dev.vars → OPERATOR_PIN=your-pin`}
        />

        <h3>2. Local run</h3>
        <CommandBlock
          code={`pnpm worker:dev    # API :8787
pnpm web:dev       # SPA :5173`}
        />

        <h3>3. Remote deploy (production)</h3>
        <p>Ensure these configs first, then run the commands:</p>
        <ul>
          <li>
            <code>apps/web/.env.production</code> →{" "}
            <code>VITE_API_URL=https://YOUR-WORKER.workers.dev</code>
          </li>
          <li>
            <code>apps/worker/wrangler.jsonc</code> →{" "}
            <code>ALLOWED_ORIGINS</code> includes your Pages URL
          </li>
          <li>
            <code>wrangler login</code> (or{" "}
            <code>CLOUDFLARE_API_TOKEN</code>) on the free account
          </li>
        </ul>
        <CommandBlock
          code={`cd apps/worker && wrangler secret put OPERATOR_PIN   # prod PIN
cd ../.. && pnpm worker:deploy
pnpm web:deploy
# redeploy worker if ALLOWED_ORIGINS changed`}
        />

        <h3>4. Agent deploy prompt</h3>
        <p>Copy this into an agent that has the repo + wrangler access:</p>
        <CopyButton
          label="Copy agent prompt"
          text={`Deploy QueueLess from github.com/zamdevio/queueless on a free Cloudflare account.

Steps:
1. git clone https://github.com/zamdevio/queueless.git && cd queueless && pnpm install
2. wrangler login
3. From apps/worker: wrangler secret put OPERATOR_PIN  (set a strong PIN)
4. Set apps/web/.env.production VITE_API_URL to the Worker URL (deploy worker first to learn it)
5. Ensure apps/worker/wrangler.jsonc ALLOWED_ORIGINS includes the Pages origin (https://YOUR-PAGES.pages.dev and any *.thequeueless.pages.dev subdomain if using that project)
6. pnpm worker:deploy  → Worker + QueueDO + RateLimitDO (no D1)
7. Set VITE_API_URL=https://YOUR-WORKER.workers.dev in apps/web/.env.production
8. pnpm web:deploy  → Pages SPA
9. If ALLOWED_ORIGINS was wrong, update wrangler.jsonc and pnpm worker:deploy again
10. Smoke test: /student/main join + /operator/main PIN login + call next

Notes:
- Free tier only: Workers + Pages + Durable Objects + one secret. No D1/KV/R2.
- Do not commit .dev.vars or real PINs.`}
        />
      </Section>

      <Section title="Project phases (how QueueLess was built)">
        <p>Each phase was a focused slice in the course project.</p>
        <ol>
          <li>
            <strong>Initiation — Scaffold &amp; docs:</strong> pnpm workspace, docs
            split (course vs product), maintainer control plane, Durable Objects
            wired, health gates (typecheck/test/build).
          </li>
          <li>
            <strong>Planning — Architecture:</strong> locked decisions (DO per queue,
            SSE + HTTP, PIN auth, <code>queueId</code> URLs, capacity limits, ticket
            meta). Focus max-3 discipline in <code>maintainer/phases/focus.md</code>.
          </li>
          <li>
            <strong>Design &amp; Development — Queue core:</strong>{" "}
            <code>QueueDO</code> (join/call-next/skip/remove/reset/settings), SSE board,
            Hono routes, CORS from config, operator PIN auth with rate limit + signed
            session, ticket meta (UA / CF country / hashed IP), sonner toasts, call
            dialog, Docs pages, PWA (install / installed / open).
          </li>
          <li>
            <strong>Testing &amp; Assurance:</strong> Vitest for worker routes, typecheck
            + build + knip gates, manual E2E (customer join → operator call-next →
            dialog).
          </li>
          <li>
            <strong>Deployment:</strong> Worker + Durable Objects on Cloudflare
            (free tier), Pages for the SPA, secrets via{" "}
            <code>wrangler secret put</code>, CORS allow-list per environment.
          </li>
          <li>
            <strong>Operations &amp; Improvement:</strong> course Management Pack
            (charter, backlog, risks, milestones), README + in-app docs for strangers
            to redeploy, iterative UX and auth fixes.
          </li>
        </ol>
      </Section>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="docs-view">
      <div className="docs-hero">
        <IconInfo size={28} />
        <h1>About QueueLess</h1>
      </div>

      <p>
        QueueLess is a lightweight digital queue for campus services, clinics, and small
        businesses. Customers join from a phone, watch their place in line, and get
        called when it&apos;s their turn — staff run a simple operator dashboard.
      </p>

      <Section title="Design goals">
        <ul>
          <li>Anonymous customer tickets by default</li>
          <li>Real-time queue state that survives concurrent joins</li>
          <li>Low operational complexity — free-tier Cloudflare path</li>
          <li>Small, understandable codebase for course + portfolio use</li>
        </ul>
      </Section>

      <Section title="Stack highlights">
        <ul>
          <li>Cloudflare Workers + Hono API</li>
          <li>Durable Object for live queue coordination</li>
          <li>React + Vite SPA, PWA installable</li>
          <li>SSE for live board updates; HTTP for mutations</li>
        </ul>
      </Section>

      <Section title="Project">
        <p>
          Built for a Software Management course idea, then developed as a real usable
          system on Cloudflare Workers, Durable Objects, and a React SPA.
        </p>
        <p>
          Source:{" "}
          <a
            href="https://github.com/zamdevio/queueless"
            target="_blank"
            rel="noreferrer"
          >
            github.com/zamdevio/queueless
          </a>
        </p>
      </Section>
    </div>
  );
}

export function DocsView({
  page,
}: {
  page: "guide" | "development" | "about";
}) {
  if (page === "guide") return <GuidePage />;
  if (page === "development") return <DevelopmentPage />;
  return <AboutPage />;
}
