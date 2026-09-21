import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStore } from './memory.js';
import type { AccessRequest, AccessRequestStatus } from './types.js';

const WIN_FROM = '2026-09-01T00:00:00.000Z';
const WIN_TO = '2026-09-30T00:00:00.000Z';
const dayAt = (d: number, h = 12) => `2026-09-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:00:00.000Z`;

// PII values seeded into every row so tests can prove they NEVER surface in output.
const PII = {
  full_name: 'Ada Lovelace',
  work_email: 'ada.secret@acme-corp.example',
  organization: 'Acme Confidential Corp',
  security_challenge: 'SECRET lateral movement detail',
  evaluation_reason: 'SECRET evaluation reason',
  additional_context: 'SECRET context',
};

function mkRow(o: Partial<AccessRequest> & { created_at: string }): AccessRequest {
  return {
    id: Math.random().toString(36).slice(2),
    full_name: PII.full_name,
    work_email: PII.work_email,
    organization: PII.organization,
    job_title: 'Head of Security',
    industry: 'Technology / SaaS',
    organization_size: '201–1,000',
    country: 'India',
    security_challenge: PII.security_challenge,
    current_stack: 'EDR + SIEM',
    deployment_environment: 'Hybrid',
    evaluation_reason: PII.evaluation_reason,
    additional_context: PII.additional_context,
    utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null,
    referrer_domain: null, landing_path: null, first_touch_at: null, last_touch_at: null,
    status: 'submitted' as AccessRequestStatus,
    updated_at: o.created_at,
    ...o,
  };
}

let store: InMemoryStore;
function seed(rows: AccessRequest[]) {
  (store as unknown as { accessRequests: AccessRequest[] }).accessRequests = rows;
}
const rep = (topN?: number) => store.getAcquisitionReport({ from: WIN_FROM, to: WIN_TO, topN });

beforeEach(() => { store = new InMemoryStore(); });

describe('getAcquisitionReport — aggregation + suppression', () => {
  it('bySource groups by utm_source and suppresses groups with count < 5', async () => {
    seed([
      ...Array.from({ length: 6 }, () => mkRow({ created_at: dayAt(2), utm_source: 'reddit' })),
      ...Array.from({ length: 3 }, () => mkRow({ created_at: dayAt(2), utm_source: 'linkedin' })), // suppressed (<5)
    ]);
    const r = await rep();
    expect(r.bySource).toEqual([{ key: 'reddit', count: 6 }]);
    expect(r.bySource.find((g) => g.key === 'linkedin')).toBeUndefined();
  });

  it('NULL utm_source maps to the direct/unknown bucket', async () => {
    seed(Array.from({ length: 5 }, () => mkRow({ created_at: dayAt(3), utm_source: null })));
    const r = await rep();
    expect(r.bySource).toEqual([{ key: 'direct/unknown', count: 5 }]);
  });

  it('referral rows surface the coarse domain as source (no full URL anywhere)', async () => {
    seed(Array.from({ length: 5 }, () =>
      mkRow({ created_at: dayAt(4), utm_source: 'news.ycombinator.com', utm_medium: 'referral', referrer_domain: 'news.ycombinator.com' })));
    const r = await rep();
    expect(r.bySource).toEqual([{ key: 'news.ycombinator.com', count: 5 }]);
    expect(JSON.stringify(r)).not.toContain('http'); // never a full referrer URL
  });

  it('bySourceMediumCampaign preserves NULL medium/campaign and suppresses < 5', async () => {
    seed([
      ...Array.from({ length: 5 }, () => mkRow({ created_at: dayAt(5), utm_source: 'reddit', utm_medium: 'community', utm_campaign: 'deception' })),
      ...Array.from({ length: 5 }, () => mkRow({ created_at: dayAt(5), utm_source: null, utm_medium: null, utm_campaign: null })),
      ...Array.from({ length: 2 }, () => mkRow({ created_at: dayAt(5), utm_source: 'reddit', utm_medium: 'ads', utm_campaign: null })), // suppressed
    ]);
    const r = await rep();
    expect(r.bySourceMediumCampaign).toContainEqual({ utm_source: 'reddit', utm_medium: 'community', utm_campaign: 'deception', count: 5 });
    expect(r.bySourceMediumCampaign).toContainEqual({ utm_source: 'direct/unknown', utm_medium: null, utm_campaign: null, count: 5 });
    expect(r.bySourceMediumCampaign.find((g) => g.utm_medium === 'ads')).toBeUndefined();
  });

  it('byLandingPath groups by path (NULL → unknown) and suppresses < 5', async () => {
    seed([
      ...Array.from({ length: 5 }, () => mkRow({ created_at: dayAt(6), landing_path: '/rapha' })),
      ...Array.from({ length: 4 }, () => mkRow({ created_at: dayAt(6), landing_path: '/security' })), // suppressed
    ]);
    const r = await rep();
    expect(r.byLandingPath).toEqual([{ key: '/rapha', count: 5 }]);
  });

  it('byStatus uses the fixed status domain and suppresses < 5', async () => {
    seed([
      ...Array.from({ length: 7 }, () => mkRow({ created_at: dayAt(7), status: 'submitted' })),
      ...Array.from({ length: 5 }, () => mkRow({ created_at: dayAt(7), status: 'under_review' })),
      ...Array.from({ length: 2 }, () => mkRow({ created_at: dayAt(7), status: 'approved' })), // suppressed
    ]);
    const r = await rep();
    expect(r.byStatus).toEqual([{ key: 'submitted', count: 7 }, { key: 'under_review', count: 5 }]);
  });

  it('byDay buckets by UTC calendar day and suppresses < 5', async () => {
    seed([
      ...Array.from({ length: 5 }, () => mkRow({ created_at: dayAt(10, 1) })),
      ...Array.from({ length: 6 }, () => mkRow({ created_at: dayAt(11, 23) })),
      ...Array.from({ length: 3 }, () => mkRow({ created_at: dayAt(12, 5) })), // suppressed
    ]);
    const r = await rep();
    expect(r.byDay).toEqual([{ day: '2026-09-10', count: 5 }, { day: '2026-09-11', count: 6 }]);
  });

  it('respects topN on open-ended dimensions', async () => {
    const rows: AccessRequest[] = [];
    for (const s of ['a', 'b', 'c']) rows.push(...Array.from({ length: 5 }, () => mkRow({ created_at: dayAt(8), utm_source: s })));
    // give 'a' the highest count so ordering is deterministic
    rows.push(...Array.from({ length: 2 }, () => mkRow({ created_at: dayAt(8), utm_source: 'a' })));
    seed(rows);
    const r = await rep(1);
    expect(r.bySource).toEqual([{ key: 'a', count: 7 }]);
    expect(r.policy.topN).toBe(1);
  });

  it('enforces the date window (rows outside are excluded everywhere)', async () => {
    seed([
      ...Array.from({ length: 5 }, () => mkRow({ created_at: dayAt(15), utm_source: 'reddit' })),
      ...Array.from({ length: 9 }, () => mkRow({ created_at: '2026-08-15T12:00:00.000Z', utm_source: 'reddit' })), // before window
      ...Array.from({ length: 9 }, () => mkRow({ created_at: '2026-10-15T12:00:00.000Z', utm_source: 'reddit' })), // after window
    ]);
    const r = await rep();
    expect(r.totalInWindow).toBe(5);
    expect(r.bySource).toEqual([{ key: 'reddit', count: 5 }]);
  });
});

