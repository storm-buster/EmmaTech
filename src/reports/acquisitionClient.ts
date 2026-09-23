/**
 * Client for the staff-gated internal acquisition report
 * (GET /api/reports/acquisition).
 *
 * SECURITY / PRIVACY:
 * - The server endpoint is the ONLY authorization boundary; this client never
 *   inspects staff config, never implements authorization, and treats 404 as a
 *   single generic "unavailable" state (no not-staff vs unavailable distinction).
 * - Same-origin credentials (session cookie) are sent automatically; nothing is
 *   persisted to localStorage/sessionStorage and no data is sent to analytics.
 * - The response is mapped by EXPLICITLY picking only the eight approved
 *   aggregate fields, so any extra field (e.g. a defensive `totalInWindow`)
 *   can never reach the UI. No grand total is ever computed.
 */

export interface AcqWindow {
  from: string;
  to: string;
  days: number;
}
export interface AcqPolicy {
  minGroupSize: number;
  topN: number;
}
export interface AcqGroupCount {
  key: string;
  count: number;
}
export interface AcqSourceMediumCampaign {
  utm_source: string;
  utm_medium: string | null;
  utm_campaign: string | null;
  count: number;
}
export interface AcqDailyCount {
  day: string;
  count: number;
}
export interface AcqTouchPatterns {
  single_touch: number;
  multi_touch: number;
  unknown_touch: number;
  avg_consideration_seconds: number | null;
  avg_time_to_submit_seconds: number | null;
}
/** Exactly the eight approved aggregate fields — NO totalInWindow. */
export interface AcquisitionReport {
  window: AcqWindow;
  policy: AcqPolicy;
  bySource: AcqGroupCount[];
  bySourceMediumCampaign: AcqSourceMediumCampaign[];
  byLandingPath: AcqGroupCount[];
  byStatus: AcqGroupCount[];
  byDay: AcqDailyCount[];
  touchPatterns: AcqTouchPatterns;
}

export interface AcquisitionQuery {
  from: string;
  to: string;
  topN?: number;
}

export type AcquisitionResult =
  | { state: 'ok'; report: AcquisitionReport }
  /** 400 — invalid/malformed range (server-authoritative). */
  | { state: 'invalid' }
  /** 404 — generic: not staff / not available / not authorized (indistinguishable). */
  | { state: 'unavailable' }
  /** 500, non-JSON, unexpected status, or network failure. */
  | { state: 'error' };

const asArray = <T>(v: unknown, map: (x: Record<string, unknown>) => T): T[] =>
  Array.isArray(v) ? v.filter((x) => x && typeof x === 'object').map((x) => map(x as Record<string, unknown>)) : [];

const numOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const strOrNull = (v: unknown): string | null => (typeof v === 'string' ? v : null);

/**
 * Map an untyped JSON body to the typed report by EXPLICITLY selecting only the
 * eight approved fields. Any additional property (e.g. `totalInWindow`) is
 * discarded here and can never surface in the UI.
 */
function pickReport(raw: Record<string, unknown>): AcquisitionReport {
  const w = (raw.window ?? {}) as Record<string, unknown>;
  const p = (raw.policy ?? {}) as Record<string, unknown>;
  const t = (raw.touchPatterns ?? {}) as Record<string, unknown>;
  return {
    window: { from: String(w.from ?? ''), to: String(w.to ?? ''), days: Number(w.days ?? 0) },
    policy: { minGroupSize: Number(p.minGroupSize ?? 0), topN: Number(p.topN ?? 0) },
    bySource: asArray(raw.bySource, (x) => ({ key: String(x.key ?? ''), count: Number(x.count ?? 0) })),
    bySourceMediumCampaign: asArray(raw.bySourceMediumCampaign, (x) => ({
      utm_source: String(x.utm_source ?? ''),
      utm_medium: strOrNull(x.utm_medium),
      utm_campaign: strOrNull(x.utm_campaign),
      count: Number(x.count ?? 0),
    })),
    byLandingPath: asArray(raw.byLandingPath, (x) => ({ key: String(x.key ?? ''), count: Number(x.count ?? 0) })),
    byStatus: asArray(raw.byStatus, (x) => ({ key: String(x.key ?? ''), count: Number(x.count ?? 0) })),
    byDay: asArray(raw.byDay, (x) => ({ day: String(x.day ?? ''), count: Number(x.count ?? 0) })),
    touchPatterns: {
      single_touch: Number(t.single_touch ?? 0),
      multi_touch: Number(t.multi_touch ?? 0),
      unknown_touch: Number(t.unknown_touch ?? 0),
      avg_consideration_seconds: numOrNull(t.avg_consideration_seconds),
      avg_time_to_submit_seconds: numOrNull(t.avg_time_to_submit_seconds),
    },
  };
}

/** One request per call. Aborts are surfaced by rejecting; callers ignore them. */
export async function fetchAcquisitionReport(
  query: AcquisitionQuery,
  signal?: AbortSignal,
): Promise<AcquisitionResult> {
  const params = new URLSearchParams({ from: query.from, to: query.to });
  if (query.topN !== undefined) params.set('topN', String(query.topN));

  let res: Response;
  try {
    res = await fetch(`/api/reports/acquisition?${params.toString()}`, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') throw err; // caller ignores
    return { state: 'error' };
  }

  if (res.status === 200) {
    try {
      const body = (await res.json()) as Record<string, unknown>;
      return { state: 'ok', report: pickReport(body) };
    } catch {
      return { state: 'error' };
    }
  }
  if (res.status === 400) return { state: 'invalid' };
  if (res.status === 404) return { state: 'unavailable' };
  return { state: 'error' };
}
