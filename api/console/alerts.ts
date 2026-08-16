import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import { RaphaServiceClient } from '../_lib/rapha.js';
import { mapRaphaError, parseBoundedInt, resolveConsoleContext } from '../_lib/console.js';

/**
 * GET /api/console/alerts
 *
 * Authenticated, organization-scoped proxy to the RAPHA Phase 7B-1 service
 * alerts read API. Tenant is resolved SERVER-SIDE from the session; a
 * client-supplied tenant_id is ignored. Calls
 * GET {RAPHA_BASE_URL}/api/v1/service/tenants/{tenantId}/alerts with
 * X-Service-Token (server-only). Only `limit` is forwarded (bounded). The RAPHA
 * alert contract is preserved verbatim (no invented severity/priority/risk).
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
    return;
  }
  const ctx = await resolveConsoleContext(req, res);
  if (!ctx) return;

  const limit = parseBoundedInt(req.query?.limit, 100, 1, 1000);
  if (limit === 'invalid') {
    sendJson(res, 400, { error: 'limit must be an integer between 1 and 1000' });
    return;
  }

  try {
    const data = await new RaphaServiceClient(ctx.cfg).getTenantAlerts(ctx.tenantId, { limit });
    sendJson(res, 200, { tenant_id: ctx.tenantId, alerts: data.alerts });
  } catch (err) {
    mapRaphaError(res, err);
  }
}
