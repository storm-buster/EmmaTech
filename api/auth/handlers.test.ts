import type { VercelRequest, VercelResponse } from '@vercel/node';
import signupHandler from './signup.js';
import loginHandler from './login.js';
import logoutHandler from './logout.js';
import meHandler from '../me.js';
import { __resetInMemoryStore, getStore } from '../_lib/store/index.js';
import { __resetRateLimits } from '../_lib/ratelimit.js';
import { getConfig } from '../_lib/config.js';
import { SESSION_COOKIE_NAME, createSessionToken } from '../_lib/session.js';
import { hashPassword } from '../_lib/password.js';
import { requestSignupOtp, signup as svcSignup, verifySignupOtp } from '../_lib/service.js';
import { hashOtpCode } from '../_lib/otp.js';

const SERVICE_TOKEN = 'super-secret-service-token-value';

// --- req/res doubles -------------------------------------------------------

function makeReq(opts: { method: string; body?: unknown; cookie?: string }): VercelRequest {
  return {
    method: opts.method,
    body: opts.body,
    headers: opts.cookie ? { cookie: opts.cookie } : {},
  } as unknown as VercelRequest;
}

interface ResState {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

interface ResponseBody {
  user?: { email: string; name: string; password_hash?: string };
  organization?: { id: string; name: string; status: string; plan?: string; plan_selected?: boolean } | null;
  role?: string | null;
  entitlement?: { plan: string; planName: string; sensorLimit: number | null; decoysEnabled: boolean } | null;
  error?: string;
  ok?: boolean;
  message?: string;
}

function makeRes(): { res: VercelResponse; state: ResState } {
  const state: ResState = { statusCode: 0, body: undefined, headers: {} };
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

/** provision fetch: 201 for tenant create, 200 for capability sync. */
function fetchOk() {
  return vi.fn(async (url: string, init: RequestInit) => {
    if (String(url).endsWith('/capabilities')) {
      return { status: 200, ok: true, json: async () => ({}) } as unknown as Response;
    }
    const parsed = JSON.parse(init.body as string) as { external_customer_id?: string };
    return {
      status: 201,
      ok: true,
      json: async () => ({
        tenant_id: `tenant-${parsed.external_customer_id ?? 'x'}`,
        name: 'Acme',
        external_customer_id: parsed.external_customer_id ?? 'x',
        status: 'active',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }),
    } as unknown as Response;
  });
}

const SIGNUP_BODY = {
  name: 'Owner One',
  organizationName: 'Acme Inc',
  email: 'owner@example.com',
  password: 'a-strong-password',
};

/** Seed a verified account directly (service) + mint its session cookie. Used
 *  by tests that just need an authenticated session (not the OTP path itself). */
async function seedAccount(overrides: Partial<typeof SIGNUP_BODY> & { requested_plan?: string } = {}) {
  const body = { ...SIGNUP_BODY, ...overrides };
  const result = await svcSignup(
    getStore(getConfig()),
    getConfig(),
    {
      email: body.email,
      password: body.password,
      name: body.name,
      organizationName: body.organizationName,
      requestedPlan: overrides.requested_plan,
    },
    hashPassword,
  );
  const cookie = `${SESSION_COOKIE_NAME}=${createSessionToken(result.user.id, process.env.SESSION_SECRET as string)}`;
  return { result, cookie };
}

/** Request an OTP via the SERVICE with a capturing mock sender, returning the
 *  plaintext code (only tests may see it — the real senders never expose it). */
async function issueCode(overrides: Partial<typeof SIGNUP_BODY> & { requested_plan?: string } = {}): Promise<string> {
  const body = { ...SIGNUP_BODY, ...overrides };
  const sender = { sendOtp: vi.fn(async () => {}) };
  await requestSignupOtp(
    getStore(getConfig()),
    getConfig(),
    {
      email: body.email,
      password: body.password,
      name: body.name,
      organizationName: body.organizationName,
      requestedPlan: overrides.requested_plan,
    },
    hashPassword,
    sender,
  );
  const call = sender.sendOtp.mock.calls[0];
  return call ? (call[1] as string) : '';
}

beforeEach(() => {
  process.env.SESSION_SECRET = 'handler-test-session-secret';
  process.env.RAPHA_BASE_URL = 'https://rapha.test';
  process.env.RAPHA_SERVICE_TOKEN = SERVICE_TOKEN;
  delete process.env.DATABASE_URL;
  delete process.env.RESEND_API_KEY;
  delete process.env.OTP_EMAIL_FROM;
  process.env.NODE_ENV = 'test';
  __resetInMemoryStore();
  __resetRateLimits();
  vi.stubGlobal('fetch', fetchOk());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── A. Email/password OTP flow (handler + service) ───────────────────────────
describe('POST /api/auth/signup — OTP request/verify', () => {
  it('rejects a non-POST method with 405', async () => {
    const { res, state } = makeRes();
    await signupHandler(makeReq({ method: 'GET' }), res);
    expect(state.statusCode).toBe(405);
  });

  it('A1/A2: request returns 202, sets NO session, leaks NO code, and creates NO account', async () => {
    const { res, state } = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: { action: 'request', ...SIGNUP_BODY } }), res);
    expect(state.statusCode).toBe(202);
    expect(state.headers['set-cookie']).toBeUndefined();
    const body = state.body as ResponseBody;
    expect(body.user).toBeUndefined();
    // A9: no 6-digit code anywhere in the response.
    expect(JSON.stringify(body)).not.toMatch(/\d{6}/);
    // A2: the user does not exist yet.
    const user = await getStore(getConfig()).getUserByEmail('owner@example.com');
    expect(user).toBeNull();
  });

  it('A3: verifying the emailed code creates the account + sets an HttpOnly session', async () => {
    const code = await issueCode();
    const { res, state } = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: { action: 'verify', email: SIGNUP_BODY.email, code } }), res);
    expect(state.statusCode).toBe(201);
    const setCookie = state.headers['set-cookie'];
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain('HttpOnly');
    const body = state.body as ResponseBody;
    expect(body.user?.email).toBe('owner@example.com');
    expect(body.organization?.status).toBe('active');
    expect(body.role).toBe('owner');
    expect(body.user?.password_hash).toBeUndefined();
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('scrypt$');
    expect(serialized).not.toContain(SERVICE_TOKEN);
  });

  it('A4: an invalid code is rejected (400) and no account is created', async () => {
    await issueCode();
    const { res, state } = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: { action: 'verify', email: SIGNUP_BODY.email, code: '000000' } }), res);
    expect(state.statusCode).toBe(400);
    const user = await getStore(getConfig()).getUserByEmail('owner@example.com');
    expect(user).toBeNull();
  });

  it('A11: OTP requests are rate-limited (6th within the window → 429)', async () => {
    let last = 0;
    for (let i = 0; i < 6; i++) {
      const { res, state } = makeRes();
      await signupHandler(
        makeReq({ method: 'POST', body: { action: 'request', ...SIGNUP_BODY, email: `rl${i}@example.com` } }),
        res,
      );
      last = state.statusCode;
    }
    expect(last).toBe(429);
  });

  it('fails closed with 503 in production when no email provider is configured', async () => {
    process.env.NODE_ENV = 'production';
    // requireSessionSecret ok; getEmailSender → null (no RESEND config) → 503.
    const { res, state } = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: { action: 'request', ...SIGNUP_BODY } }), res);
    expect(state.statusCode).toBe(503);
  });
});

