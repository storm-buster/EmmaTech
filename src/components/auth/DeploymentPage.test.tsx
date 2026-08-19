import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { AuthProvider } from '../../auth/AuthContext';
import { DeploymentPage } from './DeploymentPage';
import { theme } from '../../styles/theme';

const ACCOUNT = {
  user: { id: 'u1', email: 'a@b.com', name: 'A', created_at: '' },
  organization: {
    id: 'o1',
    name: 'Acme',
    plan: 'free',
    plan_selected: true,
    status: 'active',
    rapha_tenant_id: 'tenant-o1',
    created_at: '',
  },
  role: 'owner',
  entitlement: { plan: 'free', planName: 'Free', sensorLimit: 1, decoysEnabled: false },
};

function jsonRes(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function renderPage(onNavigate = vi.fn()) {
  render(
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <DeploymentPage onNavigate={onNavigate} />
      </AuthProvider>
    </ThemeProvider>,
  );
  return onNavigate;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('DeploymentPage', () => {
  it('redirects unauthenticated users to login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonRes(401, { error: 'Not authenticated' })),
    );
    const onNavigate = renderPage();
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('login'));
  });

  it('shows the current plan and provisioned status from the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonRes(200, ACCOUNT)),
    );
    renderPage();
    expect(await screen.findByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Provisioned')).toBeInTheDocument();
  });

  it('generates and displays a one-time enrollment credential', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/enrollment-token') && init?.method === 'POST') {
          return jsonRes(201, {
            enrollment_token: 'renr_shownonce',
            token_id: 'tok_1',
            status: 'active',
            expires_at: '2026-01-02T00:00:00Z',
            note: 'sensitive',
          });
        }
        return jsonRes(200, ACCOUNT);
      }),
    );
    renderPage();
    const btn = await screen.findByText('Generate enrollment credential');
    fireEvent.click(btn);
    expect(await screen.findByText('renr_shownonce')).toBeInTheDocument();
  });

  it('shows a safe error message when generation fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/enrollment-token') && init?.method === 'POST') {
          return jsonRes(502, { error: 'RAPHA is temporarily unavailable. Please try again later.' });
        }
        return jsonRes(200, ACCOUNT);
      }),
    );
    renderPage();
    const btn = await screen.findByText('Generate enrollment credential');
    fireEvent.click(btn);
    expect(
      await screen.findByText('RAPHA is temporarily unavailable. Please try again later.'),
    ).toBeInTheDocument();
  });

  it('reflects live API access (no stale "coming soon"/"not available yet")', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonRes(200, ACCOUNT)),
    );
    renderPage();
    await screen.findByText('Free');
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not available yet/i)).not.toBeInTheDocument();
    expect(screen.getByText(/API access is live/i)).toBeInTheDocument();
  });
});
