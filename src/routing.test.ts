import { describe, it, expect } from 'vitest';
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

describe('Vercel SPA rewrite source safety (matches vercel.json)', () => {
  // Mirror of vercel.json rewrites[0].source; must catch SPA routes but NEVER
  // /api/* or any file with an extension (robots.txt, sitemap.xml, installer,
  // manifest, /assets/*.js|css, images).
  const re = new RegExp('^/((?!api/|.*\\.).*)$');
  it('rewrites SPA pathname routes to index.html', () => {
    for (const p of ['/', '/rapha', '/compliance', '/private-deployment', '/request-access', '/docs', '/docs/windows', '/contact', '/careers', '/login', '/console']) {
      expect(re.test(p)).toBe(true);
    }
  });
  it('never rewrites API or static files', () => {
    for (const p of [
      '/api/access-requests',
      '/api/me',
      '/robots.txt',
      '/sitemap.xml',
      '/install-rapha.ps1',
      '/rapha-agent-manifest.json',
      '/assets/index-abc123.js',
      '/assets/index-abc123.css',
      '/vite.png',
    ]) {
      expect(re.test(p)).toBe(false);
    }
  });
});
