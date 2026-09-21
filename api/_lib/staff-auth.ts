/**
 * Internal STAFF authorization gate (Phase 5.3, PR 1).
 *
 * Purpose: a small, reusable authorization helper for future INTERNAL-ONLY,
 * read-only surfaces (e.g. aggregate acquisition reporting). It does NOT define
 * an endpoint or UI — it only decides whether the caller is EmmaTech staff.
 *
 * Design / security properties:
 * - Authentication reuses the EXISTING session-cookie mechanism
 *   (`getSessionUserId` → HMAC-signed `et_session`). No second auth system.
 * - Authorization is an explicit, env-configured allowlist of staff USER IDS
 *   (`cfg.staffUserIds`, from REPORTING_STAFF_USER_IDS). It is completely
 *   independent of organization membership/roles: an org `owner` is NOT staff.
 * - FAIL CLOSED: no session secret, no/invalid session, or an empty allowlist
 *   all deny. An empty allowlist is NEVER "allow everyone".
 * - Non-staff/unauthenticated callers are denied as 404 (not 403) so the
 *   existence of the internal surface is not disclosed.
 * - No staff identifiers are placed in response bodies; nothing here logs
 *   secrets, cookies, tokens, or user identifiers.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AppConfig } from './config.js';
import { getSessionUserId } from './auth.js';
import { sendJson } from './http.js';

export type StaffAuthResult =
  | { ok: true; userId: string }
  | { ok: false };

/**
 * Pure staff-authorization decision. Deterministic, no side effects, no
 * logging — safe to unit test in isolation.
 *
 * Returns `{ ok: true, userId }` only when there is a valid authenticated
 * session AND that session's user id is present in the configured staff
 * allowlist. Every failure path returns `{ ok: false }`.
 */
export function requireStaff(req: VercelRequest, cfg: AppConfig): StaffAuthResult {
  // Fail closed if sessions cannot be verified at all.
  if (!cfg.sessionSecret) return { ok: false };

  // Fail closed if no staff are configured. An empty allowlist denies everyone
  // and is NEVER treated as "allow all".
  if (!cfg.staffUserIds || cfg.staffUserIds.size === 0) return { ok: false };

  // Authenticate via the existing session cookie only.
  const userId = getSessionUserId(req, cfg);
  if (!userId) return { ok: false };

  // Authorize strictly by allowlist membership (org role is irrelevant here).
  if (!cfg.staffUserIds.has(userId)) return { ok: false };

  return { ok: true, userId };
}

/**
 * Convenience wrapper for handlers: enforces staff authorization and, on
 * failure, responds with a generic 404 (to avoid disclosing the internal
 * surface) and returns null. On success returns the staff user id.
 *
 * The 404 body is intentionally generic and contains NO staff identifier.
 */
export function enforceStaffOrNotFound(
  req: VercelRequest,
  res: VercelResponse,
  cfg: AppConfig,
): string | null {
  const result = requireStaff(req, cfg);
  if (!result.ok) {
    sendJson(res, 404, { error: 'Not found' });
    return null;
  }
  return result.userId;
}
