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
    expires_at: token.expires_at,
  };
}
