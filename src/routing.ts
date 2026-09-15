/**
 * Pathname routing (Phase 2A) — History API, no router dependency.
 *
 * Public marketing routes are real pathnames (`/rapha`, `/compliance`, …) so
 * they are crawlable, linkable, and keyboard-navigable. Authenticated/app
 * routes stay client-rendered and are excluded from indexing/sitemap.
 *
 * Legacy hash URLs (`#/product`, `#/pricing`, `#/docs/<id>`, …) are preserved
 * via a client-side bootstrap shim (`applyLegacyHashRedirect`) because hash
 * fragments never reach the server and cannot be handled by Vercel rewrites.
 */
import type { Route } from './App';
import { isValidDocId } from './seo/routeSeo';

/** Canonical pathname for each addressable route (`home` = `/`). */
const ROUTE_TO_PATH: Record<Exclude<Route, 'notfound'>, string> = {
  home: '/',
  product: '/rapha',
  compliance: '/compliance',
  'private-deployment': '/private-deployment',
  'request-access': '/request-access',
  careers: '/careers',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  login: '/login',
  signup: '/signup',
  account: '/account',
  deploy: '/deploy',
  docs: '/docs',
  console: '/console',
};

/** Route → canonical pathname (used for real `href`s and navigation). */
export function routePath(route: Route): string {
  return route === 'notfound' ? '/404' : ROUTE_TO_PATH[route];
}

/**
 * Map a pathname to a Route with STRICT matching (Phase 2C):
 *  - single-segment public/app routes match exactly (`/rapha` → product);
 *  - an unexpected child path (`/rapha/anything`) resolves to `notfound`
 *    rather than silently rendering the parent page;
 *  - docs are `/docs` (index) or `/docs/<valid-id>`; unknown doc ids and any
 *    deeper docs path resolve to `notfound`.
 * Matching is case-insensitive; canonical URLs remain lowercase.
 */
export function parsePath(pathname: string): Route {
  // Strip query/hash + trailing slash, then split into non-empty segments.
  const clean = (pathname.split(/[?#]/)[0] || '').replace(/\/+$/, '');
  const segments = clean
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((s) => s.toLowerCase());

  if (segments.length === 0) return 'home';

  // Documentation: index or a single valid page id; anything else → notfound.
  if (segments[0] === 'docs') {
    if (segments.length === 1) return 'docs';
    if (segments.length === 2 && isValidDocId(segments[1])) return 'docs';
    return 'notfound';
  }

  // All other routes are single-segment only — reject stray child paths.
  if (segments.length > 1) return 'notfound';

  switch (segments[0]) {
    case 'rapha':
      return 'product';
    case 'compliance':
      return 'compliance';
    // Defensive: a stray `/pricing` path resolves to the private-deployment page
    // (there is no public pricing page).
    case 'pricing':
    case 'private-deployment':
      return 'private-deployment';
    case 'request-access':
      return 'request-access';
    case 'careers':
      return 'careers';
    case 'contact':
      return 'contact';
    case 'privacy':
      return 'privacy';
    case 'terms':
      return 'terms';
    case 'login':
      return 'login';
    case 'signup':
      return 'signup';
    case 'account':
      return 'account';
    case 'deploy':
      return 'deploy';
    case 'console':
      return 'console';
    default:
      return 'notfound';
  }
}

/**
 * Map a legacy hash URL (`#/…`) to the equivalent pathname, preserving the
 * `#/pricing → /private-deployment` alias and docs sub-ids (`#/docs/<id>`).
 * Returns null when the hash is not a recognized legacy route.
 */
export function legacyHashToPath(hash: string): string | null {
  if (!hash || !hash.startsWith('#/')) return null;
  const raw = hash.replace(/^#\/?/, '').split(/[?#]/)[0];
  const parts = raw.split('/');
  const seg = (parts[0] || '').toLowerCase();
  const sub = parts.slice(1).join('/');
  switch (seg) {
    case '':
      return '/';
    case 'product':
      return '/rapha';
    case 'pricing':
      return '/private-deployment';
    case 'compliance':
    case 'private-deployment':
    case 'request-access':
    case 'careers':
    case 'contact':
    case 'privacy':
    case 'terms':
    case 'login':
    case 'signup':
    case 'account':
    case 'deploy':
    case 'console':
      return `/${seg}`;
    case 'docs':
      return sub ? `/docs/${sub}` : '/docs';
    default:
      return null;
  }
}

/** Docs sub-id from `/docs/<id>` (null for the docs index `/docs`).
 *  Lowercased so mixed-case URLs (e.g. `/docs/ARCHITECTURE`) resolve to the
 *  correct page — matching `parsePath`'s case-insensitive validation and the
 *  lowercase-kebab doc ids. */
export function docIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/docs\/?([^/?#]*)/i);
  const id = m ? m[1] : '';
  return id ? id.toLowerCase() : null;
}

// ── Navigation + location subscription (History API) ─────────────────────────
// pushState/replaceState do NOT emit popstate, so we dispatch a custom event to
// notify in-app subscribers (App router + DocsPage) of programmatic navigation.
const LOCATION_EVENT = 'app:locationchange';

export function navigateTo(path: string, opts: { replace?: boolean } = {}): void {
  const current = window.location.pathname;
  if (path === current && !opts.replace) return; // no-op / loop guard
  if (opts.replace) window.history.replaceState({}, '', path);
  else window.history.pushState({}, '', path);
  window.dispatchEvent(new Event(LOCATION_EVENT));
}

/** Subscribe to both browser (popstate) and programmatic (custom event) changes. */
export function subscribeLocation(cb: () => void): () => void {
  window.addEventListener('popstate', cb);
  window.addEventListener(LOCATION_EVENT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(LOCATION_EVENT, cb);
  };
}

/**
 * One-time bootstrap shim: if the app was opened on a legacy `#/…` URL, rewrite
 * the address bar to the equivalent pathname (replaceState — no history entry,
 * no navigation, no loop) before React renders.
 *
 * Only runs at the root pathname (`/`) — legacy hash URLs always lived at `/`
 * (e.g. `emmatech.in/#/product`). This guard ensures the shim never disturbs an
 * in-app hash on a real pathname route (e.g. the authenticated console's
 * `#…` section state on `/console`).
 */
export function applyLegacyHashRedirect(): void {
  if (window.location.pathname !== '/') return;
  const target = legacyHashToPath(window.location.hash);
  if (target && target !== '/') {
    window.history.replaceState({}, '', target);
  }
}
