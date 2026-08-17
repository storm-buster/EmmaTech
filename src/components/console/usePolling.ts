import { useEffect, useRef, useState } from 'react';

/**
 * Bounded polling hook for the console data pages (Phase 7B-2).
 *
 * - Fetches immediately, then on a fixed interval (never faster than 10s).
 * - Pauses while the tab is hidden (`document.visibilityState === 'hidden'`)
 *   and resumes promptly when it becomes visible again.
 * - Applies simple exponential backoff (capped) after repeated failures.
 * - Aborts the outstanding request and clears timers/listeners on unmount, and
 *   ignores results that arrive after unmount (no stale state updates).
 *
 * No external state-management library; plain React.
 */

export type PollState = 'loading' | 'ok' | 'error';

export interface PollResult<T> {
  data: T | null;
  state: PollState;
  error: string | null;
}

/** Minimum allowed interval — enforces "never poll faster than 10 seconds". */
export const MIN_POLL_INTERVAL_MS = 10_000;

export function usePolling<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  intervalMs: number,
  options: { enabled?: boolean } = {},
): PollResult<T> {
  const enabled = options.enabled !== false;
  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState<PollState>('loading');
  const [error, setError] = useState<string | null>(null);

  // Keep the latest fetcher without restarting the polling effect each render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) return; // disabled (e.g. while an SSE stream is live)
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let failures = 0;

    const base = Math.max(MIN_POLL_INTERVAL_MS, intervalMs);

    const schedule = (ms: number) => {
      if (!active) return;
      timer = setTimeout(tick, ms);
    };

    async function tick(): Promise<void> {
      if (!active) return;
      // Pause while hidden — reschedule a check without fetching.
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        schedule(base);
        return;
      }
      controller = new AbortController();
      try {
        const result = await fetcherRef.current(controller.signal);
        if (!active) return;
        setData(result);
        setState('ok');
        setError(null);
        failures = 0;
        schedule(base);
      } catch (e) {
        if (!active) return;
        if (e instanceof DOMException && e.name === 'AbortError') return;
        failures += 1;
        setState('error');
        setError(e instanceof Error ? e.message : 'Failed to load');
        // Exponential backoff, capped at 5× the base interval.
        schedule(Math.min(base * 2 ** failures, base * 5));
      }
    }

    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && active) {
        if (timer) clearTimeout(timer);
        void tick();
      }
    };

    void tick();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      controller?.abort();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, [intervalMs, enabled]);

  return { data, state, error };
}
