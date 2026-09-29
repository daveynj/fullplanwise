import type { Pool } from "pg";

// Indexes created with IF NOT EXISTS at server startup, following the same
// convention as ensureLessonJobsTable (no drizzle push). Safe to run on every
// boot: existing indexes are left untouched.
const INDEX_STATEMENTS = [
  // Lesson history: "this teacher's lessons, newest first" (getLessons)
  `CREATE INDEX IF NOT EXISTS idx_lessons_teacher_created ON lessons(teacher_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON lessons(teacher_id)`,
  `CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_lessons_cefr_level ON lessons(cefr_level)`,
  `CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON lessons(student_id)`,
  // Student pages: lessons and vocabulary looked up by student
  `CREATE INDEX IF NOT EXISTS idx_student_lessons_student_id ON student_lessons(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_student_lessons_lesson_id ON student_lessons(lesson_id)`,
  `CREATE INDEX IF NOT EXISTS idx_student_vocabulary_student_id ON student_vocabulary(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON students(teacher_id)`,
];

export async function ensureDatabaseIndexes(pool: Pool): Promise<void> {
  for (const statement of INDEX_STATEMENTS) {
    try {
      await pool.query(statement);
    } catch (error) {
      // Non-critical: queries still work without the index, just slower.
      console.error(`Could not ensure index (${statement}):`, error);
    }
  }
}
