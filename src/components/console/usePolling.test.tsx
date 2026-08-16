import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePolling, MIN_POLL_INTERVAL_MS } from './usePolling';

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
}

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility('visible');
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setVisibility('visible');
  });

  it('fetches immediately then polls on a bounded interval (never faster than 10s)', async () => {
    const fetcher = vi.fn(async () => 'ok');
    renderHook(() => usePolling(fetcher, 1000)); // requests 1s → clamped to 10s
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).toHaveBeenCalledTimes(1);
    // Below the 10s floor: no additional poll.
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetcher).toHaveBeenCalledTimes(1);
    // Reaching the enforced floor triggers the next poll.
    await vi.advanceTimersByTimeAsync(MIN_POLL_INTERVAL_MS);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('pauses while the tab is hidden and resumes when visible', async () => {
    const fetcher = vi.fn(async () => 'ok');
    setVisibility('hidden');
    renderHook(() => usePolling(fetcher, 15_000));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).toHaveBeenCalledTimes(0); // hidden → no fetch
    await vi.advanceTimersByTimeAsync(15_000);
    expect(fetcher).toHaveBeenCalledTimes(0); // still paused

    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).toHaveBeenCalledTimes(1); // resumed
  });

  it('clears timers on unmount (no further polling)', async () => {
    const fetcher = vi.fn(async () => 'ok');
    const { unmount } = renderHook(() => usePolling(fetcher, 15_000));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).toHaveBeenCalledTimes(1);
    unmount();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
