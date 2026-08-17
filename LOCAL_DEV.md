# Local development & validation

EmmaTech is a Vite React SPA **plus** Vercel Node serverless functions under `api/`
(identity, RAPHA provisioning/enrollment, and the customer console proxies incl.
the `/api/console/stream` SSE bridge).

## Two runtimes — use the right one

### `npm run dev` (Vite) — SPA only
Serves the front-end at http://localhost:5173. **It does NOT execute the `api/`
serverless functions.** Any request to `/api/*` is handled by Vite's module
pipeline and returns transpiled module source (e.g. a body starting
`import { m...`), which is **not JSON**. Symptoms when using this runtime:

- `GET /api/me` returns non-JSON → the app must treat this as *unauthenticated*
  (see `fetchMe` in `src/auth/authClient.ts`, which now requires a valid `user`).
- `GET /api/console/{telemetry,alerts,sensors,forensics,stream}` return non-JSON →
  the console shows honest error/empty states ("connection problem with RAPHA").

Use `npm run dev` only for pure UI/marketing work.

### `npm run dev:api` (`vercel dev`) — full stack (correct for console/auth)
Runs the `api/` Node functions **and** serves the SPA on a single origin, so the
production architecture is preserved locally:

```
Browser → same-origin /api/console/* → EmmaTech server route
        → session → organization.rapha_tenant_id (server-derived)
        → RaphaServiceClient (X-Service-Token, server-only)
        → RAPHA service-read APIs → sanitized response / SSE → browser
```

Prerequisites (local only — never commit real values):
- Vercel CLI (already available); first run may prompt `vercel link`.
- A local `.env` with the **server-only** vars the code reads
  (`api/_lib/config.ts`): `SESSION_SECRET`, `RAPHA_BASE_URL` (https),
  `RAPHA_SERVICE_TOKEN`, `DATABASE_URL` (+ `RAPHA_API_BASE_URL` for the health
  proxy). These are **not** `VITE_*` and never reach the browser bundle.

## Guardrails (do not change)
- The browser calls **only** same-origin `/api/*` — never RAPHA directly.
- `RAPHA_SERVICE_TOKEN` / `X-Service-Token` / `RAPHA_BASE_URL` / `DATABASE_URL`
  are server-only; no `VITE_`-prefixed secrets.
- Tenant is always derived server-side from the session; the browser never
  supplies a `tenant_id` selector.
