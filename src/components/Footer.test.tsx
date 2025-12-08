import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Footer } from './Footer';
import { theme } from '../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('Footer', () => {
  it('renders tagline', () => {
    renderWithTheme(<Footer />);
    expect(screen.getByText('DETECT. DECEIVE. DEFEND.')).toBeInTheDocument();
  });

  it('renders copyright text', () => {
    renderWithTheme(<Footer />);
    expect(
      screen.getByText('© 2025 EmmaTech. All rights reserved.')
    ).toBeInTheDocument();
  });
});
