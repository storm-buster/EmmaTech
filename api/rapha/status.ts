import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Public, sanitized RAPHA status proxy.
 *
 * Browser → GET /api/rapha/status → (this function) → GET ${RAPHA_API_BASE_URL}/api/v1/health → RAPHA
 *
 * Security invariants:
 * - The browser NEVER talks to RAPHA directly.
 * - RAPHA health is unauthenticated, so NO credential is sent or required here.
 * - RAPHA_API_BASE_URL is a server-only (unprefixed) env var. It is never exposed.
 * - The upstream response, status code, version, URL and any internal error are
 *   never leaked. Only a fixed, sanitized shape is returned.
 */

const UPSTREAM_TIMEOUT_MS = 4000;

type SanitizedStatus = {
  status: 'operational' | 'down';
  healthy: boolean;
  checkedAt: string;
};

function operational(): SanitizedStatus {
  return { status: 'operational', healthy: true, checkedAt: new Date().toISOString() };
}

function down(): SanitizedStatus {
  return { status: 'down', healthy: false, checkedAt: new Date().toISOString() };
}

/**
 * Probe RAPHA liveness. Returns true only when RAPHA is reachable over HTTPS,
 * responds 2xx, and the body reports {"status":"ok"}. Every failure mode
 * (missing/non-HTTPS base URL, non-2xx, timeout, malformed JSON, network error)
 * fails closed to `false` without surfacing any detail.
 */
async function probeRaphaHealthy(): Promise<boolean> {
  const baseUrl = (process.env.RAPHA_API_BASE_URL ?? '').trim();

  // Fail closed if the base URL is missing or not HTTPS. Do not leak the reason.
  if (!baseUrl || !/^https:\/\//i.test(baseUrl)) {
    return false;
  }

  const target = `${baseUrl.replace(/\/+$/, '')}/api/v1/health`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(target, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!upstream.ok) {
      return false;
    }

    const body = (await upstream.json()) as { status?: unknown };
    return body?.status === 'ok';
  } catch {
    // AbortError (timeout), network error, or malformed JSON — all sanitized.
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const healthy = await probeRaphaHealthy();

  // Same-origin call: no CORS headers. Short shared-cache TTL to shield RAPHA.
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=30');
  res.status(200).json(healthy ? operational() : down());
}
