// @vitest-environment node
//
// Proves the "one lesson generation at a time per teacher" guard holds
// ACROSS SERVERS. Autoscale can run several instances, so a double-click can
// land on two different servers. Each simulated server here is a fresh copy
// of the lesson-jobs module with its own database connection pool and no
// shared memory — exactly like two separate instances.
// Runs against the real Postgres database, like lesson-job-recovery.test.ts.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { sql } from "drizzle-orm";

type LessonJobsModule = typeof import("./lesson-jobs");
type DbModule = typeof import("./db");

interface SimulatedServer {
  jobs: LessonJobsModule;
  db: DbModule;
}

async function startServer(): Promise<SimulatedServer> {
  vi.resetModules();
  const db = await import("./db");
  const jobs = await import("./lesson-jobs");
  return { jobs, db };
}

const TEACHER = 987654330; // far outside real user id range
const LIMIT = 20;

let serverA: SimulatedServer;
let serverB: SimulatedServer;

async function cleanup() {
  await serverA.db.db.execute(sql`DELETE FROM lesson_generation_jobs WHERE teacher_id = ${TEACHER}`);
  await serverA.db.db.execute(sql`DELETE FROM lesson_generation_attempts WHERE teacher_id = ${TEACHER}`);
  await serverA.db.db.execute(sql`DELETE FROM users WHERE id = ${TEACHER}`);
}

async function createTeacherWithCredits(credits: number) {
  await serverA.db.db.execute(sql`
    INSERT INTO users (id, username, password, email, free_credits_remaining)
    VALUES (${TEACHER}, ${'reserve_test_' + TEACHER}, 'not-a-real-password', ${'reserve_test_' + TEACHER + '@example.com'}, ${credits})
  `);
}

async function getCredits(): Promise<number> {
  const result = await serverA.db.db.execute(sql`
    SELECT COALESCE(free_credits_remaining, 0)::int AS credits FROM users WHERE id = ${TEACHER}
  `);
  return Number(result.rows[0]?.credits ?? -1);
}

async function countAttempts(): Promise<number> {
  const result = await serverA.db.db.execute(sql`
    SELECT count(*)::int AS n FROM lesson_generation_attempts WHERE teacher_id = ${TEACHER}
  `);
  return Number(result.rows[0].n);
}

async function backdate(jobId: string) {
  await serverA.db.db.execute(sql`
    UPDATE lesson_generation_jobs SET created_at = now() - interval '20 minutes' WHERE id = ${jobId}
  `);
}

