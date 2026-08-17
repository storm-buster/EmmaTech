import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password hashing (scrypt)', () => {
  it('produces a self-describing scrypt hash, not the plaintext', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(hash).not.toContain('correct horse battery staple');
    expect(hash.split('$')).toHaveLength(6);
  });

  it('uses a random salt (two hashes of the same password differ)', async () => {
    const a = await hashPassword('same-password-123');
    const b = await hashPassword('same-password-123');
    expect(a).not.toBe(b);
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('s3cure-password!');
    expect(await verifyPassword('s3cure-password!', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('s3cure-password!');
    expect(await verifyPassword('wrong-password!!', hash)).toBe(false);
  });

  it('rejects a malformed stored hash', async () => {
    expect(await verifyPassword('whatever', 'not-a-valid-hash')).toBe(false);
    expect(await verifyPassword('whatever', '')).toBe(false);
  });
});
