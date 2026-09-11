import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './access-requests.js';
import { __resetInMemoryStore, getStore } from './_lib/store/index.js';
import { __resetRateLimits } from './_lib/ratelimit.js';
import { getConfig } from './_lib/config.js';

beforeEach(() => {
  delete process.env.DATABASE_URL; // in-memory store
  process.env.NODE_ENV = 'test';
  delete process.env.RESEND_API_KEY; // notification stays skipped/no-op
  delete process.env.OTP_EMAIL_FROM;
  delete process.env.ACCESS_REQUEST_NOTIFY_TO;
  __resetInMemoryStore();
  __resetRateLimits();
});

function makeReq(opts: { method?: string; body?: unknown; ip?: string }): VercelRequest {
  return {
    method: opts.method ?? 'POST',
    headers: opts.ip ? { 'x-forwarded-for': opts.ip } : {},
    query: {},
    body: opts.body,
  } as unknown as VercelRequest;
}

interface ResState { statusCode: number; body: Record<string, unknown>; headers: Record<string, string> }
function makeRes(): { res: VercelResponse; state: ResState } {
  const state: ResState = { statusCode: 0, body: {}, headers: {} };
  const res = {
    setHeader(k: string, v: string) { state.headers[k.toLowerCase()] = String(v); return this; },
    status(c: number) { state.statusCode = c; return this; },
    json(p: unknown) { state.body = p as Record<string, unknown>; return this; },
  } as unknown as VercelResponse;
  return { res, state };
}

const validBody = {
  full_name: 'Ada Lovelace',
  work_email: 'ada@acme.com',
  organization: 'Acme Corp',
  industry: 'Technology / SaaS',
  security_challenge: 'Lateral movement detection.',
  evaluation_reason: 'Autonomous response for the SOC.',
};

describe('POST /api/access-requests', () => {
  it('rejects non-POST with 405 + Allow: POST', async () => {
    const { res, state } = makeRes();
    await handler(makeReq({ method: 'GET' }), res);
    expect(state.statusCode).toBe(405);
    expect(state.headers['allow']).toBe('POST');
  });

  it('returns 400 with field errors for an invalid submission', async () => {
    const { res, state } = makeRes();
    await handler(makeReq({ body: {} }), res);
    expect(state.statusCode).toBe(400);
    expect(state.body.fields).toBeTruthy();
  });

  it('persists a valid submission (201) and creates NO account/tenant', async () => {
    const { res, state } = makeRes();
    await handler(makeReq({ body: validBody }), res);
    expect(state.statusCode).toBe(201);
    expect(state.body.id).toBeTruthy();
    expect(state.body.status).toBe('submitted');

    const store = getStore(getConfig());
    const page = await store.listAccessRequests({ page: 1, pageSize: 25 });
    expect(page.total).toBe(1);
    // Decoupled from identity: no user was created from the application.
    expect(await store.getUserByEmail('ada@acme.com')).toBeNull();
  });

  it('rate-limits repeated submissions from the same client (429)', async () => {
    const ip = '203.0.113.7';
    for (let i = 0; i < 5; i++) {
      const { res, state } = makeRes();
      await handler(makeReq({ body: validBody, ip }), res);
      expect(state.statusCode).toBe(201);
    }
    const { res, state } = makeRes();
    await handler(makeReq({ body: validBody, ip }), res);
    expect(state.statusCode).toBe(429);
    expect(state.headers['retry-after']).toBeTruthy();
  });

  it('never invokes provisioning even indirectly (no RAPHA calls needed)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { res, state } = makeRes();
    await handler(makeReq({ body: validBody }), res);
    expect(state.statusCode).toBe(201);
    // Notification is unconfigured in the test env, so no outbound call happens.
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('best-effort notification: a failing/hanging Resend never fails the submission, and the fetch is abort-wired', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.OTP_EMAIL_FROM = 'EmmaTech <noreply@example.com>';
    process.env.ACCESS_REQUEST_NOTIFY_TO = 'ops@example.com';
    // Simulate a network failure/abort — the handler must still return 201.
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network/abort'));
    const { res, state } = makeRes();
    await handler(makeReq({ body: validBody }), res);
    expect(state.statusCode).toBe(201);
    // Notify was attempted with a bounded AbortController signal wired in.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const opts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(opts.signal).toBeInstanceOf(AbortSignal);
    // The durable record persisted despite the notification failure.
    const store = getStore(getConfig());
    const page = await store.listAccessRequests({ page: 1, pageSize: 25 });
    expect(page.total).toBe(1);
    fetchSpy.mockRestore();
  });
});
