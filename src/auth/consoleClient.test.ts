import { describe, it, expect } from 'vitest';
import { isSensorOnline, SENSOR_ONLINE_WINDOW_MS } from './consoleClient';
import type { SensorRow } from './consoleClient';

const NOW = 1_800_000_000_000; // fixed ms clock for deterministic boundaries
const sec = (ms: number) => Math.floor(ms / 1000);

const sensor = (over: Partial<SensorRow> = {}): SensorRow => ({
  sensor_id: 'orch-1',
  tenant_id: 'tnt-1',
  hostname: 'HOST-1',
  status: 'active', // persisted registration status — MUST NOT drive liveness
  last_seen: sec(NOW),
  ...over,
});

describe('isSensorOnline (authoritative, freshness-based)', () => {
  it('fresh last_seen → ONLINE', () => {
    expect(isSensorOnline(sensor({ last_seen: sec(NOW - 30_000) }), NOW)).toBe(true);
  });

  it('stale last_seen → OFFLINE even when persisted status is "active"/"online"', () => {
    expect(isSensorOnline(sensor({ status: 'active', last_seen: sec(NOW - 3_600_000) }), NOW)).toBe(false);
    expect(isSensorOnline(sensor({ status: 'online', last_seen: sec(NOW - 3_600_000) }), NOW)).toBe(false);
  });

  it('missing last_seen → OFFLINE', () => {
    expect(isSensorOnline(sensor({ last_seen: null }), NOW)).toBe(false);
    expect(isSensorOnline(sensor({ last_seen: undefined }), NOW)).toBe(false);
    expect(isSensorOnline(sensor({ last_seen: '' }), NOW)).toBe(false);
  });

  it('invalid last_seen → OFFLINE', () => {
    expect(isSensorOnline(sensor({ last_seen: 'not-a-date' }), NOW)).toBe(false);
    expect(isSensorOnline(sensor({ last_seen: 0 }), NOW)).toBe(false);
  });

  it('null sensor → OFFLINE', () => {
    expect(isSensorOnline(null, NOW)).toBe(false);
    expect(isSensorOnline(undefined, NOW)).toBe(false);
  });

  it('handles epoch seconds, epoch ms, and ISO strings consistently', () => {
    expect(isSensorOnline(sensor({ last_seen: sec(NOW - 10_000) }), NOW)).toBe(true); // seconds
    expect(isSensorOnline(sensor({ last_seen: NOW - 10_000 }), NOW)).toBe(true); // ms
    expect(isSensorOnline(sensor({ last_seen: new Date(NOW - 10_000).toISOString() }), NOW)).toBe(true); // ISO
  });

  it('respects the exact stale-threshold boundary', () => {
    // Exactly at the window → still ONLINE; one ms past → OFFLINE.
    expect(isSensorOnline(sensor({ last_seen: NOW - SENSOR_ONLINE_WINDOW_MS }), NOW)).toBe(true);
    expect(isSensorOnline(sensor({ last_seen: NOW - SENSOR_ONLINE_WINDOW_MS - 1 }), NOW)).toBe(false);
  });

  it('multiple sensors are evaluated independently', () => {
    const list = [
      sensor({ sensor_id: 'a', last_seen: sec(NOW - 30_000) }), // fresh
      sensor({ sensor_id: 'b', status: 'active', last_seen: sec(NOW - 3_600_000) }), // stale
    ];
    expect(isSensorOnline(list[0], NOW)).toBe(true);
    expect(isSensorOnline(list[1], NOW)).toBe(false);
  });

  it('window is 3 minutes (derived from the 60s agent heartbeat interval)', () => {
    expect(SENSOR_ONLINE_WINDOW_MS).toBe(180000);
  });
});
