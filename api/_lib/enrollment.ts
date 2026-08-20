/**
 * Enrollment orchestration (Phase 5).
 *
 * Resolves the authenticated user's organization → its RAPHA tenant
 * (server-authoritative; a tenant_id is NEVER accepted from the browser) and
 * asks RAPHA to mint a one-time enrollment token.
 *
 * SECURITY: the raw enrollment token is returned to the caller ONCE and is
 * never logged or persisted here. RAPHA remains authoritative for sensor
 * capacity and token expiry — EmmaTech does not count sensors or duplicate
 * RAPHA's sensor database.
 */
import type { AppConfig } from './config.js';
import { RaphaServiceClient } from './rapha.js';
import { getAccountForUser } from './service.js';
import type { DataStore } from './store/types.js';

export type EnrollmentErrorCode = 'no_organization' | 'not_provisioned';

export class EnrollmentError extends Error {
  readonly code: EnrollmentErrorCode;
  constructor(code: EnrollmentErrorCode, message: string) {
    super(message);
    this.name = 'EnrollmentError';
    this.code = code;
  }
}

export interface EnrollmentTokenResult {
  token_id: string;
  /** Raw one-time token (sensitive) — return once, never log/persist. */
  enrollment_token: string;
  status: string;
  created_at: string;
  expires_at: string;
}

/**
 * Normalize a RAPHA `expires_at` to a canonical ISO-8601 string.
 *
 * RAPHA may return the expiry as an ISO string OR a numeric epoch. The
 * production "January 1970" display bug was caused by RAPHA returning epoch
 * SECONDS which the browser then fed to `new Date(n)` (which expects ms).
 * Here we detect a numeric epoch and scale seconds → ms (values < 1e12 are
 * treated as seconds), so the client always receives a correct ISO timestamp.
 * Unknown/invalid input yields '' (the UI then shows no expiry rather than 1970).
 */
export function normalizeExpiryToIso(value: unknown): string {
  const isNumericString = typeof value === 'string' && /^\d+(\.\d+)?$/.test(value.trim());
  if (typeof value === 'number' || isNumericString) {
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(n) && n > 0) {
      const ms = n < 1e12 ? n * 1000 : n; // epoch seconds → ms
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    return '';
  }
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return '';
}

export async function requestEnrollmentToken(
  store: DataStore,
  cfg: AppConfig,
  userId: string,
  opts: { sensorName?: string } = {},
): Promise<EnrollmentTokenResult> {
  const account = await getAccountForUser(store, userId);
  if (!account || !account.organization) {
    throw new EnrollmentError('no_organization', 'No organization found for this account');
  }

  const org = account.organization;
  // Server-authoritative provisioning check. RAPHA (not EmmaTech) enforces
  // sensor capacity; here we only require a valid tenant mapping.
  if (org.status !== 'active' || !org.rapha_tenant_id) {
    throw new EnrollmentError(
      'not_provisioned',
      'Your RAPHA deployment is not ready yet',
    );
  }

  const client = new RaphaServiceClient(cfg);
  // Tenant id is taken from the org mapping, NOT from any client input.
  // expires_in_seconds is intentionally omitted → RAPHA applies its default TTL.
  const token = await client.createEnrollmentToken(org.rapha_tenant_id, {
    sensor_name: opts.sensorName,
  });

  return {
    token_id: token.token_id,
    enrollment_token: token.enrollment_token,
    status: token.status,
    created_at: token.created_at,
    expires_at: normalizeExpiryToIso(token.expires_at),
  };
}
