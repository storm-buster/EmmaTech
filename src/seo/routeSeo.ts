/**
 * SEO source of truth (Phase 2B).
 *
 * Single, strongly-typed manifest of per-route metadata for the PUBLIC pages.
 * Consumed by BOTH the client `<Seo>` head manager (runtime + SPA navigation)
 * AND the build-time prerender script (`scripts/prerender.mjs`), which injects
 * this metadata into the static HTML for each public route.
 *
 * IMPORTANT: this module is intentionally SELF-CONTAINED (no imports from the
 * app) so the prerender script can transpile + import it standalone.
 *
 * No pricing, no fabricated metrics/claims, no fake social proof.
 */

export const SITE_ORIGIN = 'https://www.emmatech.in';
export const SITE_NAME = 'EmmaTech';
export const OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;
export const DEFAULT_TITLE = 'EmmaTech · RAPHA — Autonomous Cyber Defense';

export type Robots = 'index,follow' | 'noindex,follow' | 'noindex,nofollow';

export interface SeoMeta {
  /** Canonical pathname (leading slash; `/` for home). */
  path: string;
  title: string;
  description: string;
  robots: Robots;
  /** Static <h1> + intro paragraph injected into the prerendered shell. */
  heading: string;
  intro: string;
  /** Optional JSON-LD object(s) for this page. */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const organizationLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'EmmaTech',
  url: `${SITE_ORIGIN}/`,
  logo: OG_IMAGE,
  description:
    'EmmaTech builds RAPHA — autonomous cyber defense deployed through a private, selective-access model.',
  email: 'avinash@emmatech.in',
};

const websiteLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: `${SITE_ORIGIN}/`,
};

