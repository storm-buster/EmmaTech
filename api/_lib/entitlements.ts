/**
 * Server-authoritative entitlement service.
 *
 * Entitlements are derived from the organization's server-stored plan and the
 * canonical plan catalog — never from client input. The frontend may DISPLAY
 * these values but must never determine them.
 *
 * NOTE: this declares entitlement only. Actual sensor/decoy enforcement is
 * owned by RAPHA and is NOT implemented in this phase.
 */
import type { DataStore } from './store/types.js';
import { getPlan, type PlanId } from '../../src/shared/plans.js';

export interface Entitlements {
  plan: PlanId;
  planName: string;
  /** Maximum sensors; null = unlimited. */
  sensorLimit: number | null;
  decoysEnabled: boolean;
}

export function entitlementsForPlan(planId: PlanId): Entitlements {
  const plan = getPlan(planId);
  return {
    plan: plan.id,
    planName: plan.displayName,
    sensorLimit: plan.sensorLimit,
    decoysEnabled: plan.decoysEnabled,
  };
}

export async function getOrganizationEntitlements(
  store: DataStore,
  organizationId: string,
): Promise<Entitlements | null> {
  const org = await store.getOrganizationById(organizationId);
  if (!org) return null;
  return entitlementsForPlan(org.plan);
}
