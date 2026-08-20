import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const EXPECTED_URL = 'https://qpbd1jhpvo1xlmt2.public.blob.vercel-storage.com/rapha-agent-1.0.1-windows.zip';
const EXPECTED_SHA = 'd34f01fb12c0071a0f15f754f988119c2e5a33f4be8956feba87cdf8de40ba81';

const root = process.cwd();
const manifestRaw = readFileSync(join(root, 'public', 'rapha-agent-manifest.json'), 'utf8');
const installer = readFileSync(join(root, 'public', 'install-rapha.ps1'), 'utf8');

describe('rapha-agent-manifest.json', () => {
  const manifest = JSON.parse(manifestRaw) as { version: string; url: string; sha256: string };

  it('is valid JSON with the exact version, Blob URL and SHA-256', () => {
    expect(manifest.version).toBe('1.0.1');
    expect(manifest.url).toBe(EXPECTED_URL);
    expect(manifest.sha256).toBe(EXPECTED_SHA);
  });

  it('uses an HTTPS URL that is NOT github.com', () => {
    expect(manifest.url.startsWith('https://')).toBe(true);
    expect(manifest.url).not.toContain('github.com');
  });
});

describe('install-rapha.ps1 (EmmaTech bootstrapper)', () => {
  it('pins the exact EmmaTech Blob URL and SHA-256', () => {
    expect(installer).toContain(EXPECTED_URL);
    expect(installer).toContain(EXPECTED_SHA);
  });

  it('contains NO github.com download URL (customers never touch GitHub)', () => {
    // The prose intentionally says "customer never needs GitHub"; what must NOT
    // appear is a github.com URL / release link as the download source.
    expect(installer.toLowerCase()).not.toContain('github.com');
    expect(installer.toLowerCase()).not.toMatch(/releases\/download/);
  });

  it('verifies SHA-256 before extraction and fails closed on mismatch', () => {
    expect(installer).toContain('Get-FileHash');
    expect(installer).toMatch(/checksum verification FAILED/i);
    // The verification happens in Get-AgentPackage, before Install-AgentFiles/Expand-Archive.
    const verifyIdx = installer.indexOf('Test-FileSha256 -Path $dest');
    const extractIdx = installer.indexOf('Expand-Archive');
    expect(verifyIdx).toBeGreaterThan(-1);
    expect(extractIdx).toBeGreaterThan(-1);
    expect(verifyIdx).toBeLessThan(extractIdx);
  });

  it('passes the enrollment token via stdin and never puts it in a URL or command line', () => {
    expect(installer).toContain('StandardInput.WriteLine($Token)');
    expect(installer).toMatch(/AsSecureString/); // secure no-echo prompt
    // No token query-string patterns.
    expect(installer).not.toMatch(/enrollment_token=/);
    expect(installer).not.toMatch(/\?token=/);
  });

  it('reproduces the real v1.0.1 enroll/service contract (bundled python/winsw, provision, RAPHAAgent)', () => {
    expect(installer).toContain('rapha_agent.provision');
    expect(installer).toContain('RAPHAAgent');
    expect(installer).toContain('python\\python.exe');
    expect(installer).toContain('winsw.exe');
  });
});
