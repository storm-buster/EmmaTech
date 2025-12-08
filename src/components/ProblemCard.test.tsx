import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { ProblemCard } from './ProblemCard';
import { theme } from '../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('ProblemCard', () => {
  it('renders headline and description', () => {
    renderWithTheme(
      <ProblemCard
        headline="Test Problem"
        description="Test description"
        index={0}
      />
    );

    expect(screen.getByText('Test Problem')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders with different content', () => {
    renderWithTheme(
      <ProblemCard
        headline="Another Problem"
        description="Another description"
        index={1}
      />
    );

    expect(screen.getByText('Another Problem')).toBeInTheDocument();
    expect(screen.getByText('Another description')).toBeInTheDocument();
  });
});
