import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { HeroSection } from './HeroSection';
import { theme } from '../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('HeroSection', () => {
  it('renders the repositioned headline', () => {
    renderWithTheme(<HeroSection onRequestAccess={vi.fn()} onExplore={vi.fn()} />);

    // Headline is rendered via <SplitText> (one span per character), so assert
    // on the normalized <h1> text.
    const heading = screen.getByRole('heading', { level: 1 });
    const normalized = (heading.textContent ?? '').replace(/\s+/g, '');
    expect(normalized).toContain('Autonomous Cyber Defense.'.replace(/\s+/g, ''));
    expect(normalized).toContain('Privately Deployed.'.replace(/\s+/g, ''));
  });

  it('renders the RAPHA sub-headline', () => {
    renderWithTheme(<HeroSection onRequestAccess={vi.fn()} onExplore={vi.fn()} />);
    expect(
      screen.getByText(/Realtime Autonomous Protection & Honeypot Architecture/i),
    ).toBeInTheDocument();
  });

  it('communicates selective/private access', () => {
    renderWithTheme(<HeroSection onRequestAccess={vi.fn()} onExplore={vi.fn()} />);
    expect(screen.getByText(/Private deployment only/i)).toBeInTheDocument();
  });

  it('renders the private-access primary CTA and Explore RAPHA secondary CTA', () => {
    renderWithTheme(<HeroSection onRequestAccess={vi.fn()} onExplore={vi.fn()} />);
    expect(screen.getByText('Request Private Access')).toBeInTheDocument();
    expect(screen.getByText('Explore RAPHA')).toBeInTheDocument();
    // The old self-service demo CTA must be gone.
    expect(screen.queryByText('Request a Demo')).toBeNull();
  });

  it('calls onRequestAccess for the primary CTA and onExplore for the secondary CTA', async () => {
    const onRequestAccess = vi.fn();
    const onExplore = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<HeroSection onRequestAccess={onRequestAccess} onExplore={onExplore} />);

    await user.click(screen.getByText('Request Private Access'));
    expect(onRequestAccess).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText('Explore RAPHA'));
    expect(onExplore).toHaveBeenCalledTimes(1);
  });
});
