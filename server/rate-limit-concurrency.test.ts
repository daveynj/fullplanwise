// @vitest-environment node
//
// Proves the DB-backed lesson-generation rate limiter cannot overshoot the
// hourly cap under concurrent requests. Uses the same advisory-lock +
// conditional-insert pattern as tryRecordGenerationAttempt in server/routes.ts,
// run in parallel against the real Postgres database.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, pool } from "./db";
import { sql } from "drizzle-orm";

const TEST_TEACHER_ID = 987654321; // far outside real user id range
const LIMIT = 20;
const RATE_LIMIT_LOCK_NAMESPACE = 42_0001;

async function attempt(teacherId: number): Promise<boolean> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${RATE_LIMIT_LOCK_NAMESPACE}, ${teacherId})`);
    const inserted = await tx.execute(sql`
      INSERT INTO lesson_generation_attempts (teacher_id)
      SELECT ${teacherId}
      WHERE (
        SELECT count(*) FROM lesson_generation_attempts
        WHERE teacher_id = ${teacherId}
          AND attempted_at > now() - interval '1 hour'
      ) < ${LIMIT}
      RETURNING id
    `);
    return inserted.rows.length > 0;
  });
}

async function cleanup() {
  await db.execute(sql`DELETE FROM lesson_generation_attempts WHERE teacher_id = ${TEST_TEACHER_ID}`);
}

describe("lesson generation rate limiter (Postgres-backed)", () => {
  beforeAll(cleanup);
  afterAll(async () => {
    await cleanup();
    await pool.end();
  });

  it("never exceeds the cap under concurrent requests", async () => {
    // Fire 40 simultaneous attempts against a limit of 20.
    const results = await Promise.all(
      Array.from({ length: 40 }, () => attempt(TEST_TEACHER_ID)),
    );
    const accepted = results.filter(Boolean).length;
    expect(accepted).toBe(LIMIT);

    const count = await db.execute(sql`
      SELECT count(*)::int AS n FROM lesson_generation_attempts
      WHERE teacher_id = ${TEST_TEACHER_ID}
    `);
    expect(count.rows[0].n).toBe(LIMIT);

    // Once at the cap, further attempts are rejected.
    expect(await attempt(TEST_TEACHER_ID)).toBe(false);
  }, 30000);
});
