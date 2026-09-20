-- Migration 0007 — EmmaTech: first-party acquisition attribution for
-- access_requests (Phase 5.2 demand-generation foundation).
--
-- Adds COARSE, first-party acquisition metadata so a submitted private-access
-- request can be associated with how the organization arrived at EmmaTech
-- (UTM campaign params, referrer DOMAIN only, landing path, first/last touch
-- timestamps). This is NOT third-party analytics and contains NO new personal
-- data beyond a coarse campaign/source label: NEVER a full referrer URL,
-- browsing history, device fingerprint, IP, session material, or secrets.
--
-- All columns are ADDITIVE and NULLABLE with no default and NO backfill, so the
-- change is safe for existing rows. Historical migrations are untouched.
--
-- ⚠ OPERATOR ACTION REQUIRED: apply to the production database before shipping
-- code that writes these columns. It was NOT run by the change author.
--
-- Apply:    psql "$DATABASE_URL" -f migrations/0007_access_request_attribution.up.sql
-- Rollback: psql "$DATABASE_URL" -f migrations/0007_access_request_attribution.down.sql

BEGIN;

ALTER TABLE access_requests
  ADD COLUMN IF NOT EXISTS utm_source      text,
  ADD COLUMN IF NOT EXISTS utm_medium      text,
  ADD COLUMN IF NOT EXISTS utm_campaign    text,
  ADD COLUMN IF NOT EXISTS utm_content     text,
  ADD COLUMN IF NOT EXISTS referrer_domain text,
  ADD COLUMN IF NOT EXISTS landing_path    text,
  ADD COLUMN IF NOT EXISTS first_touch_at  timestamptz,
  ADD COLUMN IF NOT EXISTS last_touch_at   timestamptz;

-- Source rollups ("which sources produce submissions?") are the primary new
-- read pattern; a lightweight index on utm_source supports them.
CREATE INDEX IF NOT EXISTS access_requests_utm_source_idx
  ON access_requests (utm_source);

COMMIT;
