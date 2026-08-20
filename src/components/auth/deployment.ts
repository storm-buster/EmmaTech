import type { SensorRow } from '../../auth/consoleClient';
import { isSensorOnline as consoleIsSensorOnline } from '../../auth/consoleClient';

/**
 * Deployment-page pure helpers (unit-testable, no React).
 *
 * Timestamps from RAPHA may arrive as an ISO string OR a numeric epoch in
 * seconds or milliseconds. `toDate` normalizes all of these so we never render
 * the "January 1970" bug (which happened when epoch SECONDS were passed to
 * `new Date(n)`, which expects milliseconds).
 */
function toDate(value: string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const isNumeric = typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value).trim());
  if (isNumeric) {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    const ms = n < 1e12 ? n * 1000 : n; // epoch seconds → ms
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Human-readable local-time expiry, or '' when unknown/invalid (never 1970). */
export function formatExpiry(value: string | number | null | undefined): string {
  const d = toDate(value);
  return d ? d.toLocaleString() : '';
}

/** True when the expiry timestamp is in the past. */
export function isExpired(value: string | number | null | undefined, now: number = Date.now()): boolean {
  const d = toDate(value);
  return d ? d.getTime() <= now : false;
}

function normalizeName(s: unknown): string {
  return (s ?? '').toString().trim().toLowerCase();
}

/**
 * Find the sensor that corresponds to the server the customer just enrolled,
 * matching case-insensitively on hostname or sensor_id.
 */
export function matchEnrolledSensor(sensors: SensorRow[], serverName: string): SensorRow | null {
  const target = normalizeName(serverName);
  if (!target) return null;
  return (
    sensors.find(
      (s) => normalizeName(s.hostname) === target || normalizeName(s.sensor_id) === target,
    ) ?? null
  );
}

/** A sensor is ONLINE when RAPHA marks it active, or it was seen very recently. */
/** A sensor is ONLINE only when its heartbeat (`last_seen`) is fresh — delegates
 *  to the single authoritative determination. The persisted `status` is NOT
 *  trusted for liveness (a stopped agent keeps its registration status). */
export function sensorIsOnline(
  sensor: SensorRow | null | undefined,
  now: number = Date.now(),
): boolean {
  return consoleIsSensorOnline(sensor ?? null, now);
}

export type ConnectionState = 'waiting' | 'connected' | 'online';

/**
 * Derive the post-enrollment connection state for a named server from the
 * current sensor list. A successful enrollment alone is NOT "online":
 *   - no matching sensor yet            → 'waiting' (agent not connected)
 *   - matching sensor, not yet active   → 'connected' (seen, warming up)
 *   - matching sensor, active/recent    → 'online'
 */
export function deriveConnectionState(
  sensors: SensorRow[],
  serverName: string,
  now: number = Date.now(),
): ConnectionState {
  const match = matchEnrolledSensor(sensors, serverName);
  if (!match) return 'waiting';
  return sensorIsOnline(match, now) ? 'online' : 'connected';
}
