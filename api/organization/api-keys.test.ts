import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import apiKeysHandler from './api-keys.js';
import { getConfig } from '../_lib/config.js';
import { __resetInMemoryStore, getStore } from '../_lib/store/index.js';
import { createSessionToken, SESSION_COOKIE_NAME } from '../_lib/session.js';
import { API_KEYS_UNAVAILABLE_REASON, apiKeysAvailable } from '../_lib/apikeys.js';
import { DEFAULT_PLAN_ID } from '../../src/shared/plans.js';

const SECRET = 'api-keys-test-session-secret';

function makeReq(opts: { method: string; cookie?: string }): VercelRequest {
  return {
    method: opts.method,
    headers: opts.cookie ? { cookie: opts.cookie } : {},
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

async function seedUserWithOrg() {
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
    rapha_tenant_id: 'tenant-x',
  });
  await store.createMembership({ user_id: user.id, organization_id: org.id, role: 'owner' });
  return { user, org };
}

function cookieFor(userId: string): string {
  return `${SESSION_COOKIE_NAME}=${createSessionToken(userId, SECRET)}`;
}

beforeEach(() => {
  process.env.SESSION_SECRET = SECRET;
  process.env.NODE_ENV = 'test';
  delete process.env.DATABASE_URL;
  __resetInMemoryStore();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('/api/organization/api-keys', () => {
  it('rejects unauthenticated callers with 401 (never leaks behavior anonymously)', async () => {
    const { res, state } = makeRes();
    await apiKeysHandler(makeReq({ method: 'GET' }), res);
    expect(state.statusCode).toBe(401);
  });

  it('rejects unsupported methods with 405', async () => {
    const { res, state } = makeRes();
    await apiKeysHandler(makeReq({ method: 'PUT' }), res);
    expect(state.statusCode).toBe(405);
  });

  it('returns 501 (not available) with detail for an authenticated org member', async () => {
    const { user } = await seedUserWithOrg();
    const { res, state } = makeRes();
    await apiKeysHandler(makeReq({ method: 'GET', cookie: cookieFor(user.id) }), res);
    expect(state.statusCode).toBe(501);
    expect(state.body.available).toBe(false);
    expect(String(state.body.detail)).toContain('RAPHA');
  });

  it('returns 404 when the authenticated user has no organization', async () => {
    const store = getStore(getConfig());
    const user = await store.createUser({
      email: 'noorg@example.com',
      password_hash: 'scrypt$fake',
      name: 'No Org',
    });
    const { res, state } = makeRes();
    await apiKeysHandler(makeReq({ method: 'GET', cookie: cookieFor(user.id) }), res);
    expect(state.statusCode).toBe(404);
  });
});

describe('apiKeys abstraction gate', () => {
  it('reports the feature unavailable while RAPHA lacks a service API-key contract', () => {
    expect(apiKeysAvailable(getConfig())).toBe(false);
    expect(API_KEYS_UNAVAILABLE_REASON.length).toBeGreaterThan(0);
  });
});
