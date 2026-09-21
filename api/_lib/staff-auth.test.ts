import { describe, it, expect, vi, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireStaff, enforceStaffOrNotFound } from './staff-auth.js';
import { parseStaffAllowlist, type AppConfig } from './config.js';
import { createSessionToken, SESSION_COOKIE_NAME } from './session.js';

const SECRET = 'test-session-secret-value';
const STAFF_UID = 'staff-uid-0001';
const NON_STAFF_UID = 'user-uid-9999'; // e.g. an org OWNER — still not staff

function cfg(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    isProduction: false,
    sessionSecret: SECRET,
    raphaBaseUrl: '',
    raphaServiceToken: '',
    databaseUrl: null,
    resendApiKey: null,
    otpEmailFrom: null,
    agentPackagePathname: 'x.zip',
    blobConfigured: false,
    staffUserIds: new Set([STAFF_UID]),
    ...overrides,
  };
}

function reqWithSession(uid: string | null, secret = SECRET): VercelRequest {
  const cookie = uid ? `${SESSION_COOKIE_NAME}=${createSessionToken(uid, secret)}` : '';
  return { headers: { cookie } } as unknown as VercelRequest;
}

function mockRes() {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    setHeader(k: string, v: string) { this.headers[k] = v; return this; },
    getHeader(k: string) { return this.headers[k]; },
    json(obj: unknown) { this.body = obj; return this; },
  };
  return res as unknown as VercelResponse & typeof res;
}

afterEach(() => vi.restoreAllMocks());

describe('requireStaff — decision', () => {
  it('unauthenticated (no session) → denied', () => {
    expect(requireStaff(reqWithSession(null), cfg())).toEqual({ ok: false });
  });

  it('authenticated staff (uid in allowlist) → allowed', () => {
    expect(requireStaff(reqWithSession(STAFF_UID), cfg())).toEqual({ ok: true, userId: STAFF_UID });
  });

  it('authenticated non-staff → denied', () => {
    expect(requireStaff(reqWithSession(NON_STAFF_UID), cfg())).toEqual({ ok: false });
  });

  it('org owner (valid session, not in allowlist) is NOT staff → denied', () => {
    // Org role is never consulted by requireStaff; a real, valid session whose
    // user happens to be an org `owner` must still be denied staff access.
    const ownerCfg = cfg({ staffUserIds: new Set([STAFF_UID]) });
    expect(requireStaff(reqWithSession(NON_STAFF_UID), ownerCfg)).toEqual({ ok: false });
  });

  it('empty allowlist → denied (never "allow everyone"), even for a valid session', () => {
    expect(requireStaff(reqWithSession(STAFF_UID), cfg({ staffUserIds: new Set() }))).toEqual({ ok: false });
  });

  it('missing SESSION_SECRET → denied even with a cookie present', () => {
    // Cookie was signed with the real secret, but config has no secret → cannot verify.
    expect(requireStaff(reqWithSession(STAFF_UID), cfg({ sessionSecret: '' }))).toEqual({ ok: false });
  });

  it('tampered/invalid token → denied', () => {
    const req = { headers: { cookie: `${SESSION_COOKIE_NAME}=not.a.valid.token` } } as unknown as VercelRequest;
    expect(requireStaff(req, cfg())).toEqual({ ok: false });
  });

  it('session signed with a different secret → denied', () => {
    expect(requireStaff(reqWithSession(STAFF_UID, 'other-secret'), cfg())).toEqual({ ok: false });
  });

  it('malformed allowlist entries do not accidentally authorize', () => {
    // Wildcards / blanks / spaced junk are dropped during parsing.
    const parsed = parseStaffAllowlist('  , * , bad id , , ' + STAFF_UID);
    expect(parsed.has('*')).toBe(false);
    expect(parsed.has('bad id')).toBe(false);
    expect(parsed.has('')).toBe(false);
    expect(parsed.has(STAFF_UID)).toBe(true);
    // A user whose id is '*' must never be authorized by a '*' entry.
    expect(requireStaff(reqWithSession('*'), cfg({ staffUserIds: parsed }))).toEqual({ ok: false });
  });

  it('parseStaffAllowlist: absent/blank input → empty set (deny all)', () => {
    expect(parseStaffAllowlist(undefined).size).toBe(0);
    expect(parseStaffAllowlist('').size).toBe(0);
    expect(parseStaffAllowlist('   ,  , ').size).toBe(0);
  });
});

describe('enforceStaffOrNotFound — response behavior', () => {
  it('non-staff → 404 with a generic body (no endpoint disclosure)', () => {
    const res = mockRes();
    const out = enforceStaffOrNotFound(reqWithSession(NON_STAFF_UID), res, cfg());
    expect(out).toBeNull();
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('unauthenticated → 404', () => {
    const res = mockRes();
    expect(enforceStaffOrNotFound(reqWithSession(null), res, cfg())).toBeNull();
    expect(res.statusCode).toBe(404);
  });

  it('staff → returns userId, does not send 404', () => {
    const res = mockRes();
    const out = enforceStaffOrNotFound(reqWithSession(STAFF_UID), res, cfg());
    expect(out).toBe(STAFF_UID);
    expect(res.statusCode).toBe(0); // untouched
  });
});

describe('security — no secret/PII leakage', () => {
  it('unauthorized response body contains no user id, cookie, or secret', () => {
    const res = mockRes();
    enforceStaffOrNotFound(reqWithSession(NON_STAFF_UID), res, cfg());
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain(NON_STAFF_UID);
    expect(serialized).not.toContain(STAFF_UID);
    expect(serialized).not.toContain(SECRET);
    expect(serialized).not.toMatch(/et_session/i);
  });

  it('the helper does not log anything (no secrets/cookies/ids emitted)', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();
    requireStaff(reqWithSession(STAFF_UID), cfg());
    requireStaff(reqWithSession(NON_STAFF_UID), cfg());
    enforceStaffOrNotFound(reqWithSession(NON_STAFF_UID), res, cfg());
    expect(logSpy).not.toHaveBeenCalled();
    expect(errSpy).not.toHaveBeenCalled();
  });
});
