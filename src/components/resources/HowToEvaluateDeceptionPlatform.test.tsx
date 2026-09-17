import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { HowToEvaluateDeceptionPlatform } from './HowToEvaluateDeceptionPlatform';
import { theme } from '../../styles/theme';

function renderArticle(onNavigate = vi.fn()) {
  render(
    <ThemeProvider theme={theme}>
      <HowToEvaluateDeceptionPlatform onNavigate={onNavigate} />
    </ThemeProvider>,
  );
  return onNavigate;
}

describe('HowToEvaluateDeceptionPlatform — rendering & structure', () => {
  it('renders the H1', () => {
    renderArticle();
    expect(
      screen.getByRole('heading', { level: 1, name: 'How to Evaluate a Cyber Deception Platform' }),
    ).toBeInTheDocument();
  });

  it('is substantial (multiple sections + the conceptual workflow)', () => {
    renderArticle();
    const h2 = screen.getAllByRole('heading', { level: 2 });
    expect(h2.length).toBeGreaterThanOrEqual(8);
    expect(document.body.textContent ?? '').toContain('Detect → Decide → Redirect → Observe → Preserve');
    expect(document.body.textContent ?? '').toMatch(/cyber deception platform/i);
  });

  it('navigates to RAPHA, private deployment, and request access via internal links/CTA', async () => {
    const onNavigate = renderArticle();
    const user = userEvent.setup();
    await user.click(screen.getByText('Request Private Access'));
    await user.click(screen.getByText('Explore RAPHA'));
    expect(onNavigate).toHaveBeenCalledWith('request-access');
    expect(onNavigate).toHaveBeenCalledWith('product');
    // Contextual private-deployment link present.
    expect(document.querySelector('a[href="/private-deployment"]')).not.toBeNull();
    expect(document.querySelector('a[href="/rapha"]')).not.toBeNull();
  });
});

describe('HowToEvaluateDeceptionPlatform — controlled-disclosure guard', () => {
  it('exposes no private RAPHA implementation details or unsupported claims', () => {
    renderArticle();
    const text = document.body.textContent ?? '';
    for (const forbidden of [
      /Isolation Forest/i,
      /iptables/i,
      /Cowrie/i,
      /\b50\+/,
      /<\s*2s/,
      /43%/,
      /zero-day/i,
      /threshold/i,
      /public\.blob\.vercel-storage/i,
      /rapha\.emmatech\.in/i,
      /install-rapha/i,
      /BLOB_READ_WRITE/i,
      /control-plane URL/i,
    ]) {
      expect(text).not.toMatch(forbidden);
    }
  });

  it('describes RAPHA only in the approved public, modest terms', () => {
    renderArticle();
    const text = document.body.textContent ?? '';
    expect(text).toMatch(/privately deployable cyber deception platform/i);
    expect(text).not.toMatch(/\bbest\b/i);
    expect(text).not.toMatch(/market leader|industry-leading|number one/i);
  });
});
