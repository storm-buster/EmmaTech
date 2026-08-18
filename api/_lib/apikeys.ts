/**
 * Customer-facing RAPHA API-key management — EmmaTech-side abstraction.
 *
 * RAPHA (control plane) now exposes the trusted service-level API-key contract:
 *   GET    /api/v1/service/tenants/{tenant_id}/api-keys
 *   POST   /api/v1/service/tenants/{tenant_id}/api-keys                { name, scopes }
 *   POST   /api/v1/service/tenants/{tenant_id}/api-keys/{id}/rotate
 *   POST   /api/v1/service/tenants/{tenant_id}/api-keys/{id}/revoke
 *   Auth: X-Service-Token (server-side only). Tenant resolved server-side.
 *
 * RAPHA returns the raw key EXACTLY ONCE on create/rotate and stores only its
 * SHA-256 hash (never returned). EmmaTech NEVER mints, stores, or logs a raw
 * RAPHA API key; it only proxies the RAPHA contract for the authenticated
 * customer's own (server-derived) tenant.
 */
import type { AppConfig } from './config.js';

/** Metadata for a customer API key (never the raw key or its hash). */
export interface ApiKeyMetadata {
  id: string;
  name: string;
  scopes: string[];
  created_at: string;
  revoked_at: string | null;
}

/** Raw-key result — returned to the customer exactly once, never persisted. */
export interface ApiKeyCreated {
  api_key: ApiKeyMetadata;
  /** Raw secret; shown once by RAPHA, never stored/logged by EmmaTech. */
  raw_key: string;
}

/**
 * Scopes EmmaTech will accept from the customer. RAPHA's current allow-list
 * contains only `ingest`; keep this in sync with the RAPHA contract. Requests
 * outside this set are rejected client-safe (400) before reaching RAPHA.
 */
export const SUPPORTED_API_KEY_SCOPES = ['ingest'] as const;
export type ApiKeyScope = (typeof SUPPORTED_API_KEY_SCOPES)[number];

/** Safe default when the customer does not specify scopes. */
export const DEFAULT_API_KEY_SCOPES: ApiKeyScope[] = ['ingest'];

/** True only when `scopes` is a non-empty array of supported scope strings. */
export function isValidApiKeyScopes(scopes: unknown): scopes is ApiKeyScope[] {
  return (
    Array.isArray(scopes) &&
    scopes.length > 0 &&
    scopes.every(
      (s): s is ApiKeyScope =>
        typeof s === 'string' && (SUPPORTED_API_KEY_SCOPES as readonly string[]).includes(s),
    )
  );
}

/**
 * Whether customer API-key management can be served. It requires a configured
 * RAPHA service (base URL + service token); the RAPHA API-key contract is now
 * live, so availability is driven purely by configuration (no artificial gate).
 */
export function apiKeysAvailable(cfg: AppConfig): boolean {
  return Boolean(cfg.raphaBaseUrl && cfg.raphaServiceToken);
}

/** Human-facing reason surfaced (503) when RAPHA is not configured. */
export const API_KEYS_UNAVAILABLE_REASON =
  'API-key management is temporarily unavailable because the RAPHA service is not configured.';
