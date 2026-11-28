import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * users.created_at: when each teacher signed up (added 28 Nov 2026 for the
 * admin activation report).
 *
 * Deliberately NOT part of the drizzle `users` schema: sign-in selects every
 * user column on every request, so a column that is still being added would
 * break logins while this runs. The database fills it for new accounts
 * (DEFAULT now()). Accounts created before this change stay NULL, because
 * their real sign-up date is unknown; the activation report estimates those
 * from trial_expires_at (they all had a 5-day trial).
 */

let ready: Promise<void> | undefined;

export function ensureUserSignupDate(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const result = await db.execute(sql`
        SELECT column_default FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'created_at'
      `);
      const row = result.rows[0] as { column_default: string | null } | undefined;
      if (!row) {
        // Two steps on purpose: ADD COLUMN ... DEFAULT now() would stamp every
        // existing account with today's date.
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp`);
      }
      if (!row?.column_default) {
        await db.execute(sql`ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now()`);
      }
    })().catch((error) => {
      ready = undefined;
      console.error("[Users] Could not add the sign-up date column:", error);
      throw error;
    });
  }
  return ready;
}
