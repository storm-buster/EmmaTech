/**
 * Persistence abstraction for EmmaTech Phase 1.
 *
 * EmmaTech OWNS: users, organizations, organization membership, and the
 * association to a RAPHA tenant (rapha_tenant_id). RAPHA owns the tenant and
 * everything beneath it — EmmaTech stores only the association, never a copy.
 */

import type { PlanId } from '../../../src/shared/plans.js';

export type OrgProvisioningStatus = 'pending' | 'active' | 'failed';
export type OrgRole = 'owner' | 'member';

export interface User {
  id: string;
  /** Normalized (trimmed + lowercased) email. Unique. */
  email: string;
  /** scrypt hash — NEVER returned to clients. */
  password_hash: string;
  name: string;
  is_active: boolean;
  /** True once the email is proven (email/password OTP, or provider-verified
   *  OAuth). An unverified email/password account is never created — this flag
   *  is a defense-in-depth guard for the login path. */
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  /** Server-authoritative commercial plan. Defaults to 'free'. */
  plan: PlanId;
  /** True once the customer has made a deliberate initial plan choice (either a
   *  pricing-originated selection carried through signup, or the post-signup
   *  plan-selection modal). Distinguishes "no plan chosen yet" (show the modal)
   *  from an explicit choice (including explicit Free) so the modal is shown
   *  exactly once and never re-applies/overwrites a chosen plan. */
  plan_selected: boolean;
  /** provisioning state of the RAPHA tenant association. */
  status: OrgProvisioningStatus;
  /** RAPHA tenant id; nullable until provisioning succeeds. */
  rapha_tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  user_id: string;
  organization_id: string;
  role: OrgRole;
  created_at: string;
}

export class DuplicateEmailError extends Error {
  constructor() {
    super('An account with this email already exists');
    this.name = 'DuplicateEmailError';
  }
}

export interface CreateUserInput {
  email: string; // must already be normalized
  password_hash: string;
  name: string;
  /** Defaults to false. Set true only for provably-verified identities
   *  (completed email OTP, or provider-verified OAuth). */
  email_verified?: boolean;
}

export interface CreateOrganizationInput {
  name: string;
  status: OrgProvisioningStatus;
  rapha_tenant_id: string | null;
  /** Optional; defaults to 'free' when omitted. */
  plan?: PlanId;
  /** Optional; defaults to false. True when the plan was a deliberate choice. */
  plan_selected?: boolean;
}

/** Pending signup payload carried by an email-OTP challenge. The account is NOT
 *  created until the OTP is verified — this holds everything needed to create
 *  it then. `password_hash` is already a scrypt hash (never a plaintext). */
export interface SignupChallengePayload {
  name: string;
  organization_name: string;
  password_hash: string;
  /** Validated public plan intent, or null for the generic (no-plan) path. */
  requested_plan: string | null;
}

/** A single-use, expiring email verification challenge (OTP). Only a keyed
 *  HMAC digest of the code is stored — never the plaintext code. */
export interface EmailChallenge {
  id: string;
  email: string;
  /** Keyed HMAC digest of the OTP (never the plaintext). */
  code_hash: string;
  expires_at: string;
  attempts: number;
  consumed: boolean;
  payload: SignupChallengePayload;
  created_at: string;
}

export interface CreateEmailChallengeInput {
  email: string; // normalized
  code_hash: string;
  expires_at: string;
  payload: SignupChallengePayload;
}

/** Fields needed to create a verified account from a consumed challenge. */
export interface ConsumeChallengeAccountInput {
  challengeId: string;
  email: string; // normalized
  name: string;
  organizationName: string;
  password_hash: string;
  plan: PlanId;
  plan_selected: boolean;
}

export type ConsumeChallengeResult =
  | { ok: true; user: User; organization: Organization }
  /** The challenge was already consumed, expired, or superseded — no account
   *  was created (single-use / concurrency guard). */
  | { ok: false };

export type ThrottledChallengeResult =
  | { created: true; challenge: EmailChallenge }
  /** A recent challenge for this email is still within the cooldown window. */
  | { throttled: true };

export interface DataStore {
  createUser(input: CreateUserInput): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;

  createOrganization(input: CreateOrganizationInput): Promise<Organization>;
  getOrganizationById(id: string): Promise<Organization | null>;
  updateOrganizationTenant(
    id: string,
    update: { rapha_tenant_id: string | null; status: OrgProvisioningStatus },
  ): Promise<Organization>;
  /**
   * Server/admin-only plan change. Intentionally NOT exposed via any
   * customer-facing endpoint — a customer must never be able to set their plan.
   */
  setOrganizationPlan(id: string, plan: PlanId): Promise<Organization>;
  /**
   * Apply the customer's ONE-TIME initial plan choice: sets `plan` AND marks
   * `plan_selected = true`. The service layer guards that this only runs when
   * the org has not already had a plan chosen.
   */
  setInitialOrganizationPlan(id: string, plan: PlanId): Promise<Organization>;

  createMembership(input: {
    user_id: string;
    organization_id: string;
    role: OrgRole;
  }): Promise<Membership>;
  getMembershipsByUser(userId: string): Promise<Membership[]>;
  /** The user's primary (first/owner) organization membership, if any. */
  getPrimaryMembershipForUser(userId: string): Promise<Membership | null>;

  // ── Email OTP challenges ──────────────────────────────────────────────
  /** Create a new challenge, invalidating any prior active challenge for the
   *  same email (resend supersedes — only one valid code at a time). */
  createEmailChallenge(input: CreateEmailChallengeInput): Promise<EmailChallenge>;
  /**
   * Durable, per-email throttled create: atomically (per email) rejects with
   * `{throttled:true}` when a non-consumed challenge was created within
   * `cooldownMs`; otherwise supersedes any prior active challenge and inserts a
   * new one. Concurrency-safe (serialized per email), so it cannot be bypassed
   * by racing requests, multiple serverless instances, or IP rotation.
   */
  requestChallengeWithThrottle(
    input: CreateEmailChallengeInput,
    cooldownMs: number,
  ): Promise<ThrottledChallengeResult>;
  /** Latest non-consumed challenge for the email (expiry checked by caller). */
  getActiveEmailChallengeByEmail(email: string): Promise<EmailChallenge | null>;
  incrementEmailChallengeAttempts(id: string): Promise<EmailChallenge>;
  consumeEmailChallenge(id: string): Promise<void>;
  /**
   * ATOMICALLY consume the challenge AND create the verified account
   * (user + organization + owner membership) in a single transaction:
   *   - the challenge is consumed only if still active (consumed=false AND not
   *     expired) — this conditional consume is the PRIMARY single-use guard and
   *     serializes concurrent verifications (exactly one account is created);
   *   - if any account write fails, the WHOLE transaction rolls back, so the
   *     challenge is NOT consumed and the user can retry with the same code;
   *   - the users email-unique constraint remains a secondary backstop.
   * RAPHA provisioning is intentionally performed by the caller AFTER this
   * commits, so a provisioning failure never rolls back the local account.
   */
  createAccountConsumingChallenge(input: ConsumeChallengeAccountInput): Promise<ConsumeChallengeResult>;
}
