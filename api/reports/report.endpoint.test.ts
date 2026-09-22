import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './[report].js';
import { __resetInMemoryStore, getStore } from '../_lib/store/index.js';
import { getConfig } from '../_lib/config.js';
import { createSessionToken, SESSION_COOKIE_NAME } from '../_lib/session.js';
import type { AccessRequest, AccessRequestStatus } from '../_lib/store/types.js';

const SECRET = 'test-session-secret';
const STAFF_UID = 'staff-uid-0001';
const NON_STAFF_UID = 'owner-uid-9999';
const WIN_FROM = '2026-09-01T00:00:00.000Z';
const WIN_TO = '2026-09-30T00:00:00.000Z';
const dayAt = (d: number, h = 12) => `2026-09-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:00:00.000Z`;

const PII = {
  full_name: 'Ada Lovelace', work_email: 'ada.secret@acme-corp.example',
  organization: 'Acme Confidential', security_challenge: 'SECRET challenge',
  evaluation_reason: 'SECRET reason',
};

function mkRow(o: Partial<AccessRequest> & { created_at: string }): AccessRequest {
  return {
    id: Math.random().toString(36).slice(2),
    full_name: PII.full_name, work_email: PII.work_email, organization: PII.organization,
    job_title: 'Head of Security', industry: 'Technology / SaaS', organization_size: '201–1,000',
    country: 'India', security_challenge: PII.security_challenge, current_stack: 'EDR',
    deployment_environment: 'Hybrid', evaluation_reason: PII.evaluation_reason, additional_context: null,
    utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null,
    referrer_domain: null, landing_path: null, first_touch_at: null, last_touch_at: null,
    status: 'submitted' as AccessRequestStatus, updated_at: o.created_at, ...o,
  };
}

function seed() {
  const rows: AccessRequest[] = [
    ...Array.from({ length: 6 }, () => mkRow({ created_at: dayAt(2), utm_source: 'reddit', utm_medium: 'community', utm_campaign: 'deception', landing_path: '/rapha', first_touch_at: dayAt(1), last_touch_at: dayAt(1) })),
    ...Array.from({ length: 5 }, () => mkRow({ created_at: dayAt(3), utm_source: null, status: 'under_review' })), // direct/unknown
    ...Array.from({ length: 5 }, () => mkRow({ created_at: dayAt(4), utm_source: 'news.ycombinator.com', utm_medium: 'referral', referrer_domain: 'news.ycombinator.com' })),
    ...Array.from({ length: 3 }, () => mkRow({ created_at: dayAt(5), utm_source: 'linkedin' })), // <5 → suppressed
  ];
  const store = getStore(getConfig());
  (store as unknown as { accessRequests: AccessRequest[] }).accessRequests = rows;
  return store;
}

