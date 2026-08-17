-- Migration 0001 — EmmaTech Phase 1: identity + organization foundation
-- Deterministic, additive. Safe to run on an empty database. Preserves any
-- existing data (only creates new tables/objects; nothing is dropped).
--
-- Apply:    psql "$DATABASE_URL" -f migrations/0001_identity_foundation.up.sql
-- Rollback: psql "$DATABASE_URL" -f migrations/0001_identity_foundation.down.sql

BEGIN;

-- gen_random_uuid() is built into PostgreSQL 13+; pgcrypto provides it on older
-- versions. Safe no-op if already present.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  password_hash text NOT NULL,
  name          text NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Email is stored already-normalized (trimmed + lowercased) by the app.
-- A unique index enforces one account per email.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);

-- Organizations -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  -- RAPHA tenant provisioning state.
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'failed')),
  -- Association to the RAPHA-owned tenant. Nullable until provisioning
  -- succeeds, so the organization can be created even if RAPHA is unavailable.
  rapha_tenant_id text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Organization membership (roles designed to extend without a schema change) -
CREATE TABLE IF NOT EXISTS organization_members (
  user_id         uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'member'
                    CHECK (role IN ('owner', 'member')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, organization_id)
);

-- Lookups by organization (e.g. list members) and by user (primary org).
CREATE INDEX IF NOT EXISTS organization_members_org_idx
  ON organization_members (organization_id);
CREATE INDEX IF NOT EXISTS organization_members_user_idx
  ON organization_members (user_id);

COMMIT;
