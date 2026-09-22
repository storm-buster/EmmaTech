import { describe, it, expect } from 'vitest';
import { resolveReportParams, AcquisitionReportRangeError, ACQUISITION_REPORT } from './acquisition-report.js';

const FROM = '2026-09-01T00:00:00.000Z';
const day = (n: number) => new Date(Date.parse(FROM) + n * 86400000).toISOString();

describe('resolveReportParams — range validation', () => {
  it('accepts a valid finite window and normalizes ISO + days', () => {
    const r = resolveReportParams({ from: FROM, to: day(30) });
    expect(r.from).toBe(FROM);
    expect(r.to).toBe(day(30));
    expect(r.days).toBe(30);
    expect(r.minGroupSize).toBe(ACQUISITION_REPORT.MIN_GROUP_SIZE);
  });

  it('rejects missing from/to', () => {
    expect(() => resolveReportParams({ from: '', to: day(1) })).toThrow(AcquisitionReportRangeError);
    // @ts-expect-error intentionally omitting `to`
    expect(() => resolveReportParams({ from: FROM })).toThrow(AcquisitionReportRangeError);
  });

  it('rejects malformed dates', () => {
    expect(() => resolveReportParams({ from: 'not-a-date', to: day(1) })).toThrow(AcquisitionReportRangeError);
  });

  it('rejects inverted / empty ranges (from >= to)', () => {
    expect(() => resolveReportParams({ from: day(5), to: day(5) })).toThrow(AcquisitionReportRangeError);
    expect(() => resolveReportParams({ from: day(6), to: day(5) })).toThrow(AcquisitionReportRangeError);
  });

  it('accepts exactly the max window but rejects beyond it', () => {
    expect(resolveReportParams({ from: FROM, to: day(90) }).days).toBe(90);
    expect(() => resolveReportParams({ from: FROM, to: day(91) })).toThrow(AcquisitionReportRangeError);
  });
});

describe('resolveReportParams — topN bounds', () => {
  it('defaults to 10 when absent', () => {
    expect(resolveReportParams({ from: FROM, to: day(1) }).topN).toBe(10);
  });
  it('clamps to [1,50]', () => {
    expect(resolveReportParams({ from: FROM, to: day(1), topN: 0 }).topN).toBe(1);
    expect(resolveReportParams({ from: FROM, to: day(1), topN: -5 }).topN).toBe(1);
    expect(resolveReportParams({ from: FROM, to: day(1), topN: 999 }).topN).toBe(50);
    expect(resolveReportParams({ from: FROM, to: day(1), topN: 25 }).topN).toBe(25);
  });
  it('rejects non-integer topN', () => {
    expect(() => resolveReportParams({ from: FROM, to: day(1), topN: 3.5 })).toThrow(AcquisitionReportRangeError);
    // @ts-expect-error string topN
    expect(() => resolveReportParams({ from: FROM, to: day(1), topN: '10' })).toThrow(AcquisitionReportRangeError);
  });
});
