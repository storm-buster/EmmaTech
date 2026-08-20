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

// Future epoch SECONDS (2026-08-21) — exercises the UI's seconds→ms handling.
const EPOCH_SECONDS = 1787270400;

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

/** fetch mock: /me → account, POST enrollment-token → credential, /console/sensors → given list. */
function stubFetch(opts: { tokenStatus?: number; expiresAt?: unknown; sensors?: unknown[] } = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url.includes('/enrollment-token') && init?.method === 'POST') {
      if (opts.tokenStatus && opts.tokenStatus >= 400) {
        return jsonRes(opts.tokenStatus, { error: 'RAPHA is temporarily unavailable. Please try again later.' });
      }
      return jsonRes(201, {
        enrollment_token: 'renr_shownonce_abcdefghijklmnop',
        token_id: 'tok_1',
        status: 'active',
        expires_at: opts.expiresAt ?? '2026-08-21T00:00:00.000Z',
        note: 'sensitive',
      });
    }
    if (url.includes('/api/console/sensors')) {
      return jsonRes(200, { tenant_id: 'tenant-o1', sensors: opts.sensors ?? [] });
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

describe('DeploymentPage — hardened deployment flow', () => {
  it('redirects unauthenticated users to login', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonRes(401, { error: 'Not authenticated' })));
    const onNavigate = renderPage();
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('login'));
  });

  it('shows plan/status and a server-name input', async () => {
    stubFetch();
    renderPage();
    expect(await screen.findByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Provisioned')).toBeInTheDocument();
    expect(screen.getByLabelText('Server name')).toBeInTheDocument();
  });

  it('requires a valid server name before generating (no POST on empty)', async () => {
    const { calls } = stubFetch();
    renderPage();
    fireEvent.click(await screen.findByText('Generate enrollment credential'));
    expect(await screen.findByRole('alert')).toHaveTextContent(/server name/i);
    expect(calls.some((c) => c.url.includes('/enrollment-token') && c.init?.method === 'POST')).toBe(false);
  });

  it('generates a token, renders a correct (non-1970) expiry from epoch seconds, and token-free commands', async () => {
    const { calls } = stubFetch({ expiresAt: EPOCH_SECONDS }); // epoch seconds
    renderPage();
    fireEvent.change(await screen.findByLabelText('Server name'), { target: { value: 'WEB-SERVER-01' } });
    fireEvent.click(screen.getByText('Generate enrollment credential'));

    expect(await screen.findByText('renr_shownonce_abcdefghijklmnop')).toBeInTheDocument();
    // sensor_name sent; no tenant_id from browser.
    const post = calls.find((c) => c.url.includes('/enrollment-token') && c.init?.method === 'POST');
    expect(JSON.parse(post!.init!.body as string)).toEqual({ sensor_name: 'WEB-SERVER-01' });

    // Expiry renders in local time and is NOT the 1970 bug.
    const expectedExpiry = new Date(EPOCH_SECONDS * 1000).toLocaleString();
    expect(screen.getByText(expectedExpiry)).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toContain('1970');

    // Primary + fallback commands present; neither contains the token.
    const cmd = await screen.findByLabelText('installer command');
    const fb = await screen.findByLabelText('installer fallback command');
    expect(cmd.textContent ?? '').toContain('-SensorName "WEB-SERVER-01"');
    expect(cmd.textContent ?? '').not.toContain('renr_shownonce_abcdefghijklmnop');
    expect(fb.textContent ?? '').toContain('-ExecutionPolicy Bypass');
    expect(fb.textContent ?? '').not.toContain('renr_shownonce_abcdefghijklmnop');
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

  it('transitions to ONLINE when the enrolled sensor connects, and offers Open Console', async () => {
    stubFetch({
      sensors: [
        { sensor_id: 'orch-x', tenant_id: 'tenant-o1', hostname: 'WEB-SERVER-01', status: 'active', last_seen: EPOCH_SECONDS },
      ],
    });
    const onNavigate = renderPage();
    fireEvent.change(await screen.findByLabelText('Server name'), { target: { value: 'WEB-SERVER-01' } });
    fireEvent.click(screen.getByText('Generate enrollment credential'));
    // Auto-poll picks up the matching active sensor → ONLINE success state.
    expect(await screen.findByText('RAPHA Agent installed successfully')).toBeInTheDocument();
    expect(screen.getByText('ONLINE')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Open Console'));
    expect(onNavigate).toHaveBeenCalledWith('console');
  });

  it('stays in a waiting state (not ONLINE) when no matching sensor has connected', async () => {
    stubFetch({ sensors: [] });
    renderPage();
    fireEvent.change(await screen.findByLabelText('Server name'), { target: { value: 'WEB-SERVER-01' } });
    fireEvent.click(screen.getByText('Generate enrollment credential'));
    await screen.findByText('renr_shownonce_abcdefghijklmnop');
    await waitFor(() =>
      expect(screen.getByText(/Waiting for your server to connect/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText('ONLINE')).not.toBeInTheDocument();
  });

  it('shows a safe error message when generation fails', async () => {
    stubFetch({ tokenStatus: 502 });
    renderPage();
    fireEvent.change(await screen.findByLabelText('Server name'), { target: { value: 'web-1' } });
    fireEvent.click(screen.getByText('Generate enrollment credential'));
    expect(
      await screen.findByText(/RAPHA is temporarily unavailable/i),
    ).toBeInTheDocument();
  });
});
