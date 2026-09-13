import { describe, it, expect } from 'vitest';
import {
  metaForPath,
  canonicalFor,
  indexablePaths,
  prerenderPaths,
  buildSitemapXml,
  SITE_ORIGIN,
} from './routeSeo';

const PUBLIC = ['/', '/rapha', '/compliance', '/private-deployment', '/contact', '/careers', '/privacy', '/terms', '/docs'];
const PRIVATE = ['/request-access', '/login', '/signup', '/account', '/deploy', '/console'];

describe('metaForPath — public routes', () => {
  it('every public route has a unique, non-empty, indexable title + description', () => {
    const titles = new Set<string>();
    for (const p of PUBLIC) {
      const m = metaForPath(p);
      expect(m.title.length).toBeGreaterThan(5);
      expect(m.description.length).toBeGreaterThan(20);
      expect(m.robots).toBe('index,follow');
      expect(m.title).not.toMatch(/The Future of Autonomous Cyber Defense/); // no stale title
      titles.add(m.title);
    }
    expect(titles.size).toBe(PUBLIC.length); // all unique
  });

  it('canonical is self-referencing on the canonical host', () => {
    expect(metaForPath('/')).toMatchObject({ path: '/' });
    expect(canonicalFor('/')).toBe(`${SITE_ORIGIN}/`);
    expect(canonicalFor('/rapha')).toBe(`${SITE_ORIGIN}/rapha`);
    expect(canonicalFor('/docs/overview')).toBe(`${SITE_ORIGIN}/docs/overview`);
  });

  it('normalizes trailing slashes', () => {
    expect(metaForPath('/rapha/').title).toBe(metaForPath('/rapha').title);
  });

  it('resolves mixed-case public paths to the canonical route metadata (lowercase canonical)', () => {
    const canonical = metaForPath('/rapha');
    for (const variant of ['/RAPHA', '/Rapha', '/rApHa', '/RAPHA/']) {
      const m = metaForPath(variant);
      expect(m.title).toBe(canonical.title);
      expect(m.robots).toBe('index,follow');
      expect(canonicalFor(m.path)).toBe(`${SITE_ORIGIN}/rapha`);
    }
    // Mixed-case docs too.
    expect(metaForPath('/Docs/Overview').title).toBe(metaForPath('/docs/overview').title);
  });
});

describe('metaForPath — private/conversion routes are noindex', () => {
  for (const p of PRIVATE) {
    it(`${p} is noindex`, () => {
      expect(metaForPath(p).robots).toMatch(/noindex/);
    });
  }
  it('unknown route is noindex', () => {
    expect(metaForPath('/nope').robots).toMatch(/noindex/);
  });
});

describe('docs metadata', () => {
  it('indexable docs are index,follow with unique titles', () => {
    for (const id of ['overview', 'architecture', 'requirements', 'quick-start', 'register-sensor', 'web-console', 'linux']) {
      const m = metaForPath(`/docs/${id}`);
      expect(m.robots).toBe('index,follow');
      expect(m.title).toMatch(/RAPHA Documentation \| EmmaTech/);
    }
  });
  it('sensitive docs (windows install, web-services API keys) are noindex', () => {
    expect(metaForPath('/docs/windows').robots).toMatch(/noindex/);
    expect(metaForPath('/docs/web-services').robots).toMatch(/noindex/);
  });
});

describe('sitemap', () => {
  const xml = buildSitemapXml();
  it('includes every indexable public URL', () => {
    for (const p of indexablePaths()) {
      expect(xml).toContain(`<loc>${canonicalFor(p)}</loc>`);
    }
  });
  it('excludes ALL private/conversion routes (regression)', () => {
    for (const p of [...PRIVATE, '/api', '/api/access-requests']) {
      expect(xml).not.toContain(`${SITE_ORIGIN}${p}<`);
      expect(xml).not.toContain(`${SITE_ORIGIN}${p}</loc>`);
    }
    // request-access explicitly out.
    expect(xml).not.toContain('/request-access');
    expect(xml).not.toContain('/login');
    expect(xml).not.toContain('/console');
  });
  it('excludes noindex docs (windows, web-services)', () => {
    expect(xml).not.toContain('/docs/windows');
    expect(xml).not.toContain('/docs/web-services');
  });
});

describe('prerender vs indexable path sets', () => {
  it('prerender includes reachable docs but sitemap only indexable ones', () => {
    expect(prerenderPaths()).toContain('/docs/windows'); // prerendered (reachable) ...
    expect(indexablePaths()).not.toContain('/docs/windows'); // ... but not indexed
    for (const p of ['/', '/rapha', '/docs', '/docs/overview']) {
      expect(prerenderPaths()).toContain(p);
    }
  });
  it('never prerenders private/auth routes', () => {
    for (const p of PRIVATE) {
      expect(prerenderPaths()).not.toContain(p);
    }
  });
});
