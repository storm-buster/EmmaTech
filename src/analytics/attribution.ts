/**
 * First-party attribution (Phase 5.2).
 *
 * Answers "How did this organization arrive at EmmaTech?" using ONLY coarse,
 * first-party, non-identifying acquisition signals — no third-party analytics,
 * no fingerprinting, no device IDs, no cross-site cookies, no full referrer
 * URLs, no browsing history.
 *
 * Model:
 *  - FIRST TOUCH: earliest known acquisition source (localStorage, set once).
 *  - LAST TOUCH / SESSION: most recent acquisition source this session
 *    (sessionStorage; updated only on genuine acquisition visits).
 *  - CONVERSION: the snapshot attached to a Request Access submission.
 *
 * All values are sanitized + length-bounded and treated as UNTRUSTED input.
 */

const FIRST_KEY = 'et_attr_first_v1';
const LAST_KEY = 'et_attr_last_v1';

const MAX = {
  utm_source: 64,
  utm_medium: 32,
  utm_campaign: 100,
  utm_content: 100,
  referrer_domain: 253,
  landing_path: 512,
} as const;

export interface AttributionRecord {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  referrer_domain: string | null;
  landing_path: string | null;
  at: string; // ISO timestamp
}

/** The coarse snapshot attached to a conversion (matches the API/DB fields). */
export interface AttributionSnapshot {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  referrer_domain: string | null;
  landing_path: string | null;
  first_touch_at: string | null;
  last_touch_at: string | null;
}

/** Strip control chars + markup-significant chars, then bound length. */
export function sanitizeValue(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const s = v.replace(/[\u0000-\u001F\u007F<>"'`\\]/g, '').trim().slice(0, max);
  return s.length > 0 ? s : null;
}

/** Referrer → registrable-ish hostname only (never the full URL). Internal
 *  hosts (same as `selfHost`) return null so internal navigation is not an
 *  acquisition source. */
export function referrerDomain(referrer: string | null | undefined, selfHost: string): string | null {
  if (!referrer) return null;
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host || host === selfHost.toLowerCase()) return null;
  if (!/^[a-z0-9.-]{1,253}$/.test(host)) return null;
  return host;
}

/** Parse + sanitize UTM parameters from a query string. */
export function parseUtm(search: string): Pick<
  AttributionRecord,
  'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_content'
> {
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(search || '');
  } catch {
    p = new URLSearchParams();
  }
  return {
    utm_source: sanitizeValue(p.get('utm_source'), MAX.utm_source),
    utm_medium: sanitizeValue(p.get('utm_medium'), MAX.utm_medium),
    utm_campaign: sanitizeValue(p.get('utm_campaign'), MAX.utm_campaign),
    utm_content: sanitizeValue(p.get('utm_content'), MAX.utm_content),
  };
}

/** Build the current-visit record from raw inputs (deterministic; testable). */
export function buildRecord(input: {
  search: string;
  referrer: string | null | undefined;
  pathname: string;
  selfHost: string;
  now?: Date;
}): AttributionRecord {
  const utm = parseUtm(input.search);
  const domain = referrerDomain(input.referrer, input.selfHost);
  // Precedence: explicit UTM medium wins; else an external referrer implies a
  // referral; else leave medium unset (direct/unknown is derived at read time).
  const medium = utm.utm_medium ?? (utm.utm_source ? null : domain ? 'referral' : null);
  const source = utm.utm_source ?? (domain ? domain : null);
  return {
    utm_source: source,
    utm_medium: medium,
    utm_campaign: utm.utm_campaign,
    utm_content: utm.utm_content,
    referrer_domain: domain,
    landing_path: sanitizeValue(input.pathname, MAX.landing_path),
    at: (input.now ?? new Date()).toISOString(),
  };
}

/** True when a record represents a genuine acquisition (UTM or external referrer). */
export function isAcquisition(rec: AttributionRecord): boolean {
  return Boolean(rec.utm_source || rec.referrer_domain);
}

function readRecord(store: Storage | undefined, key: string): AttributionRecord | null {
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    const o = JSON.parse(raw) as Record<string, unknown>;
    // Re-sanitize on read (defends against storage poisoning).
    return {
      utm_source: sanitizeValue(o.utm_source, MAX.utm_source),
      utm_medium: sanitizeValue(o.utm_medium, MAX.utm_medium),
      utm_campaign: sanitizeValue(o.utm_campaign, MAX.utm_campaign),
      utm_content: sanitizeValue(o.utm_content, MAX.utm_content),
      referrer_domain: sanitizeValue(o.referrer_domain, MAX.referrer_domain),
      landing_path: sanitizeValue(o.landing_path, MAX.landing_path),
      at: typeof o.at === 'string' && !Number.isNaN(Date.parse(o.at)) ? o.at : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

function writeRecord(store: Storage | undefined, key: string, rec: AttributionRecord): void {
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(rec));
  } catch {
    /* storage disabled/full — attribution is best-effort, never break the app */
  }
}

/**
 * Capture attribution once per page load (call from the app root). Sets
 * first-touch if absent; updates session last-touch only on acquisition visits.
 * Internal client navigations must NOT call this (referrer is stale + UTM is
 * gone), so it is invoked a single time on initial mount.
 */
export function captureAttributionOnLoad(win: Window = window): void {
  try {
    const rec = buildRecord({
      search: win.location.search,
      referrer: win.document.referrer,
      pathname: win.location.pathname,
      selfHost: win.location.hostname,
    });
    if (!readRecord(win.localStorage, FIRST_KEY)) {
      writeRecord(win.localStorage, FIRST_KEY, rec); // first touch — set once, never overwritten
    }
    if (isAcquisition(rec)) {
      writeRecord(win.sessionStorage, LAST_KEY, rec); // last touch — most recent acquisition this session
    }
  } catch {
    /* never break the app for attribution */
  }
}

/** Build the conversion snapshot to attach to a Request Access submission. */
export function getConversionSnapshot(win: Window = window): AttributionSnapshot {
  const first = readRecord(win.localStorage, FIRST_KEY);
  const last = readRecord(win.sessionStorage, LAST_KEY);
  const src = last ?? first; // converting source: last-touch if present, else first-touch
  return {
    utm_source: src?.utm_source ?? null,
    utm_medium: src?.utm_medium ?? null,
    utm_campaign: src?.utm_campaign ?? null,
    utm_content: src?.utm_content ?? null,
    referrer_domain: src?.referrer_domain ?? null,
    landing_path: first?.landing_path ?? null,
    first_touch_at: first?.at ?? null,
    last_touch_at: last?.at ?? first?.at ?? null,
  };
}

/** Coarse source label for a page_view event (never PII). */
export function currentSourceLabel(win: Window = window): { source: string | null; medium: string | null; campaign: string | null } {
  const last = readRecord(win.sessionStorage, LAST_KEY);
  const first = readRecord(win.localStorage, FIRST_KEY);
  const s = last ?? first;
  return { source: s?.utm_source ?? null, medium: s?.utm_medium ?? null, campaign: s?.utm_campaign ?? null };
}

/** Test-only: internal storage keys. */
export const __ATTR_KEYS = { FIRST_KEY, LAST_KEY } as const;
