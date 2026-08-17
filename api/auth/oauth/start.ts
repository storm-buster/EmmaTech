import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig, requireSessionSecret } from '../../_lib/config.js';
import { methodNotAllowed, sendJson } from '../../_lib/http.js';
import { getProviderCreds, isOAuthProvider, signState } from '../../_lib/oauth.js';

/**
 * GET /api/auth/oauth/start?provider=google|microsoft&plan=<planId>
 *
 * Server-side start of the OAuth redirect flow. Reads provider credentials from
 * env; if not configured, fail-closes with 503 (never a fake flow). The `plan`
 * (UX intent) is carried in a SIGNED state (never an entitlement). Client
 * id/secret never reach the browser.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
    return;
  }
  const cfg = getConfig();
  try {
    requireSessionSecret(cfg);
  } catch {
    sendJson(res, 503, { error: 'Authentication is not configured' });
    return;
  }

  const providerRaw = Array.isArray(req.query?.provider) ? req.query.provider[0] : req.query?.provider;
  if (!isOAuthProvider(providerRaw)) {
    sendJson(res, 400, { error: 'Unsupported provider' });
    return;
  }
  const planRaw = Array.isArray(req.query?.plan) ? req.query.plan[0] : req.query?.plan;
  const plan = typeof planRaw === 'string' ? planRaw : undefined;

  const creds = getProviderCreds(providerRaw);
  if (!creds) {
    // Provider credentials not configured in this environment.
    sendJson(res, 503, { error: `${providerRaw} sign-in is not available yet` });
    return;
  }

  const state = signState(cfg, providerRaw, plan);
  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: creds.redirectUri,
    response_type: 'code',
    scope: creds.endpoints.scope,
    state,
  });
  if (providerRaw === 'google') {
    params.set('access_type', 'online');
    params.set('prompt', 'select_account');
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', `${creds.endpoints.authorize}?${params.toString()}`);
  res.status(302).end();
}
