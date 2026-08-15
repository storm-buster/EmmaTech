/**
 * Store factory.
 *
 * Production persistence MUST be a durable PostgreSQL store. When
 * DATABASE_URL is configured the PostgresStore is used. When it is absent the
 * in-memory store is used ONLY in non-production (tests / local dev).
 *
 * In production we FAIL CLOSED: rather than silently falling back to the
 * ephemeral in-memory store (which would silently lose every account,
 * organization, and RAPHA tenant association on each cold start and give no
 * cross-instance consistency), we throw a ConfigError. Handlers surface this
 * as a 503 "not configured" and never operate on volatile storage in prod.
 */
import type { AppConfig } from '../config.js';
import { ConfigError } from '../config.js';
import type { DataStore } from './types.js';
import { InMemoryStore } from './memory.js';
import { PostgresStore } from './postgres.js';

let memorySingleton: InMemoryStore | null = null;
let postgresSingleton: PostgresStore | null = null;

export function getStore(cfg: AppConfig): DataStore {
  if (cfg.databaseUrl) {
    if (!postgresSingleton) {
      postgresSingleton = new PostgresStore(cfg.databaseUrl);
    }
    return postgresSingleton;
  }
  if (cfg.isProduction) {
    // Never use volatile in-memory storage in production.
    throw new ConfigError(
      'DATABASE_URL is required in production; refusing to use the in-memory store',
    );
  }
  if (!memorySingleton) {
    memorySingleton = new InMemoryStore();
  }
  return memorySingleton;
}

/** Test helper: reset the in-memory store between tests. */
export function __resetInMemoryStore(): void {
  memorySingleton = new InMemoryStore();
}
