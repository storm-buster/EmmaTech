import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import { RaphaServiceClient } from '../_lib/rapha.js';
import { mapRaphaError, parseBoundedInt, resolveConsoleContext } from '../_lib/console.js';

/**
 * GET /api/console/telemetry
 *
 * Authenticated, organization-scoped proxy to the RAPHA Phase 7B-1 service
 * telemetry read API. The tenant is resolved SERVER-SIDE from the session; any
 * client-supplied tenant_id is ignored. Calls
 * GET {RAPHA_BASE_URL}/api/v1/service/tenants/{tenantId}/telemetry with
 * X-Service-Token (server-only). Only `limit` is forwarded (bounded).
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
    const data = await new RaphaServiceClient(ctx.cfg).getTenantTelemetry(ctx.tenantId, { limit });
    // tenant_id is the SERVER-derived value; RAPHA rows are passed through.
    sendJson(res, 200, { tenant_id: ctx.tenantId, telemetry: data.telemetry });
  } catch (err) {
    mapRaphaError(res, err);
  }
}
