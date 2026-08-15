import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import signupHandler from './signup.js';
import loginHandler from './login.js';
import logoutHandler from './logout.js';
import meHandler from '../me.js';
import { __resetInMemoryStore, getStore } from '../_lib/store/index.js';
import { __resetRateLimits } from '../_lib/ratelimit.js';
import { getConfig } from '../_lib/config.js';
import { SESSION_COOKIE_NAME } from '../_lib/session.js';

const SERVICE_TOKEN = 'super-secret-service-token-value';

// --- req/res doubles -------------------------------------------------------

function makeReq(opts: {
  method: string;
  body?: unknown;
  cookie?: string;
}): VercelRequest {
  return {
    method: opts.method,
    body: opts.body,
    headers: opts.cookie ? { cookie: opts.cookie } : {},
  } as unknown as VercelRequest;
}

interface ResState {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

interface ResponseBody {
  user: { email: string; name: string; password_hash?: string };
  organization: { name: string; status: string; plan?: string } | null;
  role: string | null;
  entitlement?: { plan: string; planName: string; sensorLimit: number | null; decoysEnabled: boolean } | null;
  error?: string;
}

function makeRes(): { res: VercelResponse; state: ResState } {
  const state: ResState = { statusCode: 0, body: undefined, headers: {} };
  const res = {
    setHeader(key: string, value: string) {
      state.headers[key.toLowerCase()] = value;
      return this;
    },
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      state.body = payload;
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

function fetchOk() {
  return vi.fn(async (_url: string, init: RequestInit) => {
    const parsed = JSON.parse(init.body as string) as { external_customer_id: string };
    return {
      status: 201,
      ok: true,
      json: async () => ({
        tenant_id: `tenant-${parsed.external_customer_id}`,
        name: 'Acme',
        external_customer_id: parsed.external_customer_id,
        status: 'active',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
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

beforeEach(() => {
  process.env.SESSION_SECRET = 'handler-test-session-secret';
  process.env.RAPHA_BASE_URL = 'https://rapha.test';
  process.env.RAPHA_SERVICE_TOKEN = SERVICE_TOKEN;
  delete process.env.DATABASE_URL;
  process.env.NODE_ENV = 'test';
  __resetInMemoryStore();
  __resetRateLimits();
  vi.stubGlobal('fetch', fetchOk());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('POST /api/auth/signup', () => {
  it('creates an account, sets an HttpOnly session cookie, and returns safe data', async () => {
    const { res, state } = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: SIGNUP_BODY }), res);

    expect(state.statusCode).toBe(201);
    const setCookie = state.headers['set-cookie'];
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain('HttpOnly');

    const body = state.body as ResponseBody;
    expect(body.user.email).toBe('owner@example.com');
    expect(body.organization?.status).toBe('active');
    expect(body.role).toBe('owner');
    // No secrets / hashes leaked
    expect(body.user.password_hash).toBeUndefined();
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('scrypt$');
    expect(serialized).not.toContain(SERVICE_TOKEN);
    expect(setCookie).not.toContain(SERVICE_TOKEN);
  });

  it('rejects a non-POST method with 405', async () => {
    const { res, state } = makeRes();
    await signupHandler(makeReq({ method: 'GET' }), res);
    expect(state.statusCode).toBe(405);
  });

  it('returns 409 on duplicate email', async () => {
    const first = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: SIGNUP_BODY }), first.res);
    const second = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: SIGNUP_BODY }), second.res);
    expect(second.state.statusCode).toBe(409);
  });

  it('returns 400 on invalid input', async () => {
    const { res, state } = makeRes();
    await signupHandler(
      makeReq({ method: 'POST', body: { ...SIGNUP_BODY, email: 'bad' } }),
      res,
    );
    expect(state.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    const { res } = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: SIGNUP_BODY }), res);
  });

  it('sets a session cookie on valid credentials', async () => {
    const { res, state } = makeRes();
    await loginHandler(
      makeReq({ method: 'POST', body: { email: 'owner@example.com', password: 'a-strong-password' } }),
      res,
    );
    expect(state.statusCode).toBe(200);
    expect(state.headers['set-cookie']).toContain(`${SESSION_COOKIE_NAME}=`);
    expect((state.body as ResponseBody).user.password_hash).toBeUndefined();
  });

  it('returns a generic 401 on invalid password', async () => {
    const { res, state } = makeRes();
    await loginHandler(
      makeReq({ method: 'POST', body: { email: 'owner@example.com', password: 'WRONG-pass' } }),
      res,
    );
    expect(state.statusCode).toBe(401);
    expect((state.body as Record<string, string>).error).toBe('Invalid email or password');
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session cookie', async () => {
    const { res, state } = makeRes();
    await logoutHandler(makeReq({ method: 'POST' }), res);
    expect(state.statusCode).toBe(200);
    expect(state.headers['set-cookie']).toContain('Max-Age=0');
  });
});

