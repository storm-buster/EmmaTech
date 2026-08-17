import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runConsoleStream } from '../_lib/stream.js';
import { RaphaError } from '../_lib/rapha.js';
import streamHandler from './stream.js';
import { __resetInMemoryStore, getStore } from '../_lib/store/index.js';
import { getConfig } from '../_lib/config.js';
import { createSessionToken, SESSION_COOKIE_NAME } from '../_lib/session.js';
import { DEFAULT_PLAN_ID } from '../../src/shared/plans.js';

const SERVICE_TOKEN = 'super-secret-service-token-value';
const SESSION_SECRET = 'phase7c2-test-secret';
const SERVER_TENANT = 'tnt-server-1';

function makeSink() {
  const writes: string[] = [];
  return { writes, write: (s: string) => { writes.push(s); return true; } };
}
const immediateSleep = () => Promise.resolve();
function abortController() {
  return new AbortController();
}

describe('runConsoleStream — core', () => {
  it('emits connected first, then sanitized telemetry.update and alert.created', async () => {
    const sink = makeSink();
    await runConsoleStream(sink, {
      fetchTelemetry: async () => ({
        telemetry: [{ sensor_id: 's1', updated_at: 100, last_category: 'scan', last_is_threat: true, tenant_id: SERVER_TENANT }],
        next_since: 100,
      }),
      fetchAlerts: async () => ({
        alerts: [{ id: 'a1', ts: 100, category: 'malware', text: `threat for tenant ${SERVER_TENANT}`, tenant_id: SERVER_TENANT }],
        next_since: 100,
      }),
      intervalMs: 0,
      maxCycles: 1,
      signal: abortController().signal,
      sleep: immediateSleep,
    });
    const out = sink.writes.join('');
    expect(out.indexOf('event: connected')).toBeGreaterThanOrEqual(0);
    expect(out).toContain('event: telemetry.update');
    expect(out).toContain('event: alert.created');
    expect(out).toContain('"sensor_id":"s1"');
    expect(out).toContain('"alert_id":"a1"');
    // sanitization: never leak tenant_id, the alert `text` (which embeds tenant), or credentials
    expect(out).not.toContain('tenant_id');
    expect(out).not.toContain(SERVER_TENANT);
    expect(out).not.toContain(SERVICE_TOKEN);
    expect(out).not.toContain('"text"');
    // heartbeat comment
    expect(out).toContain(': hb ');
  });

  it('deduplicates boundary duplicates across cycles (telemetry + alerts)', async () => {
    const sink = makeSink();
    await runConsoleStream(sink, {
      fetchTelemetry: async () => ({ telemetry: [{ sensor_id: 's1', updated_at: 100 }], next_since: 100 }),
      fetchAlerts: async () => ({ alerts: [{ id: 'a1', ts: 100 }], next_since: 100 }),
      intervalMs: 0,
      maxCycles: 3,
      signal: abortController().signal,
      sleep: immediateSleep,
    });
    const out = sink.writes.join('');
    expect((out.match(/event: telemetry.update/g) ?? []).length).toBe(1);
    expect((out.match(/event: alert.created/g) ?? []).length).toBe(1);
  });

  it('advances cursors only after success', async () => {
    const seen: Array<number | undefined> = [];
    const sink = makeSink();
    await runConsoleStream(sink, {
      fetchTelemetry: async (since) => {
        seen.push(since);
        return { telemetry: [{ sensor_id: 's1', updated_at: (since ?? 0) + 10 }], next_since: (since ?? 0) + 10 };
      },
      fetchAlerts: async () => ({ alerts: [], next_since: undefined }),
      intervalMs: 0,
      maxCycles: 3,
      signal: abortController().signal,
      sleep: immediateSleep,
    });
    // cycle1 since=undefined, cycle2 since=10, cycle3 since=20
    expect(seen).toEqual([undefined, 10, 20]);
  });

  it('does NOT advance cursor on upstream failure and emits sanitized stream.error', async () => {
    const seen: Array<number | undefined> = [];
    const sink = makeSink();
    await runConsoleStream(sink, {
      fetchTelemetry: async (since) => {
        seen.push(since);
        throw new RaphaError('unavailable', 'boom');
      },
      fetchAlerts: async () => ({ alerts: [], next_since: 5 }),
      intervalMs: 0,
      maxCycles: 2,
      signal: abortController().signal,
      sleep: immediateSleep,
    });
    const out = sink.writes.join('');
    expect(seen).toEqual([undefined, undefined]); // cursor never advanced
    expect(out).toContain('event: stream.error');
    expect(out).toContain('RAPHA_UNAVAILABLE');
    expect(out).not.toContain('boom'); // raw error message never leaked
  });

  it('stops promptly when aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchT = vi.fn(async () => ({ telemetry: [], next_since: 0 }));
    const sink = makeSink();
    await runConsoleStream(sink, {
      fetchTelemetry: fetchT,
      fetchAlerts: async () => ({ alerts: [], next_since: 0 }),
      intervalMs: 0,
      maxCycles: 5,
      signal: controller.signal,
      sleep: immediateSleep,
    });
    expect(fetchT).not.toHaveBeenCalled(); // aborted before any cycle
  });
});

