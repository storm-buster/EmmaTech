-- Migration 0003 — EmmaTech: email OTP verification + explicit plan selection
--
-- Adds:
--   * users.email_verified          — email/password accounts are only created
--                                      AFTER OTP verification; OAuth accounts are
--                                      provider-verified. Defense-in-depth guard
--                                      for the login path.
--   * organizations.plan_selected   — distinguishes "no plan chosen yet"
--                                      (show the post-signup plan modal) from an
--                                      explicit choice (including explicit Free),
--                                      so the modal is shown exactly once.
--   * email_challenges              — single-use, expiring OTP challenges. Only
--                                      a keyed HMAC digest of the code is stored;
--                                      the plaintext OTP is NEVER persisted.
--
-- Additive and deterministic. Existing rows are backfilled as already-verified
-- / already-selected so current users are unaffected (they predate this flow).
--
-- ⚠ OPERATOR ACTION REQUIRED: this migration MUST be applied to the production
-- database BEFORE deploying the OTP signup code. Until it is applied, the OTP
-- signup path will fail (missing table/columns). It was NOT run by the change
-- author.
--
-- Apply:    psql "$DATABASE_URL" -f migrations/0003_email_verification_and_plan_selection.up.sql
-- Rollback: psql "$DATABASE_URL" -f migrations/0003_email_verification_and_plan_selection.down.sql

BEGIN;

-- Users: email verification flag ------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- Grandfather existing accounts as verified (they predate OTP and must keep
-- their ability to sign in).
UPDATE users SET email_verified = true WHERE email_verified = false;

-- Organizations: explicit initial plan-selection flag ---------------------
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS plan_selected boolean NOT NULL DEFAULT false;

-- Existing organizations are past signup — treat their plan as already chosen
-- so the post-signup plan modal never re-appears for them.
UPDATE organizations SET plan_selected = true WHERE plan_selected = false;

-- Email OTP challenges -----------------------------------------------------
CREATE TABLE IF NOT EXISTS email_challenges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Normalized (trimmed + lowercased) email the code was issued for.
  email       text NOT NULL,
  -- Keyed HMAC digest of the OTP. The plaintext code is NEVER stored.
  code_hash   text NOT NULL,
  expires_at  timestamptz NOT NULL,
  attempts    integer NOT NULL DEFAULT 0,
  consumed    boolean NOT NULL DEFAULT false,
  -- Pending signup payload (name, organization_name, password_hash [already a
  -- scrypt hash], requested_plan). The account is created only on verification.
  payload     jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Lookup active challenge by email (resend supersedes prior).
CREATE INDEX IF NOT EXISTS email_challenges_email_idx
  ON email_challenges (email);

COMMIT;