// Each test runs several round trips to a remote database.
describe("reserveGenerationJob (cross-server duplicate-submit guard)", { timeout: 30000 }, () => {
  beforeAll(async () => {
    serverA = await startServer();
    serverB = await startServer();
    // Two genuinely separate instances: separate pools, separate module state.
    expect(serverA.db.pool).not.toBe(serverB.db.pool);
    await serverA.jobs.ensureLessonJobsTable();
  });

  beforeEach(cleanup);

  afterAll(async () => {
    await cleanup();
    await serverA.db.pool.end();
    await serverB.db.pool.end();
  });

  it("a simultaneous double submit on two servers starts exactly one job", async () => {
    const [a, b] = await Promise.all([
      serverA.jobs.reserveGenerationJob("job_reserve_test_a", TEACHER, LIMIT),
      serverB.jobs.reserveGenerationJob("job_reserve_test_b", TEACHER, LIMIT),
    ]);

    const results = [a, b];
    const reserved = results.filter((r) => r.status === "reserved");
    const duplicates = results.filter((r) => r.status === "duplicate");
    expect(reserved).toHaveLength(1);
    expect(duplicates).toHaveLength(1);

    // The loser gets the winner's jobId back so the client can poll it.
    const winnerId = a.status === "reserved" ? "job_reserve_test_a" : "job_reserve_test_b";
    expect(duplicates[0]).toEqual({ status: "duplicate", jobId: winnerId });

    // Only one job row and one rate-limit attempt were recorded.
    const rows = await serverA.db.db.execute(sql`
      SELECT id FROM lesson_generation_jobs WHERE teacher_id = ${TEACHER}
    `);
    expect(rows.rows.map((r) => r.id)).toEqual([winnerId]);
    expect(await countAttempts()).toBe(1);
  });

  it("a pending job on one server blocks a later submit on another", async () => {
    expect(await serverA.jobs.reserveGenerationJob("job_reserve_test_first", TEACHER, LIMIT))
      .toEqual({ status: "reserved" });

    const second = await serverB.jobs.reserveGenerationJob("job_reserve_test_second", TEACHER, LIMIT);

    expect(second).toEqual({ status: "duplicate", jobId: "job_reserve_test_first" });
    expect(await serverB.jobs.getPersistedJob("job_reserve_test_second")).toBeNull();
    expect(await countAttempts()).toBe(1); // the duplicate did not use up the hourly cap
  });

  it("a credit is never spent for the duplicate — only the reserved job can spend", async () => {
    await createTeacherWithCredits(2);
    await serverA.jobs.reserveGenerationJob("job_reserve_test_spend", TEACHER, LIMIT);
    await serverB.jobs.reserveGenerationJob("job_reserve_test_dup", TEACHER, LIMIT);

    // The duplicate never got a row, so a spend attempt for it rolls back.
    await expect(serverB.jobs.spendCreditForJob("job_reserve_test_dup", TEACHER)).rejects.toThrow();
    expect(await getCredits()).toBe(2);

    expect(await serverA.jobs.spendCreditForJob("job_reserve_test_spend", TEACHER)).toBe(true);
    expect(await getCredits()).toBe(1);
  });

  it("an abandoned pending job (older than ABANDONED_JOB_AGE_MS) does not block", async () => {
    await serverA.jobs.reserveGenerationJob("job_reserve_test_abandoned", TEACHER, LIMIT);
    await backdate("job_reserve_test_abandoned");

    const next = await serverB.jobs.reserveGenerationJob("job_reserve_test_after_abandoned", TEACHER, LIMIT);

    expect(next).toEqual({ status: "reserved" });
  });

  it("finished jobs do not block the next generation", async () => {
    await serverA.jobs.reserveGenerationJob("job_reserve_test_errored", TEACHER, LIMIT);
    await serverA.jobs.settleJobError("job_reserve_test_errored", TEACHER, false, "test failure");

    expect(await serverB.jobs.reserveGenerationJob("job_reserve_test_after_error", TEACHER, LIMIT))
      .toEqual({ status: "reserved" });
  });

  it("a released reservation (e.g. out of credits) frees the teacher on every server", async () => {
    await serverA.jobs.reserveGenerationJob("job_reserve_test_released", TEACHER, LIMIT);
    await serverA.jobs.releaseJobReservation("job_reserve_test_released");

    expect(await serverB.jobs.reserveGenerationJob("job_reserve_test_after_release", TEACHER, LIMIT))
      .toEqual({ status: "reserved" });
  });

  it("release never removes a job whose credit was spent", async () => {
    await createTeacherWithCredits(1);
    await serverA.jobs.reserveGenerationJob("job_reserve_test_spent", TEACHER, LIMIT);
    expect(await serverA.jobs.spendCreditForJob("job_reserve_test_spent", TEACHER)).toBe(true);

    await serverA.jobs.releaseJobReservation("job_reserve_test_spent");

    const job = await serverB.jobs.getPersistedJob("job_reserve_test_spent");
    expect(job?.status).toBe("pending");
    expect(job?.creditSpent).toBe(true);
  });

  it("enforces the hourly cap across servers", async () => {
    expect(await serverA.jobs.reserveGenerationJob("job_reserve_test_cap_1", TEACHER, 1))
      .toEqual({ status: "reserved" });
    await serverA.jobs.settleJobError("job_reserve_test_cap_1", TEACHER, false, "done");

    const capped = await serverB.jobs.reserveGenerationJob("job_reserve_test_cap_2", TEACHER, 1);

    expect(capped.status).toBe("rate_limited");
    expect(await serverB.jobs.getPersistedJob("job_reserve_test_cap_2")).toBeNull();
  });
});
