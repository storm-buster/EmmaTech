/**
 * Public "Request Private Access" submission client.
 *
 * Talks ONLY to the same-origin `POST /api/access-requests` endpoint. It is
 * unauthenticated (public form) and returns a discriminated result so the UI can
 * render field-level validation errors, rate-limit notices, and success/failure
 * states without inferring anything beyond the server's response.
 */

export interface AccessRequestForm {
  full_name: string;
  work_email: string;
  organization: string;
  job_title?: string;
  industry: string;
  organization_size?: string;
  country?: string;
  security_challenge: string;
  current_stack?: string;
  deployment_environment?: string;
  evaluation_reason: string;
  additional_context?: string;
}

/** Coarse, first-party acquisition metadata sent alongside (never merged into)
 *  the applicant's PII fields. All fields optional. */
export interface AccessRequestAttribution {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  referrer_domain?: string | null;
  landing_path?: string | null;
  first_touch_at?: string | null;
  last_touch_at?: string | null;
}

export type SubmitAccessRequestResult =
  | { state: 'ok'; id: string; status: string }
  /** 400 — field-level validation errors keyed by field name. */
  | { state: 'invalid'; fields: Record<string, string> }
  /** 429 — rate limited. */
  | { state: 'rate_limited'; retryAfterSec: number }
  /** Transport failure or any unexpected status. */
  | { state: 'error'; message: string };

export async function submitAccessRequest(
  form: AccessRequestForm,
  attribution?: AccessRequestAttribution,
): Promise<SubmitAccessRequestResult> {
  let res: Response;
  try {
    res = await fetch('/api/access-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      // Attribution is coarse acquisition metadata sent as distinct fields —
      // it is NEVER merged into the applicant's PII fields.
      body: JSON.stringify(attribution ? { ...form, ...attribution } : form),
    });
  } catch {
    return { state: 'error', message: 'Unable to reach the server. Please try again.' };
  }

  if (res.status === 201) {
    try {
      const data = (await res.json()) as { id?: string; status?: string };
      if (data?.id) return { state: 'ok', id: data.id, status: data.status ?? 'submitted' };
    } catch {
      /* fall through */
    }
    return { state: 'error', message: 'Unexpected server response.' };
  }

  if (res.status === 400) {
    try {
      const data = (await res.json()) as { fields?: Record<string, string> };
      return { state: 'invalid', fields: data?.fields ?? {} };
    } catch {
      return { state: 'invalid', fields: {} };
    }
  }

  if (res.status === 429) {
    const retry = Number(res.headers.get('Retry-After') ?? '0');
    return { state: 'rate_limited', retryAfterSec: Number.isFinite(retry) ? retry : 0 };
  }

  return { state: 'error', message: 'We could not submit your request. Please try again shortly.' };
}
