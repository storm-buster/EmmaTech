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

/** fetch mock that records enrollment-token POST bodies. */
function stubFetch(tokenResponder?: (init?: RequestInit) => unknown) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url.includes('/enrollment-token') && init?.method === 'POST') {
      return (tokenResponder?.(init) as ReturnType<typeof jsonRes>) ??
        jsonRes(201, {
          enrollment_token: 'renr_shownonce_abcdefghijklmnop',
          token_id: 'tok_1',
          status: 'active',
          expires_at: '2026-01-02T00:00:00Z',
          note: 'sensitive',
        });
    }
    return jsonRes(200, ACCOUNT);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, calls };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('DeploymentPage — Add Server flow', () => {
  it('redirects unauthenticated users to login', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonRes(401, { error: 'Not authenticated' })));
    const onNavigate = renderPage();
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('login'));
  });

  it('shows plan/provisioned status and a server-name input', async () => {
    stubFetch();
    renderPage();
    expect(await screen.findByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Provisioned')).toBeInTheDocument();
    expect(screen.getByLabelText('Server name')).toBeInTheDocument();
  });

  it('requires a valid server name before generating (no POST on empty)', async () => {
    const { calls } = stubFetch();
    renderPage();
    const btn = await screen.findByText('Generate enrollment credential');
    fireEvent.click(btn);
    expect(await screen.findByRole('alert')).toHaveTextContent(/server name/i);
    // No enrollment-token POST happened.
    expect(calls.some((c) => c.url.includes('/enrollment-token') && c.init?.method === 'POST')).toBe(false);
  });

  it('generates with the server name, shows the one-time token + install instructions', async () => {
    const { calls } = stubFetch();
    renderPage();
    fireEvent.change(await screen.findByLabelText('Server name'), { target: { value: 'WEB-SERVER-01' } });
    fireEvent.click(screen.getByText('Generate enrollment credential'));

    // Token appears once.
    expect(await screen.findByText('renr_shownonce_abcdefghijklmnop')).toBeInTheDocument();
    // sensor_name was sent (tenant derived server-side; never sent by client).
    const post = calls.find((c) => c.url.includes('/enrollment-token') && c.init?.method === 'POST');
    expect(JSON.parse(post!.init!.body as string)).toEqual({ sensor_name: 'WEB-SERVER-01' });
    expect(post!.init!.body as string).not.toContain('tenant_id');

    // Install instructions + installer URL appear.
    const cmd = await screen.findByLabelText('installer command');
    expect(screen.getAllByText(/emmatech\.in\/install-rapha\.ps1/).length).toBeGreaterThan(0);

    // The token is NOT in the command or the installer URL.
    expect(cmd.textContent ?? '').not.toContain('renr_shownonce_abcdefghijklmnop');
    expect(cmd.textContent ?? '').toContain('-SensorName "WEB-SERVER-01"');
    expect(cmd.textContent ?? '').not.toContain('token');
  });

  it('copies the token via an explicit Copy action', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    stubFetch();
    renderPage();
    fireEvent.change(await screen.findByLabelText('Server name'), { target: { value: 'db-1' } });
    fireEvent.click(screen.getByText('Generate enrollment credential'));
    await screen.findByText('renr_shownonce_abcdefghijklmnop');
    fireEvent.click(screen.getByText('Copy'));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('renr_shownonce_abcdefghijklmnop'));
  });

  it('shows a safe error message when generation fails', async () => {
    stubFetch(() => jsonRes(502, { error: 'RAPHA is temporarily unavailable. Please try again later.' }));
    renderPage();
    fireEvent.change(await screen.findByLabelText('Server name'), { target: { value: 'web-1' } });
    fireEvent.click(screen.getByText('Generate enrollment credential'));
    expect(
      await screen.findByText('RAPHA is temporarily unavailable. Please try again later.'),
    ).toBeInTheDocument();
  });

  it('reflects live API access (no stale "coming soon"/"not available yet")', async () => {
    stubFetch();
    renderPage();
    await screen.findByText('Free');
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not available yet/i)).not.toBeInTheDocument();
    expect(screen.getByText(/API access is live/i)).toBeInTheDocument();
  });
});
