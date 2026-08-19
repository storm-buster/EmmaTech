import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { getIntendedPlan } from './auth/planIntent';
import type { AccountResponse } from './auth/authClient';

// Control the authenticated session by mocking the current-user fetch only.
// All other authClient behavior (OAuth start, etc.) remains real.
vi.mock('./auth/authClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./auth/authClient')>();
  return { ...actual, fetchMe: vi.fn() };
});
import { fetchMe } from './auth/authClient';
const fetchMeMock = vi.mocked(fetchMe);

const authedAccount = {
  user: { id: 'u1', email: 'owner@acme.com', name: 'Owner' },
  organization: { id: 'o1', name: 'Acme', status: 'active', rapha_tenant_id: 'tnt-1', plan: 'free', plan_selected: true },
  role: 'owner',
  entitlement: { plan: 'free', planName: 'Free', sensorLimit: 1, decoysEnabled: false },
} as unknown as AccountResponse;

function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  window.location.hash = '#/pricing';
  fetchMeMock.mockReset();
  fetchMeMock.mockResolvedValue(null); // default: unauthenticated
});

describe('Pricing CTA routing — unauthenticated (existing flow preserved)', () => {
  it('FREE → records intended plan and navigates to signup', async () => {
    renderApp();
    // account starts null and stays null (fetchMe → null); no wait required.
    fireEvent.click(screen.getByRole('button', { name: /free plan/i }));
    expect(window.location.hash).toBe('#/signup');
    expect(getIntendedPlan()).toBe('free');
  });

  it('STARTER → records intended plan and navigates to signup', async () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /starter plan/i }));
    expect(window.location.hash).toBe('#/signup');
    expect(getIntendedPlan()).toBe('starter');
  });

  it('GROWTH → records intended plan and navigates to signup', async () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /growth plan/i }));
    expect(window.location.hash).toBe('#/signup');
    expect(getIntendedPlan()).toBe('growth');
  });
});

describe('Pricing CTA routing — authenticated (bug fix: no re-signup)', () => {
  it('FREE → navigates to account, NOT signup, and does not set an intent', async () => {
    fetchMeMock.mockResolvedValue(authedAccount);
    renderApp();
    // Wait until the session is applied (Navigation shows the Console entry only when authed).
    await screen.findAllByText('Console');
    fireEvent.click(screen.getByRole('button', { name: /free plan/i }));
    expect(window.location.hash).toBe('#/account');
    expect(window.location.hash).not.toBe('#/signup');
    expect(getIntendedPlan()).toBeNull();
  });

  it('GROWTH → navigates to account, NOT signup', async () => {
    fetchMeMock.mockResolvedValue(authedAccount);
    renderApp();
    await screen.findAllByText('Console');
    fireEvent.click(screen.getByRole('button', { name: /growth plan/i }));
    expect(window.location.hash).toBe('#/account');
    expect(window.location.hash).not.toBe('#/signup');
  });

  it('STARTER → navigates to account, NOT signup', async () => {
    fetchMeMock.mockResolvedValue(authedAccount);
    renderApp();
    await screen.findAllByText('Console');
    fireEvent.click(screen.getByRole('button', { name: /starter plan/i }));
    expect(window.location.hash).toBe('#/account');
    expect(window.location.hash).not.toBe('#/signup');
  });

  it('OAuth-authenticated session (indistinguishable client-side) → FREE goes to account', async () => {
    // An OAuth-established session surfaces the same authenticated account via fetchMe.
    fetchMeMock.mockResolvedValue(authedAccount);
    renderApp();
    await screen.findAllByText('Console');
    fireEvent.click(screen.getByRole('button', { name: /free plan/i }));
    expect(window.location.hash).toBe('#/account');
  });
});
