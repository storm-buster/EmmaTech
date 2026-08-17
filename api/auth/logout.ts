import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig } from '../_lib/config.js';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import { clearSessionCookie } from '../_lib/session.js';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') {
    methodNotAllowed(res, 'POST');
    return;
  }
  const cfg = getConfig();
  // Clearing the cookie invalidates the client's session. Stateless tokens
  // also carry an exp, so a discarded cookie cannot be replayed indefinitely.
  res.setHeader('Set-Cookie', clearSessionCookie({ secure: cfg.isProduction }));
  sendJson(res, 200, { ok: true });
}
