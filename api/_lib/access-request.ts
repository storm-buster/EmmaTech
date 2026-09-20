/**
 * Validation + normalization for private-access applications (Phase 1).
 *
 * Shared by the public intake endpoint (api/access-requests.ts) and the admin
 * status endpoint. Produces a fully-sanitized CreateAccessRequestInput (trimmed
 * strings; optional fields normalized to a value or null) so the store layer
 * never sees raw request bodies. Contains NO secrets and performs NO I/O.
 */
import { isBusinessEmail } from '../../src/shared/businessEmail.js';
import { ACCESS_REQUEST_STATUSES, type AccessRequestStatus, type CreateAccessRequestInput } from './store/types.js';

/** Field length bounds (kept generous but abuse-resistant). */
export const ACCESS_REQUEST_LIMITS = {
  full_name: 200,
  work_email: 320,
  organization: 200,
  job_title: 150,
  industry: 100,
  organization_size: 60,
  country: 100,
  security_challenge: 2000,
  current_stack: 2000,
  deployment_environment: 200,
  evaluation_reason: 2000,
  additional_context: 4000,
} as const;

/** Coarse first-party acquisition attribution — UNTRUSTED client input. Each
 *  field is optional, length-bounded, markup-stripped, defaults to null, and
 *  never blocks the submission. Only the defined keys are read. */
const ATTRIBUTION_LIMITS = {
  utm_source: 64,
  utm_medium: 32,
  utm_campaign: 100,
  utm_content: 100,
  referrer_domain: 253,
  landing_path: 512,
} as const;

function attrText(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const s = v.replace(/[\u0000-\u001F\u007F<>"'`\\]/g, '').trim().slice(0, max);
  return s.length > 0 ? s : null;
}

function attrDomain(v: unknown): string | null {
  const s = attrText(v, ATTRIBUTION_LIMITS.referrer_domain);
  if (!s) return null;
  const host = s.toLowerCase();
  return /^[a-z0-9.-]{1,253}$/.test(host) ? host : null;
}

function attrTimestamp(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** Sanitized attribution subset from a raw body (only the defined keys). */
export function sanitizeAttribution(body: Record<string, unknown>): {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  referrer_domain: string | null;
  landing_path: string | null;
  first_touch_at: string | null;
  last_touch_at: string | null;
} {
  return {
    utm_source: attrText(body.utm_source, ATTRIBUTION_LIMITS.utm_source),
    utm_medium: attrText(body.utm_medium, ATTRIBUTION_LIMITS.utm_medium),
    utm_campaign: attrText(body.utm_campaign, ATTRIBUTION_LIMITS.utm_campaign),
    utm_content: attrText(body.utm_content, ATTRIBUTION_LIMITS.utm_content),
    referrer_domain: attrDomain(body.referrer_domain),
    landing_path: attrText(body.landing_path, ATTRIBUTION_LIMITS.landing_path),
    first_touch_at: attrTimestamp(body.first_touch_at),
    last_touch_at: attrTimestamp(body.last_touch_at),
  };
}

export type AccessRequestValidation =
  | { ok: true; value: CreateAccessRequestInput }
  | { ok: false; fields: Record<string, string> };

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Trimmed value, or null when empty (for optional fields). */
function optional(v: unknown, max: number, field: string, errors: Record<string, string>): string | null {
  const s = str(v);
  if (!s) return null;
  if (s.length > max) {
    errors[field] = `Must be at most ${max} characters.`;
    return null;
  }
  return s;
}

/** Required, bounded free-text field. */
function required(v: unknown, max: number, field: string, label: string, errors: Record<string, string>): string {
  const s = str(v);
  if (!s) {
    errors[field] = `${label} is required.`;
    return '';
  }
  if (s.length > max) {
    errors[field] = `Must be at most ${max} characters.`;
    return s.slice(0, max);
  }
  return s;
}

/**
 * Validate + sanitize a raw request body into a CreateAccessRequestInput.
 * work_email must be a syntactically valid, non-consumer (work) email — this is
 * a B2B application, mirroring the Growth signup work-email requirement.
 */
export function validateAccessRequestInput(body: Record<string, unknown>): AccessRequestValidation {
  const errors: Record<string, string> = {};
  const L = ACCESS_REQUEST_LIMITS;

  const full_name = required(body.full_name, L.full_name, 'full_name', 'Full name', errors);
  const workEmailRaw = str(body.work_email);
  let work_email = '';
  if (!workEmailRaw) {
    errors.work_email = 'Work email is required.';
  } else if (workEmailRaw.length > L.work_email) {
    errors.work_email = `Must be at most ${L.work_email} characters.`;
  } else if (!isBusinessEmail(workEmailRaw)) {
    // Rejects malformed emails AND obvious consumer providers.
    errors.work_email = 'Please use a valid work email (not a personal email address).';
  } else {
    work_email = workEmailRaw.toLowerCase();
  }
  const organization = required(body.organization, L.organization, 'organization', 'Organization', errors);
  const industry = required(body.industry, L.industry, 'industry', 'Industry', errors);
  const security_challenge = required(
    body.security_challenge, L.security_challenge, 'security_challenge', 'Primary security challenge', errors,
  );
  const evaluation_reason = required(
    body.evaluation_reason, L.evaluation_reason, 'evaluation_reason', 'Reason for evaluating RAPHA', errors,
  );

  const job_title = optional(body.job_title, L.job_title, 'job_title', errors);
  const organization_size = optional(body.organization_size, L.organization_size, 'organization_size', errors);
  const country = optional(body.country, L.country, 'country', errors);
  const current_stack = optional(body.current_stack, L.current_stack, 'current_stack', errors);
  const deployment_environment = optional(
    body.deployment_environment, L.deployment_environment, 'deployment_environment', errors,
  );
  const additional_context = optional(body.additional_context, L.additional_context, 'additional_context', errors);

  if (Object.keys(errors).length > 0) return { ok: false, fields: errors };

  return {
    ok: true,
    value: {
      full_name,
      work_email,
      organization,
      job_title,
      industry,
      organization_size,
      country,
      security_challenge,
      current_stack,
      deployment_environment,
      evaluation_reason,
      additional_context,
      ...sanitizeAttribution(body),
    },
  };
}

export function isValidAccessRequestStatus(v: unknown): v is AccessRequestStatus {
  return typeof v === 'string' && (ACCESS_REQUEST_STATUSES as readonly string[]).includes(v);
}