// ── Handler ──────────────────────────────────────────────────────────────────
function makeReq(opts: { method: string; cookie?: string; query?: Record<string, string> }): VercelRequest {
  const listeners: Record<string, () => void> = {};
  return {
    method: opts.method,
    headers: opts.cookie ? { cookie: opts.cookie } : {},
    query: opts.query ?? {},
    on: (ev: string, cb: () => void) => { listeners[ev] = cb; },
    off: () => {},
  } as unknown as VercelRequest;
}

function makeSseRes() {
  const chunks: string[] = [];
  const headers: Record<string, string> = {};
  let ended = false;
  let statusCode = 0;
  const res = {
    setHeader(k: string, v: string) { headers[k.toLowerCase()] = v; return res; },
    flushHeaders() {},
    write(s: string) { chunks.push(String(s)); return true; },
    end() { ended = true; },
    status(c: number) { statusCode = c; return res; },
    json(o: unknown) { chunks.push(JSON.stringify(o)); ended = true; return res; },
    get writableEnded() { return ended; },
  };
  return { res: res as unknown as VercelResponse, chunks, headers, get status() { return statusCode; } };
}

async function seedSessionCookie(raphaTenantId: string | null = SERVER_TENANT): Promise<string> {
  const store = getStore(getConfig());
  const user = await store.createUser({ email: 'owner@example.com', password_hash: 'scrypt$fake', name: 'Owner' });
  const org = await store.createOrganization({ name: 'Acme', plan: DEFAULT_PLAN_ID, status: 'active', rapha_tenant_id: raphaTenantId });
  await store.createMembership({ user_id: user.id, organization_id: org.id, role: 'owner' });
  return `${SESSION_COOKIE_NAME}=${createSessionToken(user.id, SESSION_SECRET)}`;
}

describe('GET /api/console/stream — handler', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = SESSION_SECRET;
    process.env.RAPHA_BASE_URL = 'https://rapha.test';
    process.env.RAPHA_SERVICE_TOKEN = SERVICE_TOKEN;
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'test';
    __resetInMemoryStore();
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('unauthenticated → 401 (no stream)', async () => {
    const r = makeSseRes();
    await streamHandler(makeReq({ method: 'GET' }), r.res, { intervalMs: 0, maxCycles: 1, sleep: immediateSleep });
    expect(r.status).toBe(401);
  });

  it('non-GET → 405', async () => {
    const r = makeSseRes();
    await streamHandler(makeReq({ method: 'POST' }), r.res, { intervalMs: 0, maxCycles: 1, sleep: immediateSleep });
    expect(r.status).toBe(405);
  });

  it('organization without rapha_tenant_id → 409', async () => {
    const cookie = await seedSessionCookie(null);
    const r = makeSseRes();
    await streamHandler(makeReq({ method: 'GET', cookie }), r.res, { intervalMs: 0, maxCycles: 1, sleep: immediateSleep });
    expect(r.status).toBe(409);
  });

  it('authenticated → SSE headers, connected event, server tenant + X-Service-Token, no token leak', async () => {
    const cookie = await seedSessionCookie(SERVER_TENANT);
    const fetchMock = vi.fn(async (url: string) => {
      const sub = url.split('?')[0].split('/').pop();
      return { status: 200, ok: true, json: async () => (sub === 'telemetry' ? { tenant_id: SERVER_TENANT, telemetry: [], next_since: 1 } : { tenant_id: SERVER_TENANT, alerts: [], next_since: 1 }) } as unknown as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    const { res, chunks, headers } = makeSseRes();
    await streamHandler(
      makeReq({ method: 'GET', cookie, query: { tenant_id: 'tnt-EVIL' } }),
      res,
      { intervalMs: 0, maxCycles: 1, sleep: immediateSleep },
    );

    expect(headers['content-type']).toContain('text/event-stream');
    const out = chunks.join('');
    expect(out).toContain('event: connected');

    const urls = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes(`/service/tenants/${SERVER_TENANT}/telemetry`))).toBe(true);
    expect(urls.some((u) => u.includes(`/service/tenants/${SERVER_TENANT}/alerts`))).toBe(true);
    expect(urls.every((u) => !u.includes('tnt-EVIL'))).toBe(true); // client tenant_id ignored
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['X-Service-Token']).toBe(SERVICE_TOKEN);
    expect(out).not.toContain(SERVICE_TOKEN);
  });
});
