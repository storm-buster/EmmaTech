import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { AppConfig } from './config.js';
import { hashPassword, verifyPassword } from './password.js';
import { InMemoryStore } from './store/memory.js';
import { DuplicateEmailError } from './store/types.js';
import {
  getAccountForUser,
  login,
  provisionOrganizationTenant,
  signup,
  toPublicUser,
  ValidationError,
} from './service.js';

const SERVICE_TOKEN = 'super-secret-service-token-value';

function cfg(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    isProduction: false,
    sessionSecret: 'x',
    raphaBaseUrl: 'https://rapha.test',
    raphaServiceToken: SERVICE_TOKEN,
    databaseUrl: null,
    ...overrides,
  };
}

function tenantBody(externalCustomerId: string) {
  return {
    tenant_id: `tenant-${externalCustomerId}`,
    name: 'Acme',
    external_customer_id: externalCustomerId,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

/** fetch mock that echoes the external_customer_id from the request body. */
function fetchOk() {
  return vi.fn(async (_url: string, init: RequestInit) => {
    const parsed = JSON.parse(init.body as string) as { external_customer_id: string };
    return { status: 201, ok: true, json: async () => tenantBody(parsed.external_customer_id) };
  });
}

let store: InMemoryStore;

beforeEach(() => {
  store = new InMemoryStore();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const validSignup = {
  email: 'Owner@Example.com ',
  password: 'a-strong-password',
  name: 'Owner One',
  organizationName: 'Acme Inc',
};

describe('signup', () => {
  it('creates user + active organization + owner membership and hashes the password', async () => {
    vi.stubGlobal('fetch', fetchOk());
    const result = await signup(store, cfg(), validSignup, hashPassword);

    expect(result.user.email).toBe('owner@example.com'); // normalized
    expect(result.role).toBe('owner');
    expect(result.organization.status).toBe('active');
    expect(result.organization.rapha_tenant_id).toBe(`tenant-${result.organization.id}`);

    // password stored as scrypt hash, never plaintext
    expect(result.user.password_hash.startsWith('scrypt$')).toBe(true);
    expect(result.user.password_hash).not.toContain('a-strong-password');

    // owner membership exists
    const primary = await store.getPrimaryMembershipForUser(result.user.id);
    expect(primary?.role).toBe('owner');
  });

  it('uses the organization id (not user id) as external_customer_id', async () => {
    const fetchMock = fetchOk();
    vi.stubGlobal('fetch', fetchMock);
    const result = await signup(store, cfg(), validSignup, hashPassword);

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string) as { external_customer_id: string };
    expect(body.external_customer_id).toBe(result.organization.id);
    expect(body.external_customer_id).not.toBe(result.user.id);
  });

  it('rejects a duplicate email (no duplicate account)', async () => {
    vi.stubGlobal('fetch', fetchOk());
    await signup(store, cfg(), validSignup, hashPassword);
    await expect(signup(store, cfg(), validSignup, hashPassword)).rejects.toBeInstanceOf(
      DuplicateEmailError,
    );
  });

  it('rejects an invalid email', async () => {
    vi.stubGlobal('fetch', fetchOk());
    await expect(
      signup(store, cfg(), { ...validSignup, email: 'not-an-email' }, hashPassword),
    ).rejects.toMatchObject({ name: 'ValidationError', field: 'email' });
  });

  it('rejects a too-short password', async () => {
    vi.stubGlobal('fetch', fetchOk());
    await expect(
      signup(store, cfg(), { ...validSignup, password: 'short' }, hashPassword),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('never returns the RAPHA service token in the result', async () => {
    vi.stubGlobal('fetch', fetchOk());
    const result = await signup(store, cfg(), validSignup, hashPassword);
    expect(JSON.stringify(result)).not.toContain(SERVICE_TOKEN);
  });
});

describe('signup — RAPHA provisioning failure handling', () => {
  function fetchStatus(status: number) {
    return vi.fn(async () => ({ status, ok: status < 400, json: async () => ({}) }));
  }

  it('marks organization pending on RAPHA 409 (no fabricated tenant id)', async () => {
    vi.stubGlobal('fetch', fetchStatus(409));
    const result = await signup(store, cfg(), validSignup, hashPassword);
    expect(result.organization.status).toBe('pending');
    expect(result.organization.rapha_tenant_id).toBeNull();
  });

  it('marks organization failed on RAPHA 401 (not silently successful)', async () => {
    vi.stubGlobal('fetch', fetchStatus(401));
    const result = await signup(store, cfg(), validSignup, hashPassword);
    expect(result.organization.status).toBe('failed');
    expect(result.organization.rapha_tenant_id).toBeNull();
  });

  it('marks organization failed on RAPHA 5xx', async () => {
    vi.stubGlobal('fetch', fetchStatus(503));
    const result = await signup(store, cfg(), validSignup, hashPassword);
    expect(result.organization.status).toBe('failed');
  });

  it('marks organization failed when RAPHA is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('network down');
      }),
    );
    const result = await signup(store, cfg(), validSignup, hashPassword);
    expect(result.organization.status).toBe('failed');
  });
});

describe('provisionOrganizationTenant — idempotency & controlled retry', () => {
  it('is a no-op when already active', async () => {
    const fetchMock = fetchOk();
    vi.stubGlobal('fetch', fetchMock);
    const result = await signup(store, cfg(), validSignup, hashPassword);
    expect(result.organization.status).toBe('active');
    const callsAfterSignup = fetchMock.mock.calls.length;

    const again = await provisionOrganizationTenant(store, cfg(), result.organization);
    expect(again.outcome).toBe('noop');
    expect(fetchMock.mock.calls.length).toBe(callsAfterSignup); // no extra RAPHA call
  });

  it('recovers a previously-failed organization on retry (single controlled call)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 503, ok: false, json: async () => ({}) })));
    const result = await signup(store, cfg(), validSignup, hashPassword);
    expect(result.organization.status).toBe('failed');

    vi.stubGlobal('fetch', fetchOk());
    const retry = await provisionOrganizationTenant(store, cfg(), result.organization);
    expect(retry.outcome).toBe('active');
    expect(retry.organization.rapha_tenant_id).toBe(`tenant-${result.organization.id}`);
  });
});

describe('signup — plan to RAPHA capability synchronization', () => {
  /** Records calls and returns 201 for tenant create + 200 for capability sync. */
  function fetchRecording() {
    const calls: Array<{ url: string; method: string; body: Record<string, unknown> }> = [];
    const fn = vi.fn(async (url: string, init: RequestInit) => {
      const body = JSON.parse((init.body as string) || '{}') as Record<string, unknown>;
      calls.push({ url, method: (init.method as string) ?? 'GET', body });
      if (url.endsWith('/capabilities')) {
        return {
          status: 200,
          ok: true,
          json: async () => ({
            tenant_id: 't',
            external_customer_id: body.external_customer_id ?? null,
            plan: body.plan,
            sensor_limit: body.sensor_limit === 'unlimited' ? null : body.sensor_limit,
            decoys_enabled: body.decoys_enabled,
            status: 'active',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          }),
        };
      }
      return { status: 201, ok: true, json: async () => tenantBody(String(body.external_customer_id)) };
    });
    return { fn, calls };
  }

  it('syncs FREE capabilities (sensor_limit=1, decoys=false) to RAPHA on provisioning', async () => {
    const { fn, calls } = fetchRecording();
    vi.stubGlobal('fetch', fn);
    const result = await signup(store, cfg(), validSignup, hashPassword);
    expect(result.organization.status).toBe('active');

    const patch = calls.find((c) => c.method === 'PATCH' && c.url.endsWith('/capabilities'));
    expect(patch).toBeTruthy();
    expect(patch?.url).toBe(
      `https://rapha.test/api/v1/service/tenants/tenant-${result.organization.id}/capabilities`,
    );
    expect(patch?.body).toEqual({ plan: 'free', sensor_limit: 1, decoys_enabled: false });
  });

  it('marks the org failed (preserving tenant id) when capability sync fails after tenant creation', async () => {
    const fn = vi.fn(async (url: string, init: RequestInit) => {
      const body = JSON.parse((init.body as string) || '{}') as { external_customer_id?: string };
      if (url.endsWith('/capabilities')) {
        return { status: 503, ok: false, json: async () => ({}) };
      }
      return { status: 201, ok: true, json: async () => tenantBody(String(body.external_customer_id)) };
    });
    vi.stubGlobal('fetch', fn);

    const result = await signup(store, cfg(), validSignup, hashPassword);
    expect(result.organization.status).toBe('failed');
    expect(result.organization.rapha_tenant_id).toBe(`tenant-${result.organization.id}`);
  });
});

describe('login', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchOk());
  });

  it('returns the user on valid credentials', async () => {
    await signup(store, cfg(), validSignup, hashPassword);
    const user = await login(
      store,
      { email: 'owner@example.com', password: 'a-strong-password' },
      verifyPassword,
    );
    expect(user?.email).toBe('owner@example.com');
  });

  it('returns null on wrong password', async () => {
    await signup(store, cfg(), validSignup, hashPassword);
    expect(
      await login(store, { email: 'owner@example.com', password: 'WRONG' }, verifyPassword),
    ).toBeNull();
  });

  it('returns null for an unknown account', async () => {
    expect(
      await login(store, { email: 'nobody@example.com', password: 'whatever123' }, verifyPassword),
    ).toBeNull();
  });
});

