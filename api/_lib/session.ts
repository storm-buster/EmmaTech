/**
 * Stateless session tokens signed with HMAC-SHA256, transported in an
 * HttpOnly cookie.
 *
 * Token format:  base64url(JSON payload) "." base64url(HMAC signature)
 * Payload:       { uid, iat, exp }
 *
 * SECURITY:
 * - The cookie is HttpOnly (not readable by browser JS), Secure in production,
 *   and SameSite=Lax (mitigates CSRF for cross-site POST requests).
 * - The signing secret never leaves the server and is never placed in a token.
 * - Signature verification is constant-time.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'et_session';
export const DEFAULT_SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  uid: string;
  iat: number;
  exp: number;
}

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64');
}

function sign(data: string, secret: string): string {
  return base64url(createHmac('sha256', secret).update(data).digest());
}

export function createSessionToken(
  userId: string,
  secret: string,
  ttlSec: number = DEFAULT_SESSION_TTL_SEC,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { uid: userId, iat: now, exp: now + ttlSec };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded, secret)}`;
}

/** Returns the user id if the token is valid and unexpired, otherwise null. */
export function verifySessionToken(token: string | null | undefined, secret: string): string | null {
  if (!token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(encoded, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64urlDecode(encoded).toString('utf8')) as SessionPayload;
  } catch {
    return null;
  }
  if (typeof payload.uid !== 'string' || !payload.uid) return null;
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload.uid;
}

export function serializeSessionCookie(
  token: string,
  opts: { secure: boolean; ttlSec?: number },
): string {
  const maxAge = opts.ttlSec ?? DEFAULT_SESSION_TTL_SEC;
  const attrs = [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (opts.secure) attrs.push('Secure');
  return attrs.join('; ');
}

export function clearSessionCookie(opts: { secure: boolean }): string {
  const attrs = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (opts.secure) attrs.push('Secure');
  return attrs.join('; ');
}

export function parseCookies(header: string | undefined | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}
