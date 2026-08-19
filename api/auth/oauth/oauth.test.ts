import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import startHandler from './start.js';
import callbackHandler from './callback.js';
import { signState, verifyState, getProviderCreds } from '../../_lib/oauth.js';
import { getConfig } from '../../_lib/config.js';
import { __resetInMemoryStore, getStore } from '../../_lib/store/index.js';
import { findOrCreateOAuthUser, signup, ValidationError } from '../../_lib/service.js';
import { entitlementsForPlan } from '../../_lib/entitlements.js';
import { hashPassword } from '../../_lib/password.js';

const SERVICE_TOKEN = 'super-secret-service-token-value';

function makeReq(query: Record<string, string> = {}): VercelRequest {
  return { method: 'GET', headers: {}, query } as unknown as VercelRequest;
}
function makeRes() {
  const state = { status: 0, headers: {} as Record<string, string>, ended: false, body: undefined as unknown };
  const res = {
    setHeader(k: string, v: string) { state.headers[k.toLowerCase()] = v; return res; },
    status(c: number) { state.status = c; return res; },
    json(b: unknown) { state.body = b; state.ended = true; return res; },
    end() { state.ended = true; return res; },
  } as unknown as VercelResponse;
  return { res, state };
}

/** provisioning fetch: 201 for tenant create, 200 for capability sync. */
function fetchProvisionOk() {
  return vi.fn(async (url: string) => {
    if (String(url).endsWith('/capabilities')) return { status: 200, ok: true, json: async () => ({}) } as unknown as Response;
    return { status: 201, ok: true, json: async () => ({ tenant_id: 'tnt-x', name: 'n', external_customer_id: 'e', status: 'active', created_at: '', updated_at: '' }) } as unknown as Response;
  });
}

