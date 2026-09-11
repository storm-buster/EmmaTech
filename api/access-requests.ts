import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig } from './_lib/config.js';
import { methodNotAllowed, newRequestId, readJsonBody, sendJson } from './_lib/http.js';
import { logError, logInfo } from './_lib/log.js';
import { checkRateLimit, clientKey } from './_lib/ratelimit.js';
import { getStore } from './_lib/store/index.js';
import { validateAccessRequestInput } from './_lib/access-request.js';
import type { AccessRequest } from './_lib/store/types.js';

/**
 * PUBLIC "Request Private Access" intake (Phase 1 commercial repositioning).
 *
 * POST /api/access-requests
 *
 * Persists a durable commercial application from the anonymous public website.
 * DELIBERATELY DECOUPLED FROM IDENTITY/PROVISIONING: this endpoint NEVER creates
 * a user, organization, membership, session, or RAPHA tenant. It only records a
 * lead for human review via the platform-admin portal, then best-effort emails
 * a notification (notification failure never fails the submission — the durable
 * record is the source of truth).
 *
 * Unauthenticated by design (public form), so it is rate-limited per client IP
 * (best-effort, per-instance) and strictly validated/sanitized. No secrets are
 * read/returned/logged, and applicant PII is never logged.
 */

// Best-effort abuse control for an unauthenticated public form.
const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 }; // 5 submissions / hour / IP

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }

  const requestId = newRequestId();

  const ip = clientKey(req.headers);
  const rl = checkRateLimit(`access-request:${ip}`, RATE_LIMIT);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    sendJson(res, 429, { error: 'Too many requests. Please try again later.' });
    return;
  }

  const validation = validateAccessRequestInput(readJsonBody(req));
  if (!validation.ok) {
    sendJson(res, 400, { error: 'Please correct the highlighted fields.', fields: validation.fields });
    return;
  }

  const cfg = getConfig();
  let store;
  try {
    store = getStore(cfg);
  } catch {
    sendJson(res, 503, { error: 'Service is not configured. Please email us directly.' });
    return;
  }

  let created: AccessRequest;
  try {
    created = await store.createAccessRequest(validation.value);
  } catch {
    // Never leak internals; the applicant just sees a generic failure.
    logError({ requestId, operation: 'access_request.create', status: 'failure', outcome: 'store_error' });
    sendJson(res, 500, { error: 'We could not submit your request. Please try again shortly.' });
    return;
  }

  // Coarse success log only — never applicant PII.
  logInfo({ requestId, operation: 'access_request.create', status: 'success', outcome: created.status });

  // Best-effort notification. NEVER fails the request.
  await notifyBestEffort(cfg, created, requestId);

  sendJson(res, 201, { id: created.id, status: created.status });
}

/**
 * Best-effort admin notification via Resend. Sends only when RESEND_API_KEY,
 * OTP_EMAIL_FROM, and ACCESS_REQUEST_NOTIFY_TO are all configured; otherwise it
 * logs-only. The email body contains only the safe application fields (business
 * PII, no secrets). Any failure is swallowed (logged coarsely) so the durable
 * record — not the email — remains the source of truth.
 */
async function notifyBestEffort(
  cfg: ReturnType<typeof getConfig>,
  r: AccessRequest,
  requestId: string,
): Promise<void> {
  const notifyTo = (process.env.ACCESS_REQUEST_NOTIFY_TO ?? '').trim() || null;
  if (!cfg.resendApiKey || !cfg.otpEmailFrom || !notifyTo) {
    logInfo({ requestId, operation: 'access_request.notify', status: 'success', outcome: 'skipped_unconfigured' });
    return;
  }
  const lines = [
    'New RAPHA private-access application:',
    '',
    `Name:            ${r.full_name}`,
    `Work email:      ${r.work_email}`,
    `Organization:    ${r.organization}`,
    `Job title:       ${r.job_title ?? '—'}`,
    `Industry:        ${r.industry}`,
    `Org size:        ${r.organization_size ?? '—'}`,
    `Country/region:  ${r.country ?? '—'}`,
    `Deployment env:  ${r.deployment_environment ?? '—'}`,
    `Current stack:   ${r.current_stack ?? '—'}`,
    '',
    'Primary security challenge:',
    r.security_challenge,
    '',
    'Why evaluating RAPHA:',
    r.evaluation_reason,
    '',
    'Additional context:',
    r.additional_context ?? '—',
    '',
    `Application id:  ${r.id}`,
    `Submitted:       ${r.created_at}`,
  ].join('\n');
  // Bounded timeout so a slow/unreachable Resend never keeps the public
  // submission pending. The durable record was already saved by the caller, so
  // aborting here only skips the (best-effort) email — it never fails the request.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: cfg.otpEmailFrom,
        to: [notifyTo],
        subject: `RAPHA private-access request — ${r.organization}`,
        text: lines,
      }),
      signal: controller.signal,
    });
    if (!resp.ok) throw new Error(`notify_status_${resp.status}`);
    logInfo({ requestId, operation: 'access_request.notify', status: 'success', outcome: 'sent' });
  } catch {
    // Includes AbortError on timeout. Swallowed: the durable record is the
    // source of truth; notification is best-effort only.
    logError({ requestId, operation: 'access_request.notify', status: 'failure', outcome: 'send_error' });
  } finally {
    clearTimeout(timeout);
  }
}
