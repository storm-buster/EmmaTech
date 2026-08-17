/**
 * Password hashing using Node's built-in scrypt (a modern, memory-hard KDF
 * recommended by OWASP). No third-party dependency required.
 *
 * Stored format (self-describing so parameters can evolve):
 *   scrypt$<N>$<r>$<p>$<saltHex>$<hashHex>
 *
 * SECURITY: plaintext passwords are never stored; only the derived hash is.
 * Verification uses a constant-time comparison.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';

/** Promise wrapper around scrypt that supports the cost-parameter options. */
function scrypt(
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

// Cost parameters. N*128*r ≈ 16 MiB of memory, within Node's default maxmem.
const N = 16384;
const R = 8;
const P = 1;
const KEY_LEN = 64;
const SALT_LEN = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const derived = (await scrypt(password.normalize('NFKC'), salt, KEY_LEN, {
    N,
    r: R,
    p: P,
  })) as Buffer;
  return `scrypt$${N}$${R}$${P}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') {
      return false;
    }
    const n = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const salt = Buffer.from(parts[4], 'hex');
    const expected = Buffer.from(parts[5], 'hex');
    if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p) || expected.length === 0) {
      return false;
    }
    const derived = (await scrypt(password.normalize('NFKC'), salt, expected.length, {
      N: n,
      r,
      p,
    })) as Buffer;
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
