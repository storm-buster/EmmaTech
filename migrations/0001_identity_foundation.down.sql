-- Rollback for migration 0001 — EmmaTech Phase 1 identity + organization.
-- Drops the Phase 1 tables in dependency order. Destructive: only run when you
-- intend to remove the identity foundation entirely.

BEGIN;

DROP TABLE IF EXISTS organization_members;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS users;

COMMIT;
