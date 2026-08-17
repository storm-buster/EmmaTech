import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import consoleHandler from './[resource].js';
import { __resetInMemoryStore, getStore } from '../_lib/store/index.js';
import { getConfig } from '../_lib/config.js';
import { createSessionToken, SESSION_COOKIE_NAME } from '../_lib/session.js';
import { DEFAULT_PLAN_ID } from '../../src/shared/plans.js';

const SERVICE_TOKEN = 'super-secret-service-token-value';
const SESSION_SECRET = 'phase7b2-test-secret';
const SERVER_TENANT = 'tnt-server-1';

function makeReq(opts: { method: string; cookie?: string; query?: Record<string, string> }): VercelRequest {
  return {
    method: opts.method,
    headers: opts.cookie ? { cookie: opts.cookie } : {},
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
    status(c: number) {
      state.statusCode = c;
      return this;
    },
    json(p: unknown) {
      state.body = p as Record<string, unknown>;
      return this;
    },
  } as unknown as VercelResponse;
  return { res, state };
}

async function seedSessionCookie(raphaTenantId: string | null = SERVER_TENANT): Promise<string> {
  const store = getStore(getConfig());
  const user = await store.createUser({ email: 'owner@example.com', password_hash: 'scrypt$fake', name: 'Owner' });
  const org = await store.createOrganization({
    name: 'Acme',
    plan: DEFAULT_PLAN_ID,
    status: 'active',
    rapha_tenant_id: raphaTenantId,
  });
  await store.createMembership({ user_id: user.id, organization_id: org.id, role: 'owner' });
  return `${SESSION_COOKIE_NAME}=${createSessionToken(user.id, SESSION_SECRET)}`;
}

/** fetch mock returning a given status; success bodies default to the correct array field. */
function mockUpstream(status = 200, body: Record<string, unknown> | null = null) {
  return vi.fn(async (url: string) => {
    const ok = status >= 200 && status < 300;
    const sub = url.split('?')[0].split('/').pop() ?? '';
    const defaults: Record<string, unknown> = {
      telemetry: { tenant_id: SERVER_TENANT, telemetry: [] },
      alerts: { tenant_id: SERVER_TENANT, alerts: [] },
      sensors: { tenant_id: SERVER_TENANT, sensors: [] },
      forensics: { tenant_id: SERVER_TENANT, forensics: [] },
    };
    return {
      status,
      ok,
      json: async () => body ?? defaults[sub] ?? {},
    } as unknown as Response;
  });
}

