import { useEffect, useRef, useState } from 'react';
import {
  fetchConsoleAlerts,
  fetchConsoleTelemetry,
  type AlertRow,
  type TelemetryRow,
} from '../../auth/consoleClient';
import { usePolling } from './usePolling';
import { useConsoleStream, type StreamStatus } from './useConsoleStream';

/**
 * Phase 7C-2 unified live data for the Telemetry + Alerts console sections.
 *
 * - Opens ONE SSE stream (`useConsoleStream`) that feeds telemetry/alerts.
 * - Runs the existing bounded polling as a FALLBACK, enabled ONLY when the
 *   stream is not `live` — so SSE and polling are never active simultaneously.
 * - Merges both sources into per-connection local state (telemetry keyed by
 *   sensor_id; alerts deduped by id, newest-first, capped — no unbounded growth).
 */

const ALERT_CAP = 200;
const POLL_MS = 20_000;

function alertId(a: AlertRow): string | undefined {
  const id = a.alert_id ?? a.id;
  return id === undefined || id === null ? undefined : String(id);
}

export interface ConsoleLiveData {
  status: StreamStatus;
  telemetry: TelemetryRow[];
  alerts: AlertRow[];
  loading: boolean;
  error: string | null;
}

export function useConsoleLiveData(options: { enabled?: boolean } = {}): ConsoleLiveData {
  const enabled = options.enabled !== false;
  const [telemetryMap, setTelemetryMap] = useState<Map<string, TelemetryRow>>(new Map());
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const mergeTelemetry = useRef((row: TelemetryRow) => {
    if (!row.sensor_id) return;
    setTelemetryMap((prev) => {
      const next = new Map(prev);
      next.set(row.sensor_id, { ...next.get(row.sensor_id), ...row });
      return next;
    });
    setHasLoaded(true);
  });
  const mergeAlert = useRef((row: AlertRow) => {
    const id = alertId(row);
    setAlerts((prev) => {
      if (id !== undefined && prev.some((a) => alertId(a) === id)) return prev;
      return [row, ...prev].slice(0, ALERT_CAP);
    });
    setHasLoaded(true);
  });

  const { status } = useConsoleStream(
    {
      onTelemetry: (r) => mergeTelemetry.current(r),
      onAlert: (r) => mergeAlert.current(r),
    },
    { enabled },
  );

  const live = status === 'live';
  const pollEnabled = enabled && !live;

  const tp = usePolling(
    (signal) => fetchConsoleTelemetry({ limit: 100 }, signal),
    POLL_MS,
    { enabled: pollEnabled },
  );
  const ap = usePolling((signal) => fetchConsoleAlerts({ limit: 100 }, signal), POLL_MS, {
    enabled: pollEnabled,
  });

  // Merge fallback polling snapshots into the same local state.
  useEffect(() => {
    if (tp.data?.telemetry) {
      setTelemetryMap((prev) => {
        const next = new Map(prev);
        for (const row of tp.data!.telemetry) if (row.sensor_id) next.set(row.sensor_id, row);
        return next;
      });
      setHasLoaded(true);
    }
  }, [tp.data]);

  useEffect(() => {
    if (ap.data?.alerts) {
      setAlerts((prev) => {
        const seen = new Set(prev.map((a) => alertId(a)).filter(Boolean) as string[]);
        const merged = [...prev];
        for (const row of ap.data!.alerts) {
          const id = alertId(row);
          if (id !== undefined && seen.has(id)) continue;
          if (id !== undefined) seen.add(id);
          merged.unshift(row);
        }
        return merged.slice(0, ALERT_CAP);
      });
      setHasLoaded(true);
    }
  }, [ap.data]);

  const telemetry = Array.from(telemetryMap.values());
  const pollingErrored = pollEnabled && (tp.state === 'error' || ap.state === 'error');
  const loading = enabled && !hasLoaded && !pollingErrored && (status === 'connecting' || tp.state === 'loading');
  const error = !hasLoaded && pollingErrored ? tp.error ?? ap.error ?? 'Unable to load data' : null;

  return { status, telemetry, alerts, loading, error };
}
