import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { WaitlistForm } from './WaitlistForm';
import { theme } from '../styles/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('WaitlistForm', () => {
  it('renders all form fields', () => {
    renderWithTheme(
      <WaitlistForm onSubmit={vi.fn()} isSubmitting={false} />
    );

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organization/i)).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <WaitlistForm onSubmit={vi.fn()} isSubmitting={false} />
    );

    await user.click(screen.getByText('Request Access'));

    await waitFor(() => {
      expect(screen.getByText(/please enter your full name/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter your email address/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter your organization name/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <WaitlistForm onSubmit={vi.fn()} isSubmitting={false} />
    );

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    await user.click(screen.getByText('Request Access'));

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(
      <WaitlistForm onSubmit={handleSubmit} isSubmitting={false} />
    );

    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/organization/i), 'Acme Corp');
    await user.click(screen.getByText('Request Access'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'John Doe',
          email: 'john@example.com',
          organization: 'Acme Corp',
        })
      );
    });
  });

  it('disables submit button when submitting', () => {
    renderWithTheme(
      <WaitlistForm onSubmit={vi.fn()} isSubmitting={true} />
    );

    const submitButton = screen.getByText('Submitting...');
    expect(submitButton).toBeDisabled();
  });
});
