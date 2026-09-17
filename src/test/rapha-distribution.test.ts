import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Phase 3 remediation: the RAPHA installer + agent manifest are NO LONGER public
 * static assets. They must not be emitted into the public marketing build; the
 * installer is served only by the authenticated endpoint
 * GET /api/organization/installer (see api/organization/[action].ts) from the
 * server-side asset module. These tests lock that boundary in.
 */
const root = process.cwd();

describe('public agent delivery is removed from the marketing build', () => {
  it('no public/install-rapha.ps1 static asset exists', () => {
    expect(existsSync(join(root, 'public', 'install-rapha.ps1'))).toBe(false);
  });
  it('no public/rapha-agent-manifest.json static asset exists', () => {
    expect(existsSync(join(root, 'public', 'rapha-agent-manifest.json'))).toBe(false);
  });
});

describe('server-side installer asset (authenticated delivery only)', () => {
  const mod = readFileSync(join(root, 'api', '_lib', 'installerAsset.ts'), 'utf8');
  // Decode the base64-embedded script exactly as the endpoint does.
  const b64 = mod.match(/INSTALLER_PS1_BASE64\s*=\s*'([A-Za-z0-9+/=]+)'/)?.[1] ?? '';
  const script = Buffer.from(b64, 'base64').toString('utf8');

  it('decodes to the real installer (integrity preserved through base64 round-trip)', () => {
    expect(b64.length).toBeGreaterThan(1000);
    expect(script).toContain('EmmaTech RAPHA Windows Agent installer');
    expect(script).toContain('rapha_agent.provision');
    expect(script).toContain('RAPHAAgent');
  });

  it('still verifies SHA-256 before extraction and passes the token via stdin', () => {
    expect(script).toContain('Get-FileHash');
    expect(script).toContain('StandardInput.WriteLine($Token)');
    const verifyIdx = script.indexOf('Test-FileSha256 -Path $dest');
    const extractIdx = script.indexOf('Expand-Archive');
    expect(verifyIdx).toBeGreaterThan(-1);
    expect(extractIdx).toBeGreaterThan(-1);
    expect(verifyIdx).toBeLessThan(extractIdx);
  });
});
