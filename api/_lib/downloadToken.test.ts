import { describe, it, expect } from 'vitest';
import { createDownloadToken, verifyDownloadToken } from './downloadToken.js';

const SECRET = 'test-download-token-secret';

describe('download token (short-lived, org+object scoped)', () => {
  it('mints a token that verifies back to the same org + path', () => {
    const t = createDownloadToken({ org: 'org-1', path: 'rapha-agent-1.0.1-windows.zip' }, SECRET, 60);
    const p = verifyDownloadToken(t, SECRET);
    expect(p).not.toBeNull();
    expect(p!.org).toBe('org-1');
    expect(p!.path).toBe('rapha-agent-1.0.1-windows.zip');
    expect(p!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('rejects an EXPIRED token', () => {
    const t = createDownloadToken({ org: 'org-1', path: 'p.zip' }, SECRET, -1); // already expired
    expect(verifyDownloadToken(t, SECRET)).toBeNull();
  });

  it('rejects a token signed with a different secret', () => {
    const t = createDownloadToken({ org: 'org-1', path: 'p.zip' }, SECRET, 60);
    expect(verifyDownloadToken(t, 'other-secret')).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const t = createDownloadToken({ org: 'org-1', path: 'p.zip' }, SECRET, 60);
    const [, sig] = t.split('.');
    const forged = `${Buffer.from(JSON.stringify({ org: 'attacker', path: 'p.zip', exp: 9999999999 })).toString('base64url')}.${sig}`;
    expect(verifyDownloadToken(forged, SECRET)).toBeNull();
  });

  it('rejects malformed / empty tokens', () => {
    expect(verifyDownloadToken('', SECRET)).toBeNull();
    expect(verifyDownloadToken('no-dot', SECRET)).toBeNull();
    expect(verifyDownloadToken(null, SECRET)).toBeNull();
  });
});
