import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import startHandler from './start.js';
import callbackHandler from './callback.js';
import { signState, verifyState, getProviderCreds } from '../../_lib/oauth.js';
import { getConfig } from '../../_lib/config.js';
import { __resetInMemoryStore, getStore } from '../../_lib/store/index.js';
import { findOrCreateOAuthUser, signup, ValidationError } from '../../_lib/service.js';
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
    expect(first.organization?.plan).toBe('free'); // server-authoritative
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

  it('accepts a business email for growth but the org stays on the FREE default (no elevation)', async () => {
    vi.stubGlobal('fetch', fetchProvisionOk());
    const store = getStore(getConfig());
    const result = await signup(store, getConfig(), { ...base, email: 'owner@acme.com', requestedPlan: 'growth' }, hashPassword);
    expect(result.organization.plan).toBe('free');
  });

  it('a tampered requested_plan cannot elevate a free/consumer signup to growth', async () => {
    vi.stubGlobal('fetch', fetchProvisionOk());
    const store = getStore(getConfig());
    const result = await signup(store, getConfig(), { ...base, email: 'owner@acme.com', requestedPlan: 'growth' }, hashPassword);
    expect(result.organization.plan).not.toBe('growth');
  });
});
