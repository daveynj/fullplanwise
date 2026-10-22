import { db } from "./db";
import { sql } from "drizzle-orm";
import { lessons, type InsertLesson, type Lesson } from "@shared/schema";

/**
 * Persistence layer for async lesson-generation jobs.
 *
 * The in-memory `lessonJobs` Map in routes.ts is lost on restart. If the
 * server restarts while a job is in flight, the generation never finishes and
 * the refund path never runs — the user loses a credit with no lesson. This
 * module mirrors job state to Postgres so that:
 *
 *  1. Jobs still 'pending' long after any generation could still be running
 *     were abandoned (their server died) — they are settled to 'error' and
 *     their spent credits refunded (recoverInterruptedJobs). This runs at
 *     boot and periodically.
 *  2. The poll endpoint can fall back to the persisted record when the
 *     in-memory entry is gone, including returning a lesson that completed
 *     moments before the restart.
 *
 * MULTIPLE SERVERS: autoscale can run several instances at once and start new
 * ones at any time. A job missing from THIS server's memory may be running
 * on another server, so a pending job is only treated as abandoned once it is
 * older than ABANDONED_JOB_AGE_MS. Until then it is reported as pending.
 * The same rule drives the "one generation at a time per teacher" guard
 * (reserveGenerationJob): a young pending job on ANY server blocks a new
 * start, an abandoned one does not.
 *
 * SINGLE-SETTLEMENT GUARANTEE — every job settles exactly once:
 *
 *  - Success: the lesson insert and the job's 'complete' status commit in ONE
 *    transaction (completeJobWithLesson). A crash can never leave a saved
 *    lesson behind a 'pending' job row, so recovery can never refund a credit
 *    for a lesson the user actually received.
 *  - Failure: the credit refund and the job's 'error' status commit in ONE
 *    transaction, gated by an atomic claim on the refund_applied flag
 *    (settleJobError). Runtime failure handling and boot recovery share this
 *    function, so a refund can never be applied twice — a crash mid-settle
 *    rolls everything back and the next attempt retries cleanly.
 *
 * The table is created/migrated here with plain SQL (matching the project's
 * manual-SQL convention) instead of drizzle push, which is unsafe on this
 * database.
 */

/**
 * A pending job older than this is treated as abandoned. Generation normally
 * takes well under 3 minutes (the text request times out at 60 s); the wide
 * margin makes sure no running generation on another server is cut off.
 */
export const ABANDONED_JOB_AGE_MS = 15 * 60 * 1000;

