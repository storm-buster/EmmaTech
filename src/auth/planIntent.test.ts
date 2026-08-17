import { describe, it, expect, beforeEach } from 'vitest';
import { setIntendedPlan, getIntendedPlan, clearIntendedPlan } from './planIntent';

beforeEach(() => {
  sessionStorage.clear();
});

describe('planIntent', () => {
  it('persists and reads a valid plan', () => {
    setIntendedPlan('growth');
    expect(getIntendedPlan()).toBe('growth');
  });

  it('returns null when nothing is set', () => {
    expect(getIntendedPlan()).toBeNull();
  });

  it('ignores an invalid stored value (cannot forge an arbitrary plan)', () => {
    sessionStorage.setItem('emmatech.intendedPlan', 'enterprise-hacked');
    expect(getIntendedPlan()).toBeNull();
  });

  it('clears the intent', () => {
    setIntendedPlan('starter');
    clearIntendedPlan();
    expect(getIntendedPlan()).toBeNull();
  });
});
