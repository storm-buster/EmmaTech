/**
 * Service orchestration for EmmaTech Phase 1.
 *
 * Contains the business logic (independent of HTTP framing) so it can be unit
 * tested directly: signup, login, account lookup, and RAPHA tenant
 * provisioning with explicit failure/idempotency handling.
 */
import type { AppConfig } from './config.js';
import { logError, logInfo } from './log.js';
import { RaphaError, RaphaServiceClient } from './rapha.js';
import { entitlementsForPlan } from './entitlements.js';
import type { DataStore, Organization, OrgRole, User } from './store/types.js';
import { DuplicateEmailError } from './store/types.js';
import { DEFAULT_PLAN_ID, getPlan, isValidPlanId, type PlanId } from '../../src/shared/plans.js';
import { isConsumerEmailDomain, WORK_EMAIL_REQUIRED_MESSAGE } from '../../src/shared/businessEmail.js';
import {
  generateOtpCode,
  hashOtpCode,
  isOtpExpired,
  otpExpiryFrom,
  OTP_MAX_ATTEMPTS,
  OTP_REQUEST_COOLDOWN_MS,
  verifyOtpCode,
} from './otp.js';
import type { EmailSender } from './email.js';

// ---- Validation ----------------------------------------------------------

export class ValidationError extends Error {
  readonly field: string;
  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 10;
const MAX_PASSWORD = 200;

export function normalizeEmail(email: unknown): string {
  if (typeof email !== 'string') throw new ValidationError('email', 'Email is required');
  const normalized = email.trim().toLowerCase();
  if (!normalized || normalized.length > 254 || !EMAIL_RE.test(normalized)) {
    throw new ValidationError('email', 'Enter a valid email address');
  }
  return normalized;
}

export function validatePassword(password: unknown): string {
  if (typeof password !== 'string') throw new ValidationError('password', 'Password is required');
  if (password.length < MIN_PASSWORD) {
    throw new ValidationError('password', `Password must be at least ${MIN_PASSWORD} characters`);
  }
  if (password.length > MAX_PASSWORD) {
    throw new ValidationError('password', 'Password is too long');
  }
  return password;
}

function validateName(name: unknown, field: string, max: number): string {
  if (typeof name !== 'string') throw new ValidationError(field, `${field} is required`);
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > max) {
    throw new ValidationError(field, `${field} must be between 1 and ${max} characters`);
  }
  return trimmed;
}

// ---- Safe serializers (never expose secrets) -----------------------------

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface PublicOrganization {
  id: string;
  name: string;
  plan: PlanId;
  /** True once the customer has made a deliberate initial plan choice. The SPA
   *  shows the plan-selection modal exactly when this is false. */
  plan_selected: boolean;
  status: Organization['status'];
  rapha_tenant_id: string | null;
  created_at: string;
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, created_at: user.created_at };
}

export function toPublicOrganization(org: Organization): PublicOrganization {
  return {
    id: org.id,
    name: org.name,
    plan: org.plan,
    plan_selected: org.plan_selected,
    status: org.status,
    rapha_tenant_id: org.rapha_tenant_id,
    created_at: org.created_at,
  };
}

// ---- Provisioning --------------------------------------------------------

export interface ProvisionResult {
  organization: Organization;
  outcome: 'active' | 'conflict' | 'failed' | 'noop';
}

/**
 * Provision (or re-provision) the RAPHA tenant for an organization.
 *
 * Idempotent: uses external_customer_id = organization.id, which RAPHA
 * de-duplicates. Already-active organizations are a no-op. Failures are
 * recorded as an explicit org status (never silently reported as success).
 */
