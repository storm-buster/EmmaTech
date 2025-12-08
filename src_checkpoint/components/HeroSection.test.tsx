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
  it('renders headline and sub-headline', () => {
    renderWithTheme(
      <HeroSection onWaitlistClick={vi.fn()} onInvestorClick={vi.fn()} />
    );

    expect(screen.getByText('EmmaTech')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Introducing RAPHA: The Future of Autonomous Cyber Defense'
      )
    ).toBeInTheDocument();
  });

  it('renders description text', () => {
    renderWithTheme(
      <HeroSection onWaitlistClick={vi.fn()} onInvestorClick={vi.fn()} />
    );

    expect(
      screen.getByText(/Real-time Autonomous Proactive Honeypot Architecture/i)
    ).toBeInTheDocument();
  });

  it('renders both CTA buttons', () => {
    renderWithTheme(
      <HeroSection onWaitlistClick={vi.fn()} onInvestorClick={vi.fn()} />
    );

    expect(screen.getByText('Join Our Waitlist')).toBeInTheDocument();
    expect(screen.getByText('Become an Investor')).toBeInTheDocument();
  });

  it('calls onWaitlistClick when waitlist button is clicked', async () => {
    const handleWaitlistClick = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(
      <HeroSection
        onWaitlistClick={handleWaitlistClick}
        onInvestorClick={vi.fn()}
      />
    );

    await user.click(screen.getByText('Join Our Waitlist'));
    expect(handleWaitlistClick).toHaveBeenCalledTimes(1);
  });

  it('calls onInvestorClick when investor button is clicked', async () => {
    const handleInvestorClick = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(
      <HeroSection
        onWaitlistClick={vi.fn()}
        onInvestorClick={handleInvestorClick}
      />
    );

    await user.click(screen.getByText('Become an Investor'));
    expect(handleInvestorClick).toHaveBeenCalledTimes(1);
  });
});
