import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig, requireSessionSecret } from '../_lib/config.js';
import { methodNotAllowed, newRequestId, readJsonBody, sendJson } from '../_lib/http.js';
import { checkRateLimit, clientKey } from '../_lib/ratelimit.js';
import { hashPassword } from '../_lib/password.js';
import { createSessionToken, serializeSessionCookie } from '../_lib/session.js';
import { getStore } from '../_lib/store/index.js';
import { DuplicateEmailError } from '../_lib/store/types.js';
import { entitlementsForPlan } from '../_lib/entitlements.js';
import {
  signup,
  toPublicOrganization,
  toPublicUser,
  ValidationError,
} from '../_lib/service.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }

  const cfg = getConfig();

  // Best-effort per-instance abuse throttle (see ratelimit.ts limitations).
  const rl = checkRateLimit(`signup:${clientKey(req.headers)}`, { limit: 5, windowMs: 60_000 });
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
  const requestId = newRequestId();

  try {
    const result = await signup(
      store,
      cfg,
      {
        email: body.email,
        password: body.password,
        name: body.name,
        organizationName: body.organizationName ?? body.organization,
        requestedPlan: body.requested_plan,
      },
      hashPassword,
      requestId,
    );

    const token = createSessionToken(result.user.id, secret);
    res.setHeader('Set-Cookie', serializeSessionCookie(token, { secure: cfg.isProduction }));
    sendJson(res, 201, {
      user: toPublicUser(result.user),
      organization: toPublicOrganization(result.organization),
      role: result.role,
      entitlement: entitlementsForPlan(result.organization.plan),
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      sendJson(res, 400, { error: err.message, field: err.field });
      return;
    }
    if (err instanceof DuplicateEmailError) {
      sendJson(res, 409, { error: err.message });
      return;
    }
    // Never leak internal error details.
    sendJson(res, 500, { error: 'Unable to create account' });
  }
}
