import { RaphaError } from './rapha.js';

/**
 * Phase 7C-2 server-side SSE bridge core.
 *
 * Consumes RAPHA's incremental (`since`) telemetry/alerts service-read APIs and
 * emits sanitized SSE events to the authenticated browser. ALL state here is
 * LOCAL to a single connection (no module-level/global registries) so the
 * design is correct under multi-replica EmmaTech. Durable state lives in
 * RAPHA's PostgreSQL-backed APIs; this bridge only holds per-connection cursors
 * and a bounded dedup set.
 */

/** Minimal streaming sink (Vercel Node res satisfies this). */
export interface SseSink {
  write(chunk: string): unknown;
}

export interface StreamDeps {
  /** Fetch telemetry at/after `since` (undefined = initial bounded fetch). */
  fetchTelemetry: (
    since: number | undefined,
    signal: AbortSignal,
  ) => Promise<{ telemetry: unknown[]; next_since?: number }>;
  fetchAlerts: (
    since: number | undefined,
    signal: AbortSignal,
  ) => Promise<{ alerts: unknown[]; next_since?: number }>;
  intervalMs: number;
  maxCycles: number;
  signal: AbortSignal;
  /** Injectable for tests; defaults to an abort-aware setTimeout. */
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
}

/** Insertion-ordered bounded set — caps memory (no unbounded accumulation). */
class BoundedSet {
  private map = new Map<string, true>();
  constructor(private readonly cap: number) {}
  has(k: string): boolean {
    return this.map.has(k);
  }
  add(k: string): void {
    if (this.map.has(k)) return;
    this.map.set(k, true);
    if (this.map.size > this.cap) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }
}

function sseEvent(sink: SseSink, event: string, data: unknown): void {
  sink.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
function sseComment(sink: SseSink, text: string): void {
  sink.write(`: ${text}\n\n`);
}

/** Whitelisted, customer-safe telemetry event (never tenant_id/secrets). */
function sanitizeTelemetry(row: unknown): Record<string, unknown> | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  if (typeof r.sensor_id !== 'string') return null;
  return {
    type: 'telemetry.update',
    sensor_id: r.sensor_id,
    last_event_at: r.last_event_at ?? null,
    last_category: r.last_category ?? null,
    last_score: r.last_score ?? null,
    last_label: r.last_label ?? null,
    last_is_threat: Boolean(r.last_is_threat),
    last_confidence: r.last_confidence ?? null,
    packets_per_sec: r.packets_per_sec ?? null,
    model_version: r.model_version ?? null,
    updated_at: r.updated_at ?? null,
  };
}

/** Whitelisted, customer-safe alert event. Note: RAPHA's `text` (which may embed
 *  tenant_id) and `tenant_id`/`delivered` are intentionally NOT forwarded. */
function sanitizeAlert(row: unknown): Record<string, unknown> | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const id = r.id ?? r.alert_id;
  if (id === undefined || id === null) return null;
  return {
    type: 'alert.created',
    alert_id: id,
    ts: r.ts ?? null,
    category: r.category ?? null,
    score: r.score ?? null,
    confidence: r.confidence ?? null,
    action: r.action ?? null,
    event_ref: r.event_ref ?? null,
    model_version: r.model_version ?? null,
  };
}

function streamErrorCode(e: unknown): string {
  if (e instanceof RaphaError) {
    if (e.kind === 'not_found') return 'TENANT_NOT_READY';
    if (e.kind === 'rate_limited') return 'RATE_LIMITED';
  }
  return 'RAPHA_UNAVAILABLE';
}

const defaultSleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise<void>((resolve) => {
    if (signal.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });

/**
 * Run the bounded SSE polling bridge. Writes an initial `connected` event, then
 * up to `maxCycles` bounded cycles; each cycle fetches incremental telemetry +
 * alerts, deduplicates boundary duplicates, emits sanitized events, advances the
 * per-connection cursors ONLY on success, emits a heartbeat, and sleeps. On
 * upstream failure it emits a sanitized `stream.error`, does NOT advance the
 * cursor, and backs off (bounded). Returns when aborted or maxCycles reached.
 */
export async function runConsoleStream(sink: SseSink, deps: StreamDeps): Promise<void> {
  const sleep = deps.sleep ?? defaultSleep;
  sink.write('retry: 10000\n\n');
  sseEvent(sink, 'connected', { type: 'connected' });

  const seenTelemetry = new BoundedSet(4000);
  const seenAlerts = new BoundedSet(4000);
  let telemetryCursor: number | undefined;
  let alertCursor: number | undefined;
  let backoff = deps.intervalMs;

  for (let cycle = 0; cycle < deps.maxCycles; cycle++) {
    if (deps.signal.aborted) break;
    let ok = true;
    try {
      const [t, a] = await Promise.all([
        deps.fetchTelemetry(telemetryCursor, deps.signal),
        deps.fetchAlerts(alertCursor, deps.signal),
      ]);

      for (const row of t.telemetry) {
        const ev = sanitizeTelemetry(row);
        if (!ev) continue;
        const key = `${ev.sensor_id}|${ev.updated_at}`;
        if (seenTelemetry.has(key)) continue; // boundary duplicate
        seenTelemetry.add(key);
        sseEvent(sink, 'telemetry.update', ev);
      }
      for (const row of a.alerts) {
        const ev = sanitizeAlert(row);
        if (!ev) continue;
        const key = String(ev.alert_id);
        if (seenAlerts.has(key)) continue; // boundary duplicate
        seenAlerts.add(key);
        sseEvent(sink, 'alert.created', ev);
      }

      // Advance cursors ONLY after successful processing.
      if (typeof t.next_since === 'number') telemetryCursor = t.next_since;
      if (typeof a.next_since === 'number') alertCursor = a.next_since;
      backoff = deps.intervalMs;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') break;
      ok = false;
      sseEvent(sink, 'stream.error', {
        code: streamErrorCode(e),
        message: 'Live RAPHA updates are temporarily unavailable.',
      });
      // Cursors deliberately NOT advanced on failure.
    }

    sseComment(sink, `hb ${Date.now()}`);

    if (deps.signal.aborted) break;
    if (cycle < deps.maxCycles - 1) {
      const wait = ok ? deps.intervalMs : Math.min(backoff * 2, deps.intervalMs * 5);
      if (!ok) backoff = wait;
      await sleep(wait, deps.signal);
    }
  }
}
