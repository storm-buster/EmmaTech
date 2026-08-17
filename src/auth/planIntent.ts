import { isValidPlanId, type PlanId } from '../shared/plans';

/**
 * Client-side "intended plan" carried from a pricing CTA into the signup flow.
 *
 * Stored in sessionStorage so the intent survives client navigation AND a full
 * OAuth redirect round-trip (same tab / same origin). This is a UX HINT ONLY —
 * it pre-labels signup and drives the Growth work-email requirement. It is NOT
 * an entitlement: the server always sets the authoritative plan (default FREE)
 * regardless of this value, so a tampered value cannot elevate an account.
 */
const KEY = 'emmatech.intendedPlan';

export function setIntendedPlan(plan: PlanId): void {
  try {
    sessionStorage.setItem(KEY, plan);
  } catch {
    /* storage unavailable (private mode / SSR / tests) — intent is optional */
  }
}

export function getIntendedPlan(): PlanId | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw && isValidPlanId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function clearIntendedPlan(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
