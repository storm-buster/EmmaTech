import { describe, it, expect, vi, afterEach } from 'vitest';
import { submitAccessRequest, type AccessRequestForm, type AccessRequestAttribution } from './accessClient';

const form: AccessRequestForm = {
  full_name: 'Ada Lovelace',
  work_email: 'ada@acme.com',
  organization: 'Acme',
  industry: 'Fintech',
  security_challenge: 'Lateral movement.',
  evaluation_reason: 'Evaluating deception.',
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function stub201() {
  const calls: { body: string }[] = [];
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    calls.push({ body: String(init.body) });
    return { status: 201, json: async () => ({ id: 'ar_1', status: 'submitted' }) } as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

describe('submitAccessRequest — attribution wiring', () => {
  it('sends attribution as distinct top-level fields alongside the form', async () => {
    const calls = stub201();
    const attribution: AccessRequestAttribution = {
      utm_source: 'reddit',
      utm_medium: 'community',
      utm_campaign: 'cyber_deception',
      utm_content: 'c_abc',
      referrer_domain: 'old.reddit.com',
      landing_path: '/rapha',
      first_touch_at: '2026-09-20T10:00:00.000Z',
      last_touch_at: '2026-09-20T11:00:00.000Z',
    };
    const res = await submitAccessRequest(form, attribution);
    expect(res.state).toBe('ok');
    const body = JSON.parse(calls[0].body);
    // Attribution present at top level, alongside PII (not nested inside a PII field).
    expect(body.utm_source).toBe('reddit');
    expect(body.landing_path).toBe('/rapha');
    expect(body.security_challenge).toBe('Lateral movement.');
    // The PII free-text fields do NOT contain attribution values.
    expect(body.additional_context ?? '').not.toContain('reddit');
  });

  it('works with no attribution (backwards compatible)', async () => {
    const calls = stub201();
    const res = await submitAccessRequest(form);
    expect(res.state).toBe('ok');
    const body = JSON.parse(calls[0].body);
    expect(body.utm_source).toBeUndefined();
    expect(body.full_name).toBe('Ada Lovelace');
  });
});
