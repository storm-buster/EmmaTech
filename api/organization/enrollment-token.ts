import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionUserId } from '../_lib/auth.js';
import { getConfig } from '../_lib/config.js';
import { methodNotAllowed, newRequestId, readJsonBody, sendJson } from '../_lib/http.js';
import { logError, logInfo } from '../_lib/log.js';
import { RaphaError } from '../_lib/rapha.js';
import { getStore } from '../_lib/store/index.js';
import { EnrollmentError, requestEnrollmentToken } from '../_lib/enrollment.js';
import { getAccountForUser } from '../_lib/service.js';

/**
 * POST /api/organization/enrollment-token
 *
 * Authenticated customers mint a one-time RAPHA enrollment credential for
 * their OWN organization. The RAPHA tenant is resolved server-side from the
 * session — any tenant_id in the request body is ignored. The RAPHA service
 * token never reaches the browser; the raw enrollment token is returned once
 * and is neither logged nor persisted.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }

  const cfg = getConfig();
  const requestId = newRequestId();
  const userId = getSessionUserId(req, cfg);
  if (!userId) {
    sendJson(res, 401, { error: 'Not authenticated' });
    return;
  }

  let store;
  try {
    store = getStore(cfg);
  } catch {
    sendJson(res, 503, { error: 'Service is not configured for persistence' });
    return;
  }

  // Optional, sanitized sensor label. Any client-supplied tenant_id is ignored.
  const body = readJsonBody(req);
  let sensorName: string | undefined;
  if (typeof body.sensor_name === 'string') {
    const trimmed = body.sensor_name.trim();
    if (trimmed.length > 100) {
      sendJson(res, 400, { error: 'sensor_name must be at most 100 characters' });
      return;
    }
    sensorName = trimmed || undefined;
  }

  // For safe diagnostics (org/tenant scope) without leaking the token.
  const account = await getAccountForUser(store, userId);
  const organizationId = account?.organization?.id;
  const raphaTenantId = account?.organization?.rapha_tenant_id ?? null;

  try {
    const result = await requestEnrollmentToken(store, cfg, userId, { sensorName });

    // NOTE: result.enrollment_token (raw secret) is intentionally NOT logged.
    logInfo({
      requestId,
      userId,
      organizationId,
      raphaTenantId,
      operation: 'rapha.enrollment_token',
      status: 'success',
    });

    // Returned ONCE to the authenticated browser. Not persisted anywhere.
    sendJson(res, 201, {
      enrollment_token: result.enrollment_token,
      token_id: result.token_id,
      status: result.status,
      expires_at: result.expires_at,
      note: 'This credential is shown once. It is sensitive, expires, and is for a single machine enrollment. Use it now and do not share it.',
    });
  } catch (err) {
    if (err instanceof EnrollmentError) {
      const status = err.code === 'no_organization' ? 404 : 409;
      logError({ requestId, userId, organizationId, operation: 'rapha.enrollment_token', status: 'failure', outcome: err.code });
      sendJson(res, status, { error: err.message });
      return;
    }
    if (err instanceof RaphaError) {
      // Map upstream RAPHA errors to safe customer-facing responses.
      logError({
        requestId,
        userId,
        organizationId,
        raphaTenantId,
        operation: 'rapha.enrollment_token',
        status: 'failure',
        outcome: `rapha_${err.kind}`,
      });
      if (err.kind === 'rate_limited') {
        sendJson(res, 429, { error: 'Too many requests. Please try again shortly.' });
        return;
      }
      if (err.kind === 'validation') {
        sendJson(res, 400, { error: 'The enrollment request was rejected.' });
        return;
      }
      if (err.kind === 'not_found') {
        sendJson(res, 409, { error: 'Your RAPHA deployment is not ready yet.' });
        return;
      }
      // auth / config / unavailable / upstream → generic service error.
      sendJson(res, 502, { error: 'RAPHA is temporarily unavailable. Please try again later.' });
      return;
    }
    logError({ requestId, userId, organizationId, operation: 'rapha.enrollment_token', status: 'failure', outcome: 'unexpected' });
    sendJson(res, 500, { error: 'Unable to generate enrollment credential' });
  }
}
