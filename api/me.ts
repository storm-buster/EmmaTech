import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionUserId } from './_lib/auth.js';
import { getConfig } from './_lib/config.js';
import { methodNotAllowed, newRequestId, readJsonBody, sendJson } from './_lib/http.js';
import { getStore } from './_lib/store/index.js';
import { entitlementsForPlan } from './_lib/entitlements.js';
import {
  getAccountForUser,
  PlanAlreadySelectedError,
  selectInitialPlan,
  toPublicOrganization,
  toPublicUser,
  ValidationError,
} from './_lib/service.js';

/**
 * GET  → current authenticated user + their organization (safe fields only).
 * POST → apply the ONE-TIME initial plan selection (post-signup plan modal for
 *        the generic/no-plan path). Body: { requested_plan }. Server-authoritative
 *        and idempotent-guarded: fails 409 if a plan was already chosen.
 *
 * Both live on this single function to preserve the 12-function budget.
 * Returns 401 when there is no valid session. Only the caller's own
 * organization is ever returned (cross-organization isolation).
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    methodNotAllowed(res, 'GET, POST');
    return;
  }

  const cfg = getConfig();
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

  if (req.method === 'POST') {
    const body = readJsonBody(req);
    try {
      const organization = await selectInitialPlan(
        store,
        cfg,
        userId,
        body.requested_plan ?? body.plan,
        newRequestId(),
      );
      sendJson(res, 200, {
        organization: toPublicOrganization(organization),
        entitlement: entitlementsForPlan(organization.plan),
      });
    } catch (err) {
      if (err instanceof PlanAlreadySelectedError) {
        sendJson(res, 409, { error: err.message });
        return;
      }
      if (err instanceof ValidationError) {
        sendJson(res, 400, { error: err.message, field: err.field });
        return;
      }
      sendJson(res, 500, { error: 'Unable to update plan' });
    }
    return;
  }

  const account = await getAccountForUser(store, userId);
  if (!account) {
    // Session referenced a user that no longer exists.
    sendJson(res, 401, { error: 'Not authenticated' });
    return;
  }

  sendJson(res, 200, {
    user: toPublicUser(account.user),
    organization: account.organization ? toPublicOrganization(account.organization) : null,
    role: account.role,
    entitlement: account.organization
      ? entitlementsForPlan(account.organization.plan)
      : null,
  });
}