export async function provisionOrganizationTenant(
  store: DataStore,
  cfg: AppConfig,
  org: Organization,
  requestId?: string,
): Promise<ProvisionResult> {
  if (org.status === 'active' && org.rapha_tenant_id) {
    return { organization: org, outcome: 'noop' };
  }

  const client = new RaphaServiceClient(cfg);
  try {
    const tenant = await client.provisionTenant({
      name: org.name,
      external_customer_id: org.id,
    });

    // Synchronize the authoritative plan entitlement into RAPHA so it enforces
    // the correct sensor_limit + decoys for this organization. If the tenant
    // was created but capability sync fails, we do NOT report success: preserve
    // the tenant id and mark the org 'failed' so a controlled retry re-syncs.
    const ent = entitlementsForPlan(org.plan);
    try {
      await client.syncTenantCapabilities(tenant.tenant_id, {
        plan: org.plan,
        sensorLimit: ent.sensorLimit,
        decoysEnabled: ent.decoysEnabled,
      });
    } catch (syncErr) {
      const skind = syncErr instanceof RaphaError ? syncErr.kind : 'upstream';
      const partial = await store.updateOrganizationTenant(org.id, {
        rapha_tenant_id: tenant.tenant_id,
        status: 'failed',
      });
      logError({
        requestId,
        organizationId: org.id,
        raphaTenantId: tenant.tenant_id,
        operation: 'rapha.capability_sync',
        status: 'failure',
        outcome: `rapha_${skind}`,
      });
      return { organization: partial, outcome: 'failed' };
    }

    const updated = await store.updateOrganizationTenant(org.id, {
      rapha_tenant_id: tenant.tenant_id,
      status: 'active',
    });
    logInfo({
      requestId,
      organizationId: org.id,
      raphaTenantId: tenant.tenant_id,
      operation: 'rapha.provision',
      status: 'success',
    });
    return { organization: updated, outcome: 'active' };
  } catch (err) {
    const kind = err instanceof RaphaError ? err.kind : 'upstream';
    if (kind === 'conflict') {
      // RAPHA already has a tenant for this external_customer_id. Keep any
      // known association; mark active if we have the id, else leave pending
      // for a controlled retry/reconcile (never fabricate a tenant id).
      const status = org.rapha_tenant_id ? 'active' : 'pending';
      const updated = await store.updateOrganizationTenant(org.id, {
        rapha_tenant_id: org.rapha_tenant_id,
        status,
      });
      logInfo({
        requestId,
        organizationId: org.id,
        raphaTenantId: org.rapha_tenant_id,
        operation: 'rapha.provision',
        status: 'success',
        outcome: 'rapha_conflict',
      });
      return { organization: updated, outcome: 'conflict' };
    }
    // auth / validation / config / unavailable / upstream -> retryable failure.
    const updated = await store.updateOrganizationTenant(org.id, {
      rapha_tenant_id: org.rapha_tenant_id ?? null,
      status: 'failed',
    });
    logError({
      requestId,
      organizationId: org.id,
      operation: 'rapha.provision',
      status: 'failure',
      outcome: `rapha_${kind}`,
    });
    return { organization: updated, outcome: 'failed' };
  }
}

// ---- Signup / Login / Account -------------------------------------------

export interface SignupInput {
  email: unknown;
  password: unknown;
  name: unknown;
  organizationName: unknown;
  /** Client UX intent from the pricing page. NEVER used as an entitlement:
   *  the org is always created on the server-authoritative default plan. */
  requestedPlan?: unknown;
}

export interface SignupResult {
  user: User;
  organization: Organization;
  role: OrgRole;
}

/**
 * Create a user, their organization, an owner membership, and attempt RAPHA
 * provisioning. The account is always created; the RAPHA tenant association is
 * reflected by organization.status (active | pending | failed) so success is
 * never reported when the tenant was not created.
 */
/**
 * Resolve the organization plan for a NEW signup from the client-supplied
 * `requested_plan`. Server-authoritative and validated:
 *   - missing / non-string / unknown id → FREE (default)
 *   - only PUBLICLY-selectable plans (free/starter/growth) may be self-selected
 *   - `perpetual` (publiclyVisible: false) is never granted via public signup → FREE
 * Pre-billing: the selected public plan is granted immediately. A future billing
 * gate can wrap this without changing the plan/entitlement/provisioning model.
 */
function resolveSignupPlan(requested: unknown): PlanId {
  if (typeof requested !== 'string' || !isValidPlanId(requested)) return DEFAULT_PLAN_ID;
  const plan = getPlan(requested);
  return plan.publiclyVisible ? plan.id : DEFAULT_PLAN_ID;
}

