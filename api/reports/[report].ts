import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig } from '../_lib/config.js';
import { methodNotAllowed, sendJson, newRequestId } from '../_lib/http.js';
import { logError } from '../_lib/log.js';
import { enforceStaffOrNotFound } from '../_lib/staff-auth.js';
import { getStore } from '../_lib/store/index.js';
import { AcquisitionReportRangeError } from '../_lib/acquisition-report.js';

/**
 * GET /api/reports/{report} — internal, STAFF-ONLY, read-only aggregate
 * reporting. A single dynamic Vercel function (function-budget safe) so future
 * report types can be added without new functions.
 *
 * For this PR the only supported report is `acquisition`:
 *   GET /api/reports/acquisition?from=<ISO>&to=<ISO>[&topN=1..50]
 *
 * SECURITY / PRIVACY:
 * - Staff authorization (session + REPORTING_STAFF_USER_IDS allowlist) is
 *   enforced BEFORE any data access; non-staff/unauthenticated callers get the
 *   generic 404 {error:"Not found"} (no endpoint disclosure). Org roles are
 *   never consulted. While the allowlist is unset, this is deny-all.
 * - Only the aggregate store result crosses the HTTP boundary, and `totalInWindow`
 *   is DELIBERATELY omitted (an unsuppressed global total can be differenced
 *   across overlapping windows to infer small counts). No PII, no row-level
 *   data, no individual timestamps, no full referrer URL.
 * - k / minGroupSize is a server constant and is never caller-controllable.
 */

type ReportName = 'acquisition';
const SUPPORTED_REPORTS: readonly ReportName[] = ['acquisition'];

function firstStr(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === 'string' && s !== '' ? s : undefined;
}

function readReport(req: VercelRequest): ReportName | null {
  const raw = firstStr(req.query?.report);
  return raw && (SUPPORTED_REPORTS as readonly string[]).includes(raw) ? (raw as ReportName) : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // 1. Method guard (repo convention).
  if (req.method !== 'GET') {
    methodNotAllowed(res, 'GET');
    return;
  }

  const cfg = getConfig();

  // 2. Staff authorization BEFORE any data access. Non-staff/unauth → 404.
  const staffId = enforceStaffOrNotFound(req, res, cfg);
  if (!staffId) return;

  // 3. Only known reports exist (for authorized callers): unknown → 404.
  const report = readReport(req);
  if (!report) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  // 4. Validate the window/topN via the shared resolver (through the store).
  //    `topN` is parsed to a number so the resolver can bound/reject it;
  //    `k` is NEVER read from the caller.
  const topNRaw = firstStr(req.query?.topN);
  const opts = {
    from: firstStr(req.query?.from) ?? '',
    to: firstStr(req.query?.to) ?? '',
    ...(topNRaw !== undefined ? { topN: Number(topNRaw) } : {}),
  };

  const requestId = newRequestId();
  const store = getStore(cfg);
  try {
    const r = await store.getAcquisitionReport(opts);
    // 5. Serialize ONLY the approved aggregate fields. `totalInWindow` is
    //    intentionally NOT included (privacy decision from the PR #39 review).
    sendJson(res, 200, {
      window: r.window,
      policy: r.policy,
      bySource: r.bySource,
      bySourceMediumCampaign: r.bySourceMediumCampaign,
      byLandingPath: r.byLandingPath,
      byStatus: r.byStatus,
      byDay: r.byDay,
      touchPatterns: r.touchPatterns,
    });
  } catch (err) {
    if (err instanceof AcquisitionReportRangeError) {
      // Safe, static validation message (no caller input echoed).
      sendJson(res, 400, { error: err.message });
      return;
    }
    // Never leak internals (no SQL, stack, PII, or ids).
    logError({ requestId, operation: 'reports.acquisition', status: 'failure', outcome: 'store_error' });
    sendJson(res, 500, { error: 'Unable to generate the report. Please try again shortly.' });
  }
}
