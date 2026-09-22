/**
 * Postgres integration coverage for getAcquisitionReport — runs ONLY when
 * TEST_DATABASE_URL points at a THROWAWAY Postgres (never production):
 *   TEST_DATABASE_URL=postgres://u:p@localhost:5432/db npx vitest run api/_lib/store/acquisitionReport.integration.test.ts
 * When unset the whole suite is skipped.
 *
 * Verifies the aggregate SQL executes against a real database and produces
 * results IDENTICAL to the in-memory mirror for the same seed data, that
 * k-suppression is enforced in SQL, and that no PII appears in the result.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pgPkg from 'pg';
import { PostgresStore, __closePostgresPoolForTests } from './postgres.js';
import { InMemoryStore } from './memory.js';
import type { AccessRequest, AccessRequestStatus } from './types.js';

const { Pool } = pgPkg;
const TEST_DB = process.env.TEST_DATABASE_URL;
const suite = TEST_DB ? describe : describe.skip;

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '../../../migrations');

const WIN_FROM = '2026-09-01T00:00:00.000Z';
const WIN_TO = '2026-09-30T00:00:00.000Z';
const dayAt = (d: number, h = 12) => `2026-09-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:00:00.000Z`;

interface Seed {
  created_at: string;
  utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null;
  referrer_domain?: string | null; landing_path?: string | null;
  first_touch_at?: string | null; last_touch_at?: string | null;
  status?: AccessRequestStatus;
}

function seeds(): Seed[] {
  const out: Seed[] = [];
  for (let i = 0; i < 6; i++) out.push({ created_at: dayAt(2), utm_source: 'reddit', utm_medium: 'community', utm_campaign: 'deception', landing_path: '/rapha', first_touch_at: dayAt(1), last_touch_at: dayAt(1), status: 'submitted' });
  for (let i = 0; i < 5; i++) out.push({ created_at: dayAt(3), utm_source: null, landing_path: null, first_touch_at: dayAt(1), last_touch_at: dayAt(2), status: 'under_review' });
  for (let i = 0; i < 3; i++) out.push({ created_at: dayAt(4), utm_source: 'linkedin', landing_path: '/security', status: 'approved' }); // suppressed (<5)
  return out;
}

function toRow(s: Seed): AccessRequest {
  return {
    id: Math.random().toString(36).slice(2),
    full_name: 'PII Name', work_email: 'pii@secret.example', organization: 'PII Org',
    job_title: null, industry: 'Technology / SaaS', organization_size: null, country: null,
    security_challenge: 'PII challenge', current_stack: null, deployment_environment: null,
    evaluation_reason: 'PII reason', additional_context: null,
    utm_source: s.utm_source ?? null, utm_medium: s.utm_medium ?? null, utm_campaign: s.utm_campaign ?? null, utm_content: null,
    referrer_domain: s.referrer_domain ?? null, landing_path: s.landing_path ?? null,
    first_touch_at: s.first_touch_at ?? null, last_touch_at: s.last_touch_at ?? null,
    status: s.status ?? 'submitted', created_at: s.created_at, updated_at: s.created_at,
  };
}

suite('PostgresStore.getAcquisitionReport (integration + parity)', () => {
  let pool: InstanceType<typeof Pool>;
  let pg: PostgresStore;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB });
    for (const f of readdirSync(migrationsDir).filter((x) => x.endsWith('.up.sql')).sort()) {
      await pool.query(readFileSync(join(migrationsDir, f), 'utf8'));
    }
    await pool.query('DELETE FROM access_requests');
    for (const s of seeds()) {
      await pool.query(
        `INSERT INTO access_requests
           (full_name, work_email, organization, industry, security_challenge, evaluation_reason,
            utm_source, utm_medium, utm_campaign, referrer_domain, landing_path,
            first_touch_at, last_touch_at, status, created_at, updated_at)
         VALUES ('PII Name','pii@secret.example','PII Org','Technology / SaaS','PII challenge','PII reason',
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
        [s.utm_source ?? null, s.utm_medium ?? null, s.utm_campaign ?? null, s.referrer_domain ?? null,
         s.landing_path ?? null, s.first_touch_at ?? null, s.last_touch_at ?? null, s.status ?? 'submitted', s.created_at],
      );
    }
    pg = new PostgresStore(TEST_DB as string);
  });

  afterAll(async () => {
    await pool?.query('DELETE FROM access_requests').catch(() => {});
    await pool?.end().catch(() => {});
    await __closePostgresPoolForTests();
  });

  it('produces results identical to the in-memory mirror (parity)', async () => {
    const mem = new InMemoryStore();
    (mem as unknown as { accessRequests: AccessRequest[] }).accessRequests = seeds().map(toRow);
    const opts = { from: WIN_FROM, to: WIN_TO, topN: 10 };
    const pgReport = await pg.getAcquisitionReport(opts);
    const memReport = await mem.getAcquisitionReport(opts);
    expect(pgReport).toEqual(memReport);
  });

  it('enforces k=5 suppression in SQL and returns no PII', async () => {
    const r = await pg.getAcquisitionReport({ from: WIN_FROM, to: WIN_TO });
    expect(r.bySource).toContainEqual({ key: 'reddit', count: 6 });
    expect(r.bySource).toContainEqual({ key: 'direct/unknown', count: 5 });
    expect(r.bySource.find((g) => g.key === 'linkedin')).toBeUndefined(); // <5 suppressed
    expect(r.totalInWindow).toBe(14);
    const s = JSON.stringify(r);
    for (const pii of ['PII Name', 'pii@secret.example', 'PII Org', 'PII challenge', 'PII reason']) {
      expect(s).not.toContain(pii);
    }
  });
});
