import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import enrollmentHandler from './enrollment-token.js';
import signupHandler from '../auth/signup.js';
import { __resetInMemoryStore, getStore } from '../_lib/store/index.js';
import { __resetRateLimits } from '../_lib/ratelimit.js';
import { getConfig } from '../_lib/config.js';
import { SESSION_COOKIE_NAME, createSessionToken } from '../_lib/session.js';

const SERVICE_TOKEN = 'super-secret-service-token-value';
const RAW_ENROLLMENT = 'renr_rawsecrettoken_value';
const SESSION_SECRET = 'phase5-test-session-secret';

interface ResState {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

function makeReq(opts: { method: string; body?: unknown; cookie?: string }): VercelRequest {
  return {
    method: opts.method,
    body: opts.body,
    headers: opts.cookie ? { cookie: opts.cookie } : {},
  } as unknown as VercelRequest;
}

function makeRes(): { res: VercelResponse; state: ResState } {
  const state: ResState = { statusCode: 0, body: undefined, headers: {} };
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
      state.body = p;
      return this;
    },
  } as unknown as VercelResponse;
  return { res, state };
}

function cookieFrom(state: ResState): string {
  const setCookie = state.headers['set-cookie'] ?? '';
  const token = setCookie.split(';')[0].split('=')[1] ?? '';
  return `${SESSION_COOKIE_NAME}=${token}`;
}

/** fetch mock branching on provision vs enrollment; provision echoes external_customer_id. */
function makeFetch(enrollmentStatus = 201) {
  return vi.fn(async (url: string, init: RequestInit) => {
    if (url.includes('/enrollment-tokens')) {
      const tenantId = url.split('/tenants/')[1].split('/')[0];
      if (enrollmentStatus !== 201 && enrollmentStatus !== 200) {
        return { status: enrollmentStatus, ok: false, json: async () => ({}) };
      }
      return {
        status: 201,
        ok: true,
        json: async () => ({
          token_id: 'tok_1',
          tenant_id: decodeURIComponent(tenantId),
          enrollment_token: RAW_ENROLLMENT,
          status: 'active',
          created_at: '2026-01-01T00:00:00Z',
          expires_at: '2026-01-02T00:00:00Z',
        }),
      };
    }
    // provision
    const parsed = JSON.parse(init.body as string) as { external_customer_id: string };
    return {
      status: 201,
      ok: true,
      json: async () => ({
        tenant_id: `tenant-${parsed.external_customer_id}`,
        name: 'Acme',
        external_customer_id: parsed.external_customer_id,
        status: 'active',
        created_at: '',
        updated_at: '',
      }),
    };
  });
}

const SIGNUP_BODY = {
  name: 'Owner One',
  organizationName: 'Acme Inc',
  email: 'owner@example.com',
  password: 'a-strong-password',
};

async function signupActiveOrg(): Promise<{ cookie: string; orgId: string }> {
  const signup = makeRes();
  await signupHandler(makeReq({ method: 'POST', body: SIGNUP_BODY }), signup.res);
  const body = signup.state.body as { organization: { id: string; status: string } };
  return { cookie: cookieFrom(signup.state), orgId: body.organization.id };
}