describe('cross-organization isolation', () => {
  it('only returns the caller’s own organization', async () => {
    vi.stubGlobal('fetch', fetchOk());
    const a = await signup(
      store,
      cfg(),
      { ...validSignup, email: 'a@example.com', organizationName: 'Org A' },
      hashPassword,
    );
    const b = await signup(
      store,
      cfg(),
      { ...validSignup, email: 'b@example.com', organizationName: 'Org B' },
      hashPassword,
    );

    const accountA = await getAccountForUser(store, a.user.id);
    const accountB = await getAccountForUser(store, b.user.id);

    expect(accountA?.organization?.id).toBe(a.organization.id);
    expect(accountA?.organization?.name).toBe('Org A');
    // A must never see B's organization
    expect(accountA?.organization?.id).not.toBe(b.organization.id);
    expect(accountB?.organization?.id).toBe(b.organization.id);
  });
});

describe('toPublicUser', () => {
  it('excludes the password hash', async () => {
    vi.stubGlobal('fetch', fetchOk());
    const result = await signup(store, cfg(), validSignup, hashPassword);
    const publicUser = toPublicUser(result.user);
    expect(Object.keys(publicUser).sort()).toEqual(['created_at', 'email', 'id', 'name']);
    expect(JSON.stringify(publicUser)).not.toContain('scrypt$');
  });
});
