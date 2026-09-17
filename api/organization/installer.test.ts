import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PassThrough } from 'node:stream';

// Mock the private-blob SDK so no real network/store is touched.
vi.mock('@vercel/blob', () => ({ get: vi.fn() }));
import { get as blobGet } from '@vercel/blob';

import orgHandler from './[action].js';
import { __resetInMemoryStore, getStore } from '../_lib/store/index.js';
import { __resetRateLimits } from '../_lib/ratelimit.js';
import { getConfig } from '../_lib/config.js';
import { SESSION_COOKIE_NAME, createSessionToken } from '../_lib/session.js';
import { signup as svcSignup } from '../_lib/service.js';
import { hashPassword } from '../_lib/password.js';
import { createDownloadToken } from '../_lib/downloadToken.js';

const SESSION_SECRET = 'phase3-wave2-test-secret';
const PATHNAME = 'rapha-agent-1.0.1-windows.zip';

const asAction = (action: string) => (req: VercelRequest, res: VercelResponse) => {
  const r = req as unknown as { query?: Record<string, unknown> };
  r.query = { ...(r.query ?? {}), action };
  return orgHandler(req, res);
};
const installer = asAction('installer');
const agentPackage = asAction('agent-package');

function makeReq(opts: { method: string; cookie?: string; query?: Record<string, unknown>; host?: string }): VercelRequest {
  return {
    method: opts.method,
    headers: { ...(opts.cookie ? { cookie: opts.cookie } : {}), host: opts.host ?? 'www.emmatech.in' },
    query: opts.query ?? {},
  } as unknown as VercelRequest;
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

async function signupOrg(): Promise<string> {
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
  process.env.RAPHA_SERVICE_TOKEN = 'svc-token';
  delete process.env.DATABASE_URL;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_STORE_ID;
  process.env.NODE_ENV = 'test';
  __resetInMemoryStore();
  __resetRateLimits();
  vi.mocked(blobGet).mockReset();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/organization/installer — cookie-authenticated, tokenized', () => {
  it('anonymous → 401', async () => {
    const { res, state } = makeRes();
    await installer(makeReq({ method: 'GET' }), res);
    expect(state.statusCode).toBe(401);
  });

  it('authenticated without an organization is not served the installer', async () => {
    // No signup → getAccountForUser has no org for a random session → 403.
    const cookie = `${SESSION_COOKIE_NAME}=${createSessionToken('ghost-user', SESSION_SECRET)}`;
    const { res, state } = makeRes();
    await installer(makeReq({ method: 'GET', cookie }), res);
    expect(state.statusCode).toBe(403);
  });

  it('authorized → 200 with a tokenized package URL and NO public blob URL', async () => {
    const cookie = await signupOrg();
    const { res, state } = makeRes();
    await installer(makeReq({ method: 'GET', cookie }), res);
    expect(state.statusCode).toBe(200);
    expect(state.headers['content-disposition']).toContain('attachment; filename="install-rapha.ps1"');
    const script = state.body as string;
    expect(script).toContain('/api/organization/agent-package?dt=');
    expect(script).not.toContain('public.blob.vercel-storage.com');
    expect(script).not.toContain('@@AGENT_PACKAGE_URL@@'); // placeholder was substituted
  });
});

describe('GET /api/organization/agent-package — token-authorized private stream', () => {
  it('missing/invalid token → 403', async () => {
    const { res, state } = makeRes();
    await agentPackage(makeReq({ method: 'GET', query: { dt: 'bogus' } }), res);
    expect(state.statusCode).toBe(403);
  });

  it('expired token → 403', async () => {
    const expired = createDownloadToken({ org: 'o1', path: PATHNAME }, SESSION_SECRET, -1);
    const { res, state } = makeRes();
    await agentPackage(makeReq({ method: 'GET', query: { dt: expired } }), res);
    expect(state.statusCode).toBe(403);
  });

  it('valid token but blob store not configured → 503 (never falls back to public)', async () => {
    const token = createDownloadToken({ org: 'o1', path: PATHNAME }, SESSION_SECRET, 60);
    const { res, state } = makeRes();
    await agentPackage(makeReq({ method: 'GET', query: { dt: token } }), res);
    expect(state.statusCode).toBe(503);
    expect(vi.mocked(blobGet)).not.toHaveBeenCalled();
  });

  it('valid token + configured store → streams the PRIVATE blob via get(access:private)', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_test';
    const webStream = new ReadableStream<Uint8Array>({
      start(c) { c.enqueue(new TextEncoder().encode('PK-ZIP-BYTES')); c.close(); },
    });
    vi.mocked(blobGet).mockResolvedValue({
      statusCode: 200,
      stream: webStream,
      blob: { contentType: 'application/zip' },
    } as unknown as Awaited<ReturnType<typeof blobGet>>);

    const token = createDownloadToken({ org: 'o1', path: PATHNAME }, SESSION_SECRET, 60);

    // Writable res that collects the streamed bytes.
    const chunks: Buffer[] = [];
    const sink = new PassThrough();
    sink.on('data', (c) => chunks.push(Buffer.from(c)));
    const headers: Record<string, string> = {};
    let status = 0;
    const res = Object.assign(sink, {
      setHeader(k: string, v: string) { headers[k.toLowerCase()] = v; return res; },
      status(c: number) { status = c; return res; },
      json(p: unknown) { sink.end(JSON.stringify(p)); return res; },
    }) as unknown as VercelResponse;

    await agentPackage(makeReq({ method: 'GET', query: { dt: token } }), res);
    await new Promise((r) => sink.on('finish', r));

    expect(status).toBe(200);
    expect(vi.mocked(blobGet)).toHaveBeenCalledWith(PATHNAME, { access: 'private' });
    expect(headers['content-type']).toBe('application/zip');
    expect(headers['cache-control']).toContain('no-store');
    expect(Buffer.concat(chunks).toString()).toBe('PK-ZIP-BYTES');
  });
});
