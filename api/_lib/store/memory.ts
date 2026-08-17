/**
 * In-memory DataStore implementation.
 *
 * Used for tests and local development without a database. NOTE: this is not
 * durable across serverless invocations, so production MUST configure
 * DATABASE_URL to select the Postgres store instead.
 */
import { randomUUID } from 'node:crypto';
import type { PlanId } from '../../../src/shared/plans.js';
import { DEFAULT_PLAN_ID } from '../../../src/shared/plans.js';
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

export class InMemoryStore implements DataStore {
  private users = new Map<string, User>();
  private usersByEmail = new Map<string, string>(); // email -> id
  private organizations = new Map<string, Organization>();
  private memberships: Membership[] = [];

  private now(): string {
    return new Date().toISOString();
  }

  async createUser(input: CreateUserInput): Promise<User> {
    if (this.usersByEmail.has(input.email)) {
      throw new DuplicateEmailError();
    }
    const ts = this.now();
    const user: User = {
      id: randomUUID(),
      email: input.email,
      password_hash: input.password_hash,
      name: input.name,
      is_active: true,
      created_at: ts,
      updated_at: ts,
    };
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);
    return { ...user };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const id = this.usersByEmail.get(email);
    if (!id) return null;
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const ts = this.now();
    const org: Organization = {
      id: randomUUID(),
      name: input.name,
      plan: input.plan ?? DEFAULT_PLAN_ID,
      status: input.status,
      rapha_tenant_id: input.rapha_tenant_id,
      created_at: ts,
      updated_at: ts,
    };
    this.organizations.set(org.id, org);
    return { ...org };
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    const org = this.organizations.get(id);
    return org ? { ...org } : null;
  }

  async updateOrganizationTenant(
    id: string,
    update: { rapha_tenant_id: string | null; status: OrgProvisioningStatus },
  ): Promise<Organization> {
    const org = this.organizations.get(id);
    if (!org) throw new Error(`Organization not found: ${id}`);
    org.rapha_tenant_id = update.rapha_tenant_id;
    org.status = update.status;
    org.updated_at = this.now();
    return { ...org };
  }

  async setOrganizationPlan(id: string, plan: PlanId): Promise<Organization> {
    const org = this.organizations.get(id);
    if (!org) throw new Error(`Organization not found: ${id}`);
    org.plan = plan;
    org.updated_at = this.now();
    return { ...org };
  }

  async createMembership(input: {
    user_id: string;
    organization_id: string;
    role: OrgRole;
  }): Promise<Membership> {
    const membership: Membership = {
      user_id: input.user_id,
      organization_id: input.organization_id,
      role: input.role,
      created_at: this.now(),
    };
    this.memberships.push(membership);
    return { ...membership };
  }

  async getMembershipsByUser(userId: string): Promise<Membership[]> {
    return this.memberships.filter((m) => m.user_id === userId).map((m) => ({ ...m }));
  }

  async getPrimaryMembershipForUser(userId: string): Promise<Membership | null> {
    const owned = this.memberships.find((m) => m.user_id === userId && m.role === 'owner');
    if (owned) return { ...owned };
    const any = this.memberships.find((m) => m.user_id === userId);
    return any ? { ...any } : null;
  }
}
