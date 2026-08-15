/**
 * Canonical plan catalog — the single source of truth for EmmaTech commercial
 * plans. Consumed by BOTH the pricing UI (src) and the server-side entitlement
 * service (api). Contains NO secrets: only display and entitlement values, so
 * it is safe to ship to the browser.
 *
 * EmmaTech owns commercial entitlement (plan → sensor_limit / decoys_enabled).
 * RAPHA owns and (in later phases) enforces actual usage. This catalog only
 * declares entitlement; it does NOT enforce it.
 *
 * STARTER and GROWTH values are the EXACT values already present on the
 * public pricing page prior to Phase 2 (do not change them). FREE is new and
 * fixed by product decision (₹0 / 1 sensor / no decoys).
 */

export type PlanId = 'free' | 'starter' | 'growth' | 'perpetual';

export const DEFAULT_PLAN_ID: PlanId = 'free';

export interface Plan {
  /** Stable machine-readable identifier. */
  id: PlanId;
  displayName: string;
  subtitle: string;
  /** Display price string, e.g. '₹0', '₹18,000'. */
  price: string;
  /** Billing cadence suffix (''=none), e.g. '/node/year'. */
  period: string;
  /** Maximum sensors the plan entitles; null = unlimited. */
  sensorLimit: number | null;
  /** Whether decoys/honeypots are included in the entitlement. */
  decoysEnabled: boolean;
  /** Shown as a purchasable public pricing card. */
  publiclyVisible: boolean;
  /** Handled via contacting EmmaTech (no self-serve public price). */
  contactOnly: boolean;
  /** Highlighted as the recommended public card. */
  popular: boolean;
  /** Marketing feature bullets for the pricing card. */
  features: string[];
  /** Pricing-card call-to-action label. */
  ctaText: string;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    displayName: 'Free',
    subtitle: 'Solo & evaluation',
    price: '₹0',
    period: '',
    sensorLimit: 1,
    decoysEnabled: false,
    publiclyVisible: true,
    contactOnly: false,
    popular: false,
    features: [
      'Exactly 1 sensor',
      'Decoys not included',
      'Real-time behavioral detection',
      'Community support',
    ],
    ctaText: 'Get started',
  },
  // STARTER — preserved verbatim from the pre-Phase-2 pricing page.
  starter: {
    id: 'starter',
    displayName: 'Starter',
    subtitle: 'SMEs & Teams',
    price: '₹18,000',
    period: '/node/year',
    sensorLimit: 20,
    decoysEnabled: true, // card explicitly lists "Lightweight Cowrie decoys"
    publiclyVisible: true,
    contactOnly: false,
    popular: false,
    features: [
      'Up to 20 sensors',
      'Lightweight Cowrie decoys',
      'Real-time SOC dashboard',
      'Email + Slack alert push',
      'Behavioral baseline ML',
      '30-day forensic retention',
    ],
    ctaText: 'Start a pilot',
  },
  // GROWTH — preserved verbatim from the pre-Phase-2 pricing page.
  growth: {
    id: 'growth',
    displayName: 'Growth',
    subtitle: 'Enterprises & MSSPs',
    price: '₹35,000',
    period: '/node/year',
    sensorLimit: null, // "Unlimited sensors"
    // INFERRED: the Growth card does not literally list "decoys", but Growth is
    // the premium superset of Starter (which explicitly includes decoys), so
    // decoys are entitled. Flagged as an inference — confirm with product.
    decoysEnabled: true,
    publiclyVisible: true,
    contactOnly: false,
    popular: true,
    features: [
      'Unlimited sensors',
      'Advanced response policies',
      'SLA-backed support (8h)',
      'Full forensic hash chain',
      'REST + WebSocket APIs',
      'SIEM / XDR integration',
      'MSSP white-label option',
    ],
    ctaText: 'Talk to founder',
  },
  // PERPETUAL — internal entitlement state only. NOT a public pricing card;
  // handled by contacting EmmaTech. Values retained from the former
  // "Regulated" tier for internal reference.
  perpetual: {
    id: 'perpetual',
    displayName: 'Perpetual',
    subtitle: 'Government & PSU',
    price: 'Contact EmmaTech',
    period: '',
    sensorLimit: null,
    decoysEnabled: true,
    publiclyVisible: false,
    contactOnly: true,
    popular: false,
    features: [
      'Isolated / air-gapped deploy',
      'DPDP / RBI / SEBI ready',
      'Forensic export & legal hold',
      'On-prem federated training',
      'Custom policy authoring',
      'Dedicated engineering',
    ],
    ctaText: 'Contact EmmaTech',
  },
};

/** Public, purchasable plans in display order (perpetual is intentionally excluded). */
export const PUBLIC_PLANS: Plan[] = [PLANS.free, PLANS.starter, PLANS.growth].filter(
  (p) => p.publiclyVisible,
);

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}

export function isValidPlanId(value: unknown): value is PlanId {
  return value === 'free' || value === 'starter' || value === 'growth' || value === 'perpetual';
}

/** Bottom-of-pricing notice for perpetual/custom licensing (contact path). */
export const PERPETUAL_NOTICE = {
  heading: 'Need a perpetual or air-gapped license?',
  body: 'Perpetual and custom licensing (including isolated / air-gapped deployments for regulated and government environments) is handled directly by EmmaTech.',
  ctaText: 'Contact EmmaTech',
};

/** Human-readable sensor allowance for display. */
export function formatSensorLimit(limit: number | null): string {
  return limit === null ? 'Unlimited' : String(limit);
}
