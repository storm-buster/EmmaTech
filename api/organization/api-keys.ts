import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, newRequestId, readJsonBody, sendJson } from '../_lib/http.js';
import { logError, logInfo } from '../_lib/log.js';
import { RaphaServiceClient, type RaphaApiKeyMetadata } from '../_lib/rapha.js';
import { resolveConsoleContext, mapRaphaError } from '../_lib/console.js';
import {
  API_KEYS_UNAVAILABLE_REASON,
  DEFAULT_API_KEY_SCOPES,
  SUPPORTED_API_KEY_SCOPES,
  apiKeysAvailable,
  isValidApiKeyScopes,
} from '../_lib/apikeys.js';

/**
 * GET/POST /api/organization/api-keys — customer-facing RAPHA API-key lifecycle.
 *
 * Fully AUTHENTICATED and ORGANIZATION-SCOPED: the RAPHA tenant is resolved
 * server-side from the session (resolveConsoleContext) — a client-supplied
 * tenant_id is NEVER consulted. The RAPHA service token stays server-side and
 * is never returned/logged. RAPHA returns the raw key EXACTLY ONCE on
 * create/rotate; EmmaTech forwards it once and never persists/logs it, and
 * never returns key_hash.
 *
 * Function-budget note: rotate/revoke are POST `action`s on THIS single
 * endpoint (not separate serverless functions) to stay within the Vercel
 * function limit; server-side they map to RAPHA's per-key rotate/revoke paths.
 *
 *   GET                              → list keys (metadata only)
 *   POST { action: 'create', name, scopes? } → create (returns raw_key once)
 *   POST { action: 'rotate', key_id }        → rotate (returns raw_key once)
 *   POST { action: 'revoke', key_id }        → revoke (sanitized status)
 */

/** Sanitize a RAPHA key record to the customer-safe metadata shape only. */
function sanitize(k: RaphaApiKeyMetadata): {
  id: string;
  name: string;
  scopes: string[];
  created_at: string;
  revoked_at: string | null;
} {
  return {
    id: k.id,
    name: k.name,
    scopes: Array.isArray(k.scopes) ? k.scopes : [],
    created_at: k.created_at,
    revoked_at: k.revoked_at ?? null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const method = req.method ?? 'GET';
  if (!['GET', 'POST'].includes(method)) {
    methodNotAllowed(res, 'GET, POST');
    return;
  }

  // Auth + server-derived tenant (sends 401/404/409/503, returns null on failure).
  // Enforced BEFORE availability so the endpoint never leaks behavior anonymously.
  const ctx = await resolveConsoleContext(req, res);
  if (!ctx) return;

  if (!apiKeysAvailable(ctx.cfg)) {
    sendJson(res, 503, { error: API_KEYS_UNAVAILABLE_REASON });
    return;
  }

  const requestId = newRequestId();
  const client = new RaphaServiceClient(ctx.cfg);

  try {
    if (method === 'GET') {
      const data = await client.listTenantApiKeys(ctx.tenantId);
      sendJson(res, 200, { api_keys: data.api_keys.map(sanitize) });
      return;
    }

    // POST — action-dispatched (create / rotate / revoke).
    const body = readJsonBody(req);
    const action = typeof body.action === 'string' ? body.action : '';

    if (action === 'create') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name || name.length > 100) {
        sendJson(res, 400, { error: 'A key name is required (max 100 characters).', field: 'name' });
        return;
      }
      const scopes = body.scopes === undefined ? DEFAULT_API_KEY_SCOPES : body.scopes;
      if (!isValidApiKeyScopes(scopes)) {
        sendJson(res, 400, {
          error: `scopes must be a non-empty subset of: ${SUPPORTED_API_KEY_SCOPES.join(', ')}`,
          field: 'scopes',
        });
        return;
      }
      const created = await client.createTenantApiKey(ctx.tenantId, { name, scopes });
      // raw_key returned ONCE; never persisted, never logged.
      logInfo({
        requestId,
        organizationId: ctx.organizationId,
        operation: 'organization.api_key.create',
        status: 'success',
      });
      sendJson(res, 201, { api_key: sanitize(created.api_key), raw_key: created.raw_key });
      return;
    }

    if (action === 'rotate') {
      const keyId = typeof body.key_id === 'string' ? body.key_id.trim() : '';
      if (!keyId) {
        sendJson(res, 400, { error: 'key_id is required.', field: 'key_id' });
        return;
      }
      const rotated = await client.rotateTenantApiKey(ctx.tenantId, keyId);
      logInfo({
        requestId,
        organizationId: ctx.organizationId,
        operation: 'organization.api_key.rotate',
        status: 'success',
      });
      sendJson(res, 200, { api_key: sanitize(rotated.api_key), raw_key: rotated.raw_key });
      return;
    }

    if (action === 'revoke') {
      const keyId = typeof body.key_id === 'string' ? body.key_id.trim() : '';
      if (!keyId) {
        sendJson(res, 400, { error: 'key_id is required.', field: 'key_id' });
        return;
      }
      await client.revokeTenantApiKey(ctx.tenantId, keyId);
      logInfo({
        requestId,
        organizationId: ctx.organizationId,
        operation: 'organization.api_key.revoke',
        status: 'success',
      });
      sendJson(res, 200, { id: keyId, status: 'revoked' });
      return;
    }

    sendJson(res, 400, { error: 'Unknown action.', field: 'action' });
  } catch (err) {
    logError({
      requestId,
      organizationId: ctx.organizationId,
      operation: 'organization.api_keys',
      status: 'failure',
      outcome: err instanceof Error && err.name === 'RaphaError' ? `rapha_${(err as { kind?: string }).kind}` : 'unexpected',
    });
    mapRaphaError(res, err);
  }
}
