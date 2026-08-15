import { describe, it, expect } from 'vitest';
import type { AppConfig } from '../config.js';
import { ConfigError } from '../config.js';
import { getStore } from './index.js';
import { InMemoryStore } from './memory.js';

function cfg(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    isProduction: false,
    sessionSecret: 'x',
    raphaBaseUrl: 'https://rapha.test',
    raphaServiceToken: 't',
    databaseUrl: null,
    ...overrides,
  };
}

describe('getStore — production fail-closed persistence', () => {
  it('throws ConfigError in production when DATABASE_URL is absent (no silent in-memory fallback)', () => {
    expect(() => getStore(cfg({ isProduction: true, databaseUrl: null }))).toThrow(ConfigError);
  });

  it('does NOT return an in-memory store in production', () => {
    let store: unknown = null;
    try {
      store = getStore(cfg({ isProduction: true, databaseUrl: null }));
    } catch {
      store = null;
    }
    expect(store).not.toBeInstanceOf(InMemoryStore);
    expect(store).toBeNull();
  });

  it('uses the in-memory store in non-production when DATABASE_URL is absent', () => {
    const store = getStore(cfg({ isProduction: false, databaseUrl: null }));
    expect(store).toBeInstanceOf(InMemoryStore);
  });

  it('uses a durable (non in-memory) store when DATABASE_URL is set, even in production', () => {
    const store = getStore(
      cfg({ isProduction: true, databaseUrl: 'postgres://user:pass@localhost:5432/db' }),
    );
    // Postgres store is selected; it must never be the in-memory store.
    expect(store).not.toBeInstanceOf(InMemoryStore);
  });
});
