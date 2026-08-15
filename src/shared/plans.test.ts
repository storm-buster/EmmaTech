import { describe, it, expect } from 'vitest';
import { DEFAULT_PLAN_ID, PLANS, PUBLIC_PLANS, getPlan, isValidPlanId } from './plans';

describe('canonical plan catalog', () => {
  it('defines FREE with ₹0, exactly 1 sensor, and NO decoys', () => {
    const free = PLANS.free;
    expect(free.price).toBe('₹0');
    expect(free.sensorLimit).toBe(1);
    expect(free.decoysEnabled).toBe(false);
    expect(free.publiclyVisible).toBe(true);
    expect(free.contactOnly).toBe(false);
  });

  it('preserves the exact existing STARTER values', () => {
    const s = PLANS.starter;
    expect(s.price).toBe('₹18,000');
    expect(s.period).toBe('/node/year');
    expect(s.sensorLimit).toBe(20);
    expect(s.decoysEnabled).toBe(true);
    expect(s.features).toContain('Up to 20 sensors');
    expect(s.features).toContain('Lightweight Cowrie decoys');
  });

  it('preserves the exact existing GROWTH values', () => {
    const g = PLANS.growth;
    expect(g.price).toBe('₹35,000');
    expect(g.period).toBe('/node/year');
    expect(g.sensorLimit).toBeNull(); // unlimited
    expect(g.features).toContain('Unlimited sensors');
    expect(g.popular).toBe(true);
  });

  it('keeps PERPETUAL as an internal, non-public, contact-only plan', () => {
    const p = PLANS.perpetual;
    expect(p.publiclyVisible).toBe(false);
    expect(p.contactOnly).toBe(true);
    // Never carries a normal purchasable price.
    expect(p.price).toBe('Contact EmmaTech');
  });

  it('excludes perpetual from the public pricing cards', () => {
    const ids = PUBLIC_PLANS.map((p) => p.id);
    expect(ids).toEqual(['free', 'starter', 'growth']);
    expect(ids).not.toContain('perpetual');
  });

  it('is internally consistent (public plans are visible & not contact-only)', () => {
    for (const p of PUBLIC_PLANS) {
      expect(p.publiclyVisible).toBe(true);
      expect(p.contactOnly).toBe(false);
      expect(p.price.length).toBeGreaterThan(0);
      expect(p.features.length).toBeGreaterThan(0);
    }
  });

  it('defaults new organizations to free and validates plan ids', () => {
    expect(DEFAULT_PLAN_ID).toBe('free');
    expect(getPlan('starter').id).toBe('starter');
    expect(isValidPlanId('growth')).toBe(true);
    expect(isValidPlanId('enterprise')).toBe(false);
  });
});
