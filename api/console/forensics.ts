import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import { RaphaServiceClient } from '../_lib/rapha.js';
import { mapRaphaError, parseBoundedInt, resolveConsoleContext } from '../_lib/console.js';

/**
 * GET /api/console/forensics
 *
 * Authenticated, organization-scoped proxy to the RAPHA Phase 7B-1 service
 * forensics read API (the structured viewer — NOT the legacy opaque
 * /api/v1/forensics/export blob). Tenant is resolved SERVER-SIDE from the
 * session; a client-supplied tenant_id is ignored. Calls
 * GET {RAPHA_BASE_URL}/api/v1/service/tenants/{tenantId}/forensics with
 * X-Service-Token (server-only). Forwards bounded `limit` and `offset`.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
    return;
  }
  const ctx = await resolveConsoleContext(req, res);
  if (!ctx) return;

  const limit = parseBoundedInt(req.query?.limit, 50, 1, 500);
  if (limit === 'invalid') {
    sendJson(res, 400, { error: 'limit must be an integer between 1 and 500' });
    return;
  }
  const offset = parseBoundedInt(req.query?.offset, 0, 0, 100000);
  if (offset === 'invalid') {
    sendJson(res, 400, { error: 'offset must be a non-negative integer' });
    return;
  }

  try {
    const data = await new RaphaServiceClient(ctx.cfg).getTenantForensics(ctx.tenantId, {
      limit,
      offset,
    });
    sendJson(res, 200, { tenant_id: ctx.tenantId, forensics: data.forensics });
  } catch (err) {
    mapRaphaError(res, err);
  }
}
