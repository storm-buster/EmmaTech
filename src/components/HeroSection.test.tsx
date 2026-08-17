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
  it('renders the headline', () => {
    renderWithTheme(<HeroSection onDemoClick={vi.fn()} />);

    // The headline is rendered via <SplitText>, which fragments each phrase
    // into one <span> per character (and drops literal spaces in favour of CSS
    // margins). Assert on the accessible <h1> heading's normalized text so we
    // verify the actual intended content despite the character-level DOM split.
    const heading = screen.getByRole('heading', { level: 1 });
    const normalized = (heading.textContent ?? '').replace(/\s+/g, '');
    expect(normalized).toContain('Silence the Noise.'.replace(/\s+/g, ''));
    expect(normalized).toContain('Secure the Future.'.replace(/\s+/g, ''));
  });

  it('renders the RAPHA sub-headline', () => {
    renderWithTheme(<HeroSection onDemoClick={vi.fn()} />);

    expect(
      screen.getByText(/Realtime Autonomous Protection & Honeypot Architecture/i)
    ).toBeInTheDocument();
  });

  it('renders both CTA buttons', () => {
    renderWithTheme(<HeroSection onDemoClick={vi.fn()} />);

    expect(screen.getByText('Request a Demo')).toBeInTheDocument();
    expect(screen.getByText('Explore RAPHA')).toBeInTheDocument();
  });

  it('calls onDemoClick when the demo button is clicked', async () => {
    const handleDemoClick = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(<HeroSection onDemoClick={handleDemoClick} />);

    await user.click(screen.getByText('Request a Demo'));
    expect(handleDemoClick).toHaveBeenCalledTimes(1);
  });
});
