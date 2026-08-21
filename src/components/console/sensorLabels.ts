import type { SensorRow } from '../../auth/consoleClient';

/**
 * Build a `sensor_id → hostname` lookup from the existing Sensors API rows.
 * No new endpoint: reuses the data already served by `/api/console/sensors`.
 * Only rows that have BOTH a sensor_id and a non-empty hostname are indexed.
 */
export function buildSensorHostnameMap(
  sensors: SensorRow[] | null | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const s of sensors ?? []) {
    if (s?.sensor_id && s.hostname) map.set(s.sensor_id, s.hostname);
  }
  return map;
}

/** Display label for a sensor reference (telemetry card or forensic record). */
export interface SensorLabel {
  /** Resolved hostname when the sensor_id is known, else null. */
  hostname: string | null;
  /** The raw sensor_id, or null when the record carries no sensor attribution. */
  id: string | null;
  /** True for historical/unattributed records (no/blank sensor_id). */
  unattributed: boolean;
}

/**
 * Resolve a (possibly null/absent) sensor_id to a display label:
 *   - known sensor_id   → { hostname, id }
 *   - unknown sensor_id → { hostname: null, id }  (caller falls back to raw id)
 *   - null/missing      → { hostname: null, id: null, unattributed: true }
 * Never fabricates a sensor for unattributed records.
 */
export function resolveSensorLabel(
  sensorId: string | null | undefined,
  hostnames: Map<string, string>,
): SensorLabel {
  const id =
    sensorId === null || sensorId === undefined || String(sensorId).trim() === ''
      ? null
      : String(sensorId);
  if (id === null) return { hostname: null, id: null, unattributed: true };
  return { hostname: hostnames.get(id) ?? null, id, unattributed: false };
}
