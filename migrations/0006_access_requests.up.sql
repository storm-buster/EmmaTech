-- Migration 0006 — EmmaTech: private-access application records (Phase 1
-- commercial repositioning).
--
-- Stores durable "Request Private Access" applications submitted from the
-- PUBLIC website. These are commercial leads / evaluation requests only — they
-- are DELIBERATELY DECOUPLED from identity/provisioning: a row here NEVER
-- creates a user, an organization, or a RAPHA tenant. Approval + onboarding is
-- a separate, human-driven step.
--
-- SECURITY: this table holds business-contact PII (name, work email,
-- organization, free-text context). It MUST NEVER contain passwords, hashes,
-- API keys, service tokens, or session material. It is exposed ONLY through the
-- platform-admin API (never any public/customer endpoint).
--
-- Additive and idempotent; historical migrations are untouched.
--
-- ⚠ OPERATOR ACTION REQUIRED: apply to the production database before shipping
-- the Phase-1 access-request code. It was NOT run by the change author.
--
-- Apply:    psql "$DATABASE_URL" -f migrations/0006_access_requests.up.sql
-- Rollback: psql "$DATABASE_URL" -f migrations/0006_access_requests.down.sql

BEGIN;

CREATE TABLE IF NOT EXISTS access_requests (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Applicant identity / contact (business PII — no secrets).
  full_name              text NOT NULL,
  work_email             text NOT NULL,
  organization           text NOT NULL,
  job_title              text,
  industry               text NOT NULL,
  organization_size      text,
  country                text,
  -- Qualification free-text (bounded by the application layer).
  security_challenge     text NOT NULL,
  current_stack          text,
  deployment_environment text,
  evaluation_reason      text NOT NULL,
  additional_context     text,
  -- Review lifecycle. Enforced here AND in the application layer.
  status                 text NOT NULL DEFAULT 'submitted'
                           CHECK (status IN ('submitted', 'under_review', 'approved', 'declined', 'contacted')),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Read patterns: newest-first review queue + filter by status.
CREATE INDEX IF NOT EXISTS access_requests_created_idx
  ON access_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS access_requests_status_idx
  ON access_requests (status);

COMMIT;
