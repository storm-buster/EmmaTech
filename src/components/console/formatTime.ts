/**
 * Presentation-layer timestamp formatter for the RAPHA Console.
 *
 * RAPHA sends timestamps in two shapes:
 *  - float/int **unix seconds** (or milliseconds) — e.g. telemetry `updated_at`,
 *    sensor `last_seen`, alert `ts`;
 *  - **ISO-8601 strings** — e.g. forensic `timestamp` like
 *    `2026-08-18T22:27:12.236597`, which are NAIVE (no timezone suffix) and are
 *    UTC by RAPHA convention.
 *
 * All of these must render in the BROWSER'S LOCAL timezone (never a hardcoded
 * zone). This is presentation-only: the underlying API value is not mutated.
 */
export function fmtTime(v?: number | string | null): string {
  if (v === null || v === undefined || v === '') return '—';

  // Numeric epoch (number, or a purely-numeric string). RAPHA uses float unix
  // seconds; values >= 1e12 are already milliseconds.
  if (typeof v === 'number' || /^\d+(\.\d+)?$/.test(v.trim())) {
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n) && n > 0) {
      const ms = n < 1e12 ? n * 1000 : n;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) return d.toLocaleString();
    }
    return String(v);
  }

  // ISO-8601 string. If it already carries a timezone (Z or ±hh[:]mm), Date
  // parses it correctly. A naive RAPHA timestamp has NO zone and is UTC —
  // append 'Z' so it's interpreted as UTC, then rendered in the local zone.
  const s = v.trim();
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(s);
  const d = new Date(hasZone ? s : `${s}Z`);
  if (!Number.isNaN(d.getTime())) return d.toLocaleString();

  return String(v); // unparseable → show raw (never throw)
}
