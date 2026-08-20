import { describe, it, expect } from 'vitest';
import {
  deriveConnectionState,
  formatExpiry,
  isExpired,
  matchEnrolledSensor,
  sensorIsOnline,
} from './deployment';
import type { SensorRow } from '../../auth/consoleClient';

// A realistic future epoch: 2026-08-21T00:00:00Z.
const EPOCH_SECONDS = 1787270400;
const EPOCH_MS = EPOCH_SECONDS * 1000;

describe('formatExpiry (1970 regression guard)', () => {
  it('renders epoch SECONDS in local time — never 1970', () => {
    const out = formatExpiry(EPOCH_SECONDS);
    expect(out).toBe(new Date(EPOCH_MS).toLocaleString());
    expect(out).not.toContain('1970');
  });
  it('renders epoch MILLISECONDS identically', () => {
    expect(formatExpiry(EPOCH_MS)).toBe(new Date(EPOCH_MS).toLocaleString());
  });
  it('renders an ISO string', () => {
    const iso = '2026-08-21T00:00:00.000Z';
    expect(formatExpiry(iso)).toBe(new Date(iso).toLocaleString());
  });
  it('returns empty for missing/invalid values (never 1970)', () => {
    expect(formatExpiry('')).toBe('');
    expect(formatExpiry(null)).toBe('');
    expect(formatExpiry(undefined)).toBe('');
    expect(formatExpiry('not-a-date')).toBe('');
    expect(formatExpiry(0)).toBe('');
  });
});

describe('isExpired', () => {
  it('is true for a past timestamp and false for a future one', () => {
    const now = EPOCH_MS;
    expect(isExpired(EPOCH_SECONDS - 3600, now)).toBe(true);
    expect(isExpired(EPOCH_SECONDS + 3600, now)).toBe(false);
    expect(isExpired('', now)).toBe(false);
  });
});

const sensor = (over: Partial<SensorRow> = {}): SensorRow => ({
  sensor_id: 'orch-1',
  tenant_id: 'tnt-1',
  hostname: 'WEB-SERVER-01',
  status: 'active',
  last_seen: EPOCH_SECONDS,
  ...over,
});

describe('matchEnrolledSensor', () => {
  it('matches case-insensitively on hostname or sensor_id', () => {
    const list = [sensor({ hostname: 'other' }), sensor()];
    expect(matchEnrolledSensor(list, 'web-server-01')?.hostname).toBe('WEB-SERVER-01');
    expect(matchEnrolledSensor([sensor({ hostname: undefined })], 'orch-1')?.sensor_id).toBe('orch-1');
    expect(matchEnrolledSensor(list, 'nope')).toBeNull();
    expect(matchEnrolledSensor(list, '')).toBeNull();
  });
});

describe('sensorIsOnline', () => {
  const now = EPOCH_MS;
  it('online when active or recently seen; offline otherwise', () => {
    expect(sensorIsOnline(sensor({ status: 'active' }), now)).toBe(true);
    expect(sensorIsOnline(sensor({ status: 'inactive', last_seen: EPOCH_SECONDS - 60 }), now)).toBe(true); // recent
    expect(sensorIsOnline(sensor({ status: 'inactive', last_seen: EPOCH_SECONDS - 3600 }), now)).toBe(false); // stale
    expect(sensorIsOnline(null, now)).toBe(false);
  });
});

describe('deriveConnectionState transitions', () => {
  const now = EPOCH_MS;
  it('waiting → connected → online', () => {
    expect(deriveConnectionState([], 'WEB-SERVER-01', now)).toBe('waiting');
    expect(
      deriveConnectionState([sensor({ status: 'inactive', last_seen: EPOCH_SECONDS - 3600 })], 'WEB-SERVER-01', now),
    ).toBe('connected');
    expect(deriveConnectionState([sensor({ status: 'active' })], 'WEB-SERVER-01', now)).toBe('online');
  });
});
