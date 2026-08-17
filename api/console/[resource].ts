import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import { RaphaServiceClient } from '../_lib/rapha.js';
import { mapRaphaError, parseBoundedInt, resolveConsoleContext } from '../_lib/console.js';

/**
 * GET /api/console/{resource} — consolidated, authenticated, organization-scoped
 * proxy to the RAPHA Phase 7B-1 service read APIs. Replaces the four separate
 * functions (alerts, forensics, sensors, telemetry) with a single dynamic
 * Vercel Serverless Function to stay within the platform function budget, while
 * preserving each resource's exact public URL and behavior:
 *
 *   GET /api/console/alerts     GET /api/console/telemetry
 *   GET /api/console/sensors    GET /api/console/forensics
 *
 * The tenant is resolved SERVER-SIDE from the session (a client-supplied
 * tenant_id is ignored); RAPHA is called with X-Service-Token (server-only);
 * the RAPHA contracts are passed through verbatim. The SSE endpoint
 * (/api/console/stream) is intentionally NOT consolidated here.
 */
type ConsoleResource = 'alerts' | 'forensics' | 'sensors' | 'telemetry';
const RESOURCES: readonly ConsoleResource[] = ['alerts', 'forensics', 'sensors', 'telemetry'];

function readResource(req: VercelRequest): ConsoleResource | null {
  const raw = Array.isArray(req.query?.resource) ? req.query.resource[0] : req.query?.resource;
  return typeof raw === 'string' && (RESOURCES as readonly string[]).includes(raw)
    ? (raw as ConsoleResource)
    : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
    return;
  }

  // Unknown resource → not found (only the four allowlisted resources exist).
  const resource = readResource(req);
  if (!resource) {
    sendJson(res, 404, { error: 'Unknown console resource' });
    return;
  }

  const ctx = await resolveConsoleContext(req, res);
  if (!ctx) return;

  const client = new RaphaServiceClient(ctx.cfg);
  try {
    switch (resource) {
      case 'alerts': {
        const limit = parseBoundedInt(req.query?.limit, 100, 1, 1000);
        if (limit === 'invalid') {
          sendJson(res, 400, { error: 'limit must be an integer between 1 and 1000' });
          return;
        }
        const data = await client.getTenantAlerts(ctx.tenantId, { limit });
        sendJson(res, 200, { tenant_id: ctx.tenantId, alerts: data.alerts });
        return;
      }
      case 'telemetry': {
        const limit = parseBoundedInt(req.query?.limit, 100, 1, 1000);
        if (limit === 'invalid') {
          sendJson(res, 400, { error: 'limit must be an integer between 1 and 1000' });
          return;
        }
        const data = await client.getTenantTelemetry(ctx.tenantId, { limit });
        // tenant_id is the SERVER-derived value; RAPHA rows are passed through.
        sendJson(res, 200, { tenant_id: ctx.tenantId, telemetry: data.telemetry });
        return;
      }
      case 'sensors': {
        const data = await client.getTenantSensors(ctx.tenantId);
        sendJson(res, 200, { tenant_id: ctx.tenantId, sensors: data.sensors });
        return;
      }
      case 'forensics': {
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
        const data = await client.getTenantForensics(ctx.tenantId, { limit, offset });
        sendJson(res, 200, { tenant_id: ctx.tenantId, forensics: data.forensics });
        return;
      }
    }
  } catch (err) {
    mapRaphaError(res, err);
  }
}
