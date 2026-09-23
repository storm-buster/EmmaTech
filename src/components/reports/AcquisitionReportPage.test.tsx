import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { AcquisitionReportPage } from './AcquisitionReportPage';
import { theme } from '../../styles/theme';

const REPORT = {
  window: { from: '2026-08-25T00:00:00.000Z', to: '2026-09-24T00:00:00.000Z', days: 30 },
  policy: { minGroupSize: 5, topN: 10 },
  bySource: [{ key: 'reddit', count: 12 }, { key: 'direct/unknown', count: 7 }],
  bySourceMediumCampaign: [
    { utm_source: 'reddit', utm_medium: 'community', utm_campaign: 'deception', count: 6 },
    { utm_source: 'direct/unknown', utm_medium: null, utm_campaign: null, count: 5 },
  ],
  byLandingPath: [{ key: '/rapha', count: 9 }],
  byStatus: [{ key: 'submitted', count: 10 }, { key: 'approved', count: 5 }],
  byDay: [{ day: '2026-09-10', count: 6 }, { day: '2026-09-11', count: 8 }],
  touchPatterns: { single_touch: 8, multi_touch: 5, unknown_touch: 2, avg_consideration_seconds: 43200, avg_time_to_submit_seconds: 90000 },
};

function jsonRes(status: number, body: unknown) {
  return { status, json: async () => body } as Response;
}
function stubFetch(responder: (url: string) => Response | Promise<Response>) {
  const fn = vi.fn(async (url: string) => responder(url));
  vi.stubGlobal('fetch', fn);
  return fn;
}
function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <AcquisitionReportPage />
    </ThemeProvider>,
  );
}
const utcDay = (offset: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('AcquisitionReportPage — successful rendering', () => {
  it('renders the full response (source, SMC, landing, status, daily, touch)', async () => {
    stubFetch(() => jsonRes(200, REPORT));
    renderPage();
    expect(await screen.findByText('Acquisition by source')).toBeInTheDocument();
    expect(screen.getAllByText('reddit').length).toBeGreaterThanOrEqual(1); // source + SMC
    expect(screen.getByText('community')).toBeInTheDocument();              // SMC medium
    expect(screen.getByText('deception')).toBeInTheDocument();              // SMC campaign
    expect(screen.getByText('/rapha')).toBeInTheDocument();                 // landing path
    expect(screen.getByText('submitted')).toBeInTheDocument();              // status
    expect(screen.getByText('approved')).toBeInTheDocument();
    expect(screen.getByText('2026-09-10')).toBeInTheDocument();             // daily
    expect(screen.getByText('Single-touch')).toBeInTheDocument();           // touch
    expect(screen.getByText('12')).toBeInTheDocument();                     // a source count
  });

  it('handles direct/unknown and renders null medium/campaign as em dash', async () => {
    stubFetch(() => jsonRes(200, REPORT));
    renderPage();
    await screen.findByText('Acquisition by source');
    expect(screen.getAllByText('direct/unknown').length).toBeGreaterThanOrEqual(1);
    // The direct/unknown SMC row shows — for null medium and campaign.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('labels touch patterns as timing-only (no first-vs-last source claim)', async () => {
    stubFetch(() => jsonRes(200, REPORT));
    renderPage();
    expect(await screen.findByText(/Based on touch timing only — not first-vs-last source\./)).toBeInTheDocument();
    // durations formatted
    expect(screen.getByText('12.0h')).toBeInTheDocument(); // 43200s consideration
  });
});

describe('AcquisitionReportPage — fetch behavior', () => {
  it('makes exactly one request on initial load, spanning the default 30 days', async () => {
    const fn = stubFetch(() => jsonRes(200, REPORT));
    renderPage();
    await screen.findByText('Acquisition by source');
    expect(fn).toHaveBeenCalledTimes(1);
    const url = new URL(fn.mock.calls[0][0] as string, 'http://x');
    const from = url.searchParams.get('from')!;
    const to = url.searchParams.get('to')!;
    expect((Date.parse(to) - Date.parse(from)) / 86_400_000).toBe(30);
    // one-shot fetch options
    const opts = fn.mock.calls[0][1] as RequestInit;
    expect(opts.cache).toBe('no-store');
    expect(opts.credentials).toBe('same-origin');
  });

  it('preset change triggers exactly one new request with the right span', async () => {
    const fn = stubFetch(() => jsonRes(200, REPORT));
    renderPage();
    await screen.findByText('Acquisition by source');
    fireEvent.click(screen.getByText('7 days'));
    await waitFor(() => expect(fn).toHaveBeenCalledTimes(2));
    const url = new URL(fn.mock.calls[1][0] as string, 'http://x');
    expect((Date.parse(url.searchParams.get('to')!) - Date.parse(url.searchParams.get('from')!)) / 86_400_000).toBe(7);
  });

  it('Apply triggers exactly one new request (no polling)', async () => {
    const fn = stubFetch(() => jsonRes(200, REPORT));
    renderPage();
    await screen.findByText('Acquisition by source');
    expect(fn).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Apply'));
    await waitFor(() => expect(fn).toHaveBeenCalledTimes(2));
    // no polling: no further calls over time
    await new Promise((r) => setTimeout(r, 50));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('shows a loading state before the request resolves', async () => {
    stubFetch(() => new Promise<Response>(() => {})); // never resolves
    renderPage();
    expect(await screen.findByText('Loading report…')).toBeInTheDocument();
  });
});

describe('AcquisitionReportPage — validation & error states', () => {
  it('server 400 → invalid-range state', async () => {
    stubFetch(() => jsonRes(400, { error: 'bad range' }));
    renderPage();
    expect(await screen.findByText(/range must be|valid start|start date must be|Invalid date range/i)).toBeInTheDocument();
  });

  it('client blocks a >90-day range (no request made)', async () => {
    const fn = stubFetch(() => jsonRes(200, REPORT));
    renderPage();
    await screen.findByText('Acquisition by source');
    expect(fn).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: utcDay(-100) } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: utcDay(0) } });
    fireEvent.click(screen.getByText('Apply'));
    expect(await screen.findByText(/90 days or less/i)).toBeInTheDocument();
    expect(fn).toHaveBeenCalledTimes(1); // blocked, no new request
  });

  it('client blocks from >= to (no request made)', async () => {
    const fn = stubFetch(() => jsonRes(200, REPORT));
    renderPage();
    await screen.findByText('Acquisition by source');
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: utcDay(5) } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: utcDay(0) } });
    fireEvent.click(screen.getByText('Apply'));
    expect(await screen.findByText(/start date must be on or before the end/i)).toBeInTheDocument();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('404 → single generic unavailable state (never reveals not-staff)', async () => {
    stubFetch(() => jsonRes(404, { error: 'Not found' }));
    renderPage();
    expect(await screen.findByText('Acquisition reporting is not available for this account.')).toBeInTheDocument();
    expect(screen.queryByText(/staff|authoriz|permission/i)).toBeNull();
  });

  it('500 → generic retry error', async () => {
    stubFetch(() => jsonRes(500, { error: 'boom' }));
    renderPage();
    expect(await screen.findByText(/Unable to load the report right now/i)).toBeInTheDocument();
    expect(screen.queryByText(/boom/)).toBeNull();
  });

  it('network failure → generic retry error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }));
    renderPage();
    expect(await screen.findByText(/Unable to load the report right now/i)).toBeInTheDocument();
    expect(screen.queryByText(/network down/)).toBeNull();
  });

  it('empty/all-suppressed 200 → threshold empty state (not "zero submissions")', async () => {
    const empty = { ...REPORT, bySource: [], bySourceMediumCampaign: [], byLandingPath: [], byStatus: [], byDay: [], touchPatterns: { single_touch: 0, multi_touch: 0, unknown_touch: 0, avg_consideration_seconds: null, avg_time_to_submit_seconds: null } };
    stubFetch(() => jsonRes(200, empty));
    renderPage();
    expect(await screen.findByText(/No data meets the reporting threshold/i)).toBeInTheDocument();
    expect(screen.getByText(/does not necessarily mean there were zero submissions/i)).toBeInTheDocument();
  });
});

