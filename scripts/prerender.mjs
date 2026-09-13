/**
 * Post-build prerender (Phase 2B).
 *
 * After `vite build`, generate a static HTML file for each PUBLIC route:
 *   dist/index.html                → /
 *   dist/rapha/index.html          → /rapha
 *   dist/docs/windows/index.html   → /docs/windows   ... etc.
 *
 * Each file is the built SPA shell with (a) the route's SEO metadata injected at
 * the `<!--SEO_HEAD-->` marker (title, description, canonical, robots, Open
 * Graph, Twitter, JSON-LD) and (b) a static content block (h1 + intro + real
 * internal links) injected into #root so crawlers and no-JS clients get
 * meaningful content + links. The SPA (createRoot) replaces #root on load.
 *
 * Vercel serves these static files directly (filesystem is checked before the
 * SPA-fallback rewrite), so each public URL responds with its own metadata.
 * Private/auth routes are NOT prerendered (they stay client-only + noindex).
 *
 * The SEO manifest (src/seo/routeSeo.ts) is the single source of truth; it is
 * transpiled with esbuild and imported here so there is no duplication.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = dirname(fileURLToPath(import.meta.url)) + '/..';
const dist = join(root, 'dist');

// ── Load the self-contained SEO manifest (transpile TS → ESM, import in-memory)
const bundle = await build({
  entryPoints: [join(root, 'src/seo/routeSeo.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
});
const seo = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64')
);

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function seoHead(meta) {
  const canonical = seo.canonicalFor(meta.path);
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" data-seo />`,
    `<meta name="robots" content="${meta.robots}" data-seo />`,
    `<link rel="canonical" href="${canonical}" data-seo />`,
    `<meta property="og:type" content="website" data-seo />`,
    `<meta property="og:site_name" content="${esc(seo.SITE_NAME)}" data-seo />`,
    `<meta property="og:title" content="${esc(meta.title)}" data-seo />`,
    `<meta property="og:description" content="${esc(meta.description)}" data-seo />`,
    `<meta property="og:url" content="${canonical}" data-seo />`,
    `<meta property="og:image" content="${seo.OG_IMAGE}" data-seo />`,
    `<meta name="twitter:card" content="summary_large_image" data-seo />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" data-seo />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" data-seo />`,
    `<meta name="twitter:image" content="${seo.OG_IMAGE}" data-seo />`,
  ];
  if (meta.jsonLd) {
    const blocks = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd];
    for (const b of blocks) {
      tags.push(`<script type="application/ld+json" data-seo>${JSON.stringify(b)}</script>`);
    }
  }
  return tags.join('\n  ');
}

// Static content block (crawlable content + internal links) injected into #root.
const NAV = [
  ['RAPHA', '/rapha'],
  ['Compliance', '/compliance'],
  ['Private Deployment', '/private-deployment'],
  ['Documentation', '/docs'],
  ['Careers', '/careers'],
  ['Contact', '/contact'],
];
function contentBlock(meta) {
  if (!meta.heading) return '';
  const nav = NAV.map(([label, href]) => `<a href="${href}">${esc(label)}</a>`).join(' ');
  return [
    '<div id="prerender-content">',
    `<nav aria-label="Primary"><a href="/">EmmaTech · RAPHA</a> ${nav}</nav>`,
    '<main>',
    `<h1>${esc(meta.heading)}</h1>`,
    `<p>${esc(meta.intro)}</p>`,
    '<p><a href="/request-access">Request Private Access</a> · <a href="/rapha">Explore RAPHA</a></p>',
    '</main>',
    '</div>',
  ].join('');
}

// ── Build shell (strip the fallback <title>; inject per-route at the marker) ──
const indexHtml = readFileSync(join(dist, 'index.html'), 'utf8');
const shell = indexHtml.replace(/\n\s*<title>[^<]*<\/title>/, '');
if (!shell.includes('<!--SEO_HEAD-->')) {
  throw new Error('prerender: <!--SEO_HEAD--> marker not found in dist/index.html');
}

const paths = seo.prerenderPaths();
let count = 0;
for (const path of paths) {
  const meta = seo.metaForPath(path);
  let html = shell.replace('<!--SEO_HEAD-->', seoHead(meta));
  html = html.replace('<div id="root"></div>', `<div id="root">${contentBlock(meta)}</div>`);
  const outFile = path === '/' ? join(dist, 'index.html') : join(dist, path, 'index.html');
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html, 'utf8');
  count++;
}

// ── Sitemap (indexable public routes only) ───────────────────────────────────
writeFileSync(join(dist, 'sitemap.xml'), seo.buildSitemapXml(), 'utf8');

console.log(`[prerender] wrote ${count} static route(s) + sitemap.xml (${seo.indexablePaths().length} indexable URLs).`);
