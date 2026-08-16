import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed } from '../_lib/http.js';
import { RaphaServiceClient } from '../_lib/rapha.js';
import { resolveConsoleContext } from '../_lib/console.js';
import { runConsoleStream } from '../_lib/stream.js';

/**
 * GET /api/console/stream  (Phase 7C-2)
 *
 * Authenticated, organization-scoped Server-Sent Events bridge. The browser
 * connects ONLY here (same-origin). The tenant is resolved SERVER-SIDE from the
 * session; a client-supplied tenant_id is ignored. RAPHA is called only from
 * this server code with X-Service-Token (never exposed to the browser), using
 * the incremental (`since`) service-read APIs.
 *
 * The session is intentionally self-bounded (a fixed number of poll cycles):
 * Vercel serverless invocations are duration-limited, so the endpoint recycles
 * and the browser's EventSource reconnects (with the client's bounded backoff),
 * and bounded polling remains the permanent fallback. No global/process state
 * is used — correct under multi-replica.
 *
 * `testOpts` is an optional injection point for tests only; Vercel invokes the
 * handler with (req, res) and never passes it.
 */
const STREAM_INTERVAL_MS = 7000;
const STREAM_MAX_CYCLES = 6; // ~42s upper bound, then the client reconnects
const STREAM_LIMIT = 200; // bounds events per cycle (no unbounded buffers)

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  testOpts?: { intervalMs?: number; maxCycles?: number; sleep?: (ms: number, s: AbortSignal) => Promise<void> },
): Promise<void> {
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
    return;
  }

  // Auth + server-derived tenant (sends 401/404/409/503 and returns null on failure).
  const ctx = await resolveConsoleContext(req, res);
  if (!ctx) return;

  // SSE headers.
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering
  (res as unknown as { flushHeaders?: () => void }).flushHeaders?.();

  // Per-connection abort — stop polling promptly when the client disconnects.
  const controller = new AbortController();
  const onClose = () => controller.abort();
  req.on?.('close', onClose);

  const client = new RaphaServiceClient(ctx.cfg);

  try {
    await runConsoleStream(res, {
      fetchTelemetry: (since) =>
        client.getTenantTelemetry(ctx.tenantId, {
          limit: STREAM_LIMIT,
          ...(since !== undefined ? { since } : {}),
        }),
      fetchAlerts: (since) =>
        client.getTenantAlerts(ctx.tenantId, {
          limit: STREAM_LIMIT,
          ...(since !== undefined ? { since } : {}),
        }),
      intervalMs: testOpts?.intervalMs ?? STREAM_INTERVAL_MS,
      maxCycles: testOpts?.maxCycles ?? STREAM_MAX_CYCLES,
      signal: controller.signal,
      sleep: testOpts?.sleep,
    });
  } catch {
    // Errors are already surfaced as sanitized stream.error events; never leak.
  } finally {
    (req as unknown as { off?: (e: string, cb: () => void) => void }).off?.('close', onClose);
    if (!(res as unknown as { writableEnded?: boolean }).writableEnded) res.end();
  }
}
