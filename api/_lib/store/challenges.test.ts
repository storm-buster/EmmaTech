import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStore } from './memory.js';
import type { CreateEmailChallengeInput, ConsumeChallengeAccountInput } from './types.js';

function challengeInput(email = 'u@acme.com', overrides: Partial<CreateEmailChallengeInput> = {}): CreateEmailChallengeInput {
  return {
    email,
    code_hash: `hash-${email}`,
    expires_at: new Date(Date.now() + 600_000).toISOString(),
    payload: { name: 'N', organization_name: 'Org', password_hash: 'scrypt$x', requested_plan: null },
    ...overrides,
  };
}

function accountInput(challengeId: string, email = 'u@acme.com', overrides: Partial<ConsumeChallengeAccountInput> = {}): ConsumeChallengeAccountInput {
  return {
    challengeId,
    email,
    name: 'N',
    organizationName: 'Org',
    password_hash: 'scrypt$x',
    plan: 'free',
    plan_selected: false,
    ...overrides,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let store: InMemoryStore;
beforeEach(() => {
  store = new InMemoryStore();
});

describe('requestChallengeWithThrottle — durable per-email cooldown', () => {
  it('first request for an email is created', async () => {
    const r = await store.requestChallengeWithThrottle(challengeInput(), 60_000);
    expect(r).toMatchObject({ created: true });
  });

  it('an immediate repeat for the SAME email is throttled', async () => {
    await store.requestChallengeWithThrottle(challengeInput(), 60_000);
    const second = await store.requestChallengeWithThrottle(challengeInput(), 60_000);
    expect(second).toEqual({ throttled: true });
  });

  it('throttle is keyed by (normalized) email — a different email is independent', async () => {
    await store.requestChallengeWithThrottle(challengeInput('a@acme.com'), 60_000);
    const other = await store.requestChallengeWithThrottle(challengeInput('b@acme.com'), 60_000);
    expect(other).toMatchObject({ created: true });
  });

  it('a new request is allowed once the cooldown has elapsed', async () => {
    await store.requestChallengeWithThrottle(challengeInput(), 20);
    await sleep(35);
    const again = await store.requestChallengeWithThrottle(challengeInput(), 20);
    expect(again).toMatchObject({ created: true });
  });

  it('concurrent requests for the same email cannot both be created', async () => {
    const [a, b] = await Promise.all([
      store.requestChallengeWithThrottle(challengeInput(), 60_000),
      store.requestChallengeWithThrottle(challengeInput(), 60_000),
    ]);
    const created = [a, b].filter((r) => 'created' in r && r.created).length;
    expect(created).toBe(1);
  });
});

describe('createAccountConsumingChallenge — atomic consume + create', () => {
  it('creates the verified account and consumes the challenge on success', async () => {
    const r = await store.requestChallengeWithThrottle(challengeInput(), 60_000);
    if (!('created' in r) || !r.created) throw new Error('setup');
    const res = await store.createAccountConsumingChallenge(accountInput(r.challenge.id));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.user.email).toBe('u@acme.com');
      expect(res.user.email_verified).toBe(true);
      expect(res.organization.plan).toBe('free');
    }
    // Consumed → no longer active, and a second verification fails.
    expect(await store.getActiveEmailChallengeByEmail('u@acme.com')).toBeNull();
    const again = await store.createAccountConsumingChallenge(accountInput(r.challenge.id));
    expect(again.ok).toBe(false);
  });

  it('rolls back and leaves the challenge USABLE if account creation fails (duplicate email)', async () => {
    // Pre-existing user with the same email → the account INSERT fails.
    await store.createUser({ email: 'dup@acme.com', password_hash: 'scrypt$existing', name: 'X', email_verified: true });
    const r = await store.requestChallengeWithThrottle(challengeInput('dup@acme.com'), 60_000);
    if (!('created' in r) || !r.created) throw new Error('setup');

    await expect(
      store.createAccountConsumingChallenge(accountInput(r.challenge.id, 'dup@acme.com')),
    ).rejects.toMatchObject({ name: 'DuplicateEmailError' });

    // The OTP was NOT permanently consumed — the challenge is still active.
    const active = await store.getActiveEmailChallengeByEmail('dup@acme.com');
    expect(active?.id).toBe(r.challenge.id);
    expect(active?.consumed).toBe(false);
  });

  it('concurrent double verification of the same challenge creates EXACTLY one account', async () => {
    const r = await store.requestChallengeWithThrottle(challengeInput('race@acme.com'), 60_000);
    if (!('created' in r) || !r.created) throw new Error('setup');
    const [a, b] = await Promise.all([
      store.createAccountConsumingChallenge(accountInput(r.challenge.id, 'race@acme.com')),
      store.createAccountConsumingChallenge(accountInput(r.challenge.id, 'race@acme.com')),
    ]);
    const created = [a, b].filter((x) => x.ok).length;
    expect(created).toBe(1);
    // And exactly one user row exists for that email.
    const user = await store.getUserByEmail('race@acme.com');
    expect(user).not.toBeNull();
  });

  it('returns ok:false for an expired challenge (never creates an account)', async () => {
    const r = await store.requestChallengeWithThrottle(
      challengeInput('exp@acme.com', { expires_at: new Date(Date.now() - 1000).toISOString() }),
      60_000,
    );
    if (!('created' in r) || !r.created) throw new Error('setup');
    const res = await store.createAccountConsumingChallenge(accountInput(r.challenge.id, 'exp@acme.com'));
    expect(res.ok).toBe(false);
    expect(await store.getUserByEmail('exp@acme.com')).toBeNull();
  });
});
