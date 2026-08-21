import { describe, it, expect } from 'vitest';
import { buildSensorHostnameMap, resolveSensorLabel } from './sensorLabels';
import type { SensorRow } from '../../auth/consoleClient';

const s = (over: Partial<SensorRow>): SensorRow => ({
  sensor_id: 'orch-1',
  tenant_id: 'tnt-1',
  ...over,
});

describe('buildSensorHostnameMap', () => {
  it('indexes sensor_id → hostname for rows that have both', () => {
    const map = buildSensorHostnameMap([
      s({ sensor_id: 'orch-a', hostname: 'HOST-A' }),
      s({ sensor_id: 'orch-b', hostname: 'HOST-B' }),
    ]);
    expect(map.get('orch-a')).toBe('HOST-A');
    expect(map.get('orch-b')).toBe('HOST-B');
    expect(map.size).toBe(2);
  });

  it('skips rows missing a hostname or sensor_id, and handles null/undefined input', () => {
    const map = buildSensorHostnameMap([
      s({ sensor_id: 'orch-a', hostname: undefined }),
      s({ sensor_id: 'orch-b', hostname: '' }),
      s({ sensor_id: 'orch-c', hostname: 'HOST-C' }),
    ]);
    expect(map.has('orch-a')).toBe(false);
    expect(map.has('orch-b')).toBe(false);
    expect(map.get('orch-c')).toBe('HOST-C');
    expect(buildSensorHostnameMap(null).size).toBe(0);
    expect(buildSensorHostnameMap(undefined).size).toBe(0);
  });
});

describe('resolveSensorLabel', () => {
  const map = buildSensorHostnameMap([s({ sensor_id: 'orch-known', hostname: 'KNOWN-HOST' })]);

  it('known sensor_id → hostname + id', () => {
    expect(resolveSensorLabel('orch-known', map)).toEqual({
      hostname: 'KNOWN-HOST',
      id: 'orch-known',
      unattributed: false,
    });
  });

  it('unknown sensor_id → null hostname, raw id preserved (caller falls back)', () => {
    expect(resolveSensorLabel('orch-mystery', map)).toEqual({
      hostname: null,
      id: 'orch-mystery',
      unattributed: false,
    });
  });

  it('null / undefined / blank sensor_id → unattributed, no fabrication', () => {
    for (const v of [null, undefined, '', '   '] as const) {
      expect(resolveSensorLabel(v, map)).toEqual({ hostname: null, id: null, unattributed: true });
    }
  });
});
