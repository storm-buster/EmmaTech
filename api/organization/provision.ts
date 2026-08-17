import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionUserId } from '../_lib/auth.js';
import { getConfig } from '../_lib/config.js';
import { methodNotAllowed, newRequestId, sendJson } from '../_lib/http.js';
import { getStore } from '../_lib/store/index.js';
import {
  getAccountForUser,
  provisionOrganizationTenant,
  toPublicOrganization,
} from '../_lib/service.js';

/**
 * Controlled, owner-initiated retry of RAPHA tenant provisioning. This is NOT
 * an automatic/infinite retry loop — it runs once per explicit request and is
 * idempotent (external_customer_id = organization id is de-duplicated by RAPHA).
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
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
  if (!account || !account.organization) {
    sendJson(res, 404, { error: 'No organization found' });
    return;
  }
  // Authorization: only an organization owner may (re)provision.
  if (account.role !== 'owner') {
    sendJson(res, 403, { error: 'Only the organization owner can do this' });
    return;
  }

  const result = await provisionOrganizationTenant(
    store,
    cfg,
    account.organization,
    newRequestId(),
  );

  const failed = result.outcome === 'failed';
  sendJson(res, failed ? 502 : 200, {
    organization: toPublicOrganization(result.organization),
    provisioning: result.outcome,
  });
}
