import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Readable } from 'node:stream';
import { get as blobGet } from '@vercel/blob';
import { getSessionUserId } from '../_lib/auth.js';
import { getConfig, requireSessionSecret } from '../_lib/config.js';
import { renderInstaller, INSTALLER_FILENAME } from '../_lib/installerAsset.js';
import { createDownloadToken, verifyDownloadToken } from '../_lib/downloadToken.js';
import { methodNotAllowed, newRequestId, readJsonBody, sendJson } from '../_lib/http.js';
import { logError, logInfo } from '../_lib/log.js';
import { RaphaError, RaphaServiceClient, type RaphaApiKeyMetadata } from '../_lib/rapha.js';
import { getStore } from '../_lib/store/index.js';
import { EnrollmentError, requestEnrollmentToken } from '../_lib/enrollment.js';
import { getAccountForUser, provisionOrganizationTenant, toPublicOrganization } from '../_lib/service.js';
import { resolveConsoleContext, mapRaphaError } from '../_lib/console.js';
import {
  API_KEYS_UNAVAILABLE_REASON,
  DEFAULT_API_KEY_SCOPES,
  SUPPORTED_API_KEY_SCOPES,
  apiKeysAvailable,
  isValidApiKeyScopes,
} from '../_lib/apikeys.js';

/**
 * Consolidated organization API — ONE Vercel Serverless Function fronting the
 * three customer organization endpoints (function-budget consolidation; mirrors
 * api/console/[resource].ts and api/admin/[resource].ts). Public URLs, HTTP
 * methods, auth, RAPHA calls, response bodies, and error/logging semantics are
 * preserved BRANCH-FOR-BRANCH from the former standalone handlers:
 *
 *   GET/POST /api/organization/api-keys          → handleApiKeys
 *   POST     /api/organization/enrollment-token  → handleEnrollmentToken
 *   POST     /api/organization/provision         → handleProvision
 *
 * Each action keeps its ORIGINAL method restriction; an unknown action returns
 * 404 WITHOUT invoking any auth/RAPHA/service logic (dynamic-function convention
 * used elsewhere in this repo). The RAPHA service token stays server-side; raw
 * enrollment/api credentials are returned once and never logged/persisted.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const raw = Array.isArray(req.query?.action) ? req.query.action[0] : req.query?.action;
  const action = typeof raw === 'string' ? raw : '';

  if (action === 'api-keys') {
    await handleApiKeys(req, res);
    return;
  }
  if (action === 'enrollment-token') {
    await handleEnrollmentToken(req, res);
    return;
  }
  if (action === 'provision') {
    await handleProvision(req, res);
    return;
  }
  if (action === 'installer') {
    await handleInstaller(req, res);
    return;
  }
  if (action === 'agent-package') {
    await handleAgentPackage(req, res);
    return;
  }
  // Unknown action → 404 (no auth/RAPHA/service logic invoked).
  sendJson(res, 404, { error: 'Unknown organization action' });
}

// ── /api/organization/installer (GET) — authenticated installer download ────
/**
 * Cookie-authenticated. Mints a short-lived, org+object-scoped download token
 * and injects a tokenized package URL into the installer, so the rendered
 * script contains NO permanent/public agent-package URL. Anonymous → 401;
 * authenticated without an organization → 403.
 */
async function handleInstaller(req: VercelRequest, res: VercelResponse): Promise<void> {
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
  if (!account || !account.organization) {
    sendJson(res, 403, { error: 'No authorized organization' });
    return;
  }
  let sessionSecret: string;
  try {
    sessionSecret = requireSessionSecret(cfg);
  } catch {
    sendJson(res, 503, { error: 'Service is not configured' });
    return;
  }
  const token = createDownloadToken(
    { org: account.organization.id, path: cfg.agentPackagePathname },
    sessionSecret,
  );
  const hostHeader = req.headers['x-forwarded-host'] ?? req.headers.host ?? 'www.emmatech.in';
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  const packageUrl = `https://${host}/api/organization/agent-package?dt=${encodeURIComponent(token)}`;
  const script = renderInstaller(packageUrl);
  logInfo({ userId, organizationId: account.organization.id, operation: 'rapha.installer_download', status: 'success' });
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${INSTALLER_FILENAME}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(200).send(script);
}

