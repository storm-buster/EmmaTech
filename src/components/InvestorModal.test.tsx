import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { InvestorModal } from './InvestorModal';
import { theme } from '../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('InvestorModal', () => {
  it('renders modal title and subtitle', () => {
    renderWithTheme(<InvestorModal isOpen={true} onClose={vi.fn()} />);

    expect(
      screen.getByText('Become an Investor in EmmaTech')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/creating a new category of high-assurance security/i)
    ).toBeInTheDocument();
  });

  it('renders MVP section title', () => {
    renderWithTheme(<InvestorModal isOpen={true} onClose={vi.fn()} />);

    expect(
      screen.getByText('Our Minimum Viable Product (MVP)')
    ).toBeInTheDocument();
  });

  it('renders all four MVP features', () => {
    renderWithTheme(<InvestorModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Decentralized Agent Network/i)).toBeInTheDocument();
    expect(screen.getByText(/ML-Driven Detection Engine/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Dynamic Honeypot Deployment/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tamper-Proof Blockchain Ledger/i)
    ).toBeInTheDocument();
  });

  it('renders contact button', () => {
    renderWithTheme(<InvestorModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Contact Us to Invest')).toBeInTheDocument();
  });

  it('opens mailto link when contact button is clicked', async () => {
    const user = userEvent.setup();
    delete (window as { location?: unknown }).location;
    window.location = { href: '' } as Location;

    renderWithTheme(<InvestorModal isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByText('Contact Us to Invest'));

    expect(window.location.href).toContain('mailto:investors@emmatech.com');
  });

  it('does not render when closed', () => {
    renderWithTheme(<InvestorModal isOpen={false} onClose={vi.fn()} />);

    expect(
      screen.queryByText('Become an Investor in EmmaTech')
    ).not.toBeInTheDocument();
  });
});
