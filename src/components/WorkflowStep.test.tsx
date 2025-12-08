import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { WorkflowStep } from './WorkflowStep';
import { theme } from '../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('WorkflowStep', () => {
  it('renders title, description, and step number', () => {
    renderWithTheme(
      <WorkflowStep
        title="Test Step"
        description="Test description"
        stepNumber={1}
        isLast={false}
      />
    );

    expect(screen.getByText('Test Step')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders different step numbers', () => {
    renderWithTheme(
      <WorkflowStep
        title="Step Two"
        description="Description two"
        stepNumber={2}
        isLast={false}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
