import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { CustomerSegment } from './CustomerSegment';
import { theme } from '../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('CustomerSegment', () => {
  it('renders title, description, and icon', () => {
    renderWithTheme(
      <CustomerSegment
        title="Test Customer"
        description="Test description"
        icon="👨‍💻"
      />
    );

    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('👨‍💻')).toBeInTheDocument();
  });
});