export async function ensureLessonJobsTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS lesson_generation_jobs (
      id text PRIMARY KEY,
      teacher_id integer NOT NULL,
      status text NOT NULL,
      credit_spent boolean NOT NULL DEFAULT false,
      refund_applied boolean NOT NULL DEFAULT false,
      lesson_id integer,
      error text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  // For tables created before refund_applied existed.
  await db.execute(sql`
    ALTER TABLE lesson_generation_jobs
    ADD COLUMN IF NOT EXISTS refund_applied boolean NOT NULL DEFAULT false
  `);
  // Supports the per-teacher "one pending job" lookup in reserveGenerationJob.
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS lesson_generation_jobs_teacher_status_idx
    ON lesson_generation_jobs (teacher_id, status)
  `);
}

/** Insert a pending job row directly. Used by tests to set up job state. */
export async function recordJobStart(jobId: string, teacherId: number, creditSpent: boolean): Promise<void> {
  await db.execute(sql`
    INSERT INTO lesson_generation_jobs (id, teacher_id, status, credit_spent)
    VALUES (${jobId}, ${teacherId}, 'pending', ${creditSpent})
    ON CONFLICT (id) DO NOTHING
  `);
}

// Arbitrary app-unique advisory lock class. Two-key lock (namespace,
// teacherId) serializes generation starts for one teacher across ALL servers.
const GENERATION_START_LOCK_NAMESPACE = 42_0001;

export type ReserveJobResult =
  | { status: 'reserved' }
  /** The teacher already has a live pending job (on this or any server). */
  | { status: 'duplicate'; jobId: string }
  /** Over the hourly cap; minutes until the next slot frees up. */
  | { status: 'rate_limited'; retryAfterMinutes: number };

/**
 * START GUARD — atomically decide whether a teacher may start a new
 * generation, and if so persist the job row before any credit is spent.
 *
 * Autoscale can run several servers at once, so a double-click can land on
 * two different servers. In-memory guards cannot see each other; this one
 * lives in Postgres. Inside one transaction holding a per-teacher advisory
 * lock (shared by every server):
 *
 *  1. If the teacher already has a 'pending' job younger than
 *     ABANDONED_JOB_AGE_MS, return it — nothing is recorded or spent.
 *     Older pending jobs are abandoned (their server died) and never block.
 *  2. Otherwise record a rate-limit attempt (or refuse when over the cap).
 *  3. Insert the new job as 'pending' with credit_spent = false. Spending a
 *     credit later (spendCreditForJob) flips that flag in the same
 *     transaction as the decrement.
 *
 * A second request waits on the lock until the first commits, then sees its
 * pending row — so two near-simultaneous requests can never both start.
 */
export async function reserveGenerationJob(
  jobId: string,
  teacherId: number,
  hourlyLimit: number,
  rateWindowMs: number = 60 * 60 * 1000,
): Promise<ReserveJobResult> {
  const cutoffSeconds = ABANDONED_JOB_AGE_MS / 1000;
  const windowSeconds = rateWindowMs / 1000;
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${GENERATION_START_LOCK_NAMESPACE}, ${teacherId})`);

    const existing = await tx.execute(sql`
      SELECT id FROM lesson_generation_jobs
      WHERE teacher_id = ${teacherId}
        AND status = 'pending'
        AND created_at >= now() - make_interval(secs => ${cutoffSeconds})
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const existingId = existing.rows[0]?.id as string | undefined;
    if (existingId) return { status: 'duplicate', jobId: existingId };

    const inserted = await tx.execute(sql`
      INSERT INTO lesson_generation_attempts (teacher_id)
      SELECT ${teacherId}
      WHERE (
        SELECT count(*) FROM lesson_generation_attempts
        WHERE teacher_id = ${teacherId}
          AND attempted_at > now() - make_interval(secs => ${windowSeconds})
      ) < ${hourlyLimit}
      RETURNING id
    `);
    if (inserted.rows.length === 0) {
      // Over the limit: compute when the oldest attempt in the window expires.
      const oldest = await tx.execute(sql`
        SELECT extract(epoch FROM min(attempted_at)) * 1000 AS oldest_ms
        FROM lesson_generation_attempts
        WHERE teacher_id = ${teacherId}
          AND attempted_at > now() - make_interval(secs => ${windowSeconds})
      `);
      const oldestMs = Number(oldest.rows[0]?.oldest_ms);
      const retryAfterMinutes = Number.isFinite(oldestMs)
        ? Math.max(1, Math.ceil((oldestMs + rateWindowMs - Date.now()) / 60000))
        : 1;
      return { status: 'rate_limited', retryAfterMinutes };
    }

    await tx.execute(sql`
      INSERT INTO lesson_generation_jobs (id, teacher_id, status, credit_spent)
      VALUES (${jobId}, ${teacherId}, 'pending', false)
    `);
    return { status: 'reserved' };
  });
}

/**
 * Spend one credit for a reserved job. The conditional decrement and the
 * job's credit_spent flag commit in ONE transaction, so a spent credit is
 * always visible to recovery (which refunds abandoned jobs) — a crash can
 * never strand it. Returns false (nothing spent) when the balance is zero.
 */
export async function spendCreditForJob(jobId: string, teacherId: number): Promise<boolean> {
  return db.transaction(async (tx) => {
    const decremented = await tx.execute(sql`
      UPDATE users
      SET free_credits_remaining = COALESCE(free_credits_remaining, 0) - 1
      WHERE id = ${teacherId}
        AND COALESCE(free_credits_remaining, 0) > 0
      RETURNING id
    `);
    if (decremented.rows.length === 0) return false;

    const flagged = await tx.execute(sql`
      UPDATE lesson_generation_jobs
      SET credit_spent = true
      WHERE id = ${jobId} AND status = 'pending'
      RETURNING id
    `);
    if (flagged.rows.length === 0) {
      // Without a job row recovery could never refund this spend — roll back.
      throw new Error(`Job ${jobId} is not pending; credit not spent`);
    }
    return true;
  });
}

/**
 * Release a reservation that never started generating (validation failure,
 * no credits, etc.) so the teacher is not blocked. Only removes a pending
 * row that has no spent credit — anything else must go through settlement.
 */
export async function releaseJobReservation(jobId: string): Promise<void> {
  await db.execute(sql`
    DELETE FROM lesson_generation_jobs
    WHERE id = ${jobId} AND status = 'pending' AND credit_spent = false
  `);
}

/**
 * SUCCESS SETTLEMENT — save the generated lesson AND mark the job complete in
 * a single transaction. Atomicity is the guarantee that matters: a job row
 * can never be 'pending' while its lesson exists, so boot recovery (which
 * refunds 'pending' jobs) can never issue a false refund for a delivered
 * lesson.
 */
export async function completeJobWithLesson(jobId: string, lessonData: InsertLesson): Promise<Lesson> {
  return db.transaction(async (tx) => {
    const [lesson] = await tx.insert(lessons).values(lessonData).returning();
    await tx.execute(sql`
      UPDATE lesson_generation_jobs
      SET status = 'complete', lesson_id = ${lesson.id}
      WHERE id = ${jobId}
    `);
    return lesson;
  });
}

/**
 * FAILURE SETTLEMENT — refund the spent credit AND mark the job errored in a
 * single transaction, exactly once.
 *
 * The refund is claimed atomically by flipping refund_applied in the same
 * transaction that performs the credit increment: only the first settlement
 * to win that flip refunds. If the transaction crashes anywhere, everything
 * rolls back — refund_applied stays false — and the next settlement attempt
 * (runtime retry or boot recovery) retries the whole thing cleanly.
 *
 * Returns true if this call applied the refund.
 */
export async function settleJobError(
  jobId: string,
  teacherId: number,
  creditSpent: boolean,
  message: string
): Promise<boolean> {
  // Bound the stored message — AI/provider errors can be very long.
  const bounded = (message || 'Lesson generation failed').slice(0, 2000);
  let refunded = false;
  await db.transaction(async (tx) => {
    if (creditSpent) {
      // The claim also excludes completed jobs: a lesson was delivered for
      // those, so the spent credit is earned and must never be refunded.
      const claimed = await tx.execute(sql`
        UPDATE lesson_generation_jobs
        SET refund_applied = true
        WHERE id = ${jobId}
          AND credit_spent = true
          AND refund_applied = false
          AND status <> 'complete'
        RETURNING id
      `);
      if (claimed.rows.length > 0) {
        await tx.execute(sql`
          UPDATE users
          SET free_credits_remaining = COALESCE(free_credits_remaining, 0) + 1
          WHERE id = ${teacherId}
        `);
        refunded = true;
      }
    }
    // Never downgrade a completed job — a lesson was delivered for it.
    await tx.execute(sql`
      UPDATE lesson_generation_jobs
      SET status = 'error', error = ${bounded}
      WHERE id = ${jobId} AND status <> 'complete'
    `);
  });
  return refunded;
}

export interface PersistedJob {
  id: string;
  teacherId: number;
  status: 'pending' | 'recovering' | 'complete' | 'error';
  creditSpent: boolean;
  lessonId: number | null;
  error: string | null;
  /** Older than ABANDONED_JOB_AGE_MS (computed by the database clock). */
  abandoned: boolean;
}

export async function getPersistedJob(jobId: string): Promise<PersistedJob | null> {
  const result = await db.execute(sql`
    SELECT id,
           teacher_id AS "teacherId",
           status,
           credit_spent AS "creditSpent",
           lesson_id AS "lessonId",
           error,
           created_at < now() - make_interval(secs => ${ABANDONED_JOB_AGE_MS / 1000}) AS abandoned
    FROM lesson_generation_jobs
    WHERE id = ${jobId}
  `);
  return (result.rows[0] as unknown as PersistedJob | undefined) ?? null;
}

/**
 * Refund credits for abandoned jobs (their server stopped mid-generation).
 * Returns the number of credits refunded.
 *
 * Crash-safe and retry-safe by construction:
 *
 *  1. CLAIM: one atomic UPDATE flips old 'pending' rows → 'recovering' and
 *     returns the claimed rows. Two servers recovering at once can never both
 *     claim the same job. Only jobs older than ABANDONED_JOB_AGE_MS are
 *     claimed, so a job still running on another server is never touched.
 *  2. SETTLE: each claimed job goes through settleJobError — refund + status
 *     in one transaction, guarded by refund_applied so even a job that was
 *     already refunded at runtime (but crashed before its status write)
 *     cannot be refunded twice.
 *  3. RETRY: the claim step also picks up 'recovering' rows — jobs stranded
 *     mid-recovery by a previous crash — so every abandoned job is retried on
 *     every run until its settlement commits. A spent credit can never reach
 *     a terminal state without its refund resolved.
 */
export async function recoverInterruptedJobs(): Promise<number> {
  const cutoffSeconds = ABANDONED_JOB_AGE_MS / 1000;
  const claimed = await db.execute(sql`
    UPDATE lesson_generation_jobs
    SET status = 'recovering'
    WHERE status = 'recovering'
       OR (status = 'pending' AND created_at < now() - make_interval(secs => ${cutoffSeconds}))
    RETURNING id, teacher_id AS "teacherId", credit_spent AS "creditSpent"
  `);

  let refunded = 0;
  for (const row of claimed.rows as Array<{ id: string; teacherId: number; creditSpent: boolean }>) {
    try {
      const didRefund = await settleJobError(
        row.id,
        row.teacherId,
        row.creditSpent,
        row.creditSpent
          ? 'Generation was interrupted by a server restart. Your credit has been refunded — please try again.'
          : 'Generation was interrupted by a server restart — please try again.'
      );
      if (didRefund) refunded++;
    } catch (jobError) {
      // Left in 'recovering' — the next run will retry this job.
      console.error(`Failed to recover job ${row.id} (will retry on next run):`, jobError);
    }
  }
  return refunded;
}

/**
 * Settle abandoned jobs now and then every `intervalMs`.
 *
 * Recovery is mandatory for correctness, and a job only becomes "abandoned"
 * some time after its server died, so this cannot be a one-off boot step: it
 * keeps running in the background. A failed run (e.g. the DB is briefly
 * unreachable) is simply retried on the next tick. Never blocks boot.
 */
export function startJobRecovery(intervalMs: number = 5 * 60 * 1000): void {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await ensureLessonJobsTable();
      const refunded = await recoverInterruptedJobs();
      if (refunded > 0) {
        console.log(`[Jobs] Recovered abandoned generation jobs — refunded ${refunded} credit(s)`);
      }
    } catch (recoveryError) {
      console.error("[Jobs] Job recovery failed — will retry:", recoveryError);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(run, intervalMs);
  // Don't hold the process open just for recovery.
  if (typeof timer.unref === 'function') timer.unref();
}

/** Drop finished job rows older than 24 hours; the lessons they point to live in the lessons table. */
export async function pruneOldJobs(): Promise<void> {
  await db.execute(sql`
    DELETE FROM lesson_generation_jobs
    WHERE created_at < now() - interval '24 hours'
  `);
}
