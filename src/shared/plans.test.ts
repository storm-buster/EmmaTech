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
    // FREE CTA enters the authenticated flow (never a purchase).
    expect(free.ctaText).toBe('Start free');
    expect(free.ctaAction).toBe('signup');
    // FREE explicitly excludes decoys as a rendered exclusion line.
    const decoyLine = free.features.find((f) => f.text === 'Decoys');
    expect(decoyLine).toBeTruthy();
    expect(decoyLine?.included).toBe(false);
    // FREE must NOT list decoys as an included capability.
    expect(free.features.some((f) => f.included !== false && /decoy/i.test(f.text))).toBe(false);
  });

  it('preserves the exact existing STARTER values', () => {
    const s = PLANS.starter;
    expect(s.price).toBe('₹18,000');
    expect(s.period).toBe('/node/year');
    expect(s.sensorLimit).toBe(20);
    expect(s.decoysEnabled).toBe(true);
    const texts = s.features.map((f) => f.text);
    expect(texts).toContain('Up to 20 sensors');
    expect(texts).toContain('Lightweight Cowrie decoys');
    expect(s.ctaText).toBe('Start a pilot');
    expect(s.ctaAction).toBe('signup');
  });

  it('preserves the exact existing GROWTH values', () => {
    const g = PLANS.growth;
    expect(g.price).toBe('₹35,000');
    expect(g.period).toBe('/node/year');
    expect(g.sensorLimit).toBeNull(); // unlimited
    expect(g.decoysEnabled).toBe(true);
    expect(g.features.map((f) => f.text)).toContain('Unlimited sensors');
    expect(g.popular).toBe(true);
    expect(g.ctaText).toBe('Talk to founder');
    expect(g.ctaAction).toBe('contact'); // routes to contact, not a purchase
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
      // No public CTA performs a purchase.
      expect(['signup', 'contact']).toContain(p.ctaAction);
    }
  });

  it('defaults new organizations to free and validates plan ids', () => {
    expect(DEFAULT_PLAN_ID).toBe('free');
    expect(getPlan('starter').id).toBe('starter');
    expect(isValidPlanId('growth')).toBe(true);
    expect(isValidPlanId('enterprise')).toBe(false);
  });
});
