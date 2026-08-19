import { describe, it, expect } from 'vitest';
import { fmtTime } from './formatTime';

// Expectations are computed with the SAME Date/toLocaleString the code uses, so
// they are independent of the runner's local timezone (no hardcoded IST).

describe('fmtTime', () => {
  it('formats epoch seconds in the browser-local timezone', () => {
    const secs = 1_699_999_999; // < 1e12 → seconds
    expect(fmtTime(secs)).toBe(new Date(secs * 1000).toLocaleString());
  });

  it('formats epoch milliseconds', () => {
    const ms = 1_699_999_999_000; // >= 1e12 → already ms
    expect(fmtTime(ms)).toBe(new Date(ms).toLocaleString());
  });

  it('formats a purely-numeric string as epoch seconds', () => {
    expect(fmtTime('1699999999')).toBe(new Date(1_699_999_999 * 1000).toLocaleString());
  });

  it('formats an ISO-8601 string with Z', () => {
    const iso = '2026-08-18T22:27:12.236597Z';
    expect(fmtTime(iso)).toBe(new Date(iso).toLocaleString());
  });

  it('formats an ISO-8601 string with an explicit timezone offset', () => {
    const iso = '2026-08-18T22:27:12+05:30';
    expect(fmtTime(iso)).toBe(new Date(iso).toLocaleString());
  });

  it('treats a naive RAPHA ISO timestamp as UTC (same as the Z-suffixed form)', () => {
    const naive = '2026-08-18T22:27:12.236597';
    const asUtc = new Date('2026-08-18T22:27:12.236597Z').toLocaleString();
    expect(fmtTime(naive)).toBe(asUtc);
  });

  it('returns a dash for empty/null/undefined', () => {
    expect(fmtTime('')).toBe('—');
    expect(fmtTime(null)).toBe('—');
    expect(fmtTime(undefined)).toBe('—');
  });

  it('returns the raw value for an unparseable string (never throws)', () => {
    expect(fmtTime('not-a-date')).toBe('not-a-date');
  });
});
