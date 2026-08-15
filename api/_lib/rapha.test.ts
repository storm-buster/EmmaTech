import { describe, it, expect, afterEach, vi } from 'vitest';
import type { AppConfig } from './config.js';
import { RaphaError, RaphaServiceClient } from './rapha.js';

const SERVICE_TOKEN = 'super-secret-service-token-value';

function cfg(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    isProduction: false,
    sessionSecret: 'x',
    raphaBaseUrl: 'https://rapha.test',
    raphaServiceToken: SERVICE_TOKEN,
    databaseUrl: null,
    ...overrides,
  };
}

const OK_TENANT = {
  tenant_id: 'tenant-abc',
  name: 'Acme',
  external_customer_id: 'org-1',
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

function mockFetch(status: number, body: unknown) {
  return vi.fn(async () => ({ status, ok: status < 400, json: async () => body }));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('RaphaServiceClient.provisionTenant', () => {
  it('sends X-Service-Token and the exact contract body, returns tenant on 201', async () => {
    const fetchMock = mockFetch(201, OK_TENANT);
    vi.stubGlobal('fetch', fetchMock);

    const client = new RaphaServiceClient(cfg());
    const tenant = await client.provisionTenant({ name: 'Acme', external_customer_id: 'org-1' });

    expect(tenant.tenant_id).toBe('tenant-abc');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rapha.test/api/v1/service/tenants');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Service-Token']).toBe(SERVICE_TOKEN);
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Acme', external_customer_id: 'org-1' });
  });

  it('maps 401 and 403 to auth errors', async () => {
    for (const status of [401, 403]) {
      vi.stubGlobal('fetch', mockFetch(status, {}));
      const client = new RaphaServiceClient(cfg());
      await expect(
        client.provisionTenant({ name: 'A', external_customer_id: 'o' }),
      ).rejects.toMatchObject({ kind: 'auth' });
    }
  });

  it('maps 409 to a conflict error', async () => {
    vi.stubGlobal('fetch', mockFetch(409, {}));
    const client = new RaphaServiceClient(cfg());
    await expect(
      client.provisionTenant({ name: 'A', external_customer_id: 'o' }),
    ).rejects.toMatchObject({ kind: 'conflict' });
  });

  it('maps 422 to a validation error', async () => {
    vi.stubGlobal('fetch', mockFetch(422, {}));
    const client = new RaphaServiceClient(cfg());
    await expect(
      client.provisionTenant({ name: 'A', external_customer_id: 'o' }),
    ).rejects.toMatchObject({ kind: 'validation' });
  });

  it('maps 5xx to an upstream error', async () => {
    vi.stubGlobal('fetch', mockFetch(500, {}));
    const client = new RaphaServiceClient(cfg());
    await expect(
      client.provisionTenant({ name: 'A', external_customer_id: 'o' }),
    ).rejects.toMatchObject({ kind: 'upstream' });
  });

  it('maps a network failure to an unavailable error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('network down');
      }),
    );
    const client = new RaphaServiceClient(cfg());
    await expect(
      client.provisionTenant({ name: 'A', external_customer_id: 'o' }),
    ).rejects.toMatchObject({ kind: 'unavailable' });
  });

  it('fails closed on missing configuration', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const client = new RaphaServiceClient(cfg({ raphaServiceToken: '' }));
    await expect(
      client.provisionTenant({ name: 'A', external_customer_id: 'o' }),
    ).rejects.toMatchObject({ kind: 'config' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requires HTTPS in production', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const client = new RaphaServiceClient(
      cfg({ isProduction: true, raphaBaseUrl: 'http://rapha.test' }),
    );
    await expect(
      client.provisionTenant({ name: 'A', external_customer_id: 'o' }),
    ).rejects.toMatchObject({ kind: 'config' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never includes the service token in thrown error messages', async () => {
    vi.stubGlobal('fetch', mockFetch(500, {}));
    const client = new RaphaServiceClient(cfg());
    try {
      await client.provisionTenant({ name: 'A', external_customer_id: 'o' });
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RaphaError);
      expect((err as Error).message).not.toContain(SERVICE_TOKEN);
      expect(JSON.stringify(err instanceof RaphaError ? { m: err.message, k: err.kind } : {})).not.toContain(
        SERVICE_TOKEN,
      );
    }
  });
});

const OK_ENROLLMENT = {
  token_id: 'tok_1',
  tenant_id: 'tenant-1',
  enrollment_token: 'renr_rawsecrettoken',
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  expires_at: '2026-01-02T00:00:00Z',
};

