/**
 * Vercel Edge Middleware (Phase 2C correction) — canonical case normalization.
 *
 * Case variants of valid PUBLIC routes are permanently redirected (308) to the
 * lowercase canonical pathname, e.g. `/RAPHA` → `/rapha`, `/Docs/Overview` →
 * `/docs/overview`. This resolves the previous behavior where a mixed-case URL
 * hit the static 404 while the SPA rendered valid content (status/content
 * disagreement).
 *
 * Design (see `caseRedirectTarget` / `isCanonicalPublicPath` in src/seo/routeSeo.ts):
 *  - Only paths that CONTAIN an uppercase letter are ever acted on. Real
 *    (lowercase) URLs contain none, so they early-return untouched — zero impact
 *    on normal traffic.
 *  - A redirect is issued ONLY when the lowercased path is a valid public
 *    canonical route. Invalid paths (`/RAPHA/GARBAGE`), private/app routes
 *    (`/LOGIN`), API and static assets are left untouched → normal routing keeps
 *    strict 404s, auth, and asset serving intact (matcher also excludes
 *    `api/` and any path with a file extension).
 *  - Any unexpected error falls through (returns undefined) so middleware can
 *    never break request handling.
 *
 * Edge Middleware is a separate edge function and does NOT count against the
 * Hobby serverless-function limit.
 */
import { caseRedirectTarget } from './src/seo/routeSeo';

export const config = {
  // Run on everything EXCEPT API routes and files with an extension (static
  // assets like robots.txt, sitemap.xml, og-image.png, install-rapha.ps1,
  // rapha-agent-manifest.json, /assets/*.js|css).
  matcher: ['/((?!api/|.*\\.).*)'],
};

export default function middleware(request: Request): Response | undefined {
  try {
    const url = new URL(request.url);
    const target = caseRedirectTarget(url.pathname);
    if (target && target !== url.pathname) {
      url.pathname = target; // preserves query string (url.search) and origin
      return Response.redirect(url.toString(), 308);
    }
  } catch {
    // Never let middleware break request handling — fall through to normal routing.
  }
  return undefined;
}
