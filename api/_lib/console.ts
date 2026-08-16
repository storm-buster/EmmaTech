import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionUserId } from './auth.js';
import { getConfig, type AppConfig } from './config.js';
import { sendJson } from './http.js';
import { getStore } from './store/index.js';
import { getAccountForUser } from './service.js';
import { RaphaError } from './rapha.js';

/**
 * Shared server-side helpers for the customer console proxies (Phase 7B-2).
 *
 * SECURITY: the RAPHA tenant is ALWAYS resolved here from the authenticated
 * session (session → user → organization → organization.rapha_tenant_id). A
 * client-supplied tenant_id (query/body/hash/storage) is never consulted. The
 * RAPHA service token stays server-side (in the RaphaServiceClient); it is
 * never returned, logged, or placed in a query string.
 */

export interface ConsoleContext {
  cfg: AppConfig;
  /** Server-derived RAPHA tenant id — the ONLY authoritative tenant. */
  tenantId: string;
  organizationId: string;
}

/**
 * Resolve the authenticated caller's organization and RAPHA tenant. On any
 * failure this sends the appropriate sanitized response and returns null, so
 * callers simply `if (!ctx) return;`.
 */
export async function resolveConsoleContext(
  req: VercelRequest,
  res: VercelResponse,
): Promise<ConsoleContext | null> {
  const cfg = getConfig();

  const userId = getSessionUserId(req, cfg);
  if (!userId) {
    sendJson(res, 401, { error: 'Not authenticated' });
    return null;
  }

  let store;
  try {
    store = getStore(cfg);
  } catch {
    sendJson(res, 503, { error: 'Service is not configured for persistence' });
    return null;
  }

  const account = await getAccountForUser(store, userId);
  if (!account || !account.organization) {
    sendJson(res, 404, { error: 'No organization found' });
    return null;
  }

  const tenantId = account.organization.rapha_tenant_id;
  if (!tenantId) {
    // Org exists but RAPHA provisioning has not completed — not an error state.
    sendJson(res, 409, { error: 'Your RAPHA deployment is not ready yet.' });
    return null;
  }

  return { cfg, tenantId, organizationId: account.organization.id };
}

/** Map an upstream RAPHA failure to a safe customer-facing response (no leaks). */
export function mapRaphaError(res: VercelResponse, err: unknown): void {
  if (err instanceof RaphaError) {
    if (err.kind === 'rate_limited') {
      sendJson(res, 429, { error: 'Too many requests. Please try again shortly.' });
      return;
    }
    if (err.kind === 'validation') {
      sendJson(res, 400, { error: 'The request was rejected.' });
      return;
    }
    if (err.kind === 'not_found') {
      sendJson(res, 409, { error: 'Your RAPHA deployment is not ready yet.' });
      return;
    }
    // auth / config / unavailable / upstream → generic upstream error.
    sendJson(res, 502, { error: 'RAPHA is temporarily unavailable. Please try again later.' });
    return;
  }
  sendJson(res, 500, { error: 'Unable to load console data' });
}

/**
 * Parse a bounded non-negative integer query param. Returns the default when
 * absent, the value when valid and in [min,max], or 'invalid' otherwise.
 */
export function parseBoundedInt(
  raw: unknown,
  def: number,
  min: number,
  max: number,
): number | 'invalid' {
  if (raw === undefined || raw === null) return def;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== 'string' || !/^\d+$/.test(v)) return 'invalid';
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n) || n < min || n > max) return 'invalid';
  return n;
}
