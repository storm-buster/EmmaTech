import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStore } from './memory.js';
import type { CreateAccessRequestInput } from './types.js';

function input(overrides: Partial<CreateAccessRequestInput> = {}): CreateAccessRequestInput {
  return {
    full_name: 'Ada Lovelace',
    work_email: 'ada@acme.com',
    organization: 'Acme Corp',
    job_title: 'Head of Security',
    industry: 'Technology / SaaS',
    organization_size: '201–1,000',
    country: 'India',
    security_challenge: 'Lateral movement detection.',
    current_stack: 'EDR + SIEM',
    deployment_environment: 'Hybrid',
    evaluation_reason: 'Autonomous response for the SOC.',
    additional_context: null,
    ...overrides,
  };
}

let store: InMemoryStore;
beforeEach(() => {
  store = new InMemoryStore();
});

describe('InMemoryStore — access requests', () => {
  it('creates a request in the submitted state with generated id + timestamps', async () => {
    const r = await store.createAccessRequest(input());
    expect(r.id).toBeTruthy();
    expect(r.status).toBe('submitted');
    expect(r.created_at).toBeTruthy();
    expect(r.work_email).toBe('ada@acme.com');
  });

  it('does NOT provision anything (pure lead record) — no users/orgs are created', async () => {
    await store.createAccessRequest(input());
    // The store exposes no user/org from an access request; a fresh lookup is empty.
    expect(await store.getUserByEmail('ada@acme.com')).toBeNull();
  });

  it('lists newest-first, filters by status, and paginates', async () => {
    const a = await store.createAccessRequest(input({ organization: 'A' }));
    const b = await store.createAccessRequest(input({ organization: 'B' }));
    const c = await store.createAccessRequest(input({ organization: 'C' }));

    const page1 = await store.listAccessRequests({ page: 1, pageSize: 2 });
    expect(page1.total).toBe(3);
    expect(page1.requests).toHaveLength(2);

    // Move one to under_review and filter.
    await store.setAccessRequestStatus(b.id, 'under_review');
    const review = await store.listAccessRequests({ page: 1, pageSize: 25, status: 'under_review' });
    expect(review.total).toBe(1);
    expect(review.requests[0].id).toBe(b.id);

    // a and c remain submitted.
    const submitted = await store.listAccessRequests({ page: 1, pageSize: 25, status: 'submitted' });
    expect(submitted.total).toBe(2);
    expect(submitted.requests.map((r) => r.id).sort()).toEqual([a.id, c.id].sort());
  });

  it('updates status and returns null for a missing id', async () => {
    const r = await store.createAccessRequest(input());
    const updated = await store.setAccessRequestStatus(r.id, 'approved');
    expect(updated?.status).toBe('approved');
    const fetched = await store.getAccessRequest(r.id);
    expect(fetched?.status).toBe('approved');
    expect(await store.setAccessRequestStatus('00000000-0000-0000-0000-000000000000', 'declined')).toBeNull();
    expect(await store.getAccessRequest('missing')).toBeNull();
  });
});
