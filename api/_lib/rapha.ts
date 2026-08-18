/**
 * Server-side RAPHA service client.
 *
 * Trusted server-to-server integration ONLY. The browser must never call
 * RAPHA and must never see RAPHA_SERVICE_TOKEN.
 *
 * Contract (RAPHA Phase 1):
 *   POST {RAPHA_BASE_URL}/api/v1/service/tenants
 *   Header: X-Service-Token: <RAPHA_SERVICE_TOKEN>
 *   Body:   { name, external_customer_id }
 *   201  -> { tenant_id, name, external_customer_id, status, created_at, updated_at }
 *
 * SECURITY: the service token is never logged, never returned, and never
 * embedded in thrown errors.
 */
import type { AppConfig } from './config.js';

const PROVISION_TIMEOUT_MS = 8000;

export type RaphaErrorKind =
  | 'config' // misconfiguration (missing token/url, non-HTTPS in prod)
  | 'auth' // 401/403 — bad/absent service token
  | 'not_found' // 404 — tenant/resource not found
  | 'conflict' // 409 — external_customer_id already provisioned
  | 'validation' // 422 — request rejected
  | 'rate_limited' // 429 — too many requests
  | 'unavailable' // network error / timeout / DNS
  | 'upstream'; // 5xx or unexpected status

export class RaphaError extends Error {
  readonly kind: RaphaErrorKind;
  constructor(kind: RaphaErrorKind, message: string) {
    // message is intentionally generic and must never contain the token.
    super(message);
    this.name = 'RaphaError';
    this.kind = kind;
  }
}

export interface RaphaTenant {
  tenant_id: string;
  name: string;
  external_customer_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProvisionTenantInput {
  name: string;
  /** EmmaTech organization ID (NEVER the user ID). */
  external_customer_id: string;
}

/** RAPHA Phase 4 enrollment-token contract (raw token returned once). */
export interface RaphaEnrollmentToken {
  token_id: string;
  tenant_id: string;
  enrollment_token: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export interface CreateEnrollmentTokenInput {
  /** Optional custom TTL; omit to use RAPHA's default (24h). */
  expires_in_seconds?: number;
  /** Optional human label for the sensor/machine. */
  sensor_name?: string;
}

/**
 * Plan → RAPHA capability synchronization (RAPHA Phase 3 contract).
 *
 * sensorLimit: a positive integer, or null = UNLIMITED (sent to RAPHA as the
 * string "unlimited", which RAPHA stores as null). The authoritative mapping
 * lives in EmmaTech's canonical plan catalog; this client only transmits it.
 */
export interface SyncCapabilitiesInput {
  plan: string;
  sensorLimit: number | null;
  decoysEnabled: boolean;
}

/** RAPHA's safe capability view (never contains secrets). */
export interface RaphaCapabilityView {
  tenant_id: string;
  external_customer_id: string | null;
  plan: string;
  sensor_limit: number | null;
  decoys_enabled: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Phase 7B service-scoped customer READ responses. The proxy passes RAPHA's
 * fields through unchanged (no invented fields). Rows are typed as unknown[] so
 * EmmaTech never fabricates or drops a legitimate RAPHA field; the browser view
 * layer reads the documented fields defensively.
 */
export interface TenantTelemetryResponse {
  tenant_id: string;
  telemetry: unknown[];
  /** Phase 7C-1 incremental cursor (inclusive >= semantics). */
  next_since?: number;
}
export interface TenantAlertsResponse {
  tenant_id: string;
  alerts: unknown[];
  /** Phase 7C-1 incremental cursor (inclusive >= semantics). */
  next_since?: number;
}
export interface TenantSensorsResponse {
  tenant_id: string;
  sensors: unknown[];
}
export interface TenantForensicsResponse {
  tenant_id: string;
  forensics: unknown[];
}

/**
 * Customer API-key lifecycle (RAPHA service contract). RAPHA returns metadata
 * only on list; the raw key is returned EXACTLY ONCE on create/rotate. RAPHA
 * stores only a SHA-256 key_hash and NEVER returns it. These types deliberately
 * exclude key_hash so it can never be surfaced by EmmaTech.
 */
export interface RaphaApiKeyMetadata {
  id: string;
  name: string;
  scopes: string[];
  created_at: string;
  revoked_at: string | null;
}
export interface RaphaApiKeyListResponse {
  api_keys: RaphaApiKeyMetadata[];
}
/** Raw key returned exactly once by RAPHA on create/rotate (never persisted). */
export interface RaphaApiKeyCreated {
  api_key: RaphaApiKeyMetadata;
  raw_key: string;
}
export interface CreateApiKeyInput {
  name: string;
  scopes?: string[];
}

export class RaphaServiceClient {
  constructor(private readonly cfg: AppConfig) {}

