import { describe, it, expect } from 'vitest';
import { validateAccessRequestInput, isValidAccessRequestStatus, ACCESS_REQUEST_LIMITS } from './access-request.js';

const valid = {
  full_name: '  Ada Lovelace  ',
  work_email: 'Ada@Acme.com',
  organization: 'Acme Corp',
  industry: 'Technology / SaaS',
  security_challenge: 'Lateral movement detection on Linux fleet.',
  evaluation_reason: 'Evaluating autonomous response for our SOC.',
  job_title: '  Head of Security  ',
  organization_size: '201–1,000',
  country: 'India',
  current_stack: 'EDR + SIEM',
  deployment_environment: 'Hybrid',
  additional_context: '',
};

describe('validateAccessRequestInput', () => {
  it('accepts a valid application and normalizes fields', () => {
    const r = validateAccessRequestInput({ ...valid });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.full_name).toBe('Ada Lovelace'); // trimmed
    expect(r.value.work_email).toBe('ada@acme.com'); // trimmed + lowercased
    expect(r.value.job_title).toBe('Head of Security'); // trimmed
    expect(r.value.additional_context).toBeNull(); // empty optional → null
    expect(r.value.country).toBe('India');
  });

  it('reports errors for every missing required field', () => {
    const r = validateAccessRequestInput({});
    expect(r.ok).toBe(false);
    if (r.ok) return;
    for (const field of ['full_name', 'work_email', 'organization', 'industry', 'security_challenge', 'evaluation_reason']) {
      expect(r.fields[field]).toBeTruthy();
    }
  });

  it('rejects a consumer (non-work) email', () => {
    const r = validateAccessRequestInput({ ...valid, work_email: 'someone@gmail.com' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fields.work_email).toMatch(/work email/i);
  });

  it('rejects a malformed email', () => {
    const r = validateAccessRequestInput({ ...valid, work_email: 'not-an-email' });
    expect(r.ok).toBe(false);
  });

  it('rejects over-length free-text fields', () => {
    const r = validateAccessRequestInput({
      ...valid,
      security_challenge: 'x'.repeat(ACCESS_REQUEST_LIMITS.security_challenge + 1),
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fields.security_challenge).toMatch(/at most/i);
  });
});

describe('isValidAccessRequestStatus', () => {
  it('accepts the five lifecycle states and rejects others', () => {
    for (const s of ['submitted', 'under_review', 'approved', 'declined', 'contacted']) {
      expect(isValidAccessRequestStatus(s)).toBe(true);
    }
    expect(isValidAccessRequestStatus('provisioned')).toBe(false);
    expect(isValidAccessRequestStatus('')).toBe(false);
    expect(isValidAccessRequestStatus(42)).toBe(false);
  });
});
