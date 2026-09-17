/**
 * Short-lived, single-object download token (Phase 3 Wave 2).
 *
 * The RAPHA installer runs on the customer's server, OUTSIDE the browser, so it
 * cannot carry the HttpOnly session cookie. Instead, the authenticated
 * `GET /api/organization/installer` endpoint (cookie-authorized) mints one of
 * these tokens and injects a tokenized package URL into the installer. The
 * token-authorized `GET /api/organization/agent-package?dt=<token>` endpoint
 * verifies it and streams the PRIVATE blob. The token:
 *   - is HMAC-signed with SESSION_SECRET (server-only), so it is unforgeable;
 *   - is scoped to ONE organization + ONE object pathname + GET;
 *   - EXPIRES (short TTL sized to the install workflow);
 *   - never appears in static frontend source (minted per request).
 *
 * Token format:  base64url(JSON payload) "." base64url(HMAC-SHA256 signature)
 * (mirrors api/_lib/session.ts).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Default lifetime: long enough to download the installer, transfer it to the
 *  target server, and run it — short enough to bound anonymous reuse. */
export const DEFAULT_DOWNLOAD_TTL_SEC = 60 * 60; // 1 hour

export interface DownloadTokenPayload {
  /** Organization id the download is authorized for. */
  org: string;
  /** Object pathname in the private Blob store this token authorizes GET on. */
  path: string;
  /** Expiry (epoch seconds). */
  exp: number;
}

function base64url(input: Buffer | string): string {
  return (typeof input === 'string' ? Buffer.from(input) : input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function sign(data: string, secret: string): string {
  return base64url(createHmac('sha256', secret).update(data).digest());
}

/** Mint a signed, expiring, org+object-scoped download token. */
export function createDownloadToken(
  input: { org: string; path: string },
  secret: string,
  ttlSec: number = DEFAULT_DOWNLOAD_TTL_SEC,
): string {
  const payload: DownloadTokenPayload = {
    org: input.org,
    path: input.path,
    exp: Math.floor(Date.now() / 1000) + ttlSec,
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded, secret)}`;
}

/** Verify a download token. Returns the payload, or null if malformed, if the
 *  signature is invalid, or if it has expired. */
export function verifyDownloadToken(
  token: string | null | undefined,
  secret: string,
): DownloadTokenPayload | null {
  if (!token || !secret) return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const encoded = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expectedSig = sign(encoded, secret);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload: DownloadTokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(encoded).toString('utf8')) as DownloadTokenPayload;
  } catch {
    return null;
  }
  if (!payload || typeof payload.org !== 'string' || typeof payload.path !== 'string') return null;
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null; // expired
  return payload;
}
