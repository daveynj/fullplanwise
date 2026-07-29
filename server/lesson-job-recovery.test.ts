// @vitest-environment node
//
// Proves recoverInterruptedJobs can never strand a spent credit — even when
// recovery ITSELF is interrupted. Simulates the three failure shapes:
//   1. a job pending when the server died mid-generation,
//   2. a job stranded in 'recovering' because the server died mid-RECOVERY,
//   3. repeated recovery runs (must not double-refund).
// Runs against the real Postgres database, like rate-limit-concurrency.test.ts.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db, pool } from "./db";
import { sql } from "drizzle-orm";
import {
  ensureLessonJobsTable,
  recordJobStart,
  recordJobStartOrRefund,
  completeJobWithLesson,
  settleJobError,
  recoverInterruptedJobs,
} from "./lesson-jobs";
import { storage } from "./storage";

const TEACHER_A = 987654322; // far outside real user id range
const TEACHER_B = 987654323;
const TEACHER_C = 987654324;

async function createTeacher(id: number, credits: number) {
  await db.execute(sql`
    INSERT INTO users (id, username, password, email, free_credits_remaining)
    VALUES (${id}, ${'recovery_test_' + id}, 'not-a-real-password', ${'recovery_test_' + id + '@example.com'}, ${credits})
    ON CONFLICT (id) DO NOTHING
  `);
}

async function getCredits(id: number): Promise<number> {
  const result = await db.execute(sql`
    SELECT COALESCE(free_credits_remaining, 0)::int AS credits FROM users WHERE id = ${id}
  `);
  return Number(result.rows[0]?.credits ?? -1);
}

async function getJobStatus(jobId: string): Promise<string | null> {
  const result = await db.execute(sql`
    SELECT status FROM lesson_generation_jobs WHERE id = ${jobId}
  `);
  return (result.rows[0]?.status as string | undefined) ?? null;
}

async function cleanup() {
  await db.execute(sql`DELETE FROM lesson_generation_jobs WHERE id LIKE 'job_recovery_test_%'`);
  await db.execute(sql`DELETE FROM lessons WHERE teacher_id IN (${TEACHER_A}, ${TEACHER_B}, ${TEACHER_C})`);
  await db.execute(sql`DELETE FROM users WHERE id IN (${TEACHER_A}, ${TEACHER_B}, ${TEACHER_C})`);
}

