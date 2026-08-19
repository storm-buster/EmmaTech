/**
 * Frontend auth client. Talks only to EmmaTech's own same-origin /api
 * endpoints. It never sees RAPHA or any server secret — the browser only
 * carries the HttpOnly session cookie, which JS cannot read.
 */

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export type OrgStatus = 'pending' | 'active' | 'failed';

export interface PublicOrganization {
  id: string;
  name: string;
  plan: 'free' | 'starter' | 'growth' | 'perpetual';
  /** True once the customer has made a deliberate initial plan choice. The SPA
   *  shows the plan-selection modal exactly when this is false. */
  plan_selected: boolean;
  status: OrgStatus;
  rapha_tenant_id: string | null;
  created_at: string;
}

export interface Entitlement {
  plan: 'free' | 'starter' | 'growth' | 'perpetual';
  planName: string;
  sensorLimit: number | null;
  decoysEnabled: boolean;
}

export interface AccountResponse {
  user: PublicUser;
  organization: PublicOrganization | null;
  role: 'owner' | 'member' | null;
  entitlement: Entitlement | null;
}

export class AuthApiError extends Error {
  readonly status: number;
  readonly field?: string;
  constructor(status: number, message: string, field?: string) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.field = field;
  }
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function post(path: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new AuthApiError(
      res.status,
      (data.error as string) || 'Request failed',
      data.field as string | undefined,
    );
  }
  return data;
}

/**
 * Phase 1 of email/password signup — request an email OTP. Creates nothing
 * server-side yet; the response is generic (never contains the code). `plan` is
 * a UX intent only.
 */
export async function requestSignupOtp(input: {
  name: string;
  email: string;
  password: string;
  organizationName: string;
  requestedPlan?: string;
}): Promise<void> {
  await post('/api/auth/signup', {
    action: 'request',
    name: input.name,
    organizationName: input.organizationName,
    email: input.email,
    password: input.password,
    requested_plan: input.requestedPlan,
  });
}

/**
 * Phase 2 — verify the OTP. On success the account is created and a session
 * cookie is set; returns the authenticated account.
 */
export async function verifySignupOtp(input: {
  email: string;
  code: string;
}): Promise<AccountResponse> {
  return post('/api/auth/signup', {
    action: 'verify',
    email: input.email,
    code: input.code,
  }) as unknown as Promise<AccountResponse>;
}

/**
 * Apply the ONE-TIME initial plan selection (post-signup modal, generic path).
 * `plan` is a UX intent; the server validates it (public-only; Growth requires
 * a work email) and is authoritative.
 */
export async function selectInitialPlan(plan: string): Promise<void> {
  await post('/api/me', { requested_plan: plan });
}

export type OAuthProvider = 'google' | 'microsoft';

/** Same-origin EmmaTech server route that begins the provider redirect flow.
 *  The browser never talks to Google/Microsoft or RAPHA directly. `plan` is a
 *  UX intent carried into the OAuth `state` server-side (never an entitlement). */
export function oauthStartUrl(provider: OAuthProvider, opts: { plan?: string } = {}): string {
  const params = new URLSearchParams({ provider });
  if (opts.plan) params.set('plan', opts.plan);
  return `/api/auth/oauth/start?${params.toString()}`;
}

/** Begin OAuth by navigating to the same-origin server start route. */
export function startOAuth(provider: OAuthProvider, opts: { plan?: string } = {}): void {
  window.location.assign(oauthStartUrl(provider, opts));
}

export async function login(input: { email: string; password: string }): Promise<AccountResponse> {
  return post('/api/auth/login', input) as unknown as Promise<AccountResponse>;
}

export async function logout(): Promise<void> {
  await post('/api/auth/logout', {});
}

export async function fetchMe(): Promise<AccountResponse | null> {
  const res = await fetch('/api/me', { method: 'GET', credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) throw new AuthApiError(res.status, 'Failed to load account');
  const data = await parseJson(res);
  // A valid authenticated response ALWAYS includes a `user`. Anything else —
  // e.g. a non-JSON body (parseJson returns {}) when the /api layer isn't being
  // executed, or a malformed payload — must be treated as unauthenticated
  // rather than a truthy-but-empty account. This keeps auth-gated UI (Console
  // CTA, Account page) correct and never fabricates a session.
  if (!data || typeof data !== 'object' || !data.user || typeof data.user !== 'object') {
    return null;
  }
  return data as unknown as AccountResponse;
}

export async function retryProvisioning(): Promise<AccountResponse | null> {
  const res = await fetch('/api/organization/provision', {
    method: 'POST',
    credentials: 'include',
  });
  await parseJson(res);
  return fetchMe();
}

export interface EnrollmentCredential {
  /** Raw one-time enrollment token (sensitive). */
  enrollment_token: string;
  token_id: string;
  status: string;
  expires_at: string;
  note: string;
}

/** Request a one-time RAPHA enrollment credential for the current organization. */
export async function generateEnrollmentToken(sensorName?: string): Promise<EnrollmentCredential> {
  const res = await fetch('/api/organization/enrollment-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(sensorName ? { sensor_name: sensorName } : {}),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new AuthApiError(res.status, (data.error as string) || 'Request failed');
  }
  return data as unknown as EnrollmentCredential;
}
