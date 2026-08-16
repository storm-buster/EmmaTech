import { useEffect, useRef, useState } from 'react';
import type { AlertRow, TelemetryRow } from '../../auth/consoleClient';

/**
 * Phase 7C-2 browser SSE client. Connects ONLY to the same-origin EmmaTech
 * endpoint `/api/console/stream` (never to RAPHA). It carries no tenant_id and
 * no credentials — the authenticated session cookie establishes identity and
 * the server derives the tenant. On disconnect it reconnects with bounded
 * exponential backoff; after repeated failures it reports `polling` so the
 * caller activates the bounded-polling fallback (never both at once). It closes
 * the EventSource while the tab is hidden and reconnects when visible, and
 * cleans up fully on unmount. No global/process state.
 */

export type StreamStatus = 'connecting' | 'live' | 'reconnecting' | 'polling' | 'offline';

export interface StreamHandlers {
  onTelemetry?: (row: TelemetryRow) => void;
  onAlert?: (row: AlertRow) => void;
}

const STREAM_URL = '/api/console/stream';
const MAX_BACKOFF_MS = 30_000;
const FALLBACK_AFTER_FAILURES = 3;

export function useConsoleStream(
  handlers: StreamHandlers,
  options: { enabled?: boolean } = {},
): { status: StreamStatus } {
  const enabled = options.enabled !== false;
  const [status, setStatus] = useState<StreamStatus>('connecting');
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) {
      setStatus('offline');
      return;
    }
    // No SSE support in this runtime → permanent polling fallback.
    if (typeof EventSource === 'undefined') {
      setStatus('polling');
      return;
    }

    let closed = false;
    let es: EventSource | null = null;
    let failures = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const parse = <T,>(e: Event): T | null => {
      try {
        return JSON.parse((e as MessageEvent).data) as T;
      } catch {
        return null; // malformed/unknown payload ignored safely
      }
    };

    const connect = () => {
      if (closed) return;
      setStatus(
        failures === 0
          ? 'connecting'
          : failures >= FALLBACK_AFTER_FAILURES
            ? 'polling'
            : 'reconnecting',
      );
      es = new EventSource(STREAM_URL);

      es.addEventListener('connected', () => {
        failures = 0;
        setStatus('live');
      });
      es.addEventListener('telemetry.update', (e) => {
        const row = parse<TelemetryRow>(e);
        if (row) handlersRef.current.onTelemetry?.(row);
      });
      es.addEventListener('alert.created', (e) => {
        const row = parse<AlertRow>(e);
        if (row) handlersRef.current.onAlert?.(row);
      });
      es.addEventListener('stream.error', () => {
        // Upstream hiccup surfaced by the server; connection may still be open.
        setStatus('reconnecting');
      });
      es.onerror = () => {
        // Connection dropped (or serverless invocation recycled) — reconnect.
        es?.close();
        es = null;
        if (closed) return;
        failures += 1;
        setStatus(failures >= FALLBACK_AFTER_FAILURES ? 'polling' : 'reconnecting');
        const delay = Math.min(1000 * 2 ** failures, MAX_BACKOFF_MS);
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    const onVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'hidden') {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        es?.close();
        es = null;
        setStatus('reconnecting');
      } else if (!es && !closed) {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        failures = 0;
        connect();
      }
    };

    connect();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, [enabled]);

  return { status };
}
