-- Migration 0002 — EmmaTech Phase 2: organization commercial plan
-- Adds the server-authoritative `plan` column to organizations. Additive and
-- deterministic. Existing Phase 1 organizations safely default to 'free'.
--
-- Apply:    psql "$DATABASE_URL" -f migrations/0002_organization_plan.up.sql
-- Rollback: psql "$DATABASE_URL" -f migrations/0002_organization_plan.down.sql

BEGIN;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'growth', 'perpetual'));

-- Any rows that predate this column receive the default ('free') automatically.
-- This statement is a belt-and-suspenders no-op for existing NULLs (there are
-- none, since the column is NOT NULL DEFAULT 'free').
UPDATE organizations SET plan = 'free' WHERE plan IS NULL;

COMMIT;
