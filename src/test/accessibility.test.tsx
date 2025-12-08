import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from '../App';
import { theme } from '../styles/theme';

expect.extend(toHaveNoViolations);

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('Accessibility Tests', () => {
  it('should not have any accessibility violations on main app', async () => {
    const { container } = renderWithTheme(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 10000);
});