function makeReq(query: Record<string, string> = {}, cookieUid?: string | 'invalid'): VercelRequest {
  const cookie = cookieUid === 'invalid'
    ? `${SESSION_COOKIE_NAME}=bad.token`
    : cookieUid
      ? `${SESSION_COOKIE_NAME}=${createSessionToken(cookieUid, SECRET)}`
      : '';
  return { method: 'GET', headers: { cookie }, query: { report: 'acquisition', ...query } } as unknown as VercelRequest;
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

const okQuery = { from: WIN_FROM, to: WIN_TO };

beforeEach(() => {
  delete process.env.DATABASE_URL;
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET = SECRET;
  process.env.REPORTING_STAFF_USER_IDS = STAFF_UID;
  __resetInMemoryStore();
});
afterEach(() => { vi.restoreAllMocks(); delete process.env.REPORTING_STAFF_USER_IDS; });

const APPROVED = ['window', 'policy', 'bySource', 'bySourceMediumCampaign', 'byLandingPath', 'byStatus', 'byDay', 'touchPatterns'];

describe('GET /api/reports/acquisition — authorization', () => {
  it('unauthenticated → 404', async () => {
    seed();
    const { res, state } = makeRes();
    await handler(makeReq(okQuery), res);
    expect(state.statusCode).toBe(404);
    expect(state.body).toEqual({ error: 'Not found' });
  });

  it('authenticated non-staff (e.g. org owner) → 404', async () => {
    seed();
    const { res, state } = makeRes();
    await handler(makeReq(okQuery, NON_STAFF_UID), res);
    expect(state.statusCode).toBe(404);
  });

  it('empty/unset staff allowlist → 404 even for a valid session', async () => {
    delete process.env.REPORTING_STAFF_USER_IDS;
    seed();
    const { res, state } = makeRes();
    await handler(makeReq(okQuery, STAFF_UID), res);
    expect(state.statusCode).toBe(404);
  });

  it('staff → 200 with aggregate JSON', async () => {
    seed();
    const { res, state } = makeRes();
    await handler(makeReq(okQuery, STAFF_UID), res);
    expect(state.statusCode).toBe(200);
    expect(state.headers['cache-control']).toBe('no-store');
    expect(Object.keys(state.body).sort()).toEqual([...APPROVED].sort());
  });
});

describe('GET /api/reports — routing & method', () => {
  it('unknown report (authorized) → 404', async () => {
    seed();
    const { res, state } = makeRes();
    await handler(makeReq({ ...okQuery, report: 'nope' }, STAFF_UID), res);
    expect(state.statusCode).toBe(404);
  });

  it('non-GET method → 405 + Allow: GET', async () => {
    const req = { method: 'POST', headers: {}, query: { report: 'acquisition' } } as unknown as VercelRequest;
    const { res, state } = makeRes();
    await handler(req, res);
    expect(state.statusCode).toBe(405);
    expect(state.headers['allow']).toBe('GET');
  });
});

describe('GET /api/reports/acquisition — validation', () => {
  it('missing from → 400', async () => {
    seed();
    const { res, state } = makeRes();
    await handler(makeReq({ to: WIN_TO }, STAFF_UID), res);
    expect(state.statusCode).toBe(400);
    expect(typeof state.body.error).toBe('string');
  });
  it('missing to → 400', async () => {
    seed();
    const { res, state } = makeRes();
    await handler(makeReq({ from: WIN_FROM }, STAFF_UID), res);
    expect(state.statusCode).toBe(400);
  });
  it('inverted range → 400', async () => {
    seed();
    const { res, state } = makeRes();
    await handler(makeReq({ from: WIN_TO, to: WIN_FROM }, STAFF_UID), res);
    expect(state.statusCode).toBe(400);
  });
  it('>90-day range → 400', async () => {
    seed();
    const { res, state } = makeRes();
    await handler(makeReq({ from: '2026-01-01T00:00:00.000Z', to: '2026-06-01T00:00:00.000Z' }, STAFF_UID), res);
    expect(state.statusCode).toBe(400);
  });
  it('non-integer topN → 400', async () => {
    seed();
    const { res, state } = makeRes();
    await handler(makeReq({ ...okQuery, topN: '5.5' }, STAFF_UID), res);
    expect(state.statusCode).toBe(400);
  });
  it('topN bounds enforced (default 10; clamp 999→50, 0→1)', async () => {
    seed();
    const def = makeRes(); await handler(makeReq(okQuery, STAFF_UID), def.res);
    expect((def.state.body.policy as { topN: number }).topN).toBe(10);
    const hi = makeRes(); await handler(makeReq({ ...okQuery, topN: '999' }, STAFF_UID), hi.res);
    expect((hi.state.body.policy as { topN: number }).topN).toBe(50);
    const lo = makeRes(); await handler(makeReq({ ...okQuery, topN: '0' }, STAFF_UID), lo.res);
    expect((lo.state.body.policy as { topN: number }).topN).toBe(1);
  });
});

describe('GET /api/reports/acquisition — privacy & suppression', () => {
  it('caller cannot override k / minGroupSize', async () => {
    seed();
    const { res, state } = makeRes();
    // Attempt to inject k=1 via query — must be ignored.
    await handler(makeReq({ ...okQuery, k: '1', minGroupSize: '1' }, STAFF_UID), res);
    expect((state.body.policy as { minGroupSize: number }).minGroupSize).toBe(5);
    const bySource = state.body.bySource as { key: string }[];
    expect(bySource.find((g) => g.key === 'linkedin')).toBeUndefined(); // <5 stays suppressed
  });

  it('response omits totalInWindow and contains ONLY approved fields', async () => {
    seed();
    const { res, state } = makeRes();
    await handler(makeReq(okQuery, STAFF_UID), res);
    expect('totalInWindow' in state.body).toBe(false);
    expect(Object.keys(state.body).sort()).toEqual([...APPROVED].sort());
    expect(JSON.stringify(state.body)).not.toContain('totalInWindow');
  });

  it('response contains no PII field names or values', async () => {
    seed();
    const { res, state } = makeRes();
    await handler(makeReq(okQuery, STAFF_UID), res);
    const s = JSON.stringify(state.body);
    for (const v of Object.values(PII)) expect(s).not.toContain(v);
    for (const k of ['full_name', 'work_email', 'organization', 'security_challenge', 'evaluation_reason', 'id', 'requests'])
      expect(s).not.toContain(`"${k}"`);
    expect(s).not.toContain('http'); // no full referrer URL
  });

  it('direct/unknown + referral + suppression semantics intact', async () => {
    seed();
    const { res, state } = makeRes();
    await handler(makeReq(okQuery, STAFF_UID), res);
    const bySource = state.body.bySource as { key: string; count: number }[];
    expect(bySource).toContainEqual({ key: 'reddit', count: 6 });
    expect(bySource).toContainEqual({ key: 'direct/unknown', count: 5 });
    expect(bySource).toContainEqual({ key: 'news.ycombinator.com', count: 5 }); // referral domain as source
    expect(bySource.find((g) => g.key === 'linkedin')).toBeUndefined();
  });
});

describe('GET /api/reports/acquisition — error safety', () => {
  it('internal store failure → generic 500, no leak', async () => {
    const store = seed();
    vi.spyOn(store, 'getAcquisitionReport').mockRejectedValueOnce(new Error('boom: SELECT ... secret sql'));
    const { res, state } = makeRes();
    await handler(makeReq(okQuery, STAFF_UID), res);
    expect(state.statusCode).toBe(500);
    const s = JSON.stringify(state.body);
    expect(s).not.toContain('SELECT');
    expect(s).not.toContain('boom');
    expect(s).not.toContain(STAFF_UID);
    expect(state.body.error).toBe('Unable to generate the report. Please try again shortly.');
  });

  it('validation error body echoes no caller input / sensitive data', async () => {
    seed();
    const { res, state } = makeRes();
    await handler(makeReq({ from: 'DROP TABLE users', to: WIN_TO }, STAFF_UID), res);
    expect(state.statusCode).toBe(400);
    expect(JSON.stringify(state.body)).not.toContain('DROP TABLE');
  });
});
