---
name: Drizzle push rename trap on users table
description: drizzle-kit push mis-detects new user columns as renames of a legacy "credits" column that exists only in the DB, not in the schema; verify columns actually applied after push.
---

The production/dev `users` table contains a legacy `credits` column (integer, default 5) that is NOT in `shared/schema.ts`. When adding new columns to the users table, `drizzle-kit push` interactively asks whether each new column is a *rename* of `credits`, and in non-interactive runs it can silently abort or apply the wrong mapping.

**Why:** Observed when adding `subscription_cancel_at_period_end` / `subscription_current_period_end` — push printed `~ credits › subscription_cancel_at_period_end rename column` and the columns were never created.

**How to apply:** After any `npm run db:push` touching the users table, verify with `psql "$DATABASE_URL" -c "\d users"` that the columns exist. If push mis-fires, add the columns manually with `ALTER TABLE users ADD COLUMN IF NOT EXISTS ...` matching the drizzle column definitions, rather than letting drizzle rename/drop the legacy column (data loss risk).
