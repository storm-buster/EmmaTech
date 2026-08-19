/**
 * Postgres-backed DataStore for production.
 *
 * `pg` is imported lazily so that environments without a database (tests,
 * local dev using the in-memory store) do not need the dependency loaded.
 * The schema is created/managed by the SQL migrations under /migrations.
 */
import type {
  ConsumeChallengeAccountInput,
  ConsumeChallengeResult,
  CreateEmailChallengeInput,
  CreateOrganizationInput,
  CreateUserInput,
  DataStore,
  EmailChallenge,
  Membership,
  Organization,
  OrgProvisioningStatus,
  OrgRole,
  ThrottledChallengeResult,
  User,
} from './types.js';
import { DuplicateEmailError } from './types.js';
import type { PlanId } from '../../../src/shared/plans.js';
import { DEFAULT_PLAN_ID } from '../../../src/shared/plans.js';

// Minimal structural types so we don't hard-depend on `pg` types at build time.
interface QueryResultLike<T> {
  rows: T[];
}
/** A single pooled connection — required to run a real BEGIN/COMMIT transaction
 *  (all statements must share one connection). */
interface PoolClientLike {
  query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResultLike<T>>;
  release(): void;
}
interface PoolLike {
  query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResultLike<T>>;
  connect(): Promise<PoolClientLike>;
}

let poolPromise: Promise<PoolLike> | null = null;

async function getPool(connectionString: string): Promise<PoolLike> {
  if (!poolPromise) {
    poolPromise = (async () => {
      // Lazy, optional dependency. Present in production only. The
      // @vite-ignore keeps the test/build bundler from trying to resolve it;
      // Node resolves it at runtime inside the Vercel function.
      //
      // `pg` is a CommonJS package. Under ESM (this repo is "type":"module")
      // the CJS `module.exports` — which carries `Pool` — is exposed via the
      // interop `default` export, while the named `Pool` export is NOT always
      // statically detected by Node's cjs-module-lexer. In the Vercel Node
      // runtime `Pool` is undefined, which is why `new pg.Pool(...)` failed
      // with "pg.Pool is not a constructor". Accept either shape: prefer a
      // named `Pool`, else fall back to `default.Pool`.
      type PoolCtor = new (config: { connectionString: string; max?: number }) => PoolLike;
      const mod = (await import(/* @vite-ignore */ 'pg')) as unknown as {
        Pool?: PoolCtor;
        default?: { Pool?: PoolCtor };
      };
      const Pool = mod.Pool ?? mod.default?.Pool;
      if (typeof Pool !== 'function') {
        throw new Error('pg Pool constructor is unavailable');
      }
      return new Pool({ connectionString, max: 5 });
    })();
  }
  return poolPromise;
}

const UNIQUE_VIOLATION = '23505';

/** TEST-ONLY: close and reset the cached pool so integration tests don't leak
 *  a connection/open handle. No effect in the serverless runtime. */
export async function __closePostgresPoolForTests(): Promise<void> {
  if (!poolPromise) return;
  try {
    const pool = (await poolPromise) as PoolLike & { end?: () => Promise<void> };
    await pool.end?.();
  } finally {
    poolPromise = null;
  }
}

export class PostgresStore implements DataStore {
  constructor(private readonly connectionString: string) {}

  private async q<T = unknown>(text: string, params?: unknown[]): Promise<QueryResultLike<T>> {
    const pool = await getPool(this.connectionString);
    return pool.query<T>(text, params);
  }

