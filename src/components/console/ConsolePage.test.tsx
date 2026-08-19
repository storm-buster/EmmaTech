import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConsolePage } from './ConsolePage';
import { theme } from '../../styles/theme';

// Control auth state directly (reuses the real gate logic without a network call).
interface AuthValue {
  account: unknown;
  loading: boolean;
}
let authValue: AuthValue = { account: null, loading: true };
vi.mock('../../auth/AuthContext', () => ({ useAuth: () => authValue }));

// Control the RAPHA health probe and console data fetchers.
vi.mock('../../auth/consoleClient', () => ({
  fetchRaphaStatus: vi.fn(),
  fetchConsoleSensors: vi.fn(),
  fetchConsoleTelemetry: vi.fn(),
  fetchConsoleAlerts: vi.fn(),
  fetchConsoleForensics: vi.fn(),
}));
import {
  fetchRaphaStatus,
  fetchConsoleSensors,
  fetchConsoleTelemetry,
  fetchConsoleAlerts,
  fetchConsoleForensics,
} from '../../auth/consoleClient';
const mockStatus = vi.mocked(fetchRaphaStatus);
const mockSensors = vi.mocked(fetchConsoleSensors);
const mockTelemetry = vi.mocked(fetchConsoleTelemetry);
const mockAlerts = vi.mocked(fetchConsoleAlerts);
const mockForensics = vi.mocked(fetchConsoleForensics);

const ACCOUNT = {
  user: { id: 'u1', email: 'owner@example.com', name: 'Owner One', created_at: '2026-01-01T00:00:00Z' },
  organization: {
    id: 'org-1',
    name: 'Acme Inc',
    plan: 'starter',
    status: 'active',
    rapha_tenant_id: 'tnt-abc',
    created_at: '2026-01-01T00:00:00Z',
  },
  role: 'owner',
  entitlement: { plan: 'starter', planName: 'Starter', sensorLimit: 20, decoysEnabled: true },
};

function renderConsole(hash = '#/console', onNavigate = vi.fn()) {
  window.location.hash = hash;
  render(
    <ThemeProvider theme={theme}>
      <ConsolePage onNavigate={onNavigate} />
    </ThemeProvider>,
  );
  return onNavigate;
}

beforeEach(() => {
  authValue = { account: null, loading: true };
  mockStatus.mockReset();
  mockStatus.mockResolvedValue({ status: 'operational', healthy: true, checkedAt: '2026-01-01T00:00:00Z' });
  mockSensors.mockReset();
  mockSensors.mockResolvedValue({ tenant_id: 'tnt-abc', sensors: [] });
  mockTelemetry.mockReset();
  mockTelemetry.mockResolvedValue({ tenant_id: 'tnt-abc', telemetry: [] });
  mockAlerts.mockReset();
  mockAlerts.mockResolvedValue({ tenant_id: 'tnt-abc', alerts: [] });
  mockForensics.mockReset();
  mockForensics.mockResolvedValue({ tenant_id: 'tnt-abc', forensics: [] });
});

afterEach(() => {
  cleanup();
  window.location.hash = '';
  vi.clearAllMocks();
});

describe('ConsolePage — authentication gate', () => {
  it('redirects an unauthenticated (resolved) user to login', () => {
    authValue = { account: null, loading: false };
    const onNavigate = renderConsole();
    expect(onNavigate).toHaveBeenCalledWith('login');
  });

  it('shows a loading state (no protected content) while auth resolves', () => {
    authValue = { account: null, loading: true };
    renderConsole();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByText('Organization')).toBeNull();
  });

  it('renders the console for an authenticated user', async () => {
    authValue = { account: ACCOUNT, loading: false };
    renderConsole();
    expect(await screen.findByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument();
  });
});

describe('ConsolePage — Overview (real data only)', () => {
  beforeEach(() => {
    authValue = { account: ACCOUNT, loading: false };
  });

  it('renders the organization name from /api/me account', async () => {
    renderConsole();
    expect((await screen.findAllByText('Acme Inc')).length).toBeGreaterThan(0);
    expect(screen.getByText('Organization')).toBeInTheDocument();
  });

  it('renders plan/entitlement from real account data', () => {
    renderConsole();
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument(); // sensor allowance
    expect(screen.getByText('Included')).toBeInTheDocument(); // decoys
  });

  it('shows RAPHA healthy state when the status proxy reports operational', async () => {
    mockStatus.mockResolvedValue({ status: 'operational', healthy: true, checkedAt: '2026-01-01T00:00:00Z' });
    renderConsole();
    expect(await screen.findByText('Operational')).toBeInTheDocument();
  });

  it('shows an unavailable state when the status proxy reports down', async () => {
    mockStatus.mockResolvedValue({ status: 'down', healthy: false, checkedAt: '2026-01-01T00:00:00Z' });
    renderConsole();
    expect(await screen.findByText('Unavailable')).toBeInTheDocument();
  });

  it('shows an error state when the status proxy is unreachable', async () => {
    mockStatus.mockRejectedValue(new Error('network'));
    renderConsole();
    expect(await screen.findByText('Unknown')).toBeInTheDocument();
  });

  it('offers quick actions to Deploy and Docs', async () => {
    const onNavigate = renderConsole();
    await userEvent.click(screen.getByRole('button', { name: /Deploy a RAPHA sensor/i }));
    expect(onNavigate).toHaveBeenCalledWith('deploy');
    await userEvent.click(screen.getByRole('button', { name: /View RAPHA documentation/i }));
    expect(onNavigate).toHaveBeenCalledWith('docs');
  });

  it('has no client-side tenant selector (no combobox/textbox)', () => {
    renderConsole();
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });
});

