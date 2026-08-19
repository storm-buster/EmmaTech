/**
 * Email OTP primitives for signup verification.
 *
 * SECURITY:
 * - Codes are generated with cryptographically secure randomness
 *   (`crypto.randomInt`), never Math.random.
 * - Only a KEYED HMAC digest of the code is ever stored/compared — the plaintext
 *   code is never persisted, logged, returned, or placed in a URL.
 * - The digest is bound to the email so a code is only valid for its recipient.
 * - Comparison is constant-time.
 */
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

/** OTP lifetime: 10 minutes. */
export const OTP_TTL_MS = 10 * 60 * 1000;
/** Maximum verification attempts before a challenge is locked. */
export const OTP_MAX_ATTEMPTS = 5;
/** Durable per-email cooldown between OTP requests (anti email-bombing). */
export const OTP_REQUEST_COOLDOWN_MS = 60 * 1000;
/** Number of decimal digits in the code. */
const OTP_DIGITS = 6;

/** Generate a cryptographically secure zero-padded 6-digit code. */
export function generateOtpCode(): string {
  // randomInt is uniform over [0, 10^6) — no modulo bias.
  const n = randomInt(0, 10 ** OTP_DIGITS);
  return n.toString().padStart(OTP_DIGITS, '0');
}

/**
 * Keyed HMAC digest of the code, bound to the (normalized) email. `secret` is
 * the server session secret — never shipped to the client. Returns base64url.
 */
export function hashOtpCode(code: string, email: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`${email}:${code}`)
    .digest('base64url');
}

/** Constant-time comparison of a candidate code against a stored digest. */
export function verifyOtpCode(
  candidate: string,
  email: string,
  secret: string,
  storedHash: string,
): boolean {
  const expected = hashOtpCode(candidate, email, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(storedHash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Expiry timestamp (ISO) for a code created now. */
export function otpExpiryFrom(now: number = Date.now()): string {
  return new Date(now + OTP_TTL_MS).toISOString();
}

/** True when the stored ISO/Date expiry is in the past. */
export function isOtpExpired(expiresAt: string | Date, now: number = Date.now()): boolean {
  return new Date(expiresAt).getTime() <= now;
}
