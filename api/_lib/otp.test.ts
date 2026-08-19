import { describe, it, expect } from 'vitest';
import {
  generateOtpCode,
  hashOtpCode,
  isOtpExpired,
  otpExpiryFrom,
  OTP_TTL_MS,
  verifyOtpCode,
} from './otp.js';

const SECRET = 'otp-unit-secret';

describe('generateOtpCode', () => {
  it('always returns a zero-paddable 6-digit numeric string', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });

  it('produces varied codes (not a constant)', () => {
    const set = new Set(Array.from({ length: 50 }, () => generateOtpCode()));
    expect(set.size).toBeGreaterThan(1);
  });
});

describe('hashOtpCode', () => {
  it('is deterministic and never equals the plaintext code', () => {
    const h1 = hashOtpCode('123456', 'a@b.com', SECRET);
    const h2 = hashOtpCode('123456', 'a@b.com', SECRET);
    expect(h1).toBe(h2);
    expect(h1).not.toBe('123456');
  });

  it('is bound to the email and the code', () => {
    expect(hashOtpCode('123456', 'a@b.com', SECRET)).not.toBe(hashOtpCode('123456', 'c@d.com', SECRET));
    expect(hashOtpCode('123456', 'a@b.com', SECRET)).not.toBe(hashOtpCode('654321', 'a@b.com', SECRET));
  });
});

describe('verifyOtpCode', () => {
  const stored = hashOtpCode('123456', 'a@b.com', SECRET);
  it('accepts the correct code and rejects wrong code/email', () => {
    expect(verifyOtpCode('123456', 'a@b.com', SECRET, stored)).toBe(true);
    expect(verifyOtpCode('000000', 'a@b.com', SECRET, stored)).toBe(false);
    expect(verifyOtpCode('123456', 'other@b.com', SECRET, stored)).toBe(false);
  });
});

describe('otp expiry', () => {
  it('is not expired just after creation and expired after the TTL', () => {
    const now = Date.now();
    const exp = otpExpiryFrom(now);
    expect(isOtpExpired(exp, now)).toBe(false);
    expect(isOtpExpired(exp, now + OTP_TTL_MS + 1)).toBe(true);
  });
});
