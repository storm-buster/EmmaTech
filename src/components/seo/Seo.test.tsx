import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { Seo } from './Seo';
import { navigateTo } from '../../routing';
import { metaForPath, SITE_ORIGIN } from '../../seo/routeSeo';

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

const q = (sel: string) => document.head.querySelector(sel);

describe('Seo head manager', () => {
  it('applies the home metadata on mount', () => {
    window.history.replaceState({}, '', '/');
    render(<Seo />);
    const home = metaForPath('/');
    expect(document.title).toBe(home.title);
    expect(q('meta[name="description"]')?.getAttribute('content')).toBe(home.description);
    expect(q('meta[name="robots"]')?.getAttribute('content')).toBe('index,follow');
    expect(q('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_ORIGIN}/`);
    expect(q('meta[property="og:title"]')?.getAttribute('content')).toBe(home.title);
    expect(q('meta[property="og:image"]')?.getAttribute('content')).toContain('/og-image');
    expect(q('meta[name="twitter:card"]')?.getAttribute('content')).toBe('summary_large_image');
    expect(document.head.querySelectorAll('script[type="application/ld+json"][data-seo]').length).toBeGreaterThan(0);
  });

  it('updates metadata on client navigation (no duplicate tags)', async () => {
    window.history.replaceState({}, '', '/');
    render(<Seo />);
    await act(async () => {
      navigateTo('/rapha');
    });
    expect(document.title).toBe(metaForPath('/rapha').title);
    expect(q('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_ORIGIN}/rapha`);
    // Single description / canonical (upsert, not append).
    expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
  });

  it('sets noindex on private/conversion routes', () => {
    window.history.replaceState({}, '', '/request-access');
    render(<Seo />);
    expect(q('meta[name="robots"]')?.getAttribute('content')).toMatch(/noindex/);
  });

  it('never applies the stale pre-Phase-1 title', () => {
    window.history.replaceState({}, '', '/careers');
    render(<Seo />);
    expect(document.title).not.toMatch(/The Future of Autonomous Cyber Defense/);
    expect(document.title).toBe(metaForPath('/careers').title);
  });
});
