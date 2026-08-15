import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStore } from './memory.js';
import { DuplicateEmailError } from './types.js';

let store: InMemoryStore;

beforeEach(() => {
  store = new InMemoryStore();
});

describe('InMemoryStore', () => {
  it('creates and reads a user', async () => {
    const user = await store.createUser({
      email: 'a@example.com',
      password_hash: 'scrypt$...',
      name: 'Alice',
    });
    expect(user.id).toBeTruthy();
    expect(user.is_active).toBe(true);
    expect(await store.getUserByEmail('a@example.com')).toMatchObject({ id: user.id });
    expect(await store.getUserById(user.id)).toMatchObject({ email: 'a@example.com' });
  });

  it('enforces unique email', async () => {
    await store.createUser({ email: 'dup@example.com', password_hash: 'h', name: 'A' });
    await expect(
      store.createUser({ email: 'dup@example.com', password_hash: 'h2', name: 'B' }),
    ).rejects.toBeInstanceOf(DuplicateEmailError);
  });

  it('creates an organization (pending, null tenant) and updates the tenant', async () => {
    const org = await store.createOrganization({
      name: 'Acme',
      status: 'pending',
      rapha_tenant_id: null,
    });
    expect(org.status).toBe('pending');
    expect(org.rapha_tenant_id).toBeNull();

    const updated = await store.updateOrganizationTenant(org.id, {
      rapha_tenant_id: 'tenant-1',
      status: 'active',
    });
    expect(updated.status).toBe('active');
    expect(updated.rapha_tenant_id).toBe('tenant-1');
  });

  it('records membership and prefers the owner as primary', async () => {
    const u = await store.createUser({ email: 'o@example.com', password_hash: 'h', name: 'O' });
    const org = await store.createOrganization({
      name: 'Org',
      status: 'pending',
      rapha_tenant_id: null,
    });
    await store.createMembership({ user_id: u.id, organization_id: org.id, role: 'owner' });
    const primary = await store.getPrimaryMembershipForUser(u.id);
    expect(primary?.organization_id).toBe(org.id);
    expect(primary?.role).toBe('owner');
  });
});