describe("recoverInterruptedJobs (crash-safe credit recovery)", () => {
  beforeAll(async () => {
    await ensureLessonJobsTable();
    await cleanup();
    await createTeacher(TEACHER_A, 1);
    await createTeacher(TEACHER_B, 2);
  });

  afterAll(async () => {
    await cleanup();
    await pool.end();
  });

  it("refunds a job interrupted mid-generation and finalizes it to error", async () => {
    await recordJobStart("job_recovery_test_pending", TEACHER_A, true);

    const refunded = await recoverInterruptedJobs();

    expect(refunded).toBe(1);
    expect(await getCredits(TEACHER_A)).toBe(2); // 1 → refunded back to 2
    expect(await getJobStatus("job_recovery_test_pending")).toBe("error");
  });

  it("retries jobs stranded mid-recovery by a crash during recovery itself", async () => {
    // Simulate: previous boot claimed the job ('recovering') but crashed
    // before the refund transaction committed.
    await db.execute(sql`
      INSERT INTO lesson_generation_jobs (id, teacher_id, status, credit_spent)
      VALUES ('job_recovery_test_stranded', ${TEACHER_B}, 'recovering', true)
    `);

    const refunded = await recoverInterruptedJobs();

    expect(refunded).toBe(1);
    expect(await getCredits(TEACHER_B)).toBe(3); // 2 → refunded to 3
    expect(await getJobStatus("job_recovery_test_stranded")).toBe("error");
  });

  it("is idempotent — repeated runs never double-refund", async () => {
    await recordJobStart("job_recovery_test_repeat", TEACHER_A, true);

    const first = await recoverInterruptedJobs();
    const second = await recoverInterruptedJobs();
    const third = await recoverInterruptedJobs();

    expect(first).toBe(1);
    expect(second).toBe(0);
    expect(third).toBe(0);
    expect(await getCredits(TEACHER_A)).toBe(3); // exactly one refund across all runs
  });

  it("finalizes interrupted jobs that never spent a credit without touching balances", async () => {
    await recordJobStart("job_recovery_test_nocredit", TEACHER_B, false);
    const before = await getCredits(TEACHER_B);

    await recoverInterruptedJobs();

    expect(await getCredits(TEACHER_B)).toBe(before);
    expect(await getJobStatus("job_recovery_test_nocredit")).toBe("error");
  });

  it("refunds the spent credit when job-start persistence fails (no restart can strand it)", async () => {
    // Simulates the generate-route flow: credit decremented, THEN the job
    // start write fails. The refund must happen immediately — the job row
    // never exists, so boot recovery could never see this spend.
    await createTeacher(TEACHER_C, 1);
    const spent = await storage.tryDecrementUserCredits(TEACHER_C);
    expect(spent).toBe(true);
    expect(await getCredits(TEACHER_C)).toBe(0);

    // Break persistence by renaming the jobs table away, then restore it.
    await db.execute(sql`ALTER TABLE lesson_generation_jobs RENAME TO lesson_generation_jobs_test_bak`);
    try {
      await expect(
        recordJobStartOrRefund("job_recovery_test_persist_fail", TEACHER_C, true)
      ).rejects.toThrow();

      // The credit was returned immediately — not deferred to boot recovery.
      expect(await getCredits(TEACHER_C)).toBe(1);
    } finally {
      await db.execute(sql`ALTER TABLE lesson_generation_jobs_test_bak RENAME TO lesson_generation_jobs`);
    }

    // And no phantom job row exists, so nothing is recovered or refunded later.
    expect(await getJobStatus("job_recovery_test_persist_fail")).toBeNull();
    await recoverInterruptedJobs();
    expect(await getCredits(TEACHER_C)).toBe(1);
  });

  it("never refunds a completed job — lesson insert and job completion are one transaction", async () => {
    // Crash window: lesson saved but status write lost. With atomic
    // settlement this state is impossible — prove recovery can never refund
    // a credit for a lesson the user actually received.
    await recordJobStart("job_recovery_test_completed", TEACHER_A, true);
    const creditsBefore = await getCredits(TEACHER_A);

    const lesson = await completeJobWithLesson("job_recovery_test_completed", {
      teacherId: TEACHER_A,
      title: "Recovery test lesson",
      topic: "testing",
      cefrLevel: "B1",
      content: { warmup: ["test"] },
    });

    expect(lesson.id).toBeGreaterThan(0);
    expect(await getJobStatus("job_recovery_test_completed")).toBe("complete");

    const refunded = await recoverInterruptedJobs();
    expect(refunded).toBe(0);
    expect(await getCredits(TEACHER_A)).toBe(creditsBefore);
    expect(await getJobStatus("job_recovery_test_completed")).toBe("complete");
  });

  it("never double-refunds a job already refunded at runtime", async () => {
    // Crash window: runtime refund committed but status write lost, then the
    // server restarts and recovery picks the job up. The refund_applied guard
    // must make the second settlement a no-op.
    await recordJobStart("job_recovery_test_double", TEACHER_B, true);
    const creditsBefore = await getCredits(TEACHER_B);

    const firstRefund = await settleJobError("job_recovery_test_double", TEACHER_B, true, "provider blew up");
    expect(firstRefund).toBe(true);
    expect(await getCredits(TEACHER_B)).toBe(creditsBefore + 1);

    // A second settlement of the same job (same or different caller) refunds nothing.
    const secondRefund = await settleJobError("job_recovery_test_double", TEACHER_B, true, "provider blew up");
    expect(secondRefund).toBe(false);
    expect(await getCredits(TEACHER_B)).toBe(creditsBefore + 1);

    // Boot recovery agrees: nothing more to refund, status already error.
    const recovered = await recoverInterruptedJobs();
    expect(recovered).toBe(0);
    expect(await getCredits(TEACHER_B)).toBe(creditsBefore + 1);
    expect(await getJobStatus("job_recovery_test_double")).toBe("error");
  });

  it("error settlement never downgrades a completed job", async () => {
    await recordJobStart("job_recovery_test_race", TEACHER_A, true);
    await completeJobWithLesson("job_recovery_test_race", {
      teacherId: TEACHER_A,
      title: "Recovery test race lesson",
      topic: "testing",
      cefrLevel: "A2",
      content: { warmup: ["test"] },
    });
    const creditsBefore = await getCredits(TEACHER_A);

    // A late error settle (e.g. a stray catch path) must not refund or
    // overwrite the completed state — the lesson was delivered.
    const refunded = await settleJobError("job_recovery_test_race", TEACHER_A, true, "late error");

    expect(refunded).toBe(false);
    expect(await getCredits(TEACHER_A)).toBe(creditsBefore);
    expect(await getJobStatus("job_recovery_test_race")).toBe("complete");
  });
});
