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
  AcquisitionReportOptions,
  AcquisitionReport,
  AcquisitionGroupCount,
  SourceMediumCampaignCount,
  DailyCount,
} from './types.js';
import { DuplicateEmailError } from './types.js';
import { resolveReportParams, ACQUISITION_REPORT } from '../acquisition-report.js';

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

  /**
   * Aggregate-only acquisition report — deterministic mirror of the Postgres
   * implementation (same window filter, suppression, topN, UTC-day bucketing,
   * and touch-pattern rules). Returns counts/coarse labels only — never an
   * AccessRequest row and never any PII.
   */
  async getAcquisitionReport(opts: AcquisitionReportOptions): Promise<AcquisitionReport> {
    const { from, to, days, topN, minGroupSize } = resolveReportParams(opts);
    const fromMs = new Date(from).getTime();
    const toMs = new Date(to).getTime();
    const DU = ACQUISITION_REPORT.DIRECT_UNKNOWN;
    const UP = ACQUISITION_REPORT.UNKNOWN_PATH;

    // Half-open created_at window. We only read coarse columns below.
    const rows = this.accessRequests.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return !Number.isNaN(t) && t >= fromMs && t < toMs;
    });

    // Generic single-key grouping → suppressed, count-desc / key-asc ordered.
    const groupCount = (keyOf: (r: AccessRequest) => string, limit?: number): AcquisitionGroupCount[] => {
      const m = new Map<string, number>();
      for (const r of rows) m.set(keyOf(r), (m.get(keyOf(r)) ?? 0) + 1);
      let out = [...m.entries()]
        .map(([key, count]) => ({ key, count }))
        .filter((g) => g.count >= minGroupSize)
        .sort((a, b) => (b.count - a.count) || a.key.localeCompare(b.key));
      if (limit !== undefined) out = out.slice(0, limit);
      return out;
    };

    // Null-last ascending string compare (mirrors "ASC NULLS LAST").
    const cmpNullsLast = (a: string | null, b: string | null): number =>
      a === b ? 0 : a === null ? 1 : b === null ? -1 : a.localeCompare(b);

    // Source / medium / campaign triple.
    const smcMap = new Map<string, SourceMediumCampaignCount>();
    for (const r of rows) {
      const utm_source = r.utm_source ?? DU;
      const k = JSON.stringify([utm_source, r.utm_medium, r.utm_campaign]);
      const cur = smcMap.get(k);
      if (cur) cur.count += 1;
      else smcMap.set(k, { utm_source, utm_medium: r.utm_medium, utm_campaign: r.utm_campaign, count: 1 });
    }
    const bySourceMediumCampaign = [...smcMap.values()]
      .filter((g) => g.count >= minGroupSize)
      .sort((a, b) =>
        (b.count - a.count) ||
        a.utm_source.localeCompare(b.utm_source) ||
        cmpNullsLast(a.utm_medium, b.utm_medium) ||
        cmpNullsLast(a.utm_campaign, b.utm_campaign))
      .slice(0, topN);

    // Submissions per UTC calendar day (bounded by the window; no topN).
    const dayMap = new Map<string, number>();
    for (const r of rows) {
      const t = new Date(r.created_at);
      if (Number.isNaN(t.getTime())) continue;
      const day = t.toISOString().slice(0, 10);
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    }
    const byDay: DailyCount[] = [...dayMap.entries()]
      .map(([day, count]) => ({ day, count }))
      .filter((d) => d.count >= minGroupSize)
      .sort((a, b) => a.day.localeCompare(b.day));

    // Touch patterns (mirror pg FILTER semantics; invalid strings ≡ null/unknown).
    const ms = (v: string | null): number | null => {
      if (!v) return null;
      const t = new Date(v).getTime();
      return Number.isNaN(t) ? null : t;
    };
    let single_touch = 0, multi_touch = 0, unknown_touch = 0;
    let considSum = 0, considN = 0, ttsSum = 0, ttsN = 0;
    for (const r of rows) {
      const f = ms(r.first_touch_at);
      const l = ms(r.last_touch_at);
      const c = ms(r.created_at);
      if (f === null || l === null) unknown_touch += 1;
      else if (l === f) single_touch += 1;
      else if (l > f) multi_touch += 1;
      // (both present but l < f → counted in none, mirroring pg)
      if (f !== null && l !== null && l >= f) { considSum += (l - f) / 1000; considN += 1; }
      if (f !== null && c !== null && c >= f) { ttsSum += (c - f) / 1000; ttsN += 1; }
    }
    const gate = (sum: number, n: number): number | null =>
      n >= minGroupSize ? Math.round(sum / n) : null;

    return {
      window: { from, to, days },
      policy: { minGroupSize, topN },
      bySource: groupCount((r) => r.utm_source ?? DU, topN),
      bySourceMediumCampaign,
      byLandingPath: groupCount((r) => r.landing_path ?? UP, topN),
      byStatus: groupCount((r) => r.status), // bounded by status domain; no topN
      byDay,
      touchPatterns: {
        single_touch, multi_touch, unknown_touch,
        avg_consideration_seconds: gate(considSum, considN),
        avg_time_to_submit_seconds: gate(ttsSum, ttsN),
      },
      totalInWindow: rows.length,
    };
  }
}
