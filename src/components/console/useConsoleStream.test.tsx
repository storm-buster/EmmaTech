import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useConsoleStream } from './useConsoleStream';
import { useConsoleLiveData } from './useConsoleLiveData';

type Listener = (e: { data: string }) => void;
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  listeners: Record<string, Listener[]> = {};
  onerror: ((e?: unknown) => void) | null = null;
  closed = false;
  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }
  addEventListener(type: string, cb: Listener) {
    (this.listeners[type] ??= []).push(cb);
  }
  emit(type: string, data: unknown) {
    (this.listeners[type] ?? []).forEach((cb) => cb({ data: JSON.stringify(data) }));
  }
  emitRaw(type: string, raw: string) {
    (this.listeners[type] ?? []).forEach((cb) => cb({ data: raw }));
  }
  triggerError() {
    this.onerror?.();
  }
  close() {
    this.closed = true;
  }
  static last() {
    return MockEventSource.instances[MockEventSource.instances.length - 1];
  }
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
}

beforeEach(() => {
  MockEventSource.instances = [];
  setVisibility('visible');
  vi.stubGlobal('EventSource', MockEventSource as unknown as typeof EventSource);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useConsoleStream', () => {
  it('connects to the same-origin stream URL only', () => {
    renderHook(() => useConsoleStream({}));
    expect(MockEventSource.last().url).toBe('/api/console/stream');
  });

  it('goes live on connected and forwards parsed telemetry/alert events', () => {
    const onTelemetry = vi.fn();
    const onAlert = vi.fn();
    const { result } = renderHook(() => useConsoleStream({ onTelemetry, onAlert }));
    act(() => MockEventSource.last().emit('connected', { type: 'connected' }));
    expect(result.current.status).toBe('live');
    act(() => MockEventSource.last().emit('telemetry.update', { type: 'telemetry.update', sensor_id: 's1' }));
    expect(onTelemetry).toHaveBeenCalledWith(expect.objectContaining({ sensor_id: 's1' }));
    act(() => MockEventSource.last().emit('alert.created', { type: 'alert.created', alert_id: 'a1' }));
    expect(onAlert).toHaveBeenCalledWith(expect.objectContaining({ alert_id: 'a1' }));
  });

  it('ignores malformed event payloads safely', () => {
    const onTelemetry = vi.fn();
    renderHook(() => useConsoleStream({ onTelemetry }));
    act(() => MockEventSource.last().emitRaw('telemetry.update', '{not json'));
    expect(onTelemetry).not.toHaveBeenCalled();
  });

  it('stream.error transitions to reconnecting', () => {
    const { result } = renderHook(() => useConsoleStream({}));
    act(() => MockEventSource.last().emit('connected', { type: 'connected' }));
    act(() => MockEventSource.last().emit('stream.error', { code: 'RAPHA_UNAVAILABLE' }));
    expect(result.current.status).toBe('reconnecting');
  });

  it('reconnects with bounded backoff and falls back to polling after repeated failures', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useConsoleStream({}));
    for (let i = 0; i < 3; i++) {
      act(() => MockEventSource.last().triggerError());
      act(() => vi.advanceTimersByTime(30_000));
    }
    expect(result.current.status).toBe('polling');
  });

  it('reports polling when the runtime has no EventSource', () => {
    vi.stubGlobal('EventSource', undefined as unknown as typeof EventSource);
    const { result } = renderHook(() => useConsoleStream({}));
    expect(result.current.status).toBe('polling');
  });

  it('is offline and opens no connection when disabled', () => {
    const { result } = renderHook(() => useConsoleStream({}, { enabled: false }));
    expect(result.current.status).toBe('offline');
    expect(MockEventSource.instances.length).toBe(0);
  });

  it('closes the EventSource on unmount', () => {
    const { unmount } = renderHook(() => useConsoleStream({}));
    const es = MockEventSource.last();
    unmount();
    expect(es.closed).toBe(true);
  });

  it('closes when hidden and reconnects when visible', () => {
    const { result } = renderHook(() => useConsoleStream({}));
    const first = MockEventSource.last();
    act(() => {
      setVisibility('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(first.closed).toBe(true);
    expect(result.current.status).toBe('reconnecting');
    act(() => {
      setVisibility('visible');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(MockEventSource.instances.length).toBeGreaterThan(1);
  });
});

describe('useConsoleLiveData', () => {
  it('when SSE is live it applies stream telemetry', () => {
    const { result } = renderHook(() => useConsoleLiveData({ enabled: true }));
    act(() => MockEventSource.last().emit('connected', { type: 'connected' }));
    expect(result.current.status).toBe('live');
    act(() =>
      MockEventSource.last().emit('telemetry.update', {
        type: 'telemetry.update',
        sensor_id: 's1',
        updated_at: 5,
      }),
    );
    expect(result.current.telemetry.some((t) => t.sensor_id === 's1')).toBe(true);
  });
});

describe('client stream source security', () => {
  it('browser stream code has no RAPHA URL, service token, internal API path, or tenant id param', () => {
    const root = process.cwd();
    for (const rel of [
      'src/components/console/useConsoleStream.ts',
      'src/components/console/useConsoleLiveData.ts',
    ]) {
      const src = readFileSync(join(root, rel), 'utf8');
      expect(src).not.toMatch(/rapha\.emmatech\.in/);
      expect(src).not.toMatch(/\/api\/v1\//);
      expect(src).not.toMatch(/X-Service-Token/);
      expect(src).not.toMatch(/RAPHA_SERVICE_TOKEN/);
      expect(src).not.toMatch(/tenantId/);
    }
    const stream = readFileSync(join(root, 'src/components/console/useConsoleStream.ts'), 'utf8');
    expect(stream).toContain('/api/console/stream');
  });
});