describe('getAcquisitionReport — touch patterns', () => {
  it('classifies single/multi/unknown and gates averages by k, exposing no timestamps', async () => {
    const rows: AccessRequest[] = [];
    // 5 single-touch (first == last), consideration = 0
    for (let i = 0; i < 5; i++) rows.push(mkRow({ created_at: dayAt(20), first_touch_at: dayAt(19), last_touch_at: dayAt(19) }));
    // 5 multi-touch: last = first + 1 day (86400s); created = first + 2 days
    for (let i = 0; i < 5; i++) rows.push(mkRow({ created_at: dayAt(22), first_touch_at: dayAt(20), last_touch_at: dayAt(21) }));
    // 3 unknown (null first) + 1 malformed timestamp → unknown
    for (let i = 0; i < 3; i++) rows.push(mkRow({ created_at: dayAt(20), first_touch_at: null, last_touch_at: dayAt(19) }));
    rows.push(mkRow({ created_at: dayAt(20), first_touch_at: 'not-a-date', last_touch_at: dayAt(19) }));
    seed(rows);
    const r = await rep();
    expect(r.touchPatterns.single_touch).toBe(5);
    expect(r.touchPatterns.multi_touch).toBe(5);
    expect(r.touchPatterns.unknown_touch).toBe(4);
    // consideration samples = 10 (>=5) → averaged: (5*0 + 5*86400)/10 = 43200
    expect(r.touchPatterns.avg_consideration_seconds).toBe(43200);
    // time-to-submit only computed where first present & created>=first (the 10 with first set)
    expect(typeof r.touchPatterns.avg_time_to_submit_seconds).toBe('number');
    // output must contain no raw timestamp of an individual row beyond aggregates
    const s = JSON.stringify(r.touchPatterns);
    expect(s).not.toContain(dayAt(19));
  });

  it('nulls averages when fewer than k valid samples', async () => {
    seed(Array.from({ length: 3 }, () => mkRow({ created_at: dayAt(20), first_touch_at: dayAt(19), last_touch_at: dayAt(19) })));
    const r = await rep();
    // only 3 valid samples (< k=5) → averages suppressed to null; counts still reported
    expect(r.touchPatterns.avg_consideration_seconds).toBeNull();
    expect(r.touchPatterns.avg_time_to_submit_seconds).toBeNull();
    expect(r.touchPatterns.single_touch).toBe(3);
  });
});

describe('getAcquisitionReport — privacy invariants', () => {
  it('the whole result contains ONLY counts/coarse labels — no PII value appears anywhere', async () => {
    seed(Array.from({ length: 6 }, () => mkRow({ created_at: dayAt(2), utm_source: 'reddit', utm_medium: 'community', landing_path: '/rapha', first_touch_at: dayAt(1), last_touch_at: dayAt(1) })));
    const r = await rep();
    const serialized = JSON.stringify(r);
    for (const v of Object.values(PII)) expect(serialized).not.toContain(v);
    expect(serialized).not.toContain('acme-corp'); // email domain fragment
    expect(serialized).not.toContain('Ada');
    // No PII keys present on any object in the result.
    const forbidden = ['full_name', 'work_email', 'organization', 'job_title', 'industry',
      'organization_size', 'country', 'security_challenge', 'current_stack',
      'deployment_environment', 'evaluation_reason', 'additional_context', 'id'];
    for (const k of forbidden) expect(serialized).not.toContain(`"${k}"`);
  });

  it('never returns raw AccessRequest rows (only aggregate shapes)', async () => {
    seed(Array.from({ length: 5 }, () => mkRow({ created_at: dayAt(2), utm_source: 'reddit' })));
    const r = await rep();
    // result keys are exactly the aggregate schema
    expect(Object.keys(r).sort()).toEqual(
      ['byDay', 'byLandingPath', 'bySource', 'bySourceMediumCampaign', 'byStatus', 'policy', 'totalInWindow', 'touchPatterns', 'window'].sort(),
    );
    expect(Array.isArray((r as unknown as { requests?: unknown }).requests)).toBe(false);
  });
});