/**
 * Whether the client carried a DELIBERATE plan selection (any valid plan id,
 * including explicit 'free'), as opposed to no plan at all (null/undefined →
 * the generic path that must show the post-signup plan-selection modal).
 * Drives `organization.plan_selected` so the modal appears exactly once and the
 * "explicit Free" state is never collapsed into "no plan".
 */
function isExplicitSelection(requested: unknown): boolean {
  return typeof requested === 'string' && isValidPlanId(requested);
}

/**
 * Create the fully-verified account: user (email_verified) + organization
 * (server-authoritative plan) + owner membership + RAPHA provisioning. Shared
 * by the immediate `signup()` (tests/internal) and the OTP `verifySignupOtp()`
 * path. `password_hash` is already a scrypt hash.
 */
async function createVerifiedAccount(
  store: DataStore,
  cfg: AppConfig,
  args: {
    email: string;
    name: string;
    organizationName: string;
    password_hash: string;
    plan: PlanId;
    plan_selected: boolean;
  },
  requestId?: string,
): Promise<SignupResult> {
  const existing = await store.getUserByEmail(args.email);
  if (existing) throw new DuplicateEmailError();

  const user = await store.createUser({
    email: args.email,
    password_hash: args.password_hash,
    name: args.name,
    email_verified: true,
  });
  let organization = await store.createOrganization({
    name: args.organizationName,
    plan: args.plan,
    plan_selected: args.plan_selected,
    status: 'pending',
    rapha_tenant_id: null,
  });
  await store.createMembership({ user_id: user.id, organization_id: organization.id, role: 'owner' });
  logInfo({
    requestId,
    userId: user.id,
    organizationId: organization.id,
    operation: 'account.signup',
    status: 'success',
  });
  const provision = await provisionOrganizationTenant(store, cfg, organization, requestId);
  organization = provision.organization;
  return { user, organization, role: 'owner' };
}

/**
 * Immediate account creation (no OTP). Retained for internal/service use and
 * unit tests; the HTTP signup route now goes through requestSignupOtp →
 * verifySignupOtp. The account is created email_verified.
 */
export async function signup(
  store: DataStore,
  cfg: AppConfig,
  input: SignupInput,
  hashPassword: (pw: string) => Promise<string>,
  requestId?: string,
): Promise<SignupResult> {
  const email = normalizeEmail(input.email);
  const password = validatePassword(input.password);
  const name = validateName(input.name, 'name', 100);
  const organizationName = validateName(input.organizationName, 'organizationName', 200);

  const requestedPlan = typeof input.requestedPlan === 'string' ? input.requestedPlan : undefined;
  if (requestedPlan === 'growth' && isConsumerEmailDomain(email)) {
    throw new ValidationError('email', WORK_EMAIL_REQUIRED_MESSAGE);
  }
  const plan = resolveSignupPlan(input.requestedPlan);
  const plan_selected = isExplicitSelection(input.requestedPlan);

  const existing = await store.getUserByEmail(email);
  if (existing) throw new DuplicateEmailError();

  const password_hash = await hashPassword(password);
  return createVerifiedAccount(
    store,
    cfg,
    { email, name, organizationName, password_hash, plan, plan_selected },
    requestId,
  );
}

// ---- Email OTP signup (two-phase) ---------------------------------------

/**
 * Phase 1 — request an email OTP for a NEW email/password signup. Validates the
 * input, then (enumeration-safe) either stores a single-use challenge with the
 * PENDING account payload and dispatches the code, or — if the email already
 * has an account — does nothing. No user/org/session/plan is created here. The
 * OTP plaintext is never returned or logged. Resend supersedes any prior code.
 */
