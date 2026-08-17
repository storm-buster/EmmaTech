import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionUserId } from '../_lib/auth.js';
import { getConfig } from '../_lib/config.js';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import { getStore } from '../_lib/store/index.js';
import { getAccountForUser } from '../_lib/service.js';
import { API_KEYS_UNAVAILABLE_REASON, apiKeysAvailable } from '../_lib/apikeys.js';

/**
 * GET/POST/DELETE /api/organization/api-keys
 *
 * Customer-facing RAPHA API-key management. This endpoint is fully
 * AUTHENTICATED and ORGANIZATION-SCOPED (the tenant is resolved server-side
 * from the session — never from a client-supplied id), but the underlying
 * capability is currently GATED OFF because RAPHA does not yet expose a
 * service-level API-key contract (see api/_lib/apikeys.ts). It therefore
 * responds 501 without weakening security or inventing raw keys locally.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const method = req.method ?? 'GET';
  if (!['GET', 'POST', 'DELETE'].includes(method)) {
    methodNotAllowed(res, 'GET, POST, DELETE');
    return;
  }

  const cfg = getConfig();

  // Authentication is enforced BEFORE reporting availability, so this endpoint
  // never leaks its (future) behavior to anonymous callers.
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

  // Resolve (and require) the caller's own organization — enforces isolation.
  const account = await getAccountForUser(store, userId);
  if (!account || !account.organization) {
    sendJson(res, 404, { error: 'No organization found' });
    return;
  }

  if (!apiKeysAvailable(cfg)) {
    sendJson(res, 501, {
      error: 'Not implemented',
      detail: API_KEYS_UNAVAILABLE_REASON,
      available: false,
    });
    return;
  }

  // Unreachable while gated off. The real implementation will call the RAPHA
  // service API-key contract with the server-resolved tenant id.
  sendJson(res, 500, { error: 'Unexpected state' });
}