  /** Run `fn` inside a real Postgres transaction on a single pooled connection.
   *  Commits on success; ROLLS BACK and rethrows on any error. */
  private async withTransaction<T>(fn: (c: PoolClientLike) => Promise<T>): Promise<T> {
    const pool = await getPool(this.connectionString);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore rollback failure — original error is more important */
      }
      throw err;
    } finally {
      client.release();
    }
  }

  async createUser(input: CreateUserInput): Promise<User> {
    try {
      const { rows } = await this.q<User>(
        `INSERT INTO users (email, password_hash, name, email_verified)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, password_hash, name, is_active, email_verified, created_at, updated_at`,
        [input.email, input.password_hash, input.name, input.email_verified ?? false],
      );
      return rows[0];
    } catch (err) {
      if ((err as { code?: string })?.code === UNIQUE_VIOLATION) {
        throw new DuplicateEmailError();
      }
      throw err;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { rows } = await this.q<User>(
      `SELECT id, email, password_hash, name, is_active, email_verified, created_at, updated_at
       FROM users WHERE email = $1`,
      [email],
    );
    return rows[0] ?? null;
  }

  async getUserById(id: string): Promise<User | null> {
    const { rows } = await this.q<User>(
      `SELECT id, email, password_hash, name, is_active, email_verified, created_at, updated_at
       FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const { rows } = await this.q<Organization>(
      `INSERT INTO organizations (name, plan, plan_selected, status, rapha_tenant_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, plan, plan_selected, status, rapha_tenant_id, created_at, updated_at`,
      [
        input.name,
        input.plan ?? DEFAULT_PLAN_ID,
        input.plan_selected ?? false,
        input.status,
        input.rapha_tenant_id,
      ],
    );
    return rows[0];
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    const { rows } = await this.q<Organization>(
      `SELECT id, name, plan, plan_selected, status, rapha_tenant_id, created_at, updated_at
       FROM organizations WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async updateOrganizationTenant(
    id: string,
    update: { rapha_tenant_id: string | null; status: OrgProvisioningStatus },
  ): Promise<Organization> {
    const { rows } = await this.q<Organization>(
      `UPDATE organizations
       SET rapha_tenant_id = $2, status = $3, updated_at = now()
       WHERE id = $1
       RETURNING id, name, plan, plan_selected, status, rapha_tenant_id, created_at, updated_at`,
      [id, update.rapha_tenant_id, update.status],
    );
    if (!rows[0]) throw new Error(`Organization not found: ${id}`);
    return rows[0];
  }

  async setOrganizationPlan(id: string, plan: PlanId): Promise<Organization> {
    const { rows } = await this.q<Organization>(
      `UPDATE organizations
       SET plan = $2, updated_at = now()
       WHERE id = $1
       RETURNING id, name, plan, plan_selected, status, rapha_tenant_id, created_at, updated_at`,
      [id, plan],
    );
    if (!rows[0]) throw new Error(`Organization not found: ${id}`);
    return rows[0];
  }

  async setInitialOrganizationPlan(id: string, plan: PlanId): Promise<Organization> {
    const { rows } = await this.q<Organization>(
      `UPDATE organizations
       SET plan = $2, plan_selected = true, updated_at = now()
       WHERE id = $1
       RETURNING id, name, plan, plan_selected, status, rapha_tenant_id, created_at, updated_at`,
      [id, plan],
    );
    if (!rows[0]) throw new Error(`Organization not found: ${id}`);
    return rows[0];
  }

  async createMembership(input: {
    user_id: string;
    organization_id: string;
    role: OrgRole;
  }): Promise<Membership> {
    const { rows } = await this.q<Membership>(
      `INSERT INTO organization_members (user_id, organization_id, role)
       VALUES ($1, $2, $3)
       RETURNING user_id, organization_id, role, created_at`,
      [input.user_id, input.organization_id, input.role],
    );
    return rows[0];
  }

  async getMembershipsByUser(userId: string): Promise<Membership[]> {
    const { rows } = await this.q<Membership>(
      `SELECT user_id, organization_id, role, created_at
       FROM organization_members WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId],
    );
    return rows;
  }

  async getPrimaryMembershipForUser(userId: string): Promise<Membership | null> {
    const { rows } = await this.q<Membership>(
      `SELECT user_id, organization_id, role, created_at
       FROM organization_members WHERE user_id = $1
       ORDER BY (role = 'owner') DESC, created_at ASC
       LIMIT 1`,
      [userId],
    );
    return rows[0] ?? null;
  }

  // ── Email OTP challenges ──────────────────────────────────────────────
  async createEmailChallenge(input: CreateEmailChallengeInput): Promise<EmailChallenge> {
    // Resend supersedes: invalidate prior active challenges for this email.
    await this.q(`DELETE FROM email_challenges WHERE email = $1 AND consumed = false`, [
      input.email,
    ]);
    const { rows } = await this.q<EmailChallenge>(
      `INSERT INTO email_challenges (email, code_hash, expires_at, payload)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, code_hash, expires_at, attempts, consumed, payload, created_at`,
      [input.email, input.code_hash, input.expires_at, input.payload],
    );
    return rows[0];
  }

  async getActiveEmailChallengeByEmail(email: string): Promise<EmailChallenge | null> {
    const { rows } = await this.q<EmailChallenge>(
      `SELECT id, email, code_hash, expires_at, attempts, consumed, payload, created_at
       FROM email_challenges
       WHERE email = $1 AND consumed = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [email],
    );
    return rows[0] ?? null;
  }

  async incrementEmailChallengeAttempts(id: string): Promise<EmailChallenge> {
    const { rows } = await this.q<EmailChallenge>(
      `UPDATE email_challenges SET attempts = attempts + 1
       WHERE id = $1
       RETURNING id, email, code_hash, expires_at, attempts, consumed, payload, created_at`,
      [id],
    );
    if (!rows[0]) throw new Error(`Email challenge not found: ${id}`);
    return rows[0];
  }

  async consumeEmailChallenge(id: string): Promise<void> {
    await this.q(`UPDATE email_challenges SET consumed = true WHERE id = $1`, [id]);
  }

  async requestChallengeWithThrottle(
    input: CreateEmailChallengeInput,
    cooldownMs: number,
  ): Promise<ThrottledChallengeResult> {
    return this.withTransaction(async (c) => {
      // Per-email transaction-scoped advisory lock: serializes concurrent
      // requests for the SAME email across connections/instances so the
      // cooldown cannot be raced. Released automatically on COMMIT/ROLLBACK.
      await c.query(`SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`, [input.email]);
      const recent = await c.query<{ created_at: string }>(
        `SELECT created_at FROM email_challenges
         WHERE email = $1 AND consumed = false
         ORDER BY created_at DESC LIMIT 1`,
        [input.email],
      );
      if (recent.rows[0]) {
        const age = Date.now() - new Date(recent.rows[0].created_at).getTime();
        if (age < cooldownMs) return { throttled: true } as ThrottledChallengeResult;
      }
      // Supersede prior active challenges, then insert the new one.
      await c.query(`DELETE FROM email_challenges WHERE email = $1 AND consumed = false`, [input.email]);
      const ins = await c.query<EmailChallenge>(
        `INSERT INTO email_challenges (email, code_hash, expires_at, payload)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, code_hash, expires_at, attempts, consumed, payload, created_at`,
        [input.email, input.code_hash, input.expires_at, input.payload],
      );
      return { created: true, challenge: ins.rows[0] } as ThrottledChallengeResult;
    });
  }

  async createAccountConsumingChallenge(
    input: ConsumeChallengeAccountInput,
  ): Promise<ConsumeChallengeResult> {
    return this.withTransaction(async (c) => {
      // PRIMARY single-use guard: conditional consume. The row lock taken here
      // serializes concurrent verifications of the same challenge — exactly one
      // transaction updates a row; the loser gets 0 rows and creates nothing.
      const consumed = await c.query(
        `UPDATE email_challenges SET consumed = true
         WHERE id = $1 AND consumed = false AND expires_at > now()
         RETURNING id`,
        [input.challengeId],
      );
      if (consumed.rows.length === 0) return { ok: false } as ConsumeChallengeResult;

      let user: User;
      try {
        const u = await c.query<User>(
          `INSERT INTO users (email, password_hash, name, email_verified)
           VALUES ($1, $2, $3, true)
           RETURNING id, email, password_hash, name, is_active, email_verified, created_at, updated_at`,
          [input.email, input.password_hash, input.name],
        );
        user = u.rows[0];
      } catch (err) {
        // Secondary backstop: unique email. Throwing rolls back the WHOLE txn
        // (including the consume above), so the challenge stays usable.
        if ((err as { code?: string })?.code === UNIQUE_VIOLATION) throw new DuplicateEmailError();
        throw err;
      }

      const o = await c.query<Organization>(
        `INSERT INTO organizations (name, plan, plan_selected, status, rapha_tenant_id)
         VALUES ($1, $2, $3, 'pending', NULL)
         RETURNING id, name, plan, plan_selected, status, rapha_tenant_id, created_at, updated_at`,
        [input.organizationName, input.plan, input.plan_selected],
      );
      const organization = o.rows[0];

      await c.query(
        `INSERT INTO organization_members (user_id, organization_id, role)
         VALUES ($1, $2, 'owner')`,
        [user.id, organization.id],
      );

      return { ok: true, user, organization } as ConsumeChallengeResult;
    });
  }
}
