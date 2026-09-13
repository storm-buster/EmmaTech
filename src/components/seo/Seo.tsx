import { useEffect } from 'react';
import { subscribeLocation } from '../../routing';
import {
  metaForPath,
  canonicalFor,
  OG_IMAGE,
  SITE_NAME,
  type SeoMeta,
} from '../../seo/routeSeo';

/**
 * Unified head manager (Phase 2B). Single owner of document-level SEO metadata
 * for the whole app — replaces the ad-hoc `document.title` logic that used to
 * live in individual page components.
 *
 * On mount and on every location change it applies the route's metadata from
 * the SEO manifest (`src/seo/routeSeo.ts`): title, description, canonical,
 * robots, Open Graph, Twitter, and JSON-LD. On prerendered pages the same tags
 * already exist in the static HTML; this reconciles them in place (updates, no
 * duplicates) so client navigation and hydration stay correct.
 *
 * Tags it manages are marked `data-seo` so JSON-LD can be cleanly replaced.
 */

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute('data-seo', '');
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    el.setAttribute('data-seo', '');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function applyJsonLd(meta: SeoMeta): void {
  // Remove any JSON-LD this manager previously injected, then re-add.
  document.head.querySelectorAll('script[type="application/ld+json"][data-seo]').forEach((n) => n.remove());
  if (!meta.jsonLd) return;
  const blocks = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd];
  for (const block of blocks) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute('data-seo', '');
    s.textContent = JSON.stringify(block);
    document.head.appendChild(s);
  }
}

function applyHead(meta: SeoMeta): void {
  document.title = meta.title;
  upsertMeta('name', 'description', meta.description);
  upsertMeta('name', 'robots', meta.robots);
  const canonical = canonicalFor(meta.path);
  upsertCanonical(canonical);
  // Open Graph
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:image', OG_IMAGE);
  // Twitter / X
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);
  upsertMeta('name', 'twitter:image', OG_IMAGE);
  applyJsonLd(meta);
}

export function Seo() {
  useEffect(() => {
    const update = () => applyHead(metaForPath(window.location.pathname));
    update();
    return subscribeLocation(update);
  }, []);
  return null;
}
