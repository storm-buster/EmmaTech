import { describe, it, expect, beforeEach } from 'vitest';
import { __resetRateLimits, checkRateLimit, clientKey } from './ratelimit.js';

beforeEach(() => {
  __resetRateLimits();
});

describe('checkRateLimit', () => {
  it('allows up to the limit within the window, then blocks', () => {
    const opts = { limit: 3, windowMs: 60_000 };
    const t0 = 1_000_000;
    expect(checkRateLimit('k', opts, t0).allowed).toBe(true);
    expect(checkRateLimit('k', opts, t0 + 1).allowed).toBe(true);
    expect(checkRateLimit('k', opts, t0 + 2).allowed).toBe(true);
    const blocked = checkRateLimit('k', opts, t0 + 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('allows again once the window slides past old hits', () => {
    const opts = { limit: 1, windowMs: 1_000 };
    const t0 = 2_000_000;
    expect(checkRateLimit('k', opts, t0).allowed).toBe(true);
    expect(checkRateLimit('k', opts, t0 + 500).allowed).toBe(false);
    // After the window elapses the earlier hit is dropped.
    expect(checkRateLimit('k', opts, t0 + 1_001).allowed).toBe(true);
  });

  it('keeps separate buckets per key', () => {
    const opts = { limit: 1, windowMs: 60_000 };
    const t0 = 3_000_000;
    expect(checkRateLimit('a', opts, t0).allowed).toBe(true);
    expect(checkRateLimit('b', opts, t0).allowed).toBe(true);
    expect(checkRateLimit('a', opts, t0 + 1).allowed).toBe(false);
  });
});

describe('clientKey', () => {
  it('uses the first x-forwarded-for hop', () => {
    expect(clientKey({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })).toBe('1.2.3.4');
  });
  it('handles array header form', () => {
    expect(clientKey({ 'x-forwarded-for': ['9.9.9.9'] })).toBe('9.9.9.9');
  });
  it('falls back to "unknown" when absent', () => {
    expect(clientKey({})).toBe('unknown');
  });
});
