import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { CustomerSection } from './CustomerSection';
import { theme } from '../styles/theme';
import { PERPETUAL_NOTICE } from '../shared/plans';

// framer-motion's whileInView needs IntersectionObserver. Stub it LOCALLY so
// this test can render without touching the global test setup (leaving the
// pre-existing jsdom failures untouched).
beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderPricing() {
  return render(
    <ThemeProvider theme={theme}>
      <CustomerSection />
    </ThemeProvider>,
  );
}

describe('CustomerSection pricing UI', () => {
  it('shows the FREE, STARTER, and GROWTH cards with correct prices', () => {
    renderPricing();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('₹0')).toBeInTheDocument();
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('₹18,000')).toBeInTheDocument();
    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText('₹35,000')).toBeInTheDocument();
  });

  it('communicates the FREE limitations (1 sensor, no decoys)', () => {
    renderPricing();
    expect(screen.getByText('Exactly 1 sensor')).toBeInTheDocument();
    expect(screen.getByText('Decoys not included')).toBeInTheDocument();
  });

  it('does NOT render a public perpetual/regulated pricing card', () => {
    renderPricing();
    expect(screen.queryByText('Regulated')).toBeNull();
    expect(screen.queryByText('₹30L+')).toBeNull();
    expect(screen.queryByText(/perpetual \+ 20% AMC/i)).toBeNull();
    expect(screen.queryByText('Request RFP')).toBeNull();
  });

  it('shows the perpetual/custom-license contact notice at the bottom', () => {
    renderPricing();
    expect(screen.getByText(PERPETUAL_NOTICE.heading)).toBeInTheDocument();
    expect(screen.getByText(PERPETUAL_NOTICE.ctaText)).toBeInTheDocument();
  });
});
