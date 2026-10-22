// @vitest-environment node
//
// Session table set-up against the real database: a missing table is created
// (with DDL modern Postgres accepts), several servers starting at once don't
// race, and logins work straight away on a fresh table.
// Uses a throwaway table name so the live `session` table is never touched.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { pool } from "./db";
import { createSessionStore, ensureSessionTable } from "./session-store";

const TABLE = "session_store_test_tmp";

async function dropTable() {
  await pool.query(`DROP TABLE IF EXISTS "${TABLE}"`);
}

function promisify<T>(fn: (cb: (err: any, value?: T) => void) => void): Promise<T | undefined> {
  return new Promise((resolve, reject) => fn((err, value) => (err ? reject(err) : resolve(value))));
}

describe("session table set-up (real database)", () => {
  beforeAll(dropTable);
  afterAll(async () => {
    await dropTable();
    await pool.end();
  });

  it("creates a missing table safely when several servers start at once", async () => {
    await Promise.all([1, 2, 3, 4].map(() => ensureSessionTable(pool, TABLE)));

    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY column_name`,
      [TABLE],
    );
    expect(cols.rows.map((r) => r.column_name)).toEqual(["expire", "sess", "sid"]);
    const idx = await pool.query(`SELECT indexname FROM pg_indexes WHERE tablename = $1 ORDER BY indexname`, [TABLE]);
    expect(idx.rows.map((r) => r.indexname)).toEqual([`IDX_${TABLE}_expire`, `${TABLE}_pkey`]);

    // Running again on an existing table is a no-op.
    await ensureSessionTable(pool, TABLE);
  });

  it("lets a login be saved and read on a database that had no session table", async () => {
    await dropTable();
    const store = createSessionStore(pool, TABLE);
    const sess = { cookie: { maxAge: 60_000, expires: new Date(Date.now() + 60_000) }, passport: { user: 5 } } as any;

    await promisify((cb) => store.set("sid-db-test", sess, cb));
    const loaded: any = await promisify((cb) => store.get("sid-db-test", cb));
    expect(loaded?.passport?.user).toBe(5);

    await promisify((cb) => store.destroy("sid-db-test", cb));
    expect(await promisify((cb) => store.get("sid-db-test", cb))).toBeFalsy();
  });
});