beforeEach(() => {
  process.env.SESSION_SECRET = SESSION_SECRET;
  process.env.RAPHA_BASE_URL = 'https://rapha.test';
  process.env.RAPHA_SERVICE_TOKEN = SERVICE_TOKEN;
  delete process.env.DATABASE_URL;
  process.env.NODE_ENV = 'test';
  __resetInMemoryStore();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const HANDLERS = [
  { name: 'telemetry', key: 'telemetry' },
  { name: 'alerts', key: 'alerts' },
  { name: 'sensors', key: 'sensors' },
  { name: 'forensics', key: 'forensics' },
] as const;

describe('console proxies — authentication', () => {
  for (const { name, key } of HANDLERS) {
    it(`${name}: unauthenticated request → 401 (never calls RAPHA)`, async () => {
      const fetchMock = mockUpstream();
      vi.stubGlobal('fetch', fetchMock);
      const { res, state } = makeRes();
      await consoleHandler(makeReq({ method: 'GET', query: { resource: key } }), res);
      expect(state.statusCode).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it(`${name}: non-GET → 405`, async () => {
      const { res, state } = makeRes();
      await consoleHandler(makeReq({ method: 'POST', query: { resource: key } }), res);
      expect(state.statusCode).toBe(405);
    });
  }
});

describe('console proxies — server-derived tenant + service token', () => {
  for (const { name, key } of HANDLERS) {
    it(`${name}: uses the SERVER tenant in the RAPHA path and sends X-Service-Token`, async () => {
      const cookie = await seedSessionCookie(SERVER_TENANT);
      const fetchMock = mockUpstream();
      vi.stubGlobal('fetch', fetchMock);
      const { res, state } = makeRes();
      await consoleHandler(makeReq({ method: 'GET', cookie, query: { resource: key } }), res);

      expect(state.statusCode).toBe(200);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain(`/api/v1/service/tenants/${SERVER_TENANT}/${key}`);
      expect((init.headers as Record<string, string>)['X-Service-Token']).toBe(SERVICE_TOKEN);
      expect(state.body.tenant_id).toBe(SERVER_TENANT);
      expect(JSON.stringify(state.body)).not.toContain(SERVICE_TOKEN);
      expect(url).not.toContain(SERVICE_TOKEN);
    });

    it(`${name}: ignores a client-supplied tenant_id`, async () => {
      const cookie = await seedSessionCookie(SERVER_TENANT);
      const fetchMock = mockUpstream();
      vi.stubGlobal('fetch', fetchMock);
      const { res } = makeRes();
      await consoleHandler(makeReq({ method: 'GET', cookie, query: { resource: key, tenant_id: 'tnt-EVIL', limit: '10' } }), res);
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain(`/tenants/${SERVER_TENANT}/`);
      expect(url).not.toContain('tnt-EVIL');
    });
  }
});

describe('console proxies — unknown resource', () => {
  it('unknown resource → 404 (never calls RAPHA)', async () => {
    const cookie = await seedSessionCookie(SERVER_TENANT);
    const fetchMock = mockUpstream();
    vi.stubGlobal('fetch', fetchMock);
    const { res, state } = makeRes();
    await consoleHandler(makeReq({ method: 'GET', cookie, query: { resource: 'bogus' } }), res);
    expect(state.statusCode).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('console proxies — org/tenant + upstream error mapping (telemetry representative)', () => {
  it('404 when the user has no organization', async () => {
    const store = getStore(getConfig());
    const user = await store.createUser({ email: 'noorg@example.com', password_hash: 'scrypt$fake', name: 'No Org' });
    const cookie = `${SESSION_COOKIE_NAME}=${createSessionToken(user.id, SESSION_SECRET)}`;
    vi.stubGlobal('fetch', mockUpstream());
    const { res, state } = makeRes();
    await consoleHandler(makeReq({ method: 'GET', cookie, query: { resource: 'telemetry' } }), res);
    expect(state.statusCode).toBe(404);
  });

  it('409 when the organization has no provisioned RAPHA tenant', async () => {
    const cookie = await seedSessionCookie(null);
    vi.stubGlobal('fetch', mockUpstream());
    const { res, state } = makeRes();
    await consoleHandler(makeReq({ method: 'GET', cookie, query: { resource: 'telemetry' } }), res);
    expect(state.statusCode).toBe(409);
  });

  it('maps RAPHA 403 → 502 (sanitized)', async () => {
    const cookie = await seedSessionCookie();
    vi.stubGlobal('fetch', mockUpstream(403));
    const { res, state } = makeRes();
    await consoleHandler(makeReq({ method: 'GET', cookie, query: { resource: 'telemetry' } }), res);
    expect(state.statusCode).toBe(502);
    expect(JSON.stringify(state.body)).not.toContain(SERVICE_TOKEN);
  });

  it('maps RAPHA 404 → 409', async () => {
    const cookie = await seedSessionCookie();
    vi.stubGlobal('fetch', mockUpstream(404));
    const { res, state } = makeRes();
    await consoleHandler(makeReq({ method: 'GET', cookie, query: { resource: 'telemetry' } }), res);
    expect(state.statusCode).toBe(409);
  });

  it('maps RAPHA 503 → 502', async () => {
    const cookie = await seedSessionCookie();
    vi.stubGlobal('fetch', mockUpstream(503));
    const { res, state } = makeRes();
    await consoleHandler(makeReq({ method: 'GET', cookie, query: { resource: 'telemetry' } }), res);
    expect(state.statusCode).toBe(502);
  });

  it('maps a network failure → 502', async () => {
    const cookie = await seedSessionCookie();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network down'); }));
    const { res, state } = makeRes();
    await consoleHandler(makeReq({ method: 'GET', cookie, query: { resource: 'telemetry' } }), res);
    expect(state.statusCode).toBe(502);
  });

  it('rejects an invalid limit with 400', async () => {
    const cookie = await seedSessionCookie();
    vi.stubGlobal('fetch', mockUpstream());
    const { res, state } = makeRes();
    await consoleHandler(makeReq({ method: 'GET', cookie, query: { resource: 'telemetry', limit: 'abc' } }), res);
    expect(state.statusCode).toBe(400);
  });

  it('returns tenant-scoped data on success', async () => {
    const cookie = await seedSessionCookie();
    vi.stubGlobal('fetch', mockUpstream(200, { tenant_id: SERVER_TENANT, telemetry: [{ sensor_id: 's1', tenant_id: SERVER_TENANT }] }));
    const { res, state } = makeRes();
    await consoleHandler(makeReq({ method: 'GET', cookie, query: { resource: 'telemetry' } }), res);
    expect(state.statusCode).toBe(200);
    expect(state.body.tenant_id).toBe(SERVER_TENANT);
    expect(Array.isArray(state.body.telemetry)).toBe(true);
  });
});