let consoleLogSpy: ReturnType<typeof vi.spyOn>;
let consoleErrSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  process.env.SESSION_SECRET = SESSION_SECRET;
  process.env.RAPHA_BASE_URL = 'https://rapha.test';
  process.env.RAPHA_SERVICE_TOKEN = SERVICE_TOKEN;
  delete process.env.DATABASE_URL;
  process.env.NODE_ENV = 'test';
  __resetInMemoryStore();
  __resetRateLimits();
  vi.stubGlobal('fetch', makeFetch());
  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  consoleErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('POST /api/organization/enrollment-token', () => {
  it('rejects a non-POST method with 405', async () => {
    const { res, state } = makeRes();
    await enrollmentHandler(makeReq({ method: 'GET' }), res);
    expect(state.statusCode).toBe(405);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { res, state } = makeRes();
    await enrollmentHandler(makeReq({ method: 'POST', body: {} }), res);
    expect(state.statusCode).toBe(401);
  });

  it('returns a one-time enrollment credential for the authenticated org', async () => {
    const { cookie } = await signupActiveOrg();
    const { res, state } = makeRes();
    await enrollmentHandler(makeReq({ method: 'POST', body: {}, cookie }), res);

    expect(state.statusCode).toBe(201);
    const body = state.body as Record<string, unknown>;
    expect(body.enrollment_token).toBe(RAW_ENROLLMENT);
    expect(body.token_id).toBe('tok_1');
    expect(typeof body.note).toBe('string');
  });

  it('derives the tenant id server-side and IGNORES a client-supplied tenant_id', async () => {
    const { cookie, orgId } = await signupActiveOrg();
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const callsBefore = fetchMock.mock.calls.length;

    const { res, state } = makeRes();
    await enrollmentHandler(
      makeReq({
        method: 'POST',
        body: { tenant_id: 'attacker-tenant', sensor_name: 'x' },
        cookie,
      }),
      res,
    );
    expect(state.statusCode).toBe(201);

    // The enrollment call must target the org's REAL tenant, never the injected one.
    const enrollCall = fetchMock.mock.calls
      .slice(callsBefore)
      .find((c) => String(c[0]).includes('/enrollment-tokens'));
    expect(enrollCall).toBeDefined();
    const url = String(enrollCall![0]);
    expect(url).toContain(`/tenants/tenant-${orgId}/enrollment-tokens`);
    expect(url).not.toContain('attacker-tenant');
  });

  it('returns 404 when the account has no organization', async () => {
    // Create a user with no organization/membership and forge its session.
    const store = getStore(getConfig());
    const user = await store.createUser({
      email: 'orphan@example.com',
      password_hash: 'x',
      name: 'Orphan',
    });
    const token = createSessionToken(user.id, SESSION_SECRET);
    const { res, state } = makeRes();
    await enrollmentHandler(
      makeReq({ method: 'POST', body: {}, cookie: `${SESSION_COOKIE_NAME}=${token}` }),
      res,
    );
    expect(state.statusCode).toBe(404);
  });

  it('returns 409 when the RAPHA tenant is not provisioned', async () => {
    // Provisioning fails → org status 'failed', no tenant id.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 503, ok: false, json: async () => ({}) })),
    );
    const signup = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: SIGNUP_BODY }), signup.res);
    const cookie = cookieFrom(signup.state);

    const { res, state } = makeRes();
    await enrollmentHandler(makeReq({ method: 'POST', body: {}, cookie }), res);
    expect(state.statusCode).toBe(409);
  });

  it('maps RAPHA 429 to a 429 with a safe message', async () => {
    const { cookie } = await signupActiveOrg();
    vi.stubGlobal('fetch', makeFetch(429));
    const { res, state } = makeRes();
    await enrollmentHandler(makeReq({ method: 'POST', body: {}, cookie }), res);
    expect(state.statusCode).toBe(429);
    expect(JSON.stringify(state.body)).not.toContain(SERVICE_TOKEN);
  });

  it('maps RAPHA 401 (bad service creds) to a generic 502 — no service-token leak', async () => {
    const { cookie } = await signupActiveOrg();
    vi.stubGlobal('fetch', makeFetch(401));
    const { res, state } = makeRes();
    await enrollmentHandler(makeReq({ method: 'POST', body: {}, cookie }), res);
    expect(state.statusCode).toBe(502);
    const serialized = JSON.stringify(state.body);
    expect(serialized).not.toContain(SERVICE_TOKEN);
    expect(serialized).not.toContain('401');
  });

  it('SECURITY: never returns the RAPHA service token', async () => {
    const { cookie } = await signupActiveOrg();
    const { res, state } = makeRes();
    await enrollmentHandler(makeReq({ method: 'POST', body: {}, cookie }), res);
    expect(JSON.stringify(state.body)).not.toContain(SERVICE_TOKEN);
  });

  it('SECURITY: does not persist the raw enrollment token on the organization', async () => {
    const { cookie, orgId } = await signupActiveOrg();
    const { res } = makeRes();
    await enrollmentHandler(makeReq({ method: 'POST', body: {}, cookie }), res);

    const store = getStore(getConfig());
    const org = await store.getOrganizationById(orgId);
    expect(JSON.stringify(org)).not.toContain(RAW_ENROLLMENT);
  });

  it('SECURITY: never logs the raw enrollment token', async () => {
    const { cookie } = await signupActiveOrg();
    const { res } = makeRes();
    await enrollmentHandler(makeReq({ method: 'POST', body: {}, cookie }), res);

    const logged = [...consoleLogSpy.mock.calls, ...consoleErrSpy.mock.calls]
      .flat()
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
      .join(' ');
    expect(logged).not.toContain(RAW_ENROLLMENT);
    expect(logged).not.toContain(SERVICE_TOKEN);
  });
});