export async function requestSignupOtp(
  store: DataStore,
  cfg: AppConfig,
  input: SignupInput,
  hashPassword: (pw: string) => Promise<string>,
  sender: EmailSender,
  requestId?: string,
): Promise<void> {
  const email = normalizeEmail(input.email);
  const password = validatePassword(input.password);
  const name = validateName(input.name, 'name', 100);
  const organizationName = validateName(input.organizationName, 'organizationName', 200);

  const requestedPlan = typeof input.requestedPlan === 'string' ? input.requestedPlan : undefined;
  if (requestedPlan === 'growth' && isConsumerEmailDomain(email)) {
    throw new ValidationError('email', WORK_EMAIL_REQUIRED_MESSAGE);
  }

  // Enumeration-safe: if an account already exists, silently stop (the handler
  // returns the same generic response). Do not send a code or reveal existence.
  const existing = await store.getUserByEmail(email);
  if (existing) {
    logInfo({ requestId, operation: 'account.otp_request', status: 'success', outcome: 'noop_existing' });
    return;
  }

  const password_hash = await hashPassword(password);
  const code = generateOtpCode();
  const code_hash = hashOtpCode(code, email, cfg.sessionSecret);
  // Durable, per-email throttle (survives instance changes / IP rotation). A
  // request within the cooldown returns the SAME generic response WITHOUT
  // sending — never revealing throttle/account state.
  const result = await store.requestChallengeWithThrottle(
    {
      email,
      code_hash,
      expires_at: otpExpiryFrom(),
      payload: {
        name,
        organization_name: organizationName,
        password_hash,
        requested_plan: requestedPlan ?? null,
      },
    },
    OTP_REQUEST_COOLDOWN_MS,
  );
  if (!result.created) {
    logInfo({ requestId, operation: 'account.otp_request', status: 'success', outcome: 'throttled' });
    return;
  }
  await sender.sendOtp(email, code); // sender never logs/echoes the code
  logInfo({ requestId, operation: 'account.otp_request', status: 'success', outcome: 'dispatched' });
}

const OTP_GENERIC_ERROR = 'The verification code is invalid or has expired.';

/**
 * Phase 2 — verify the OTP and, only on success, create the verified account
 * from the challenge's pending payload (preserving the requested plan). Wrong
 * codes increment a bounded attempt counter; exceeding the limit locks the
 * challenge. Uses generic errors to avoid leaking which step failed.
 */
export async function verifySignupOtp(
  store: DataStore,
  cfg: AppConfig,
  input: { email: unknown; code: unknown },
  requestId?: string,
): Promise<SignupResult> {
  const email = normalizeEmail(input.email);
  const code = typeof input.code === 'string' ? input.code.trim() : '';
  if (!/^\d{6}$/.test(code)) throw new ValidationError('code', OTP_GENERIC_ERROR);

  const challenge = await store.getActiveEmailChallengeByEmail(email);
  if (!challenge) throw new ValidationError('code', OTP_GENERIC_ERROR);
  if (isOtpExpired(challenge.expires_at)) throw new ValidationError('code', OTP_GENERIC_ERROR);
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    throw new ValidationError('code', 'Too many incorrect attempts. Please request a new code.');
  }

  const ok = verifyOtpCode(code, email, cfg.sessionSecret, challenge.code_hash);
  if (!ok) {
    const updated = await store.incrementEmailChallengeAttempts(challenge.id);
    // Lock the challenge once the attempt ceiling is reached (brute-force stop).
    if (updated.attempts >= OTP_MAX_ATTEMPTS) await store.consumeEmailChallenge(challenge.id);
    throw new ValidationError('code', OTP_GENERIC_ERROR);
  }

  // Correct code. Consume + create the account ATOMICALLY in one transaction:
  // the conditional consume is the single-use guard (serializes concurrent
  // verifications → exactly one account), and if any write fails the whole
  // transaction rolls back so the challenge stays usable (retryable). RAPHA
  // provisioning is done AFTER the commit so it can never orphan the account.
  const plan = resolveSignupPlan(challenge.payload.requested_plan);
  const plan_selected = isExplicitSelection(challenge.payload.requested_plan);
  const created = await store.createAccountConsumingChallenge({
    challengeId: challenge.id,
    email,
    name: challenge.payload.name,
    organizationName: challenge.payload.organization_name,
    password_hash: challenge.payload.password_hash,
    plan,
    plan_selected,
  });
  if (!created.ok) {
    // The challenge was consumed/expired/superseded by a concurrent request.
    throw new ValidationError('code', OTP_GENERIC_ERROR);
  }

  logInfo({
    requestId,
    userId: created.user.id,
    organizationId: created.organization.id,
    operation: 'account.signup',
    status: 'success',
  });
  const provision = await provisionOrganizationTenant(store, cfg, created.organization, requestId);
  return { user: created.user, organization: provision.organization, role: 'owner' };
}