  async provisionTenant(input: ProvisionTenantInput): Promise<RaphaTenant> {
    const baseUrl = this.cfg.raphaBaseUrl;
    const token = this.cfg.raphaServiceToken;

    if (!baseUrl || !token) {
      throw new RaphaError('config', 'RAPHA service is not configured');
    }
    // Enforce HTTPS in production; allow http only for local/dev bases.
    if (this.cfg.isProduction && !/^https:\/\//i.test(baseUrl)) {
      throw new RaphaError('config', 'RAPHA base URL must use HTTPS in production');
    }

    const target = `${baseUrl.replace(/\/+$/, '')}/api/v1/service/tenants`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROVISION_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(target, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Service-Token': token,
        },
        body: JSON.stringify({
          name: input.name,
          external_customer_id: input.external_customer_id,
        }),
        redirect: 'error',
        signal: controller.signal,
      });
    } catch {
      // Network failure, DNS, timeout/abort — never leaks the token.
      throw new RaphaError('unavailable', 'RAPHA service is unavailable');
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 201 || res.status === 200) {
      let body: RaphaTenant;
      try {
        body = (await res.json()) as RaphaTenant;
      } catch {
        throw new RaphaError('upstream', 'RAPHA returned an invalid response');
      }
      if (!body || typeof body.tenant_id !== 'string' || !body.tenant_id) {
        throw new RaphaError('upstream', 'RAPHA returned an invalid response');
      }
      return body;
    }

    if (res.status === 401 || res.status === 403) {
      throw new RaphaError('auth', 'RAPHA rejected the service credentials');
    }
    if (res.status === 409) {
      throw new RaphaError('conflict', 'RAPHA tenant already exists for this customer');
    }
    if (res.status === 422) {
      throw new RaphaError('validation', 'RAPHA rejected the tenant request');
    }
    throw new RaphaError('upstream', 'RAPHA service error');
  }