describe('RaphaServiceClient.createEnrollmentToken', () => {
  it('POSTs to the tenant enrollment-tokens path with X-Service-Token and returns the token', async () => {
    const fetchMock = mockFetch(201, OK_ENROLLMENT);
    vi.stubGlobal('fetch', fetchMock);

    const client = new RaphaServiceClient(cfg());
    const token = await client.createEnrollmentToken('tenant-1', { sensor_name: 'edge-01' });

    expect(token.enrollment_token).toBe('renr_rawsecrettoken');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rapha.test/api/v1/service/tenants/tenant-1/enrollment-tokens');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['X-Service-Token']).toBe(SERVICE_TOKEN);
    // Omits expires_in_seconds by default (RAPHA applies its own TTL).
    const sent = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(sent).toEqual({ sensor_name: 'edge-01' });
  });

  it('url-encodes the tenant id', async () => {
    const fetchMock = mockFetch(201, OK_ENROLLMENT);
    vi.stubGlobal('fetch', fetchMock);
    await new RaphaServiceClient(cfg()).createEnrollmentToken('a b/c');
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/tenants/a%20b%2Fc/enrollment-tokens');
  });

  it('maps RAPHA statuses (404→not_found, 401→auth, 429→rate_limited, 422→validation, 5xx→upstream)', async () => {
    const cases: Array<[number, string]> = [
      [404, 'not_found'],
      [401, 'auth'],
      [403, 'auth'],
      [429, 'rate_limited'],
      [422, 'validation'],
      [503, 'upstream'],
    ];
    for (const [status, kind] of cases) {
      vi.stubGlobal('fetch', mockFetch(status, {}));
      await expect(
        new RaphaServiceClient(cfg()).createEnrollmentToken('tenant-1'),
      ).rejects.toMatchObject({ kind });
    }
  });

  it('maps network failure to unavailable and never leaks the token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('down');
      }),
    );
    try {
      await new RaphaServiceClient(cfg()).createEnrollmentToken('tenant-1');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toMatchObject({ kind: 'unavailable' });
      expect((err as Error).message).not.toContain(SERVICE_TOKEN);
    }
  });

  it('fails closed when unconfigured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      new RaphaServiceClient(cfg({ raphaServiceToken: '' })).createEnrollmentToken('tenant-1'),
    ).rejects.toMatchObject({ kind: 'config' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

const OK_CAPABILITY = {
  tenant_id: 'tenant-1',
  external_customer_id: 'org-1',
  plan: 'starter',
  sensor_limit: 20,
  decoys_enabled: true,
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('RaphaServiceClient.syncTenantCapabilities', () => {
  it('PATCHes the capabilities path with X-Service-Token and the plan/limit/decoys body', async () => {
    const fetchMock = mockFetch(200, OK_CAPABILITY);
    vi.stubGlobal('fetch', fetchMock);

    const view = await new RaphaServiceClient(cfg()).syncTenantCapabilities('tenant-1', {
      plan: 'starter',
      sensorLimit: 20,
      decoysEnabled: true,
    });

    expect(view.sensor_limit).toBe(20);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rapha.test/api/v1/service/tenants/tenant-1/capabilities');
    expect(init.method).toBe('PATCH');
    expect((init.headers as Record<string, string>)['X-Service-Token']).toBe(SERVICE_TOKEN);
    expect(JSON.parse(init.body as string)).toEqual({
      plan: 'starter',
      sensor_limit: 20,
      decoys_enabled: true,
    });
  });

  it('maps a null sensor limit to the string "unlimited" (growth/perpetual)', async () => {
    const fetchMock = mockFetch(200, { ...OK_CAPABILITY, plan: 'growth', sensor_limit: null });
    vi.stubGlobal('fetch', fetchMock);
    await new RaphaServiceClient(cfg()).syncTenantCapabilities('tenant-1', {
      plan: 'growth',
      sensorLimit: null,
      decoysEnabled: true,
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).sensor_limit).toBe('unlimited');
  });

  it('maps RAPHA statuses (404→not_found, 401→auth, 422→validation, 429→rate_limited, 5xx→upstream)', async () => {
    const cases: Array<[number, string]> = [
      [404, 'not_found'],
      [401, 'auth'],
      [422, 'validation'],
      [429, 'rate_limited'],
      [500, 'upstream'],
    ];
    for (const [status, kind] of cases) {
      vi.stubGlobal('fetch', mockFetch(status, {}));
      await expect(
        new RaphaServiceClient(cfg()).syncTenantCapabilities('tenant-1', {
          plan: 'free',
          sensorLimit: 1,
          decoysEnabled: false,
        }),
      ).rejects.toMatchObject({ kind });
    }
  });

  it('maps a network failure to unavailable and never leaks the token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('down');
      }),
    );
    try {
      await new RaphaServiceClient(cfg()).syncTenantCapabilities('tenant-1', {
        plan: 'free',
        sensorLimit: 1,
        decoysEnabled: false,
      });
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toMatchObject({ kind: 'unavailable' });
      expect((err as Error).message).not.toContain(SERVICE_TOKEN);
    }
  });

  it('fails closed when unconfigured (no fetch)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      new RaphaServiceClient(cfg({ raphaServiceToken: '' })).syncTenantCapabilities('tenant-1', {
        plan: 'free',
        sensorLimit: 1,
        decoysEnabled: false,
      }),
    ).rejects.toMatchObject({ kind: 'config' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