/** Raised when a customer tries to set their initial plan after it was chosen. */
export class PlanAlreadySelectedError extends Error {
  constructor() {
    super('A plan has already been selected for this organization');
    this.name = 'PlanAlreadySelectedError';
  }
}

/**
 * Re-sync the RAPHA tenant capabilities to the organization's CURRENT plan.
 * Active tenants are synced in place; not-yet-active orgs are provisioned now
 * (which syncs the plan). Failures mark the org 'failed' for a controlled retry.
 */
async function syncEntitlementForPlan(
  store: DataStore,
  cfg: AppConfig,
  org: Organization,
  requestId?: string,
): Promise<Organization> {
  if (org.status === 'active' && org.rapha_tenant_id) {
    const ent = entitlementsForPlan(org.plan);
    try {
      await new RaphaServiceClient(cfg).syncTenantCapabilities(org.rapha_tenant_id, {
        plan: org.plan,
        sensorLimit: ent.sensorLimit,
        decoysEnabled: ent.decoysEnabled,
      });
      return org;
    } catch (err) {
      const kind = err instanceof RaphaError ? err.kind : 'upstream';
      logError({
        requestId,
        organizationId: org.id,
        operation: 'rapha.capability_sync',
        status: 'failure',
        outcome: `rapha_${kind}`,
      });
      return store.updateOrganizationTenant(org.id, {
        rapha_tenant_id: org.rapha_tenant_id,
        status: 'failed',
      });
    }
  }
  return (await provisionOrganizationTenant(store, cfg, org, requestId)).organization;
}

/**
 * Apply the customer's ONE-TIME initial plan selection (the post-signup modal
 * for the generic/no-plan path). Server-authoritative:
 *   - only the caller's OWN owner organization is affected;
 *   - fails with PlanAlreadySelectedError if a plan was already chosen (never
 *     downgrades/overwrites an existing selection or the PR#10 OAuth grant);
 *   - the plan is validated via resolveSignupPlan (public-only; invalid/
 *     perpetual → Free); Growth requires a work email (consumer-domain Growth
 *     fails safe to Free);
 *   - re-syncs the RAPHA entitlement to the chosen plan.
 */
export async function selectInitialPlan(
  store: DataStore,
  cfg: AppConfig,
  userId: string,
  requestedPlan: unknown,
  requestId?: string,
): Promise<Organization> {
  const user = await store.getUserById(userId);
  if (!user) throw new ValidationError('account', 'Account not found');
  const membership = await store.getPrimaryMembershipForUser(userId);
  const org = membership ? await store.getOrganizationById(membership.organization_id) : null;
  if (!membership || membership.role !== 'owner' || !org) {
    throw new ValidationError('organization', 'No organization is available to update');
  }
  if (org.plan_selected) throw new PlanAlreadySelectedError();

  // Growth requires a work email; a consumer-domain Growth intent fails safe to
  // Free (same rule as signup/OAuth, without throwing).
  const effective =
    typeof requestedPlan === 'string' && requestedPlan === 'growth' && isConsumerEmailDomain(user.email)
      ? undefined
      : requestedPlan;
  const plan = resolveSignupPlan(effective);
  const updated = await store.setInitialOrganizationPlan(org.id, plan);
  return syncEntitlementForPlan(store, cfg, updated, requestId);
}

/**
 * Resolve an OAuth (Google/Microsoft) identity into the SAME account/org/session
 * model as email/password users. Find-or-create by (provider-verified) email:
 * existing users are linked (no duplicate account system); new users are created
 * with a non-verifiable password sentinel (password login impossible) + org +
 * owner membership + RAPHA provisioning. A NEW organization is granted the
 * validated public plan carried from the pricing page (reusing the same
 * server-side resolveSignupPlan validator as email/password signup):
 * unknown/invalid or non-public plans → FREE, and Growth requires a work email
 * (a consumer-domain Growth intent fails safe to FREE rather than aborting an
 * already-authenticated login). EXISTING users are only linked — their
 * organization.plan is NEVER changed here.
 */
