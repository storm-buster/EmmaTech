import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig, requireSessionSecret } from '../_lib/config.js';
import { methodNotAllowed, newRequestId, readJsonBody, sendJson } from '../_lib/http.js';
import { checkRateLimit, clientKey } from '../_lib/ratelimit.js';
import { hashPassword } from '../_lib/password.js';
import { createSessionToken, serializeSessionCookie } from '../_lib/session.js';
import { getStore } from '../_lib/store/index.js';
import { DuplicateEmailError } from '../_lib/store/types.js';
import { entitlementsForPlan } from '../_lib/entitlements.js';
import { getEmailSender } from '../_lib/email.js';
import {
  requestSignupOtp,
  toPublicOrganization,
  toPublicUser,
  ValidationError,
  verifySignupOtp,
} from '../_lib/service.js';

/**
 * Two-phase email/password signup with mandatory email OTP verification:
 *   POST { action: 'request', name, organizationName, email, password, requested_plan? }
 *        → sends an OTP; creates NOTHING (no user/org/session/plan). 202.
 *   POST { action: 'verify', email, code }
 *        → on success, creates the verified account + session. 201.
 *
 * OAuth (Google/Microsoft) does NOT use this route and requires no OTP.
 * Kept as a single Vercel function (action-discriminated) to preserve the
 * 12-function budget.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }

  const cfg = getConfig();

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
  const action = typeof body.action === 'string' ? body.action : 'request';
  const requestId = newRequestId();
  const ipKey = clientKey(req.headers);

  try {
    if (action === 'request') {
      // Throttle OTP requests (per-instance best-effort).
      const rl = checkRateLimit(`signup:otp:request:${ipKey}`, { limit: 5, windowMs: 60_000 });
      if (!rl.allowed) {
        res.setHeader('Retry-After', String(rl.retryAfterSec));
        sendJson(res, 429, { error: 'Too many attempts. Please try again shortly.' });
        return;
      }

      const sender = getEmailSender(cfg);
      if (!sender) {
        // Production with no email provider configured → fail closed. Never
        // pretend a code was sent.
        sendJson(res, 503, { error: 'Email verification is not configured' });
        return;
      }

      await requestSignupOtp(
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
        sender,
        requestId,
      );
      // Generic response regardless of whether the email already existed
      // (enumeration-safe). Never includes the code.
      sendJson(res, 202, { ok: true, message: 'If the email is valid, a verification code has been sent.' });
      return;
    }

    if (action === 'verify') {
      // Throttle verification attempts (per-instance best-effort; the challenge
      // also enforces a hard per-code attempt cap).
      const rl = checkRateLimit(`signup:otp:verify:${ipKey}`, { limit: 10, windowMs: 60_000 });
      if (!rl.allowed) {
        res.setHeader('Retry-After', String(rl.retryAfterSec));
        sendJson(res, 429, { error: 'Too many attempts. Please try again shortly.' });
        return;
      }

      const result = await verifySignupOtp(
        store,
        cfg,
        { email: body.email, code: body.code },
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
      return;
    }

    sendJson(res, 400, { error: 'Unsupported action' });
  } catch (err) {
    if (err instanceof ValidationError) {
      sendJson(res, 400, { error: err.message, field: err.field });
      return;
    }
    if (err instanceof DuplicateEmailError) {
      sendJson(res, 409, { error: err.message });
      return;
    }
    sendJson(res, 500, { error: 'Unable to complete signup' });
  }
}
