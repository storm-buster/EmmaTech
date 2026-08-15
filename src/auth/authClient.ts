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

export async function signup(input: {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}): Promise<AccountResponse> {
  return post('/api/auth/signup', input) as unknown as Promise<AccountResponse>;
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
  return (await parseJson(res)) as unknown as AccountResponse;
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
