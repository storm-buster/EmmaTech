import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './status.js';

// --- Minimal Vercel req/res doubles ---------------------------------------

function makeReq(method: string): VercelRequest {
  return { method } as unknown as VercelRequest;
}

interface ResState {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

function makeRes(): { res: VercelResponse; state: ResState } {
  const state: ResState = {
    statusCode: 0,
    body: undefined,
    headers: {},
  };

  const res = {
    setHeader(key: string, value: string) {
      state.headers[key.toLowerCase()] = value;
      return this;
    },
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      state.body = payload;
      return this;
    },
  } as unknown as VercelResponse;

  return { res, state };
}

const HTTPS_BASE = 'https://rapha.internal.example';

beforeEach(() => {
  process.env.RAPHA_API_BASE_URL = HTTPS_BASE;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete process.env.RAPHA_API_BASE_URL;
});

describe('GET /api/rapha/status handler', () => {
  it('returns operational when upstream is 200 with {status:"ok"}', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', version: '2.0.0' }),
      })),
    );

    const { res, state } = makeRes();
    await handler(makeReq('GET'), res);

    expect(state.statusCode).toBe(200);
    expect(state.body).toMatchObject({ status: 'operational', healthy: true });
    expect(typeof (state.body as { checkedAt: string }).checkedAt).toBe('string');
    expect(state.headers['cache-control']).toBe('s-maxage=30, stale-while-revalidate=30');
  });

  it('calls the RAPHA /api/v1/health path over HTTPS with no auth header', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { res } = makeRes();
    await handler(makeReq('GET'), res);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${HTTPS_BASE}/api/v1/health`);
    expect(init.method).toBe('GET');
    // Redirects must never be followed (stay bound to the HTTPS origin).
    expect(init.redirect).toBe('error');
    // No credential of any kind must be attached.
    const headerKeys = Object.keys((init.headers ?? {}) as Record<string, string>).map((k) =>
      k.toLowerCase(),
    );
    expect(headerKeys).not.toContain('x-api-key');
    expect(headerKeys).not.toContain('authorization');
  });

  it('returns down on a non-2xx upstream response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ error: 'boom' }),
      })),
    );

    const { res, state } = makeRes();
    await handler(makeReq('GET'), res);

    expect(state.statusCode).toBe(200);
    expect(state.body).toMatchObject({ status: 'down', healthy: false });
  });

  it('returns down on upstream timeout (AbortController fires)', async () => {
    vi.useFakeTimers();
    // fetch that only rejects when its abort signal fires.
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }),
      ),
    );

    const { res, state } = makeRes();
    const pending = handler(makeReq('GET'), res);
    await vi.advanceTimersByTimeAsync(4000);
    await pending;

    expect(state.statusCode).toBe(200);
    expect(state.body).toMatchObject({ status: 'down', healthy: false });
  });

  it('returns down on malformed JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON');
        },
      })),
    );

    const { res, state } = makeRes();
    await handler(makeReq('GET'), res);

    expect(state.statusCode).toBe(200);
    expect(state.body).toMatchObject({ status: 'down', healthy: false });
  });

  it('returns down on a network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    );

    const { res, state } = makeRes();
    await handler(makeReq('GET'), res);

    expect(state.statusCode).toBe(200);
    expect(state.body).toMatchObject({ status: 'down', healthy: false });
  });

  it('returns down when the upstream attempts a redirect (redirect: "error" rejects)', async () => {
    // With redirect: 'error', the runtime fetch rejects (TypeError) instead of
    // following a 3xx to another host / non-HTTPS destination. Must fail closed.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('unexpected redirect');
      }),
    );

    const { res, state } = makeRes();
    await handler(makeReq('GET'), res);

    expect(state.statusCode).toBe(200);
    expect(state.body).toMatchObject({ status: 'down', healthy: false });
  });

  it('returns down (fails closed) when RAPHA_API_BASE_URL is not HTTPS', async () => {
    process.env.RAPHA_API_BASE_URL = 'http://rapha.internal.example';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeRes();
    await handler(makeReq('GET'), res);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.statusCode).toBe(200);
    expect(state.body).toMatchObject({ status: 'down', healthy: false });
  });

  it('leaks no upstream details in any response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', version: '2.0.0', orchestrator_count: 7 }),
      })),
    );

    const { res, state } = makeRes();
    await handler(makeReq('GET'), res);

    // Response shape must be EXACTLY the three sanitized keys.
    expect(Object.keys(state.body as object).sort()).toEqual(['checkedAt', 'healthy', 'status']);

    const serialized = JSON.stringify(state.body);
    expect(serialized).not.toContain('2.0.0'); // RAPHA version
    expect(serialized).not.toContain('orchestrator'); // internal field
    expect(serialized).not.toContain(HTTPS_BASE); // RAPHA URL
  });

  it('rejects non-GET methods with 405 and leaks nothing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { res, state } = makeRes();
    await handler(makeReq('POST'), res);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.statusCode).toBe(405);
    expect(state.headers['allow']).toBe('GET');
    expect(JSON.stringify(state.body)).not.toContain(HTTPS_BASE);
  });
});
