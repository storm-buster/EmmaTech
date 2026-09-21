/**
 * Server-side configuration for EmmaTech Phase 1 (identity + organization).
 *
 * All values are read from server-side environment variables at call time
 * (not module load) so they are easy to configure per-request and per-test.
 *
 * SECURITY: none of these values are ever prefixed with VITE_, so they are
 * never bundled into the browser. RAPHA_SERVICE_TOKEN and SESSION_SECRET are
 * secrets and must never be returned to clients or logged.
 */

export interface AppConfig {
  isProduction: boolean;
  /** HMAC secret used to sign session cookies. Required to issue/verify sessions. */
  sessionSecret: string;
  /** Base URL of the RAPHA control plane (server-to-server only). */
  raphaBaseUrl: string;
  /** Trusted service token for RAPHA server-to-server calls (secret). */
  raphaServiceToken: string;
  /** Postgres connection string. When absent, the in-memory store is used (dev/test). */
  databaseUrl: string | null;
  /** Resend API key for transactional email (signup OTP). Secret; null when unset. */
  resendApiKey: string | null;
  /** Verified "from" address for OTP emails (e.g. "EmmaTech <noreply@emmatech.in>"). */
  otpEmailFrom: string | null;
  /** Pathname of the RAPHA agent package object in the PRIVATE Blob store. */
  agentPackagePathname: string;
  /** True when a private Blob store is reachable (OIDC store id or RW token present). */
  blobConfigured: boolean;
  /**
   * Allowlist of internal STAFF user ids permitted to access internal-only,
   * read-only surfaces (e.g. Phase 5.3 aggregate acquisition reporting).
   *
   * Parsed from REPORTING_STAFF_USER_IDS (comma-separated user ids). This is an
   * explicit allowlist — an empty set means NO ONE is staff (fail closed); it is
   * NEVER interpreted as "allow everyone". It is distinct from, and independent
   * of, organization membership/roles (an org `owner` is NOT staff).
   */
  staffUserIds: ReadonlySet<string>;
}

/** Conservative user-id shape for allowlist entries (UUIDs and similar opaque
 *  ids). Rejects entries containing spaces, wildcards, or control characters so
 *  a malformed value can never widen authorization. */
const STAFF_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Parse the comma-separated staff allowlist into a de-duplicated set of
 * well-formed user ids. Blank, malformed, or wildcard-like entries are dropped
 * (never authorized). An absent/empty/all-invalid value yields an EMPTY set,
 * which the staff gate treats as "deny all".
 */
export function parseStaffAllowlist(raw: string | undefined | null): ReadonlySet<string> {
  const out = new Set<string>();
  if (typeof raw !== 'string') return out;
  for (const part of raw.split(',')) {
    const id = part.trim();
    if (id && STAFF_ID_RE.test(id)) out.add(id);
  }
  return out;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export function getConfig(): AppConfig {
  const isProduction = (process.env.NODE_ENV ?? '').toLowerCase() === 'production';
  return {
    isProduction,
    sessionSecret: (process.env.SESSION_SECRET ?? '').trim(),
    raphaBaseUrl: (process.env.RAPHA_BASE_URL ?? '').trim(),
    raphaServiceToken: (process.env.RAPHA_SERVICE_TOKEN ?? '').trim(),
    databaseUrl: (process.env.DATABASE_URL ?? '').trim() || null,
    resendApiKey: (process.env.RESEND_API_KEY ?? '').trim() || null,
    otpEmailFrom: (process.env.OTP_EMAIL_FROM ?? '').trim() || null,
    agentPackagePathname: (process.env.RAPHA_AGENT_BLOB_PATHNAME ?? '').trim() || 'rapha-agent-1.0.1-windows.zip',
    // On Vercel, a private store connected to the project provides OIDC + BLOB_STORE_ID
    // automatically; outside Vercel a BLOB_READ_WRITE_TOKEN is used. Either indicates
    // the private store is configured for reads.
    blobConfigured: Boolean((process.env.BLOB_READ_WRITE_TOKEN ?? '').trim() || (process.env.BLOB_STORE_ID ?? '').trim()),
    staffUserIds: parseStaffAllowlist(process.env.REPORTING_STAFF_USER_IDS),
  };
}

/** Returns the session secret or throws a ConfigError if it is not configured. */
export function requireSessionSecret(cfg: AppConfig): string {
  if (!cfg.sessionSecret) {
    throw new ConfigError('SESSION_SECRET is not configured');
  }
  return cfg.sessionSecret;
}
