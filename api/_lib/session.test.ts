import { describe, it, expect } from 'vitest';
import {
  clearSessionCookie,
  createSessionToken,
  parseCookies,
  serializeSessionCookie,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from './session.js';

const SECRET = 'unit-test-session-secret-value';

describe('session tokens', () => {
  it('round-trips a valid token to the user id', () => {
    const token = createSessionToken('user-123', SECRET);
    expect(verifySessionToken(token, SECRET)).toBe('user-123');
  });

  it('rejects a tampered signature', () => {
    const token = createSessionToken('user-123', SECRET);
    const tampered = `${token}x`;
    expect(verifySessionToken(tampered, SECRET)).toBeNull();
  });

  it('rejects a token signed with a different secret', () => {
    const token = createSessionToken('user-123', SECRET);
    expect(verifySessionToken(token, 'different-secret')).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = createSessionToken('user-123', SECRET, -1);
    expect(verifySessionToken(token, SECRET)).toBeNull();
  });

  it('rejects null/garbage tokens', () => {
    expect(verifySessionToken(null, SECRET)).toBeNull();
    expect(verifySessionToken('garbage', SECRET)).toBeNull();
  });
});

describe('session cookies', () => {
  it('is HttpOnly + SameSite=Lax and Secure only in production', () => {
    const insecure = serializeSessionCookie('tok', { secure: false });
    expect(insecure).toContain(`${SESSION_COOKIE_NAME}=tok`);
    expect(insecure).toContain('HttpOnly');
    expect(insecure).toContain('SameSite=Lax');
    expect(insecure).not.toContain('Secure');

    const secure = serializeSessionCookie('tok', { secure: true });
    expect(secure).toContain('Secure');
  });

  it('clears the cookie with Max-Age=0', () => {
    const cleared = clearSessionCookie({ secure: false });
    expect(cleared).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(cleared).toContain('Max-Age=0');
    expect(cleared).toContain('HttpOnly');
  });

  it('parses a cookie header', () => {
    const cookies = parseCookies(`${SESSION_COOKIE_NAME}=abc; other=def`);
    expect(cookies[SESSION_COOKIE_NAME]).toBe('abc');
    expect(cookies.other).toBe('def');
    expect(parseCookies(undefined)).toEqual({});
  });
});
