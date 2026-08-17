import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import type { AppConfig } from './config.js';

/**
 * Server-only OAuth support for Google & Microsoft (unified auth).
 *
 * SECURITY: client id/secret and all token exchange happen SERVER-SIDE. Nothing
 * here is sent to the browser. Provider credentials are read from environment
 * variables (names below); when absent the flow fail-closes with a sanitized
 * 503 (never a fake/mock flow).
 *
 * Required env vars (names only — configure per environment, never commit):
 *   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
 *   MICROSOFT_OAUTH_CLIENT_ID, MICROSOFT_OAUTH_CLIENT_SECRET
 *   OAUTH_REDIRECT_BASE_URL   (e.g. https://emmatech.in — builds the server
 *                              callback URL /api/auth/oauth/callback)
 * The existing SESSION_SECRET is reused to sign the OAuth `state`.
 */

export type OAuthProvider = 'google' | 'microsoft';

export function isOAuthProvider(v: unknown): v is OAuthProvider {
  return v === 'google' || v === 'microsoft';
}

interface ProviderEndpoints {
  authorize: string;
  token: string;
  userinfo: string;
  scope: string;
}

const ENDPOINTS: Record<OAuthProvider, ProviderEndpoints> = {
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    userinfo: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
  },
  microsoft: {
    authorize: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userinfo: 'https://graph.microsoft.com/oidc/userinfo',
    scope: 'openid email profile',
  },
};

export interface ProviderCreds {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  endpoints: ProviderEndpoints;
}

/** Read provider credentials from env; returns null when not configured. */
export function getProviderCreds(provider: OAuthProvider): ProviderCreds | null {
  const prefix = provider === 'google' ? 'GOOGLE_OAUTH' : 'MICROSOFT_OAUTH';
  const clientId = (process.env[`${prefix}_CLIENT_ID`] ?? '').trim();
  const clientSecret = (process.env[`${prefix}_CLIENT_SECRET`] ?? '').trim();
  const base = (process.env.OAUTH_REDIRECT_BASE_URL ?? '').trim().replace(/\/+$/, '');
  if (!clientId || !clientSecret || !base) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: `${base}/api/auth/oauth/callback`,
    endpoints: ENDPOINTS[provider],
  };
}

// ── Signed, stateless `state` (HMAC over provider + plan + nonce) ────────────

export interface StatePayload {
  provider: OAuthProvider;
  plan?: string;
  nonce: string;
}

/** Create a signed state string carrying provider + optional plan intent. */
export function signState(cfg: AppConfig, provider: OAuthProvider, plan?: string): string {
  const payload: StatePayload = { provider, plan, nonce: randomUUID() };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', cfg.sessionSecret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

/** Verify + parse a signed state; returns null on tamper/format error. */
export function verifyState(cfg: AppConfig, state: string | undefined): StatePayload | null {
  if (!state || !cfg.sessionSecret) return null;
  const dot = state.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = createHmac('sha256', cfg.sessionSecret).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as StatePayload;
    if (!isOAuthProvider(parsed.provider)) return null;
    return parsed;
  } catch {
    return null;
  }
}
