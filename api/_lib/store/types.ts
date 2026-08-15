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
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  /** Server-authoritative commercial plan. Defaults to 'free'. */
  plan: PlanId;
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
}

export interface CreateOrganizationInput {
  name: string;
  status: OrgProvisioningStatus;
  rapha_tenant_id: string | null;
  /** Optional; defaults to 'free' when omitted. */
  plan?: PlanId;
}

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

  createMembership(input: {
    user_id: string;
    organization_id: string;
    role: OrgRole;
  }): Promise<Membership>;
  getMembershipsByUser(userId: string): Promise<Membership[]>;
  /** The user's primary (first/owner) organization membership, if any. */
  getPrimaryMembershipForUser(userId: string): Promise<Membership | null>;
}