// ── A (service-level control): expiry / attempts / reuse / resend / storage ──
describe('OTP challenge security (service)', () => {
  const EMAIL = 'sec@example.com';

  it('A10: only a keyed digest is stored — never the plaintext code', async () => {
    const code = await issueCode({ email: EMAIL });
    const challenge = await getStore(getConfig()).getActiveEmailChallengeByEmail(EMAIL);
    expect(challenge).not.toBeNull();
    expect(challenge?.code_hash).not.toBe(code);
    expect(JSON.stringify(challenge)).not.toContain(code);
  });

  it('A7/G37: a code is single-use (cannot be replayed)', async () => {
    const code = await issueCode({ email: EMAIL });
    await verifySignupOtp(getStore(getConfig()), getConfig(), { email: EMAIL, code });
    await expect(
      verifySignupOtp(getStore(getConfig()), getConfig(), { email: EMAIL, code }),
    ).rejects.toMatchObject({ name: 'ValidationError' });
  });

  it('A8/throttle: a resend within the cooldown is throttled — no new code sent, original still valid', async () => {
    const first = await issueCode({ email: EMAIL });
    // A second request within the 60s cooldown is throttled: the sender is NOT
    // called (issueCode returns '' when no code was dispatched).
    const second = await issueCode({ email: EMAIL });
    expect(second).toBe('');
    // The original code remains valid (not invalidated by the throttled resend).
    const ok = await verifySignupOtp(getStore(getConfig()), getConfig(), { email: EMAIL, code: first });
    expect(ok.user.email).toBe(EMAIL);
  });

  it('A5/A6/G38: expired or over-attempted codes are rejected', async () => {
    const store = getStore(getConfig());
    const secret = process.env.SESSION_SECRET as string;
    // Expired challenge crafted directly with a past expiry (own email).
    const expiredEmail = 'expired@example.com';
    await store.createEmailChallenge({
      email: expiredEmail,
      code_hash: hashOtpCode('654321', expiredEmail, secret),
      expires_at: new Date(Date.now() - 1000).toISOString(),
      payload: { name: 'N', organization_name: 'O', password_hash: 'scrypt$x', requested_plan: null },
    });
    await expect(
      verifySignupOtp(store, getConfig(), { email: expiredEmail, code: '654321' }),
    ).rejects.toMatchObject({ name: 'ValidationError' });

    // Fresh challenge (distinct email → not throttled), exhaust 5 wrong
    // attempts, then even the CORRECT code is locked out.
    const attemptsEmail = 'attempts@example.com';
    const code = await issueCode({ email: attemptsEmail });
    for (let i = 0; i < 5; i++) {
      await expect(
        verifySignupOtp(store, getConfig(), { email: attemptsEmail, code: '111111' }),
      ).rejects.toMatchObject({ name: 'ValidationError' });
    }
    await expect(
      verifySignupOtp(store, getConfig(), { email: attemptsEmail, code }),
    ).rejects.toMatchObject({ name: 'ValidationError' });
  });

  it('concurrent verifications of the same OTP create EXACTLY one account', async () => {
    const email = 'concurrent@example.com';
    const code = await issueCode({ email });
    const cfg = getConfig();
    const store = getStore(cfg);
    const results = await Promise.allSettled([
      verifySignupOtp(store, cfg, { email, code }),
      verifySignupOtp(store, cfg, { email, code }),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
    expect(fulfilled).toBe(1); // exactly one account created; the other rejects
    const user = await store.getUserByEmail(email);
    expect(user).not.toBeNull();
  });
});

// ── C. Pricing-originated email signup preserves the plan (20/21/22) ─────────
describe('OTP signup preserves the pricing-selected plan', () => {
  async function verifyWithPlan(plan: string | undefined, email: string) {
    const code = await issueCode({ email, requested_plan: plan });
    const { state } = makeRes();
    const res = makeRes();
    await signupHandler(makeReq({ method: 'POST', body: { action: 'verify', email, code } }), res.res);
    void state;
    return res.state.body as ResponseBody;
  }

  it('20: Starter → OTP → org.plan=starter', async () => {
    const body = await verifyWithPlan('starter', 'starter@example.com');
    expect(body.organization?.plan).toBe('starter');
    expect(body.organization?.plan_selected).toBe(true);
    expect(body.entitlement?.plan).toBe('starter');
  });

  it('21: Growth (work email) → OTP → org.plan=growth', async () => {
    const body = await verifyWithPlan('growth', 'growth@acme.com');
    expect(body.organization?.plan).toBe('growth');
    expect(body.organization?.plan_selected).toBe(true);
  });

  it('22: explicit Free → OTP → org.plan=free, plan_selected=true (no modal)', async () => {
    const body = await verifyWithPlan('free', 'free@example.com');
    expect(body.organization?.plan).toBe('free');
    expect(body.organization?.plan_selected).toBe(true);
  });

  it('A12/generic: no plan → org.plan=free with plan_selected=false (modal will show)', async () => {
    const body = await verifyWithPlan(undefined, 'noplan@example.com');
    expect(body.organization?.plan).toBe('free');
    expect(body.organization?.plan_selected).toBe(false);
  });
});

// ── login / logout / me ──────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('sets a session cookie on valid credentials', async () => {
    await seedAccount();
    const { res, state } = makeRes();
    await loginHandler(makeReq({ method: 'POST', body: { email: 'owner@example.com', password: 'a-strong-password' } }), res);
    expect(state.statusCode).toBe(200);
    expect(state.headers['set-cookie']).toContain(`${SESSION_COOKIE_NAME}=`);
    expect((state.body as ResponseBody).user?.password_hash).toBeUndefined();
  });

  it('returns a generic 401 on invalid password', async () => {
    await seedAccount();
    const { res, state } = makeRes();
    await loginHandler(makeReq({ method: 'POST', body: { email: 'owner@example.com', password: 'WRONG-pass' } }), res);
    expect(state.statusCode).toBe(401);
    expect((state.body as ResponseBody).error).toBe('Invalid email or password');
  });

  it('G41: an unverified email/password identity cannot authenticate', async () => {
    // A pending OTP request creates NO user; login must fail (no account).
    await issueCode({ email: 'pending@example.com' });
    const { res, state } = makeRes();
    await loginHandler(makeReq({ method: 'POST', body: { email: 'pending@example.com', password: 'a-strong-password' } }), res);
    expect(state.statusCode).toBe(401);
    // Defense-in-depth: even a directly-seeded unverified user is rejected.
    const store = getStore(getConfig());
    await store.createUser({ email: 'unv@example.com', password_hash: await hashPassword('a-strong-password'), name: 'U', email_verified: false });
    const r2 = makeRes();
    await loginHandler(makeReq({ method: 'POST', body: { email: 'unv@example.com', password: 'a-strong-password' } }), r2.res);
    expect(r2.state.statusCode).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session cookie', async () => {
    const { res, state } = makeRes();
    await logoutHandler(makeReq({ method: 'POST' }), res);
    expect(state.statusCode).toBe(200);
    expect(state.headers['set-cookie']).toContain('Max-Age=0');
  });
});