/** Breadcrumb JSON-LD from an ordered list of [name, path] pairs. */
export function breadcrumbLd(items: Array<[string, string]>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${SITE_ORIGIN}${path}`,
    })),
  };
}

// ── Static (non-docs) public routes ─────────────────────────────────────────
const STATIC_ROUTES: SeoMeta[] = [
  {
    path: '/',
    title: DEFAULT_TITLE,
    description:
      'RAPHA by EmmaTech is autonomous cyber defense: it detects hostile behavior and autonomously redirects threats into controlled deception environments. Available through a private deployment model.',
    robots: 'index,follow',
    heading: 'Autonomous Cyber Defense. Privately Deployed.',
    intro:
      'RAPHA detects hostile behavior and autonomously redirects threats into controlled deception environments — without requiring a human in the loop for every response. Access is selective: organizations are evaluated individually for deployment fit.',
    jsonLd: [organizationLd, websiteLd],
  },
  {
    path: '/rapha',
    title: 'RAPHA — Cyber Deception Platform | EmmaTech',
    description:
      'RAPHA is a cyber deception platform: it uses behavioural detection to identify hostile activity and autonomously redirects attackers into controlled deception environments, preserving a tamper-evident forensic trail. Deployed privately by EmmaTech.',
    robots: 'index,follow',
    heading: 'RAPHA — a cyber deception platform.',
    intro:
      'RAPHA combines behavioural detection with autonomous response: it redirects attackers into controlled deception environments and preserves a tamper-evident forensic record. Deployment is private and individually scoped.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'RAPHA',
        applicationCategory: 'SecurityApplication',
        operatingSystem: 'Windows',
        provider: { '@type': 'Organization', name: 'EmmaTech', url: `${SITE_ORIGIN}/` },
        description:
          'Cyber deception platform: behavioural detection, autonomous attacker redirection into controlled deception environments, and a tamper-evident forensic trail. Deployed privately.',
      },
      breadcrumbLd([
        ['Home', '/'],
        ['RAPHA', '/rapha'],
      ]),
    ],
  },
  {
    path: '/compliance',
    title: 'Cybersecurity Compliance for Regulated Organizations | EmmaTech',
    description:
      'How RAPHA supports regulated organizations — real-time monitoring, incident response, and tamper-evident forensic trails aligned to Indian regulatory expectations (RBI, DPDP, SEBI).',
    robots: 'index,follow',
    heading: 'Compliance-aligned autonomous defense.',
    intro:
      'RAPHA maps to the monitoring, incident-response, and audit-trail expectations of regulated organizations, including RBI, DPDP, and SEBI frameworks.',
    jsonLd: breadcrumbLd([
      ['Home', '/'],
      ['Compliance', '/compliance'],
    ]),
  },
  {
    path: '/private-deployment',
    title: 'Private Cybersecurity Deployment | RAPHA by EmmaTech',
    description:
      'RAPHA is not offered as a public self-service subscription. Deployments are individually scoped and reviewed for fit; commercial terms are discussed during a private evaluation.',
    robots: 'index,follow',
    heading: 'Private Deployment',
    intro:
      'RAPHA is deployed privately. Organizations are reviewed individually based on size, infrastructure, security requirements, and operational needs. Commercial terms are provided during the private evaluation.',
    jsonLd: breadcrumbLd([
      ['Home', '/'],
      ['Private Deployment', '/private-deployment'],
    ]),
  },
  {
    path: '/contact',
    title: 'Contact EmmaTech',
    description:
      'Contact EmmaTech for general company, partnership, and press inquiries. For RAPHA deployment interest, request private access.',
    robots: 'index,follow',
    heading: 'Contact EmmaTech',
    intro:
      'For general, partnership, or press inquiries, get in touch. If you are evaluating RAPHA for your organization, request private access instead.',
    jsonLd: breadcrumbLd([
      ['Home', '/'],
      ['Contact', '/contact'],
    ]),
  },
  {
    path: '/careers',
    title: 'Careers at EmmaTech',
    description:
      'Join the founding team at EmmaTech building RAPHA — autonomous cyber defense. Explore open roles.',
    robots: 'index,follow',
    heading: 'Careers at EmmaTech',
    intro: 'Help build autonomous cyber defense. Explore open roles on the founding team.',
    jsonLd: breadcrumbLd([
      ['Home', '/'],
      ['Careers', '/careers'],
    ]),
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | EmmaTech',
    description: 'How EmmaTech handles information across the website, account sign-up, the RAPHA console, and the Request Private Access application.',
    robots: 'index,follow',
    heading: 'Privacy Policy',
    intro: 'How EmmaTech collects, uses, and protects information across its website and the RAPHA platform.',
    jsonLd: breadcrumbLd([
      ['Home', '/'],
      ['Privacy Policy', '/privacy'],
    ]),
  },
  {
    path: '/terms',
    title: 'Terms of Service | EmmaTech',
    description: 'The terms governing use of the EmmaTech website and the RAPHA service.',
    robots: 'index,follow',
    heading: 'Terms of Service',
    intro: 'The terms that govern your use of the EmmaTech website and the RAPHA service.',
    jsonLd: breadcrumbLd([
      ['Home', '/'],
      ['Terms of Service', '/terms'],
    ]),
  },
  {
    path: '/docs',
    title: 'RAPHA Documentation | EmmaTech',
    description:
      'RAPHA customer documentation: overview, architecture, requirements, quick start, sensor registration, and console access.',
    robots: 'index,follow',
    heading: 'RAPHA Documentation',
    intro: 'Get started with RAPHA — overview, architecture, requirements, and how to register a sensor.',
    jsonLd: breadcrumbLd([
      ['Home', '/'],
      ['Documentation', '/docs'],
    ]),
  },
  {
    path: '/resources/how-to-evaluate-a-cyber-deception-platform',
    title: 'How to Evaluate a Cyber Deception Platform | EmmaTech',
    description:
      'A practical, vendor-neutral guide for security leaders evaluating a cyber deception platform: the questions to ask, decoy realism, deployment and integration considerations, what happens after detection, forensic evidence, and how to structure a pilot.',
    robots: 'index,follow',
    heading: 'How to Evaluate a Cyber Deception Platform',
    intro:
      'A practical, vendor-neutral evaluation guide for security leaders, architects, and SOC teams: what a cyber deception platform is, the questions that separate operational value from decoy counts, how to structure a pilot, and how RAPHA approaches these requirements.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'How to Evaluate a Cyber Deception Platform',
        description:
          'A practical, vendor-neutral guide for security leaders evaluating a cyber deception platform: questions to ask, decoy realism, deployment and integration considerations, what happens after detection, forensic evidence, and how to structure a pilot.',
        author: { '@type': 'Organization', name: 'EmmaTech', url: `${SITE_ORIGIN}/` },
        publisher: {
          '@type': 'Organization',
          name: 'EmmaTech',
          logo: { '@type': 'ImageObject', url: OG_IMAGE },
        },
        datePublished: '2026-09-17',
        dateModified: '2026-09-17',
        image: OG_IMAGE,
        mainEntityOfPage: `${SITE_ORIGIN}/resources/how-to-evaluate-a-cyber-deception-platform`,
      },
      breadcrumbLd([
        ['Home', '/'],
        ['How to Evaluate a Cyber Deception Platform', '/resources/how-to-evaluate-a-cyber-deception-platform'],
      ]),
    ],
  },
];

// ── Public documentation pages (indexation classified for Phase 2B) ──────────
// Sensitive docs (installer command, API-key management) are kept reachable but
// NOT indexed / NOT in the sitemap, per §17 (no exposing install/API-key detail
// for SEO). Full controlled-disclosure gating is Phase 2D.
interface DocSeo {
  id: string;
  title: string;
  description: string;
  indexable: boolean;
}
export const PUBLIC_DOCS: DocSeo[] = [
  { id: 'overview', title: 'Overview', description: 'What RAPHA is and how its components fit together for your organization.', indexable: true },
  { id: 'architecture', title: 'Architecture', description: 'A conceptual view of the RAPHA components a customer interacts with, and how tenants are isolated.', indexable: true },
  { id: 'requirements', title: 'Requirements', description: 'What you need before installing a RAPHA sensor.', indexable: true },
  { id: 'quick-start', title: 'Quick Start', description: 'Go from a new account to a registered RAPHA sensor.', indexable: true },
  { id: 'register-sensor', title: 'Register a Sensor', description: 'How a sensor joins your RAPHA tenant using an enrollment token.', indexable: true },
  { id: 'web-console', title: 'Connect to Web Console', description: 'Reviewing your registered sensors in the RAPHA Web Console.', indexable: true },
  { id: 'linux', title: 'Linux', description: 'Support status for the Linux RAPHA agent.', indexable: true },
  // Sensitive → reachable but noindex + excluded from sitemap (Phase 2D gating later).
  { id: 'windows', title: 'Windows Installation', description: 'Installing the RAPHA agent on Windows.', indexable: false },
  { id: 'web-services', title: 'Web Services', description: 'Integrating RAPHA with external systems via its API.', indexable: false },
];

/** Canonical set of valid documentation ids (single source for route matching). */
export const VALID_DOC_IDS: readonly string[] = PUBLIC_DOCS.map((d) => d.id);

/** Public resource (article) slugs under `/resources/<slug>`. Single source for
 *  route matching, mirroring the docs model. */
export const RESOURCE_SLUGS: readonly string[] = ['how-to-evaluate-a-cyber-deception-platform'];

/** Canonical pathname of a resource article. */
export function resourcePath(slug: string): string {
  return `/resources/${slug}`;
}

/** True when `slug` is a real published resource (case-insensitive). Used by the
 *  router so unknown `/resources/<slug>` paths reach NotFound. */
export function isValidResourceSlug(slug: string): boolean {
  const lower = slug.toLowerCase();
  return RESOURCE_SLUGS.some((s) => s === lower);
}

/** True when `id` is a real documentation page (case-insensitive). Used by the
 *  router to send unknown `/docs/<id>` paths to NotFound instead of the default. */
export function isValidDocId(id: string): boolean {
  const lower = id.toLowerCase();
  return PUBLIC_DOCS.some((d) => d.id === lower);
}

function docMeta(doc: DocSeo): SeoMeta {
  const path = `/docs/${doc.id}`;
  return {
    path,
    title: `${doc.title} — RAPHA Documentation | EmmaTech`,
    description: doc.description,
    robots: doc.indexable ? 'index,follow' : 'noindex,follow',
    heading: doc.title,
    intro: doc.description,
    jsonLd: breadcrumbLd([
      ['Home', '/'],
      ['Documentation', '/docs'],
      [doc.title, path],
    ]),
  };
}

/** Default metadata for private/unknown routes (never indexed). */
export function privateMeta(path: string, title = 'EmmaTech'): SeoMeta {
  return {
    path,
    title,
    description: 'EmmaTech — autonomous cyber defense, privately deployed.',
    robots: 'noindex,nofollow',
    heading: '',
    intro: '',
  };
}

/** Metadata for the static 404 page (dist/404.html). Noindex, but carries a
 *  heading + intro so the prerendered fallback is a styled, useful dark page
 *  (with links) rather than a blank shell. Excluded from the sitemap. */
export function notFoundMeta(): SeoMeta {
  return {
    path: '/404',
    title: 'Page not found | EmmaTech',
    description: 'The page you are looking for does not exist or may have moved.',
    robots: 'noindex,nofollow',
    heading: 'Page not found',
    intro:
      'The page you are looking for doesn’t exist or may have moved. Explore RAPHA, review the documentation, or request private access.',
  };
}

/** Resolve the SEO metadata for any pathname (handles `/docs/<id>`).
 *  The path is lowercased before lookup so mixed-case URLs (e.g. `/RAPHA`)
 *  resolve to the same canonical route metadata as `/rapha`. Canonical URLs are
 *  taken from the manifest (always lowercase), so no case-variant canonicals are
 *  produced. Mirrors the router's case-insensitive `parsePath`. */
export function metaForPath(pathname: string): SeoMeta {
  const clean = (pathname.replace(/\/+$/, '') || '/').toLowerCase();
  const stat = STATIC_ROUTES.find((r) => r.path === clean);
  if (stat) return stat;
  const docMatch = clean.match(/^\/docs\/([^/?#]+)$/i);
  if (docMatch) {
    const doc = PUBLIC_DOCS.find((d) => d.id === docMatch[1].toLowerCase());
    if (doc) return docMeta(doc);
  }
  // Private/conversion/unknown routes.
  const privateTitles: Record<string, string> = {
    '/request-access': 'Request Private Access | EmmaTech',
    '/login': 'Sign in | EmmaTech',
    '/signup': 'EmmaTech',
    '/account': 'Account | EmmaTech',
    '/deploy': 'Deploy | EmmaTech',
    '/console': 'RAPHA Console | EmmaTech',
  };
  if (privateTitles[clean]) return privateMeta(clean, privateTitles[clean]);
  return privateMeta(clean, 'Page not found | EmmaTech');
}

export function canonicalFor(path: string): string {
  return path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}

/** True when `pathname` (any case) is a VALID public canonical route: a public
 *  single-segment route (`/rapha`, `/compliance`, …, `/docs`) or `/docs/<valid-id>`.
 *  Excludes private/app routes and invalid child/doc paths — so it never widens
 *  matching. Used by edge case-canonicalization. */
export function isCanonicalPublicPath(pathname: string): boolean {
  const clean = (pathname.replace(/\/+$/, '') || '/').toLowerCase();
  if (STATIC_ROUTES.some((r) => r.path === clean)) return true;
  const m = clean.match(/^\/docs\/([^/?#]+)$/);
  return !!(m && isValidDocId(m[1]));
}

/** Case-canonicalization for the edge middleware: given a request pathname,
 *  return the lowercase canonical pathname to 308-redirect to, or null when no
 *  redirect should occur. Only mixed/upper-case variants of VALID public routes
 *  redirect; lowercase paths, invalid paths, private/app routes, API and static
 *  assets return null (left untouched → normal routing / strict 404). */
export function caseRedirectTarget(pathname: string): string | null {
  if (!/[A-Z]/.test(pathname)) return null; // already lowercase — nothing to normalize
  const normalized = (pathname.toLowerCase().replace(/\/+$/, '') || '/');
  return isCanonicalPublicPath(normalized) ? normalized : null;
}

/** All indexable public paths, in sitemap order (excludes noindex docs). */
export function indexablePaths(): string[] {
  const staticPaths = STATIC_ROUTES.map((r) => r.path);
  const docPaths = PUBLIC_DOCS.filter((d) => d.indexable).map((d) => `/docs/${d.id}`);
  return [...staticPaths, ...docPaths];
}

/** All public paths to prerender (indexable + reachable docs; excludes private). */
export function prerenderPaths(): string[] {
  const staticPaths = STATIC_ROUTES.map((r) => r.path);
  const docPaths = PUBLIC_DOCS.map((d) => `/docs/${d.id}`);
  return [...staticPaths, '/docs', ...docPaths].filter((p, i, a) => a.indexOf(p) === i);
}

/** Generate sitemap.xml from the indexable public routes. */
export function buildSitemapXml(): string {
  const urls = indexablePaths()
    .map((p) => `  <url>\n    <loc>${canonicalFor(p)}</loc>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
