/**
 * Request authentication helper: resolves the current user id from the signed
 * session cookie. Returns null when there is no valid, unexpired session.
 */
import type { VercelRequest } from '@vercel/node';
import type { AppConfig } from './config.js';
import { parseCookies, SESSION_COOKIE_NAME, verifySessionToken } from './session.js';

export function getSessionUserId(req: VercelRequest, cfg: AppConfig): string | null {
  if (!cfg.sessionSecret) return null;
  const cookies = parseCookies(req.headers?.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  return verifySessionToken(token, cfg.sessionSecret);
}
