import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  fetchAcquisitionReport,
  type AcquisitionReport,
} from '../../reports/acquisitionClient';
import { Button } from '../Button';
import { LoadingSpinner } from '../LoadingSpinner';
import {
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
  StatusPill,
} from '../console/consoleStyles';

const MAX_WINDOW_DAYS = 90;
const DAY_MS = 86_400_000;

// ── UTC date helpers (deterministic; no local-timezone ambiguity) ────────────
const utcDayStr = (d: Date): string => d.toISOString().slice(0, 10);
const isoStart = (dayStr: string): string => `${dayStr}T00:00:00.000Z`;
function addDays(dayStr: string, n: number): string {
  const d = new Date(isoStart(dayStr));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

interface Range { fromDay: string; toDay: string }

/** Build the half-open API bounds from inclusive day pickers: the end day is
 *  fully included (api `to` = end-day + 1 at 00:00Z). */
function buildQuery(range: Range): { ok: true; from: string; to: string } | { ok: false; reason: string } {
  const { fromDay, toDay } = range;
  if (!fromDay || !toDay || Number.isNaN(Date.parse(isoStart(fromDay))) || Number.isNaN(Date.parse(isoStart(toDay)))) {
    return { ok: false, reason: 'Enter a valid start and end date.' };
  }
  const from = isoStart(fromDay);
  const to = isoStart(addDays(toDay, 1));
  const span = Date.parse(to) - Date.parse(from);
  if (span <= 0) return { ok: false, reason: 'The start date must be on or before the end date.' };
  if (span > MAX_WINDOW_DAYS * DAY_MS) return { ok: false, reason: `The range must be ${MAX_WINDOW_DAYS} days or less.` };
  return { ok: true, from, to };
}

function defaultRange(): Range {
  const today = utcDayStr(new Date());
  return { fromDay: addDays(today, -29), toDay: today }; // last 30 inclusive days
}

function presetRange(days: number): Range {
  const today = utcDayStr(new Date());
  return { fromDay: addDays(today, -(days - 1)), toDay: today };
}

function formatDuration(sec: number | null): string {
  if (sec === null) return '—';
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  if (sec < DAY_MS / 1000) return `${(sec / 3600).toFixed(1)}h`;
  return `${(sec / 86400).toFixed(1)}d`;
}

type PillState = 'operational' | 'down' | 'loading' | 'error' | 'neutral';
function statusPill(status: string): PillState {
  switch (status) {
    case 'approved': return 'operational';
    case 'declined': return 'error';
    case 'under_review': return 'loading';
    default: return 'neutral'; // submitted, contacted
  }
}

// ── page-local presentational bits (tables + inline bars; no chart library) ──
const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;
const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  input {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid ${({ theme }) => theme.colors.neutral.border};
    border-radius: 8px;
    padding: 8px 10px;
    color: ${({ theme }) => theme.colors.neutral.white};
    font-size: 14px;
  }
`;
const Presets = styled.div`
  display: flex;
  gap: 6px;
`;
const PresetButton = styled.button`
  background: transparent;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  &:hover { color: ${({ theme }) => theme.colors.primary.main}; }
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th, td {
    text-align: left;
    padding: 6px 8px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.border};
    color: ${({ theme }) => theme.colors.neutral.lightGray};
  }
  th { color: ${({ theme }) => theme.colors.neutral.mediumGray}; font-weight: 600; }
  td.num { text-align: right; color: ${({ theme }) => theme.colors.neutral.white}; font-variant-numeric: tabular-nums; }
`;
const BarCell = styled.td`
  width: 40%;
  padding: 6px 8px;
`;
const BarTrack = styled.div`
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  height: 8px;
  overflow: hidden;
`;
const BarFill = styled.div<{ $pct: number }>`
  width: ${({ $pct }) => Math.max(2, Math.min(100, $pct))}%;
  height: 100%;
  background: ${({ theme }) => theme.colors.primary.main};
