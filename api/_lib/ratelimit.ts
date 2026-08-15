/**
 * Minimal in-memory, per-instance authentication rate limiter.
 *
 * SCOPE / LIMITATION (be honest about this): Vercel serverless functions are
 * horizontally scaled and stateless across cold starts, so this limiter is
 * BEST-EFFORT per running instance only. It raises the cost of trivial
 * credential-stuffing/brute-force bursts against a single warm instance, but it
 * is NOT a durable, globally-consistent rate limit. A production-grade limiter
 * (shared Redis/Upstash/edge KV or the platform WAF) is deferred to a later
 * hardening phase. This module intentionally has no external dependencies and
 * never logs credentials or identifiers beyond a coarse bucket key.
 */

interface Bucket {
  /** Timestamps (ms) of recent hits within the window. */
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the caller may retry (only meaningful when !allowed). */
  retryAfterSec: number;
  remaining: number;
}

/**
 * Sliding-window check. Records the hit when allowed. `key` should already be
 * scoped (e.g. `login:1.2.3.4`) so different routes/identities do not share a
 * bucket.
 */
export function checkRateLimit(
  key: string,
  opts: RateLimitOptions,
  now: number = Date.now(),
): RateLimitResult {
  const windowStart = now - opts.windowMs;
  const bucket = buckets.get(key) ?? { hits: [] };
  // Drop hits that fall outside the window.
  bucket.hits = bucket.hits.filter((t) => t > windowStart);

  if (bucket.hits.length >= opts.limit) {
    const oldest = bucket.hits[0];
    const retryAfterSec = Math.max(1, Math.ceil((oldest + opts.windowMs - now) / 1000));
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSec, remaining: 0 };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryAfterSec: 0, remaining: opts.limit - bucket.hits.length };
}

/** Best-effort client identifier from proxy headers (never trusted for auth). */
export function clientKey(headers: Record<string, string | string[] | undefined>): string {
  const fwd = headers['x-forwarded-for'];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  const ip = (raw ?? '').split(',')[0].trim();
  return ip || 'unknown';
}

/** Test helper: clear all buckets between tests. */
export function __resetRateLimits(): void {
  buckets.clear();
}
