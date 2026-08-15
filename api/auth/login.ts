import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig, requireSessionSecret } from '../_lib/config.js';
import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import { checkRateLimit, clientKey } from '../_lib/ratelimit.js';
import { verifyPassword } from '../_lib/password.js';
import { createSessionToken, serializeSessionCookie } from '../_lib/session.js';
import { getStore } from '../_lib/store/index.js';
import { entitlementsForPlan } from '../_lib/entitlements.js';
import { getAccountForUser, login, toPublicOrganization, toPublicUser } from '../_lib/service.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }

  const cfg = getConfig();

  // Best-effort per-instance brute-force throttle (see ratelimit.ts limitations).
  const rl = checkRateLimit(`login:${clientKey(req.headers)}`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    sendJson(res, 429, { error: 'Too many attempts. Please try again shortly.' });
    return;
  }

  let secret: string;
  try {
    secret = requireSessionSecret(cfg);
  } catch {
    sendJson(res, 503, { error: 'Service is not configured for authentication' });
    return;
  }

  let store;
  try {
    store = getStore(cfg);
  } catch {
    sendJson(res, 503, { error: 'Service is not configured for persistence' });
    return;
  }
  const body = readJsonBody(req);

  const user = await login(store, { email: body.email, password: body.password }, verifyPassword);
  if (!user) {
    // Generic message — do not reveal whether the account exists.
    sendJson(res, 401, { error: 'Invalid email or password' });
    return;
  }

  const token = createSessionToken(user.id, secret);
  res.setHeader('Set-Cookie', serializeSessionCookie(token, { secure: cfg.isProduction }));

  const account = await getAccountForUser(store, user.id);
  sendJson(res, 200, {
    user: toPublicUser(user),
    organization: account?.organization ? toPublicOrganization(account.organization) : null,
    role: account?.role ?? null,
    entitlement: account?.organization
      ? entitlementsForPlan(account.organization.plan)
      : null,
  });
}
