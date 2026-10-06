# Web

Surface: `apps/web` (`@queueless/web`).

- React + Vite SPA; default queue **`main`**
- API base: **`VITE_API_URL`** from env (default `http://localhost:8787` for local wrangler)
- Icons: inline SVG components (`src/components/Icons.tsx`)
- PWA: Install / Installed / **Open app** (when installed but running in a browser tab)
- In-app docs: Guide (incl. CORS) · Development (deploy + phases) · About

## Env

```bash
# apps/web/.env or .env.production
VITE_API_URL=https://queueless.zamdevio.workers.dev
```

No hardcoded worker hosts in `src/lib/api.ts`.
