import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Phase 3 Wave 2: the installer + manifest are no longer public static assets,
 * and the server-side installer TEMPLATE contains no permanent/public agent
 * package URL — the package URL is injected per request as a short-lived
 * tokenized URL by GET /api/organization/installer.
 */
const root = process.cwd();
const OLD_PUBLIC_BLOB = 'qpbd1jhpvo1xlmt2.public.blob.vercel-storage.com';

describe('public agent delivery removed from the marketing build', () => {
  it('no public/install-rapha.ps1 static asset exists', () => {
    expect(existsSync(join(root, 'public', 'install-rapha.ps1'))).toBe(false);
  });
  it('no public/rapha-agent-manifest.json static asset exists', () => {
    expect(existsSync(join(root, 'public', 'rapha-agent-manifest.json'))).toBe(false);
  });
});

describe('server-side installer template (private, tokenized delivery)', () => {
  const mod = readFileSync(join(root, 'api', '_lib', 'installerAsset.ts'), 'utf8');
  const b64 = mod.match(/INSTALLER_TEMPLATE_BASE64\s*=\s*'([A-Za-z0-9+/=]+)'/)?.[1] ?? '';
  const template = Buffer.from(b64, 'base64').toString('utf8');

  it('contains NO permanent public agent-package (Blob) URL', () => {
    expect(b64.length).toBeGreaterThan(1000);
    expect(template).not.toContain(OLD_PUBLIC_BLOB);
    expect(template).not.toContain('public.blob.vercel-storage.com');
  });
  it('uses the per-request package-URL placeholder', () => {
    expect(template).toContain('@@AGENT_PACKAGE_URL@@');
  });
  it('preserves SHA-256 verification before extraction (integrity intact)', () => {
    expect(template).toContain('Get-FileHash');
    const verifyIdx = template.indexOf('Test-FileSha256 -Path $dest');
    const extractIdx = template.indexOf('Expand-Archive');
    expect(verifyIdx).toBeGreaterThan(-1);
    expect(extractIdx).toBeGreaterThan(-1);
    expect(verifyIdx).toBeLessThan(extractIdx);
  });
});