beforeEach(() => {
  process.env.SESSION_SECRET = 'oauth-test-secret';
  process.env.RAPHA_BASE_URL = 'https://rapha.test';
  process.env.RAPHA_SERVICE_TOKEN = SERVICE_TOKEN;
  process.env.NODE_ENV = 'test';
  delete process.env.DATABASE_URL;
  for (const k of ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET', 'MICROSOFT_OAUTH_CLIENT_ID', 'MICROSOFT_OAUTH_CLIENT_SECRET', 'OAUTH_REDIRECT_BASE_URL']) {
    delete process.env[k];
  }
  __resetInMemoryStore();
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('oauth signed state', () => {
  it('round-trips provider + plan and rejects tampering', () => {
    const cfg = getConfig();
    const s = signState(cfg, 'google', 'growth');
    const parsed = verifyState(cfg, s);
    expect(parsed?.provider).toBe('google');
    expect(parsed?.plan).toBe('growth');
    expect(verifyState(cfg, s.slice(0, -2) + 'xx')).toBeNull(); // tampered sig
    expect(verifyState(cfg, undefined)).toBeNull();
  });
});

describe('getProviderCreds', () => {
  it('returns null when provider env is not configured', () => {
    expect(getProviderCreds('google')).toBeNull();
    expect(getProviderCreds('microsoft')).toBeNull();
  });
});

describe('GET /api/auth/oauth/start', () => {
  it('400 for an unsupported provider', async () => {
    const { res, state } = makeRes();
    await startHandler(makeReq({ provider: 'github' }), res);
    expect(state.status).toBe(400);
  });
  it('503 (fail-closed) when the provider is not configured', async () => {
    const { res, state } = makeRes();
    await startHandler(makeReq({ provider: 'google', plan: 'growth' }), res);
    expect(state.status).toBe(503);
  });
});

describe('GET /api/auth/oauth/callback', () => {
  it('redirects to /#/login on invalid/absent state (no session cookie)', async () => {
    const { res, state } = makeRes();
    await callbackHandler(makeReq({ code: 'x' }), res);
    expect(state.status).toBe(302);
    expect(state.headers['location']).toBe('/#/login');
    expect(state.headers['set-cookie']).toBeUndefined();
  });
});

describe('findOrCreateOAuthUser (unified account model)', () => {
  it('creates a user+org on first OAuth login and links on subsequent logins; entitlement stays FREE', async () => {
    vi.stubGlobal('fetch', fetchProvisionOk());
    const cfg = getConfig();
    const store = getStore(cfg);

    const first = await findOrCreateOAuthUser(store, cfg, { email: 'Jane@Acme.com', name: 'Jane', provider: 'google' });
    expect(first.created).toBe(true);
    expect(first.user.email).toBe('jane@acme.com');
    expect(first.organization?.plan).toBe('free'); // no plan requested → FREE (server default)
    expect(first.user.password_hash.startsWith('scrypt$')).toBe(false); // no password login

    const second = await findOrCreateOAuthUser(store, cfg, { email: 'jane@acme.com', name: 'Jane', provider: 'microsoft' });
    expect(second.created).toBe(false);
    expect(second.user.id).toBe(first.user.id); // same account, not a duplicate
  });
});

describe('signup — Growth work-email enforcement (server-authoritative)', () => {
  const base = { name: 'Owner', organizationName: 'Acme', password: 'a-strong-password' };
  it('rejects a consumer email when requestedPlan=growth', async () => {
    vi.stubGlobal('fetch', fetchProvisionOk());
    const store = getStore(getConfig());
    await expect(
      signup(store, getConfig(), { ...base, email: 'owner@gmail.com', requestedPlan: 'growth' }, hashPassword),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('grants Growth for a business email at signup (pre-billing public-plan grant)', async () => {
    vi.stubGlobal('fetch', fetchProvisionOk());
    const store = getStore(getConfig());
    const result = await signup(store, getConfig(), { ...base, email: 'owner@acme.com', requestedPlan: 'growth' }, hashPassword);
    expect(result.organization.plan).toBe('growth');
  });

  it('a non-public or invalid requested_plan cannot be self-selected (perpetual/unknown → free)', async () => {
    vi.stubGlobal('fetch', fetchProvisionOk());
    const store = getStore(getConfig());
    const perpetual = await signup(store, getConfig(), { ...base, email: 'a@acme.com', requestedPlan: 'perpetual' }, hashPassword);
    expect(perpetual.organization.plan).toBe('free');
    const bogus = await signup(store, getConfig(), { ...base, email: 'b@acme.com', requestedPlan: 'enterprise' }, hashPassword);
    expect(bogus.organization.plan).toBe('free');
  });
});


// ── Plan preservation through the REAL OAuth callback (Google/Microsoft) ─────
// Drives the actual callback handler end-to-end, mocking ONLY the external IdP
// token/userinfo exchange (and RAPHA provisioning). Proves the pricing→OAuth
// selected plan survives to organization.plan and never silently becomes Free.
function configureProviders() {
  process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-google-id';
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-google-secret';
  process.env.MICROSOFT_OAUTH_CLIENT_ID = 'test-ms-id';
  process.env.MICROSOFT_OAUTH_CLIENT_SECRET = 'test-ms-secret';
  process.env.OAUTH_REDIRECT_BASE_URL = 'https://emmatech.in';
}

/** Mocks the IdP token endpoint, IdP userinfo, and RAPHA provisioning. */
function fetchOAuthCallbackOk(email: string, name: string) {
  return vi.fn(async (url: string) => {
    const u = String(url);
    if (u.includes('rapha.test')) {
      if (u.endsWith('/capabilities')) return { status: 200, ok: true, json: async () => ({}) } as unknown as Response;
      return { status: 201, ok: true, json: async () => ({ tenant_id: 'tnt-x', name, external_customer_id: 'e', status: 'active', created_at: '', updated_at: '' }) } as unknown as Response;
    }
    if (u.includes('/token')) return { status: 200, ok: true, json: async () => ({ access_token: 'idp-access-token' }) } as unknown as Response;
    return { status: 200, ok: true, json: async () => ({ email, name }) } as unknown as Response; // userinfo
  });
}

/** Runs the real callback for (provider, plan, email) and returns the resulting org.plan. */
async function planAfterOAuth(provider: 'google' | 'microsoft', plan: string | undefined, email: string) {
  configureProviders();
  vi.stubGlobal('fetch', fetchOAuthCallbackOk(email, 'OAuth User'));
  const cfg = getConfig();
  const store = getStore(cfg);
  const { res, state } = makeRes();
  await callbackHandler(makeReq({ code: 'auth-code', state: signState(cfg, provider, plan) }), res);
  const user = await store.getUserByEmail(email);
  const membership = user ? await store.getPrimaryMembershipForUser(user.id) : null;
  const org = membership ? await store.getOrganizationById(membership.organization_id) : null;
  return {
    httpStatus: state.status,
    location: state.headers['location'],
    plan: org?.plan ?? null,
    plan_selected: org?.plan_selected ?? null,
  };
}

describe('OAuth callback preserves the pricing-selected plan (Google/Microsoft × Starter/Growth)', () => {
  it('A. Google + Starter → organization.plan = starter (not free)', async () => {
    const r = await planAfterOAuth('google', 'starter', 'starter-google@acme.com');
    expect(r.httpStatus).toBe(302);
    expect(r.plan).toBe('starter');
    expect(r.plan).not.toBe('free');
    expect(entitlementsForPlan(r.plan!).sensorLimit).toBe(20); // entitlement derived from selected plan
  });

  it('B. Google + Growth (work email) → organization.plan = growth (not free)', async () => {
    const r = await planAfterOAuth('google', 'growth', 'growth-google@acme.com');
    expect(r.plan).toBe('growth');
    expect(r.plan).not.toBe('free');
    expect(entitlementsForPlan(r.plan!).decoysEnabled).toBe(true);
  });

  it('C. Microsoft + Starter → organization.plan = starter (not free)', async () => {
    const r = await planAfterOAuth('microsoft', 'starter', 'starter-ms@acme.com');
    expect(r.plan).toBe('starter');
    expect(r.plan).not.toBe('free');
  });

  it('D. Microsoft + Growth (work email) → organization.plan = growth (not free)', async () => {
    const r = await planAfterOAuth('microsoft', 'growth', 'growth-ms@acme.com');
    expect(r.plan).toBe('growth');
    expect(r.plan).not.toBe('free');
    expect(entitlementsForPlan(r.plan!).sensorLimit).toBeNull(); // Growth = unlimited sensors
  });

  it('default: OAuth with NO selected plan → organization.plan = free', async () => {
    const r = await planAfterOAuth('google', undefined, 'noplan@acme.com');
    expect(r.plan).toBe('free');
  });

  it('25/31: OAuth with NO plan → plan_selected=false (post-auth modal will show)', async () => {
    const g = await planAfterOAuth('google', undefined, 'g-noplan@acme.com');
    expect(g.plan_selected).toBe(false);
    __resetInMemoryStore();
    const m = await planAfterOAuth('microsoft', undefined, 'm-noplan@acme.com');
    expect(m.plan_selected).toBe(false);
  });

  it('OAuth WITH a pricing plan → plan_selected=true (no modal)', async () => {
    const r = await planAfterOAuth('google', 'starter', 'sel@acme.com');
    expect(r.plan_selected).toBe(true);
  });

  it('provider choice does not alter the selected plan (Google vs Microsoft, same Starter)', async () => {
    const g = await planAfterOAuth('google', 'starter', 'same-plan-google@acme.com');
    __resetInMemoryStore();
    const m = await planAfterOAuth('microsoft', 'starter', 'same-plan-ms@acme.com');
    expect(g.plan).toBe(m.plan);
    expect(g.plan).toBe('starter');
  });

  it('does NOT overwrite an EXISTING OAuth user\'s organization plan on subsequent login', async () => {
    // First login selects Growth (work email) → new org granted growth.
    const first = await planAfterOAuth('google', 'growth', 'returning@acme.com');
    expect(first.plan).toBe('growth');
    // Subsequent login (different provider, and even a LOWER/absent plan intent)
    // must link the existing account and leave its plan unchanged — never downgrade.
    const second = await planAfterOAuth('microsoft', 'starter', 'returning@acme.com');
    expect(second.plan).toBe('growth');
    const third = await planAfterOAuth('google', undefined, 'returning@acme.com');
    expect(third.plan).toBe('growth');
  });
});
