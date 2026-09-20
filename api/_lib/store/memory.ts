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
} from './types.js';
import { DuplicateEmailError } from './types.js';

export class InMemoryStore implements DataStore {
  private users = new Map<string, User>();
  private usersByEmail = new Map<string, string>(); // email -> id
  private organizations = new Map<string, Organization>();
  private memberships: Membership[] = [];
  private challenges = new Map<string, EmailChallenge>();
  private accessRequests: AccessRequest[] = [];

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
      email_verified: input.email_verified ?? false,
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
      plan_selected: input.plan_selected ?? false,
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

  async setInitialOrganizationPlan(id: string, plan: PlanId): Promise<Organization> {
    const org = this.organizations.get(id);
    if (!org) throw new Error(`Organization not found: ${id}`);
    org.plan = plan;
    org.plan_selected = true;
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

  // ── Email OTP challenges ──────────────────────────────────────────────
  async createEmailChallenge(input: CreateEmailChallengeInput): Promise<EmailChallenge> {
    // Resend supersedes: invalidate every prior challenge for this email so at
    // most one code is ever valid at a time.
    for (const [id, ch] of this.challenges) {
      if (ch.email === input.email) this.challenges.delete(id);
    }
    const challenge: EmailChallenge = {
      id: randomUUID(),
      email: input.email,
      code_hash: input.code_hash,
      expires_at: input.expires_at,
      attempts: 0,
      consumed: false,
      payload: { ...input.payload },
      created_at: this.now(),
    };
    this.challenges.set(challenge.id, challenge);
    return { ...challenge, payload: { ...challenge.payload } };
  }

  async getActiveEmailChallengeByEmail(email: string): Promise<EmailChallenge | null> {
    let latest: EmailChallenge | null = null;
    for (const ch of this.challenges.values()) {
      if (ch.email !== email || ch.consumed) continue;
      if (!latest || ch.created_at > latest.created_at) latest = ch;
    }
    return latest ? { ...latest, payload: { ...latest.payload } } : null;
  }

  async incrementEmailChallengeAttempts(id: string): Promise<EmailChallenge> {
    const ch = this.challenges.get(id);
    if (!ch) throw new Error(`Email challenge not found: ${id}`);
    ch.attempts += 1;
    return { ...ch, payload: { ...ch.payload } };
  }

  async consumeEmailChallenge(id: string): Promise<void> {
    const ch = this.challenges.get(id);
    if (ch) ch.consumed = true;
  }

  async requestChallengeWithThrottle(
    input: CreateEmailChallengeInput,
    cooldownMs: number,
  ): Promise<ThrottledChallengeResult> {
    const now = Date.now();
    // Latest non-consumed challenge for this email (JS is single-threaded, so
    // this check-then-write runs atomically within one tick — cannot be raced).
    let latest: EmailChallenge | null = null;
    for (const ch of this.challenges.values()) {
      if (ch.email === input.email && !ch.consumed && (!latest || ch.created_at > latest.created_at)) {
        latest = ch;
      }
    }
    if (latest && now - new Date(latest.created_at).getTime() < cooldownMs) {
      return { throttled: true };
    }
    // Supersede any prior active challenge, then insert the new one.
    for (const [id, ch] of this.challenges) {
      if (ch.email === input.email && !ch.consumed) this.challenges.delete(id);
    }
    const challenge: EmailChallenge = {
      id: randomUUID(),
      email: input.email,
      code_hash: input.code_hash,
      expires_at: input.expires_at,
      attempts: 0,
      consumed: false,
      payload: { ...input.payload },
      created_at: this.now(),
    };
    this.challenges.set(challenge.id, challenge);
    return { created: true, challenge: { ...challenge, payload: { ...challenge.payload } } };
  }

  async createAccountConsumingChallenge(
    input: ConsumeChallengeAccountInput,
  ): Promise<ConsumeChallengeResult> {
    const ch = this.challenges.get(input.challengeId);
    // Conditional single-use consume (atomic within one tick).
    if (!ch || ch.consumed || new Date(ch.expires_at).getTime() <= Date.now()) {
      return { ok: false };
    }
    ch.consumed = true;
    // Email-unique backstop (NOT the primary single-use guard).
    if (this.usersByEmail.has(input.email)) {
      ch.consumed = false; // roll back the consume — nothing else was written
      throw new DuplicateEmailError();
    }
    const ts = this.now();
    const user: User = {
      id: randomUUID(),
      email: input.email,
      password_hash: input.password_hash,
      name: input.name,
      is_active: true,
      email_verified: true,
      created_at: ts,
      updated_at: ts,
    };
    const org: Organization = {
      id: randomUUID(),
      name: input.organizationName,
      plan: input.plan,
      plan_selected: input.plan_selected,
      status: 'pending',
      rapha_tenant_id: null,
      created_at: ts,
      updated_at: ts,
    };
    // Commit all three together (no awaits between → all-or-nothing per tick).
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);
    this.organizations.set(org.id, org);
    this.memberships.push({ user_id: user.id, organization_id: org.id, role: 'owner', created_at: ts });
    return { ok: true, user: { ...user }, organization: { ...org } };
  }

  // ── Phase 1: private-access applications ──────────────────────────────
  async createAccessRequest(input: CreateAccessRequestInput): Promise<AccessRequest> {
    const ts = this.now();
    const request: AccessRequest = {
      id: randomUUID(),
      full_name: input.full_name,
      work_email: input.work_email,
      organization: input.organization,
      job_title: input.job_title,
      industry: input.industry,
      organization_size: input.organization_size,
      country: input.country,
      security_challenge: input.security_challenge,
      current_stack: input.current_stack,
      deployment_environment: input.deployment_environment,
      evaluation_reason: input.evaluation_reason,
      additional_context: input.additional_context,
      utm_source: input.utm_source,
      utm_medium: input.utm_medium,
      utm_campaign: input.utm_campaign,
      utm_content: input.utm_content,
      referrer_domain: input.referrer_domain,
      landing_path: input.landing_path,
      first_touch_at: input.first_touch_at,
      last_touch_at: input.last_touch_at,
      status: 'submitted',
      created_at: ts,
      updated_at: ts,
    };
    this.accessRequests.push(request);
    return { ...request };
  }

  async listAccessRequests(opts: ListAccessRequestsOptions): Promise<AccessRequestListPage> {
    let rows = [...this.accessRequests];
    if (opts.status) rows = rows.filter((r) => r.status === opts.status);
    // Newest first; tie-break by id for a stable order (mirrors Postgres).
    rows.sort((a, b) =>
      a.created_at === b.created_at
        ? a.id.localeCompare(b.id)
        : a.created_at < b.created_at
          ? 1
          : -1,
    );
    const total = rows.length;
    const start = (opts.page - 1) * opts.pageSize;
    const page = rows.slice(start, start + opts.pageSize).map((r) => ({ ...r }));
    return { requests: page, total };
  }

  async getAccessRequest(id: string): Promise<AccessRequest | null> {
    const found = this.accessRequests.find((r) => r.id === id);
    return found ? { ...found } : null;
  }

  async setAccessRequestStatus(
    id: string,
    status: AccessRequestStatus,
  ): Promise<AccessRequest | null> {
    const found = this.accessRequests.find((r) => r.id === id);
    if (!found) return null;
    found.status = status;
    found.updated_at = this.now();
    return { ...found };
  }
}