describe('GET /api/me', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const { res, state } = makeRes();
    await meHandler(makeReq({ method: 'GET' }), res);
    expect(state.statusCode).toBe(401);
  });

  it('returns the account for an authenticated request', async () => {
    const { cookie } = await seedAccount();
    const { res, state } = makeRes();
    await meHandler(makeReq({ method: 'GET', cookie }), res);
    expect(state.statusCode).toBe(200);
    const body = state.body as ResponseBody;
    expect(body.user?.email).toBe('owner@example.com');
    expect(body.organization?.name).toBe('Acme Inc');
    expect(body.user?.password_hash).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain(SERVICE_TOKEN);
  });

  it('isolates organizations across users', async () => {
    const a = await seedAccount({ email: 'a@example.com', organizationName: 'Org A' });
    const b = await seedAccount({ email: 'b@example.com', organizationName: 'Org B' });
    const meA = makeRes();
    await meHandler(makeReq({ method: 'GET', cookie: a.cookie }), meA.res);
    expect((meA.state.body as ResponseBody).organization?.name).toBe('Org A');
    const meB = makeRes();
    await meHandler(makeReq({ method: 'GET', cookie: b.cookie }), meB.res);
    expect((meB.state.body as ResponseBody).organization?.name).toBe('Org B');
  });
});

