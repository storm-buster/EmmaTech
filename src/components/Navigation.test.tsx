import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Navigation } from './Navigation';
import { AuthProvider } from '../auth/AuthContext';
import { theme } from '../styles/theme';

// Mock the auth client so AuthProvider's on-mount fetchMe is deterministic and
// makes no real network call.
vi.mock('../auth/authClient', () => ({
  fetchMe: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
}));

import { fetchMe } from '../auth/authClient';
const mockedFetchMe = vi.mocked(fetchMe);

function renderNav() {
  return render(
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Navigation currentRoute="home" onNavigate={vi.fn()} />
      </AuthProvider>
    </ThemeProvider>,
  );
}

const FORBIDDEN_NAV = ['Admin', 'Administration', 'Internal', 'Operations', 'System'];

beforeEach(() => {
  mockedFetchMe.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Navigation — auth-aware, no admin exposure', () => {
  it('shows "Sign in" for an unauthenticated visitor', async () => {
    mockedFetchMe.mockResolvedValue(null);
    renderNav();
    expect((await screen.findAllByText('Sign in')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Account')).toBeNull();
  });

  it('shows "Account" for an authenticated user', async () => {
    mockedFetchMe.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'A', created_at: '2026-01-01T00:00:00Z' },
      organization: null,
      role: 'owner',
      entitlement: null,
    });
    renderNav();
    expect((await screen.findAllByText('Account')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Sign in')).toBeNull();
  });

  it('never exposes admin/internal navigation items', async () => {
    mockedFetchMe.mockResolvedValue(null);
    renderNav();
    await screen.findAllByText('Sign in');
    for (const term of FORBIDDEN_NAV) {
      expect(screen.queryByText(term)).toBeNull();
    }
  });

  it('renders the expected public nav items', async () => {
    mockedFetchMe.mockResolvedValue(null);
    renderNav();
    await screen.findAllByText('Sign in');
    for (const label of ['Home', 'Product', 'Compliance', 'Pricing', 'Docs', 'Careers', 'Contact']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });
});