describe('AcquisitionReportPage — privacy', () => {
  it('never renders a defensive totalInWindow and synthesizes no grand total', async () => {
    // Response carries an extra totalInWindow the UI must ignore.
    const withTotal = { ...REPORT, totalInWindow: 999 };
    stubFetch(() => jsonRes(200, withTotal));
    renderPage();
    await screen.findByText('Acquisition by source');
    expect(screen.queryByText('999')).toBeNull();               // totalInWindow not rendered
    expect(screen.queryByText('totalInWindow')).toBeNull();
    expect(screen.queryByText('19')).toBeNull();                // 12+7 grand total NOT synthesized
    expect(screen.queryByText(/^Total/i)).toBeNull();
  });

  it('never renders PII even if present in the raw body', async () => {
    const withPii = { ...REPORT, work_email: 'ada.secret@acme.example', full_name: 'Ada Lovelace', organization: 'Acme Confidential' };
    stubFetch(() => jsonRes(200, withPii));
    renderPage();
    await screen.findByText('Acquisition by source');
    expect(screen.queryByText(/ada\.secret@acme\.example/)).toBeNull();
    expect(screen.queryByText(/Ada Lovelace/)).toBeNull();
    expect(screen.queryByText(/Acme Confidential/)).toBeNull();
  });
});
