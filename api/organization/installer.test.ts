import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import orgHandler from './[action].js';
import { __resetInMemoryStore, getStore } from '../_lib/store/index.js';
import { __resetRateLimits } from '../_lib/ratelimit.js';
import { getConfig } from '../_lib/config.js';
import { SESSION_COOKIE_NAME, createSessionToken } from '../_lib/session.js';
import { signup as svcSignup } from '../_lib/service.js';
import { hashPassword } from '../_lib/password.js';

const SESSION_SECRET = 'phase3-installer-test-secret';
const SERVICE_TOKEN = 'super-secret-service-token-value';

const installerHandler = (req: VercelRequest, res: VercelResponse) => {
  const r = req as unknown as { query?: Record<string, unknown> };
  r.query = { ...(r.query ?? {}), action: 'installer' };
  return orgHandler(req, res);
};

function makeReq(opts: { method: string; cookie?: string }): VercelRequest {
  return { method: opts.method, headers: opts.cookie ? { cookie: opts.cookie } : {} } as unknown as VercelRequest;
}

interface ResState { statusCode: number; body: unknown; headers: Record<string, string> }
function makeRes(): { res: VercelResponse; state: ResState } {
  const state: ResState = { statusCode: 0, body: undefined, headers: {} };
  const res = {
    setHeader(k: string, v: string) { state.headers[k.toLowerCase()] = v; return this; },
    status(c: number) { state.statusCode = c; return this; },
    json(p: unknown) { state.body = p; return this; },
    send(p: unknown) { state.body = p; return this; },
  } as unknown as VercelResponse;
  return { res, state };
}

async function signupActiveOrg(): Promise<string> {
  const result = await svcSignup(
    getStore(getConfig()),
    getConfig(),
    { email: 'owner@example.com', password: 'a-strong-password', name: 'Owner', organizationName: 'Acme' },
    hashPassword,
  );
  return `${SESSION_COOKIE_NAME}=${createSessionToken(result.user.id, SESSION_SECRET)}`;
}

beforeEach(() => {
  process.env.SESSION_SECRET = SESSION_SECRET;
  process.env.RAPHA_BASE_URL = 'https://rapha.test';
  process.env.RAPHA_SERVICE_TOKEN = SERVICE_TOKEN;
  delete process.env.DATABASE_URL;
  process.env.NODE_ENV = 'test';
  __resetInMemoryStore();
  __resetRateLimits();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('GET /api/organization/installer — authenticated delivery only', () => {
  it('denies anonymous access with 401 (no session cookie)', async () => {
    const { res, state } = makeRes();
    await installerHandler(makeReq({ method: 'GET' }), res);
    expect(state.statusCode).toBe(401);
    expect(state.body).toEqual({ error: 'Not authenticated' });
  });

  it('rejects a non-GET method with 405', async () => {
    const { res, state } = makeRes();
    await installerHandler(makeReq({ method: 'POST' }), res);
    expect(state.statusCode).toBe(405);
  });

  it('serves the installer as an attachment to an authenticated organization', async () => {
    const cookie = await signupActiveOrg();
    const { res, state } = makeRes();
    await installerHandler(makeReq({ method: 'GET', cookie }), res);
    expect(state.statusCode).toBe(200);
    expect(state.headers['content-disposition']).toContain('attachment; filename="install-rapha.ps1"');
    expect(state.headers['cache-control']).toContain('no-store');
    expect(typeof state.body).toBe('string');
    expect(state.body as string).toContain('EmmaTech RAPHA Windows Agent installer');
  });
});
