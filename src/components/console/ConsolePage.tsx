import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  fetchRaphaStatus,
  fetchConsoleForensics,
  fetchConsoleSensors,
} from '../../auth/consoleClient';
import type { RaphaStatus, ForensicRow, SensorRow } from '../../auth/consoleClient';
import { usePolling } from './usePolling';
import type { PollState } from './usePolling';
import { useConsoleLiveData } from './useConsoleLiveData';
import type { ConsoleLiveData } from './useConsoleLiveData';
import type { StreamStatus } from './useConsoleStream';
import type { AccountResponse, OrgStatus } from '../../auth/authClient';
import type { Route } from '../../App';
import { Button } from '../Button';
import { ApiKeysSection } from '../auth/ApiKeysSection';
import { LoadingSpinner } from '../LoadingSpinner';
import {
  CONSOLE_NAV,
  consoleHash,
  sectionFromHash,
  type ConsoleSectionId,
} from '../../console/consoleNav';
import {
  ActionsRow,
  CardGrid,
  CardHeading,
  CenterState,
  ConsoleCard,
  ConsoleContent,
  ConsoleHeader,
  ConsoleLayout,
  ConsoleSubtitle,
  ConsoleTitle,
  DefKey,
  DefRow,
  DefVal,
  DeferredPanel,
  DeferredText,
  MobileToggle,
  NavLink,
  NavList,
  Sidebar,
  SidebarInner,
  SidebarTitle,
  StatusPill,
} from './consoleStyles';

interface Props {
  onNavigate: (to: Route) => void;
}

const ORG_STATUS_LABEL: Record<OrgStatus, string> = {
  active: 'Active',
  pending: 'Provisioning',
  failed: 'Provisioning failed',
};

const STREAM_STATUS_LABEL: Record<StreamStatus, string> = {
  connecting: 'Connecting…',
  live: 'Live',
  reconnecting: 'Reconnecting…',
  polling: 'Polling fallback',
  offline: 'Offline',
};

// ── RAPHA health (Overview card) ─────────────────────────────────────────────
type HealthState = 'loading' | 'error' | RaphaStatus;

