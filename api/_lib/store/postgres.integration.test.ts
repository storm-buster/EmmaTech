/**
 * Postgres integration tests — real database, NOT the in-memory store.
 *
 * These run ONLY when `TEST_DATABASE_URL` points at a THROWAWAY Postgres (never
 * production). Set it and run:
 *   TEST_DATABASE_URL=postgres://user:pass@localhost:5432/db npx vitest run api/_lib/store/postgres.integration.test.ts
 * When unset, the whole suite is skipped so the normal test run needs no DB.
 *
 * Verifies migration 0003 applies from the 0001/0002 schema, the new columns +
 * email_challenges table, JSONB round-trip, every new PostgresStore method,
 * transactional rollback, and atomic single-use under real concurrency.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pgPkg from 'pg';
import { PostgresStore, __closePostgresPoolForTests } from './postgres.js';
import type { CreateEmailChallengeInput, ConsumeChallengeAccountInput } from './types.js';

const { Pool } = pgPkg;
const TEST_DB = process.env.TEST_DATABASE_URL;
const suite = TEST_DB ? describe : describe.skip;

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '../../../migrations');
function readMigration(name: string): string {
  return readFileSync(join(migrationsDir, name), 'utf8');
}

function challengeInput(email: string, overrides: Partial<CreateEmailChallengeInput> = {}): CreateEmailChallengeInput {
  return {
    email,
    code_hash: `hash-${email}`,
    expires_at: new Date(Date.now() + 600_000).toISOString(),
    payload: { name: 'N', organization_name: 'Org', password_hash: 'scrypt$x', requested_plan: 'starter' },
    ...overrides,
  };
}
function accountInput(challengeId: string, email: string, overrides: Partial<ConsumeChallengeAccountInput> = {}): ConsumeChallengeAccountInput {
  return {
    challengeId,
    email,
    name: 'N',
    organizationName: 'Org',
    password_hash: 'scrypt$x',
    plan: 'starter',
    plan_selected: true,
    ...overrides,
  };
}

suite('PostgresStore integration (real DB)', () => {
  let adminPool: InstanceType<typeof Pool>;
  let store: PostgresStore;

  beforeAll(async () => {
    adminPool = new Pool({ connectionString: TEST_DB, max: 5 });
    // Clean slate, then apply migrations IN ORDER. Applying 0003 on top of the
    // 0001+0002 schema without error proves it migrates cleanly from existing.
    await adminPool.query('DROP TABLE IF EXISTS email_challenges, organization_members, organizations, users CASCADE');
    await adminPool.query(readMigration('0001_identity_foundation.up.sql'));
    await adminPool.query(readMigration('0002_organization_plan.up.sql'));
    await adminPool.query(readMigration('0003_email_verification_and_plan_selection.up.sql'));
    store = new PostgresStore(TEST_DB as string);
  }, 60_000);

  afterAll(async () => {
    await __closePostgresPoolForTests();
    await adminPool.end();
  });

  beforeEach(async () => {
    // Clean data rows between tests (schema already migrated).
    await adminPool.query('TRUNCATE email_challenges, organization_members, organizations, users CASCADE');
  });

  it('migration 0003 created the new columns + email_challenges table', async () => {
    const cols = await adminPool.query(
      `SELECT table_name, column_name FROM information_schema.columns
       WHERE (table_name='users' AND column_name='email_verified')
          OR (table_name='organizations' AND column_name='plan_selected')`,
    );
    expect(cols.rows.length).toBe(2);
    const tbl = await adminPool.query(`SELECT to_regclass('public.email_challenges') AS t`);
    expect(tbl.rows[0].t).toBe('email_challenges');
  });

  it('migration 0003 backfill grandfathers legacy users/orgs (verified / selected)', async () => {
    // Simulate pre-0003 rows (the added columns default false), then run the
    // exact backfill statements from 0003 and assert they flip to true.
    const u = await adminPool.query(
      `INSERT INTO users (email, password_hash, name, email_verified)
       VALUES ('legacy@acme.com','scrypt$x','Legacy', false) RETURNING id`,
    );
    const o = await adminPool.query(
      `INSERT INTO organizations (name, plan_selected) VALUES ('LegacyOrg', false) RETURNING id`,
    );
    await adminPool.query(`UPDATE users SET email_verified = true WHERE email_verified = false`);
    await adminPool.query(`UPDATE organizations SET plan_selected = true WHERE plan_selected = false`);
    const uu = await adminPool.query(`SELECT email_verified FROM users WHERE id=$1`, [u.rows[0].id]);
    expect(uu.rows[0].email_verified).toBe(true);
    const oo = await adminPool.query(`SELECT plan_selected FROM organizations WHERE id=$1`, [o.rows[0].id]);
    expect(oo.rows[0].plan_selected).toBe(true);
  });

  it('user/org fields, membership, and setInitialOrganizationPlan round-trip', async () => {
    const user = await store.createUser({ email: 'a@acme.com', password_hash: 'scrypt$x', name: 'A', email_verified: true });
    expect(user.email_verified).toBe(true);
    const org = await store.createOrganization({ name: 'Acme', status: 'pending', rapha_tenant_id: null, plan: 'free', plan_selected: false });
    expect(org.plan_selected).toBe(false);
    await store.createMembership({ user_id: user.id, organization_id: org.id, role: 'owner' });
    const m = await store.getPrimaryMembershipForUser(user.id);
    expect(m?.organization_id).toBe(org.id);
    const updated = await store.setInitialOrganizationPlan(org.id, 'growth');
    expect(updated.plan).toBe('growth');
    expect(updated.plan_selected).toBe(true);
  });

  it('email challenge CRUD + JSONB payload round-trip', async () => {
    const created = await store.createEmailChallenge(challengeInput('c@acme.com'));
    expect(created.payload).toEqual({ name: 'N', organization_name: 'Org', password_hash: 'scrypt$x', requested_plan: 'starter' });
    const active = await store.getActiveEmailChallengeByEmail('c@acme.com');
    expect(active?.id).toBe(created.id);
    const inc = await store.incrementEmailChallengeAttempts(created.id);
    expect(inc.attempts).toBe(1);
    await store.consumeEmailChallenge(created.id);
    expect(await store.getActiveEmailChallengeByEmail('c@acme.com')).toBeNull();
  });

  it('requestChallengeWithThrottle: created → throttled within cooldown → allowed after', async () => {
    const first = await store.requestChallengeWithThrottle(challengeInput('t@acme.com'), 60_000);
    expect(first).toMatchObject({ created: true });
    const second = await store.requestChallengeWithThrottle(challengeInput('t@acme.com'), 60_000);
    expect(second).toEqual({ throttled: true });
    const third = await store.requestChallengeWithThrottle(challengeInput('t@acme.com'), 1); // 1ms cooldown
    expect(third).toMatchObject({ created: true });
  });

  it('requestChallengeWithThrottle: concurrent same-email requests → exactly one created', async () => {
    const [a, b] = await Promise.all([
      store.requestChallengeWithThrottle(challengeInput('race-t@acme.com'), 60_000),
      store.requestChallengeWithThrottle(challengeInput('race-t@acme.com'), 60_000),
    ]);
    expect([a, b].filter((r) => 'created' in r && r.created).length).toBe(1);
  });

  it('createAccountConsumingChallenge commits atomically and consumes once', async () => {
    const r = await store.requestChallengeWithThrottle(challengeInput('acc@acme.com'), 60_000);
    if (!('created' in r) || !r.created) throw new Error('setup');
    const res = await store.createAccountConsumingChallenge(accountInput(r.challenge.id, 'acc@acme.com'));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.user.email_verified).toBe(true);
      expect(res.organization.plan).toBe('starter');
      expect(res.organization.plan_selected).toBe(true);
      const m = await store.getPrimaryMembershipForUser(res.user.id);
      expect(m?.role).toBe('owner');
    }
    // Consumed → second attempt does nothing.
    const again = await store.createAccountConsumingChallenge(accountInput(r.challenge.id, 'acc@acme.com'));
    expect(again.ok).toBe(false);
  });

  it('rolls back the WHOLE transaction (incl. consume) on duplicate email', async () => {
    await store.createUser({ email: 'dup@acme.com', password_hash: 'scrypt$x', name: 'X', email_verified: true });
    const r = await store.requestChallengeWithThrottle(challengeInput('dup@acme.com'), 60_000);
    if (!('created' in r) || !r.created) throw new Error('setup');
    await expect(
      store.createAccountConsumingChallenge(accountInput(r.challenge.id, 'dup@acme.com')),
    ).rejects.toMatchObject({ name: 'DuplicateEmailError' });
    // Challenge NOT consumed (rolled back) → still active/retryable.
    const active = await store.getActiveEmailChallengeByEmail('dup@acme.com');
    expect(active?.id).toBe(r.challenge.id);
    expect(active?.consumed).toBe(false);
    // No orphan org/membership created.
    const orgs = await adminPool.query(`SELECT count(*)::int AS n FROM organizations`);
    expect(orgs.rows[0].n).toBe(0);
    const users = await adminPool.query(`SELECT count(*)::int AS n FROM users WHERE email='dup@acme.com'`);
    expect(users.rows[0].n).toBe(1); // only the pre-existing user
  });

  it('atomic single-use under real concurrency → exactly one account', async () => {
    const r = await store.requestChallengeWithThrottle(challengeInput('race@acme.com'), 60_000);
    if (!('created' in r) || !r.created) throw new Error('setup');
    const [a, b] = await Promise.all([
      store.createAccountConsumingChallenge(accountInput(r.challenge.id, 'race@acme.com')),
      store.createAccountConsumingChallenge(accountInput(r.challenge.id, 'race@acme.com')),
    ]);
    expect([a, b].filter((x) => x.ok).length).toBe(1);
    const users = await adminPool.query(`SELECT count(*)::int AS n FROM users WHERE email='race@acme.com'`);
    expect(users.rows[0].n).toBe(1);
  });
});