  /**
   * Create a one-time enrollment token for a tenant (RAPHA Phase 4).
   * POST {base}/api/v1/service/tenants/{tenantId}/enrollment-tokens
   *
   * tenantId is supplied by the server (derived from the authenticated
   * organization) — NEVER from the browser. The raw enrollment_token is
   * returned once and must not be logged or persisted by callers.
   */
  async createEnrollmentToken(
    tenantId: string,
    input: CreateEnrollmentTokenInput = {},
  ): Promise<RaphaEnrollmentToken> {
    const baseUrl = this.cfg.raphaBaseUrl;
    const token = this.cfg.raphaServiceToken;

    if (!baseUrl || !token || !tenantId) {
      throw new RaphaError('config', 'RAPHA service is not configured');
    }
    if (this.cfg.isProduction && !/^https:\/\//i.test(baseUrl)) {
      throw new RaphaError('config', 'RAPHA base URL must use HTTPS in production');
    }

    const target = `${baseUrl.replace(/\/+$/, '')}/api/v1/service/tenants/${encodeURIComponent(
      tenantId,
    )}/enrollment-tokens`;

    const body: CreateEnrollmentTokenInput = {};
    if (typeof input.expires_in_seconds === 'number') {
      body.expires_in_seconds = input.expires_in_seconds;
    }
    if (input.sensor_name) {
      body.sensor_name = input.sensor_name;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROVISION_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(target, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Service-Token': token,
        },
        body: JSON.stringify(body),
        redirect: 'error',
        signal: controller.signal,
      });
    } catch {
      throw new RaphaError('unavailable', 'RAPHA service is unavailable');
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 201 || res.status === 200) {
      let parsed: RaphaEnrollmentToken;
      try {
        parsed = (await res.json()) as RaphaEnrollmentToken;
      } catch {
        throw new RaphaError('upstream', 'RAPHA returned an invalid response');
      }
      if (!parsed || typeof parsed.enrollment_token !== 'string' || !parsed.enrollment_token) {
        throw new RaphaError('upstream', 'RAPHA returned an invalid response');
      }
      return parsed;
    }

    if (res.status === 401 || res.status === 403) {
      throw new RaphaError('auth', 'RAPHA rejected the service credentials');
    }
    if (res.status === 404) {
      throw new RaphaError('not_found', 'RAPHA tenant not found');
    }
    if (res.status === 422) {
      throw new RaphaError('validation', 'RAPHA rejected the enrollment request');
    }
    if (res.status === 429) {
      throw new RaphaError('rate_limited', 'RAPHA rate limit exceeded');
    }
    throw new RaphaError('upstream', 'RAPHA service error');
  }

  /**
   * Synchronize a tenant's plan-driven capabilities into RAPHA (idempotent).
   * PATCH {base}/api/v1/service/tenants/{tenantId}/capabilities
   *
   * Ensures RAPHA enforces the authoritative EmmaTech entitlement
   * (sensor_limit + decoys_enabled) for the organization's plan. tenantId is
   * always resolved server-side (never from the browser). Repeated identical
   * syncs are a no-op on the RAPHA side.
   */
  async syncTenantCapabilities(
    tenantId: string,
    input: SyncCapabilitiesInput,
  ): Promise<RaphaCapabilityView> {
    const baseUrl = this.cfg.raphaBaseUrl;
    const token = this.cfg.raphaServiceToken;

    if (!baseUrl || !token || !tenantId) {
      throw new RaphaError('config', 'RAPHA service is not configured');
    }
    if (this.cfg.isProduction && !/^https:\/\//i.test(baseUrl)) {
      throw new RaphaError('config', 'RAPHA base URL must use HTTPS in production');
    }

    const target = `${baseUrl.replace(/\/+$/, '')}/api/v1/service/tenants/${encodeURIComponent(
      tenantId,
    )}/capabilities`;

    // null sensorLimit => unlimited (RAPHA accepts the string "unlimited").
    const body = {
      plan: input.plan,
      sensor_limit: input.sensorLimit === null ? 'unlimited' : input.sensorLimit,
      decoys_enabled: input.decoysEnabled,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROVISION_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(target, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Service-Token': token,
        },
        body: JSON.stringify(body),
        redirect: 'error',
        signal: controller.signal,
      });
    } catch {
      throw new RaphaError('unavailable', 'RAPHA service is unavailable');
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 200 || res.status === 201) {
      try {
        return (await res.json()) as RaphaCapabilityView;
      } catch {
        throw new RaphaError('upstream', 'RAPHA returned an invalid response');
      }
    }

    if (res.status === 401 || res.status === 403) {
      throw new RaphaError('auth', 'RAPHA rejected the service credentials');
    }
    if (res.status === 404) {
      throw new RaphaError('not_found', 'RAPHA tenant not found');
    }
    if (res.status === 422) {
      throw new RaphaError('validation', 'RAPHA rejected the capability request');
    }
    if (res.status === 429) {
      throw new RaphaError('rate_limited', 'RAPHA rate limit exceeded');
    }
    throw new RaphaError('upstream', 'RAPHA service error');
  }

  /**
   * Shared, trusted service-scoped GET (Phase 7B). Reads a customer-safe
   * resource for a SERVER-DERIVED tenant. `subpath` is a fixed resource name
   * ('telemetry'|'alerts'|'sensors'|'forensics') — never a caller-supplied URL.
   * `tenantId` is placed in the path and MUST be resolved server-side from the
   * authenticated session (never from the browser). X-Service-Token is sent as
   * a header only, never logged, never in the query string.
   */
  private async serviceGet<T>(
    tenantId: string,
    subpath: 'telemetry' | 'alerts' | 'sensors' | 'forensics',
    query: Record<string, number> = {},
  ): Promise<T> {
    const baseUrl = this.cfg.raphaBaseUrl;
    const token = this.cfg.raphaServiceToken;

    if (!baseUrl || !token || !tenantId) {
      throw new RaphaError('config', 'RAPHA service is not configured');
    }
    if (this.cfg.isProduction && !/^https:\/\//i.test(baseUrl)) {
      throw new RaphaError('config', 'RAPHA base URL must use HTTPS in production');
    }

    const qs = Object.entries(query)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    const target =
      `${baseUrl.replace(/\/+$/, '')}/api/v1/service/tenants/${encodeURIComponent(tenantId)}/${subpath}` +
      (qs ? `?${qs}` : '');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROVISION_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(target, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Service-Token': token,
        },
        redirect: 'error',
        signal: controller.signal,
      });
    } catch {
      throw new RaphaError('unavailable', 'RAPHA service is unavailable');
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 200) {
      try {
        return (await res.json()) as T;
      } catch {
        throw new RaphaError('upstream', 'RAPHA returned an invalid response');
      }
    }
    if (res.status === 401 || res.status === 403) {
      throw new RaphaError('auth', 'RAPHA rejected the service credentials');
    }
    if (res.status === 404) {
      throw new RaphaError('not_found', 'RAPHA tenant not found');
    }
    if (res.status === 429) {
      throw new RaphaError('rate_limited', 'RAPHA rate limit exceeded');
    }
    throw new RaphaError('upstream', 'RAPHA service error');
  }

  /** GET {base}/api/v1/service/tenants/{tenantId}/telemetry (server-derived tenant). */
  async getTenantTelemetry(
    tenantId: string,
    opts: { limit?: number; since?: number } = {},
  ): Promise<TenantTelemetryResponse> {
    const q: Record<string, number> = {};
    if (typeof opts.limit === 'number') q.limit = opts.limit;
    if (typeof opts.since === 'number') q.since = opts.since;
    const body = await this.serviceGet<TenantTelemetryResponse>(tenantId, 'telemetry', q);
    if (!body || !Array.isArray(body.telemetry)) {
      throw new RaphaError('upstream', 'RAPHA returned an invalid response');
    }
    return body;
  }

  /** GET {base}/api/v1/service/tenants/{tenantId}/alerts (server-derived tenant). */
  async getTenantAlerts(
    tenantId: string,
    opts: { limit?: number; since?: number } = {},
  ): Promise<TenantAlertsResponse> {
    const q: Record<string, number> = {};
    if (typeof opts.limit === 'number') q.limit = opts.limit;
    if (typeof opts.since === 'number') q.since = opts.since;
    const body = await this.serviceGet<TenantAlertsResponse>(tenantId, 'alerts', q);
    if (!body || !Array.isArray(body.alerts)) {
      throw new RaphaError('upstream', 'RAPHA returned an invalid response');
    }
    return body;
  }

  /** GET {base}/api/v1/service/tenants/{tenantId}/sensors (server-derived tenant). */
  async getTenantSensors(tenantId: string): Promise<TenantSensorsResponse> {
    const body = await this.serviceGet<TenantSensorsResponse>(tenantId, 'sensors');
    if (!body || !Array.isArray(body.sensors)) {
      throw new RaphaError('upstream', 'RAPHA returned an invalid response');
    }
    return body;
  }

  /** GET {base}/api/v1/service/tenants/{tenantId}/forensics (server-derived tenant). */
  async getTenantForensics(
    tenantId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<TenantForensicsResponse> {
    const q: Record<string, number> = {};
    if (typeof opts.limit === 'number') q.limit = opts.limit;
    if (typeof opts.offset === 'number') q.offset = opts.offset;
    const body = await this.serviceGet<TenantForensicsResponse>(tenantId, 'forensics', q);
    if (!body || !Array.isArray(body.forensics)) {
      throw new RaphaError('upstream', 'RAPHA returned an invalid response');
    }
    return body;
  }

  // ── Customer API-key lifecycle ───────────────────────────────────────────
  // GET/POST {base}/api/v1/service/tenants/{tid}/api-keys [ /{id}/rotate|revoke ]
  // X-Service-Token (server-only, never logged/returned). tenantId is always
  // server-derived (never from the browser). RAPHA returns raw_key ONLY on
  // create/rotate and never returns key_hash. Errors flow through RaphaError so
  // the existing mapping (mapRaphaError) applies (e.g. cross-tenant/unknown →
  // 404 → not_found).
  private async serviceKeyRequest(
    tenantId: string,
    subpath: string,
    method: 'GET' | 'POST',
    body?: unknown,
  ): Promise<unknown> {
    const baseUrl = this.cfg.raphaBaseUrl;
    const token = this.cfg.raphaServiceToken;
    if (!baseUrl || !token || !tenantId) {
      throw new RaphaError('config', 'RAPHA service is not configured');
    }
    if (this.cfg.isProduction && !/^https:\/\//i.test(baseUrl)) {
      throw new RaphaError('config', 'RAPHA base URL must use HTTPS in production');
    }
    const target = `${baseUrl.replace(/\/+$/, '')}/api/v1/service/tenants/${encodeURIComponent(
      tenantId,
    )}/${subpath}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROVISION_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(target, {
        method,
        headers: {
          Accept: 'application/json',
          'X-Service-Token': token,
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        redirect: 'error',
        signal: controller.signal,
      });
    } catch {
      throw new RaphaError('unavailable', 'RAPHA service is unavailable');
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 200 || res.status === 201) {
      try {
        return await res.json();
      } catch {
        throw new RaphaError('upstream', 'RAPHA returned an invalid response');
      }
    }
    if (res.status === 401 || res.status === 403) {
      throw new RaphaError('auth', 'RAPHA rejected the service credentials');
    }
    if (res.status === 404) {
      throw new RaphaError('not_found', 'RAPHA API key not found');
    }
    if (res.status === 422) {
      throw new RaphaError('validation', 'RAPHA rejected the API-key request');
    }
    if (res.status === 429) {
      throw new RaphaError('rate_limited', 'RAPHA rate limit exceeded');
    }
    throw new RaphaError('upstream', 'RAPHA service error');
  }

  /** GET api-keys — metadata only (never raw key or key_hash). */
  async listTenantApiKeys(tenantId: string): Promise<RaphaApiKeyListResponse> {
    const body = (await this.serviceKeyRequest(tenantId, 'api-keys', 'GET')) as RaphaApiKeyListResponse;
    if (!body || !Array.isArray(body.api_keys)) {
      throw new RaphaError('upstream', 'RAPHA returned an invalid response');
    }
    return body;
  }

  /** POST api-keys — returns the raw key EXACTLY ONCE. */
  async createTenantApiKey(tenantId: string, input: CreateApiKeyInput): Promise<RaphaApiKeyCreated> {
    const payload: { name: string; scopes?: string[] } = { name: input.name };
    if (input.scopes) payload.scopes = input.scopes;
    const body = (await this.serviceKeyRequest(tenantId, 'api-keys', 'POST', payload)) as RaphaApiKeyCreated;
    if (!body || typeof body.raw_key !== 'string' || !body.raw_key || !body.api_key) {
      throw new RaphaError('upstream', 'RAPHA returned an invalid response');
    }
    return body;
  }

  /** POST api-keys/{id}/rotate — returns the NEW raw key EXACTLY ONCE. */
  async rotateTenantApiKey(tenantId: string, keyId: string): Promise<RaphaApiKeyCreated> {
    const body = (await this.serviceKeyRequest(
      tenantId,
      `api-keys/${encodeURIComponent(keyId)}/rotate`,
      'POST',
    )) as RaphaApiKeyCreated;
    if (!body || typeof body.raw_key !== 'string' || !body.raw_key || !body.api_key) {
      throw new RaphaError('upstream', 'RAPHA returned an invalid response');
    }
    return body;
  }

  /** POST api-keys/{id}/revoke — no secret returned. */
  async revokeTenantApiKey(tenantId: string, keyId: string): Promise<void> {
    await this.serviceKeyRequest(tenantId, `api-keys/${encodeURIComponent(keyId)}/revoke`, 'POST');
  }
}