// ── /api/organization/agent-package (GET) — token-authorized private stream ──
/**
 * Authorized by the short-lived download token (NOT the browser cookie, because
 * the installer runs on the customer's server). Streams the agent package from
 * the PRIVATE Blob store via the @vercel/blob `get()` SDK (server-side auth via
 * OIDC / BLOB_READ_WRITE_TOKEN — never exposed to the client). Invalid/expired
 * token → 403. No permanent public URL is ever returned.
 */
async function handleAgentPackage(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
    return;
  }
  const cfg = getConfig();
  let sessionSecret: string;
  try {
    sessionSecret = requireSessionSecret(cfg);
  } catch {
    sendJson(res, 503, { error: 'Service is not configured' });
    return;
  }
  const rawDt = Array.isArray(req.query?.dt) ? req.query.dt[0] : req.query?.dt;
  const payload = verifyDownloadToken(typeof rawDt === 'string' ? rawDt : null, sessionSecret);
  if (!payload) {
    sendJson(res, 403, { error: 'Invalid or expired download authorization' });
    return;
  }
  if (!cfg.blobConfigured) {
    sendJson(res, 503, { error: 'Agent package storage is not configured' });
    return;
  }
  try {
    const result = await blobGet(payload.path, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) {
      sendJson(res, 404, { error: 'Agent package not found' });
      return;
    }
    logInfo({ organizationId: payload.org, operation: 'rapha.agent_package_download', status: 'success' });
    res.setHeader('Content-Type', result.blob?.contentType ?? 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${payload.path.split('/').pop() ?? 'rapha-agent.zip'}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200);
    Readable.fromWeb(result.stream as Parameters<typeof Readable.fromWeb>[0]).pipe(res);
  } catch {
    logError({ organizationId: payload.org, operation: 'rapha.agent_package_download', status: 'failure', outcome: 'blob_error' });
    sendJson(res, 502, { error: 'Unable to retrieve the agent package' });
  }
}

// ── /api/organization/provision (POST) — verbatim from provision.ts ─────────
/**
 * Controlled, owner-initiated retry of RAPHA tenant provisioning. This is NOT
 * an automatic/infinite retry loop — it runs once per explicit request and is
 * idempotent (external_customer_id = organization id is de-duplicated by RAPHA).
 */
async function handleProvision(req: VercelRequest, res: VercelResponse): Promise<void> {
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

  const result = await provisionOrganizationTenant(store, cfg, account.organization, newRequestId());

  const failed = result.outcome === 'failed';
  sendJson(res, failed ? 502 : 200, {
    organization: toPublicOrganization(result.organization),
    provisioning: result.outcome,
  });
}

// ── /api/organization/enrollment-token (POST) — verbatim from enrollment-token.ts ──
/**
 * Authenticated customers mint a one-time RAPHA enrollment credential for their
 * OWN organization. The RAPHA tenant is resolved server-side from the session —
 * any tenant_id in the request body is ignored. The RAPHA service token never
 * reaches the browser; the raw enrollment token is returned once and is neither
 * logged nor persisted.
 */
