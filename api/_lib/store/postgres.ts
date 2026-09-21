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
  AccessRequest,
  AccessRequestStatus,
  CreateAccessRequestInput,
  ListAccessRequestsOptions,
  AccessRequestListPage,
  AcquisitionReportOptions,
  AcquisitionReport,
} from './types.js';
import { DuplicateEmailError } from './types.js';
import { resolveReportParams, ACQUISITION_REPORT } from '../acquisition-report.js';

const ACQ_DIRECT_UNKNOWN = ACQUISITION_REPORT.DIRECT_UNKNOWN;
const ACQ_UNKNOWN_PATH = ACQUISITION_REPORT.UNKNOWN_PATH;
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

  // ── Phase 1: private-access applications ──────────────────────────────
  async createAccessRequest(input: CreateAccessRequestInput): Promise<AccessRequest> {
    const { rows } = await this.q<AccessRequest>(
      `INSERT INTO access_requests
         (full_name, work_email, organization, job_title, industry, organization_size,
          country, security_challenge, current_stack, deployment_environment,
          evaluation_reason, additional_context,
          utm_source, utm_medium, utm_campaign, utm_content, referrer_domain,
          landing_path, first_touch_at, last_touch_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING id, full_name, work_email, organization, job_title, industry,
                 organization_size, country, security_challenge, current_stack,
                 deployment_environment, evaluation_reason, additional_context,
                 utm_source, utm_medium, utm_campaign, utm_content, referrer_domain,
                 landing_path, first_touch_at, last_touch_at,
                 status, created_at, updated_at`,
      [
        input.full_name,
        input.work_email,
        input.organization,
        input.job_title,
        input.industry,
        input.organization_size,
        input.country,
        input.security_challenge,
        input.current_stack,
        input.deployment_environment,
        input.evaluation_reason,
        input.additional_context,
        input.utm_source,
        input.utm_medium,
        input.utm_campaign,
        input.utm_content,
        input.referrer_domain,
        input.landing_path,
        input.first_touch_at,
        input.last_touch_at,
      ],
    );
    return rows[0];
  }

  async listAccessRequests(opts: ListAccessRequestsOptions): Promise<AccessRequestListPage> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (opts.status) {
      params.push(opts.status);
      where.push(`status = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRes = await this.q<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM access_requests ${whereSql}`,
      params,
    );
    const total = Number(totalRes.rows[0]?.count ?? '0');

    const limit = opts.pageSize;
    const offset = (opts.page - 1) * opts.pageSize;
    const pageParams = [...params, limit, offset];
    const { rows } = await this.q<AccessRequest>(
      `SELECT id, full_name, work_email, organization, job_title, industry,
              organization_size, country, security_challenge, current_stack,
              deployment_environment, evaluation_reason, additional_context,
              status, created_at, updated_at
         FROM access_requests
         ${whereSql}
         ORDER BY created_at DESC, id
         LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`,
      pageParams,
    );
    return { requests: rows, total };
  }

  async getAccessRequest(id: string): Promise<AccessRequest | null> {
    const { rows } = await this.q<AccessRequest>(
      `SELECT id, full_name, work_email, organization, job_title, industry,
              organization_size, country, security_challenge, current_stack,
              deployment_environment, evaluation_reason, additional_context,
              status, created_at, updated_at
         FROM access_requests WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async setAccessRequestStatus(
    id: string,
    status: AccessRequestStatus,
  ): Promise<AccessRequest | null> {
    const { rows } = await this.q<AccessRequest>(
      `UPDATE access_requests SET status = $2, updated_at = now()
        WHERE id = $1
       RETURNING id, full_name, work_email, organization, job_title, industry,
                 organization_size, country, security_challenge, current_stack,
                 deployment_environment, evaluation_reason, additional_context,
                 status, created_at, updated_at`,
      [id, status],
    );
    return rows[0] ?? null;
  }

  /**
   * Aggregate-only acquisition report. Every query is filtered to the required
   * half-open created_at window ($1 <= created_at < $2), selects ONLY coarse
   * aggregation columns (never PII), applies k-suppression via `HAVING
   * COUNT(*) >= $k` in SQL, and bounds open-ended dimensions with `LIMIT $topN`.
   * Never reuses listAccessRequests and never materializes row-level PII.
   */
  async getAcquisitionReport(opts: AcquisitionReportOptions): Promise<AcquisitionReport> {
    const { from, to, days, topN, minGroupSize } = resolveReportParams(opts);
    // Shared window params; per-query params append k / topN as needed.
    const win = [from, to];

    const [bySourceRes, bySmcRes, byPathRes, byStatusRes, byDayRes, touchRes, totalRes] =
      await Promise.all([
        // Leads by source (NULL → direct/unknown); suppressed + topN-bounded.
        this.q<{ key: string; count: number }>(
          `SELECT COALESCE(utm_source, $3) AS key, COUNT(*)::int AS count
             FROM access_requests
            WHERE created_at >= $1 AND created_at < $2
            GROUP BY COALESCE(utm_source, $3)
           HAVING COUNT(*) >= $4
            ORDER BY count DESC, key ASC
            LIMIT $5`,
          [...win, ACQ_DIRECT_UNKNOWN, minGroupSize, topN],
        ),
        // Source / medium / campaign triple; NULL medium+campaign preserved.
        this.q<{ utm_source: string; utm_medium: string | null; utm_campaign: string | null; count: number }>(
          `SELECT COALESCE(utm_source, $3) AS utm_source, utm_medium, utm_campaign,
                  COUNT(*)::int AS count
             FROM access_requests
            WHERE created_at >= $1 AND created_at < $2
            GROUP BY COALESCE(utm_source, $3), utm_medium, utm_campaign
           HAVING COUNT(*) >= $4
            ORDER BY count DESC, utm_source ASC, utm_medium ASC NULLS LAST, utm_campaign ASC NULLS LAST
            LIMIT $5`,
          [...win, ACQ_DIRECT_UNKNOWN, minGroupSize, topN],
        ),
        // Landing paths (path only — the stored column never contains a query string).
        this.q<{ key: string; count: number }>(
          `SELECT COALESCE(landing_path, $3) AS key, COUNT(*)::int AS count
             FROM access_requests
            WHERE created_at >= $1 AND created_at < $2
            GROUP BY COALESCE(landing_path, $3)
           HAVING COUNT(*) >= $4
            ORDER BY count DESC, key ASC
            LIMIT $5`,
          [...win, ACQ_UNKNOWN_PATH, minGroupSize, topN],
        ),
        // Status distribution (bounded by the fixed 5-value domain).
        this.q<{ key: string; count: number }>(
          `SELECT status AS key, COUNT(*)::int AS count
             FROM access_requests
            WHERE created_at >= $1 AND created_at < $2
            GROUP BY status
           HAVING COUNT(*) >= $3
            ORDER BY count DESC, key ASC`,
          [...win, minGroupSize],
        ),
        // Submissions per UTC calendar day (bounded by the ≤ maxWindow-day range).
        this.q<{ day: string; count: number }>(
          `SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
                  COUNT(*)::int AS count
             FROM access_requests
            WHERE created_at >= $1 AND created_at < $2
            GROUP BY 1
           HAVING COUNT(*) >= $3
            ORDER BY day ASC`,
          [...win, minGroupSize],
        ),
        // Touch-pattern summary (counts + gated averages; NO row-level timestamps).
        this.q<{
          single_touch: number; multi_touch: number; unknown_touch: number;
          consideration_avg: string | null; consideration_n: number;
          tts_avg: string | null; tts_n: number;
        }>(
          `SELECT
             COUNT(*) FILTER (WHERE first_touch_at IS NOT NULL AND last_touch_at IS NOT NULL AND last_touch_at = first_touch_at)::int AS single_touch,
             COUNT(*) FILTER (WHERE first_touch_at IS NOT NULL AND last_touch_at IS NOT NULL AND last_touch_at > first_touch_at)::int AS multi_touch,
             COUNT(*) FILTER (WHERE first_touch_at IS NULL OR last_touch_at IS NULL)::int AS unknown_touch,
             AVG(EXTRACT(EPOCH FROM (last_touch_at - first_touch_at)))
               FILTER (WHERE first_touch_at IS NOT NULL AND last_touch_at IS NOT NULL AND last_touch_at >= first_touch_at) AS consideration_avg,
             COUNT(*) FILTER (WHERE first_touch_at IS NOT NULL AND last_touch_at IS NOT NULL AND last_touch_at >= first_touch_at)::int AS consideration_n,
             AVG(EXTRACT(EPOCH FROM (created_at - first_touch_at)))
               FILTER (WHERE first_touch_at IS NOT NULL AND created_at >= first_touch_at) AS tts_avg,
             COUNT(*) FILTER (WHERE first_touch_at IS NOT NULL AND created_at >= first_touch_at)::int AS tts_n
           FROM access_requests
          WHERE created_at >= $1 AND created_at < $2`,
          [...win],
        ),
        // Global total in window (aggregate, not a group).
        this.q<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM access_requests
            WHERE created_at >= $1 AND created_at < $2`,
          [...win],
        ),
      ]);

    const t = touchRes.rows[0];
    const gate = (avg: string | null, n: number): number | null =>
      avg != null && n >= minGroupSize ? Math.round(Number(avg)) : null;

    return {
      window: { from, to, days },
      policy: { minGroupSize, topN },
      bySource: bySourceRes.rows.map((r) => ({ key: r.key, count: r.count })),
      bySourceMediumCampaign: bySmcRes.rows.map((r) => ({
        utm_source: r.utm_source, utm_medium: r.utm_medium, utm_campaign: r.utm_campaign, count: r.count,
      })),
      byLandingPath: byPathRes.rows.map((r) => ({ key: r.key, count: r.count })),
      byStatus: byStatusRes.rows.map((r) => ({ key: r.key, count: r.count })),
      byDay: byDayRes.rows.map((r) => ({ day: r.day, count: r.count })),
      touchPatterns: {
        single_touch: t?.single_touch ?? 0,
        multi_touch: t?.multi_touch ?? 0,
        unknown_touch: t?.unknown_touch ?? 0,
        avg_consideration_seconds: gate(t?.consideration_avg ?? null, t?.consideration_n ?? 0),
        avg_time_to_submit_seconds: gate(t?.tts_avg ?? null, t?.tts_n ?? 0),
      },
      totalInWindow: totalRes.rows[0]?.count ?? 0,
    };
  }
}
