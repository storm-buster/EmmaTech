import { describe, it, expect } from 'vitest';
import { normalizeExpiryToIso } from './enrollment.js';

const EPOCH_SECONDS = 1787270400; // 2026-08-21T00:00:00Z
const EPOCH_MS = EPOCH_SECONDS * 1000;

describe('normalizeExpiryToIso (fixes the 1970 enrollment-expiry bug)', () => {
  it('scales epoch SECONDS to a correct ISO timestamp (not 1970)', () => {
    const iso = normalizeExpiryToIso(EPOCH_SECONDS);
    expect(iso).toBe(new Date(EPOCH_MS).toISOString());
    expect(iso.startsWith('2026-')).toBe(true);
  });
  it('accepts a numeric string of epoch seconds', () => {
    expect(normalizeExpiryToIso(String(EPOCH_SECONDS))).toBe(new Date(EPOCH_MS).toISOString());
  });
  it('passes epoch MILLISECONDS through correctly', () => {
    expect(normalizeExpiryToIso(EPOCH_MS)).toBe(new Date(EPOCH_MS).toISOString());
  });
  it('passes an ISO string through', () => {
    const iso = '2026-08-21T00:00:00.000Z';
    expect(normalizeExpiryToIso(iso)).toBe(new Date(iso).toISOString());
  });
  it('returns empty string for invalid/missing values', () => {
    expect(normalizeExpiryToIso('')).toBe('');
    expect(normalizeExpiryToIso(null)).toBe('');
    expect(normalizeExpiryToIso(undefined)).toBe('');
    expect(normalizeExpiryToIso('not-a-date')).toBe('');
    expect(normalizeExpiryToIso(0)).toBe('');
  });
});
