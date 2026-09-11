-- Rollback for 0006_access_requests.up.sql — drops the access_requests table.
BEGIN;
DROP TABLE IF EXISTS access_requests;
COMMIT;
