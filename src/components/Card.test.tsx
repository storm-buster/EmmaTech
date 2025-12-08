import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Card } from './Card';
import { theme } from '../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('Card', () => {
  it('renders children content', () => {
    renderWithTheme(
      <Card>
        <h3>Card Title</h3>
        <p>Card content</p>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithTheme(
      <Card className="custom-class">Content</Card>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('renders with proper styling', () => {
    const { container } = renderWithTheme(<Card>Content</Card>);

    const card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
  });
});
