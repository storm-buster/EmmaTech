/**
 * Shared policy + parameter validation for the aggregate acquisition report
 * (Phase 5.3 PR 2). Pure and deterministic so both stores and the tests use the
 * exact same bounds/labels. This module holds NO query logic and touches NO PII.
 */
import type { AcquisitionReportOptions } from './store/types.js';

export const ACQUISITION_REPORT = {
  /** Small-group suppression threshold: grouped rows with count < k are omitted. */
  MIN_GROUP_SIZE: 5,
  /** Maximum reporting window (created_at range) in days. */
  MAX_WINDOW_DAYS: 90,
  /** topN bounds for open-ended grouped dimensions. */
  TOPN_DEFAULT: 10,
  TOPN_MIN: 1,
  TOPN_MAX: 50,
  /** Bucket label for NULL utm_source (and NULL landing_path). */
  DIRECT_UNKNOWN: 'direct/unknown',
  UNKNOWN_PATH: 'unknown',
} as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Thrown when the requested reporting range is missing, malformed, inverted,
 *  or exceeds the maximum window. The message is safe (no input echoed). */
export class AcquisitionReportRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AcquisitionReportRangeError';
  }
}

export interface ResolvedReportParams {
  /** Canonical ISO lower bound (inclusive). */
  from: string;
  /** Canonical ISO upper bound (exclusive). */
  to: string;
  /** Whole-day span of the window (for reporting/echo). */
  days: number;
  /** Clamped topN in [TOPN_MIN, TOPN_MAX]. */
  topN: number;
  /** Suppression threshold (k). */
  minGroupSize: number;
}

function parseFiniteDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Validate + normalize report options. Rejects missing/unbounded/inverted
 * ranges and windows longer than MAX_WINDOW_DAYS; clamps topN to its bounds.
 */
export function resolveReportParams(opts: AcquisitionReportOptions): ResolvedReportParams {
  const from = parseFiniteDate(opts?.from);
  const to = parseFiniteDate(opts?.to);
  if (!from || !to) {
    throw new AcquisitionReportRangeError('A finite `from` and `to` (ISO 8601) range is required.');
  }
  const spanMs = to.getTime() - from.getTime();
  if (spanMs <= 0) {
    throw new AcquisitionReportRangeError('`from` must be strictly before `to`.');
  }
  if (spanMs > ACQUISITION_REPORT.MAX_WINDOW_DAYS * MS_PER_DAY) {
    throw new AcquisitionReportRangeError(
      `Reporting window must not exceed ${ACQUISITION_REPORT.MAX_WINDOW_DAYS} days.`,
    );
  }

  // topN: default when absent; reject non-integers; clamp into [min, max].
  let topN: number = ACQUISITION_REPORT.TOPN_DEFAULT;
  if (opts.topN !== undefined) {
    if (typeof opts.topN !== 'number' || !Number.isInteger(opts.topN)) {
      throw new AcquisitionReportRangeError('`topN` must be an integer.');
    }
    topN = Math.min(ACQUISITION_REPORT.TOPN_MAX, Math.max(ACQUISITION_REPORT.TOPN_MIN, opts.topN));
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    days: Math.round(spanMs / MS_PER_DAY),
    topN,
    minGroupSize: ACQUISITION_REPORT.MIN_GROUP_SIZE,
  };
}
