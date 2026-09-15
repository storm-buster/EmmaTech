import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePath, routePath, legacyHashToPath, docIdFromPath } from './routing';

describe('parsePath — pathname → route', () => {
  const cases: Array<[string, string]> = [
    ['/', 'home'],
    ['/rapha', 'product'],
    ['/rapha/', 'product'],
    ['/RAPHA', 'product'],
    ['/compliance', 'compliance'],
    ['/private-deployment', 'private-deployment'],
    ['/pricing', 'private-deployment'], // defensive alias (no public pricing page)
    ['/request-access', 'request-access'],
    ['/careers', 'careers'],
    ['/contact', 'contact'],
    ['/privacy', 'privacy'],
    ['/terms', 'terms'],
    ['/login', 'login'],
    ['/signup', 'signup'],
    ['/account', 'account'],
    ['/deploy', 'deploy'],
    ['/docs', 'docs'],
    ['/docs/windows', 'docs'],
    ['/console', 'console'],
    ['/nope', 'notfound'],
    ['/api/access-requests', 'notfound'],
  ];
  for (const [path, route] of cases) {
    it(`${path} → ${route}`, () => {
      expect(parsePath(path)).toBe(route);
    });
  }
});

describe('routePath — route → canonical pathname', () => {
  it('maps routes to their canonical paths', () => {
    expect(routePath('home')).toBe('/');
    expect(routePath('product')).toBe('/rapha');
    expect(routePath('compliance')).toBe('/compliance');
    expect(routePath('private-deployment')).toBe('/private-deployment');
    expect(routePath('request-access')).toBe('/request-access');
    expect(routePath('docs')).toBe('/docs');
    expect(routePath('login')).toBe('/login');
    expect(routePath('console')).toBe('/console');
    expect(routePath('notfound')).toBe('/404');
  });
});

describe('legacyHashToPath — legacy #/ hash → pathname', () => {
  const cases: Array<[string, string | null]> = [
    ['#/', '/'],
    ['#/product', '/rapha'],
    ['#/pricing', '/private-deployment'],
    ['#/private-deployment', '/private-deployment'],
    ['#/compliance', '/compliance'],
    ['#/request-access', '/request-access'],
    ['#/contact', '/contact'],
    ['#/careers', '/careers'],
    ['#/privacy', '/privacy'],
    ['#/terms', '/terms'],
    ['#/login', '/login'],
    ['#/signup', '/signup'],
    ['#/account', '/account'],
    ['#/deploy', '/deploy'],
    ['#/console', '/console'],
    ['#/docs', '/docs'],
    ['#/docs/windows', '/docs/windows'],
    ['#/docs/web-services', '/docs/web-services'],
    ['#/unknown-thing', null],
    ['#forensics', null], // not a legacy route hash (in-app hash, e.g. console)
    ['', null],
  ];
  for (const [hash, expected] of cases) {
    it(`${hash || '(empty)'} → ${expected}`, () => {
      expect(legacyHashToPath(hash)).toBe(expected);
    });
  }
});

describe('docIdFromPath', () => {
  it('extracts the docs sub-id', () => {
    expect(docIdFromPath('/docs')).toBeNull();
    expect(docIdFromPath('/docs/')).toBeNull();
    expect(docIdFromPath('/docs/windows')).toBe('windows');
    expect(docIdFromPath('/docs/web-services')).toBe('web-services');
    expect(docIdFromPath('/rapha')).toBeNull();
  });
});

describe('parsePath — strict matching (Phase 2C)', () => {
  const cases: Array<[string, string]> = [
    // Valid exact routes still resolve.
    ['/rapha', 'product'],
    ['/compliance', 'compliance'],
    ['/private-deployment', 'private-deployment'],
    ['/docs', 'docs'],
    ['/docs/overview', 'docs'],
    ['/docs/web-services', 'docs'],
    ['/docs/OVERVIEW', 'docs'], // case-insensitive valid id
    // Invalid CHILD paths must NOT silently render the parent → notfound.
    ['/rapha/anything', 'notfound'],
    ['/rapha/x/y', 'notfound'],
    ['/compliance/garbage', 'notfound'],
    ['/private-deployment/pricing', 'notfound'],
    ['/contact/extra', 'notfound'],
    // Invalid or too-deep docs paths → notfound.
    ['/docs/nonexistent-doc', 'notfound'],
    ['/docs/overview/extra', 'notfound'],
    ['/docs/windows/install', 'notfound'],
    // Query/hash on a valid route are ignored (still valid).
    ['/rapha?utm=x', 'product'],
    ['/docs/overview#section', 'docs'],
  ];
  for (const [path, route] of cases) {
    it(`${path} → ${route}`, () => {
      expect(parsePath(path)).toBe(route);
    });
  }
});

describe('Vercel rewrite source safety (mirrors vercel.json — scoped SPA fallback)', () => {
  // vercel.json rewrites ONLY the private/app routes to /index.html. Everything
  // else is served from the filesystem (prerendered public routes + static
  // assets) or, if absent, falls through to Vercel's 404.html (true 404).
  const spa = new RegExp('^/(login|signup|account|deploy|console|request-access)(/.*)?$');
  it('rewrites private/app routes (and their sub-paths) to the SPA shell', () => {
    for (const p of ['/login', '/signup', '/account', '/deploy', '/console', '/request-access', '/console/anything']) {
      expect(spa.test(p)).toBe(true);
    }
  });
  it('does NOT rewrite public routes (served as prerendered files by filesystem)', () => {
    for (const p of ['/', '/rapha', '/compliance', '/private-deployment', '/docs', '/docs/overview', '/contact', '/careers', '/privacy', '/terms']) {
      expect(spa.test(p)).toBe(false);
    }
  });
  it('does NOT rewrite API, static assets, or unknown paths (→ function / file / 404.html)', () => {
    for (const p of [
      '/api/access-requests',
      '/api/me',
      '/robots.txt',
      '/sitemap.xml',
      '/og-image.png',
      '/install-rapha.ps1',
      '/rapha-agent-manifest.json',
      '/assets/index-abc123.js',
      '/nonexistent-xyz',
      '/rapha/garbage',
    ]) {
      expect(spa.test(p)).toBe(false);
    }
  });
});

describe('vercel.json integrity (Phase 2C — true 404 via scoped rewrites)', () => {
  const cfg = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8'));
  it('has NO broad catch-all rewrite (so unmatched paths reach 404.html)', () => {
    const sources = cfg.rewrites.map((r: { source: string }) => r.source);
    for (const s of sources) {
      expect(s).not.toContain('?!api'); // the old catch-all is gone
      expect(s).toMatch(/login\|signup\|account\|deploy\|console\|request-access/);
    }
  });
  it('rewrites only the private/app routes to the SPA shell', () => {
    expect(cfg.rewrites.every((r: { destination: string }) => r.destination === '/index.html')).toBe(true);
  });
  it('keeps X-Robots-Tag noindex on private routes', () => {
    const hasNoindex = cfg.headers.some((h: { headers: Array<{ key: string; value: string }> }) =>
      h.headers.some((x) => x.key === 'X-Robots-Tag' && x.value === 'noindex'),
    );
    expect(hasNoindex).toBe(true);
  });
});
