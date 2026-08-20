/**
 * Console API client (Phase 7A) — minimal.
 *
 * Organization/tenant context comes from the existing AuthContext (`/api/me`)
 * and is NOT re-fetched here. This client only wraps the existing public,
 * server-side RAPHA health proxy (`/api/rapha/status`). It creates NO new
 * backend routes and never talks to RAPHA directly (the browser only calls the
 * EmmaTech same-origin proxy). Phase 7B will add `/api/console/*` proxies once
 * the RAPHA service-scoped customer read APIs exist.
 */

/** Sanitized shape returned by GET /api/rapha/status (see api/rapha/status.ts). */
export interface RaphaStatus {
  status: 'operational' | 'down';
  healthy: boolean;
  checkedAt: string;
}

/**
 * Fetch the sanitized RAPHA health status from EmmaTech's own proxy.
 * Throws on transport failure so the caller can distinguish an *error*
 * (proxy unreachable) from a *down* RAPHA (proxy returns healthy:false).
 */
export async function fetchRaphaStatus(): Promise<RaphaStatus> {
  const res = await fetch('/api/rapha/status', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`status request failed (${res.status})`);
  }
  return (await res.json()) as RaphaStatus;
}

// ── Phase 7B-2: console data (via EmmaTech server-side proxies) ───────────────
//
// The browser calls ONLY the same-origin EmmaTech `/api/console/*` endpoints.
// It never calls RAPHA directly, never sends a tenant_id (the server derives it
// from the session), and never sees the RAPHA service token. Row types below
// document the fields RAPHA returns and are intentionally defensive (optional)
// so the view never fabricates or drops a legitimate field.

export class ConsoleApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ConsoleApiError';
    this.status = status;
  }
}

export interface SensorRow {
  sensor_id: string;
  tenant_id: string;
  hostname?: string;
  status?: string;
  last_seen?: number | string | null;
}

/**
 * Authoritative sensor LIVENESS window.
 *
 * The RAPHA agent reports on a ~60s heartbeat/ingest interval (installer
 * `--interval 60` / agent `ingest_interval_seconds: 60`). A sensor is ONLINE
 * only if its `last_seen` is within ~3 missed heartbeats (180s), which tolerates
 * normal jitter / a single retry without reporting a stopped agent as online.
 * Derived from the existing interval — not an arbitrary value.
 */
export const SENSOR_ONLINE_WINDOW_MS = 3 * 60 * 1000;

/** Normalize a RAPHA `last_seen` (ISO string, epoch seconds, or epoch ms) to
 *  epoch milliseconds; returns null for missing/invalid values. */
function sensorLastSeenMs(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const isNumeric = typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value).trim());
  if (isNumeric) {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n < 1e12 ? n * 1000 : n; // epoch seconds → ms
  }
  const t = Date.parse(String(value));
  return Number.isNaN(t) ? null : t;
}

/**
 * AUTHORITATIVE sensor liveness: ONLINE iff `last_seen` is fresh (within
 * SENSOR_ONLINE_WINDOW_MS of `now`). Missing / invalid / stale `last_seen` →
 * OFFLINE. The persisted registration `status` is intentionally IGNORED for
 * liveness — it does not go stale when the agent stops, which previously caused
 * every registered sensor to display as ONLINE. This does NOT remove the sensor
 * record; the Sensors page still lists offline sensors.
 */
export function isSensorOnline(
  sensor: Pick<SensorRow, 'last_seen'> | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!sensor) return false;
  const ms = sensorLastSeenMs(sensor.last_seen);
  return ms !== null && now - ms <= SENSOR_ONLINE_WINDOW_MS && now - ms >= -SENSOR_ONLINE_WINDOW_MS;
}

export interface TelemetryRow {
  sensor_id: string;
  tenant_id: string;
  last_event_at?: number;
  last_category?: string | null;
  last_score?: number;
  last_label?: number;
  last_is_threat?: boolean;
  last_confidence?: string | null;
  packets_per_sec?: number | null;
  model_version?: string | null;
  updated_at?: number;
}

export interface AlertRow {
  id?: string;
  /** Present on SSE `alert.created` events (Phase 7C-2). */
  alert_id?: string | number;
  ts?: number;
  category?: string;
  score?: number;
  confidence?: string;
  label?: number;
  action?: string;
  event_ref?: string;
  model_version?: string;
  text?: string;
  delivered?: number | boolean;
}

export interface ForensicRow {
  idx?: number;
  timestamp?: number | string;
  tenant_id?: string;
  orchestrator_id?: string;
  policy_version?: string;
  model_version?: string;
  event?: unknown;
  previous_hash?: string;
  hash?: string;
}

async function getConsoleJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { method: 'GET', headers: { Accept: 'application/json' }, signal });
  if (!res.ok) {
    let message = 'Request failed';
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* non-JSON error body — keep generic message */
    }
    throw new ConsoleApiError(res.status, message);
  }
  return (await res.json()) as T;
}

/** GET /api/console/telemetry — tenant derived server-side (no tenant_id arg). */
export async function fetchConsoleTelemetry(
  opts: { limit?: number } = {},
  signal?: AbortSignal,
): Promise<{ tenant_id: string; telemetry: TelemetryRow[] }> {
  const qs = typeof opts.limit === 'number' ? `?limit=${encodeURIComponent(opts.limit)}` : '';
  return getConsoleJson(`/api/console/telemetry${qs}`, signal);
}

/** GET /api/console/alerts — tenant derived server-side (no tenant_id arg). */
export async function fetchConsoleAlerts(
  opts: { limit?: number } = {},
  signal?: AbortSignal,
): Promise<{ tenant_id: string; alerts: AlertRow[] }> {
  const qs = typeof opts.limit === 'number' ? `?limit=${encodeURIComponent(opts.limit)}` : '';
  return getConsoleJson(`/api/console/alerts${qs}`, signal);
}

/** GET /api/console/sensors — tenant derived server-side (no tenant_id arg). */
export async function fetchConsoleSensors(
  signal?: AbortSignal,
): Promise<{ tenant_id: string; sensors: SensorRow[] }> {
  return getConsoleJson('/api/console/sensors', signal);
}

/** GET /api/console/forensics — tenant derived server-side (no tenant_id arg). */
export async function fetchConsoleForensics(
  opts: { limit?: number; offset?: number } = {},
  signal?: AbortSignal,
): Promise<{ tenant_id: string; forensics: ForensicRow[] }> {
  const params = new URLSearchParams();
  if (typeof opts.limit === 'number') params.set('limit', String(opts.limit));
  if (typeof opts.offset === 'number') params.set('offset', String(opts.offset));
  const qs = params.toString();
  return getConsoleJson(`/api/console/forensics${qs ? `?${qs}` : ''}`, signal);
}