// ── B. Generic-path plan selection via POST /api/me (13–19) ──────────────────
describe('POST /api/me — one-time initial plan selection', () => {
  it('14/15/16: applies Free / Starter / Growth(work email) exactly as chosen', async () => {
    for (const [plan, email] of [
      ['free', 'g-free@example.com'],
      ['starter', 'g-starter@example.com'],
      ['growth', 'g-growth@acme.com'],
    ] as const) {
      __resetInMemoryStore();
      const { cookie } = await seedAccount({ email }); // generic → plan_selected=false
      const { res, state } = makeRes();
      await meHandler(makeReq({ method: 'POST', cookie, body: { requested_plan: plan } }), res);
      expect(state.statusCode).toBe(200);
      expect((state.body as ResponseBody).organization?.plan).toBe(plan);
      expect((state.body as ResponseBody).organization?.plan_selected).toBe(true);
    }
  });

  it('17: Growth with a consumer email falls back to Free (server-authoritative)', async () => {
    const { cookie } = await seedAccount({ email: 'consumer@gmail.com' });
    const { res, state } = makeRes();
    await meHandler(makeReq({ method: 'POST', cookie, body: { requested_plan: 'growth' } }), res);
    expect(state.statusCode).toBe(200);
    expect((state.body as ResponseBody).organization?.plan).toBe('free');
  });

  it('18: an invalid/perpetual plan falls back to Free', async () => {
    const { cookie } = await seedAccount({ email: 'inv@example.com' });
    const { res, state } = makeRes();
    await meHandler(makeReq({ method: 'POST', cookie, body: { requested_plan: 'perpetual' } }), res);
    expect((state.body as ResponseBody).organization?.plan).toBe('free');
  });

  it('19: the plan can be selected only ONCE (subsequent attempts → 409)', async () => {
    const { cookie } = await seedAccount({ email: 'once@example.com' });
    const first = makeRes();
    await meHandler(makeReq({ method: 'POST', cookie, body: { requested_plan: 'starter' } }), first.res);
    expect(first.state.statusCode).toBe(200);
    const second = makeRes();
    await meHandler(makeReq({ method: 'POST', cookie, body: { requested_plan: 'growth' } }), second.res);
    expect(second.state.statusCode).toBe(409);
    // The already-selected plan is not overwritten.
    const me = makeRes();
    await meHandler(makeReq({ method: 'GET', cookie }), me.res);
    expect((me.state.body as ResponseBody).organization?.plan).toBe('starter');
  });

  it('requires authentication', async () => {
    const { res, state } = makeRes();
    await meHandler(makeReq({ method: 'POST', body: { requested_plan: 'starter' } }), res);
    expect(state.statusCode).toBe(401);
  });
});

// ── Plan-security regression (server remains authoritative) ──────────────────
describe('plan security', () => {
  it('a raw `plan` field in the signup body is ignored (server default free)', async () => {
    const code = await issueCode({ email: 'raw@example.com' });
    const { res, state } = makeRes();
    await signupHandler(
      makeReq({ method: 'POST', body: { action: 'verify', email: 'raw@example.com', code, plan: 'growth', entitlement: 'growth' } }),
      res,
    );
    expect((state.body as ResponseBody).organization?.plan).toBe('free');
  });

  it('the admin-only store mechanism can change a plan (not a customer endpoint)', async () => {
    const { cookie, result } = await seedAccount({ email: 'admin@example.com' });
    await getStore(getConfig()).setOrganizationPlan(result.organization.id, 'growth');
    const me = makeRes();
    await meHandler(makeReq({ method: 'GET', cookie }), me.res);
    expect((me.state.body as ResponseBody).entitlement?.plan).toBe('growth');
  });
});
