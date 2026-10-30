import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Adds the student page's columns and table (see shared/schema.ts and
 * shared/student-page.ts) to existing databases at start-up, following the
 * project's start-up DDL convention instead of drizzle push. It runs in the
 * background so start-up does not wait for the database; the API waits for it
 * (server/routes.ts) only while it is still running, because student queries
 * select the new columns.
 *
 * One-time step: when student_lessons first gains completed_at, every lesson
 * already assigned is marked done (Dave, October 2026: they were all taught).
 * Their words were added to the students' lists when they were assigned, as
 * before. Lessons assigned after this server started are left planned.
 */

const SERVER_STARTED_AT = new Date();

/** Columns added with ALTER TABLE when missing (constant SQL, never user input). */
const COLUMNS = [
  { table: "students", column: "page_token", definition: "text" },
  { table: "students", column: "page_enabled", definition: "boolean NOT NULL DEFAULT false" },
  { table: "student_vocabulary", column: "kind", definition: "text" },
  { table: "student_vocabulary", column: "practice_level", definition: "integer NOT NULL DEFAULT 0" },
  { table: "student_vocabulary", column: "next_practice_at", definition: "timestamp" },
  { table: "student_vocabulary", column: "last_practised_at", definition: "timestamp" },
] as const;

/** Postgres error code for "column already exists" (another server got there first). */
const DUPLICATE_COLUMN = "42701";

async function existingColumns(): Promise<Set<string>> {
  const result = await db.execute(sql`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name IN ('students', 'student_vocabulary', 'student_lessons')
  `);
  return new Set((result.rows as Array<{ table_name: string; column_name: string }>).map((row) => `${row.table_name}.${row.column_name}`));
}

/**
 * Adds student_lessons.completed_at and marks every earlier lesson done, in
 * one transaction, so the marking can only ever happen once.
 */
async function addCompletedAtAndMarkEarlierLessonsDone(): Promise<boolean> {
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`ALTER TABLE student_lessons ADD COLUMN completed_at timestamp`);
      const marked = await tx.execute(sql`
        UPDATE student_lessons
        SET status = 'completed', completed_at = assigned_at
        WHERE assigned_at < ${SERVER_STARTED_AT}
      `);
      console.log(`[Student page] Marked ${marked.rowCount ?? 0} earlier lesson assignments as done`);
    });
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === DUPLICATE_COLUMN) return false;
    throw error;
  }
}

/**
 * Words saved from idioms & phrasal verbs sections before kinds were recorded
 * get their kind from the lesson. The section is new (29 October 2026), so
 * only recent lessons are read. Best effort: a missing kind reads as a word.
 */
async function backfillExpressionKinds(): Promise<void> {
  try {
    const updated = await db.execute(sql`
      UPDATE student_vocabulary sv
      SET kind = x.kind
      FROM (
        SELECT l.id AS lesson_id,
          lower(btrim(i ->> 'expression')) AS expression,
          CASE WHEN lower(i ->> 'kind') IN ('phrasal verb', 'idiom', 'expression')
            THEN lower(i ->> 'kind') ELSE 'expression' END AS kind
        FROM lessons l
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(l.content::jsonb -> 'sections') = 'array'
            THEN l.content::jsonb -> 'sections' ELSE '[]'::jsonb END) s
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(s -> 'items') = 'array' THEN s -> 'items' ELSE '[]'::jsonb END) i
        WHERE l.created_at >= '2026-10-28' AND left(l.content, 1) = '{' AND s ->> 'type' = 'expressions'
      ) x
      WHERE sv.lesson_id = x.lesson_id AND sv.kind IS NULL AND lower(btrim(sv.word)) = x.expression
    `);
    if (updated.rowCount) console.log(`[Student page] Recorded the kind of ${updated.rowCount} saved idioms and phrasal verbs`);
  } catch (error) {
    console.error("[Student page] Could not record the kind of saved idioms and phrasal verbs:", error);
  }
}

async function migrate(): Promise<void> {
  const existing = await existingColumns();
  for (const { table, column, definition } of COLUMNS) {
    if (!existing.has(`${table}.${column}`)) {
      await db.execute(sql.raw(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`));
    }
  }
  if (!existing.has("student_lessons.completed_at") && (await addCompletedAtAndMarkEarlierLessonsDone())) {
    await backfillExpressionKinds();
  }
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS student_practice_log (
      id serial PRIMARY KEY,
      student_id integer NOT NULL,
      vocabulary_id integer NOT NULL,
      result text NOT NULL,
      practised_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_student_practice_log_student
    ON student_practice_log (student_id, practised_at)
  `);
  // Page codes are looked up on every student page request and must be unique.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_students_page_token
    ON students (page_token) WHERE page_token IS NOT NULL
  `);
}

let ready: Promise<void> | null = null;
let failedAt = 0;
const RETRY_AFTER_MS = 60_000;

/**
 * Starts the schema step, or returns the one already running or finished.
 * Never rejects: a failure is logged and retried after a minute, and requests
 * carry on meanwhile.
 */
export function ensureStudentPageSchema(): Promise<void> {
  if (ready) return ready;
  if (failedAt && Date.now() - failedAt < RETRY_AFTER_MS) return Promise.resolve();
  ready = migrate().catch((error) => {
    console.error("[Student page] Could not add the student page columns:", error);
    ready = null;
    failedAt = Date.now();
  });
  return ready;
}
