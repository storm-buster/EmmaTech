import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { applyLegacyHashRedirect } from './routing';
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

/** Set the SPA location to a pathname (optionally with a legacy hash) before render. */
function setPath(pathname: string, hash = '') {
  window.history.replaceState({}, '', pathname + hash);
}

function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
  fetchMeMock.mockReset();
  fetchMeMock.mockResolvedValue(null); // default: unauthenticated
});

afterEach(async () => {
  window.history.replaceState({}, '', '/');
  await new Promise((r) => setTimeout(r, 0));
});

describe('Pathname routing — public marketing routes', () => {
  it('/ renders the homepage (hero + curiosity section)', async () => {
    setPath('/');
    renderApp();
    expect(await screen.findByText(/Detection is not the end of the response/i)).toBeInTheDocument();
  });

  it('/rapha renders the RAPHA product page', async () => {
    setPath('/rapha');
    renderApp();
    expect(await screen.findByText(/One autonomous loop\./i)).toBeInTheDocument();
  });

  it('/compliance renders the compliance page', async () => {
    setPath('/compliance');
    renderApp();
    expect(await screen.findByText(/Compliance & GTM/i)).toBeInTheDocument();
  });

  it('/private-deployment renders the private-deployment page (no pricing)', async () => {
    setPath('/private-deployment');
    renderApp();
    expect(await screen.findByRole('heading', { level: 1, name: /private deployment/i })).toBeInTheDocument();
    expect(screen.queryByText('Start free')).toBeNull();
    expect(screen.queryByText(/₹18,000/)).toBeNull();
  });

  it('/request-access renders the application form', async () => {
    setPath('/request-access');
    renderApp();
    expect(await screen.findByRole('heading', { level: 1, name: /request private access/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request private access/i })).toBeInTheDocument();
  });

  it('/docs renders the docs overview; /docs/windows renders the Windows page', async () => {
    setPath('/docs');
    const { unmount } = renderApp();
    expect(await screen.findByRole('heading', { level: 1, name: /^Overview$/i })).toBeInTheDocument();
    unmount();
    setPath('/docs/windows');
    renderApp();
    expect(await screen.findByRole('heading', { level: 1, name: /Windows Installation/i })).toBeInTheDocument();
  });

  it('unknown pathname renders the 404 page (not silently Home)', async () => {
    setPath('/does-not-exist');
    renderApp();
    expect(await screen.findByText(/This page could not be found\./i)).toBeInTheDocument();
    // Not the homepage.
    expect(screen.queryByText(/Detection is not the end of the response/i)).toBeNull();
  });
});

describe('Pathname navigation via clicks + browser history', () => {
  it('Private Deployment CTA pushes /request-access', async () => {
    setPath('/private-deployment');
    renderApp();
    await screen.findByRole('heading', { level: 1, name: /private deployment/i });
    fireEvent.click(screen.getByRole('button', { name: /request private access/i }));
    expect(window.location.pathname).toBe('/request-access');
    expect(await screen.findByLabelText(/work email/i)).toBeInTheDocument();
  });

  it('nav Request Private Access CTA (real anchor href) navigates to /request-access', async () => {
    setPath('/');
    renderApp();
    await screen.findAllByText('Sign in');
    const cta = screen.getAllByText('Request Private Access')[0];
    expect(cta.getAttribute('href')).toBe('/request-access');
    fireEvent.click(cta);
    expect(window.location.pathname).toBe('/request-access');
  });

  it('reacts to browser back/forward (popstate)', async () => {
    setPath('/rapha');
    renderApp();
    await screen.findByText(/One autonomous loop\./i);
    // Simulate the browser navigating (back/forward) to /compliance.
    await act(async () => {
      window.history.pushState({}, '', '/compliance');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(await screen.findByText(/Compliance & GTM/i)).toBeInTheDocument();
  });
});

describe('Legacy hash → pathname compatibility shim', () => {
  const cases: Array<[string, string]> = [
    ['#/product', '/rapha'],
    ['#/pricing', '/private-deployment'],
    ['#/compliance', '/compliance'],
    ['#/request-access', '/request-access'],
    ['#/contact', '/contact'],
    ['#/docs', '/docs'],
    ['#/docs/windows', '/docs/windows'],
    ['#/login', '/login'],
  ];
  for (const [hash, path] of cases) {
    it(`${hash} → ${path}`, () => {
      setPath('/', hash);
      applyLegacyHashRedirect();
      expect(window.location.pathname).toBe(path);
      expect(window.location.hash).toBe('');
    });
  }

  it('legacy #/pricing renders the Private Deployment page after the shim', async () => {
    setPath('/', '#/pricing');
    applyLegacyHashRedirect();
    renderApp();
    expect(await screen.findByRole('heading', { level: 1, name: /private deployment/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/private-deployment');
  });

  it('does not touch the hash when already on a real pathname (e.g. console section state)', () => {
    setPath('/console', '#forensics');
    applyLegacyHashRedirect();
    expect(window.location.pathname).toBe('/console');
    expect(window.location.hash).toBe('#forensics');
  });
});

describe('Self-service prevention — anonymous signup is gated', () => {
  it('anonymous /signup shows an access-controlled notice, not the signup form', async () => {
    setPath('/signup');
    renderApp();
    expect(await screen.findByRole('heading', { level: 1, name: /access is by request/i })).toBeInTheDocument();
    expect(screen.queryByText(/create your account/i)).toBeNull();
  });

  it('the signup gate routes to /request-access', async () => {
    setPath('/signup');
    renderApp();
    await screen.findByRole('heading', { level: 1, name: /access is by request/i });
    fireEvent.click(screen.getByRole('button', { name: /request private access/i }));
    expect(window.location.pathname).toBe('/request-access');
  });
});

describe('Existing customer access is preserved', () => {
  it('/login still renders the sign-in page (OAuth + credentials)', async () => {
    setPath('/login');
    renderApp();
    expect(await screen.findByText(/Continue with Google/i)).toBeInTheDocument();
  });

  it('an authenticated user reaching /signup is sent to their account, not the gate', async () => {
    fetchMeMock.mockResolvedValue(authedAccount);
    setPath('/signup');
    renderApp();
    expect(await screen.findAllByText('Console')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /access is by request/i })).toBeNull();
  });
});

describe('No public pricing on anonymous marketing routes (regression)', () => {
  const PRICING = /(₹\s*\d|Rs\.\s*\d|\/node\/year|\/node\/yr|most popular|start free|start a pilot|start growth|breakeven|Starter margin|Growth margin|Regulated margin)/i;
  const routes = ['/', '/rapha', '/compliance', '/private-deployment', '/request-access', '/contact'];
  for (const path of routes) {
    it(`${path} exposes no public pricing`, async () => {
      setPath(path);
      renderApp();
      await screen.findAllByText('Sign in');
      const text = document.body.textContent ?? '';
      expect(text).not.toMatch(PRICING);
    });
  }
});
