import { describe, it, expect } from 'vitest';
import { sanitizeAttribution, validateAccessRequestInput } from './access-request.js';

describe('sanitizeAttribution — untrusted acquisition input', () => {
  it('accepts valid coarse fields', () => {
    const a = sanitizeAttribution({
      utm_source: 'reddit',
      utm_medium: 'community',
      utm_campaign: 'cyber_deception',
      utm_content: 'c_abc123',
      referrer_domain: 'old.reddit.com',
      landing_path: '/rapha',
      first_touch_at: '2026-09-20T10:00:00.000Z',
      last_touch_at: '2026-09-20T11:00:00.000Z',
    });
    expect(a.utm_source).toBe('reddit');
    expect(a.referrer_domain).toBe('old.reddit.com');
    expect(a.first_touch_at).toBe('2026-09-20T10:00:00.000Z');
  });

  it('strips markup and bounds oversized values', () => {
    const a = sanitizeAttribution({ utm_source: '<img src=x onerror=alert(1)>', utm_campaign: 'z'.repeat(5000) });
    expect(a.utm_source).not.toMatch(/[<>"'`]/);
    expect((a.utm_campaign ?? '').length).toBeLessThanOrEqual(100);
  });

  it('rejects invalid domain and invalid timestamps → null', () => {
    const a = sanitizeAttribution({ referrer_domain: 'not a domain!!', first_touch_at: 'nope', last_touch_at: 12345 });
    expect(a.referrer_domain).toBeNull();
    expect(a.first_touch_at).toBeNull();
    expect(a.last_touch_at).toBeNull();
  });

  it('ignores unknown/extra keys (no arbitrary field injection)', () => {
    const a = sanitizeAttribution({ password: 'x', et_session: 'y', foo: 'bar' } as Record<string, unknown>);
    expect(Object.keys(a).sort()).toEqual([
      'first_touch_at', 'landing_path', 'last_touch_at', 'referrer_domain',
      'utm_campaign', 'utm_content', 'utm_medium', 'utm_source',
    ]);
    expect(JSON.stringify(a)).not.toContain('password');
  });

  it('defaults all fields to null when absent', () => {
    const a = sanitizeAttribution({});
    expect(Object.values(a).every((v) => v === null)).toBe(true);
  });
});

describe('validateAccessRequestInput — attribution is optional and does not block', () => {
  const base = {
    full_name: 'Ada Lovelace',
    work_email: 'ada@acme.com',
    organization: 'Acme',
    industry: 'Fintech',
    security_challenge: 'Lateral movement detection.',
    evaluation_reason: 'Evaluating deception for our SOC.',
  };

  it('accepts a valid submission with attribution merged into value (not into PII)', () => {
    const r = validateAccessRequestInput({ ...base, utm_source: 'reddit', utm_medium: 'community', landing_path: '/rapha' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.utm_source).toBe('reddit');
      expect(r.value.landing_path).toBe('/rapha');
      // PII fields remain clean and separate.
      expect(r.value.security_challenge).toBe('Lateral movement detection.');
    }
  });

  it('accepts a valid submission with NO attribution (all null)', () => {
    const r = validateAccessRequestInput(base);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.utm_source).toBeNull();
  });

  it('malformed attribution does not block an otherwise-valid submission', () => {
    const r = validateAccessRequestInput({ ...base, utm_source: 999, first_touch_at: 'garbage', referrer_domain: 'not a domain !!' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.utm_source).toBeNull();
      expect(r.value.first_touch_at).toBeNull();
      expect(r.value.referrer_domain).toBeNull();
    }
  });
});
