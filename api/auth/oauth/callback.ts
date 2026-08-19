import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig, requireSessionSecret } from '../../_lib/config.js';
import { methodNotAllowed, newRequestId, sendJson } from '../../_lib/http.js';
import { getStore } from '../../_lib/store/index.js';
import { findOrCreateOAuthUser } from '../../_lib/service.js';
import { createSessionToken, serializeSessionCookie } from '../../_lib/session.js';
import { getProviderCreds, verifyState } from '../../_lib/oauth.js';
import { logError } from '../../_lib/log.js';

/**
 * GET /api/auth/oauth/callback?code=&state=
 *
 * Server-side OAuth callback. Verifies the signed state, exchanges the code for
 * a token, fetches the provider userinfo, and resolves the identity into the
 * existing account/session/org model (findOrCreateOAuthUser), then issues the
 * standard HttpOnly session cookie and redirects into the SPA. All secrets and
 * token exchange stay server-side. Failures redirect to the login page without
 * leaking upstream detail; provider tokens are never logged.
 */
function redirect(res: VercelResponse, hashRoute: string, cookie?: string): void {
  res.setHeader('Cache-Control', 'no-store');
  if (cookie) res.setHeader('Set-Cookie', cookie);
  res.setHeader('Location', `/#/${hashRoute}`);
  res.status(302).end();
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
    return;
  }
  const cfg = getConfig();
  const requestId = newRequestId();
  let secret: string;
  try {
    secret = requireSessionSecret(cfg);
  } catch {
    sendJson(res, 503, { error: 'Authentication is not configured' });
    return;
  }

  const code = Array.isArray(req.query?.code) ? req.query.code[0] : req.query?.code;
  const stateRaw = Array.isArray(req.query?.state) ? req.query.state[0] : req.query?.state;
  const state = verifyState(cfg, typeof stateRaw === 'string' ? stateRaw : undefined);
  if (!state || typeof code !== 'string' || !code) {
    redirect(res, 'login');
    return;
  }

  const creds = getProviderCreds(state.provider);
  if (!creds) {
    sendJson(res, 503, { error: `${state.provider} sign-in is not available yet` });
    return;
  }

  let store;
  try {
    store = getStore(cfg);
  } catch {
    sendJson(res, 503, { error: 'Service is not configured for persistence' });
    return;
  }

  try {
    // 1) Exchange authorization code for an access token (server-side).
    const tokenRes = await fetch(creds.endpoints.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        code,
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        redirect_uri: creds.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
      redirect: 'error',
    });
    if (!tokenRes.ok) throw new Error('token_exchange_failed');
    const token = (await tokenRes.json()) as { access_token?: string };
    if (!token.access_token) throw new Error('no_access_token');

    // 2) Fetch the provider userinfo (email + name).
    const infoRes = await fetch(creds.endpoints.userinfo, {
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/json' },
      redirect: 'error',
    });
    if (!infoRes.ok) throw new Error('userinfo_failed');
    const info = (await infoRes.json()) as { email?: string; name?: string };
    if (!info.email) throw new Error('no_email');

    // 3) Unify into the existing account/session/org model.
    const { user } = await findOrCreateOAuthUser(
      store,
      cfg,
      { email: info.email, name: info.name, provider: state.provider, plan: state.plan },
      requestId,
    );

    // 4) Issue the standard session cookie and land in the SPA.
    const sessionCookie = serializeSessionCookie(createSessionToken(user.id, secret), {
      secure: cfg.isProduction,
    });
    redirect(res, 'account', sessionCookie);
  } catch (err) {
    // Never leak provider/token detail; log only a sanitized code.
    logError({
      requestId,
      operation: 'account.oauth_callback',
      status: 'failure',
      outcome: err instanceof Error ? err.message : 'unexpected',
    });
    redirect(res, 'login');
  }
}
