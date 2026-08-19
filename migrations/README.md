# Database migrations

EmmaTech had no database before Phase 1. These are plain, ordered SQL
migrations for PostgreSQL — the store selected when `DATABASE_URL` is set
(see `api/_lib/store/postgres.ts`). Without `DATABASE_URL`, the app uses the
in-memory store (tests / local dev) and no migration is required.

## Files

- `0001_identity_foundation.up.sql` — creates `users`, `organizations`,
  `organization_members`.
- `0001_identity_foundation.down.sql` — rollback (drops those tables).
- `0002_organization_plan.up.sql` — adds `organizations.plan` (default `free`,
  CHECK in free/starter/growth/perpetual).
- `0002_organization_plan.down.sql` — rollback (drops the `plan` column).
- `0003_email_verification_and_plan_selection.up.sql` — adds
  `users.email_verified`, `organizations.plan_selected`, and the
  `email_challenges` table (email OTP). Backfills existing users as verified and
  existing organizations as already-selected. **Must be applied before deploying
  the OTP signup code.**
- `0003_email_verification_and_plan_selection.down.sql` — rollback.

## Apply

```bash
psql "$DATABASE_URL" -f migrations/0001_identity_foundation.up.sql
```

## Rollback

```bash
psql "$DATABASE_URL" -f migrations/0001_identity_foundation.down.sql
```

Migrations are additive and idempotent (`IF NOT EXISTS`), so re-running the
forward migration is safe and preserves existing data. Do not run migrations
directly against a production database by hand — run them through the
deployment/release process.
