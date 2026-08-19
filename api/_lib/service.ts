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

  // Growth is a B2B plan → require a work (non-consumer) email. This validates
  // the CLIENT-SUPPLIED intent for UX correctness.
  const requestedPlan = typeof input.requestedPlan === 'string' ? input.requestedPlan : undefined;
  if (requestedPlan === 'growth' && isConsumerEmailDomain(email)) {
    throw new ValidationError('email', WORK_EMAIL_REQUIRED_MESSAGE);
  }

  // Pre-billing: a NEW organization is granted the selected PUBLIC plan
  // immediately (validated server-side; never trust client state blindly).
  // Unknown/invalid → FREE; `perpetual` is not publicly selectable → FREE.
  // A future billing gate will be inserted here before activating paid plans;
  // the organization.plan → entitlementsForPlan → provisioning path is unchanged.
  const plan = resolveSignupPlan(input.requestedPlan);

  // Idempotency: never create duplicate accounts.
  const existing = await store.getUserByEmail(email);
  if (existing) throw new DuplicateEmailError();

  const password_hash = await hashPassword(password);
  const user = await store.createUser({ email, password_hash, name });
  let organization = await store.createOrganization({
    name: organizationName,
    // Server-authoritative, validated plan for the new organization.
    plan,
    status: 'pending',
    rapha_tenant_id: null,
  });
  await store.createMembership({
    user_id: user.id,
    organization_id: organization.id,
    role: 'owner',
  });
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
 * Resolve an OAuth (Google/Microsoft) identity into the SAME account/org/session
 * model as email/password users. Find-or-create by (provider-verified) email:
 * existing users are linked (no duplicate account system); new users are created
 * with a non-verifiable password sentinel (password login impossible) + org +
 * owner membership + RAPHA provisioning. Entitlement stays server-authoritative
 * (org.plan = DEFAULT_PLAN_ID); the OAuth `plan` intent never grants entitlement.
 */
export async function findOrCreateOAuthUser(
  store: DataStore,
  cfg: AppConfig,
  input: { email: unknown; name?: unknown; provider: 'google' | 'microsoft' },
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

  const user = await store.createUser({ email, password_hash: `oauth:${input.provider}`, name });
  let organization = await store.createOrganization({
    name,
    plan: DEFAULT_PLAN_ID,
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