describe('ConsolePage — navigation', () => {
  beforeEach(() => {
    authValue = { account: ACCOUNT, loading: false };
  });

  it('renders all five console sections', () => {
    const { container } = { container: renderConsoleReturningContainer() };
    for (const label of ['Overview', 'Sensors', 'Telemetry', 'Alerts', 'Forensics']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    // active section marked with aria-current
    const current = container.querySelector('a[aria-current="page"]');
    expect(current?.textContent).toBe('Overview');
  });

  it('toggles mobile navigation via an accessible button', async () => {
    renderConsole();
    const toggle = screen.getByRole('button', { name: /Overview/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('ConsolePage — data sections (real data via /api/console/*)', () => {
  beforeEach(() => {
    authValue = { account: ACCOUNT, loading: false };
  });

  it('Sensors: renders real sensor fields (no fabricated data)', async () => {
    mockSensors.mockResolvedValue({
      tenant_id: 'tnt-abc',
      sensors: [{ sensor_id: 'orch-1', tenant_id: 'tnt-abc', hostname: 'WIN-HOST-1', status: 'active', last_seen: 1735689600 }],
    });
    renderConsole('#/console/sensors');
    expect(await screen.findByText('WIN-HOST-1')).toBeInTheDocument();
    expect(screen.getByText('orch-1')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('Sensors: honest empty state (distinct from unavailable)', async () => {
    mockSensors.mockResolvedValue({ tenant_id: 'tnt-abc', sensors: [] });
    renderConsole('#/console/sensors');
    expect(await screen.findByText(/No sensors are enrolled yet/i)).toBeInTheDocument();
  });

  it('Sensors: error state on API failure', async () => {
    mockSensors.mockRejectedValue(new Error('RAPHA is temporarily unavailable. Please try again later.'));
    renderConsole('#/console/sensors');
    expect(await screen.findByText(/connection problem with RAPHA/i)).toBeInTheDocument();
  });

  it('Sensors: loading state before data resolves', () => {
    mockSensors.mockReturnValue(new Promise(() => {})); // never resolves
    renderConsole('#/console/sensors');
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('Telemetry: renders real Phase-6 telemetry fields', async () => {
    mockTelemetry.mockResolvedValue({
      tenant_id: 'tnt-abc',
      telemetry: [{
        sensor_id: 'ingest-api', tenant_id: 'tnt-abc', last_category: 'port_scan',
        last_score: 0.87, last_is_threat: true, last_confidence: 'high', model_version: 'm-1', updated_at: 1735689600,
      }],
    });
    renderConsole('#/console/telemetry');
    expect(await screen.findByText('ingest-api')).toBeInTheDocument();
    expect(screen.getByText('port_scan')).toBeInTheDocument();
    expect(screen.getByText('0.87')).toBeInTheDocument();
    expect(screen.getByText('Threat')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('Telemetry: empty state', async () => {
    mockTelemetry.mockResolvedValue({ tenant_id: 'tnt-abc', telemetry: [] });
    renderConsole('#/console/telemetry');
    expect(await screen.findByText(/No telemetry has been received yet/i)).toBeInTheDocument();
  });

  it('Alerts: renders real alert fields and NO invented severity', async () => {
    mockAlerts.mockResolvedValue({
      tenant_id: 'tnt-abc',
      alerts: [{
        id: 'al-1', ts: 1735689600, category: 'malware', score: 0.91, confidence: 'high',
        label: 1, action: 'ALERT', event_ref: 'abcdef1234567890beef', model_version: 'm-1', delivered: 1,
      }],
    });
    const { container } = { container: renderConsoleContainer('#/console/alerts') };
    expect(await screen.findByText('malware')).toBeInTheDocument();
    expect(screen.getByText('0.91')).toBeInTheDocument();
    expect(screen.getByText('ALERT')).toBeInTheDocument();
    // No fabricated risk classification fields.
    expect(container.textContent).not.toMatch(/severity|priority|risk[_ ]?level/i);
  });

  it('Alerts: empty state', async () => {
    mockAlerts.mockResolvedValue({ tenant_id: 'tnt-abc', alerts: [] });
    renderConsole('#/console/alerts');
    expect(await screen.findByText(/No alerts have been raised/i)).toBeInTheDocument();
  });

  it('Forensics: renders structured record fields', async () => {
    mockForensics.mockResolvedValue({
      tenant_id: 'tnt-abc',
      forensics: [{
        idx: 7, timestamp: 1735689600, tenant_id: 'tnt-abc', orchestrator_id: 'ingest-api',
        policy_version: 'p-1', model_version: 'm-1', previous_hash: 'aaaaaaaaaabbbbbbbbbb', hash: 'ccccccccccdddddddddd',
      }],
    });
    renderConsole('#/console/forensics');
    expect(await screen.findByText('Record #7')).toBeInTheDocument();
    expect(screen.getByText('ingest-api')).toBeInTheDocument();
    expect(screen.getByText('p-1')).toBeInTheDocument();
  });

  it('Forensics: error state on API failure', async () => {
    mockForensics.mockRejectedValue(new Error('RAPHA is temporarily unavailable. Please try again later.'));
    renderConsole('#/console/forensics');
    expect(await screen.findByText(/connection problem with RAPHA/i)).toBeInTheDocument();
  });
});

describe('ConsolePage — security (client-side source)', () => {
  it('console client source never references RAPHA service credentials or VITE_ secrets', () => {
    const root = process.cwd();
    const files = [
      'src/components/console/ConsolePage.tsx',
      'src/components/console/consoleStyles.tsx',
      'src/components/console/usePolling.ts',
      'src/console/consoleNav.ts',
      'src/auth/consoleClient.ts',
    ];
    for (const rel of files) {
      const src = readFileSync(join(root, rel), 'utf8');
      expect(src).not.toMatch(/RAPHA_SERVICE_TOKEN/);
      expect(src).not.toMatch(/X-Service-Token/);
      expect(src).not.toMatch(/VITE_/);
      expect(src).not.toMatch(/DATABASE_URL/);
    }
  });

  it('console client methods take no tenant id argument (server derives tenant)', () => {
    const src = readFileSync(join(process.cwd(), 'src/auth/consoleClient.ts'), 'utf8');
    // A tenant-id parameter would conventionally be `tenantId`; it must never
    // appear — the server derives the tenant from the session.
    expect(src).not.toMatch(/tenantId/);
  });
});

// Helper: render and also return the container for attribute queries.
function renderConsoleReturningContainer() {
  window.location.hash = '#/console';
  const { container } = render(
    <ThemeProvider theme={theme}>
      <ConsolePage onNavigate={vi.fn()} />
    </ThemeProvider>,
  );
  return container;
}

// Helper: render at a given hash and return the container.
function renderConsoleContainer(hash: string) {
  window.location.hash = hash;
  const { container } = render(
    <ThemeProvider theme={theme}>
      <ConsolePage onNavigate={vi.fn()} />
    </ThemeProvider>,
  );
  return container;
}



// API Keys section (moved into the Console below Overview). The section loads
// via apiKeysClient; mock it so the console test does not hit the network.
vi.mock('../../auth/apiKeysClient', () => ({
  listApiKeys: vi.fn(async () => []),
  createApiKey: vi.fn(),
  rotateApiKey: vi.fn(),
  revokeApiKey: vi.fn(),
}));

describe('ConsolePage — API Keys section', () => {
  it('shows an API Keys navigation entry when authenticated', () => {
    authValue = { account: ACCOUNT, loading: false };
    renderConsole('#/console');
    expect(screen.getAllByText('API Keys').length).toBeGreaterThan(0);
  });

  it('renders the API Keys management section at #/console/api-keys', async () => {
    authValue = { account: ACCOUNT, loading: false };
    renderConsole('#/console/api-keys');
    expect(
      await screen.findByText(/connect your RAPHA deployment to external systems/i),
    ).toBeInTheDocument();
  });
});



describe('ConsolePage — plan-aware Overview (entitlement from backend, not hardcoded)', () => {
  const withEntitlement = (e: { plan: string; planName: string; sensorLimit: number | null; decoysEnabled: boolean }) => ({
    ...ACCOUNT,
    organization: { ...ACCOUNT.organization, plan: e.plan },
    entitlement: e,
  });

  it('Free → 1 sensor, decoys not included', () => {
    authValue = { account: withEntitlement({ plan: 'free', planName: 'Free', sensorLimit: 1, decoysEnabled: false }), loading: false };
    renderConsole('#/console');
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Not included')).toBeInTheDocument();
  });

  it('Starter → 20 sensors, decoys included', () => {
    authValue = { account: withEntitlement({ plan: 'starter', planName: 'Starter', sensorLimit: 20, decoysEnabled: true }), loading: false };
    renderConsole('#/console');
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Included')).toBeInTheDocument();
  });

  it('Growth → unlimited sensors, decoys included', () => {
    authValue = { account: withEntitlement({ plan: 'growth', planName: 'Growth', sensorLimit: null, decoysEnabled: true }), loading: false };
    renderConsole('#/console');
    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText('Unlimited')).toBeInTheDocument();
    expect(screen.getByText('Included')).toBeInTheDocument();
  });
});
