/**
 * Postgres-backed DataStore for production.
 *
 * `pg` is imported lazily so that environments without a database (tests,
 * local dev using the in-memory store) do not need the dependency loaded.
 * The schema is created/managed by the SQL migrations under /migrations.
 */
import type {
  CreateOrganizationInput,
  CreateUserInput,
  DataStore,
  Membership,
  Organization,
  OrgProvisioningStatus,
  OrgRole,
  User,
} from './types.js';
import { DuplicateEmailError } from './types.js';
import type { PlanId } from '../../../src/shared/plans.js';
import { DEFAULT_PLAN_ID } from '../../../src/shared/plans.js';

// Minimal structural types so we don't hard-depend on `pg` types at build time.
interface QueryResultLike<T> {
  rows: T[];
}
interface PoolLike {
  query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResultLike<T>>;
}

let poolPromise: Promise<PoolLike> | null = null;

async function getPool(connectionString: string): Promise<PoolLike> {
  if (!poolPromise) {
    poolPromise = (async () => {
      // Lazy, optional dependency. Present in production only. The
      // @vite-ignore keeps the test/build bundler from trying to resolve it;
      // Node resolves it at runtime inside the Vercel function.
      const pg = (await import(/* @vite-ignore */ 'pg')) as unknown as {
        Pool: new (config: { connectionString: string; max?: number }) => PoolLike;
      };
      return new pg.Pool({ connectionString, max: 5 });
    })();
  }
  return poolPromise;
}

const UNIQUE_VIOLATION = '23505';

export class PostgresStore implements DataStore {
  constructor(private readonly connectionString: string) {}

  private async q<T = unknown>(text: string, params?: unknown[]): Promise<QueryResultLike<T>> {
    const pool = await getPool(this.connectionString);
    return pool.query<T>(text, params);
  }

  async createUser(input: CreateUserInput): Promise<User> {
    try {
      const { rows } = await this.q<User>(
        `INSERT INTO users (email, password_hash, name)
         VALUES ($1, $2, $3)
         RETURNING id, email, password_hash, name, is_active, created_at, updated_at`,
        [input.email, input.password_hash, input.name],
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
      `SELECT id, email, password_hash, name, is_active, created_at, updated_at
       FROM users WHERE email = $1`,
      [email],
    );
    return rows[0] ?? null;
  }

  async getUserById(id: string): Promise<User | null> {
    const { rows } = await this.q<User>(
      `SELECT id, email, password_hash, name, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const { rows } = await this.q<Organization>(
      `INSERT INTO organizations (name, plan, status, rapha_tenant_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, plan, status, rapha_tenant_id, created_at, updated_at`,
      [input.name, input.plan ?? DEFAULT_PLAN_ID, input.status, input.rapha_tenant_id],
    );
    return rows[0];
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    const { rows } = await this.q<Organization>(
      `SELECT id, name, plan, status, rapha_tenant_id, created_at, updated_at
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
       RETURNING id, name, plan, status, rapha_tenant_id, created_at, updated_at`,
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
       RETURNING id, name, plan, status, rapha_tenant_id, created_at, updated_at`,
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
}
