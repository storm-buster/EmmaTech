import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { AuthProvider } from '../../auth/AuthContext';
import { AccountPage } from './AccountPage';
import { theme } from '../../styles/theme';

const ACCOUNT = {
  user: { id: 'u1', email: 'a@b.com', name: 'A', created_at: '' },
  organization: {
    id: 'o1',
    name: 'Acme',
    plan: 'free',
    status: 'active',
    rapha_tenant_id: 'tnt-1',
    created_at: '',
  },
  role: 'owner',
  entitlement: { plan: 'free', planName: 'Free', sensorLimit: 1, decoysEnabled: false },
};

function jsonRes(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AccountPage', () => {
  it('renders account details and no longer shows API-key management (moved to Console)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonRes(200, ACCOUNT)),
    );
    render(
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <AccountPage onNavigate={vi.fn()} />
        </AuthProvider>
      </ThemeProvider>,
    );
    expect(await screen.findByText('Acme')).toBeInTheDocument();
    // API-key management now lives ONLY in the RAPHA Console → API Keys.
    expect(screen.queryByText('API Keys')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create api key/i })).not.toBeInTheDocument();
  });
});