async function handleEnrollmentToken(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }

  const cfg = getConfig();
  const requestId = newRequestId();
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

  // Optional, sanitized sensor label. Any client-supplied tenant_id is ignored.
  const body = readJsonBody(req);
  let sensorName: string | undefined;
  if (typeof body.sensor_name === 'string') {
    const trimmed = body.sensor_name.trim();
    if (trimmed.length > 100) {
      sendJson(res, 400, { error: 'sensor_name must be at most 100 characters' });
      return;
    }
    sensorName = trimmed || undefined;
  }

  // For safe diagnostics (org/tenant scope) without leaking the token.
  const account = await getAccountForUser(store, userId);
  const organizationId = account?.organization?.id;
  const raphaTenantId = account?.organization?.rapha_tenant_id ?? null;

  try {
    const result = await requestEnrollmentToken(store, cfg, userId, { sensorName });

    // NOTE: result.enrollment_token (raw secret) is intentionally NOT logged.
    logInfo({
      requestId,
      userId,
      organizationId,
      raphaTenantId,
      operation: 'rapha.enrollment_token',
      status: 'success',
    });

    // Returned ONCE to the authenticated browser. Not persisted anywhere.
    sendJson(res, 201, {
      enrollment_token: result.enrollment_token,
      token_id: result.token_id,
      status: result.status,
      expires_at: result.expires_at,
      note: 'This credential is shown once. It is sensitive, expires, and is for a single machine enrollment. Use it now and do not share it.',
    });
  } catch (err) {
    if (err instanceof EnrollmentError) {
      const status = err.code === 'no_organization' ? 404 : 409;
      logError({ requestId, userId, organizationId, operation: 'rapha.enrollment_token', status: 'failure', outcome: err.code });
      sendJson(res, status, { error: err.message });
      return;
    }
    if (err instanceof RaphaError) {
      // Map upstream RAPHA errors to safe customer-facing responses.
      logError({
        requestId,
        userId,
        organizationId,
        raphaTenantId,
        operation: 'rapha.enrollment_token',
        status: 'failure',
        outcome: `rapha_${err.kind}`,
      });
      if (err.kind === 'rate_limited') {
        sendJson(res, 429, { error: 'Too many requests. Please try again shortly.' });
        return;
      }
      if (err.kind === 'validation') {
        sendJson(res, 400, { error: 'The enrollment request was rejected.' });
        return;
      }
      if (err.kind === 'not_found') {
        sendJson(res, 409, { error: 'Your RAPHA deployment is not ready yet.' });
        return;
      }
      // auth / config / unavailable / upstream → generic service error.
      sendJson(res, 502, { error: 'RAPHA is temporarily unavailable. Please try again later.' });
      return;
    }
    logError({ requestId, userId, organizationId, operation: 'rapha.enrollment_token', status: 'failure', outcome: 'unexpected' });
    sendJson(res, 500, { error: 'Unable to generate enrollment credential' });
  }
}

// ── /api/organization/api-keys (GET/POST) — verbatim from api-keys.ts ───────
/** Sanitize a RAPHA key record to the customer-safe metadata shape only. */
function sanitizeApiKey(k: RaphaApiKeyMetadata): {
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

/**
 * GET/POST /api/organization/api-keys — customer-facing RAPHA API-key lifecycle.
 * Fully AUTHENTICATED and ORGANIZATION-SCOPED via resolveConsoleContext; the
 * service token stays server-side; raw key returned EXACTLY ONCE on
 * create/rotate, never persisted/logged; key_hash never returned.
 *   GET                                       → list keys (metadata only)
 *   POST { action: 'create', name, scopes? }  → create (returns raw_key once)
 *   POST { action: 'rotate', key_id }         → rotate (returns raw_key once)
 *   POST { action: 'revoke', key_id }         → revoke (sanitized status)
 */
async function handleApiKeys(req: VercelRequest, res: VercelResponse): Promise<void> {
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
      sendJson(res, 200, { api_keys: data.api_keys.map(sanitizeApiKey) });
      return;
    }

    // POST — action-dispatched (create / rotate / revoke).
    const body = readJsonBody(req);
    const keyAction = typeof body.action === 'string' ? body.action : '';

    if (keyAction === 'create') {
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
      sendJson(res, 201, { api_key: sanitizeApiKey(created.api_key), raw_key: created.raw_key });
      return;
    }

    if (keyAction === 'rotate') {
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
      sendJson(res, 200, { api_key: sanitizeApiKey(rotated.api_key), raw_key: rotated.raw_key });
      return;
    }

    if (keyAction === 'revoke') {
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
