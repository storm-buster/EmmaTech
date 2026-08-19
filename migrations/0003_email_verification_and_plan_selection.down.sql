-- Rollback for migration 0003 — email OTP verification + explicit plan selection.
-- Drops the email_challenges table and the added columns. Destructive for the
-- OTP challenge data only (transient by design); user/org rows are preserved.

BEGIN;

DROP TABLE IF EXISTS email_challenges;

ALTER TABLE organizations DROP COLUMN IF EXISTS plan_selected;

ALTER TABLE users DROP COLUMN IF EXISTS email_verified;

COMMIT;
