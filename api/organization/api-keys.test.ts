import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import apiKeysHandler from './api-keys.js';
import { getConfig } from '../_lib/config.js';
import { __resetInMemoryStore, getStore } from '../_lib/store/index.js';
import { createSessionToken, SESSION_COOKIE_NAME } from '../_lib/session.js';
import { apiKeysAvailable } from '../_lib/apikeys.js';
import { DEFAULT_PLAN_ID } from '../../src/shared/plans.js';

const SECRET = 'api-keys-test-session-secret';
const SERVICE_TOKEN = 'test-service-token-value';
const SERVER_TENANT = 'tenant-x';
const RAPHA_HASH = 'sha256-should-never-leak';

function makeReq(opts: {
  method: string;
  cookie?: string;
  body?: unknown;
  query?: Record<string, string>;
}): VercelRequest {
  return {
    method: opts.method,
    headers: opts.cookie ? { cookie: opts.cookie } : {},
    body: opts.body,
    query: opts.query ?? {},
  } as unknown as VercelRequest;
}

interface ResState {
  statusCode: number;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

function makeRes(): { res: VercelResponse; state: ResState } {
  const state: ResState = { statusCode: 0, body: {}, headers: {} };
  const res = {
    setHeader(k: string, v: string) {
      state.headers[k.toLowerCase()] = v;
      return this;
    },
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      state.body = payload as Record<string, unknown>;
      return this;
    },
  } as unknown as VercelResponse;
  return { res, state };
}

async function seedUserWithOrg(raphaTenantId: string | null = SERVER_TENANT) {
  const store = getStore(getConfig());
  const user = await store.createUser({
    email: 'owner@example.com',
    password_hash: 'scrypt$fake',
    name: 'Owner',
  });
  const org = await store.createOrganization({
    name: 'Acme',
    plan: DEFAULT_PLAN_ID,
    status: 'active',
    rapha_tenant_id: raphaTenantId,
  });
  await store.createMembership({ user_id: user.id, organization_id: org.id, role: 'owner' });
  return { user, org };
}

function cookieFor(userId: string): string {
  return `${SESSION_COOKIE_NAME}=${createSessionToken(userId, SECRET)}`;
}

/** Mock RAPHA. Success bodies deliberately INCLUDE a key_hash to prove EmmaTech
 *  strips it. Set `status` to simulate upstream errors. */
function mockRapha(status = 200) {
  return vi.fn(async (url: string, init: RequestInit) => {
    const path = String(url);
    const method = (init?.method as string) ?? 'GET';
    const ok = status >= 200 && status < 300;
    let body: unknown = {};
    if (ok) {
      if (method === 'GET') {
        body = {
          api_keys: [
            {
              id: 'k1',
              name: 'CI',
              scopes: ['ingest'],
              created_at: '2026-01-01T00:00:00Z',
              revoked_at: null,
              key_hash: RAPHA_HASH,
            },
          ],
        };
      } else if (path.endsWith('/revoke')) {
        body = { id: 'k1', status: 'revoked' };
      } else {
        // create or rotate
        body = {
          api_key: {
            id: 'k2',
            name: 'New',
            scopes: ['ingest'],
            created_at: '2026-01-02T00:00:00Z',
            revoked_at: null,
            key_hash: RAPHA_HASH,
          },
          raw_key: 'rapha_raw_ABC123',
          key_hash: RAPHA_HASH,
        };
      }
    }
    return { status, ok, json: async () => body } as unknown as Response;
  });
}

