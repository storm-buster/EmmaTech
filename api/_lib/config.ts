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
  };
}

/** Returns the session secret or throws a ConfigError if it is not configured. */
export function requireSessionSecret(cfg: AppConfig): string {
  if (!cfg.sessionSecret) {
    throw new ConfigError('SESSION_SECRET is not configured');
  }
  return cfg.sessionSecret;
}
