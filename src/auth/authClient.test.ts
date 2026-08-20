import { describe, it, expect, afterEach, vi } from 'vitest';
import { generateEnrollmentToken } from './authClient';

function jsonRes(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('authClient.generateEnrollmentToken', () => {
  it('POSTs { sensor_name } to the enrollment-token endpoint when a name is given', async () => {
    const fetchMock = vi.fn(async () =>
      jsonRes(201, { enrollment_token: 'renr_x', token_id: 't1', status: 'active', expires_at: '', note: '' }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await generateEnrollmentToken('web-01');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/organization/enrollment-token');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body as string)).toEqual({ sensor_name: 'web-01' });
    // Never sends a client-supplied tenant_id.
    expect(init.body as string).not.toContain('tenant_id');
  });

  it('remains backwards-compatible with no name (empty body)', async () => {
    const fetchMock = vi.fn(async () =>
      jsonRes(201, { enrollment_token: 'renr_x', token_id: 't1', status: 'active', expires_at: '', note: '' }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await generateEnrollmentToken();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({});
  });
});
