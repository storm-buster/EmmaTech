-- Rollback for migration 0002 — removes the organizations.plan column.
-- Non-destructive to users/organizations rows; only drops the plan column.

BEGIN;

ALTER TABLE organizations DROP COLUMN IF EXISTS plan;

COMMIT;
