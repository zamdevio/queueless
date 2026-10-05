# Web

Surface: `apps/web` (`@queueless/web`).

- React + Vite SPA; default queue **`main`**
- Views: landing · customer · operator (PIN) · docs (guide/development/about)
- Realtime: SSE + sonner toasts; **call dialog** when ticket is called
- Theme: `[data-theme]` dark/light; PWA via manifest + SW
- API base: `VITE_API_URL` or `https://queueless.zamdevio.workers.dev`

## Routes

| Path | View |
|------|------|
| `/` | Landing |
| `/student/:queueId` | Customer |
| `/operator/:queueId` | Operator |
| `/docs/guide` \| `development` \| `about` | In-app docs |

Sidebar: Queue links · Docs · Add-ons (Install / Installed).
