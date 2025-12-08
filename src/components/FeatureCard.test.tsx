import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { FeatureCard } from './FeatureCard';
import { theme } from '../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('FeatureCard', () => {
  it('renders headline, description, and icon', () => {
    renderWithTheme(
      <FeatureCard
        headline="Test Feature"
        description="Test description"
        icon="🔗"
        index={0}
      />
    );

    expect(screen.getByText('Test Feature')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('🔗')).toBeInTheDocument();
  });
});