beforeEach(() => {
  process.env.SESSION_SECRET = SECRET;
  process.env.NODE_ENV = 'test';
  process.env.RAPHA_BASE_URL = 'https://rapha.test';
  process.env.RAPHA_SERVICE_TOKEN = SERVICE_TOKEN;
  delete process.env.DATABASE_URL;
  __resetInMemoryStore();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('/api/organization/api-keys — auth & method', () => {
  it('unauthenticated GET → 401 (never calls RAPHA)', async () => {
    const fetchMock = mockRapha();
    vi.stubGlobal('fetch', fetchMock);
    const { res, state } = makeRes();
    await apiKeysHandler(makeReq({ method: 'GET' }), res);
    expect(state.statusCode).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('unauthenticated POST → 401', async () => {
    const { res, state } = makeRes();
    await apiKeysHandler(makeReq({ method: 'POST', body: { action: 'create', name: 'x' } }), res);
    expect(state.statusCode).toBe(401);
  });

  it('unsupported method → 405', async () => {
    const { res, state } = makeRes();
    await apiKeysHandler(makeReq({ method: 'PUT' }), res);
    expect(state.statusCode).toBe(405);
  });

  it('no organization → 404', async () => {
    const store = getStore(getConfig());
    const user = await store.createUser({ email: 'n@e.com', password_hash: 'scrypt$fake', name: 'N' });
    const { res, state } = makeRes();
    await apiKeysHandler(makeReq({ method: 'GET', cookie: cookieFor(user.id) }), res);
    expect(state.statusCode).toBe(404);
  });

  it('organization not provisioned (no rapha_tenant_id) → 409', async () => {
    const { user } = await seedUserWithOrg(null);
    const { res, state } = makeRes();
    await apiKeysHandler(makeReq({ method: 'GET', cookie: cookieFor(user.id) }), res);
    expect(state.statusCode).toBe(409);
  });

  it('never returns 501', async () => {
    vi.stubGlobal('fetch', mockRapha());
    const { user } = await seedUserWithOrg();
    const { res, state } = makeRes();
    await apiKeysHandler(makeReq({ method: 'GET', cookie: cookieFor(user.id) }), res);
    expect(state.statusCode).not.toBe(501);
  });
});

describe('/api/organization/api-keys — list', () => {
  it('GET lists keys via the SERVER tenant, sends X-Service-Token, strips key_hash', async () => {
    const fetchMock = mockRapha();
    vi.stubGlobal('fetch', fetchMock);
    const { user } = await seedUserWithOrg();
    const { res, state } = makeRes();
    await apiKeysHandler(
      makeReq({ method: 'GET', cookie: cookieFor(user.id), query: { tenant_id: 'tnt-EVIL' } }),
      res,
    );
    expect(state.statusCode).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/v1/service/tenants/${SERVER_TENANT}/api-keys`);
    expect(url).not.toContain('tnt-EVIL'); // client tenant_id ignored
    expect((init.headers as Record<string, string>)['X-Service-Token']).toBe(SERVICE_TOKEN);
    // Response sanitized: no key_hash, no service token.
    expect(JSON.stringify(state.body)).not.toContain(RAPHA_HASH);
    expect(JSON.stringify(state.body)).not.toContain('key_hash');
    expect(JSON.stringify(state.body)).not.toContain(SERVICE_TOKEN);
    const keys = state.body.api_keys as Array<Record<string, unknown>>;
    expect(keys[0]).toEqual({
      id: 'k1',
      name: 'CI',
      scopes: ['ingest'],
      created_at: '2026-01-01T00:00:00Z',
      revoked_at: null,
    });
  });
});

describe('/api/organization/api-keys — create', () => {
  it('creates a key, returns raw_key once, sanitized api_key, no key_hash/token', async () => {
    const fetchMock = mockRapha();
    vi.stubGlobal('fetch', fetchMock);
    const { user } = await seedUserWithOrg();
    const { res, state } = makeRes();
    await apiKeysHandler(
      makeReq({
        method: 'POST',
        cookie: cookieFor(user.id),
        body: { action: 'create', name: 'SIEM', scopes: ['ingest'], tenant_id: 'tnt-EVIL' },
      }),
      res,
    );
    expect(state.statusCode).toBe(201);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/v1/service/tenants/${SERVER_TENANT}/api-keys`);
    expect(url).not.toContain('tnt-EVIL');
    expect((init.method as string)).toBe('POST');
    expect(state.body.raw_key).toBe('rapha_raw_ABC123');
    expect(JSON.stringify(state.body)).not.toContain(RAPHA_HASH);
    expect(JSON.stringify(state.body)).not.toContain('key_hash');
    expect(JSON.stringify(state.body)).not.toContain(SERVICE_TOKEN);
    expect((state.body.api_key as Record<string, unknown>).id).toBe('k2');
  });

  it('rejects a missing name → 400 (no RAPHA call)', async () => {
    const fetchMock = mockRapha();
    vi.stubGlobal('fetch', fetchMock);
    const { user } = await seedUserWithOrg();
    const { res, state } = makeRes();
    await apiKeysHandler(
      makeReq({ method: 'POST', cookie: cookieFor(user.id), body: { action: 'create', name: '  ' } }),
      res,
    );
    expect(state.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid scopes → 400 (no RAPHA call)', async () => {
    const fetchMock = mockRapha();
    vi.stubGlobal('fetch', fetchMock);
    const { user } = await seedUserWithOrg();
    const { res, state } = makeRes();
    await apiKeysHandler(
      makeReq({
        method: 'POST',
        cookie: cookieFor(user.id),
        body: { action: 'create', name: 'x', scopes: ['admin'] },
      }),
      res,
    );
    expect(state.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('defaults scopes to ingest when omitted', async () => {
    const fetchMock = mockRapha();
    vi.stubGlobal('fetch', fetchMock);
    const { user } = await seedUserWithOrg();
    const { res, state } = makeRes();
    await apiKeysHandler(
      makeReq({ method: 'POST', cookie: cookieFor(user.id), body: { action: 'create', name: 'x' } }),
      res,
    );
    expect(state.statusCode).toBe(201);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).scopes).toEqual(['ingest']);
  });
});

describe('/api/organization/api-keys — rotate & revoke', () => {
  it('rotate calls the per-key rotate path and returns a new raw_key', async () => {
    const fetchMock = mockRapha();
    vi.stubGlobal('fetch', fetchMock);
    const { user } = await seedUserWithOrg();
    const { res, state } = makeRes();
    await apiKeysHandler(
      makeReq({ method: 'POST', cookie: cookieFor(user.id), body: { action: 'rotate', key_id: 'k1' } }),
      res,
    );
    expect(state.statusCode).toBe(200);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/v1/service/tenants/${SERVER_TENANT}/api-keys/k1/rotate`);
    expect(state.body.raw_key).toBe('rapha_raw_ABC123');
    expect(JSON.stringify(state.body)).not.toContain('key_hash');
  });

  it('revoke calls the per-key revoke path and returns sanitized status', async () => {
    const fetchMock = mockRapha();
    vi.stubGlobal('fetch', fetchMock);
    const { user } = await seedUserWithOrg();
    const { res, state } = makeRes();
    await apiKeysHandler(
      makeReq({ method: 'POST', cookie: cookieFor(user.id), body: { action: 'revoke', key_id: 'k1' } }),
      res,
    );
    expect(state.statusCode).toBe(200);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/api/v1/service/tenants/${SERVER_TENANT}/api-keys/k1/revoke`);
    expect(state.body).toEqual({ id: 'k1', status: 'revoked' });
    expect(JSON.stringify(state.body)).not.toContain(SERVICE_TOKEN);
  });

  it('rotate/revoke require a key_id → 400', async () => {
    vi.stubGlobal('fetch', mockRapha());
    const { user } = await seedUserWithOrg();
    for (const action of ['rotate', 'revoke']) {
      const { res, state } = makeRes();
      await apiKeysHandler(
        makeReq({ method: 'POST', cookie: cookieFor(user.id), body: { action } }),
        res,
      );
      expect(state.statusCode).toBe(400);
    }
  });
});

describe('/api/organization/api-keys — upstream error mapping', () => {
  it('RAPHA 404 → 409 (not_found mapped by existing error handling)', async () => {
    vi.stubGlobal('fetch', mockRapha(404));
    const { user } = await seedUserWithOrg();
    const { res, state } = makeRes();
    await apiKeysHandler(
      makeReq({ method: 'POST', cookie: cookieFor(user.id), body: { action: 'rotate', key_id: 'missing' } }),
      res,
    );
    expect(state.statusCode).toBe(409);
    expect(JSON.stringify(state.body)).not.toContain(SERVICE_TOKEN);
  });

  it('RAPHA 401/403 → 502 (auth mapped generically)', async () => {
    vi.stubGlobal('fetch', mockRapha(403));
    const { user } = await seedUserWithOrg();
    const { res, state } = makeRes();
    await apiKeysHandler(makeReq({ method: 'GET', cookie: cookieFor(user.id) }), res);
    expect(state.statusCode).toBe(502);
  });
});

describe('apiKeysAvailable gate', () => {
  it('is true when RAPHA is configured', () => {
    expect(apiKeysAvailable(getConfig())).toBe(true);
  });

  it('is false (→ endpoint 503) when RAPHA is not configured', async () => {
    delete process.env.RAPHA_BASE_URL;
    delete process.env.RAPHA_SERVICE_TOKEN;
    expect(apiKeysAvailable(getConfig())).toBe(false);
    const { user } = await seedUserWithOrg();
    const { res, state } = makeRes();
    await apiKeysHandler(makeReq({ method: 'GET', cookie: cookieFor(user.id) }), res);
    expect(state.statusCode).toBe(503);
  });
});
