import { describe, it, expect } from 'vitest';
import {
  parseUtm,
  referrerDomain,
  buildRecord,
  isAcquisition,
  sanitizeValue,
  captureAttributionOnLoad,
  getConversionSnapshot,
  __ATTR_KEYS,
} from './attribution';

/** Minimal in-memory Storage. */
function memStore(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    key: (i: number) => Array.from(m.keys())[i] ?? null,
    removeItem: (k: string) => void m.delete(k),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
  } as Storage;
}

function fakeWin(opts: { search?: string; referrer?: string; pathname?: string; hostname?: string } = {}) {
  return {
    location: { search: opts.search ?? '', pathname: opts.pathname ?? '/', hostname: opts.hostname ?? 'www.emmatech.in' },
    document: { referrer: opts.referrer ?? '' },
    localStorage: memStore(),
    sessionStorage: memStore(),
  } as unknown as Window;
}

describe('attribution — parsing & sanitization', () => {
  it('parses valid UTM params', () => {
    const u = parseUtm('?utm_source=reddit&utm_medium=community&utm_campaign=cyber_deception&utm_content=c_123');
    expect(u).toEqual({ utm_source: 'reddit', utm_medium: 'community', utm_campaign: 'cyber_deception', utm_content: 'c_123' });
  });
  it('returns nulls when UTM absent', () => {
    expect(parseUtm('')).toEqual({ utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null });
  });
  it('strips markup/control chars and bounds length', () => {
    expect(sanitizeValue('<script>x</script>', 64)).toBe('scriptx/script'); // <>"'`\ removed
    expect(sanitizeValue('a'.repeat(500), 64)?.length).toBe(64);
    expect(sanitizeValue('   ', 64)).toBeNull();
    expect(sanitizeValue(42 as unknown, 64)).toBeNull();
  });
});

describe('attribution — referrer domain', () => {
  it('extracts domain only (never full URL)', () => {
    expect(referrerDomain('https://old.reddit.com/r/netsec/comments/abc/', 'www.emmatech.in')).toBe('old.reddit.com');
  });
  it('treats same-host (internal) referrer as not-an-acquisition', () => {
    expect(referrerDomain('https://www.emmatech.in/rapha', 'www.emmatech.in')).toBeNull();
  });
  it('handles malformed / empty referrer', () => {
    expect(referrerDomain('not-a-url', 'www.emmatech.in')).toBeNull();
    expect(referrerDomain('', 'www.emmatech.in')).toBeNull();
    expect(referrerDomain(undefined, 'www.emmatech.in')).toBeNull();
  });
});

describe('attribution — precedence (buildRecord)', () => {
  it('UTM wins over referrer', () => {
    const r = buildRecord({ search: '?utm_source=reddit&utm_medium=community', referrer: 'https://google.com/', pathname: '/rapha', selfHost: 'www.emmatech.in' });
    expect(r.utm_source).toBe('reddit');
    expect(r.utm_medium).toBe('community');
    expect(isAcquisition(r)).toBe(true);
  });
  it('external referrer → referral when no UTM', () => {
    const r = buildRecord({ search: '', referrer: 'https://news.ycombinator.com/', pathname: '/', selfHost: 'www.emmatech.in' });
    expect(r.utm_source).toBe('news.ycombinator.com');
    expect(r.utm_medium).toBe('referral');
    expect(r.referrer_domain).toBe('news.ycombinator.com');
  });
  it('no UTM + internal/no referrer → direct/unknown (not an acquisition)', () => {
    const r = buildRecord({ search: '', referrer: '', pathname: '/', selfHost: 'www.emmatech.in' });
    expect(r.utm_source).toBeNull();
    expect(r.referrer_domain).toBeNull();
    expect(isAcquisition(r)).toBe(false);
  });
});

describe('attribution — persistence & conversion snapshot', () => {
  it('sets first-touch once and never overwrites it', () => {
    const win = fakeWin({ search: '?utm_source=reddit&utm_medium=community', pathname: '/rapha' });
    captureAttributionOnLoad(win);
    const first1 = win.localStorage.getItem(__ATTR_KEYS.FIRST_KEY);
    // Simulate a later different acquisition in the same storage.
    const win2 = { ...win, location: { search: '?utm_source=linkedin&utm_medium=social', pathname: '/', hostname: 'www.emmatech.in' }, document: { referrer: '' } } as unknown as Window;
    captureAttributionOnLoad(win2);
    expect(win.localStorage.getItem(__ATTR_KEYS.FIRST_KEY)).toBe(first1); // unchanged
    expect(JSON.parse(first1 as string).utm_source).toBe('reddit');
  });

  it('updates last-touch on a later acquisition; conversion prefers last-touch', () => {
    const win = fakeWin({ search: '?utm_source=reddit&utm_medium=community', pathname: '/rapha' });
    captureAttributionOnLoad(win);
    // later acquisition (same session storage): linkedin
    win.location.search = '?utm_source=linkedin&utm_medium=social';
    win.location.pathname = '/security';
    captureAttributionOnLoad(win);
    const snap = getConversionSnapshot(win);
    expect(snap.utm_source).toBe('linkedin'); // last-touch
    expect(snap.landing_path).toBe('/rapha'); // first landing
    expect(snap.first_touch_at).toBeTruthy();
    expect(snap.last_touch_at).toBeTruthy();
  });

  it('direct visit → snapshot has null source but records first landing', () => {
    const win = fakeWin({ search: '', referrer: '', pathname: '/' });
    captureAttributionOnLoad(win);
    const snap = getConversionSnapshot(win);
    expect(snap.utm_source).toBeNull();
    expect(snap.referrer_domain).toBeNull();
    expect(snap.landing_path).toBe('/');
  });

  it('survives navigation: attribution captured once, unchanged by internal nav', () => {
    const win = fakeWin({ search: '?utm_source=reddit&utm_medium=community', pathname: '/rapha' });
    captureAttributionOnLoad(win); // acquisition landing
    // internal SPA navigation does NOT call captureAttributionOnLoad again;
    // a stray same-host referrer visit would not overwrite either:
    const snap = getConversionSnapshot(win);
    expect(snap.utm_source).toBe('reddit');
  });

  it('recovers from poisoned/oversized stored values (re-sanitizes on read)', () => {
    const win = fakeWin();
    win.localStorage.setItem(__ATTR_KEYS.FIRST_KEY, JSON.stringify({ utm_source: '<b>'.repeat(500), landing_path: '/x', at: 'not-a-date' }));
    const snap = getConversionSnapshot(win);
    expect(snap.utm_source).not.toContain('<'); // markup stripped
    expect((snap.utm_source ?? '').length).toBeLessThanOrEqual(64); // bounded
  });

  it('never stores a full referrer URL (domain only)', () => {
    const win = fakeWin({ referrer: 'https://old.reddit.com/r/netsec/comments/abc/secret?token=xyz', pathname: '/' });
    captureAttributionOnLoad(win);
    const raw = win.localStorage.getItem(__ATTR_KEYS.FIRST_KEY) ?? '';
    expect(raw).not.toContain('/r/netsec');
    expect(raw).not.toContain('token=xyz');
    expect(JSON.parse(raw).referrer_domain).toBe('old.reddit.com');
  });
});
