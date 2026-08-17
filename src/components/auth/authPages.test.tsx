import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../styles/theme';
import { SignupPage } from './SignupPage';
import { LoginPage } from './LoginPage';

const signup = vi.fn();
const login = vi.fn();
let authValue: Record<string, unknown> = {};
vi.mock('../../auth/AuthContext', () => ({ useAuth: () => authValue }));

function renderSignup(onNavigate = vi.fn()) {
  render(
    <ThemeProvider theme={theme}>
      <SignupPage onNavigate={onNavigate} />
    </ThemeProvider>,
  );
  return onNavigate;
}
function renderLogin(onNavigate = vi.fn()) {
  render(
    <ThemeProvider theme={theme}>
      <LoginPage onNavigate={onNavigate} />
    </ThemeProvider>,
  );
  return onNavigate;
}

beforeEach(() => {
  sessionStorage.clear();
  signup.mockReset().mockResolvedValue(undefined);
  login.mockReset().mockResolvedValue(undefined);
  authValue = { signup, login, account: null, loading: false, logout: vi.fn(), refresh: vi.fn() };
});
afterEach(() => cleanup());

describe('SignupPage — unified options', () => {
  it('renders Google, Microsoft, and email/password signup', () => {
    renderSignup();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Microsoft')).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
    expect(screen.getByText('or')).toBeInTheDocument();
  });

  it('Growth intent requires a work email (consumer rejected, no signup call)', async () => {
    sessionStorage.setItem('emmatech.intendedPlan', 'growth');
    renderSignup();
    expect(screen.getByText('Growth')).toBeInTheDocument(); // plan badge
    await userEvent.type(screen.getByLabelText('Your name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Organization name'), 'Acme');
    await userEvent.type(screen.getByLabelText('Work email'), 'jane@gmail.com');
    await userEvent.type(screen.getByLabelText('Password'), 'a-strong-password');
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));
    expect(await screen.findByText('Work email required for Growth')).toBeInTheDocument();
    expect(signup).not.toHaveBeenCalled();
  });

  it('Growth intent accepts a business email and submits requestedPlan=growth', async () => {
    sessionStorage.setItem('emmatech.intendedPlan', 'growth');
    renderSignup();
    await userEvent.type(screen.getByLabelText('Your name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Organization name'), 'Acme');
    await userEvent.type(screen.getByLabelText('Work email'), 'jane@acme.com');
    await userEvent.type(screen.getByLabelText('Password'), 'a-strong-password');
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));
    expect(signup).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'jane@acme.com', requestedPlan: 'growth' }),
    );
  });
});

describe('LoginPage — unified options', () => {
  it('renders Google, Microsoft, and email/password sign-in', () => {
    renderLogin();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Microsoft')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign in$/i })).toBeInTheDocument();
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(screen.getByText('Create account')).toBeInTheDocument();
  });

  it('email/password sign-in still works', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'user@acme.com');
    await userEvent.type(screen.getByLabelText('Password'), 'a-strong-password');
    await userEvent.click(screen.getByRole('button', { name: /^Sign in$/i }));
    expect(login).toHaveBeenCalledWith('user@acme.com', 'a-strong-password');
  });
});
