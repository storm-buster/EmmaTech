import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionUserId } from './_lib/auth.js';
import { getConfig } from './_lib/config.js';
import { methodNotAllowed, sendJson } from './_lib/http.js';
import { getStore } from './_lib/store/index.js';
import { entitlementsForPlan } from './_lib/entitlements.js';
import { getAccountForUser, toPublicOrganization, toPublicUser } from './_lib/service.js';

/**
 * Current authenticated user + their organization (safe fields only).
 * Returns 401 when there is no valid session. Only the caller's own
 * organization is returned (cross-organization isolation).
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
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
