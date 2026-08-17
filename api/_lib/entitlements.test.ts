import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStore } from './store/memory.js';
import { entitlementsForPlan, getOrganizationEntitlements } from './entitlements.js';

let store: InMemoryStore;

beforeEach(() => {
  store = new InMemoryStore();
});

describe('entitlementsForPlan', () => {
  it('maps FREE to 1 sensor / decoys disabled', () => {
    expect(entitlementsForPlan('free')).toEqual({
      plan: 'free',
      planName: 'Free',
      sensorLimit: 1,
      decoysEnabled: false,
    });
  });

  it('maps STARTER to 20 sensors / decoys enabled', () => {
    const e = entitlementsForPlan('starter');
    expect(e.sensorLimit).toBe(20);
    expect(e.decoysEnabled).toBe(true);
  });

  it('maps GROWTH to unlimited sensors', () => {
    const e = entitlementsForPlan('growth');
    expect(e.sensorLimit).toBeNull();
  });
});

describe('getOrganizationEntitlements', () => {
  it('a newly created organization defaults to FREE entitlement', async () => {
    const org = await store.createOrganization({
      name: 'Acme',
      status: 'pending',
      rapha_tenant_id: null,
    });
    expect(org.plan).toBe('free');
    const ent = await getOrganizationEntitlements(store, org.id);
    expect(ent).toEqual({
      plan: 'free',
      planName: 'Free',
      sensorLimit: 1,
      decoysEnabled: false,
    });
  });

  it('reflects a server-side plan change (no customer endpoint involved)', async () => {
    const org = await store.createOrganization({
      name: 'Acme',
      status: 'active',
      rapha_tenant_id: 'tenant-1',
    });
    await store.setOrganizationPlan(org.id, 'growth');
    const ent = await getOrganizationEntitlements(store, org.id);
    expect(ent?.plan).toBe('growth');
    expect(ent?.sensorLimit).toBeNull();
    expect(ent?.decoysEnabled).toBe(true);
  });

  it('returns null for an unknown organization', async () => {
    expect(await getOrganizationEntitlements(store, 'nope')).toBeNull();
  });
});