function HealthCard() {
  const [state, setState] = useState<HealthState>('loading');

  useEffect(() => {
    let active = true;
    fetchRaphaStatus()
      .then((s) => {
        if (active) setState(s);
      })
      .catch(() => {
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, []);

  let pill: React.ReactNode;
  let detail: string;
  if (state === 'loading') {
    pill = <StatusPill $state="loading">Checking…</StatusPill>;
    detail = 'Checking RAPHA service status…';
  } else if (state === 'error') {
    pill = <StatusPill $state="error">Unknown</StatusPill>;
    detail = 'Unable to determine RAPHA status right now.';
  } else if (state.healthy) {
    pill = <StatusPill $state="operational">Operational</StatusPill>;
    detail = `Checked ${new Date(state.checkedAt).toLocaleString()}`;
  } else {
    pill = <StatusPill $state="down">Unavailable</StatusPill>;
    detail = `Checked ${new Date(state.checkedAt).toLocaleString()}`;
  }

  return (
    <ConsoleCard>
      <CardHeading>RAPHA service</CardHeading>
      <DefRow>
        <DefKey>Status</DefKey>
        <DefVal>{pill}</DefVal>
      </DefRow>
      <DefRow>
        <DefKey>Detail</DefKey>
        <DefVal>{detail}</DefVal>
      </DefRow>
    </ConsoleCard>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
function Overview({
  account,
  onNavigate,
}: {
  account: AccountResponse;
  onNavigate: (to: Route) => void;
}) {
  const org = account.organization;
  const entitlement = account.entitlement;

  if (!org) {
    return (
      <CenterState>
        <p>No organization is associated with your account yet.</p>
      </CenterState>
    );
  }

  const sensorAllowance =
    entitlement == null
      ? '—'
      : entitlement.sensorLimit === null
        ? 'Unlimited'
        : String(entitlement.sensorLimit);

  const provisioned = org.status === 'active' && Boolean(org.rapha_tenant_id);
  const tenantStateLabel = provisioned
    ? 'Provisioned'
    : org.status === 'failed'
      ? 'Provisioning failed — retry from your account'
      : 'Provisioning in progress';

  return (
    <>
      <CardGrid>
        <ConsoleCard>
          <CardHeading>Organization</CardHeading>
          <DefRow>
            <DefKey>Name</DefKey>
            <DefVal>{org.name}</DefVal>
          </DefRow>
          <DefRow>
            <DefKey>Status</DefKey>
            <DefVal>
              <StatusPill $state={org.status === 'active' ? 'operational' : org.status === 'failed' ? 'error' : 'loading'}>
                {ORG_STATUS_LABEL[org.status]}
              </StatusPill>
            </DefVal>
          </DefRow>
          <DefRow>
            <DefKey>Role</DefKey>
            <DefVal>{account.role ?? '—'}</DefVal>
          </DefRow>
        </ConsoleCard>

        <ConsoleCard>
          <CardHeading>Plan &amp; entitlement</CardHeading>
          <DefRow>
            <DefKey>Plan</DefKey>
            <DefVal>{entitlement ? entitlement.planName : '—'}</DefVal>
          </DefRow>
          <DefRow>
            <DefKey>Sensor allowance</DefKey>
            <DefVal>{sensorAllowance}</DefVal>
          </DefRow>
          <DefRow>
            <DefKey>Decoys</DefKey>
            <DefVal>{entitlement ? (entitlement.decoysEnabled ? 'Included' : 'Not included') : '—'}</DefVal>
          </DefRow>
        </ConsoleCard>

        <HealthCard />

        <ConsoleCard>
          <CardHeading>RAPHA deployment</CardHeading>
          <DefRow>
            <DefKey>Tenant</DefKey>
            <DefVal>
              <StatusPill $state={provisioned ? 'operational' : org.status === 'failed' ? 'error' : 'loading'}>
                {tenantStateLabel}
              </StatusPill>
            </DefVal>
          </DefRow>
          <DefRow>
            <DefKey>Sensors</DefKey>
            <DefVal>Deploy on a Windows host to start streaming telemetry.</DefVal>
          </DefRow>
        </ConsoleCard>
      </CardGrid>

      <ConsoleCard style={{ marginTop: 24 }}>
        <CardHeading>Quick actions</CardHeading>
        <ActionsRow>
          <Button variant="primary" onClick={() => onNavigate('deploy')} aria-label="Deploy a RAPHA sensor">
            Deploy a sensor
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('docs')} aria-label="View RAPHA documentation">
            View documentation
          </Button>
        </ActionsRow>
      </ConsoleCard>
    </>
  );
}

// ── Shared helpers + state renderer for the data sections ────────────────────
function fmtTime(v?: number | string | null): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isNaN(n) && n > 0) {
    const ms = n < 1e12 ? n * 1000 : n; // RAPHA uses float unix seconds
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  }
  return String(v);
}

function shortHash(h?: string): string {
  if (!h) return '—';
  return h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}

const POLL = { telemetry: 20_000, alerts: 20_000, sensors: 30_000, forensics: 30_000 };

function SectionStates({
  state,
  error,
  empty,
  emptyText,
  children,
}: {
  state: PollState;
  error: string | null;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  if (state === 'loading') {
    return (
      <CenterState>
        <LoadingSpinner />
        <p>Loading…</p>
      </CenterState>
    );
  }
  if (state === 'error') {
    // Connection/availability problem — explicitly NOT an empty result.
    return (
      <DeferredPanel role="alert">
        <DeferredText>
          {error ?? 'Unable to load data right now.'} This is a connection problem with RAPHA, not
          an empty result — please try again shortly.
        </DeferredText>
      </DeferredPanel>
    );
  }
  if (empty) {
    return (
      <DeferredPanel role="note">
        <DeferredText>{emptyText}</DeferredText>
      </DeferredPanel>
    );
  }
  return <>{children}</>;
}

// ── Sensors ──────────────────────────────────────────────────────────────────
function SensorsSection() {
  const { data, state, error } = usePolling<{ sensors: SensorRow[] }>(
    (signal) => fetchConsoleSensors(signal),
    POLL.sensors,
  );
  const rows = data?.sensors ?? [];
  return (
    <SectionStates
      state={state}
      error={error}
      empty={rows.length === 0}
      emptyText="No sensors are enrolled yet. Deploy a sensor to your host to see it here."
    >
      <CardGrid>
        {rows.map((s, i) => (
          <ConsoleCard key={s.sensor_id || i}>
            <CardHeading>{s.hostname || s.sensor_id}</CardHeading>
            <DefRow>
              <DefKey>Sensor ID</DefKey>
              <DefVal>{s.sensor_id}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Status</DefKey>
              <DefVal>
                <StatusPill $state={s.status === 'active' ? 'operational' : 'neutral'}>
                  {s.status || 'unknown'}
                </StatusPill>
              </DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Last seen</DefKey>
              <DefVal>{fmtTime(s.last_seen)}</DefVal>
            </DefRow>
          </ConsoleCard>
        ))}
      </CardGrid>
    </SectionStates>
  );
}

// ── Telemetry (live via SSE, bounded-polling fallback) ───────────────────────
function TelemetrySection({ live }: { live: ConsoleLiveData }) {
  const rows = live.telemetry;
  const state: PollState = live.loading ? 'loading' : live.error && rows.length === 0 ? 'error' : 'ok';
  return (
    <SectionStates
      state={state}
      error={live.error}
      empty={rows.length === 0}
      emptyText="No telemetry has been received yet. Once a sensor ingests events, its latest snapshot appears here."
    >
      <CardGrid>
        {rows.map((t, i) => (
          <ConsoleCard key={t.sensor_id || i}>
            <CardHeading>{t.sensor_id}</CardHeading>
            <DefRow>
              <DefKey>Threat state</DefKey>
              <DefVal>
                <StatusPill $state={t.last_is_threat ? 'down' : 'operational'}>
                  {t.last_is_threat ? 'Threat' : 'Clear'}
                </StatusPill>
              </DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Category</DefKey>
              <DefVal>{t.last_category ?? '—'}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Score</DefKey>
              <DefVal>{typeof t.last_score === 'number' ? t.last_score.toFixed(2) : '—'}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Confidence</DefKey>
              <DefVal>{t.last_confidence ?? '—'}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Model</DefKey>
              <DefVal>{t.model_version ?? '—'}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Updated</DefKey>
              <DefVal>{fmtTime(t.updated_at)}</DefVal>
            </DefRow>
          </ConsoleCard>
        ))}
      </CardGrid>
    </SectionStates>
  );
}

// ── Alerts (live via SSE, bounded-polling fallback) ──────────────────────────
function AlertsSection({ live }: { live: ConsoleLiveData }) {
  const rows = live.alerts;
  const state: PollState = live.loading ? 'loading' : live.error && rows.length === 0 ? 'error' : 'ok';
  return (
    <SectionStates
      state={state}
      error={live.error}
      empty={rows.length === 0}
      emptyText="No alerts have been raised for your organization yet."
    >
      <CardGrid>
        {rows.map((a, i) => (
          <ConsoleCard key={a.alert_id ?? a.id ?? i}>
            <CardHeading>{a.category ?? 'alert'}</CardHeading>
            <DefRow>
              <DefKey>When</DefKey>
              <DefVal>{fmtTime(a.ts)}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Score</DefKey>
              <DefVal>{typeof a.score === 'number' ? a.score.toFixed(2) : '—'}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Confidence</DefKey>
              <DefVal>{a.confidence ?? '—'}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Action</DefKey>
              <DefVal>{a.action ?? '—'}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Model</DefKey>
              <DefVal>{a.model_version ?? '—'}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Delivered</DefKey>
              <DefVal>{a.delivered ? 'Yes' : 'No'}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Event ref</DefKey>
              <DefVal>{shortHash(a.event_ref)}</DefVal>
            </DefRow>
          </ConsoleCard>
        ))}
      </CardGrid>
    </SectionStates>
  );
}

// ── Forensics ────────────────────────────────────────────────────────────────
function ForensicsSection() {
  const { data, state, error } = usePolling<{ forensics: ForensicRow[] }>(
    (signal) => fetchConsoleForensics({ limit: 50, offset: 0 }, signal),
    POLL.forensics,
  );
  const rows = data?.forensics ?? [];
  return (
    <SectionStates
      state={state}
      error={error}
      empty={rows.length === 0}
      emptyText="No forensic records are available for your organization yet."
    >
      <CardGrid>
        {rows.map((f, i) => (
          <ConsoleCard key={f.hash || f.idx || i}>
            <CardHeading>Record #{f.idx ?? i}</CardHeading>
            <DefRow>
              <DefKey>When</DefKey>
              <DefVal>{fmtTime(f.timestamp)}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Orchestrator</DefKey>
              <DefVal>{f.orchestrator_id ?? '—'}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Policy</DefKey>
              <DefVal>{f.policy_version ?? '—'}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Model</DefKey>
              <DefVal>{f.model_version ?? '—'}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Hash</DefKey>
              <DefVal>{shortHash(f.hash)}</DefVal>
            </DefRow>
            <DefRow>
              <DefKey>Prev hash</DefKey>
              <DefVal>{shortHash(f.previous_hash)}</DefVal>
            </DefRow>
          </ConsoleCard>
        ))}
      </CardGrid>
    </SectionStates>
  );
}

function DataSection({ id, live }: { id: Exclude<ConsoleSectionId, 'overview'>; live: ConsoleLiveData }) {
  switch (id) {
    case 'sensors':
      return <SensorsSection />;
    case 'telemetry':
      return <TelemetrySection live={live} />;
    case 'alerts':
      return <AlertsSection live={live} />;
    case 'forensics':
      return <ForensicsSection />;
    default:
      return null;
  }
}

// ── Console shell ────────────────────────────────────────────────────────────
export function ConsolePage({ onNavigate }: Props) {
  const { account, loading } = useAuth();
  const [section, setSection] = useState<ConsoleSectionId>(() =>
    sectionFromHash(window.location.hash),
  );
  const [menuOpen, setMenuOpen] = useState(false);

  // Live data (SSE + polling fallback) is active only on the telemetry/alerts
  // sections and only once authenticated. Called unconditionally (hook rules);
  // no-ops when disabled.
  const liveEnabled = (section === 'telemetry' || section === 'alerts') && Boolean(account);
  const live = useConsoleLiveData({ enabled: liveEnabled });

  // Protected route: redirect unauthenticated users to login once auth resolves.
  useEffect(() => {
    if (!loading && !account) onNavigate('login');
  }, [loading, account, onNavigate]);

  useEffect(() => {
    const onHashChange = () => {
      setSection(sectionFromHash(window.location.hash));
      setMenuOpen(false);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Do not flash protected content before auth resolves.
  if (loading) {
    return (
      <ConsoleLayout>
        <div />
        <CenterState>
          <LoadingSpinner />
          <p>Loading your console…</p>
        </CenterState>
      </ConsoleLayout>
    );
  }
  if (!account) return null;

  const goToSection = (id: ConsoleSectionId) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = consoleHash(id);
  };

  const activeLabel = CONSOLE_NAV.find((s) => s.id === section)?.label ?? 'Overview';

  return (
    <ConsoleLayout>
      <div>
        <MobileToggle
          type="button"
          aria-expanded={menuOpen}
          aria-controls="console-sidebar"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? 'Hide' : 'Menu'} — {activeLabel}
        </MobileToggle>
        <Sidebar id="console-sidebar" $open={menuOpen} aria-label="Console">
          <SidebarInner>
            <SidebarTitle>RAPHA Console</SidebarTitle>
            <NavList>
              {CONSOLE_NAV.map((item) => (
                <li key={item.id}>
                  <NavLink
                    href={consoleHash(item.id)}
                    $active={item.id === section}
                    aria-current={item.id === section ? 'page' : undefined}
                    onClick={goToSection(item.id)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </NavList>
          </SidebarInner>
        </Sidebar>
      </div>

      <ConsoleContent>
        <ConsoleHeader>
          <ConsoleTitle>{activeLabel}</ConsoleTitle>
          <ConsoleSubtitle>
            {account.organization ? account.organization.name : 'Your organization'}
            {(section === 'telemetry' || section === 'alerts') && (
              <>
                {'  ·  '}
                <StatusPill
                  $state={
                    live.status === 'live'
                      ? 'operational'
                      : live.status === 'connecting' || live.status === 'reconnecting'
                        ? 'loading'
                        : 'neutral'
                  }
                >
                  {STREAM_STATUS_LABEL[live.status]}
                </StatusPill>
              </>
            )}
          </ConsoleSubtitle>
        </ConsoleHeader>

        {section === 'overview' ? (
          <Overview account={account} onNavigate={onNavigate} />
        ) : section === 'api-keys' ? (
          <ApiKeysSection />
        ) : (
          <DataSection id={section} live={live} />
        )}
      </ConsoleContent>
    </ConsoleLayout>
  );
}
