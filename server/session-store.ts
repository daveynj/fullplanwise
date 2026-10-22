import session, { type Store } from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Pool } from "pg";

/**
 * Login sessions are stored in Postgres (the `session` table) so they survive
 * server restarts and are shared by every running server. Autoscale shuts
 * servers down when idle and can run several at once; with in-memory
 * sessions every shutdown logged all teachers out, and a teacher logged in on
 * one server counted as logged out on another.
 */

const SESSION_TABLE_LOCK_KEY = "planwise_session_table_setup";

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Create the session table and its expiry index if they are missing.
 *
 * Uses our own modern DDL (connect-pg-simple's bundled table.sql uses
 * `WITH (OIDS=FALSE)`, which current Postgres rejects). The common case — the
 * table already exists — is one cheap lookup with no lock. Creation runs under
 * a transaction-level advisory lock so several servers starting together on a
 * fresh database can't race each other.
 */
export async function ensureSessionTable(pool: Pool, tableName = "session"): Promise<void> {
  const existing = await pool.query("SELECT to_regclass($1) AS reg", [quoteIdent(tableName)]);
  if (existing.rows[0]?.reg) return;

  const table = quoteIdent(tableName);
  const index = quoteIdent(`IDX_${tableName}_expire`);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [SESSION_TABLE_LOCK_KEY]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${table} (
        "sid" varchar NOT NULL PRIMARY KEY,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS ${index} ON ${table} ("expire")`);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export function createSessionStore(pool: Pool, tableName = "session"): Store {
  // Every session query first makes sure the table exists. This doesn't
  // delay server start-up, and a failed check is retried on the next query
  // instead of breaking logins until a restart.
  let ready: Promise<void> | null = null;
  const ensureReady = () => {
    ready ??= ensureSessionTable(pool, tableName).catch((err) => {
      ready = null;
      throw err;
    });
    return ready;
  };
  const gatedPool = {
    async query(text: string, params?: unknown[]) {
      await ensureReady();
      return pool.query(text, params as any[]);
    },
  };

  const PgStore = connectPgSimple(session);
  return new PgStore({
    pool: gatedPool as unknown as Pool,
    tableName,
    // The table is created by ensureSessionTable above.
    createTableIfMissing: false,
    // Delete expired sessions every ~15 minutes (randomised per server).
    pruneSessionInterval: 15 * 60,
    // Expiry is fixed by the 1-week login cookie; skip a DB write on every
    // request just to push the stored expiry forward.
    disableTouch: true,
  });
}
