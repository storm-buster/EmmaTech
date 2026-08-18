/**
 * Customer API-key client. Talks ONLY to EmmaTech's same-origin endpoint
 * `/api/organization/api-keys` with the HttpOnly session cookie. The browser
 * never sees the RAPHA service token or any key_hash. The raw key is returned
 * (once) by create/rotate and must be shown to the user immediately and never
 * persisted.
 */
import { AuthApiError } from './authClient';

export interface ApiKeyMetadata {
  id: string;
  name: string;
  scopes: string[];
  created_at: string;
  revoked_at: string | null;
}

export interface ApiKeyCreated {
  api_key: ApiKeyMetadata;
  /** Raw secret — shown once; never stored by the client. */
  raw_key: string;
}

const ENDPOINT = '/api/organization/api-keys';

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function request(method: 'GET' | 'POST', body?: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(ENDPOINT, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    credentials: 'include',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
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

/** List the organization's API keys (metadata only). */
export async function listApiKeys(): Promise<ApiKeyMetadata[]> {
  const data = await request('GET');
  return Array.isArray(data.api_keys) ? (data.api_keys as ApiKeyMetadata[]) : [];
}

/** Create a key; the returned raw_key is shown exactly once. */
export async function createApiKey(input: { name: string; scopes?: string[] }): Promise<ApiKeyCreated> {
  const body: Record<string, unknown> = { action: 'create', name: input.name };
  if (input.scopes) body.scopes = input.scopes;
  return (await request('POST', body)) as unknown as ApiKeyCreated;
}

/** Rotate a key; the returned raw_key (new) is shown exactly once. */
export async function rotateApiKey(keyId: string): Promise<ApiKeyCreated> {
  return (await request('POST', { action: 'rotate', key_id: keyId })) as unknown as ApiKeyCreated;
}

/** Revoke a key; no secret is returned. */
export async function revokeApiKey(keyId: string): Promise<void> {
  await request('POST', { action: 'revoke', key_id: keyId });
}