describe('GET /api/me', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const { res, state } = makeRes();
    await meHandler(makeReq({ method: 'GET' }), res);
    expect(state.statusCode).toBe(401);
  });

  it('returns the account for an authenticated request', async () => {
    const signup = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: SIGNUP_BODY }), signup.res);
    const cookie = cookieFrom(signup.state);

    const { res, state } = makeRes();
    await meHandler(makeReq({ method: 'GET', cookie }), res);

    expect(state.statusCode).toBe(200);
    const body = state.body as ResponseBody;
    expect(body.user.email).toBe('owner@example.com');
    expect(body.organization?.name).toBe('Acme Inc');
    expect(body.user.password_hash).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain(SERVICE_TOKEN);
  });

  it('isolates organizations across users', async () => {
    const a = makeRes();
    await signupHandler(
      makeReq({
        method: 'POST',
        body: { ...SIGNUP_BODY, email: 'a@example.com', organizationName: 'Org A' },
      }),
      a.res,
    );
    const b = makeRes();
    await signupHandler(
      makeReq({
        method: 'POST',
        body: { ...SIGNUP_BODY, email: 'b@example.com', organizationName: 'Org B' },
      }),
      b.res,
    );

    const meA = makeRes();
    await meHandler(makeReq({ method: 'GET', cookie: cookieFrom(a.state) }), meA.res);
    expect((meA.state.body as ResponseBody).organization?.name).toBe('Org A');

    const meB = makeRes();
    await meHandler(makeReq({ method: 'GET', cookie: cookieFrom(b.state) }), meB.res);
    expect((meB.state.body as ResponseBody).organization?.name).toBe('Org B');
  });
});

describe('Phase 2 — entitlements & plan security', () => {
  it('signup returns a FREE entitlement and org.plan=free by default', async () => {
    const { res, state } = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: SIGNUP_BODY }), res);
    const body = state.body as ResponseBody;
    expect(body.organization?.plan).toBe('free');
    expect(body.entitlement).toEqual({
      plan: 'free',
      planName: 'Free',
      sensorLimit: 1,
      decoysEnabled: false,
    });
  });

  it('/api/me exposes the current plan entitlement (free/1/no-decoys)', async () => {
    const signup = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: SIGNUP_BODY }), signup.res);
    const cookie = cookieFrom(signup.state);

    const { res, state } = makeRes();
    await meHandler(makeReq({ method: 'GET', cookie }), res);
    const body = state.body as ResponseBody;
    expect(body.entitlement?.plan).toBe('free');
    expect(body.entitlement?.sensorLimit).toBe(1);
    expect(body.entitlement?.decoysEnabled).toBe(false);
  });

  it('SECURITY: a customer cannot set their own plan via the signup body', async () => {
    const { res, state } = makeRes();
    await signupHandler(
      makeReq({ method: 'POST', body: { ...SIGNUP_BODY, plan: 'growth', entitlement: 'growth' } }),
      res,
    );
    const body = state.body as ResponseBody;
    // Client-supplied plan is ignored; org stays on the server default.
    expect(body.organization?.plan).toBe('free');
    expect(body.entitlement?.plan).toBe('free');
  });

  it('SECURITY: no customer endpoint changes the plan; only a server-side mechanism does', async () => {
    const signup = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: SIGNUP_BODY }), signup.res);
    const cookie = cookieFrom(signup.state);

    const meBefore = makeRes();
    await meHandler(makeReq({ method: 'GET', cookie }), meBefore.res);
    expect((meBefore.state.body as ResponseBody).entitlement?.plan).toBe('free');
    const orgId = (
      meBefore.state.body as ResponseBody & { organization: { id: string } }
    ).organization.id;

    // Server-side/admin mechanism upgrades the plan (NOT a customer request).
    const store = getStore(getConfig());
    await store.setOrganizationPlan(orgId, 'growth');

    // The change is reflected on the authoritative account endpoint.
    const meAfter = makeRes();
    await meHandler(makeReq({ method: 'GET', cookie }), meAfter.res);
    const after = meAfter.state.body as ResponseBody;
    expect(after.entitlement?.plan).toBe('growth');
    expect(after.entitlement?.sensorLimit).toBeNull();
    expect(after.entitlement?.decoysEnabled).toBe(true);
  });
});
