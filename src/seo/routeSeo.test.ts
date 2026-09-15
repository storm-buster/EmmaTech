import { describe, it, expect } from 'vitest';
import {
  metaForPath,
  canonicalFor,
  indexablePaths,
  prerenderPaths,
  buildSitemapXml,
  SITE_ORIGIN,
  OG_IMAGE,
  notFoundMeta,
  isValidDocId,
  VALID_DOC_IDS,
  isCanonicalPublicPath,
  caseRedirectTarget,
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

describe('OG image (Phase 2C — raster PNG)', () => {
  it('OG image is the 1200×630 PNG on the canonical host', () => {
    expect(OG_IMAGE).toBe(`${SITE_ORIGIN}/og-image.png`);
    expect(OG_IMAGE).not.toMatch(/\.svg$/);
  });
});

describe('notFoundMeta (static 404 page)', () => {
  const m = notFoundMeta();
  it('is noindex,nofollow with a useful heading + intro (not blank)', () => {
    expect(m.robots).toBe('noindex,nofollow');
    expect(m.title).toMatch(/not found/i);
    expect(m.heading.length).toBeGreaterThan(3);
    expect(m.intro.length).toBeGreaterThan(20);
  });
  it('is never included in the sitemap', () => {
    expect(indexablePaths()).not.toContain('/404');
    expect(buildSitemapXml()).not.toContain('/404');
  });
});

describe('isValidDocId (strict docs matching)', () => {
  it('accepts every real doc id (case-insensitive)', () => {
    for (const id of VALID_DOC_IDS) {
      expect(isValidDocId(id)).toBe(true);
      expect(isValidDocId(id.toUpperCase())).toBe(true);
    }
    expect(VALID_DOC_IDS).toContain('overview');
    expect(VALID_DOC_IDS).toContain('web-services');
  });
  it('rejects unknown doc ids', () => {
    for (const id of ['nonexistent', 'garbage', 'admin', '', 'overview-x']) {
      expect(isValidDocId(id)).toBe(false);
    }
  });
});

describe('case canonicalization (Phase 2C correction — edge 308 redirect logic)', () => {
  it('mixed/upper-case variants of valid public routes redirect to lowercase canonical', () => {
    const cases: Array<[string, string]> = [
      ['/RAPHA', '/rapha'],
      ['/Rapha', '/rapha'],
      ['/rApHa', '/rapha'],
      ['/RAPHA/', '/rapha'], // trailing slash normalized too
      ['/Compliance', '/compliance'],
      ['/Private-Deployment', '/private-deployment'],
      ['/Contact', '/contact'],
      ['/Careers', '/careers'],
      ['/Privacy', '/privacy'],
      ['/Terms', '/terms'],
      ['/Docs', '/docs'],
      ['/Docs/Overview', '/docs/overview'],
      ['/DOCS/WEB-SERVICES', '/docs/web-services'],
    ];
    for (const [input, expected] of cases) {
      expect(caseRedirectTarget(input)).toBe(expected);
    }
  });

  it('lowercase (canonical) paths are never redirected', () => {
    for (const p of ['/', '/rapha', '/compliance', '/private-deployment', '/docs', '/docs/overview', '/contact']) {
      expect(caseRedirectTarget(p)).toBeNull();
    }
  });

  it('does NOT normalize invalid paths into valid content (no widened matching)', () => {
    for (const p of ['/RAPHA/GARBAGE', '/Rapha/Test', '/Compliance/x', '/Docs/Nonexistent', '/Docs/Overview/Extra', '/Bogus']) {
      expect(caseRedirectTarget(p)).toBeNull();
    }
  });

  it('does NOT redirect case variants of private/app routes (no auth bypass)', () => {
    for (const p of ['/LOGIN', '/Signup', '/Account', '/Deploy', '/Console', '/Request-Access']) {
      expect(caseRedirectTarget(p)).toBeNull();
      expect(isCanonicalPublicPath(p.toLowerCase())).toBe(false);
    }
  });

  it('isCanonicalPublicPath recognizes exactly the public canonical routes', () => {
    for (const p of ['/', '/rapha', '/compliance', '/private-deployment', '/contact', '/careers', '/privacy', '/terms', '/docs', '/docs/overview', '/docs/web-services']) {
      expect(isCanonicalPublicPath(p)).toBe(true);
    }
    for (const p of ['/rapha/garbage', '/docs/nope', '/login', '/api/x', '/nonexistent']) {
      expect(isCanonicalPublicPath(p)).toBe(false);
    }
  });
});
