import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import { RaphaServiceClient } from '../_lib/rapha.js';
import { mapRaphaError, resolveConsoleContext } from '../_lib/console.js';

/**
 * GET /api/console/sensors
 *
 * Authenticated, organization-scoped proxy to the RAPHA Phase 7B-1 service
 * sensors read API. Tenant is resolved SERVER-SIDE from the session; a
 * client-supplied tenant_id is ignored. Calls
 * GET {RAPHA_BASE_URL}/api/v1/service/tenants/{tenantId}/sensors with
 * X-Service-Token (server-only). RAPHA returns safe sensor metadata only
 * (sensor_id, tenant_id, hostname, status, last_seen) — passed through.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
    return;
  }
  const ctx = await resolveConsoleContext(req, res);
  if (!ctx) return;

  try {
    const data = await new RaphaServiceClient(ctx.cfg).getTenantSensors(ctx.tenantId);
    sendJson(res, 200, { tenant_id: ctx.tenantId, sensors: data.sensors });
  } catch (err) {
    mapRaphaError(res, err);
  }
}