export async function findOrCreateOAuthUser(
  store: DataStore,
  cfg: AppConfig,
  input: { email: unknown; name?: unknown; provider: 'google' | 'microsoft'; plan?: unknown },
  requestId?: string,
): Promise<{ user: User; organization: Organization | null; created: boolean }> {
  const email = normalizeEmail(input.email);
  const rawName = typeof input.name === 'string' && input.name.trim() ? input.name : email.split('@')[0];
  const name = validateName(rawName, 'name', 100);

  const existing = await store.getUserByEmail(email);
  if (existing) {
    const membership = await store.getPrimaryMembershipForUser(existing.id);
    const organization = membership ? await store.getOrganizationById(membership.organization_id) : null;
    return { user: existing, organization, created: false };
  }

  // NEW organization: grant the validated PUBLIC plan selected on the pricing
  // page. Growth is B2B → a consumer-domain email fails safe to FREE (the same
  // work-email restriction as signup, but without throwing since the user is
  // already authenticated via OAuth). Plan validation is NOT duplicated — it
  // reuses resolveSignupPlan (public-only; unknown/invalid/perpetual → FREE).
  const requestedPlan =
    typeof input.plan === 'string' && input.plan === 'growth' && isConsumerEmailDomain(email)
      ? undefined
      : input.plan;
  const plan = resolveSignupPlan(requestedPlan);
  // Did the flow carry a deliberate plan selection? Drives plan_selected so the
  // post-signup modal shows ONLY for the generic (no-plan) OAuth path.
  const plan_selected = isExplicitSelection(input.plan);

  // OAuth identity is provider-verified — the account is created email_verified.
  const user = await store.createUser({
    email,
    password_hash: `oauth:${input.provider}`,
    name,
    email_verified: true,
  });
  let organization = await store.createOrganization({
    name,
    plan,
    plan_selected,
    status: 'pending',
    rapha_tenant_id: null,
  });
  await store.createMembership({ user_id: user.id, organization_id: organization.id, role: 'owner' });
  logInfo({ requestId, userId: user.id, organizationId: organization.id, operation: 'account.oauth_signup', status: 'success' });
  const provision = await provisionOrganizationTenant(store, cfg, organization, requestId);
  organization = provision.organization;
  return { user, organization, created: true };
}

export interface LoginInput {
  email: unknown;
  password: unknown;
}

/** Returns the user on valid credentials, otherwise null (no info leak). */
export async function login(
  store: DataStore,
  input: LoginInput,
  verifyPassword: (pw: string, hash: string) => Promise<boolean>,
): Promise<User | null> {
  let email: string;
  try {
    email = normalizeEmail(input.email);
  } catch {
    return null;
  }
  if (typeof input.password !== 'string' || !input.password) return null;

  const user = await store.getUserByEmail(email);
  if (!user || !user.is_active) return null;
  // Defense-in-depth: an email/password account is only ever created after OTP
  // verification, but never allow an unverified account to authenticate.
  if (!user.email_verified) return null;
  const ok = await verifyPassword(input.password, user.password_hash);
  return ok ? user : null;
}

export interface Account {
  user: User;
  organization: Organization | null;
  role: OrgRole | null;
}

/**
 * Resolve the account for an authenticated user. Only the caller's own
 * organization (via membership) is ever returned — this enforces
 * cross-organization isolation, since no arbitrary org id is accepted.
 */
export async function getAccountForUser(store: DataStore, userId: string): Promise<Account | null> {
  const user = await store.getUserById(userId);
  if (!user) return null;
  const membership = await store.getPrimaryMembershipForUser(userId);
  if (!membership) return { user, organization: null, role: null };
  const organization = await store.getOrganizationById(membership.organization_id);
  return { user, organization, role: membership.role };
}