`;
const SectionNote = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
`;
const PolicyNote = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin: ${({ theme }) => theme.spacing.md} 0 0;
`;

const DASH = '—';

type Status = 'loading' | 'ok' | 'invalid' | 'unavailable' | 'error';

function BarRows({ rows }: { rows: { key: string; count: number }[] }) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  return (
    <Table>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <td>{r.key}</td>
            <BarCell><BarTrack><BarFill $pct={(r.count / max) * 100} /></BarTrack></BarCell>
            <td className="num">{r.count}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function reportIsEmpty(r: AcquisitionReport): boolean {
  const t = r.touchPatterns;
  return (
    r.bySource.length === 0 &&
    r.bySourceMediumCampaign.length === 0 &&
    r.byLandingPath.length === 0 &&
    r.byStatus.length === 0 &&
    r.byDay.length === 0 &&
    t.single_touch === 0 && t.multi_touch === 0 && t.unknown_touch === 0
  );
}

export function AcquisitionReportPage() {
  const [range, setRange] = useState<Range>(() => defaultRange());
  const [status, setStatus] = useState<Status>('loading');
  const [report, setReport] = useState<AcquisitionReport | null>(null);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);
  const acRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const load = useCallback((r: Range) => {
    const q = buildQuery(r);
    if (!q.ok) {
      // Client-side validation mirrors the API; block the request entirely.
      acRef.current?.abort();
      setReport(null);
      setInvalidReason(q.reason);
      setStatus('invalid');
      return;
    }
    setInvalidReason(null);
    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;
    const myId = ++reqIdRef.current;
    setStatus('loading');
    fetchAcquisitionReport({ from: q.from, to: q.to }, ac.signal)
      .then((res) => {
        if (myId !== reqIdRef.current) return; // superseded
        if (res.state === 'ok') { setReport(res.report); setStatus('ok'); }
        else { setReport(null); setStatus(res.state); }
      })
      .catch((err) => {
        if ((err as { name?: string })?.name === 'AbortError') return;
        if (myId !== reqIdRef.current) return;
        setReport(null);
        setStatus('error');
      });
  }, []);

  // One request on initial load with the default range.
  useEffect(() => {
    load(defaultRange());
    return () => acRef.current?.abort();
  }, [load]);

  const applyPreset = (days: number) => {
    const r = presetRange(days);
    setRange(r);
    load(r);
  };

  const header = (
    <ConsoleHeader>
      <ConsoleTitle>Acquisition</ConsoleTitle>
      <ConsoleSubtitle>Internal — aggregate acquisition reporting for Request Private Access.</ConsoleSubtitle>
    </ConsoleHeader>
  );

  const toolbar = (
    <Toolbar>
      <Field>
        Start (UTC)
        <input
          type="date"
          aria-label="Start date"
          value={range.fromDay}
          onChange={(e) => setRange((r) => ({ ...r, fromDay: e.target.value }))}
        />
      </Field>
      <Field>
        End (UTC)
        <input
          type="date"
          aria-label="End date"
          value={range.toDay}
          onChange={(e) => setRange((r) => ({ ...r, toDay: e.target.value }))}
        />
      </Field>
      <Presets role="group" aria-label="Preset ranges">
        <PresetButton type="button" onClick={() => applyPreset(7)}>7 days</PresetButton>
        <PresetButton type="button" onClick={() => applyPreset(30)}>30 days</PresetButton>
        <PresetButton type="button" onClick={() => applyPreset(90)}>90 days</PresetButton>
      </Presets>
      <Button variant="primary" onClick={() => load(range)}>Apply</Button>
    </Toolbar>
  );

  let body: React.ReactNode;
  if (status === 'loading') {
    body = (
      <CenterState>
        <LoadingSpinner />
        <p>Loading report…</p>
      </CenterState>
    );
  } else if (status === 'invalid') {
    body = (
      <DeferredPanel role="alert">
        <DeferredText>{invalidReason ?? 'Invalid date range. Ensure the start is on or before the end and the range is 90 days or less.'}</DeferredText>
      </DeferredPanel>
    );
  } else if (status === 'unavailable') {
    // Generic — never distinguishes not-staff / not-authorized / unavailable.
    body = (
      <DeferredPanel role="note">
        <DeferredText>Acquisition reporting is not available for this account.</DeferredText>
      </DeferredPanel>
    );
  } else if (status === 'error') {
    body = (
      <DeferredPanel role="alert">
        <DeferredText>Unable to load the report right now. This is a service problem, not an empty result — please try again shortly.</DeferredText>
      </DeferredPanel>
    );
  } else if (report && reportIsEmpty(report)) {
    body = (
      <DeferredPanel role="note">
        <DeferredText>
          No data meets the reporting threshold for this range. Groups smaller than the minimum
          size ({report.policy.minGroupSize}) are hidden, so this does not necessarily mean there
          were zero submissions.
        </DeferredText>
      </DeferredPanel>
    );
  } else if (report) {
    const t = report.touchPatterns;
    body = (
      <>
        <CardGrid>
          <ConsoleCard>
            <CardHeading>Acquisition by source</CardHeading>
            {report.bySource.length ? <BarRows rows={report.bySource} /> : <SectionNote>No sources meet the threshold.</SectionNote>}
          </ConsoleCard>

          <ConsoleCard>
            <CardHeading>Landing paths</CardHeading>
            {report.byLandingPath.length ? <BarRows rows={report.byLandingPath} /> : <SectionNote>No landing paths meet the threshold.</SectionNote>}
          </ConsoleCard>

          <ConsoleCard>
            <CardHeading>Source / medium / campaign</CardHeading>
            {report.bySourceMediumCampaign.length ? (
              <Table>
                <thead>
                  <tr><th>Source</th><th>Medium</th><th>Campaign</th><th className="num">Count</th></tr>
                </thead>
                <tbody>
                  {report.bySourceMediumCampaign.map((r, i) => (
                    <tr key={`${r.utm_source}|${r.utm_medium}|${r.utm_campaign}|${i}`}>
                      <td>{r.utm_source}</td>
                      <td>{r.utm_medium ?? DASH}</td>
                      <td>{r.utm_campaign ?? DASH}</td>
                      <td className="num">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : <SectionNote>No source/medium/campaign combinations meet the threshold.</SectionNote>}
          </ConsoleCard>

          <ConsoleCard>
            <CardHeading>Status</CardHeading>
            {report.byStatus.length ? (
              <div>
                {report.byStatus.map((s) => (
                  <DefRow key={s.key}>
                    <DefKey><StatusPill $state={statusPill(s.key)}>{s.key}</StatusPill></DefKey>
                    <DefVal>{s.count}</DefVal>
                  </DefRow>
                ))}
              </div>
            ) : <SectionNote>No statuses meet the threshold.</SectionNote>}
          </ConsoleCard>

          <ConsoleCard>
            <CardHeading>Daily submissions (UTC)</CardHeading>
            {report.byDay.length ? (
              <BarRows rows={report.byDay.map((d) => ({ key: d.day, count: d.count }))} />
            ) : <SectionNote>No days meet the threshold.</SectionNote>}
          </ConsoleCard>

          <ConsoleCard>
            <CardHeading>Touch patterns</CardHeading>
            <SectionNote>Based on touch timing only — not first-vs-last source.</SectionNote>
            <DefRow><DefKey>Single-touch</DefKey><DefVal>{t.single_touch}</DefVal></DefRow>
            <DefRow><DefKey>Multi-touch</DefKey><DefVal>{t.multi_touch}</DefVal></DefRow>
            <DefRow><DefKey>Unknown</DefKey><DefVal>{t.unknown_touch}</DefVal></DefRow>
            <DefRow><DefKey>Avg consideration</DefKey><DefVal>{formatDuration(t.avg_consideration_seconds)}</DefVal></DefRow>
            <DefRow><DefKey>Avg time to submit</DefKey><DefVal>{formatDuration(t.avg_time_to_submit_seconds)}</DefVal></DefRow>
          </ConsoleCard>
        </CardGrid>

        <PolicyNote>
          Window {report.window.from.slice(0, 10)} → {report.window.to.slice(0, 10)} ({report.window.days} days).
          Aggregates only; groups smaller than the minimum size ({report.policy.minGroupSize}) are hidden.
        </PolicyNote>
      </>
    );
  }

  return (
    <ConsoleLayout>
      <div />
      <ConsoleContent>
        {header}
        {toolbar}
        {body}
      </ConsoleContent>
    </ConsoleLayout>
  );
}
