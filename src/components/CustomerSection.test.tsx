import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { CustomerSection } from './CustomerSection';
import { theme } from '../styles/theme';
import { PERPETUAL_NOTICE } from '../shared/plans';
import type { PlanCtaAction } from '../shared/plans';

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

function renderPricing(onCtaAction?: (a: PlanCtaAction) => void) {
  return render(
    <ThemeProvider theme={theme}>
      <CustomerSection onCtaAction={onCtaAction} />
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

  it('communicates FREE = 1 sensor and decoys NOT included', () => {
    renderPricing();
    expect(screen.getByText('1 sensor')).toBeInTheDocument();
    // The decoys line is present and marked as an exclusion (sr-only text).
    expect(screen.getByText('Decoys')).toBeInTheDocument();
    expect(screen.getByText(/not included/i)).toBeInTheDocument();
  });

  it('shows STARTER = 20 sensors + Cowrie decoys included', () => {
    renderPricing();
    expect(screen.getByText('Up to 20 sensors')).toBeInTheDocument();
    expect(screen.getByText('Lightweight Cowrie decoys')).toBeInTheDocument();
  });

  it('shows GROWTH = unlimited sensors', () => {
    renderPricing();
    expect(screen.getByText('Unlimited sensors')).toBeInTheDocument();
  });

  it('does NOT render a public perpetual/regulated pricing card', () => {
    renderPricing();
    expect(screen.queryByText('Regulated')).toBeNull();
    expect(screen.queryByText('Perpetual')).toBeNull();
    expect(screen.queryByText('Contact EmmaTech')).not.toBeNull(); // only the notice CTA
    expect(screen.queryByText('₹30L+')).toBeNull();
    expect(screen.queryByText('Request RFP')).toBeNull();
  });

  it('shows the perpetual/custom-license contact notice at the bottom', () => {
    renderPricing();
    expect(screen.getByText(PERPETUAL_NOTICE.heading)).toBeInTheDocument();
    expect(screen.getByText(PERPETUAL_NOTICE.ctaText)).toBeInTheDocument();
  });

  it('exposes CTAs as accessible buttons with meaningful labels', () => {
    renderPricing();
    expect(screen.getByRole('button', { name: /Start free — Free plan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start a pilot — Starter plan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Talk to founder — Growth plan/i })).toBeInTheDocument();
  });
});

describe('CustomerSection CTA routing (no purchase performed)', () => {
  it('START FREE routes into the authenticated (signup) flow', async () => {
    const onCtaAction = vi.fn();
    renderPricing(onCtaAction);
    await userEvent.click(screen.getByRole('button', { name: /Start free — Free plan/i }));
    expect(onCtaAction).toHaveBeenCalledWith('signup');
  });

  it('START A PILOT (STARTER) routes into the authenticated (signup) flow', async () => {
    const onCtaAction = vi.fn();
    renderPricing(onCtaAction);
    await userEvent.click(screen.getByRole('button', { name: /Start a pilot — Starter plan/i }));
    expect(onCtaAction).toHaveBeenCalledWith('signup');
  });

  it('TALK TO FOUNDER (GROWTH) routes to contact', async () => {
    const onCtaAction = vi.fn();
    renderPricing(onCtaAction);
    await userEvent.click(screen.getByRole('button', { name: /Talk to founder — Growth plan/i }));
    expect(onCtaAction).toHaveBeenCalledWith('contact');
  });

  it('the perpetual/custom notice CTA routes to contact', async () => {
    const onCtaAction = vi.fn();
    renderPricing(onCtaAction);
    await userEvent.click(
      screen.getByRole('button', { name: /Contact EmmaTech about a perpetual or custom deployment/i }),
    );
    expect(onCtaAction).toHaveBeenCalledWith('contact');
  });
});
