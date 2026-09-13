import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Regression: the prerendered shell (index.html — the template every prerendered
 * route derives from) must carry the critical CSS so the first paint is a
 * coherent dark EmmaTech page, not raw/white HTML. Styling is injected at
 * runtime by styled-components, so without this the static HTML flashes unstyled.
 * Also asserts the SEO injection marker remains intact (no SEO regression) and
 * that no content-hiding anti-pattern was introduced.
 */
const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');

describe('prerender shell — critical CSS (no unstyled flash)', () => {
  it('includes a critical-css <style> block', () => {
    expect(html).toMatch(/<style id="critical-css">/);
  });

  it('sets the dark theme base (background + text + font) matching GlobalStyles', () => {
    const style = html.slice(html.indexOf('<style id="critical-css">'), html.indexOf('</style>'));
    expect(style).toMatch(/background:\s*#0F1115/i); // theme background.primary
    expect(style).toMatch(/color:\s*#CBD5E1/i); // theme neutral.lightGray
    expect(style).toMatch(/font-family:\s*'Inter'/i);
    expect(style).toMatch(/#prerender-content/); // the static shell is styled
    expect(style).toMatch(/text-transform:\s*uppercase/i); // h1 matches GlobalStyles (no case reflow)
  });

  it('does NOT hide content while React loads (no visibility:hidden / opacity:0 gate)', () => {
    const style = html.slice(html.indexOf('<style id="critical-css">'), html.indexOf('</style>'));
    expect(style).not.toMatch(/visibility:\s*hidden/i);
    expect(style).not.toMatch(/opacity:\s*0\b/i);
  });

  it('keeps the SEO injection marker + theme-color intact (no SEO regression)', () => {
    expect(html).toContain('<!--SEO_HEAD-->');
    expect(html).toMatch(/theme-color" content="#0F1115"/);
  });
});
