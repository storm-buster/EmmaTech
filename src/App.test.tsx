import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import type { AccountResponse } from './auth/authClient';

// Control the authenticated session by mocking the current-user fetch only.
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
  window.location.hash = '#/';
  fetchMeMock.mockReset();
  fetchMeMock.mockResolvedValue(null); // default: unauthenticated
});

// A navigation in one test sets window.location.hash, which dispatches an async
// `hashchange`. Flush it (and neutralize the hash) after each test so a stale
// event from a prior test cannot re-route the next test's freshly-mounted App.
afterEach(async () => {
  window.location.hash = '';
  await new Promise((r) => setTimeout(r, 0));
});

describe('Commercial repositioning — private-access flow', () => {
  it('legacy #/pricing resolves to the Private Deployment page (no public prices / self-serve CTAs)', async () => {
    window.location.hash = '#/pricing';
    renderApp();
    expect(await screen.findByRole('heading', { level: 1, name: /private deployment/i })).toBeInTheDocument();
    // The former self-service pricing UI must be gone.
    expect(screen.queryByText('Start free')).toBeNull();
    expect(screen.queryByText('Start a pilot')).toBeNull();
    expect(screen.queryByText('Start growth')).toBeNull();
    expect(screen.queryByText('Most popular')).toBeNull();
    // No public rupee prices on the commercial page.
    expect(screen.queryByText(/₹18,000/)).toBeNull();
    expect(screen.queryByText(/₹35,000/)).toBeNull();
  });

  it('Private Deployment "Request Private Access" routes to the application', async () => {
    window.location.hash = '#/private-deployment';
    renderApp();
    await screen.findByRole('heading', { level: 1, name: /private deployment/i });
    fireEvent.click(screen.getByRole('button', { name: /request private access/i }));
    expect(window.location.hash).toBe('#/request-access');
  });

  it('renders the Request Private Access application form', async () => {
    window.location.hash = '#/request-access';
    renderApp();
    expect(await screen.findByRole('heading', { level: 1, name: /request private access/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/primary security challenge/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request private access/i })).toBeInTheDocument();
  });

  it('nav Request Private Access CTA navigates to the application', async () => {
    renderApp();
    // Wait for auth to settle so the nav is fully rendered.
    await screen.findAllByText('Sign in');
    fireEvent.click(screen.getAllByText('Request Private Access')[0]);
    expect(window.location.hash).toBe('#/request-access');
  });
});

describe('Self-service prevention — anonymous signup is gated', () => {
  it('anonymous #/signup shows an access-controlled notice, not the signup form', async () => {
    window.location.hash = '#/signup';
    renderApp();
    expect(await screen.findByRole('heading', { level: 1, name: /access is by request/i })).toBeInTheDocument();
    // The real self-service account-creation form must NOT be reachable anonymously.
    expect(screen.queryByText(/create your account/i)).toBeNull();
  });

  it('the signup gate routes to Request Private Access', async () => {
    window.location.hash = '#/signup';
    renderApp();
    await screen.findByRole('heading', { level: 1, name: /access is by request/i });
    fireEvent.click(screen.getByRole('button', { name: /request private access/i }));
    expect(window.location.hash).toBe('#/request-access');
  });
});

describe('Existing customer access is preserved', () => {
  it('#/login still renders the sign-in page (OAuth + credentials)', async () => {
    window.location.hash = '#/login';
    renderApp();
    expect(await screen.findByText(/Continue with Google/i)).toBeInTheDocument();
  });

  it('an authenticated user reaching #/signup is sent to their account, not the gate', async () => {
    fetchMeMock.mockResolvedValue(authedAccount);
    window.location.hash = '#/signup';
    renderApp();
    // AccountPage renders (authenticated) rather than the access-controlled gate.
    expect(await screen.findAllByText('Console')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /access is by request/i })).toBeNull();
  });
});

describe('No public pricing on anonymous marketing routes (regression)', () => {
  // Catches any public price/plan/margin leak — e.g. the RAPHA product-page
  // comparison row that formerly showed "Rs. 12K/node/year".
  const PRICING = /(₹\s*\d|Rs\.\s*\d|\/node\/year|\/node\/yr|most popular|start free|start a pilot|start growth|breakeven|Starter margin|Growth margin|Regulated margin)/i;
  const routes: Array<{ hash: string; name: string }> = [
    { hash: '#/', name: 'home' },
    { hash: '#/product', name: 'product (RAPHA)' },
    { hash: '#/compliance', name: 'compliance' },
    { hash: '#/private-deployment', name: 'private-deployment' },
    { hash: '#/request-access', name: 'request-access' },
    { hash: '#/contact', name: 'contact' },
  ];
  for (const r of routes) {
    it(`${r.name} exposes no public pricing`, async () => {
      window.location.hash = r.hash;
      renderApp();
      // Wait for nav/auth to settle so the full route content is mounted.
      await screen.findAllByText('Sign in');
      const text = document.body.textContent ?? '';
      expect(text).not.toMatch(PRICING);
    });
  }
});
