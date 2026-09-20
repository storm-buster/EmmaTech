-- Rollback for 0007 — remove first-party acquisition attribution columns.
-- Reverses 0007_access_request_attribution.up.sql. Additive-only reversal.

BEGIN;

DROP INDEX IF EXISTS access_requests_utm_source_idx;

ALTER TABLE access_requests
  DROP COLUMN IF EXISTS utm_source,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS utm_content,
  DROP COLUMN IF EXISTS referrer_domain,
  DROP COLUMN IF EXISTS landing_path,
  DROP COLUMN IF EXISTS first_touch_at,
  DROP COLUMN IF EXISTS last_touch_at;

COMMIT;
